/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ClothingRecommendation, SevereWeatherAlert } from '../types/weather';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Umbrella, 
  Glasses, 
  Wind, 
  Sparkles,
  Info
} from 'lucide-react';

interface WeatherAdvisoryProps {
  alerts: SevereWeatherAlert[];
  clothing: ClothingRecommendation;
}

export const WeatherAdvisory: React.FC<WeatherAdvisoryProps> = ({ alerts, clothing }) => {
  const getGearIcon = (iconName: string) => {
    switch (iconName) {
      case 'umbrella':
        return <Umbrella className="w-4 h-4 text-sky-400" />;
      case 'glasses':
        return <Glasses className="w-4 h-4 text-amber-400" />;
      case 'wind':
        return <Wind className="w-4 h-4 text-sky-300" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {/* 1. Meteorological Alert / Advisory Ribbon */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Meteorological Advisories
            </h3>
            <span className="text-xs text-slate-400">Regional Sync</span>
          </div>

          <div className="space-y-2.5 my-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-xs ${
                  alert.severity === 'warning'
                    ? 'bg-red-950/40 border-red-500/40 text-red-200'
                    : alert.id === 'alert-calm'
                    ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    {alert.id === 'alert-calm' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {alert.title}
                  </span>
                  <span className="text-[11px] font-mono-numbers opacity-80">{alert.effectiveTime}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {alert.description}
                </p>
                <div className="text-[10px] mt-1.5 opacity-70">
                  Authority: {alert.issuer}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400">
          <span>Activity Guidance: </span>
          <span className="text-slate-200">{clothing.activityAdvice}</span>
        </div>
      </div>

      {/* 2. Contextual Clothing & Gear Suggestions */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Clothing & Gear Guidance
            </h3>
            <span className="text-xs text-sky-400 font-medium">Smart Advisory</span>
          </div>

          <p className="text-xs text-slate-300 font-medium mb-3">
            {clothing.headline}
          </p>

          <div className="space-y-2">
            {clothing.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 text-xs"
              >
                <div className="p-1.5 rounded-md bg-slate-700/50 shrink-0 mt-0.5">
                  {getGearIcon(item.icon)}
                </div>
                <div>
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
          Calculated from real-time ambient temperature, rain likelihood, UV index, and wind velocity.
        </div>
      </div>
    </div>
  );
};
