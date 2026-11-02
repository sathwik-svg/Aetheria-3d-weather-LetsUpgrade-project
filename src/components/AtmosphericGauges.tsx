/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CurrentWeather } from '../types/weather';
import { Compass, Sun, Wind, Gauge, Eye, Thermometer } from 'lucide-react';

interface AtmosphericGaugesProps {
  current: CurrentWeather;
}

export const AtmosphericGauges: React.FC<AtmosphericGaugesProps> = ({ current }) => {
  const getUvCategory = (uv: number) => {
    if (uv <= 2) return { label: 'Low', color: 'text-emerald-400', bar: 'bg-emerald-400' };
    if (uv <= 5) return { label: 'Moderate', color: 'text-yellow-400', bar: 'bg-yellow-400' };
    if (uv <= 7) return { label: 'High', color: 'text-orange-400', bar: 'bg-orange-400' };
    if (uv <= 10) return { label: 'Very High', color: 'text-red-400', bar: 'bg-red-400' };
    return { label: 'Extreme', color: 'text-purple-400', bar: 'bg-purple-400' };
  };

  const getAqiCategory = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'text-emerald-400', bar: 'bg-emerald-400' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-400', bar: 'bg-yellow-400' };
    if (aqi <= 150) return { label: 'Unhealthy (Sensitive)', color: 'text-orange-400', bar: 'bg-orange-400' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-400', bar: 'bg-red-400' };
    return { label: 'Hazardous', color: 'text-purple-400', bar: 'bg-purple-400' };
  };

  const uvMeta = getUvCategory(current.uvIndex);
  const aqiMeta = getAqiCategory(current.aqi);

  // Approximate dew point using Magnus formula
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * current.temp) / (b + current.temp)) + Math.log(current.humidity / 100);
  const dewPoint = Math.round((b * alpha) / (a - alpha));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. UV Index */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            UV Index
          </span>
          <span className={`text-xs font-bold ${uvMeta.color}`}>{uvMeta.label}</span>
        </div>

        <div className="my-1">
          <div className="text-2xl font-extrabold text-white font-mono-numbers">
            {current.uvIndex.toFixed(1)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {current.uvIndex >= 6 ? 'Sunscreen & hat advised' : 'Safe for normal outdoor exposure'}
          </p>
        </div>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full ${uvMeta.bar} rounded-full`}
            style={{ width: `${Math.min((current.uvIndex / 12) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* 2. Air Quality Index (AQI) */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            Air Quality
          </span>
          <span className={`text-xs font-bold ${aqiMeta.color}`}>{aqiMeta.label}</span>
        </div>

        <div className="my-1">
          <div className="text-2xl font-extrabold text-white font-mono-numbers">
            {current.aqi} <span className="text-xs font-normal text-slate-400">AQI</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {current.aqi <= 50 ? 'Clean air quality ideal for sports' : 'Elevated particulate pollution'}
          </p>
        </div>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full ${aqiMeta.bar} rounded-full`}
            style={{ width: `${Math.min((current.aqi / 200) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* 3. Wind Vector & 360° Compass */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            Wind Compass
          </span>
          <span className="text-xs font-mono-numbers text-slate-400">{current.windDeg}°</span>
        </div>

        <div className="flex items-center gap-3 my-1">
          {/* Compass Dial */}
          <div className="relative w-11 h-11 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
            <span className="absolute top-0.5 text-[8px] font-bold text-slate-400">N</span>
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-500"
              style={{ transform: `rotate(${current.windDeg}deg)` }}
            >
              <Compass className="w-6 h-6 text-sky-400" />
            </div>
          </div>

          <div>
            <div className="text-lg font-bold text-white font-mono-numbers">
              {current.windSpeed} <span className="text-xs font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Gusts: <span className="font-mono-numbers text-slate-200">{current.windGust} km/h</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 truncate">
          {current.windSpeed > 30 ? 'Breezy to fresh gale' : 'Light to gentle breeze'}
        </div>
      </div>

      {/* 4. Barometric Pressure & Visibility */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            Atmosphere
          </span>
          <span className="text-xs font-mono-numbers text-slate-400">{current.pressure} hPa</span>
        </div>

        <div className="space-y-1.5 my-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Visibility:</span>
            <span className="font-semibold text-slate-200 font-mono-numbers">{current.visibility} km</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Dew Point:</span>
            <span className="font-semibold text-slate-200 font-mono-numbers flex items-center gap-0.5">
              <Thermometer className="w-3 h-3 text-sky-400" />
              {dewPoint}°C
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Cloud Density:</span>
            <span className="font-semibold text-slate-200 font-mono-numbers">{current.cloudsPercent}%</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          {current.pressure >= 1013 ? 'High pressure (Fair)' : 'Low pressure (Precipitation risk)'}
        </div>
      </div>
    </div>
  );
};
