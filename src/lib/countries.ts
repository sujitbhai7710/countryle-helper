import fs from 'fs';
import path from 'path';

export interface Country {
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

export interface CountriesData {
  updatedDate: string;
  countries: Country[];
}

let cachedCountries: CountriesData | null = null;

export function getCountriesData(): CountriesData {
  if (cachedCountries) {
    return cachedCountries;
  }
  
  try {
    const countriesPath = path.join(process.cwd(), 'countries.json');
    
    if (!fs.existsSync(countriesPath)) {
      console.error('Countries file not found at:', countriesPath);
      return { updatedDate: '', countries: [] };
    }
    
    const fileContent = fs.readFileSync(countriesPath, 'utf-8');
    const data: CountriesData = JSON.parse(fileContent);
    
    if (!data || !data.countries || !Array.isArray(data.countries)) {
      console.error('Invalid countries data structure');
      return { updatedDate: '', countries: [] };
    }
    
    cachedCountries = data;
    return cachedCountries;
  } catch (error) {
    console.error('Error loading countries data:', error);
    return { updatedDate: '', countries: [] };
  }
}

export function getCountryById(id: number): Country | null {
  const data = getCountriesData();
  return data.countries.find(c => c.id === id) || null;
}

export function getCountryByName(name: string): Country | null {
  const data = getCountriesData();
  return data.countries.find(c => c.country.toLowerCase() === name.toLowerCase()) || null;
}

export function getAllCountries(): Country[] {
  const data = getCountriesData();
  return data.countries;
}

export function parseCoordinates(coords: string): { lat: number; lng: number } {
  const parts = coords.split(',').map(p => parseFloat(p.trim()));
  return { lat: parts[0] || 0, lng: parts[1] || 0 };
}

export type ComparisonResult = 'EQUAL' | 'MORE' | 'LESS' | 'LITTLE_MORE' | 'LITTLE_LESS';

export function compareValues(guessValue: number, answerValue: number, threshold: number = 0.1): ComparisonResult {
  const diff = guessValue - answerValue;
  const percentageDiff = Math.abs(diff / (answerValue || 1));
  
  if (percentageDiff < 0.01) {
    return 'EQUAL';
  }
  
  if (diff > 0) {
    if (percentageDiff <= threshold) {
      return 'LITTLE_MORE';
    }
    return 'MORE';
  } else {
    if (percentageDiff <= threshold) {
      return 'LITTLE_LESS';
    }
    return 'LESS';
  }
}

export function getDirection(guessCoords: { lat: number; lng: number }, answerCoords: { lat: number; lng: number }): string {
  const directions: string[] = [];
  
  if (Math.abs(guessCoords.lat - answerCoords.lat) < 5) {
    // Same latitude region
  } else if (guessCoords.lat > answerCoords.lat) {
    directions.push('South');
  } else {
    directions.push('North');
  }
  
  if (Math.abs(guessCoords.lng - answerCoords.lng) < 5) {
    // Same longitude region
  } else if (guessCoords.lng > answerCoords.lng) {
    directions.push('West');
  } else {
    directions.push('East');
  }
  
  if (directions.length === 0) {
    return 'Same location area';
  }
  
  return `Go ${directions.join('')}`;
}

export interface GameClue {
  property: string;
  guessValue: string | number;
  answerValue: string | number;
  result: string;
  isCorrect: boolean;
}

export function generateClues(guess: Country, answer: Country): GameClue[] {
  const clues: GameClue[] = [];
  
  // Continent
  clues.push({
    property: 'Continent',
    guessValue: guess.continent,
    answerValue: answer.continent,
    result: guess.continent === answer.continent ? 'Correct!' : 'Different',
    isCorrect: guess.continent === answer.continent
  });
  
  // Hemisphere
  clues.push({
    property: 'Hemisphere',
    guessValue: guess.hemisphere,
    answerValue: answer.hemisphere,
    result: guess.hemisphere === answer.hemisphere ? 'Correct!' : 'Different',
    isCorrect: guess.hemisphere === answer.hemisphere
  });
  
  // Population
  const popComparison = compareValues(guess.population, answer.population);
  clues.push({
    property: 'Population',
    guessValue: guess.population.toLocaleString(),
    answerValue: answer.population.toLocaleString(),
    result: popComparison === 'EQUAL' ? 'Correct!' : `Answer is ${popComparison.toLowerCase().replace('_', ' ')}`,
    isCorrect: popComparison === 'EQUAL'
  });
  
  // Surface Area
  const surfaceComparison = compareValues(guess.surface, answer.surface);
  clues.push({
    property: 'Surface Area',
    guessValue: `${guess.surface.toLocaleString()} km²`,
    answerValue: `${answer.surface.toLocaleString()} km²`,
    result: surfaceComparison === 'EQUAL' ? 'Correct!' : `Answer is ${surfaceComparison.toLowerCase().replace('_', ' ')}`,
    isCorrect: surfaceComparison === 'EQUAL'
  });
  
  // Temperature
  const tempComparison = compareValues(guess.avgTemperature, answer.avgTemperature, 0.15);
  clues.push({
    property: 'Temperature',
    guessValue: `${guess.avgTemperature.toFixed(1)}°C`,
    answerValue: `${answer.avgTemperature.toFixed(1)}°C`,
    result: tempComparison === 'EQUAL' ? 'Correct!' : `Answer is ${tempComparison.toLowerCase().replace('_', ' ')}`,
    isCorrect: tempComparison === 'EQUAL'
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
    isCorrect: direction === 'Same location area'
  });
  
  return clues;
}
