'use client';

import { useState, useEffect } from 'react';

interface ArchiveEntry {
  date: string;
  displayDate: string;
  gameNumber: number;
  country: {
    id: number;
    name: string;
    continent: string;
    hemisphere: string;
  };
}

export default function Archive() {
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch(`/api/archive?days=${days}`);
        const json = await res.json();
        
        if (mounted) {
          if (json.success && Array.isArray(json.archive)) {
            setArchive(json.archive);
            setError('');
          } else {
            setError(json.error || 'Failed to load');
            setArchive([]);
          }
        }
      } catch (e) {
        if (mounted) {
          setError('Failed to connect');
          setArchive([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [days]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Previous Answers</h2>
        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-sm" htmlFor="days-select">Show last:</label>
          <select
            id="days-select"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
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
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Country</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Continent</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Hemisphere</th>
                </tr>
              </thead>
              <tbody>
                {archive.map((entry, index) => (
                  <tr
                    key={`${entry.date}-${index}`}
                    className={`border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                      index === 0 ? 'bg-emerald-500/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-300 text-sm">{entry.displayDate}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{entry.gameNumber}</td>
                    <td className="px-4 py-3 text-white font-semibold">{entry.country.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-slate-600/50 rounded text-slate-300 text-xs">
                        {entry.country.continent}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        entry.country.hemisphere === 'North Hemisphere'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-orange-500/20 text-orange-300'
                      }`}>
                        {entry.country.hemisphere}
                      </span>
                    </td>
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
