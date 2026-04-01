'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchTodayCountry, type CountryData } from '@/lib/clientApi';

export default function TodayAnswer() {
  const [data, setData] = useState<{
    success: boolean;
    date: string;
    gameNumber: number;
    country: CountryData | null;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchTodayCountry()
      .then(result => {
        setData(result);
      })
      .catch(() => {
        setData({
          success: false,
          date: '',
          gameNumber: 0,
          country: null,
          error: 'Failed to connect',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Loading today&apos;s answer...</p>
      </div>
    );
  }

  if (!data?.success || !data.country) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-2">Error: {data?.error || 'No data available'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-500/20 rounded-lg text-red-300 hover:bg-red-500/30 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const c = data.country;

  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-slate-400 text-sm">Game #{data.gameNumber}</p>
        <p className="text-slate-500 text-xs">Date: {data.date} (IST)</p>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700/50">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">{c.country}</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full mb-6">
            <span className="text-emerald-400 font-semibold">🌍 Today&apos;s Answer</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <InfoCard label="Continent" value={c.continent} />
          <InfoCard label="Hemisphere" value={c.hemisphere} />
          <InfoCard label="Population" value={c.population.toLocaleString()} />
          <InfoCard label="Surface Area" value={`${c.surface.toLocaleString()} km²`} />
          <InfoCard label="Avg. Temperature" value={`${c.avgTemperature.toFixed(1)}°C`} />
          <InfoCard label="Coordinates" value={c.coordinates} />
        </div>

        {/* Link to game */}
        <div className="mt-6 text-center">
          <a 
            href="https://countryle.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 transition text-sm"
          >
            Play Countryle →
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-700/30 rounded-xl p-4">
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}
