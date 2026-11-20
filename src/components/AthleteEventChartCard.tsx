'use client';

import { useState, useEffect } from 'react';
import { calculateTargetSplits } from '@/lib/biomechanics';
import { isFieldDiscipline, formatMark } from '@/lib/disciplines';
import { Maximize2, X } from 'lucide-react';

const IMPROVEMENT_OPTIONS = [0.15, 0.25, 0.5, 1, 2];

export default function AthleteEventChartCard({
  event,
  evRaces,
  wellnessByDate,
  discipline = 'sprints',
}: {
  event: string;
  evRaces: any[];
  wellnessByDate: Map<string, any>;
  discipline?: string | null;
}) {
  const [goalPct, setGoalPct] = useState<number>(0.5);
  const [expanded, setExpanded] = useState<boolean>(false);
  const isField = isFieldDiscipline(discipline);

  useEffect(() => {
    if (!expanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expanded]);

  const marks = evRaces.map((r) => Number(r.time_seconds));
  const pb = isField ? Math.max(...marks) : Math.min(...marks);
  const sp = calculateTargetSplits(pb);
  const customGoal = isField
    ? +(pb * (1 + goalPct / 100)).toFixed(2)
    : +(pb * (1 - goalPct / 100)).toFixed(2);

  const highVal = Math.max(...marks, customGoal) + (isField ? 0.25 : 0.25);
  const lowVal = Math.min(...marks, customGoal) - (isField ? 0.25 : 0.15);
  const width = Math.max(360, evRaces.length * 64);

  function computeY(val: number) {
    // For field events, higher mark is plotted higher (smaller Y); for track times, faster (lower) time is plotted higher
    const ratio = isField
      ? (highVal - val) / (highVal - lowVal || 1)
      : (val - lowVal) / (highVal - lowVal || 1);
    return 26 + ratio * 80;
  }

  function renderChartSvg(large: boolean) {
    const svgWidth = large ? Math.max(720, evRaces.length * 80) : width;
    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} 145`} className={`w-full ${large ? 'h-72 sm:h-80' : 'h-36'} bg-slate-900 rounded p-2`}>
          {evRaces.length > 1 && (
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth={large ? '2.5' : '2'}
              points={evRaces
                .map((r, i) => {
                  const x = 36 + (i / (evRaces.length - 1)) * (svgWidth - 72);
                  return `${x},${computeY(Number(r.time_seconds))}`;
                })
                .join(' ')}
            />
          )}
          {evRaces.map((r, i) => {
            const x = evRaces.length === 1 ? svgWidth / 2 : 36 + (i / (evRaces.length - 1)) * (svgWidth - 72);
            const y = computeY(Number(r.time_seconds));
            const w = wellnessByDate.get(r.race_date);
            const metaLabel = w ? `R:${w.composite_score} RPE:${w.session_rpe}` : '';

            return (
              <g key={r.id}>
                <circle cx={x} cy={y} r={large ? '4.5' : '3.5'} fill="#34d399" />
                <text x={x} y={y - 14} fontSize={large ? '9.5' : '8'} fontWeight="bold" fill="#f8fafc" textAnchor="middle">
                  {formatMark(Number(r.time_seconds), discipline)}
                </text>
                {metaLabel && (
                  <text x={x} y={y - 5} fontSize={large ? '8' : '7'} fill="#fbbf24" textAnchor="middle">
                    {metaLabel}
                  </text>
                )}
                <text x={x} y={132} fontSize={large ? '8.5' : '7.5'} fill="#94a3b8" textAnchor="middle">
                  {large ? r.race_date : r.race_date.slice(2)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  function renderSplitsBar(large: boolean) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`grid ${isField ? 'grid-cols-4' : 'grid-cols-5'} gap-1.5 text-center ${large ? 'text-xs p-2.5' : 'text-[10px] p-1.5'} bg-slate-900 rounded items-center`}
      >
        {isField ? (
          <>
            <div><span className="text-slate-500 block">95% Mark</span>{(pb * 0.95).toFixed(2)}m</div>
            <div><span className="text-slate-500 block">90% Mark</span>{(pb * 0.90).toFixed(2)}m</div>
            <div><span className="text-slate-500 block">85% Mark</span>{(pb * 0.85).toFixed(2)}m</div>
          </>
        ) : (
          <>
            <div><span className="text-slate-500 block">95%</span>{formatMark(sp.effort95, discipline)}</div>
            <div><span className="text-slate-500 block">90%</span>{formatMark(sp.effort90, discipline)}</div>
            <div><span className="text-slate-500 block">80%</span>{formatMark(sp.effort80, discipline)}</div>
            <div><span className="text-slate-500 block">70%</span>{formatMark(sp.effort70, discipline)}</div>
          </>
        )}
        <div className="bg-emerald-950/60 border border-emerald-700/60 rounded py-0.5 px-1">
          <select
            value={goalPct}
            onChange={(e) => setGoalPct(Number(e.target.value))}
            aria-label="Improvement percentage"
            className={`bg-transparent text-emerald-400 font-semibold ${large ? 'text-xs' : 'text-[10px]'} focus:outline-none cursor-pointer`}
          >
            {IMPROVEMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-slate-900 text-white">
                +{opt}% Goal
              </option>
            ))}
          </select>
          <strong className="block text-emerald-300">{formatMark(customGoal, discipline)}</strong>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setExpanded(true)}
        title="Click to expand graph"
        className="bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-3 space-y-2 cursor-pointer transition group"
      >
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
            {event} Progression
            <Maximize2 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition" />
          </span>
          <span className="font-semibold text-white">PB: {formatMark(pb, discipline)}</span>
        </div>
        {renderChartSvg(false)}
        {renderSplitsBar(false)}
      </div>

      {expanded && (
        <div onClick={(e) => { e.stopPropagation(); setExpanded(false); }} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-400">{event} Progression — Expanded View</h3>
                <p className="text-xs text-slate-400">
                  Personal Best: <strong className="text-white">{formatMark(pb, discipline)}</strong> • {evRaces.length} recorded {isField ? 'mark' : 'race'}{evRaces.length > 1 ? 's' : ''} (Click outside to close)
                </p>
              </div>
              <button type="button" onClick={() => setExpanded(false)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderChartSvg(true)}
            {renderSplitsBar(true)}
          </div>
        </div>
      )}
    </>
  );
}
