'use client';

import { useState, useEffect, useRef } from 'react';
import { formatPopulation, formatTemperature, type CountryData } from '@/lib/clientApi';

interface ArchiveEntry {
  gameNumber: number;
  date: string;
  apiDate: string;
  country: CountryData;
  scrapedAt: string;
}

interface ArchiveData {
  [dateKey: string]: ArchiveEntry;
}

export default function Archive() {
  const [archive, setArchive] = useState<ArchiveData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const fetchedRef = useRef(false);

  // Get today's date in YYYY-MM-DD format (IST)
  const getTodayIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  // Get min date (first game: 2022-11-15)
  const getMinDate = () => {
    return '2022-11-15';
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadArchive() {
      try {
        const response = await fetch(`/countryle-helper/archive.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch archive');
        
        const data: ArchiveData = await response.json();
        setArchive(data);
        
        // Get available dates sorted newest first
        const dates = Object.keys(data).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setAvailableDates(dates);
        
        // Set today as default selection
        const today = getTodayIST();
        if (data[today]) {
          setSelectedDate(today);
          setSelectedEntry(data[today]);
        } else if (dates.length > 0) {
          // Select the most recent available date
          setSelectedDate(dates[0]);
          setSelectedEntry(data[dates[0]]);
        }
      } catch (e) {
        console.error('Archive load error:', e);
        setError('Failed to load archive. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadArchive();
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (archive[date]) {
      setSelectedEntry(archive[date]);
    } else {
      setSelectedEntry(null);
    }
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleDateChange(e.target.value);
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Loading archive...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Archive</h2>
        <p className="text-slate-400 text-sm">Select a date to view the Countryle answer for that day</p>
      </div>

      {/* Date Selector */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Calendar Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={getMinDate()}
              max={getTodayIST()}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Quick Date Select */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Quick Select
            </label>
            <select
              value={selectedDate}
              onChange={handleDateSelect}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">-- Select a date --</option>
              {availableDates.slice(0, 30).map(date => (
                <option key={date} value={date}>
                  {formatDisplayDate(date)} - Game #{archive[date]?.gameNumber}
                </option>
              ))}
              {availableDates.length > 30 && (
                <option disabled>... and {availableDates.length - 30} more dates</option>
              )}
            </select>
          </div>
        </div>

        {/* Archive Stats */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <span>📊 Total entries: <span className="text-white font-semibold">{Object.keys(archive).length}</span></span>
            <span>📅 From: <span className="text-white">{availableDates[availableDates.length - 1] || 'N/A'}</span></span>
            <span>📅 To: <span className="text-white">{availableDates[0] || 'N/A'}</span></span>
          </div>
        </div>
      </div>

      {/* Selected Date Answer */}
      {selectedEntry ? (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-6 py-4 border-b border-slate-700/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-slate-400 text-sm">Game #{selectedEntry.gameNumber}</p>
                <h3 className="text-xl font-bold text-white">{formatDisplayDate(selectedEntry.date)}</h3>
              </div>
              <div className="px-4 py-2 bg-emerald-500/30 rounded-xl">
                <span className="text-2xl font-bold text-white">{selectedEntry.country.country}</span>
              </div>
            </div>
          </div>

          {/* Country Details */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Continent */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Continent</p>
                <p className="text-white font-semibold text-lg">{selectedEntry.country.continent}</p>
              </div>

              {/* Hemisphere */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Hemisphere</p>
                <p className={`font-semibold text-lg ${
                  selectedEntry.country.hemisphere === 'North Hemisphere' ? 'text-blue-400' : 'text-orange-400'
                }`}>
                  {selectedEntry.country.hemisphere}
                </p>
              </div>

              {/* Population */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Population</p>
                <p className="text-white font-semibold text-lg">{formatPopulation(selectedEntry.country.population)}</p>
                <p className="text-slate-500 text-xs">{selectedEntry.country.population?.toLocaleString()}</p>
              </div>

              {/* Temperature */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Avg Temperature</p>
                <p className="text-white font-semibold text-lg">{formatTemperature(selectedEntry.country.avgTemperature)}</p>
              </div>

              {/* Surface Area */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Surface Area</p>
                <p className="text-white font-semibold text-lg">{selectedEntry.country.surface?.toLocaleString()} km²</p>
              </div>

              {/* Coordinates */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Coordinates</p>
                <p className="text-white font-semibold text-lg">{selectedEntry.country.coordinates}</p>
              </div>
            </div>

            {/* Additional Stats */}
            {(selectedEntry.country.PIB || selectedEntry.country.percentOfRenewableE || selectedEntry.country.maxAltitude) && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Additional Data</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {selectedEntry.country.PIB && (
                    <div>
                      <span className="text-slate-500">GDP per capita:</span>
                      <span className="text-white ml-2">${selectedEntry.country.PIB.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedEntry.country.percentOfRenewableE && (
                    <div>
                      <span className="text-slate-500">Renewable Energy:</span>
                      <span className="text-white ml-2">{selectedEntry.country.percentOfRenewableE}%</span>
                    </div>
                  )}
                  {selectedEntry.country.maxAltitude && (
                    <div>
                      <span className="text-slate-500">Max Altitude:</span>
                      <span className="text-white ml-2">{selectedEntry.country.maxAltitude.toLocaleString()}m</span>
                    </div>
                  )}
                  {selectedEntry.country.coastlineLength && (
                    <div>
                      <span className="text-slate-500">Coastline:</span>
                      <span className="text-white ml-2">{selectedEntry.country.coastlineLength.toLocaleString()} km</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Google Maps Link */}
            {selectedEntry.country.mapsUrl && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <a
                  href={selectedEntry.country.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition"
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
      ) : selectedDate ? (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8 text-center">
          <p className="text-slate-400">
            No data available for {formatDisplayDate(selectedDate)}
          </p>
          <p className="text-slate-500 text-sm mt-2">
            This date may not have a game or hasn't been scraped yet.
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8 text-center">
          <p className="text-slate-400">Select a date to view the answer</p>
        </div>
      )}

      {/* Recent Answers Table */}
      {availableDates.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Answers</h3>
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Date</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Game #</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Country</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-semibold text-sm">Continent</th>
                  </tr>
                </thead>
                <tbody>
                  {availableDates.slice(0, 20).map(date => {
                    const entry = archive[date];
                    const isSelected = date === selectedDate;
                    return (
                      <tr
                        key={date}
                        onClick={() => handleDateChange(date)}
                        className={`border-t border-slate-700/50 cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-emerald-500/20' 
                            : 'hover:bg-slate-700/30'
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-300 text-sm">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">#{entry?.gameNumber}</td>
                        <td className="px-4 py-3 text-white font-semibold">{entry?.country?.country}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-slate-600/50 rounded text-slate-300 text-xs">
                            {entry?.country?.continent}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
