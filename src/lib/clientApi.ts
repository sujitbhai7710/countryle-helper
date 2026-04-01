import CryptoJS from 'crypto-js';

const AES_KEY = '4%w!KpB+?FC<P9W*';
const BASE_PATH = '/countryle-helper';

// Country data type - matches Countryle data structure
export interface CountryData {
  id: number;
  country: string;
  continent: string;
  hemisphere: string;
  population: number;
  surface: number;
  avgTemperature: number;
  coordinates: string;
  percentOfRenewableE?: number;
  co2Total?: number;
  coastlineLength?: number;
  maxAltitude?: number;
  PIB?: number;
  rankingFifa?: number;
  footballMatches?: number;
  mapsUrl?: string;
}

// Cached countries data
let countriesCache: CountryData[] | null = null;
let countriesPromise: Promise<CountryData[]> | null = null;

// Load countries from static JSON
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

// Fetch today's country
export async function fetchTodayCountry(): Promise<{
  success: boolean;
  date: string;
  gameNumber: number;
  country: CountryData | null;
  error?: string;
}> {
  try {
    const response = await fetch(`${BASE_PATH}/todays-answer.json?t=${Date.now()}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.country) {
        return {
          success: true,
          date: data.date,
          gameNumber: data.gameNumber,
          country: data.country as CountryData,
        };
      }
    }
    
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

// ========== COMPARISON LOGIC (Matches Countryle exactly) ==========

// Difference types
export type DiffType = 'LESS' | 'LITTLE_LESS' | 'EQUAL' | 'LITTLE_MORE' | 'MORE' | 'DIFFERENT';

// Get percentage difference (for population, temperature, surface, PIB, co2, coastline, altitude)
// Thresholds: closeThreshold=5%, farThreshold=15%
export function getPercentageDiff(guessedValue: number, targetValue: number, closeThreshold = 5, farThreshold = 15): DiffType {
  const lowerClose = targetValue * (1 - closeThreshold / 100);
  const upperClose = targetValue * (1 + closeThreshold / 100);
  const lowerFar = targetValue * (1 - farThreshold / 100);
  const upperFar = targetValue * (1 + farThreshold / 100);
  
  if (guessedValue > upperFar) return 'LESS';       // Guessed much more than target
  if (guessedValue > upperClose) return 'LITTLE_LESS'; // Guessed a bit more
  if (guessedValue < lowerFar) return 'MORE';       // Guessed much less
  if (guessedValue < lowerClose) return 'LITTLE_MORE'; // Guessed a bit less
  return 'EQUAL';
}

// Get number difference (for renewable energy, FIFA ranking, football matches)
export function getNumberDiff(guessedValue: number, targetValue: number, closeThreshold: number, farThreshold: number): DiffType {
  if (guessedValue > targetValue + farThreshold) return 'LESS';
  if (guessedValue > targetValue + closeThreshold) return 'LITTLE_LESS';
  if (guessedValue < targetValue - farThreshold) return 'MORE';
  if (guessedValue < targetValue - closeThreshold) return 'LITTLE_MORE';
  return 'EQUAL';
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

// Calculate direction from one coordinate to another (rhumb line bearing)
export function calculateDirection(coord1: string, coord2: string): string {
  const [lat1, lon1] = coord1.split(',').map(Number);
  const [lat2, lon2] = coord2.split(',').map(Number);
  
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  
  const angle = Math.atan2(dLon, dLat) * 180 / Math.PI;
  
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

// ========== HINT TYPES ==========

export interface CountryHint {
  id: string;
  country: CountryData;
  distance: number;
  direction: string;
  // Difference hints
  populationDiff?: DiffType;
  avgTemperatureDiff?: DiffType;
  surfaceDiff?: DiffType;
  hemisphereDiff?: DiffType;
  continentHit?: boolean;
}

// ========== FILTERING LOGIC ==========

export function filterCountriesByHints(
  allCountries: CountryData[],
  hints: CountryHint[]
): { country: CountryData; score: number }[] {
  if (hints.length === 0) {
    return allCountries.map(c => ({ country: c, score: 0 }));
  }

  const results: { country: CountryData; score: number }[] = [];

  for (const candidate of allCountries) {
    let totalScore = 0;
    let matchesAll = true;

    for (const hint of hints) {
      let hintScore = 0;
      
      // Check distance (allow 15% tolerance)
      const actualDistance = calculateDistance(hint.country.coordinates, candidate.coordinates);
      const distanceTolerance = hint.distance * 0.15;
      const distanceDiff = Math.abs(actualDistance - hint.distance);
      const distanceMatch = distanceDiff <= distanceTolerance;

      // Check direction (allow adjacent directions)
      const actualDirection = calculateDirection(hint.country.coordinates, candidate.coordinates);
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const hintDirIndex = directions.indexOf(hint.direction);
      const actualDirIndex = directions.indexOf(actualDirection);
      const dirDiff = Math.min(
        Math.abs(hintDirIndex - actualDirIndex),
        8 - Math.abs(hintDirIndex - actualDirIndex)
      );
      const directionMatch = dirDiff <= 1;

      // If we only have distance/direction
      if (!hint.populationDiff && !hint.avgTemperatureDiff) {
        if (!distanceMatch && !directionMatch) {
          matchesAll = false;
          break;
        }
        if (distanceMatch) hintScore += 50;
        if (directionMatch) hintScore += 50;
      } else {
        // Check population diff
        if (hint.populationDiff) {
          const expectedDiff = getPercentageDiff(hint.country.population, candidate.population);
          if (expectedDiff !== hint.populationDiff) {
            matchesAll = false;
            break;
          }
          hintScore += 20;
        }

        // Check temperature diff
        if (hint.avgTemperatureDiff) {
          const expectedDiff = getPercentageDiff(hint.country.avgTemperature, candidate.avgTemperature);
          if (expectedDiff !== hint.avgTemperatureDiff) {
            matchesAll = false;
            break;
          }
          hintScore += 20;
        }

        // Check surface diff
        if (hint.surfaceDiff) {
          const expectedDiff = getPercentageDiff(hint.country.surface, candidate.surface);
          if (expectedDiff !== hint.surfaceDiff) {
            matchesAll = false;
            break;
          }
          hintScore += 15;
        }

        // Check hemisphere
        if (hint.hemisphereDiff) {
          const expectedDiff = hint.country.hemisphere === candidate.hemisphere ? 'EQUAL' : 'DIFFERENT';
          if (expectedDiff !== hint.hemisphereDiff) {
            matchesAll = false;
            break;
          }
          hintScore += 10;
        }

        // Check continent
        if (hint.continentHit !== undefined) {
          const hit = hint.country.continent === candidate.continent;
          if (hit !== hint.continentHit) {
            matchesAll = false;
            break;
          }
          hintScore += 15;
        }

        // Distance and direction
        if (distanceMatch) hintScore += 10;
        if (directionMatch) hintScore += 10;
      }

      totalScore += hintScore;
    }

    if (matchesAll) {
      results.push({ country: candidate, score: totalScore / hints.length });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// Format number with K/M/B suffixes
export function formatPopulation(num: number): string {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
