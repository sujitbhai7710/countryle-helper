'use client';

import { useState, useEffect } from 'react';

interface CountryData {
  id: number;
  name: string;
  continent: string;
  hemisphere: string;
  population: number;
  surface: number;
  avgTemperature: number;
  coordinates: string;
  mapsUrl?: string;
}

interface TodayResponse {
  success: boolean;
  date: string;
  gameNumber: number;
  country: CountryData;
  note?: string;
  error?: string;
}

export default function TodayAnswer() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch('/api/today');
        const json = await res.json();
        
        if (mounted) {
          if (json.success && json.country) {
            setData(json);
            setError('');
          } else {
            setError(json.error || 'Failed to load');
          }
        }
      } catch (e) {
        if (mounted) {
          setError('Failed to connect');
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
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Loading today&apos;s answer...</p>
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

  if (!data || !data.country) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
        <p className="text-amber-400">No data available</p>
      </div>
    );
  }

  const c = data.country;

  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-slate-400 text-sm">Game #{data.gameNumber}</p>
        <p className="text-slate-500 text-xs">Date: {data.date} (IST)</p>
        {data.note && <p className="text-amber-400 text-xs mt-1">{data.note}</p>}
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700/50">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">{c.name}</h2>
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

        {c.mapsUrl && (
          <div className="mt-6 text-center">
            <a
              href={c.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              View on Google Maps
            </a>
          </div>
        )}
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
