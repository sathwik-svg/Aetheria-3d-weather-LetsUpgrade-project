/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { WeatherConditionType } from '../types/weather';
import { WeatherIslandEngine } from '../three/weatherIslandScene';
import { RotateCw, Compass, Sun, Moon } from 'lucide-react';

interface ThreeWeatherSceneProps {
  condition: WeatherConditionType;
  isDay: boolean;
  selectedHour?: number;
  locationName: string;
}

export const ThreeWeatherScene: React.FC<ThreeWeatherSceneProps> = ({
  condition,
  isDay,
  selectedHour = 12,
  locationName,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WeatherIslandEngine | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isSceneLoaded, setIsSceneLoaded] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<boolean>(false);

  // Initialize Three.js once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    try {
      const engine = new WeatherIslandEngine({
        container: mountRef.current,
        onSceneReady: () => {
          setIsSceneLoaded(true);
        },
      });
      engineRef.current = engine;

      // Initial weather state apply
      engine.updateWeatherState(condition, isDay, selectedHour);
    } catch (err) {
      console.error('Failed to initialize WebGL Three.js scene:', err);
      setWebglError(true);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []); // Only on mount

  // Smoothly update weather conditions when props change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateWeatherState(condition, isDay, selectedHour);
    }
  }, [condition, isDay, selectedHour]);

  // Glide camera when location changes
  useEffect(() => {
    if (engineRef.current && isSceneLoaded) {
      engineRef.current.triggerGlideAnimation();
    }
  }, [locationName]);

  const toggleAutoRotate = () => {
    const nextState = !autoRotate;
    setAutoRotate(nextState);
    if (engineRef.current) {
      engineRef.current.setAutoRotate(nextState);
    }
  };

  const handleResetCamera = () => {
    if (engineRef.current) {
      engineRef.current.resetCamera();
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* WebGL Fallback if hardware fails */}
      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-200 p-6 text-center">
          <div className="max-w-md p-6 bg-slate-800 border border-slate-700 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-2">3D Hardware Acceleration Unavailable</h3>
            <p className="text-sm text-slate-400">
              Your browser or graphics environment doesn't support WebGL2 hardware acceleration. The weather forecast and analytics are fully operational below.
            </p>
          </div>
        </div>
      )}

      {/* Subtle Camera / Scene Quick Actions (Top Right, non-occluding) */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={toggleAutoRotate}
          title={autoRotate ? 'Pause 3D Orbit' : 'Resume 3D Orbit'}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg"
          aria-label="Toggle Island Orbit"
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? 'text-sky-400' : 'text-slate-400'}`} />
        </button>

        <button
          onClick={handleResetCamera}
          title="Reset 3D View Angle"
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg"
          aria-label="Reset 3D Camera Angle"
        >
          <Compass className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* Ambient Lighting Indicator (Quiet pill-less text) */}
      <div className="absolute bottom-4 left-6 z-10 pointer-events-none hidden md:flex items-center gap-2 text-xs font-medium text-white/50">
        {isDay ? <Sun className="w-3.5 h-3.5 text-amber-400/80" /> : <Moon className="w-3.5 h-3.5 text-blue-300/80" />}
        <span>{isDay ? 'Daylight Solar Rig' : 'Lunar Atmosphere'}</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono-numbers">Hour {selectedHour.toString().padStart(2, '0')}:00</span>
      </div>
    </div>
  );
};
