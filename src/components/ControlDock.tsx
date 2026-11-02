/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DailyForecast, 
  HourlyForecast, 
  CurrentWeather, 
  AstronomicalData, 
  LocationData,
  SevereWeatherAlert,
  ClothingRecommendation,
  TemperatureUnit,
} from '../types/weather';
import { ForecastCarousel } from './ForecastCarousel';
import { HourlyTimeline } from './HourlyTimeline';
import { AstronomicalWidget } from './AstronomicalWidget';
import { AtmosphericGauges } from './AtmosphericGauges';
import { PrecipitationRadar } from './PrecipitationRadar';
import { WeatherAdvisory } from './WeatherAdvisory';
import { 
  CalendarDays, 
  Clock, 
  Gauge, 
  Radar, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

interface ControlDockProps {
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  current: CurrentWeather;
  astronomical: AstronomicalData;
  location: LocationData;
  alerts: SevereWeatherAlert[];
  clothing: ClothingRecommendation;
  unit: TemperatureUnit;
  selectedDayIndex: number;
  onSelectDay: (idx: number) => void;
  selectedHour: number;
  onSelectHour: (hour: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type DockTab = 'forecast' | 'hourly' | 'gauges' | 'radar';

export const ControlDock: React.FC<ControlDockProps> = ({
  daily,
  hourly,
  current,
  astronomical,
  location,
  alerts,
  clothing,
  unit,
  selectedDayIndex,
  onSelectDay,
  selectedHour,
  onSelectHour,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('forecast');

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-5xl px-3 sm:px-6 pointer-events-none select-none transition-transform duration-300">
      <div className="pointer-events-auto">
        {/* Dock Header Bar with Collapse Button */}
        <div className="flex items-center justify-between mb-1.5 px-2">
          {/* Functional Tab Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/90 rounded-xl border border-slate-800/90 shadow-xl overflow-x-auto max-w-[calc(100%-140px)] scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('forecast');
                if (isCollapsed) onToggleCollapse();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'forecast' && !isCollapsed
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>7-Day Islands</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('hourly');
                if (isCollapsed) onToggleCollapse();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'hourly' && !isCollapsed
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>24h Timeline</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('gauges');
                if (isCollapsed) onToggleCollapse();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'gauges' && !isCollapsed
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Atmosphere</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('radar');
                if (isCollapsed) onToggleCollapse();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'radar' && !isCollapsed
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Radar & Gear</span>
            </button>
          </div>

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-950/90 hover:bg-slate-900 border border-slate-800/90 rounded-xl shadow-xl transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? 'Expand Weather Dock (Shortcut: H)' : 'Collapse Dock into Zen View'}
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-4 h-4 text-sky-400" />
                <span>Show Deck</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-400" />
                <span>Hide Dock</span>
              </>
            )}
          </button>
        </div>

        {/* Expandable Deck Content Container */}
        {!isCollapsed && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-2xl overflow-hidden max-h-[46vh] sm:max-h-[50vh] overflow-y-auto">
            {activeTab === 'forecast' && (
              <ForecastCarousel
                daily={daily}
                selectedDayIndex={selectedDayIndex}
                onSelectDay={onSelectDay}
                unit={unit}
              />
            )}

            {activeTab === 'hourly' && (
              <div className="space-y-4">
                <HourlyTimeline
                  hourly={hourly}
                  selectedHour={selectedHour}
                  onSelectHour={onSelectHour}
                  unit={unit}
                />
                <AstronomicalWidget
                  astronomical={astronomical}
                  sunriseStr={current.sunrise}
                  sunsetStr={current.sunset}
                />
              </div>
            )}

            {activeTab === 'gauges' && (
              <AtmosphericGauges current={current} />
            )}

            {activeTab === 'radar' && (
              <div className="space-y-4">
                <PrecipitationRadar location={location} condition={current.conditionType} />
                <WeatherAdvisory alerts={alerts} clothing={clothing} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
