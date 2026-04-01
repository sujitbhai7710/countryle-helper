'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchTodayCountry, fetchTodayCapitale, type CountryData, type CapitalData } from '@/lib/clientApi';

type GameMode = 'country' | 'capitale';

export default function TodayAnswer() {
  const [mode, setMode] = useState<GameMode>('country');
  const [countryData, setCountryData] = useState<{
    success: boolean;
    date: string;
    gameNumber: number;
    country: CountryData | null;
    error?: string;
  } | null>(null);
  const [capitaleData, setCapitaleData] = useState<{
    success: boolean;
    date: string;
    gameNumber: number;
    capital: CapitalData | null;
    unavailable?: boolean;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const countryFetchedRef = useRef(false);
  const capitaleFetchedRef = useRef(false);

  // Fetch country data
  useEffect(() => {
    if (countryFetchedRef.current) return;
    countryFetchedRef.current = true;

    fetchTodayCountry()
      .then(result => {
        setCountryData(result);
      })
      .catch(() => {
        setCountryData({
          success: false,
          date: '',
          gameNumber: 0,
          country: null,
          error: 'Failed to connect',
        });
      });
  }, []);

  // Fetch capitale data
  useEffect(() => {
    if (capitaleFetchedRef.current) return;
    capitaleFetchedRef.current = true;

    fetchTodayCapitale()
      .then(result => {
        setCapitaleData(result);
      })
      .catch(() => {
        setCapitaleData({
          success: false,
          date: '',
          gameNumber: 0,
          capital: null,
          error: 'Failed to connect',
        });
      });
  }, []);

  // Loading state
  useEffect(() => {
    if (countryData !== null && capitaleData !== null) {
      setLoading(false);
    }
  }, [countryData, capitaleData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Loading today&apos;s answers...</p>
      </div>
    );
  }

  const currentData = mode === 'country' ? countryData : capitaleData;
  const error = currentData?.success === false ? (currentData as any).error || 'Failed to load' : null;

  return (
    <div>
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

      {/* Game Info */}
      <div className="text-center mb-6">
        <p className="text-slate-400 text-sm">
          Game #{currentData?.gameNumber || '—'}
        </p>
        <p className="text-slate-500 text-xs">
          Date: {currentData?.date || '—'} (IST)
        </p>
      </div>

      {/* Country Mode Content */}
      {mode === 'country' && (
        error || !countryData?.country ? (
          <ErrorDisplay error={error || 'No data available'} />
        ) : (
          <CountryDisplay country={countryData.country} />
        )
      )}

      {/* Capitale Mode Content */}
      {mode === 'capitale' && (
        (capitaleData as any)?.unavailable ? (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 text-center">
            <p className="text-orange-400 text-lg mb-2">🏛️ Capitale Mode Unavailable</p>
            <p className="text-slate-400 text-sm">
              The Capitale game mode may not be active or the API is currently unavailable.
              Please check back later or try the Country mode.
            </p>
          </div>
        ) : error || !capitaleData?.capital ? (
          <ErrorDisplay error={error || 'No data available'} />
        ) : (
          <CapitalDisplay capital={capitaleData.capital} />
        )
      )}
    </div>
  );
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
      <p className="text-red-400 mb-2">Error: {error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-2 px-4 py-2 bg-red-500/20 rounded-lg text-red-300 hover:bg-red-500/30 transition"
      >
        Retry
      </button>
    </div>
  );
}

function CountryDisplay({ country }: { country: CountryData }) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700/50">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">{country.country}</h2>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full mb-6">
          <span className="text-emerald-400 font-semibold">🌍 Today&apos;s Country</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <InfoCard label="Continent" value={country.continent} />
        <InfoCard label="Hemisphere" value={country.hemisphere} />
        <InfoCard label="Population" value={country.population.toLocaleString()} />
        <InfoCard label="Surface Area" value={`${country.surface.toLocaleString()} km²`} />
        <InfoCard label="Avg. Temperature" value={`${country.avgTemperature.toFixed(1)}°C`} />
        <InfoCard label="Coordinates" value={country.coordinates} />
      </div>
    </div>
  );
}

function CapitalDisplay({ capital }: { capital: CapitalData }) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700/50">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-2">{capital.capital}</h2>
        <p className="text-xl text-slate-400 mb-4">{capital.country}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full mb-6">
          <span className="text-orange-400 font-semibold">🏛️ Today&apos;s Capital</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <InfoCard label="Continent" value={capital.continent} />
        <InfoCard label="Population" value={capital.population.toLocaleString()} />
        <InfoCard label="Surface Area" value={`${capital.surface.toLocaleString()} km²`} />
        <InfoCard label="Avg. Temperature" value={`${capital.avgTemperature.toFixed(1)}°C`} />
        <InfoCard label="Elevation" value={`${capital.height} m`} />
        <InfoCard label="Coordinates" value={capital.coordinates} />
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
