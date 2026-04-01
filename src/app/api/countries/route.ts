import { NextResponse } from 'next/server';
import { getAllCountries } from '@/lib/countries';

export async function GET() {
  try {
    const countries = getAllCountries();
    return NextResponse.json({ 
      success: true, 
      countries: countries.map(c => ({
        id: c.id,
        name: c.country,
        continent: c.continent,
        hemisphere: c.hemisphere
      }))
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch countries' }, { status: 500 });
  }
}
