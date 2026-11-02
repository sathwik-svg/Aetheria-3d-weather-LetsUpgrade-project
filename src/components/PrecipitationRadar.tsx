/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { LocationData, WeatherConditionType } from '../types/weather';
import { Play, Pause, RotateCcw, Radio } from 'lucide-react';

interface PrecipitationRadarProps {
  location: LocationData;
  condition: WeatherConditionType;
}

export const PrecipitationRadar: React.FC<PrecipitationRadarProps> = ({ location, condition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const isRaining = condition === 'rain' || condition === 'thunderstorm' || condition === 'drizzle';
    const isSnowing = condition === 'snow';

    // Seeded random echo blobs centered near the location
    const rainBlobs = [
      { x: 120, y: 90, r: 35, intensity: 45 },
      { x: 160, y: 130, r: 45, intensity: isRaining ? 55 : 20 },
      { x: 90, y: 140, r: 25, intensity: 30 },
      { x: 200, y: 80, r: 30, intensity: isRaining ? 50 : 15 },
    ];

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(cx, cy) - 10;

      // Clear dark radar map background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Range rings
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let r = 25; r <= maxR; r += 28) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Compass crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, 10);
      ctx.lineTo(cx, height - 10);
      ctx.moveTo(10, cy);
      ctx.lineTo(width - 10, cy);
      ctx.stroke();

      // Draw radar reflectivity blobs
      rainBlobs.forEach((blob) => {
        // Blob drift animation
        const currentBlobX = blob.x + Math.sin(angle * 0.5) * 6;
        const currentBlobY = blob.y + Math.cos(angle * 0.5) * 4;

        const radGrad = ctx.createRadialGradient(
          currentBlobX, currentBlobY, 2,
          currentBlobX, currentBlobY, blob.r
        );

        if (isSnowing) {
          radGrad.addColorStop(0, 'rgba(147, 197, 253, 0.75)'); // Soft cyan/blue
          radGrad.addColorStop(0.7, 'rgba(96, 165, 250, 0.35)');
          radGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
        } else if (blob.intensity > 45) {
          radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)'); // Red heavy core
          radGrad.addColorStop(0.4, 'rgba(234, 179, 8, 0.7)'); // Yellow
          radGrad.addColorStop(0.7, 'rgba(34, 197, 94, 0.45)'); // Green
          radGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
        } else {
          radGrad.addColorStop(0, 'rgba(34, 197, 94, 0.65)'); // Light rain green
          radGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.35)');
          radGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        }

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(currentBlobX, currentBlobY, blob.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rotating Radar Beam Sweep
      const sweepGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      sweepGradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      sweepGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxR, -0.25, 0);
      ctx.closePath();
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // Leading beam ray
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(maxR, 0);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.restore();

      // Center Station Marker
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlaying) {
        angle += 0.035;
        if (angle > Math.PI * 2) angle -= Math.PI * 2;
        setSweepAngle(Math.round((angle / (Math.PI * 2)) * 360));
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [condition, isPlaying]);

  return (
    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col md:flex-row items-center gap-4">
      {/* Radar Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 shrink-0">
        <canvas
          ref={canvasRef}
          width={240}
          height={200}
          className="block w-[240px] h-[200px]"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[10px] font-mono text-sky-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
          <Radio className="w-3 h-3 text-sky-400" />
          <span>LIVE DOPPLER</span>
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded">
          {sweepAngle}° AZIMUTH
        </div>
      </div>

      {/* Radar Info & Controls */}
      <div className="flex-1 w-full flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Simulated Precipitation Radar
            </h3>
            <span className="text-xs text-slate-400 font-mono-numbers">
              {location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Real-time multi-angle sweep projecting rain band reflectivity and cloud moisture saturation within a 50 km radius of {location.name}.
          </p>
        </div>

        {/* Reflectivity Scale Legend */}
        <div className="my-2">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Light (20 dBZ)</span>
            <span>Moderate (40 dBZ)</span>
            <span>Intense (65 dBZ)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-red-500" />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              {isPlaying ? <Pause className="w-3 h-3 text-sky-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
              <span>{isPlaying ? 'Pause' : 'Play Sweep'}</span>
            </button>
            <button
              onClick={() => setSweepAngle(0)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset Radar Sweep"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            Scan Interval: 2.5s
          </span>
        </div>
      </div>
    </div>
  );
};
