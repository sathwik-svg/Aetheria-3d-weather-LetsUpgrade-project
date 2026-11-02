/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { LocationData, TemperatureUnit } from '../types/weather';
import { POPULAR_LOCATIONS, searchLocations } from '../services/weatherService';
import { Search, MapPin, KeyRound, Maximize2, Minimize2, Loader2, Sparkles } from 'lucide-react';

interface TopNavProps {
  currentLocation: LocationData;
  onSelectLocation: (loc: LocationData) => void;
  unit: TemperatureUnit;
  onToggleUnit: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  onOpenApiKeyModal: () => void;
  isOwmActive: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentLocation,
  onSelectLocation,
  unit,
  onToggleUnit,
  isZenMode,
  onToggleZenMode,
  onOpenApiKeyModal,
  isOwmActive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced geocoding search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (loc: LocationData) => {
    onSelectLocation(loc);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-6 px-4 md:px-8 py-3.5 bg-slate-950/85 border-b border-slate-800/80 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400 transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap font-display">
            Aetheria <span className="font-light text-sky-400">3D</span>
          </span>
        </a>
      </div>

      {/* Zone 2: Search input & quick presets */}
      <div className="flex items-center gap-3 flex-1 max-w-xl relative" ref={searchContainerRef}>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : <Search className="w-4 h-4" />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.length >= 2) setIsDropdownOpen(true);
            }}
            placeholder="Search worldwide city or airport (e.g. Kyoto, Oslo, Cairo)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs md:text-sm bg-slate-900/90 text-slate-100 placeholder-slate-400 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-400 transition-colors"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
            {searchResults.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelectResult(loc)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                    {loc.name}
                    {loc.region ? `, ${loc.region}` : ''}
                  </span>
                  <span className="text-xs text-slate-500">· {loc.country}</span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {loc.lat.toFixed(1)}°, {loc.lon.toFixed(1)}°
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Quick popular city shortcuts on wide screens */}
        <div className="hidden xl:flex items-center gap-1.5 shrink-0 text-xs text-slate-400">
          {POPULAR_LOCATIONS.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectLocation(p)}
              className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                currentLocation.name === p.name
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Zone 3: 1 primary action cluster (Unit toggle, API key, Zen mode) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Unit Toggle */}
        <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-700 text-xs font-semibold">
          <button
            onClick={unit === 'fahrenheit' ? onToggleUnit : undefined}
            className={`px-2.5 py-1 rounded-md transition-all ${
              unit === 'celsius'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            °C
          </button>
          <button
            onClick={unit === 'celsius' ? onToggleUnit : undefined}
            className={`px-2.5 py-1 rounded-md transition-all ${
              unit === 'fahrenheit'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            °F
          </button>
        </div>

        {/* API Key Modal Button */}
        <button
          onClick={onOpenApiKeyModal}
          title="OpenWeatherMap API Key Settings"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
            isOwmActive
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isOwmActive ? 'OWM Live' : 'API Key'}</span>
        </button>

        {/* Zen Mode Button */}
        <button
          onClick={onToggleZenMode}
          title={isZenMode ? 'Exit Zen Mode (Show Controls)' : 'Enter Zen Mode (Full 3D View)'}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          aria-label="Toggle Zen Mode"
        >
          {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
