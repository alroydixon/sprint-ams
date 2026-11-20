'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  isFieldDiscipline,
  getRepDistancesForDiscipline,
  JUMP_DRILL_PRESETS,
  THROW_DRILL_PRESETS,
  parseMarkInput,
} from '@/lib/disciplines';
import AthleteSessionHistory from './AthleteSessionHistory';
import { Plus, Trash2 } from 'lucide-react';

export default function AthleteTrainingTab({
  athleteId,
  discipline = 'sprints',
  sessions,
  races,
  tests,
  onSaved,
}: {
  athleteId: string;
  discipline?: string | null;
  sessions: any[];
  races: any[];
  tests: any[];
  onSaved: () => void;
}) {
  const isField = isFieldDiscipline(discipline);
  const distancePresets = getRepDistancesForDiscipline(discipline);
  const drillPresets = discipline === 'throws' ? THROW_DRILL_PRESETS : JUMP_DRILL_PRESETS;

  const makeDefaultRun = () =>
    isField
      ? { distance_m: 6, time_seconds: '', rest_interval: drillPresets.at(0) || 'Full Approach' }
      : { distance_m: distancePresets.at(2) || 100, time_seconds: '', rest_interval: '3 min' };

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [runs, setRuns] = useState<any[]>([makeDefaultRun()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRuns([makeDefaultRun()]);
  }, [discipline]);

  function addRunRow() {
    const last = runs.at(-1);
    setRuns([...runs, last ? { ...last, time_seconds: '' } : makeDefaultRun()]);
  }

  function updateRun(idx: number, field: string, val: any) {
    const copy = [...runs];
    copy[idx] = { ...copy[idx], [field]: val };
    setRuns(copy);
  }

  async function saveSession(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: sess } = await supabase
      .from('training_sessions')
      .insert({ athlete_id: athleteId, session_date: sessionDate, notes: notes.trim() || null })
      .select()
      .single();

    if (sess) {
      const validRuns = runs
        .filter((r) => Number(r.distance_m) > 0)
        .map((r, i) => {
          const parsedVal = r.time_seconds ? parseMarkInput(String(r.time_seconds)) : NaN;
          return {
            session_id: sess.id,
            rep_number: i + 1,
            distance_m: Number(r.distance_m),
            time_seconds: !isNaN(parsedVal) && parsedVal > 0 ? parsedVal : null,
            rest_interval: r.rest_interval || null,
          };
        });

      if (validRuns.length > 0) {
        await supabase.from('training_runs').insert(validRuns);
      }
    }

    setNotes('');
    setRuns([makeDefaultRun()]);
    setSaving(false);
    onSaved();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveSession} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-emerald-400">
          {isField
            ? `Log ${discipline === 'throws' ? 'Throws' : 'Jumps'} Technical Session`
            : discipline === 'distance'
            ? 'Log Distance Interval / Tempo Session'
            : 'Log Track Training Session'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2" />
          <input
            type="text"
            placeholder={
              isField
                ? discipline === 'throws'
                  ? 'Session focus (e.g. 7.26kg Shot Glide + Power)'
                  : 'Session focus (e.g. 14-stride approach + takeoff)'
                : discipline === 'distance'
                ? 'Session focus (e.g. 5x1000m @ 5k pace)'
                : 'Session focus (e.g. Block starts + 3x150m)'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
        </div>

        <div className="space-y-2">
          {runs.map((r, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-center">
              {isField ? (
                <input
                  type="number"
                  min={1}
                  placeholder="Attempts (reps)"
                  value={r.distance_m}
                  onChange={(e) => updateRun(i, 'distance_m', e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded p-2"
                />
              ) : (
                <select
                  value={r.distance_m}
                  onChange={(e) => updateRun(i, 'distance_m', Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded p-2"
                >
                  {distancePresets.map((d) => (
                    <option key={d} value={d}>{d >= 1000 ? `${d}m (${d / 1000}km)` : `${d}m`}</option>
                  ))}
                </select>
              )}

              <input
                type="text"
                placeholder={isField ? 'Best Mark (m) e.g. 7.35' : discipline === 'distance' ? 'Split (mm:ss.xx)' : 'Time (s) optional'}
                value={r.time_seconds}
                onChange={(e) => updateRun(i, 'time_seconds', e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2"
              />

              {isField ? (
                <select
                  value={r.rest_interval}
                  onChange={(e) => updateRun(i, 'rest_interval', e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded p-2"
                >
                  {drillPresets.map((preset) => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Rest (e.g. 2 min)"
                  value={r.rest_interval}
                  onChange={(e) => updateRun(i, 'rest_interval', e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded p-2"
                />
              )}

              {runs.length > 1 && (
                <button type="button" onClick={() => setRuns(runs.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-300 justify-self-start">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={addRunRow} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-emerald-400">
            <Plus className="w-3.5 h-3.5" /> {isField ? 'Add Drill / Set' : 'Add Rep'}
          </button>
          <button disabled={saving} type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-1.5 rounded-lg">
            {saving ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      </form>

      <AthleteSessionHistory discipline={discipline} sessions={sessions} racesCount={races.length} />
    </div>
  );
}
