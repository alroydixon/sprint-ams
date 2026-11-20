'use client';

import { supabase } from '@/lib/supabase';
import { Trash2, CalendarRange, Trophy } from 'lucide-react';

const PHASE_COLORS: Record<string, string> = {
  'General Prep (GPP)': 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  'Special Prep (SPP)': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  'Pre-Competition': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Competition Peak': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'Taper / Championship': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  'Active Recovery': 'bg-slate-700/40 text-slate-300 border-slate-600',
};

export default function MesocycleTimeline({
  blocks,
  sessions,
  activeAthleteCount,
  onSaved,
}: {
  blocks: any[];
  sessions: any[];
  activeAthleteCount: number;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  async function handleDelete(id: string) {
    await supabase.from('training_blocks').delete().eq('id', id);
    onSaved();
  }

  function calcBlockStats(block: any) {
    const startMs = new Date(block.start_date).getTime();
    const endMs = new Date(block.end_date).getTime();
    const weeks = Math.max(1, Math.round((endMs - startMs) / (7 * 86400000)));

    const blockSessions = sessions.filter(
      (s) => s.session_date >= block.start_date && s.session_date <= block.end_date
    );
    const totalMetres = blockSessions.reduce(
      (sum, s) => sum + (s.training_runs || []).reduce((acc: number, r: any) => acc + Number(r.distance_m), 0),
      0
    );
    const divisor = Math.max(1, activeAthleteCount) * weeks;
    const avgWeeklyPerAthlete = Math.round(totalMetres / divisor);
    const isCurrent = today >= block.start_date && today <= block.end_date;

    return { weeks, avgWeeklyPerAthlete, isCurrent };
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
          <CalendarRange className="w-4 h-4" /> Annual Macrocycle & Mesocycle Timeline ({blocks.length})
        </h4>
        <span className="text-[11px] text-slate-400">Visible to your active squad on their Athlete Dashboard</span>
      </div>

      <div className="space-y-3">
        {blocks.map((b) => {
          const { weeks, avgWeeklyPerAthlete, isCurrent } = calcBlockStats(b);
          const pct = Math.min(100, Math.round((avgWeeklyPerAthlete / (b.target_weekly_volume_m || 1)) * 100));
          const badgeStyle = PHASE_COLORS[b.phase_type] || PHASE_COLORS['General Prep (GPP)'];

          return (
            <div
              key={b.id}
              className={`bg-slate-950 rounded-xl p-4 border space-y-2.5 text-xs ${
                isCurrent ? 'border-emerald-500 shadow-md shadow-emerald-950/40' : 'border-slate-800'
              }`}
            >
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-white">{b.phase_name}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badgeStyle}`}>
                    {b.phase_type}
                  </span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                      ACTIVE PHASE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span>
                    {b.start_date} → {b.end_date} ({weeks} wk{weeks > 1 ? 's' : ''})
                  </span>
                  <button type="button" onClick={() => handleDelete(b.id)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                <div><span className="text-slate-500">Intensity Zone:</span> <strong>{b.intensity_zone}</strong></div>
                <div><span className="text-slate-500">Key Focus:</span> <strong>{b.key_focus || 'General Sprint Development'}</strong></div>
                {b.target_meet && (
                  <div className="flex items-center gap-1 text-amber-300">
                    <Trophy className="w-3.5 h-3.5" /> Target Meet: <strong>{b.target_meet}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Actual Avg Weekly Vol / Athlete vs. Target</span>
                  <span>
                    <strong className="text-emerald-400">{avgWeeklyPerAthlete}m</strong> / {b.target_weekly_volume_m}m ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}

        {blocks.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-6">
            No mesocycles planned yet. Use the form above to map out your season blocks!
          </p>
        )}
      </div>
    </div>
  );
}
