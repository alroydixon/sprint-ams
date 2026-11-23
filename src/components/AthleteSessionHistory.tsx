'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, Calendar, Trash2 } from 'lucide-react';

export default function AthleteSessionHistory({
  sessions,
  onChanged,
}: {
  sessions: any[];
  onChanged?: () => void;
}) {
  const [range, setRange] = useState<'7' | '14' | 'ALL'>('14');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const enriched = useMemo(() => {
    return (sessions || [])
      .map((s) => {
        const runs = Array.isArray(s.training_runs) ? s.training_runs : [];
        const totalVolume = runs.reduce((sum: number, r: any) => sum + (Number(r.distance_m) || 0), 0);
        const loadAu = (Number(s.session_rpe) || 0) * (Number(s.session_duration_mins) || 0);
        return {
          ...s,
          runs,
          totalVolume,
          loadAu,
        };
      })
      .sort((a, b) => (a.session_date || '').localeCompare(b.session_date || ''));
  }, [sessions]);

  const chartSessions = useMemo(() => {
    if (range === '7') return enriched.slice(-7);
    if (range === '14') return enriched.slice(-14);
    return enriched;
  }, [enriched, range]);

  const maxVol = Math.max(100, ...chartSessions.map((s) => s.totalVolume));
  const totalPeriodVol = chartSessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const totalPeriodLoad = chartSessions.reduce((sum, s) => sum + s.loadAu, 0);

  async function deleteSession(id: string) {
    setDeletingId(id);
    await supabase.from('training_runs').delete().eq('session_id', id);
    await supabase.from('training_sessions').delete().eq('id', id);
    setDeletingId(null);
    if (onChanged) onChanged();
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Volume Over Time Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" /> Training Volume Over Time
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Period Volume: <strong className="text-emerald-400">{totalPeriodVol.toLocaleString()}m</strong> •
              Total Load: <strong className="text-amber-300">{totalPeriodLoad.toLocaleString()} AU</strong>
            </p>
          </div>

          <div className="flex bg-slate-800 p-0.5 rounded-lg">
            {(['7', '14', 'ALL'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  range === r ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                {r === 'ALL' ? 'All' : `Last ${r}`}
              </button>
            ))}
          </div>
        </div>

        {chartSessions.length === 0 ? (
          <p className="text-slate-500 py-6 text-center">
            No training sessions logged yet. Log a session above to see your volume progression graph.
          </p>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="h-44 flex items-end gap-2 pt-6 overflow-x-auto">
              {chartSessions.map((s) => {
                const heightPct = Math.max(8, Math.round((s.totalVolume / maxVol) * 100));
                return (
                  <div
                    key={s.id}
                    className="flex-1 min-w-[38px] h-full flex flex-col items-center justify-end gap-1 group"
                  >
                    <span className="text-[10px] font-mono font-bold text-emerald-300">
                      {s.totalVolume}m
                    </span>
                    <div
                      title={`${s.session_date} • ${s.session_type || s.session_title || 'Session'}: ${s.totalVolume}m (${s.loadAu} AU)`}
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[34px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-amber-500 group-hover:to-amber-300 transition-all"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(s.session_date || '').slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Past Logged Training Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> Past Logged Training Sessions ({enriched.length})
        </h3>

        {enriched.length === 0 ? (
          <p className="text-slate-500 py-3">No past training sessions found.</p>
        ) : (
          <div className="space-y-2.5">
            {enriched
              .slice()
              .reverse()
              .map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-slate-400">{s.session_date}</span>
                      <strong className="text-white">
                        {s.session_type || s.session_title || 'Track Session'}
                      </strong>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
                        {s.totalVolume}m
                      </span>
                      {s.loadAu > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold">
                          RPE {s.session_rpe} • {s.session_duration_mins}m ({s.loadAu} AU)
                        </span>
                      )}
                    </div>

                    {onChanged && (
                      <button
                        type="button"
                        disabled={deletingId === s.id}
                        onClick={() => deleteSession(s.id)}
                        title="Delete session"
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {s.runs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {s.runs.map((r: any, idx: number) => {
                        const sec = Number(r.rep_time_sec ?? r.time_seconds ?? 0);
                        const restMin = r.rest_sec ? Math.round((Number(r.rest_sec) / 60) * 10) / 10 : 0;
                        return (
                          <span
                            key={r.id || idx}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300"
                          >
                            {r.distance_m}m{sec > 0 ? ` @ ${sec}s` : ''}
                            {restMin > 0 ? ` (${restMin}m rest)` : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {s.notes && <p className="text-slate-400 italic">Note: {s.notes}</p>}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
