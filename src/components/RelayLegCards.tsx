'use client';

import { AssignedRelayLeg, RelayCandidate, RelayFormat } from '@/lib/relayCalculator';
import { ShieldAlert } from 'lucide-react';

export function formatRelayTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  const rem = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${mins}:${rem}`;
}

export default function RelayLegCards({
  format,
  candidates,
  legIds,
  assignedLegs,
  rawSum,
  exchangeSavings,
  predictedTotal,
  isComplete,
  onLegChange,
}: {
  format: RelayFormat;
  candidates: RelayCandidate[];
  legIds: (string | '')[];
  assignedLegs: AssignedRelayLeg[];
  rawSum: number;
  exchangeSavings: number;
  predictedTotal: number;
  isComplete: boolean;
  onLegChange: (legIndex: number, athleteId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Projected Relay Time Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">
            Predicted {format} Relay Time
          </span>
          <p className="text-3xl font-mono font-bold text-white mt-1">
            {isComplete ? formatRelayTime(predictedTotal) : 'Select 4 Runners'}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
            Raw Sum of 4 Individual PBs
          </span>
          <p className="text-2xl font-mono font-bold text-slate-200 mt-1">
            {rawSum > 0 ? formatRelayTime(rawSum) : '—'}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold block">
            Net Baton Exchange Savings
          </span>
          <p className="text-2xl font-mono font-bold text-amber-300 mt-1">
            -{exchangeSavings.toFixed(2)}s
          </p>
        </div>
      </div>

      {/* 4 Interactive Relay Leg Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignedLegs.map((leg, idx) => (
          <div key={leg.legNumber} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-emerald-400 font-bold text-sm">{leg.roleTitle}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{leg.roleTip}</p>
              </div>
              {leg.candidate && (
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">Est. Leg Split</span>
                  <strong className="font-mono text-base text-emerald-300">{leg.predictedSplit.toFixed(2)}s</strong>
                </div>
              )}
            </div>

            <select
              value={legIds[idx]}
              onChange={(e) => onLegChange(idx, e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
            >
              <option value="">-- Select Runner for Leg {leg.legNumber} --</option>
              {candidates.map((c) => (
                <option key={c.athlete.id} value={c.athlete.id}>
                  {c.athlete.full_name} ({c.ageBand}) — {format === '4x100m' ? '100m' : '400m'} PB: {c.pbSeconds.toFixed(2)}s
                  {c.isInjured ? ' [INJURED]' : ''}
                </option>
              ))}
            </select>

            {leg.candidate && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-wrap justify-between items-center gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Standing PB:</span>{' '}
                  <strong className="text-white font-mono">{leg.candidate.pbSeconds.toFixed(2)}s</strong>
                  {leg.candidate.readinessScore && (
                    <span className="ml-2 text-slate-400">
                      • Readiness: <strong className="text-emerald-400">{leg.candidate.readinessScore}/50</strong>
                    </span>
                  )}
                  {leg.candidate.isInjured && (
                    <span className="ml-2 inline-flex items-center gap-1 text-rose-400 font-semibold">
                      <ShieldAlert className="w-3 h-3" /> Injured
                    </span>
                  )}
                </div>

                {leg.checkMarkMetres && leg.checkMarkSteps && (
                  <div className="text-amber-300 font-semibold">
                    Check-Mark: <strong>{leg.checkMarkMetres}m</strong> (~{leg.checkMarkSteps} shoe steps)
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
