import { NextResponse } from 'next/server';
import { 
  getCountryByName, 
  getCountryById, 
  generateClues, 
  getAllCountries,
  type Country,
  type GameClue
} from '@/lib/countries';
import { decryptCountryId } from '@/lib/crypto';

interface GuessRequest {
  guessName: string;
  answerId?: number;
  encryptedAnswerId?: string;
}

interface SolveRequest {
  guesses: Array<{
    guessName: string;
    clues?: GameClue[];
  }>;
  answerId?: number;
  encryptedAnswerId?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guessName, answerId, encryptedAnswerId } = body as GuessRequest;
    
    if (!guessName) {
      return NextResponse.json({ success: false, error: 'Guess name is required' }, { status: 400 });
    }
    
    const guess = getCountryByName(guessName);
    if (!guess) {
      return NextResponse.json({ success: false, error: 'Country not found in database' }, { status: 404 });
    }
    
    // Get the answer country
    let answerCountryId = answerId;
    if (!answerCountryId && encryptedAnswerId) {
      answerCountryId = decryptCountryId(encryptedAnswerId);
    }
    
    // If no answer provided, get today's answer
    if (!answerCountryId) {
      try {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const day = String(istTime.getDate()).padStart(2, '0');
        const month = String(istTime.getMonth() + 1).padStart(2, '0');
        const year = istTime.getFullYear();
        const dateStr = `${day}/${month}/${year}`;
        
        const response = await fetch(
          `https://www.countryle.com/hidden-api/get-daily-country-valid.php?date=${dateStr}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const encId = data.country || data.id || data;
          answerCountryId = typeof encId === 'string' ? decryptCountryId(encId) : parseInt(encId, 10);
        }
      } catch (e) {
        console.error('Failed to fetch today\'s answer:', e);
      }
    }
    
    if (!answerCountryId) {
      return NextResponse.json({ success: false, error: 'Could not determine the answer country' }, { status: 500 });
    }
    
    const answer = getCountryById(answerCountryId);
    if (!answer) {
      return NextResponse.json({ success: false, error: 'Answer country not found in database' }, { status: 404 });
    }
    
    const clues = generateClues(guess, answer);
    
    return NextResponse.json({
      success: true,
      guess: {
        id: guess.id,
        name: guess.country,
        continent: guess.continent,
        hemisphere: guess.hemisphere
      },
      answer: {
        id: answer.id,
        name: answer.country
      },
      clues,
      isCorrect: guess.id === answer.id
    });
  } catch (error) {
    console.error('Error in solver:', error);
    return NextResponse.json({ success: false, error: 'Failed to process guess' }, { status: 500 });
  }
}

// GET endpoint for getting possible countries based on past guesses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const answerIdParam = searchParams.get('answerId');
    
    // Get all countries as suggestions
    const countries = getAllCountries();
    
    if (answerIdParam) {
      const answerId = parseInt(answerIdParam, 10);
      const answer = getCountryById(answerId);
      
      if (answer) {
        // Return countries sorted by similarity to the answer
        const sortedCountries = countries.map(c => {
          let score = 0;
          if (c.continent === answer.continent) score += 30;
          if (c.hemisphere === answer.hemisphere) score += 20;
          if (Math.abs(c.population - answer.population) / answer.population < 0.2) score += 15;
          if (Math.abs(c.surface - answer.surface) / answer.surface < 0.2) score += 15;
          if (Math.abs(c.avgTemperature - answer.avgTemperature) < 5) score += 10;
          return { country: c, score };
        }).sort((a, b) => b.score - a.score);
        
        return NextResponse.json({
          success: true,
          suggestions: sortedCountries.slice(0, 20).map(s => ({
            id: s.country.id,
            name: s.country.country,
            continent: s.country.continent,
            hemisphere: s.country.hemisphere,
            relevanceScore: s.score
          }))
        });
      }
    }
    
    // Return all countries sorted alphabetically
    return NextResponse.json({
      success: true,
      countries: countries
        .sort((a, b) => a.country.localeCompare(b.country))
        .map(c => ({
          id: c.id,
          name: c.country,
          continent: c.continent,
          hemisphere: c.hemisphere
        }))
    });
  } catch (error) {
    console.error('Error getting countries:', error);
    return NextResponse.json({ success: false, error: 'Failed to get countries' }, { status: 500 });
  }
}
