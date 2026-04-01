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
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchTodayCountry()
      .then(result => {
        setData(result);
        if (!result.success) {
          setError(result.error || 'Failed to load');
        }
      })
      .catch(() => {
        setError('Failed to connect');
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

  if (error || !data?.country) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-2">Error: {error || 'No data available'}</p>
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
            <span className="text-emerald-400 font-semibold">Today&apos;s Answer</span>
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
