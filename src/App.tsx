/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { LocationData, TemperatureUnit, WeatherDataPayload, WeatherConditionType } from './types/weather';
import { POPULAR_LOCATIONS, fetchWeatherData, getSavedOwmApiKey } from './services/weatherService';
import { ThreeWeatherScene } from './components/ThreeWeatherScene';
import { TopNav } from './components/TopNav';
import { HeroWeatherCard } from './components/HeroWeatherCard';
import { ControlDock } from './components/ControlDock';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [location, setLocation] = useState<LocationData>(POPULAR_LOCATIONS[0]); // Tokyo default
  const [weatherData, setWeatherData] = useState<WeatherDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [unit, setUnit] = useState<TemperatureUnit>('celsius');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isOwmActive, setIsOwmActive] = useState<boolean>(false);

  // Load weather data
  const loadWeather = useCallback(async (loc: LocationData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchWeatherData(loc);
      setWeatherData(data);
      // Set hour to current local hour of data
      const currentHour = new Date(data.current.timestamp).getHours();
      setSelectedHour(currentHour);
      setSelectedDayIndex(0);
      setIsOwmActive(data.dataSource === 'OpenWeatherMap');
    } catch (err: unknown) {
      console.error('Failed to load weather data', err);
      const msg = err instanceof Error ? err.message : 'Unable to connect to meteorological service';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWeather(location);
  }, [location, loadWeather]);

  // Check saved OWM key status
  useEffect(() => {
    setIsOwmActive(Boolean(getSavedOwmApiKey()));
  }, []);

  // Keyboard shortcuts (H = toggle dock, Z = toggle zen mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed(prev => !prev);
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZenMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate active visual condition for the 3D scene
  // If user selected a forecast day > 0, reflect that day's weather island!
  let activeCondition: WeatherConditionType = 'clear';
  let isDayTime = true;

  if (weatherData) {
    if (selectedDayIndex === 0) {
      // If user scrubbed the hour timeline, find that hour's condition if available
      const matchingHour = weatherData.hourly.find(h => h.hour === selectedHour);
      if (matchingHour) {
        activeCondition = matchingHour.conditionType;
        isDayTime = matchingHour.isDay;
      } else {
        activeCondition = weatherData.current.conditionType;
        isDayTime = weatherData.current.isDay;
      }
    } else if (weatherData.daily[selectedDayIndex]) {
      // Forecast day island condition
      activeCondition = weatherData.daily[selectedDayIndex].conditionType;
      isDayTime = true; // Daily forecast shown in daylight presentation
    }
  }

  const handleSelectLocation = (loc: LocationData) => {
    setLocation(loc);
  };

  const handleToggleUnit = () => {
    setUnit(prev => (prev === 'celsius' ? 'fahrenheit' : 'celsius'));
  };

  const handleSelectDay = (index: number) => {
    setSelectedDayIndex(index);
    if (index === 0 && weatherData) {
      setSelectedHour(new Date(weatherData.current.timestamp).getHours());
    } else {
      setSelectedHour(13); // Midday for future forecast days
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Full-Bleed Three.js 3D Weather Island Scene */}
      <ThreeWeatherScene
        condition={activeCondition}
        isDay={isDayTime}
        selectedHour={selectedHour}
        locationName={location.name}
      />

      {/* 2. Top Navigation Bar (Hidden in Zen Mode) */}
      {!isZenMode && (
        <TopNav
          currentLocation={location}
          onSelectLocation={handleSelectLocation}
          unit={unit}
          onToggleUnit={handleToggleUnit}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(true)}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          isOwmActive={isOwmActive}
        />
      )}

      {/* 3. Hero Weather Card (Hidden in Zen Mode) */}
      {!isZenMode && weatherData && (
        <HeroWeatherCard
          current={weatherData.current}
          location={location}
          unit={unit}
          dataSource={weatherData.dataSource}
        />
      )}

      {/* 4. Collapsible Bottom Control Dock (Hidden in Zen Mode) */}
      {!isZenMode && weatherData && (
        <ControlDock
          daily={weatherData.daily}
          hourly={weatherData.hourly}
          current={weatherData.current}
          astronomical={weatherData.astronomical}
          location={location}
          alerts={weatherData.alerts}
          clothing={weatherData.clothing}
          unit={unit}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={handleSelectDay}
          selectedHour={selectedHour}
          onSelectHour={setSelectedHour}
          isCollapsed={isDockCollapsed}
          onToggleCollapse={() => setIsDockCollapsed(prev => !prev)}
        />
      )}

      {/* Zen Mode Restore Pill */}
      {isZenMode && (
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={() => setIsZenMode(false)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl shadow-2xl text-xs font-medium transition-colors"
          >
            <span>Exit Zen Mode</span>
          </button>
        </div>
      )}

      {/* Initial Loading Overlay */}
      {isLoading && !weatherData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <span className="text-sm font-medium text-slate-200">
              Gathering atmospheric data for {location.name}...
            </span>
          </div>
        </div>
      )}

      {/* Error Recovery Card */}
      {errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 p-4 max-w-md w-full bg-red-950/90 border border-red-500/60 rounded-2xl shadow-2xl text-xs text-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-white text-sm mb-1">Connection Issue</div>
              <p className="leading-relaxed mb-3">{errorMessage}</p>
              <button
                onClick={() => loadWeather(location)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/60 hover:bg-red-800/80 text-white rounded-lg border border-red-500/40 font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OpenWeatherMap API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={() => loadWeather(location)}
      />
    </div>
  );
}
