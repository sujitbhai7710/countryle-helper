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
  density?: number;
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

// Difference types - matches Countryle's L1 enum
export type DiffType = 'LESS' | 'LITTLE_LESS' | 'EQUAL' | 'LITTLE_MORE' | 'MORE' | 'DIFFERENT';

// Coordinate direction type
export type DirectionType = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'EQUAL';

// Temperature difference - EXACT Countryle formula
// getTemperatureDiff(e,i){
//   return Number(e)-Number(i)>3?L1.LESS:      // guessed hotter -> target is colder
//         Number(e)-Number(i)>1?L1.LITTLE_LESS:
//         Number(i)-Number(e)>3?L1.MORE:       // guessed colder -> target is hotter
//         Number(i)-Number(e)>1?L1.LITTLE_MORE:
//         L1.EQUAL
// }
export function getTemperatureDiff(guessedTemp: number, targetTemp: number): DiffType {
  const diff = guessedTemp - targetTemp;
  if (diff > 3) return 'LESS';        // Guessed hotter → target is colder (show down arrow)
  if (diff > 1) return 'LITTLE_LESS';
  if (-diff > 3) return 'MORE';       // Guessed colder → target is hotter (show up arrow)
  if (-diff > 1) return 'LITTLE_MORE';
  return 'EQUAL';
}

// Population difference - EXACT Countryle formula (percentage-based)
// getPercentageDiff(e,i,r,a) with r=5 (closeThreshold), a=15 (farThreshold)
export function getPopulationDiff(guessedPop: number, targetPop: number): DiffType {
  const closeThreshold = 5;
  const farThreshold = 15;
  
  const lowerClose = targetPop * (1 - closeThreshold / 100);
  const upperClose = targetPop * (1 + closeThreshold / 100);
  const lowerFar = targetPop * (1 - farThreshold / 100);
  const upperFar = targetPop * (1 + farThreshold / 100);
  
  if (guessedPop > upperFar) return 'LESS';        // Guessed more pop → target has less
  if (guessedPop > upperClose) return 'LITTLE_LESS';
  if (guessedPop < lowerFar) return 'MORE';        // Guessed less pop → target has more
  if (guessedPop < lowerClose) return 'LITTLE_MORE';
  return 'EQUAL';
}

// Surface area difference - same formula as population (percentage-based)
export function getSurfaceDiff(guessedSurface: number, targetSurface: number): DiffType {
  const closeThreshold = 5;
  const farThreshold = 15;
  
  const lowerClose = targetSurface * (1 - closeThreshold / 100);
  const upperClose = targetSurface * (1 + closeThreshold / 100);
  const lowerFar = targetSurface * (1 - farThreshold / 100);
  const upperFar = targetSurface * (1 + farThreshold / 100);
  
  if (guessedSurface > upperFar) return 'LESS';
  if (guessedSurface > upperClose) return 'LITTLE_LESS';
  if (guessedSurface < lowerFar) return 'MORE';
  if (guessedSurface < lowerClose) return 'LITTLE_MORE';
  return 'EQUAL';
}

// Rhumb line bearing calculation - EXACT Countryle formula
// Used to calculate direction from one coordinate to another
export function getRhumbLineBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const dPhi = Math.log(Math.tan(Math.PI / 4 + lat2Rad / 2) / Math.tan(Math.PI / 4 + lat1Rad / 2));
  
  let bearing = Math.atan2(dLon, dPhi) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
}

// Direction from bearing - EXACT Countryle formula
// getCoordinatesDiff uses bearing ranges
export function getDirectionFromBearing(bearing: number, sameCoords: boolean = false): DirectionType {
  if (sameCoords) return 'EQUAL';
  
  if (bearing >= 337.5 || bearing < 22.5) return 'N';
  if (bearing >= 22.5 && bearing < 67.5) return 'NE';
  if (bearing >= 67.5 && bearing < 112.5) return 'E';
  if (bearing >= 112.5 && bearing < 157.5) return 'SE';
  if (bearing >= 157.5 && bearing < 202.5) return 'S';
  if (bearing >= 202.5 && bearing < 247.5) return 'SW';
  if (bearing >= 247.5 && bearing < 292.5) return 'W';
  if (bearing >= 292.5 && bearing < 337.5) return 'NW';
  return 'EQUAL';
}

