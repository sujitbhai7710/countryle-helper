'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getAllCountries, 
  filterCountriesByHints,
  calculateDistance,
  calculateDirection,
  directionArrows,
  formatPopulation,
  type CountryData,
  type CountryHint,
  type DiffType
} from '@/lib/clientApi';

// Color coding for diff types
const diffColors: Record<DiffType, { bg: string; text: string; arrow: string }> = {
  LESS: { bg: 'bg-blue-500/20', text: 'text-blue-400', arrow: '⬆️⬆️' },
  LITTLE_LESS: { bg: 'bg-blue-500/10', text: 'text-blue-300', arrow: '⬆️' },
  EQUAL: { bg: 'bg-green-500/20', text: 'text-green-400', arrow: '✓' },
  LITTLE_MORE: { bg: 'bg-orange-500/10', text: 'text-orange-300', arrow: '⬇️' },
  MORE: { bg: 'bg-orange-500/20', text: 'text-orange-400', arrow: '⬇️⬇️' },
  DIFFERENT: { bg: 'bg-red-500/20', text: 'text-red-400', arrow: '✗' },
};

export default function Solver() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hints, setHints] = useState<CountryHint[]>([]);
  
  // Form state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [distance, setDistance] = useState('');
  const [direction, setDirection] = useState('N');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Extended hints
  const [populationDiff, setPopulationDiff] = useState<DiffType | ''>('');
  const [temperatureDiff, setTemperatureDiff] = useState<DiffType | ''>('');
  const [surfaceDiff, setSurfaceDiff] = useState<DiffType | ''>('');
  const [hemisphereDiff, setHemisphereDiff] = useState<DiffType | ''>('');
  const [continentHit, setContinentHit] = useState<boolean | ''>('');
  const [showExtended, setShowExtended] = useState(false);
  
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
    
    const newHint: CountryHint = {
      id: Date.now().toString(),
      country: selectedCountry,
      distance: parseInt(distance),
      direction,
      populationDiff: populationDiff || undefined,
      avgTemperatureDiff: temperatureDiff || undefined,
      surfaceDiff: surfaceDiff || undefined,
      hemisphereDiff: hemisphereDiff || undefined,
      continentHit: continentHit === '' ? undefined : continentHit,
    };
    
    setHints(prev => [...prev, newHint]);
    
    // Reset form
    setSearchTerm('');
    setSelectedCountry(null);
    setDistance('');
    setDirection('N');
    setPopulationDiff('');
    setTemperatureDiff('');
    setSurfaceDiff('');
    setHemisphereDiff('');
    setContinentHit('');
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
    setPopulationDiff('');
    setTemperatureDiff('');
    setSurfaceDiff('');
    setHemisphereDiff('');
    setContinentHit('');
    setShowExtended(false);
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

          {/* Extended Hints Toggle */}
          <button
            onClick={() => setShowExtended(!showExtended)}
            className="text-left text-sm text-slate-400 hover:text-white transition flex items-center gap-2"
          >
            {showExtended ? '▼' : '▶'} Additional clues (population, temperature, etc.)
          </button>

          {/* Extended Hints */}
          {showExtended && (
            <div className="grid gap-4 p-4 bg-slate-700/30 rounded-xl">
              {/* Population */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Population {selectedCountry && <span className="text-slate-500">(yours: {formatPopulation(selectedCountry.population)})</span>}
                </label>
                <select
                  value={populationDiff}
                  onChange={(e) => setPopulationDiff(e.target.value as DiffType | '')}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Not specified --</option>
                  <option value="LESS">⬆️⬆️ Much smaller (blue)</option>
                  <option value="LITTLE_LESS">⬆️ A bit smaller (light blue)</option>
                  <option value="EQUAL">✓ Equal (green)</option>
                  <option value="LITTLE_MORE">⬇️ A bit larger (light orange)</option>
                  <option value="MORE">⬇️⬇️ Much larger (orange)</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Avg. Temperature {selectedCountry && <span className="text-slate-500">(yours: {selectedCountry.avgTemperature.toFixed(1)}°C)</span>}
                </label>
                <select
                  value={temperatureDiff}
                  onChange={(e) => setTemperatureDiff(e.target.value as DiffType | '')}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Not specified --</option>
                  <option value="LESS">⬆️⬆️ Much colder</option>
                  <option value="LITTLE_LESS">⬆️ A bit colder</option>
                  <option value="EQUAL">✓ Equal</option>
                  <option value="LITTLE_MORE">⬇️ A bit warmer</option>
                  <option value="MORE">⬇️⬇️ Much warmer</option>
                </select>
              </div>

              {/* Surface */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Surface Area {selectedCountry && <span className="text-slate-500">(yours: {selectedCountry.surface.toLocaleString()} km²)</span>}
                </label>
                <select
                  value={surfaceDiff}
                  onChange={(e) => setSurfaceDiff(e.target.value as DiffType | '')}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Not specified --</option>
                  <option value="LESS">⬆️⬆️ Much smaller</option>
                  <option value="LITTLE_LESS">⬆️ A bit smaller</option>
                  <option value="EQUAL">✓ Equal</option>
                  <option value="LITTLE_MORE">⬇️ A bit larger</option>
                  <option value="MORE">⬇️⬇️ Much larger</option>
                </select>
              </div>

              {/* Hemisphere */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hemisphere {selectedCountry && <span className="text-slate-500">(yours: {selectedCountry.hemisphere})</span>}
                </label>
                <select
                  value={hemisphereDiff}
                  onChange={(e) => setHemisphereDiff(e.target.value as DiffType | '')}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Not specified --</option>
                  <option value="EQUAL">✓ Same</option>
                  <option value="DIFFERENT">✗ Different</option>
                </select>
              </div>

              {/* Continent */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Continent {selectedCountry && <span className="text-slate-500">(yours: {selectedCountry.continent})</span>}
                </label>
                <select
                  value={continentHit === '' ? '' : continentHit ? 'true' : 'false'}
                  onChange={(e) => setContinentHit(e.target.value === '' ? '' : e.target.value === 'true')}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Not specified --</option>
                  <option value="true">✓ Same continent (green)</option>
                  <option value="false">✗ Different continent (red)</option>
                </select>
              </div>
            </div>
          )}

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
                    <span className="px-2 py-1 bg-slate-600/50 rounded">
                      {hint.distance}km {directionArrows[hint.direction]}
                    </span>
                    {hint.populationDiff && (
                      <span className={`px-2 py-1 rounded ${diffColors[hint.populationDiff].bg} ${diffColors[hint.populationDiff].text}`}>
                        Pop: {diffColors[hint.populationDiff].arrow}
                      </span>
                    )}
                    {hint.avgTemperatureDiff && (
                      <span className={`px-2 py-1 rounded ${diffColors[hint.avgTemperatureDiff].bg} ${diffColors[hint.avgTemperatureDiff].text}`}>
                        Temp: {diffColors[hint.avgTemperatureDiff].arrow}
                      </span>
                    )}
                    {hint.surfaceDiff && (
                      <span className={`px-2 py-1 rounded ${diffColors[hint.surfaceDiff].bg} ${diffColors[hint.surfaceDiff].text}`}>
                        Area: {diffColors[hint.surfaceDiff].arrow}
                      </span>
                    )}
                    {hint.hemisphereDiff && (
                      <span className={`px-2 py-1 rounded ${diffColors[hint.hemisphereDiff].bg} ${diffColors[hint.hemisphereDiff].text}`}>
                        Hem: {diffColors[hint.hemisphereDiff].arrow}
                      </span>
                    )}
                    {hint.continentHit !== undefined && (
                      <span className={`px-2 py-1 rounded ${hint.continentHit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        Cont: {hint.continentHit ? '✓' : '✗'}
                      </span>
                    )}
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
          <li>Enter the country you guessed, the distance (km), and direction arrow</li>
          <li>Click &quot;Additional clues&quot; to add population, temperature, etc. hints</li>
          <li>Use the color coding: 🟢 Green = equal, 🔵 Blue = smaller, 🟠 Orange = larger</li>
          <li>Click &quot;Add Clue&quot; to filter - matching countries appear on the right</li>
        </ol>
      </div>
    </div>
  );
}
