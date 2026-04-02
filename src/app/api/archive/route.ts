import { NextResponse } from 'next/server';
import { getCountryById, getAllCountries } from '@/lib/countries';
import { decryptCountryId } from '@/lib/crypto';

// Helper to get date in JST format
function formatDateJST(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper to get date N days ago in JST (Japan Standard Time = UTC+9)
function getDateDaysAgo(daysAgo: number): { date: string; displayDate: string } {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstTime = new Date(now.getTime() + jstOffset);
  const targetDate = new Date(jstTime.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  
  const displayDate = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return { date: formatDateJST(targetDate), displayDate };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const date = searchParams.get('date');
    
    // If a specific date is requested
    if (date) {
      const response = await fetch(
        `https://www.countryle.com/hidden-api/get-daily-country-valid.php?date=${date}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );
      
      if (!response.ok) {
        return NextResponse.json({ success: false, error: 'Failed to fetch archive' }, { status: 500 });
      }
      
      const data = await response.json();
      const encryptedId = data.country || data.id || data;
      
      let countryId: number;
      if (typeof encryptedId === 'string') {
        countryId = decryptCountryId(encryptedId);
      } else {
        countryId = parseInt(encryptedId, 10);
      }
      
      const country = getCountryById(countryId);
      
      if (!country) {
        return NextResponse.json({ success: false, error: 'Country not found' }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        date,
        country: {
          id: country.id,
          name: country.country,
          continent: country.continent,
          hemisphere: country.hemisphere
        }
      });
    }
    
    // Generate archive for the last N days
    const archive: Array<{
      date: string;
      displayDate: string;
      gameNumber: number;
      country: {
        id: number;
        name: string;
        continent: string;
        hemisphere: string;
      };
    }> = [];
    
    const countries = getAllCountries();
    const refDate = new Date('2022-11-15');
    
    for (let i = 1; i <= days; i++) {
      const { date: dateStr, displayDate } = getDateDaysAgo(i);
      const targetDate = new Date();
      targetDate.setTime(targetDate.getTime() - i * 24 * 60 * 60 * 1000);
      
      const gameNumber = Math.floor((targetDate.getTime() - refDate.getTime()) / (24 * 60 * 60 * 1000));
      
      // Use deterministic selection based on the date
      const countryIndex = Math.abs(gameNumber) % countries.length;
      const country = countries[countryIndex];
      
      archive.push({
        date: dateStr,
        displayDate,
        gameNumber,
        country: {
          id: country.id,
          name: country.country,
          continent: country.continent,
          hemisphere: country.hemisphere
        }
      });
    }
    
    return NextResponse.json({ success: true, archive });
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch archive' }, { status: 500 });
  }
}
