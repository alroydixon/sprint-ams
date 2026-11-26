'use client';

import { useMemo } from 'react';
import { calculateHorizontalForce, calculatePower } from '@/lib/biomechanics';
import { Zap, Ruler, Activity } from 'lucide-react';

export default function AthleteBiomechanicsGraphs({ tests }: { tests: any[] }) {
  const sortedTests = useMemo(() => {
    return [...(tests || [])].sort((a, b) =>
      (a.test_date || '').localeCompare(b.test_date || '')
    );
  }, [tests]);

  const powerSeries = useMemo(() => {
    return sortedTests
      .map((t) => {
        const bw = Number(t.body_weight_kg);
        const pu = Number(t.pushups_1min_reps) || 0;
        const su = Number(t.situps_1min_reps) || 0;
        const sj = Number(t.squat_jumps_1min_reps) || 0;
        if (!bw || (pu === 0 && su === 0 && sj === 0)) return null;
        const p = calculatePower(bw, pu, su, sj);
        return {
          id: t.id,
          date: t.test_date,
          totalW: p.totalW,
          totalWPerKg: p.totalWPerKg,
        };
      })
      .filter((item): item is { id: string; date: string; totalW: number; totalWPerKg: number } => item !== null);
  }, [sortedTests]);

  const forceSeries = useMemo(() => {
    return sortedTests
      .map((t) => {
        const t20 = Number(t.sprint_20m_sec ?? t.sprint_20m_s);
        const t40 = Number(t.sprint_40m_sec ?? t.sprint_40m_s);
        if (!Number(t.body_weight_kg) || !t20 || !t40) {
          return null;
        }
        const f = calculateHorizontalForce(Number(t.body_weight_kg), t20, t40);
        if (!f) return null;
        return {
          id: t.id,
          date: t.test_date,
          forceN: f.forceN,
          forcePerKg: f.forcePerKg,
        };
      })
      .filter((item): item is { id: string; date: string; forceN: number; forcePerKg: number } => item !== null);
  }, [sortedTests]);

  const heightSeries = useMemo(() => {
    return sortedTests
      .filter((t) => Number(t.height_cm) > 0)
      .map((t, idx, arr) => {
        const h = Number(t.height_cm);
        const prevH = idx > 0 ? Number(arr[idx - 1].height_cm) : h;
        const stepGain = idx > 0 ? +(h - prevH).toFixed(1) : 0;
        return {
          id: t.id,
          date: t.test_date,
          heightCm: h,
          stepGain,
        };
      });
  }, [sortedTests]);

  if (powerSeries.length === 0 && forceSeries.length === 0 && heightSeries.length === 0) return null;

  const maxPower = Math.max(100, ...powerSeries.map((p) => p.totalW));
  const maxForce = Math.max(100, ...forceSeries.map((f) => f.forceN));
  const minHeight = heightSeries.length > 0 ? Math.min(...heightSeries.map((h) => h.heightCm)) - 3 : 140;
  const maxHeight = heightSeries.length > 0 ? Math.max(...heightSeries.map((h) => h.heightCm)) + 1 : 200;
  const heightSpan = Math.max(4, maxHeight - minHeight);

  const totalGrowth =
    heightSeries.length >= 2
      ? +(heightSeries.at(-1)!.heightCm - heightSeries.at(0)!.heightCm).toFixed(1)
      : 0;
  const hasRecentGrowthSpurt = heightSeries.some((h) => h.stepGain >= 2.0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      {powerSeries.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div>
            <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Total Power Progression
            </h4>
            <p className="text-[11px] text-slate-400">
              Latest: <strong className="text-white">{powerSeries.at(-1)!.totalW} W</strong> (
              <strong className="text-emerald-300">{powerSeries.at(-1)!.totalWPerKg} W/kg</strong>)
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="h-40 flex items-end gap-2.5 pt-6 overflow-x-auto">
              {powerSeries.map((item) => {
                const pct = Math.max(15, Math.round((item.totalW / maxPower) * 100));
                return (
                  <div
                    key={item.id}
                    className="flex-1 min-w-[46px] h-full flex flex-col items-center justify-end gap-1"
                  >
                    <span className="text-[10px] font-mono font-bold text-emerald-300">
                      {item.totalW}W
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {item.totalWPerKg} W/kg
                    </span>
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400"
                    />
                    <span className="text-[10px] font-mono text-slate-400">
                      {(item.date || '').slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {forceSeries.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div>
            <h4 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Horizontal Force Progression
            </h4>
            <p className="text-[11px] text-slate-400">
              Latest: <strong className="text-white">{forceSeries.at(-1)!.forceN} N</strong> (
              <strong className="text-amber-300">{forceSeries.at(-1)!.forcePerKg} N/kg</strong>)
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="h-40 flex items-end gap-2.5 pt-6 overflow-x-auto">
              {forceSeries.map((item) => {
                const pct = Math.max(15, Math.round((item.forceN / maxForce) * 100));
                return (
                  <div
                    key={item.id}
                    className="flex-1 min-w-[46px] h-full flex flex-col items-center justify-end gap-1"
                  >
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      {item.forceN}N
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {item.forcePerKg} N/kg
                    </span>
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400"
                    />
                    <span className="text-[10px] font-mono text-slate-400">
                      {(item.date || '').slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {heightSeries.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm text-sky-400 flex items-center gap-1.5">
                <Ruler className="w-4 h-4" /> Height &amp; Growth Development
              </h4>
              <p className="text-[11px] text-slate-400">
                Current: <strong className="text-white">{heightSeries.at(-1)!.heightCm} cm</strong>
                {totalGrowth > 0 && (
                  <span className="text-emerald-400 font-semibold"> (+{totalGrowth} cm total)</span>
                )}
              </p>
            </div>
            {hasRecentGrowthSpurt && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                Growth Spurt Alert (&ge;2 cm)
              </span>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="h-40 flex items-end gap-2.5 pt-6 overflow-x-auto">
              {heightSeries.map((item) => {
                const pct = Math.max(18, Math.round(((item.heightCm - minHeight) / heightSpan) * 100));
                return (
                  <div
                    key={item.id}
                    className="flex-1 min-w-[46px] h-full flex flex-col items-center justify-end gap-1"
                  >
                    <span className="text-[10px] font-mono font-bold text-sky-300">
                      {item.heightCm}cm
                    </span>
                    {item.stepGain > 0 && (
                      <span className="text-[9px] font-mono text-emerald-400">
                        +{item.stepGain}
                      </span>
                    )}
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-sky-600 to-sky-400"
                    />
                    <span className="text-[10px] font-mono text-slate-400">
                      {(item.date || '').slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
