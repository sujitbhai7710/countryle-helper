'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getAllCountries, 
  getAllCapitals,
  filterCountriesByHints, 
  filterCapitalsByHints,
  directionArrows,
  type CountryData,
  type CapitalData,
  type CountryHint,
  type CapitalHint
} from '@/lib/clientApi';

type GameMode = 'country' | 'capitale';

export default function Solver() {
  const [mode, setMode] = useState<GameMode>('country');
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [capitals, setCapitals] = useState<CapitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryHints, setCountryHints] = useState<CountryHint[]>([]);
  const [capitalHints, setCapitalHints] = useState<CapitalHint[]>([]);
  
  // Form state for country
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  
  // Form state for capital
  const [capitalSearch, setCapitalSearch] = useState('');
  const [selectedCapital, setSelectedCapital] = useState<CapitalData | null>(null);
  
  // Shared form state
  const [distance, setDistance] = useState('');
  const [direction, setDirection] = useState('N');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Results
  const [filteredCountries, setFilteredCountries] = useState<{ country: CountryData; score: number }[]>([]);
  const [filteredCapitals, setFilteredCapitals] = useState<{ capital: CapitalData; score: number }[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    Promise.all([getAllCountries(), getAllCapitals()])
      .then(([countriesData, capitalsData]) => {
        setCountries(countriesData);
        setCapitals(capitalsData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update filtered results when hints change
  useEffect(() => {
    const results = filterCountriesByHints(countries, countryHints);
    setFilteredCountries(results);
  }, [countryHints, countries]);

  useEffect(() => {
    const results = filterCapitalsByHints(capitals, capitalHints);
    setFilteredCapitals(results);
  }, [capitalHints, capitals]);

  const filteredSuggestions = mode === 'country'
    ? countries
        .filter(c => 
          c.country.toLowerCase().includes(countrySearch.toLowerCase()) &&
          !countryHints.some(h => h.country.id === c.id)
        )
        .slice(0, 8)
    : capitals
        .filter(c => 
          c.capital.toLowerCase().includes(capitalSearch.toLowerCase()) &&
          !capitalHints.some(h => h.capital.id === c.id)
        )
        .slice(0, 8);

  function addHint() {
    if (mode === 'country') {
      if (!selectedCountry || !distance) return;
      
      const newHint: CountryHint = {
        id: Date.now().toString(),
        country: selectedCountry,
        distance: parseInt(distance),
        direction,
      };
      
      setCountryHints(prev => [...prev, newHint]);
      setCountrySearch('');
      setSelectedCountry(null);
    } else {
      if (!selectedCapital || !distance) return;
      
      const newHint: CapitalHint = {
        id: Date.now().toString(),
        capital: selectedCapital,
        distance: parseInt(distance),
        direction,
      };
      
      setCapitalHints(prev => [...prev, newHint]);
      setCapitalSearch('');
      setSelectedCapital(null);
    }
    
    setDistance('');
    setDirection('N');
    setShowDropdown(false);
  }

  function removeHint(id: string) {
    if (mode === 'country') {
      setCountryHints(prev => prev.filter(h => h.id !== id));
    } else {
      setCapitalHints(prev => prev.filter(h => h.id !== id));
    }
  }

  function resetAll() {
    if (mode === 'country') {
      setCountryHints([]);
      setCountrySearch('');
      setSelectedCountry(null);
    } else {
      setCapitalHints([]);
      setCapitalSearch('');
      setSelectedCapital(null);
    }
    setDistance('');
    setDirection('N');
  }

  const currentHints = mode === 'country' ? countryHints : capitalHints;
  const currentSearch = mode === 'country' ? countrySearch : capitalSearch;
  const setCurrentSearch = mode === 'country' ? setCountrySearch : setCapitalSearch;
  const currentResults = mode === 'country' ? filteredCountries : filteredCapitals;
  const searchTerm = mode === 'country' ? countrySearch : capitalSearch;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Loading {mode === 'country' ? 'countries' : 'capitals'}...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Countryle Solver</h2>
        <p className="text-slate-400 text-sm">Enter clues from your Countryle game to filter possible answers</p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-slate-800/50 rounded-xl p-1">
          <button
            onClick={() => setMode('country')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              mode === 'country'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌍 Country
          </button>
          <button
            onClick={() => setMode('capitale')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              mode === 'capitale'
                ? 'bg-orange-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏛️ Capitale
          </button>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <div className="grid gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Guessed {mode === 'country' ? 'Country' : 'Capital'}
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                value={currentSearch}
                onChange={(e) => {
                  setCurrentSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={mode === 'country' ? 'Type a country name...' : 'Type a capital name...'}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 focus:border-emerald-500 focus:outline-none placeholder-slate-400"
              />
              
              {showDropdown && searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 rounded-xl border border-slate-600 shadow-xl z-10 max-h-60 overflow-y-auto">
                  {filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((item) => (
                      <button
                        key={mode === 'country' ? (item as CountryData).id : (item as CapitalData).id}
                        onClick={() => {
                          if (mode === 'country') {
                            setSelectedCountry(item as CountryData);
                            setCountrySearch((item as CountryData).country);
                          } else {
                            setSelectedCapital(item as CapitalData);
                            setCapitalSearch((item as CapitalData).capital);
                          }
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-slate-600 transition-colors flex justify-between items-center"
                      >
                        <span>
                          {mode === 'country' 
                            ? (item as CountryData).country 
                            : `${(item as CapitalData).capital}, ${(item as CapitalData).country}`}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {mode === 'country' 
                            ? (item as CountryData).continent 
                            : (item as CapitalData).continent}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-400">No {mode === 'country' ? 'countries' : 'capitals'} found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Distance and Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Distance (km)
              </label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="e.g. 1383"
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 focus:border-emerald-500 focus:outline-none placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 focus:border-emerald-500 focus:outline-none"
              >
                {Object.entries(directionArrows).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={addHint}
              disabled={(mode === 'country' && !selectedCountry) || (mode === 'capitale' && !selectedCapital) || !distance}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                ((mode === 'country' && selectedCountry) || (mode === 'capitale' && selectedCapital)) && distance
                  ? mode === 'country'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              Add Hint
            </button>
            <button
              onClick={resetAll}
              className="px-6 py-3 rounded-xl font-semibold border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Active Hints */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Hints</p>
              <h3 className="text-xl font-bold text-white">{currentHints.length} clue{currentHints.length !== 1 ? 's' : ''}</h3>
            </div>
          </div>
          
          {currentHints.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-600 rounded-xl">
              Add your first clue to start filtering {mode === 'country' ? 'countries' : 'capitals'}
            </div>
          ) : (
            <div className="space-y-3">
              {(mode === 'country' ? countryHints : capitalHints).map((hint) => (
                <div
                  key={hint.id}
                  className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      {mode === 'country' 
                        ? (hint as CountryHint).country.country 
                        : `${(hint as CapitalHint).capital.capital}, ${(hint as CapitalHint).capital.country}`}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {hint.distance}km {directionArrows[hint.direction]}
                    </span>
                  </div>
                  <button
                    onClick={() => removeHint(hint.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Possible Answers</p>
              <h3 className="text-xl font-bold text-white">{currentResults.length} match{currentResults.length !== 1 ? 'es' : ''}</h3>
            </div>
          </div>
          
          {currentResults.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-600 rounded-xl">
              {currentHints.length === 0 
                ? 'Results appear after you add hints'
                : `No ${mode === 'country' ? 'countries' : 'capitals'} match all clues`
              }
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {mode === 'country' 
                ? filteredCountries.slice(0, 20).map((result, index) => (
                    <div
                      key={result.country.id}
                      className="flex items-center justify-between bg-slate-700/30 rounded-lg px-4 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm w-6">{index + 1}.</span>
                        <span className="text-white">{result.country.country}</span>
                      </div>
                      <span className="text-slate-400 text-sm">{result.country.continent}</span>
                    </div>
                  ))
                : filteredCapitals.slice(0, 20).map((result, index) => (
                    <div
                      key={result.capital.id}
                      className="flex items-center justify-between bg-slate-700/30 rounded-lg px-4 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm w-6">{index + 1}.</span>
                        <span className="text-white">{result.capital.capital}</span>
                        <span className="text-slate-500 text-sm">({result.capital.country})</span>
                      </div>
                      <span className="text-slate-400 text-sm">{result.capital.continent}</span>
                    </div>
                  ))
              }
              {currentResults.length > 20 && (
                <div className="text-center text-slate-500 text-sm py-2">
                  +{currentResults.length - 20} more...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* How to Use */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
        <h4 className="text-white font-semibold mb-3">How to Use This Solver</h4>
        <ol className="text-slate-400 text-sm space-y-2 list-decimal list-inside">
          <li>Make a guess in the actual Countryle {mode === 'country' ? '(Country mode)' : '(Capitale mode)'}</li>
          <li>Enter the {mode === 'country' ? 'country' : 'capital'} you guessed, the distance shown, and the direction arrow</li>
          <li>Click &quot;Add Hint&quot; to filter the possible answers</li>
          <li>Add more hints from additional guesses to narrow down the list</li>
          <li>The {mode === 'country' ? 'countries' : 'capitals'} that match all your clues will appear in &quot;Possible Answers&quot;</li>
        </ol>
      </div>
    </div>
  );
}
