/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HourlyForecast, TemperatureUnit, WeatherConditionType } from '../types/weather';
import { Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, Umbrella, Wind } from 'lucide-react';

interface HourlyTimelineProps {
  hourly: HourlyForecast[];
  selectedHour: number;
  onSelectHour: (hour: number) => void;
  unit: TemperatureUnit;
}

export const HourlyTimeline: React.FC<HourlyTimelineProps> = ({
  hourly,
  selectedHour,
  onSelectHour,
  unit,
}) => {
  const formatTemp = (val: number) => {
    if (unit === 'fahrenheit') {
      return Math.round((val * 9) / 5 + 32);
    }
    return Math.round(val);
  };

  const getConditionIcon = (type: WeatherConditionType, isDay: boolean) => {
    switch (type) {
      case 'clear':
        return <Sun className={`w-4 h-4 ${isDay ? 'text-amber-400' : 'text-blue-300'}`} />;
      case 'partly-cloudy':
        return <CloudSun className="w-4 h-4 text-sky-300" />;
      case 'overcast':
        return <Cloud className="w-4 h-4 text-slate-300" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="w-4 h-4 text-sky-400" />;
      case 'thunderstorm':
        return <CloudLightning className="w-4 h-4 text-amber-300" />;
      case 'snow':
        return <Snowflake className="w-4 h-4 text-blue-200" />;
      case 'fog':
        return <CloudFog className="w-4 h-4 text-slate-300" />;
      default:
        return <CloudSun className="w-4 h-4 text-sky-300" />;
    }
  };

  return (
    <div className="w-full">
      {/* Header & Interactive Scrub Slider */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
        <div>
          <h2 className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
            24-Hour Timeline & Solar Scrubber
          </h2>
          <p className="text-xs text-slate-400">
            Drag the scrubber to reposition the 3D Sun / Moon light in real time
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Hour:</span>
          <span className="text-xs font-bold text-sky-400 font-mono-numbers">
            {selectedHour.toString().padStart(2, '0')}:00
          </span>
          <input
            type="range"
            min="0"
            max="23"
            value={selectedHour}
            onChange={(e) => onSelectHour(parseInt(e.target.value, 10))}
            className="w-28 sm:w-36 accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Horizontal Scrollable Hourly Cards */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {hourly.map((h) => {
          const isSelected = selectedHour === h.hour;

          return (
            <button
              key={h.time}
              onClick={() => onSelectHour(h.hour)}
              className={`flex flex-col items-center p-2.5 min-w-[72px] rounded-xl border transition-all text-center shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-sky-950/80 border-sky-400 shadow-md ring-1 ring-sky-400/40'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              {/* Time Label */}
              <span className={`text-xs font-medium mb-1.5 font-mono-numbers ${isSelected ? 'text-sky-300' : 'text-slate-400'}`}>
                {h.formattedHour}
              </span>

              {/* Weather Icon */}
              <div className="my-1">
                {getConditionIcon(h.conditionType, h.isDay)}
              </div>

              {/* Temp */}
              <span className="text-sm font-bold text-white font-mono-numbers my-1">
                {formatTemp(h.temp)}°
              </span>

              {/* Rain Pop */}
              <div className="flex items-center gap-1 text-[11px] text-sky-400 mt-1">
                {h.precipitationProb > 0 ? (
                  <>
                    <Umbrella className="w-2.5 h-2.5" />
                    <span className="font-mono-numbers">{h.precipitationProb}%</span>
                  </>
                ) : (
                  <span className="text-slate-600 font-mono-numbers">0%</span>
                )}
              </div>

              {/* Wind Speed */}
              <div className="flex items-center gap-0.5 text-[10px] text-slate-500 mt-0.5">
                <Wind className="w-2.5 h-2.5 text-slate-500" />
                <span className="font-mono-numbers">{h.windSpeed}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
