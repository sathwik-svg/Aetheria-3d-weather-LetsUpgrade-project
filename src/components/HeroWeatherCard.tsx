/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CurrentWeather, LocationData, TemperatureUnit } from '../types/weather';
import { 
  CloudSun, 
  Sun, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  CloudFog, 
  Cloud, 
  CloudDrizzle,
  ArrowUp, 
  ArrowDown, 
  Wind, 
  Droplets,
  Clock
} from 'lucide-react';

interface HeroWeatherCardProps {
  current: CurrentWeather;
  location: LocationData;
  unit: TemperatureUnit;
  dataSource: string;
}

export const HeroWeatherCard: React.FC<HeroWeatherCardProps> = ({
  current,
  location,
  unit,
  dataSource,
}) => {
  const formatTemp = (val: number) => {
    if (unit === 'fahrenheit') {
      return Math.round((val * 9) / 5 + 32);
    }
    return Math.round(val);
  };

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case 'clear':
        return <Sun className="w-8 h-8 text-amber-400" />;
      case 'partly-cloudy':
        return <CloudSun className="w-8 h-8 text-sky-300" />;
      case 'overcast':
        return <Cloud className="w-8 h-8 text-slate-300" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-sky-400" />;
      case 'drizzle':
        return <CloudDrizzle className="w-8 h-8 text-sky-300" />;
      case 'thunderstorm':
        return <CloudLightning className="w-8 h-8 text-amber-300" />;
      case 'snow':
        return <Snowflake className="w-8 h-8 text-blue-200" />;
      case 'fog':
        return <CloudFog className="w-8 h-8 text-slate-300" />;
      default:
        return <CloudSun className="w-8 h-8 text-sky-300" />;
    }
  };

  return (
    <div className="absolute top-20 left-4 md:left-8 z-30 pointer-events-auto select-none max-w-sm sm:max-w-md">
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-2xl backdrop-blur-none">
        {/* Location & Local Time */}
        <div className="flex items-baseline justify-between gap-4 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display truncate">
            {location.name}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono shrink-0">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{current.localTime}</span>
          </div>
        </div>

        {/* Unboxed Country & Region Metadata (Zero-Pill Rule) */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <span>{location.region ? `${location.region}, ` : ''}{location.country}</span>
          <span aria-hidden="true">·</span>
          <span>Feed: {dataSource}</span>
        </div>

        {/* Main Temperature & Condition Row */}
        <div className="flex items-center justify-between gap-4 my-2">
          <div className="flex items-start">
            <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight font-display font-mono-numbers">
              {formatTemp(current.temp)}
            </span>
            <span className="text-2xl font-light text-sky-400 mt-1">
              °{unit === 'celsius' ? 'C' : 'F'}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              {getWeatherIcon(current.conditionType)}
            </div>
            <span className="text-sm font-semibold text-slate-200 text-right">
              {current.conditionLabel}
            </span>
            <span className="text-xs text-slate-400 text-right capitalize">
              {current.conditionDescription}
            </span>
          </div>
        </div>

        {/* Secondary Metrics Strip (Unboxed metadata with separators) */}
        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Feels</span>
            <span className="font-semibold text-white font-mono-numbers">{formatTemp(current.feelsLike)}°</span>
          </div>

          <span aria-hidden="true" className="text-slate-600">·</span>

          <div className="flex items-center gap-1">
            <ArrowUp className="w-3 h-3 text-emerald-400" />
            <span className="font-mono-numbers">{formatTemp(current.tempMax)}°</span>
            <ArrowDown className="w-3 h-3 text-sky-400 ml-1" />
            <span className="font-mono-numbers">{formatTemp(current.tempMin)}°</span>
          </div>

          <span aria-hidden="true" className="text-slate-600">·</span>

          <div className="flex items-center gap-1 text-slate-300">
            <Droplets className="w-3 h-3 text-sky-400" />
            <span className="font-mono-numbers">{current.humidity}%</span>
          </div>

          <span aria-hidden="true" className="text-slate-600">·</span>

          <div className="flex items-center gap-1 text-slate-300">
            <Wind className="w-3 h-3 text-sky-400" />
            <span className="font-mono-numbers">{current.windSpeed} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
