'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchTodayCountry, getAllCountries, getCountryByName, generateClues } from '@/lib/clientApi';

interface Country {
  id: number;
  name: string;
  continent: string;
  hemisphere: string;
}

interface CountryData {
  id: number;
  country: string;
  continent: string;
  hemisphere: string;
  population: number;
  surface: number;
  avgTemperature: number;
  coordinates: string;
}

interface Clue {
  property: string;
  guessValue: string | number;
  answerValue: string | number;
  result: string;
  isCorrect: boolean;
}

interface GuessResult {
  success: boolean;
  guess?: Country;
  answer?: { id: number; name: string };
  clues?: Clue[];
  isCorrect?: boolean;
  error?: string;
}

export default function Solver() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [won, setWon] = useState(false);
  const [error, setError] = useState('');
  const [answerCountry, setAnswerCountry] = useState<CountryData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadData() {
      try {
        const [countriesData, todayData] = await Promise.all([
          getAllCountries(),
          fetchTodayCountry()
        ]);
        
        setCountries(countriesData.map(c => ({
          id: c.id,
          name: c.country,
          continent: c.continent,
          hemisphere: c.hemisphere
        })));
        
        if (todayData.success && todayData.country) {
          setAnswerCountry({
            id: todayData.country.id,
            country: todayData.country.country,
            continent: todayData.country.continent,
            hemisphere: todayData.country.hemisphere,
            population: todayData.country.population,
            surface: todayData.country.surface,
            avgTemperature: todayData.country.avgTemperature,
            coordinates: todayData.country.coordinates
          });
        }
      } catch (e) {
        setError('Failed to load data');
      } finally {
        setLoadingCountries(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (guesses.length > 0 && guesses[0]?.isCorrect) {
      setWon(true);
    }
  }, [guesses]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countries
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 10);

  async function handleGuess() {
    if (!selectedCountry || won || !answerCountry) return;
    
    setLoading(true);
    
    try {
      const guessData = await getCountryByName(selectedCountry.name);
      
      if (!guessData) {
        alert('Country not found');
        setLoading(false);
        return;
      }
      
      const clues = generateClues(guessData, answerCountry);
      const isCorrect = guessData.id === answerCountry.id;
      
      const result: GuessResult = {
        success: true,
        guess: selectedCountry,
        answer: { id: answerCountry.id, name: answerCountry.country },
        clues,
        isCorrect
      };
      
      setGuesses(prev => [result, ...prev]);
      setSearchTerm('');
      setSelectedCountry(null);
      setShowDropdown(false);
    } catch (e) {
      alert('Failed to process guess');
    } finally {
      setLoading(false);
    }
  }

  function resetGame() {
    setGuesses([]);
    setWon(false);
    setSearchTerm('');
    setSelectedCountry(null);
  }

  if (loadingCountries) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-2">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Countryle Solver</h2>
        <p className="text-slate-400 text-sm">Make guesses and get hints to find today&apos;s country!</p>
      </div>

      {/* Input Section */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1" ref={dropdownRef}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type a country name..."
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 focus:border-emerald-500 focus:outline-none placeholder-slate-400"
              disabled={won}
            />
            
            {showDropdown && searchTerm && !won && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 rounded-xl border border-slate-600 shadow-xl z-10 max-h-60 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map(country => (
                    <button
                      key={country.id}
                      onClick={() => {
                        setSelectedCountry(country);
                        setSearchTerm(country.name);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-slate-600 transition-colors flex justify-between items-center"
                    >
                      <span>{country.name}</span>
                      <span className="text-slate-400 text-sm">{country.continent}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-400">No countries found</div>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={handleGuess}
            disabled={!selectedCountry || loading || won}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              won
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : selectedCountry && !loading
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Checking...' : won ? 'Won!' : 'Guess'}
          </button>
        </div>
        
        {selectedCountry && !won && (
          <div className="mt-3 text-slate-400 text-sm">
            Selected: <span className="text-white font-semibold">{selectedCountry.name}</span>
          </div>
        )}
      </div>

      {/* Win Banner */}
      {won && guesses.length > 0 && guesses[0].answer && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-6 mb-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-2xl font-bold text-white mb-2">Congratulations!</h3>
          <p className="text-emerald-300">You found today&apos;s country: <strong>{guesses[0].answer.name}</strong></p>
          <p className="text-slate-400 mt-2">Solved in {guesses.length} guess{guesses.length > 1 ? 'es' : ''}!</p>
          <button
            onClick={resetGame}
            className="mt-4 px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-300 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Guesses List */}
      {guesses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Your Guesses ({guesses.length})</h3>
          
          {guesses.map((guess, index) => (
            guess.guess && guess.clues && (
              <div
                key={`guess-${index}`}
                className={`bg-slate-800/50 rounded-2xl border overflow-hidden ${
                  guess.isCorrect ? 'border-emerald-500' : 'border-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between px-6 py-4 bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm">#{guesses.length - index}</span>
                    <span className="text-xl font-bold text-white">{guess.guess.name}</span>
                  </div>
                  {guess.isCorrect && (
                    <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-semibold">
                      Correct!
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-700/30">
                  {guess.clues.map((clue, clueIndex) => (
                    <div key={clueIndex} className="bg-slate-800/50 px-4 py-3">
                      <div className="text-slate-400 text-xs mb-1">{clue.property}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">{clue.guessValue}</span>
                        <span className={`text-sm font-medium ${
                          clue.isCorrect ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {clue.result}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
        <h4 className="text-white font-semibold mb-3">How to Play</h4>
        <ul className="text-slate-400 text-sm space-y-2">
          <li>• Type a country name and click Guess to make a guess</li>
          <li>• Each guess gives you clues about how close you are</li>
          <li>• <span className="text-emerald-400">Green clues</span> mean you got that category right</li>
          <li>• <span className="text-amber-400">Yellow clues</span> tell you if you need to go higher/lower or different</li>
          <li>• Use the clues to narrow down the correct country!</li>
        </ul>
      </div>
    </div>
  );
}
