import CryptoJS from 'crypto-js';

const AES_KEY = '4%w!KpB+?FC<P9W*';
const BASE_PATH = '/countryle-helper';

// Country data type
export interface CountryData {
  id: number;
  country: string;
  continent: string;
  hemisphere: string;
  population: number;
  surface: number;
  avgTemperature: number;
  coordinates: string;
  mapsUrl?: string;
}

// Cached countries data
let countriesCache: CountryData[] | null = null;
let countriesPromise: Promise<CountryData[]> | null = null;

// Load countries from static JSON (only needed for Solver/Archive)
export async function loadCountries(): Promise<CountryData[]> {
  if (countriesCache) return countriesCache;
  if (countriesPromise) return countriesPromise;
  
  countriesPromise = (async () => {
    try {
      const response = await fetch(`${BASE_PATH}/countries.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      countriesCache = (data.countries || []) as CountryData[];
      return countriesCache;
    } catch (error) {
      console.error('Failed to load countries:', error);
      return [];
    }
  })();
  
  return countriesPromise;
}

// Fetch today's country - FAST: loads pre-computed answer with full country data
export async function fetchTodayCountry(): Promise<{
  success: boolean;
  date: string;
  gameNumber: number;
  country: CountryData | null;
  error?: string;
}> {
  try {
    // Load the pre-computed answer with complete country data
    const response = await fetch(`${BASE_PATH}/todays-answer.json?t=${Date.now()}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // If we have complete country data, show it
      if (data.country) {
        return {
          success: true,
          date: data.date,
          gameNumber: data.gameNumber,
          country: data.country as CountryData,
        };
      }
    }
    
    // Fallback if todays-answer.json fails
    return {
      success: false,
      date: '',
      gameNumber: 0,
      country: null,
      error: 'Failed to load today\'s answer',
    };
  } catch (error) {
    console.error('Error fetching today country:', error);
    return {
      success: false,
      date: '',
      gameNumber: 0,
      country: null,
      error: 'Failed to connect',
    };
  }
}

export async function getCountryById(id: number): Promise<CountryData | null> {
  const countries = await loadCountries();
  return countries.find(c => c.id === id) || null;
}

export async function getCountryByName(name: string): Promise<CountryData | null> {
  const countries = await loadCountries();
  return countries.find(c => c.country.toLowerCase() === name.toLowerCase()) || null;
}

export async function getAllCountries(): Promise<CountryData[]> {
  return loadCountries();
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(coord1: string, coord2: string): number {
  const [lat1, lon1] = coord1.split(',').map(Number);
  const [lat2, lon2] = coord2.split(',').map(Number);
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// Calculate direction from one coordinate to another
export function calculateDirection(coord1: string, coord2: string): string {
  const [lat1, lon1] = coord1.split(',').map(Number);
  const [lat2, lon2] = coord2.split(',').map(Number);
  
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  
  // Calculate angle
  const angle = Math.atan2(dLon, dLat) * 180 / Math.PI;
  
  // Convert to compass direction
  if (angle >= -22.5 && angle < 22.5) return 'N';
  if (angle >= 22.5 && angle < 67.5) return 'NE';
  if (angle >= 67.5 && angle < 112.5) return 'E';
  if (angle >= 112.5 && angle < 157.5) return 'SE';
  if (angle >= 157.5 || angle < -157.5) return 'S';
  if (angle >= -157.5 && angle < -112.5) return 'SW';
  if (angle >= -112.5 && angle < -67.5) return 'W';
  if (angle >= -67.5 && angle < -22.5) return 'NW';
  return 'N';
}

// Direction arrow mapping
export const directionArrows: Record<string, string> = {
  'N': '⬆️ N',
  'NE': '↗️ NE',
  'E': '➡️ E',
  'SE': '↘️ SE',
  'S': '⬇️ S',
  'SW': '↙️ SW',
  'W': '⬅️ W',
  'NW': '↖️ NW',
};

// Filter countries based on hints
export interface Hint {
  id: string;
  country: CountryData;
  distance: number;
  direction: string;
  proximity?: number;
}

export function filterCountriesByHints(
  allCountries: CountryData[],
  hints: Hint[]
): { country: CountryData; score: number }[] {
  if (hints.length === 0) {
    return allCountries.map(c => ({ country: c, score: 0 }));
  }

  const results: { country: CountryData; score: number }[] = [];

  for (const candidate of allCountries) {
    let totalScore = 0;
    let matchesAll = true;

    for (const hint of hints) {
      // Calculate actual distance and direction from hint country to candidate
      const actualDistance = calculateDistance(hint.country.coordinates, candidate.coordinates);
      const actualDirection = calculateDirection(hint.country.coordinates, candidate.coordinates);

      // Check distance (allow 10% tolerance)
      const distanceDiff = Math.abs(actualDistance - hint.distance);
      const distanceTolerance = hint.distance * 0.15; // 15% tolerance
      const distanceMatch = distanceDiff <= distanceTolerance;

      // Check direction (allow adjacent directions)
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const hintDirIndex = directions.indexOf(hint.direction);
      const actualDirIndex = directions.indexOf(actualDirection);
      const dirDiff = Math.min(
        Math.abs(hintDirIndex - actualDirIndex),
        8 - Math.abs(hintDirIndex - actualDirIndex)
      );
      const directionMatch = dirDiff <= 1; // Allow 1 step difference

      if (!distanceMatch && !directionMatch) {
        matchesAll = false;
        break;
      }

      // Calculate score
      if (distanceMatch) {
        totalScore += 100 - (distanceDiff / distanceTolerance) * 50;
      }
      if (directionMatch) {
        totalScore += 100 - dirDiff * 25;
      }
    }

    if (matchesAll) {
      results.push({ country: candidate, score: totalScore / hints.length });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}
