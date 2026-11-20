'use client';

import { Trophy, Dumbbell, HeartPulse, Timer, Calendar } from 'lucide-react';

export type AthleteTab = 'races' | 'training' | 'wellness' | 'meetday';

export default function AthleteDateAndTabsBar({
  activeBlock,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  applyQuickRange,
  tab,
  setTab,
}: {
  activeBlock: any;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  applyQuickRange: (days: number | null) => void;
  tab: AthleteTab;
  setTab: (t: AthleteTab) => void;
}) {
  return (
    <div className="space-y-4">
      {activeBlock && (
        <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-xl p-3.5 flex flex-wrap justify-between items-center gap-2 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
              Current Season Phase • {activeBlock.phase_type}
            </span>
            <strong className="text-sm text-white">{activeBlock.phase_name}</strong>
            {activeBlock.key_focus && <span className="text-slate-300"> — Focus: {activeBlock.key_focus}</span>}
          </div>
          <div className="text-right text-[11px] text-slate-300">
            <div>Intensity: <strong className="text-emerald-300">{activeBlock.intensity_zone}</strong></div>
            {activeBlock.target_meet && <div>Target Meet: <strong className="text-amber-300">{activeBlock.target_meet}</strong></div>}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <button type="button" onClick={() => applyQuickRange(7)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white">Last 7 Days</button>
          <button type="button" onClick={() => applyQuickRange(14)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white">Last 14 Days</button>
          <button type="button" onClick={() => applyQuickRange(null)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400">All Dates</button>
          <span className="ml-1">Custom:</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" />
          <span>to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
        <button onClick={() => setTab('races')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold ${tab === 'races' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
          <Trophy className="w-4 h-4" /> Performance
        </button>
        <button onClick={() => setTab('training')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold ${tab === 'training' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
          <Dumbbell className="w-4 h-4" /> Training &amp; Tests
        </button>
        <button onClick={() => setTab('wellness')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold ${tab === 'wellness' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
          <HeartPulse className="w-4 h-4" /> Daily Wellness &amp; RPE
        </button>
        <button onClick={() => setTab('meetday')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold ${tab === 'meetday' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
          <Timer className="w-4 h-4" /> Meet Day
        </button>
      </div>
    </div>
  );
}
