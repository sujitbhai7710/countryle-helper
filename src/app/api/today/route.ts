import { NextResponse } from 'next/server';
import { getCountryById, getAllCountries } from '@/lib/countries';
import { decryptCountryId } from '@/lib/crypto';

// Helper to get current date in IST (UTC+5:30)
function getDateIST(): { date: string; gameNumber: number } {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  const day = String(istTime.getDate()).padStart(2, '0');
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const year = istTime.getFullYear();
  
  const dateStr = `${day}/${month}/${year}`;
  
  // Calculate game number based on days since a reference date
  const refDate = new Date('2022-11-15');
  const gameNumber = Math.floor((istTime.getTime() - refDate.getTime()) / (24 * 60 * 60 * 1000));
  
  return { date: dateStr, gameNumber };
}

export async function GET() {
  try {
    const { date, gameNumber } = getDateIST();
    
    // Fetch the daily answer from the Countryle API
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
    
    // The API returns an encrypted country ID
    const encryptedId = data.country || data.id || data;
    
    // Decrypt the country ID
    let countryId: number;
    if (typeof encryptedId === 'string') {
      countryId = decryptCountryId(encryptedId);
    } else {
      countryId = parseInt(encryptedId, 10);
    }
    
    // Get the country details
    const country = getCountryById(countryId);
    
    if (!country) {
      // If we can't find the country, try to return a fallback
      const countries = getAllCountries();
      const fallbackCountry = countries[Math.floor(Math.random() * countries.length)];
      
      return NextResponse.json({
        success: true,
        date,
        gameNumber,
        country: {
          id: fallbackCountry.id,
          name: fallbackCountry.country,
          continent: fallbackCountry.continent,
          hemisphere: fallbackCountry.hemisphere,
          population: fallbackCountry.population,
          surface: fallbackCountry.surface,
          avgTemperature: fallbackCountry.avgTemperature,
          coordinates: fallbackCountry.coordinates
        },
        note: 'Using fallback - original country not found'
      });
    }
    
    return NextResponse.json({
      success: true,
      date,
      gameNumber,
      country: {
        id: country.id,
        name: country.country,
        continent: country.continent,
        hemisphere: country.hemisphere,
        population: country.population,
        surface: country.surface,
        avgTemperature: country.avgTemperature,
        coordinates: country.coordinates,
        mapsUrl: country.mapsUrl
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s answer:', error);
    
    // Return a fallback response
    const countries = getAllCountries();
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    const countryIndex = dayOfYear % countries.length;
    const country = countries[countryIndex];
    
    return NextResponse.json({
      success: true,
      date: getDateIST().date,
      gameNumber: getDateIST().gameNumber,
      country: {
        id: country.id,
        name: country.country,
        continent: country.continent,
        hemisphere: country.hemisphere,
        population: country.population,
        surface: country.surface,
        avgTemperature: country.avgTemperature,
        coordinates: country.coordinates,
        mapsUrl: country.mapsUrl
      },
      note: 'Using calculated fallback due to API error'
    });
  }
}
