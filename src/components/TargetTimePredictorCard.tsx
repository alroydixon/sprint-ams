'use client';

import { useState, useMemo, useEffect } from 'react';
import { calculateHorizontalForce } from '@/lib/biomechanics';
import { formatMark, parseMarkInput } from '@/lib/disciplines';
import { Target, Zap } from 'lucide-react';

export default function TargetTimePredictorCard({
  eventName,
  distanceM,
  actualTimeS,
  actualVelocityMs,
  actualForceN,
  actualPowerW,
  effectiveWeightKg,
  discipline = 'sprints',
}: {
  eventName: string;
  distanceM: number;
  actualTimeS: number;
  actualVelocityMs: number;
  actualForceN: number;
  actualPowerW: number;
  effectiveWeightKg: number;
  discipline?: string | null;
}) {
  const [targetTimeInput, setTargetTimeInput] = useState('');

  useEffect(() => {
    if (actualTimeS > 0) {
      const improved = +(actualTimeS * 0.98).toFixed(2);
      setTargetTimeInput(
        improved < 60 ? improved.toFixed(2) : formatMark(improved, 'sprints').replace('s', '')
      );
    }
  }, [actualTimeS]);

  const targetSeconds = parseMarkInput(targetTimeInput);

  const predicted = useMemo(() => {
    if (!distanceM || !targetSeconds || targetSeconds <= 0 || isNaN(targetSeconds)) return null;
    const velocityMs = +(distanceM / targetSeconds).toFixed(2);
    const velocityKmh = +(velocityMs * 3.6).toFixed(1);
    const force = calculateHorizontalForce(effectiveWeightKg, distanceM, targetSeconds);
    const powerW = force ? +(force.forceN * velocityMs).toFixed(1) : 0;
    return { velocityMs, velocityKmh, force, powerW };
  }, [distanceM, targetSeconds, effectiveWeightKg]);

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
            <Target className="w-4 h-4" /> Target Time Velocity &amp; Force Predictor ({eventName})
          </h3>
          <p className="text-slate-400 mt-0.5">
            Enter a target time (e.g. <span className="font-mono text-white">10.85</span> or{' '}
            <span className="font-mono text-white">1:52.00</span>) to see required m/s and horizontal force
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[1, 2, 3, 5].map((pct) => {
            const preset = +(actualTimeS * (1 - pct / 100)).toFixed(2);
            const label =
              preset < 60 ? preset.toFixed(2) : formatMark(preset, 'sprints').replace('s', '');
            return (
              <button
                key={pct}
                type="button"
                onClick={() => setTargetTimeInput(label)}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-semibold transition"
              >
                -{pct}% ({formatMark(preset, discipline)})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-slate-300 block mb-1 font-bold">Potential Target Time</label>
          <input
            type="text"
            value={targetTimeInput}
            onChange={(e) => setTargetTimeInput(e.target.value)}
            placeholder="e.g. 10.85 or 1:52.00"
            className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg p-2.5 text-emerald-300 font-mono text-sm font-bold"
          />
        </div>

        {predicted?.force && (
          <>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block">Required Velocity</span>
              <strong className="text-lg text-emerald-400 font-mono block">
                {predicted.velocityMs} m/s
              </strong>
              <span className="text-[10px] text-emerald-300 font-mono">
                {predicted.velocityMs >= actualVelocityMs ? '+' : ''}
                {(predicted.velocityMs - actualVelocityMs).toFixed(2)} m/s ({predicted.velocityKmh} km/h)
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Required Horizontal Force
              </span>
              <strong className="text-lg text-amber-300 font-mono block">
                {predicted.force.forceN} N
              </strong>
              <span className="text-[10px] text-amber-200 font-mono">
                {predicted.force.forceN >= actualForceN ? '+' : ''}
                {(predicted.force.forceN - actualForceN).toFixed(1)} N ({predicted.force.forcePerKg} N/kg)
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block">Required Power Output</span>
              <strong className="text-lg text-sky-400 font-mono block">
                {predicted.powerW} W
              </strong>
              <span className="text-[10px] text-sky-300 font-mono">
                {predicted.powerW >= actualPowerW ? '+' : ''}
                {(predicted.powerW - actualPowerW).toFixed(1)} W (
                {(predicted.powerW / effectiveWeightKg).toFixed(2)} W/kg)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
