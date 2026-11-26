'use client';

import { useState, useMemo, useEffect } from 'react';
import { calculateHorizontalForce } from '@/lib/biomechanics';
import { formatMark } from '@/lib/disciplines';
import { Timer, Zap, Scale } from 'lucide-react';

const PRESET_DISTANCES = Array.of(30, 60, 100, 150, 200, 300, 400, 800, 1500);

export default function VelocityToTimeCard({
  defaultDistanceM = 100,
  defaultVelocityMs = 8.5,
  effectiveWeightKg,
  discipline = 'sprints',
}: {
  defaultDistanceM?: number;
  defaultVelocityMs?: number;
  effectiveWeightKg: number;
  discipline?: string | null;
}) {
  const [distanceInput, setDistanceInput] = useState<string>(String(defaultDistanceM || 100));
  const [velocityInput, setVelocityInput] = useState<string>(String(defaultVelocityMs || 8.5));
  const [simWeightInput, setSimWeightInput] = useState<string>(String(effectiveWeightKg || 60));

  useEffect(() => {
    if (defaultDistanceM > 0) setDistanceInput(String(defaultDistanceM));
  }, [defaultDistanceM]);

  useEffect(() => {
    if (defaultVelocityMs > 0) setVelocityInput(String(defaultVelocityMs));
  }, [defaultVelocityMs]);

  useEffect(() => {
    if (effectiveWeightKg > 0) setSimWeightInput(String(effectiveWeightKg));
  }, [effectiveWeightKg]);

  const distM = parseFloat(distanceInput);
  const velMs = parseFloat(velocityInput);
  const simWeightKg = parseFloat(simWeightInput);

  const result = useMemo(() => {
    if (!distM || distM <= 0 || !velMs || velMs <= 0 || isNaN(distM) || isNaN(velMs)) return null;
    const predictedTimeS = +(distM / velMs).toFixed(2);
    const speedKmh = +(velMs * 3.6).toFixed(1);
    const force = calculateHorizontalForce(effectiveWeightKg, distM, predictedTimeS);
    const powerW = force ? +(force.forceN * velMs).toFixed(1) : 0;

    let weightSim: {
      newTimeS: number;
      deltaTimeS: number;
      newVelMs: number;
      newForcePerKg: number;
    } | null = null;

    if (force && force.forceN > 0 && simWeightKg > 0 && !isNaN(simWeightKg)) {
      // Constant Force F = m_new * (2d / t_new^2)  =>  t_new = sqrt(2 * d * m_new / F)
      const newTimeS = +Math.sqrt((2 * distM * simWeightKg) / force.forceN).toFixed(2);
      const deltaTimeS = +(newTimeS - predictedTimeS).toFixed(2);
      const newVelMs = +(distM / newTimeS).toFixed(2);
      const newForcePerKg = +(force.forceN / simWeightKg).toFixed(2);
      weightSim = { newTimeS, deltaTimeS, newVelMs, newForcePerKg };
    }

    return { predictedTimeS, speedKmh, force, powerW, weightSim };
  }, [distM, velMs, effectiveWeightKg, simWeightKg]);

  return (
    <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm text-sky-400 flex items-center gap-1.5">
            <Timer className="w-4 h-4" /> Velocity (m/s) &rarr; Predicted Time &amp; Body Mass Simulator
          </h3>
          <p className="text-slate-400 mt-0.5">
            Enter a target velocity in <span className="font-mono text-white">m/s</span> and distance to compute predicted time, or simulate how a body weight change affects time at constant force
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {PRESET_DISTANCES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDistanceInput(String(d))}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                Number(distanceInput) === d
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-slate-300 block mb-1 font-bold">Distance (m)</label>
          <input
            type="number"
            step="1"
            min="1"
            value={distanceInput}
            onChange={(e) => setDistanceInput(e.target.value)}
            placeholder="e.g. 100"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm font-bold"
          />
        </div>

        <div>
          <label className="text-slate-300 block mb-1 font-bold">Input Velocity (m/s)</label>
          <input
            type="number"
            step="0.01"
            min="0.1"
            value={velocityInput}
            onChange={(e) => setVelocityInput(e.target.value)}
            placeholder="e.g. 9.25"
            className="w-full bg-slate-950 border border-sky-500/50 rounded-lg p-2.5 text-sky-300 font-mono text-sm font-bold"
          />
        </div>

        {result?.force && (
          <>
            <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3">
              <span className="text-slate-400 block">Predicted Time ({distM}m)</span>
              <strong className="text-xl text-emerald-400 font-mono block">
                {formatMark(result.predictedTimeS, discipline)}
              </strong>
              <span className="text-[10px] text-slate-400 font-mono">
                {result.predictedTimeS.toFixed(2)}s • {result.speedKmh} km/h
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Baseline Force ({effectiveWeightKg} kg)
              </span>
              <strong className="text-lg text-amber-300 font-mono block">
                {result.force.forceN} N ({result.force.forcePerKg} N/kg)
              </strong>
              <span className="text-[10px] text-sky-300 font-mono">
                {result.powerW} W ({(result.powerW / effectiveWeightKg).toFixed(2)} W/kg)
              </span>
            </div>
          </>
        )}
      </div>

      {/* Body Weight What-If Simulator at Constant Force */}
      {result?.force && result.weightSim && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div>
            <label className="text-slate-300 font-bold flex items-center gap-1 mb-1">
              <Scale className="w-3.5 h-3.5 text-amber-400" /> Simulate Body Weight (kg) at {result.force.forceN} N
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="25"
                value={simWeightInput}
                onChange={(e) => setSimWeightInput(e.target.value)}
                className="w-28 bg-slate-900 border border-amber-500/40 rounded-lg p-2 text-amber-300 font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setSimWeightInput(String(+(effectiveWeightKg - 2).toFixed(1)))}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-semibold"
              >
                -2 kg
              </button>
              <button
                type="button"
                onClick={() => setSimWeightInput(String(+(effectiveWeightKg + 2).toFixed(1)))}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-semibold"
              >
                +2 kg
              </button>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block">Simulated Time at {simWeightKg} kg</span>
            <strong className="text-lg text-white font-mono">
              {formatMark(result.weightSim.newTimeS, discipline)}
            </strong>{' '}
            <span
              className={`font-mono font-bold text-xs ${
                result.weightSim.deltaTimeS < 0
                  ? 'text-emerald-400'
                  : result.weightSim.deltaTimeS > 0
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              ({result.weightSim.deltaTimeS > 0 ? '+' : ''}
              {result.weightSim.deltaTimeS.toFixed(2)}s)
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">New Relative Force &amp; Velocity</span>
            <strong className="text-amber-300 font-mono">
              {result.weightSim.newForcePerKg} N/kg
            </strong>{' '}
            <span className="text-sky-300 font-mono">• {result.weightSim.newVelMs} m/s</span>
          </div>
        </div>
      )}
    </div>
  );
}
