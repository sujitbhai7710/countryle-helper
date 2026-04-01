'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getAllCountries, 
  filterCountriesByHints, 
  directionArrows,
  type CountryData,
  type Hint
} from '@/lib/clientApi';

export default function Solver() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hints, setHints] = useState<Hint[]>([]);
  
  // Form state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [distance, setDistance] = useState('');
  const [direction, setDirection] = useState('N');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Results
  const [filteredResults, setFilteredResults] = useState<{ country: CountryData; score: number }[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    getAllCountries().then(data => {
      setCountries(data);
      setLoading(false);
    }).catch(() => {
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
    const results = filterCountriesByHints(countries, hints);
    setFilteredResults(results);
  }, [hints, countries]);

  const filteredCountries = countries
    .filter(c => 
      c.country.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !hints.some(h => h.country.id === c.id)
    )
    .slice(0, 8);

  function addHint() {
    if (!selectedCountry || !distance) return;
    
    const newHint: Hint = {
      id: Date.now().toString(),
      country: selectedCountry,
      distance: parseInt(distance),
      direction,
    };
    
    setHints(prev => [...prev, newHint]);
    
    // Reset form
    setSearchTerm('');
    setSelectedCountry(null);
    setDistance('');
    setDirection('N');
    setShowDropdown(false);
  }

  function removeHint(id: string) {
    setHints(prev => prev.filter(h => h.id !== id));
  }

  function resetAll() {
    setHints([]);
    setSearchTerm('');
    setSelectedCountry(null);
    setDistance('');
    setDirection('N');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Loading countries...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Countryle Solver</h2>
        <p className="text-slate-400 text-sm">Enter clues from your Countryle game to filter possible answers</p>
      </div>

      {/* Input Form */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <div className="grid gap-4">
          {/* Country Search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Guessed Country
            </label>
            <div className="relative" ref={dropdownRef}>
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
              />
              
              {showDropdown && searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 rounded-xl border border-slate-600 shadow-xl z-10 max-h-60 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map(country => (
                      <button
                        key={country.id}
                        onClick={() => {
                          setSelectedCountry(country);
                          setSearchTerm(country.country);
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-slate-600 transition-colors flex justify-between items-center"
                      >
                        <span>{country.country}</span>
                        <span className="text-slate-400 text-sm">{country.continent}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-400">No countries found</div>
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
              disabled={!selectedCountry || !distance}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                selectedCountry && distance
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
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
              <h3 className="text-xl font-bold text-white">{hints.length} clue{hints.length !== 1 ? 's' : ''}</h3>
            </div>
          </div>
          
          {hints.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-600 rounded-xl">
              Add your first clue to start filtering countries
            </div>
          ) : (
            <div className="space-y-3">
              {hints.map((hint) => (
                <div
                  key={hint.id}
                  className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{hint.country.country}</span>
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
              <h3 className="text-xl font-bold text-white">{filteredResults.length} match{filteredResults.length !== 1 ? 'es' : ''}</h3>
            </div>
          </div>
          
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-600 rounded-xl">
              {hints.length === 0 
                ? 'Results appear after you add hints'
                : 'No countries match all clues'
              }
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredResults.slice(0, 20).map((result, index) => (
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
              ))}
              {filteredResults.length > 20 && (
                <div className="text-center text-slate-500 text-sm py-2">
                  +{filteredResults.length - 20} more...
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
          <li>Make a guess in the actual Countryle game</li>
          <li>Enter the country you guessed, the distance shown, and the direction arrow</li>
          <li>Click &quot;Add Hint&quot; to filter the possible answers</li>
          <li>Add more hints from additional guesses to narrow down the list</li>
          <li>The countries that match all your clues will appear in &quot;Possible Answers&quot;</li>
        </ol>
      </div>
    </div>
  );
}
