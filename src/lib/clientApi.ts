import CryptoJS from 'crypto-js';

const AES_KEY = '4%w!KpB+?FC<P9W*';
const BASE_PATH = '/countryle-helper';

// Decrypt country ID from Countryle API
export function decryptCountryId(encryptedId: string): number {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedId, AES_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return parseInt(decrypted, 10);
  } catch (error) {
    console.error('Failed to decrypt country ID:', error);
    return -1;
  }
}

// Get current date in IST format
export function getDateIST(): { date: string; gameNumber: number } {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  const day = String(istTime.getDate()).padStart(2, '0');
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const year = istTime.getFullYear();
  
  const dateStr = `${day}/${month}/${year}`;
  const refDate = new Date('2022-11-15');
  const gameNumber = Math.floor((istTime.getTime() - refDate.getTime()) / (24 * 60 * 60 * 1000));
  
  return { date: dateStr, gameNumber };
}

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
  const { date, gameNumber } = getDateIST();
  
  try {
    // Load the pre-computed answer with complete country data
    const response = await fetch(`${BASE_PATH}/todays-answer.json`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Check if it's today's answer and has complete country data
      if (data.date === date && data.country) {
        return {
          success: true,
          date: data.date,
          gameNumber: data.gameNumber,
          country: data.country as CountryData,
        };
      }
      
      // If date doesn't match, the answer is stale
      if (data.date !== date) {
        return {
          success: false,
          date,
          gameNumber,
          country: null,
          error: 'Answer data is outdated. Please refresh.',
        };
      }
    }
    
    // Fallback if todays-answer.json fails
    return {
      success: false,
      date,
      gameNumber,
      country: null,
      error: 'Failed to load today\'s answer',
    };
  } catch (error) {
    console.error('Error fetching today country:', error);
    return {
      success: false,
      date,
      gameNumber,
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

// Generate clues for solver
export function generateClues(guess: CountryData, answer: CountryData) {
  const clues = [];
  
  // Continent
  clues.push({
    property: 'Continent',
    guessValue: guess.continent,
    answerValue: answer.continent,
    result: guess.continent === answer.continent ? 'Correct!' : 'Different',
    isCorrect: guess.continent === answer.continent,
  });
  
  // Hemisphere
  clues.push({
    property: 'Hemisphere',
    guessValue: guess.hemisphere,
    answerValue: answer.hemisphere,
    result: guess.hemisphere === answer.hemisphere ? 'Correct!' : 'Different',
    isCorrect: guess.hemisphere === answer.hemisphere,
  });
  
  // Population
  const popDiff = guess.population - answer.population;
  const popPct = Math.abs(popDiff / (answer.population || 1));
  clues.push({
    property: 'Population',
    guessValue: guess.population.toLocaleString(),
    answerValue: answer.population.toLocaleString(),
    result: popPct < 0.01 ? 'Correct!' : popDiff > 0 ? 'Answer is less' : 'Answer is more',
    isCorrect: popPct < 0.01,
  });
  
  // Surface
  const surfDiff = guess.surface - answer.surface;
  const surfPct = Math.abs(surfDiff / (answer.surface || 1));
  clues.push({
    property: 'Surface Area',
    guessValue: `${guess.surface.toLocaleString()} km²`,
    answerValue: `${answer.surface.toLocaleString()} km²`,
    result: surfPct < 0.01 ? 'Correct!' : surfDiff > 0 ? 'Answer is less' : 'Answer is more',
    isCorrect: surfPct < 0.01,
  });
  
  // Temperature
  const tempDiff = guess.avgTemperature - answer.avgTemperature;
  const tempPct = Math.abs(tempDiff / (answer.avgTemperature || 1));
  clues.push({
    property: 'Temperature',
    guessValue: `${guess.avgTemperature.toFixed(1)}°C`,
    answerValue: `${answer.avgTemperature.toFixed(1)}°C`,
    result: tempPct < 0.01 ? 'Correct!' : tempDiff > 0 ? 'Answer is less' : 'Answer is more',
    isCorrect: tempPct < 0.01,
  });
  
  // Direction
  const guessCoords = parseCoordinates(guess.coordinates);
  const answerCoords = parseCoordinates(answer.coordinates);
  const direction = getDirection(guessCoords, answerCoords);
  clues.push({
    property: 'Direction',
    guessValue: `(${guessCoords.lat.toFixed(2)}, ${guessCoords.lng.toFixed(2)})`,
    answerValue: direction,
    result: direction,
    isCorrect: direction === 'Same location area',
  });
  
  return clues;
}

function parseCoordinates(coords: string): { lat: number; lng: number } {
  const parts = coords.split(',').map(p => parseFloat(p.trim()));
  return { lat: parts[0] || 0, lng: parts[1] || 0 };
}

function getDirection(guess: { lat: number; lng: number }, answer: { lat: number; lng: number }): string {
  const directions: string[] = [];
  
  if (Math.abs(guess.lat - answer.lat) >= 5) {
    directions.push(guess.lat > answer.lat ? 'South' : 'North');
  }
  
  if (Math.abs(guess.lng - answer.lng) >= 5) {
    directions.push(guess.lng > answer.lng ? 'West' : 'East');
  }
  
  return directions.length === 0 ? 'Same location area' : `Go ${directions.join('')}`;
}
