import CryptoJS from 'crypto-js';

const AES_KEY = '4%w!KpB+?FC<P9W*';

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

// Load countries from static JSON
let countriesCache: CountryData[] | null = null;

async function loadCountries(): Promise<CountryData[]> {
  if (countriesCache) return countriesCache;
  
  try {
    const response = await fetch('/countries.json');
    const data = await response.json();
    countriesCache = (data.countries || []) as CountryData[];
    return countriesCache;
  } catch (error) {
    console.error('Failed to load countries:', error);
    return [];
  }
}

// Fetch today's country from Countryle API
export async function fetchTodayCountry(): Promise<{
  success: boolean;
  date: string;
  gameNumber: number;
  country: CountryData | null;
  error?: string;
}> {
  const { date, gameNumber } = getDateIST();
  
  try {
    const response = await fetch(
      `https://www.countryle.com/hidden-api/get-daily-country-valid.php?date=${date}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    const encryptedId = data.country || data.id || data;
    
    let countryId: number;
    if (typeof encryptedId === 'string') {
      countryId = decryptCountryId(encryptedId);
    } else {
      countryId = parseInt(encryptedId, 10);
    }
    
    // Fetch country details from our static data
    const country = await getCountryById(countryId);
    
    if (!country) {
      return {
        success: false,
        date,
        gameNumber,
        country: null,
        error: 'Country not found in database',
      };
    }
    
    return {
      success: true,
      date,
      gameNumber,
      country,
    };
  } catch (error) {
    console.error('Error fetching today country:', error);
    
    // Return fallback
    const countries = await loadCountries();
    const fallbackCountry = countries[0];
    
    return {
      success: true,
      date,
      gameNumber,
      country: fallbackCountry || null,
      error: 'Using fallback data',
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
