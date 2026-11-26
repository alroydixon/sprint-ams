'use client';

import { formatMark } from '@/lib/disciplines';

export default function RaceForceMetricsCard({
  selectedRace,
  actualTimeS,
  actualMetrics,
  effectiveWeightKg,
  discipline = 'sprints',
}: {
  selectedRace: any;
  actualTimeS: number;
  actualMetrics: {
    velocityMs: number;
    velocityKmh: number;
    force: { forceN: number; forcePerKg: number } | null;
    powerW: number;
  } | null;
  effectiveWeightKg: number;
  discipline?: string | null;
}) {
  if (!selectedRace || !actualMetrics?.force) {
    return (
      <p className="text-slate-500 py-4 text-center">
        Select an athlete with logged track races to analyze velocity and force.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
        <span className="text-slate-400 block">Selected Performance</span>
        <strong className="text-xl text-white font-mono block mt-1">
          {formatMark(actualTimeS, discipline)}
        </strong>
        <span className="text-[10px] text-slate-400">
          {selectedRace.race_date} • {selectedRace.meet_name || 'Meet'}
        </span>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
        <span className="text-slate-400 block">Average Velocity</span>
        <strong className="text-xl text-emerald-400 font-mono block mt-1">
          {actualMetrics.velocityMs} m/s
        </strong>
        <span className="text-[10px] text-slate-400">{actualMetrics.velocityKmh} km/h</span>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
        <span className="text-slate-400 block">Horizontal Force Produced</span>
        <strong className="text-xl text-amber-300 font-mono block mt-1">
          {actualMetrics.force.forceN} N
        </strong>
        <span className="text-[10px] text-amber-200/80 font-mono">
          {actualMetrics.force.forcePerKg} N/kg • {effectiveWeightKg} kg
        </span>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
        <span className="text-slate-400 block">Mean Mechanical Power</span>
        <strong className="text-xl text-sky-400 font-mono block mt-1">
          {actualMetrics.powerW} W
        </strong>
        <span className="text-[10px] text-slate-400 font-mono">
          {(actualMetrics.powerW / effectiveWeightKg).toFixed(2)} W/kg
        </span>
      </div>
    </div>
  );
}
