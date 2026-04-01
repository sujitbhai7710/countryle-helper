'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllCountries, getAllCapitals } from '@/lib/clientApi';

type GameMode = 'country' | 'capitale';

interface ArchiveEntry {
  date: string;
  displayDate: string;
  gameNumber: number;
  item: {
    id: number;
    name: string;
    continent: string;
    hemisphere?: string;
    country?: string;
  };
}

export default function Archive() {
  const [mode, setMode] = useState<GameMode>('country');
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadArchive() {
      try {
        setLoading(true);
        
        if (mode === 'country') {
          const countries = await getAllCountries();
          const now = new Date();
          const istOffset = 5.5 * 60 * 60 * 1000;
          const istTime = new Date(now.getTime() + istOffset);
          const refDate = new Date('2022-11-15');
          
          const entries: ArchiveEntry[] = [];
          
          for (let i = 1; i <= days; i++) {
            const targetDate = new Date(istTime.getTime() - i * 24 * 60 * 60 * 1000);
            const day = String(targetDate.getDate()).padStart(2, '0');
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const year = targetDate.getFullYear();
            const dateStr = `${day}/${month}/${year}`;
            
            const gameNumber = Math.floor((targetDate.getTime() - refDate.getTime()) / (24 * 60 * 60 * 1000));
            const countryIndex = Math.abs(gameNumber) % countries.length;
            const country = countries[countryIndex];
            
            if (country) {
              entries.push({
                date: dateStr,
                displayDate: targetDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                gameNumber,
                item: {
                  id: country.id,
                  name: country.country,
                  continent: country.continent,
                  hemisphere: country.hemisphere
                }
              });
            }
          }
          
          setArchive(entries);
        } else {
          // Capitale mode
          const capitals = await getAllCapitals();
          const now = new Date();
          const istOffset = 5.5 * 60 * 60 * 1000;
          const istTime = new Date(now.getTime() + istOffset);
          const refDate = new Date('2022-11-15');
          
          const entries: ArchiveEntry[] = [];
          
          for (let i = 1; i <= days; i++) {
            const targetDate = new Date(istTime.getTime() - i * 24 * 60 * 60 * 1000);
            const day = String(targetDate.getDate()).padStart(2, '0');
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const year = targetDate.getFullYear();
            const dateStr = `${day}/${month}/${year}`;
            
            const gameNumber = Math.floor((targetDate.getTime() - refDate.getTime()) / (24 * 60 * 60 * 1000));
            const capitalIndex = Math.abs(gameNumber) % capitals.length;
            const capital = capitals[capitalIndex];
            
            if (capital) {
              entries.push({
                date: dateStr,
                displayDate: targetDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                gameNumber,
                item: {
                  id: capital.id,
                  name: capital.capital,
                  continent: capital.continent,
                  country: capital.country
                }
              });
            }
          }
          
          setArchive(entries);
        }
      } catch (e) {
        setError('Failed to load archive');
      } finally {
        setLoading(false);
      }
    }

    loadArchive();
  }, [days, mode]);

  const handleDaysChange = (newDays: number) => {
    if (newDays !== days) {
      fetchedRef.current = false;
      setLoading(true);
      setDays(newDays);
    }
  };

  const handleModeChange = (newMode: GameMode) => {
    if (newMode !== mode) {
      fetchedRef.current = false;
      setLoading(true);
      setMode(newMode);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Previous Answers</h2>
        <div className="flex items-center gap-4">
          {/* Mode Selector */}
          <div className="inline-flex bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => handleModeChange('country')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                mode === 'country'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌍 Country
            </button>
            <button
              onClick={() => handleModeChange('capitale')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                mode === 'capitale'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏛️ Capitale
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm" htmlFor="days-select">Show last:</label>
            <select
              id="days-select"
              value={days}
              onChange={(e) => handleDaysChange(parseInt(e.target.value, 10))}
              className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-emerald-500 focus:outline-none"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
        <p className="text-yellow-400 text-sm">
          ⚠️ <strong>Note:</strong> Archive answers are calculated based on historical game patterns. 
          For the most accurate current day answers, use the Today tab which fetches directly from the Countryle API.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && archive.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Date</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Game #</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">
                    {mode === 'country' ? 'Country' : 'Capital'}
                  </th>
                  {mode === 'capitale' && (
                    <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Country</th>
                  )}
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Continent</th>
                  {mode === 'country' && (
                    <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Hemisphere</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {archive.map((entry, index) => (
                  <tr
                    key={`${entry.date}-${index}`}
                    className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-300 text-sm">{entry.displayDate}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{entry.gameNumber}</td>
                    <td className="px-4 py-3 text-white font-semibold">{entry.item.name}</td>
                    {mode === 'capitale' && (
                      <td className="px-4 py-3 text-slate-300">{entry.item.country}</td>
                    )}
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-slate-600/50 rounded text-slate-300 text-xs">
                        {entry.item.continent}
                      </span>
                    </td>
                    {mode === 'country' && entry.item.hemisphere && (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          entry.item.hemisphere === 'North Hemisphere'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-orange-500/20 text-orange-300'
                        }`}>
                          {entry.item.hemisphere}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && archive.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No archive entries found
        </div>
      )}
    </div>
  );
}
