/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DailyForecast, TemperatureUnit, WeatherConditionType } from '../types/weather';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  CloudFog, 
  CloudDrizzle,
  Umbrella
} from 'lucide-react';

interface ForecastCarouselProps {
  daily: DailyForecast[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  unit: TemperatureUnit;
}

export const ForecastCarousel: React.FC<ForecastCarouselProps> = ({
  daily,
  selectedDayIndex,
  onSelectDay,
  unit,
}) => {
  const formatTemp = (val: number) => {
    if (unit === 'fahrenheit') {
      return Math.round((val * 9) / 5 + 32);
    }
    return Math.round(val);
  };

  const getConditionIcon = (type: WeatherConditionType) => {
    switch (type) {
      case 'clear':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'partly-cloudy':
        return <CloudSun className="w-5 h-5 text-sky-300" />;
      case 'overcast':
        return <Cloud className="w-5 h-5 text-slate-300" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-sky-400" />;
      case 'drizzle':
        return <CloudDrizzle className="w-5 h-5 text-sky-300" />;
      case 'thunderstorm':
        return <CloudLightning className="w-5 h-5 text-amber-300" />;
      case 'snow':
        return <Snowflake className="w-5 h-5 text-blue-200" />;
      case 'fog':
        return <CloudFog className="w-5 h-5 text-slate-300" />;
      default:
        return <CloudSun className="w-5 h-5 text-sky-300" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
          7-Day Forecast & Floating Island Switcher
        </h2>
        <span className="text-xs text-slate-500">
          Click any day to morph the 3D weather island
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {daily.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;

          return (
            <button
              key={day.date}
              onClick={() => onSelectDay(idx)}
              className={`p-3 rounded-xl text-left transition-all duration-200 border relative group cursor-pointer ${
                isSelected
                  ? 'bg-sky-950/70 border-sky-400/80 shadow-lg ring-1 ring-sky-400/50'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
              }`}
            >
              {/* Day Name & Date */}
              <div className="flex items-baseline justify-between mb-2">
                <span className={`text-sm font-bold ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                  {day.dayName}
                </span>
                <span className="text-xs text-slate-500 font-mono-numbers">{day.shortDate}</span>
              </div>

              {/* Weather Icon & Condition */}
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  {getConditionIcon(day.conditionType)}
                </div>
                <span className="text-xs font-medium text-slate-300 truncate">
                  {day.conditionLabel}
                </span>
              </div>

              {/* Temp Min / Max */}
              <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/60 text-xs">
                <span className="font-extrabold text-white font-mono-numbers">
                  {formatTemp(day.tempMax)}°
                </span>
                <span className="text-slate-400 font-mono-numbers">
                  {formatTemp(day.tempMin)}°
                </span>
              </div>

              {/* Rain Probability Bar */}
              {day.precipitationProb > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-sky-400">
                  <Umbrella className="w-3 h-3 shrink-0" />
                  <span className="font-mono-numbers">{day.precipitationProb}%</span>
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden ml-1">
                    <div 
                      className="h-full bg-sky-400 rounded-full" 
                      style={{ width: `${day.precipitationProb}%` }} 
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
