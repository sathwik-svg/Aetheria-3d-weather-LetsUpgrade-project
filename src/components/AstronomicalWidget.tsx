/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AstronomicalData } from '../types/weather';
import { Sunrise, Sunset, Sun, Moon } from 'lucide-react';

interface AstronomicalWidgetProps {
  astronomical: AstronomicalData;
  sunriseStr: string;
  sunsetStr: string;
}

export const AstronomicalWidget: React.FC<AstronomicalWidgetProps> = ({
  astronomical,
  sunriseStr,
  sunsetStr,
}) => {
  const formatIsoTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '--:--';
    }
  };

  const daylightHours = Math.floor(astronomical.daylightTotalMinutes / 60);
  const daylightMins = astronomical.daylightTotalMinutes % 60;

  const remainingHours = Math.floor(astronomical.daylightRemainingMinutes / 60);
  const remainingMins = astronomical.daylightRemainingMinutes % 60;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {/* 1. Solar Elevation Arc & Daylight Progress */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Solar Path & Daylight
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono-numbers">
            {astronomical.isSunAboveHorizon ? `${astronomical.sunAltitudePercent}% Altitude` : 'Below Horizon'}
          </span>
        </div>

        {/* Visual Solar Arc Canvas / SVG */}
        <div className="relative h-20 my-2 flex items-center justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 80">
            {/* Horizon Line */}
            <line x1="10" y1="70" x2="190" y2="70" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            
            {/* Sun Trajectory Arc */}
            <path
              d="M 20 70 A 80 55 0 0 1 180 70"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
            />

            {/* Active Daylight Fill Arc */}
            <path
              d="M 20 70 A 80 55 0 0 1 180 70"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="260"
              strokeDashoffset={260 - (260 * (astronomical.daylightProgressPercent / 100))}
            />

            {/* Sun Position Dot */}
            {astronomical.isSunAboveHorizon && (
              <circle
                cx={20 + 160 * (astronomical.daylightProgressPercent / 100)}
                cy={70 - Math.sin((astronomical.daylightProgressPercent / 100) * Math.PI) * 55}
                r="6"
                fill="#fbbf24"
                stroke="#fff"
                strokeWidth="2"
              />
            )}
          </svg>
        </div>

        {/* Sunrise & Sunset Timings */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Sunrise className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Sunrise</span>
              <span className="font-semibold font-mono-numbers">{formatIsoTime(sunriseStr)}</span>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            <div>Total: {daylightHours}h {daylightMins}m</div>
            <div className="text-sky-400 font-medium">
              {astronomical.isSunAboveHorizon ? `${remainingHours}h ${remainingMins}m left` : 'Night Cycle'}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Sunset className="w-4 h-4 text-orange-400" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400">Sunset</span>
              <span className="font-semibold font-mono-numbers">{formatIsoTime(sunsetStr)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Lunar Phase Visualizer */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-blue-300" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Lunar Phase & Illumination
            </h3>
          </div>
          <span className="text-xs text-sky-400 font-mono-numbers font-medium">
            {astronomical.moonIlluminationPercent}% Lit
          </span>
        </div>

        <div className="flex items-center gap-4 my-2">
          {/* Moon Graphic Disk */}
          <div className="relative w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            <div 
              className="absolute inset-0 bg-blue-100/90 rounded-full transition-all duration-300"
              style={{
                clipPath: `polygon(0 0, ${astronomical.moonIlluminationPercent}% 0, ${astronomical.moonIlluminationPercent}% 100%, 0 100%)`
              }}
            />
            {/* Crater shadows */}
            <div className="w-3 h-3 rounded-full bg-slate-400/20 absolute top-3 left-4" />
            <div className="w-2 h-2 rounded-full bg-slate-400/20 absolute bottom-3 right-4" />
          </div>

          {/* Phase Details */}
          <div className="flex flex-col justify-center">
            <span className="text-base font-bold text-white mb-0.5">
              {astronomical.moonPhaseName}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synodic lunar cycle at {(astronomical.moonPhaseFraction * 100).toFixed(1)}% orbit. 
              {astronomical.moonIlluminationPercent > 80 ? ' Bright natural nighttime illumination.' : ' Minimal nocturnal light glare.'}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>Current Azimuth</span>
          <span className="font-mono-numbers text-slate-200">{astronomical.sunAzimuthDeg}° Vector</span>
        </div>
      </div>
    </div>
  );
};