// Calculate direction from one country to another
export function calculateDirection(coord1: string, coord2: string): DirectionType {
  const [lat1, lon1] = coord1.split(',').map(Number);
  const [lat2, lon2] = coord2.split(',').map(Number);
  
  if (lat1 === lat2 && lon1 === lon2) return 'EQUAL';
  
  const bearing = getRhumbLineBearing(lat1, lon1, lat2, lon2);
  return getDirectionFromBearing(bearing);
}

// Hemisphere difference
export function getHemisphereDiff(guessed: string, target: string): DiffType {
  return guessed === target ? 'EQUAL' : 'DIFFERENT';
}

// Continent match
export function getContinentHit(guessed: string, target: string): boolean {
  return guessed === target;
}

// Direction display mapping
export const directionLabels: Record<DirectionType, string> = {
  'N': '⬆️ N',
  'NE': '↗️ NE',
  'E': '➡️ E',
  'SE': '↘️ SE',
  'S': '⬇️ S',
  'SW': '↙️ SW',
  'W': '⬅️ W',
  'NW': '↖️ NW',
  'EQUAL': '🎯',
};

export const directionOptions: DirectionType[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// ========== HINT TYPES ==========

export interface CountryHint {
  id: string;
  country: CountryData;
  // The 5 main Countryle hints
  hemisphereDiff: DiffType;      // EQUAL or DIFFERENT
  continentHit: boolean;          // true or false
  avgTemperatureDiff: DiffType;  // MORE, LITTLE_MORE, EQUAL, LITTLE_LESS, LESS
  populationDiff: DiffType;       // MORE, LITTLE_MORE, EQUAL, LITTLE_LESS, LESS
  coordinatesDiff: DirectionType; // N, NE, E, SE, S, SW, W, NW, EQUAL
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

      // 1. Check hemisphere (must match exactly)
      const expectedHemDiff = getHemisphereDiff(hint.country.hemisphere, candidate.hemisphere);
      if (expectedHemDiff !== hint.hemisphereDiff) {
        matchesAll = false;
        break;
      }
      hintScore += 20;

      // 2. Check continent (must match exactly)
      const expectedContHit = getContinentHit(hint.country.continent, candidate.continent);
      if (expectedContHit !== hint.continentHit) {
        matchesAll = false;
        break;
      }
      hintScore += 20;

      // 3. Check temperature (must match exactly)
      const expectedTempDiff = getTemperatureDiff(hint.country.avgTemperature, candidate.avgTemperature);
      if (expectedTempDiff !== hint.avgTemperatureDiff) {
        matchesAll = false;
        break;
      }
      hintScore += 20;

      // 4. Check population (must match exactly)
      const expectedPopDiff = getPopulationDiff(hint.country.population, candidate.population);
      if (expectedPopDiff !== hint.populationDiff) {
        matchesAll = false;
        break;
      }
      hintScore += 20;

      // 5. Check direction (allow adjacent directions for some tolerance)
      const expectedDir = calculateDirection(hint.country.coordinates, candidate.coordinates);
      const directions: DirectionType[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const hintIdx = directions.indexOf(hint.coordinatesDiff);
      const actualIdx = directions.indexOf(expectedDir);
      const dirDiff = Math.min(Math.abs(hintIdx - actualIdx), 8 - Math.abs(hintIdx - actualIdx));
      
      if (dirDiff > 1) { // Allow 1 step deviation (adjacent directions)
        matchesAll = false;
        break;
      }
      hintScore += dirDiff === 0 ? 20 : 10;

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

// Format temperature
export function formatTemperature(temp: number): string {
  return `${temp.toFixed(1)}°C`;
}
