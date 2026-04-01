'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getAllCountries, 
  filterCountriesByHints,
  getHemisphereDiff,
  getContinentHit,
  getTemperatureDiff,
  getPopulationDiff,
  calculateDirection,
  directionLabels,
  directionOptions,
  formatPopulation,
  formatTemperature,
  type CountryData,
  type CountryHint,
  type DiffType,
  type DirectionType
} from '@/lib/clientApi';

// Color coding for diff types
const diffColors: Record<DiffType, { bg: string; text: string; arrow: string; label: string }> = {
  LESS: { bg: 'bg-red-500/20', text: 'text-red-400', arrow: '⬇️', label: 'Much less' },
  LITTLE_LESS: { bg: 'bg-orange-500/20', text: 'text-orange-400', arrow: '⬇️', label: 'A bit less' },
  EQUAL: { bg: 'bg-green-500/20', text: 'text-green-400', arrow: '✓', label: 'Equal' },
  LITTLE_MORE: { bg: 'bg-orange-500/20', text: 'text-orange-400', arrow: '⬆️', label: 'A bit more' },
  MORE: { bg: 'bg-red-500/20', text: 'text-red-400', arrow: '⬆️', label: 'Much more' },
  DIFFERENT: { bg: 'bg-red-500/20', text: 'text-red-400', arrow: '✗', label: 'Different' },
};

