'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TRAINING_DISTANCES, calculateAutoEffortPct } from '@/lib/biomechanics';
import { Plus, Trash2 } from 'lucide-react';

interface RunDraft {
  distance_m: number;
  time_seconds: string;
  effort_pct: string;
  auto_ref: string;
}

export default function AthleteTrainingTab({
  athleteId,
  sessions,
  races = [],
  tests = [],
  onSaved,
}: {
  athleteId: string;
  sessions: any[];
  races?: any[];
  tests?: any[];
  onSaved: () => void;
}) {
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [runs, setRuns] = useState<RunDraft[]>([
    { distance_m: 100, time_seconds: '', effort_pct: '90', auto_ref: '' },
  ]);
  const [saving, setSaving] = useState(false);

  function addRunRow() {
    setRuns([...runs, { distance_m: 100, time_seconds: '', effort_pct: '90', auto_ref: '' }]);
  }

  function updateRun(idx: number, field: 'distance_m' | 'time_seconds' | 'effort_pct', val: any) {
    const next = [...runs];
    const updated: RunDraft = { ...next[idx], [field]: val };

    // Auto-calculate Effort % whenever distance or run time changes
    if (field === 'distance_m' || field === 'time_seconds') {
      const dist = Number(updated.distance_m);
      const time = parseFloat(updated.time_seconds);
      if (dist > 0 && time > 0) {
        const auto = calculateAutoEffortPct(dist, time, races, tests);
        if (auto) {
          updated.effort_pct = String(auto.effortPct);
          updated.auto_ref = auto.referenceLabel;
        } else {
          updated.auto_ref = 'No PB yet (enter % manually)';
        }
      } else {
        updated.auto_ref = '';
      }
    }

    next[idx] = updated;
    setRuns(next);
  }

  async function handleSaveSession(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: sess, error } = await supabase
      .from('training_sessions')
      .insert({ athlete_id: athleteId, session_date: sessionDate, notes })
      .select()
      .single();

    if (!error && sess) {
      const validRuns = runs.map((r, i) => ({
        session_id: sess.id,
        run_order: i + 1,
        distance_m: Number(r.distance_m),
        time_seconds: r.time_seconds ? parseFloat(r.time_seconds) : null,
        effort_pct: Number(r.effort_pct) || 85,
      }));
      await supabase.from('training_runs').insert(validRuns);
    }

    setNotes('');
    setRuns([{ distance_m: 100, time_seconds: '', effort_pct: '90', auto_ref: '' }]);
    setSaving(false);
    onSaved();
  }

  const dailyVolumes = sessions.map((s) => {
    const totalM = (s.training_runs || []).reduce((sum: number, r: any) => sum + Number(r.distance_m), 0);
    return { date: s.session_date, totalM };
  });
  const totalPeriodVolume = dailyVolumes.reduce((sum, d) => sum + d.totalM, 0);
  const maxDaily = Math.max(...dailyVolumes.map((d) => d.totalM), 100);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveSession} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-emerald-400">Log Training Session (Auto-Effort % from PB)</h3>
          <button type="button" onClick={addRunRow} className="text-xs bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-emerald-400">
            + Add Run
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <input type="date" required value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2" />
          <input type="text" placeholder="Session focus (e.g. Acceleration / Speed Endurance)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2" />
        </div>

        <div className="space-y-2">
          {runs.map((run, idx) => (
            <div key={idx} className="space-y-1">
              <div className="grid grid-cols-4 gap-2 items-center text-xs">
                <select value={run.distance_m} onChange={(e) => updateRun(idx, 'distance_m', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded px-2 py-2">
                  {TRAINING_DISTANCES.map((d) => <option key={d} value={d}>{d}m</option>)}
                </select>
                <input type="number" step="0.01" placeholder="Time (s)" value={run.time_seconds} onChange={(e) => updateRun(idx, 'time_seconds', e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-2" />
                <div className="relative">
                  <input type="number" step="0.1" placeholder="Effort %" value={run.effort_pct} onChange={(e) => updateRun(idx, 'effort_pct', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-emerald-300 font-semibold" />
                  <span className="absolute right-2 top-2 text-slate-400">%</span>
                </div>
                {runs.length > 1 && (
                  <button type="button" onClick={() => setRuns(runs.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300 flex justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {run.auto_ref && (
                <p className="text-[10px] text-emerald-400/80 pl-1">Auto-calculated from {run.auto_ref}</p>
              )}
            </div>
          ))}
        </div>

        <button disabled={saving} type="submit" className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg">
          <Plus className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Training Session'}
        </button>
      </form>

      {/* Training Volume Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-sm text-emerald-400">Daily Training Volume (Metres)</h4>
          <span className="text-xs font-semibold text-amber-400">Period Total: {totalPeriodVolume}m</span>
        </div>

        {dailyVolumes.length > 0 ? (
          <svg viewBox="0 0 400 120" className="w-full h-32 bg-slate-950 rounded-lg p-2">
            {dailyVolumes.map((d, i) => {
              const barW = Math.min(36, 320 / dailyVolumes.length - 6);
              const x = 30 + i * (340 / dailyVolumes.length);
              const h = (d.totalM / maxDaily) * 80;
              return (
                <g key={i}>
                  <rect x={x} y={95 - h} width={barW} height={h} rx="3" fill="#10b981" />
                  <text x={x + barW / 2} y={91 - h} fontSize="8" fill="#cbd5e1" textAnchor="middle">{d.totalM}m</text>
                  <text x={x + barW / 2} y={108} fontSize="7" fill="#64748b" textAnchor="middle">{d.date.slice(5)}</text>
                </g>
              );
            })}
          </svg>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">No training sessions logged in this date range.</p>
        )}
      </div>
    </div>
  );
}