export default function Solver() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hints, setHints] = useState<CountryHint[]>([]);
  
  // Form state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // The 5 Countryle hints
  const [hemisphereDiff, setHemisphereDiff] = useState<DiffType>('EQUAL');
  const [continentHit, setContinentHit] = useState<boolean>(true);
  const [avgTemperatureDiff, setAvgTemperatureDiff] = useState<DiffType>('EQUAL');
  const [populationDiff, setPopulationDiff] = useState<DiffType>('EQUAL');
  const [coordinatesDiff, setCoordinatesDiff] = useState<DirectionType>('N');
  
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
    if (!selectedCountry) return;
    
    const newHint: CountryHint = {
      id: Date.now().toString(),
      country: selectedCountry,
      hemisphereDiff,
      continentHit,
      avgTemperatureDiff,
      populationDiff,
      coordinatesDiff,
    };
    
    setHints(prev => [...prev, newHint]);
    
    // Reset form
    setSearchTerm('');
    setSelectedCountry(null);
    setHemisphereDiff('EQUAL');
    setContinentHit(true);
    setAvgTemperatureDiff('EQUAL');
    setPopulationDiff('EQUAL');
    setCoordinatesDiff('N');
    setShowDropdown(false);
  }

  function removeHint(id: string) {
    setHints(prev => prev.filter(h => h.id !== id));
  }

  function resetAll() {
    setHints([]);
    setSearchTerm('');
    setSelectedCountry(null);
    setHemisphereDiff('EQUAL');
    setContinentHit(true);
    setAvgTemperatureDiff('EQUAL');
    setPopulationDiff('EQUAL');
    setCoordinatesDiff('N');
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
        <p className="text-slate-400 text-sm">Enter clues from your Countryle game to find the answer</p>
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

          {/* Show country info when selected */}
          {selectedCountry && (
            <div className="bg-slate-700/30 rounded-xl p-4 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400">Continent:</span>
                  <span className="ml-2 text-white">{selectedCountry.continent}</span>
                </div>
                <div>
                  <span className="text-slate-400">Hemisphere:</span>
                  <span className="ml-2 text-white">{selectedCountry.hemisphere}</span>
                </div>
                <div>
                  <span className="text-slate-400">Temperature:</span>
                  <span className="ml-2 text-white">{formatTemperature(selectedCountry.avgTemperature)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Population:</span>
                  <span className="ml-2 text-white">{formatPopulation(selectedCountry.population)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Surface:</span>
                  <span className="ml-2 text-white">{selectedCountry.surface.toLocaleString()} km²</span>
                </div>
                <div>
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="ml-2 text-white">{selectedCountry.coordinates}</span>
                </div>
              </div>
            </div>
          )}

          {/* The 5 Countryle Hints */}
          <div className="border-t border-slate-700 pt-4 mt-2">
            <h3 className="text-white font-medium mb-4">Enter hints from Countryle:</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Hemisphere */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hemisphere {selectedCountry && <span className="text-slate-500">({selectedCountry.hemisphere})</span>}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHemisphereDiff('EQUAL')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      hemisphereDiff === 'EQUAL' 
                        ? 'bg-green-500/30 text-green-400 border border-green-500' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🟢 Same
                  </button>
                  <button
                    type="button"
                    onClick={() => setHemisphereDiff('DIFFERENT')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      hemisphereDiff === 'DIFFERENT' 
                        ? 'bg-red-500/30 text-red-400 border border-red-500' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🔴 Different
                  </button>
                </div>
              </div>

              {/* Continent */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Continent {selectedCountry && <span className="text-slate-500">({selectedCountry.continent})</span>}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setContinentHit(true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      continentHit === true 
                        ? 'bg-green-500/30 text-green-400 border border-green-500' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🟢 Same
                  </button>
                  <button
                    type="button"
                    onClick={() => setContinentHit(false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      continentHit === false 
                        ? 'bg-red-500/30 text-red-400 border border-red-500' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🔴 Different
                  </button>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Avg. Temperature {selectedCountry && <span className="text-slate-500">({formatTemperature(selectedCountry.avgTemperature)})</span>}
                </label>
                <select
                  value={avgTemperatureDiff}
                  onChange={(e) => setAvgTemperatureDiff(e.target.value as DiffType)}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="MORE">⬆️ Much hotter (red)</option>
                  <option value="LITTLE_MORE">⬆️ A bit hotter (orange)</option>
                  <option value="EQUAL">✓ Same (green)</option>
                  <option value="LITTLE_LESS">⬇️ A bit colder (orange)</option>
                  <option value="LESS">⬇️ Much colder (red)</option>
                </select>
              </div>

              {/* Population */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Population {selectedCountry && <span className="text-slate-500">({formatPopulation(selectedCountry.population)})</span>}
                </label>
                <select
                  value={populationDiff}
                  onChange={(e) => setPopulationDiff(e.target.value as DiffType)}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="MORE">⬆️ Much larger (red)</option>
                  <option value="LITTLE_MORE">⬆️ A bit larger (orange)</option>
                  <option value="EQUAL">✓ Same (green)</option>
                  <option value="LITTLE_LESS">⬇️ A bit smaller (orange)</option>
                  <option value="LESS">⬇️ Much smaller (red)</option>
                </select>
              </div>

              {/* Coordinates Direction */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Direction to Target {selectedCountry && <span className="text-slate-500">({selectedCountry.coordinates})</span>}
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {directionOptions.map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setCoordinatesDiff(dir)}
                      className={`py-2 px-2 rounded-lg text-sm font-medium transition ${
                        coordinatesDiff === dir 
                          ? 'bg-blue-500/30 text-blue-400 border border-blue-500' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {directionLabels[dir]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={addHint}
              disabled={!selectedCountry}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                selectedCountry
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              Add Clue
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Clues</p>
              <h3 className="text-xl font-bold text-white">{hints.length} clue{hints.length !== 1 ? 's' : ''}</h3>
            </div>
          </div>
          
          {hints.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-600 rounded-xl">
              Add your first clue to start filtering countries
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {hints.map((hint) => (
                <div
                  key={hint.id}
                  className="bg-slate-700/50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{hint.country.country}</span>
                    <button
                      onClick={() => removeHint(hint.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${hint.hemisphereDiff === 'EQUAL' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      Hem: {hint.hemisphereDiff === 'EQUAL' ? '✓' : '✗'}
                    </span>
                    <span className={`px-2 py-1 rounded ${hint.continentHit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      Cont: {hint.continentHit ? '✓' : '✗'}
                    </span>
                    <span className={`px-2 py-1 rounded ${diffColors[hint.avgTemperatureDiff].bg} ${diffColors[hint.avgTemperatureDiff].text}`}>
                      Temp: {diffColors[hint.avgTemperatureDiff].arrow}
                    </span>
                    <span className={`px-2 py-1 rounded ${diffColors[hint.populationDiff].bg} ${diffColors[hint.populationDiff].text}`}>
                      Pop: {diffColors[hint.populationDiff].arrow}
                    </span>
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                      Dir: {directionLabels[hint.coordinatesDiff]}
                    </span>
                  </div>
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
                ? 'Results appear after you add clues'
                : 'No countries match all clues'
              }
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredResults.slice(0, 30).map((result, index) => (
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
              {filteredResults.length > 30 && (
                <div className="text-center text-slate-500 text-sm py-2">
                  +{filteredResults.length - 30} more...
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
          <li>Select the country you guessed from the dropdown</li>
          <li>Enter the 5 hints shown by Countryle:
            <ul className="list-disc list-inside ml-4 mt-1 text-slate-500">
              <li><strong>Hemisphere:</strong> 🟢 Same or 🔴 Different</li>
              <li><strong>Continent:</strong> 🟢 Same or 🔴 Different</li>
              <li><strong>Temperature:</strong> ⬆️ Hotter or ⬇️ Colder</li>
              <li><strong>Population:</strong> ⬆️ Larger or ⬇️ Smaller</li>
              <li><strong>Direction:</strong> The compass direction to the target</li>
            </ul>
          </li>
          <li>Click &quot;Add Clue&quot; to filter - matching countries appear on the right</li>
          <li>Repeat with more guesses to narrow down the answer</li>
        </ol>
      </div>
    </div>
  );
}
