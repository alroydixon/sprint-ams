'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import AthleteSessionHistory from './AthleteSessionHistory';
import { Plus, Trash2 } from 'lucide-react';

interface RunRow {
  distance_m: number;
  rep_time_sec: number;
  rest_mins: number;
}

export default function AthleteTrainingTab({
  athleteId,
  discipline = 'sprints',
  sessions,
  races = [],
  tests,
  onSaved,
}: {
  athleteId: string;
  discipline?: string | null;
  sessions: any[];
  races?: any[];
  tests: any[];
  onSaved: () => void;
}) {
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionType, setSessionType] = useState('Track Sprints');
  const [sessionRpe, setSessionRpe] = useState(7);
  const [durationMins, setDurationMins] = useState(60);
  const [notes, setNotes] = useState('');
  const [runs, setRuns] = useState<RunRow[]>([{ distance_m: 60, rep_time_sec: 7.2, rest_mins: 3 }]);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function addRun() {
    setRuns([...runs, { distance_m: 60, rep_time_sec: 7.2, rest_mins: 3 }]);
  }

  function updateRun(idx: number, field: keyof RunRow, val: number) {
    setRuns(runs.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  }

  async function saveSession(e: React.FormEvent) {
    e.preventDefault();
    setSavingSession(true);
    setSessionFeedback(null);

    const { data: sess, error: sessErr } = await supabase
      .from('training_sessions')
      .insert({
        athlete_id: athleteId,
        session_date: sessionDate,
        session_title: sessionType,
        session_type: sessionType,
        session_rpe: sessionRpe,
        session_duration_mins: durationMins,
        notes: notes.trim() || null,
      })
      .select()
      .single();

    if (sessErr || !sess) {
      setSavingSession(false);
      setSessionFeedback({
        type: 'err',
        text: `Could not save training session: ${sessErr?.message || 'Unknown error'}`,
      });
      return;
    }

    const validRuns = runs.filter((r) => r.distance_m > 0);
    if (validRuns.length > 0) {
      const { error: runErr } = await supabase.from('training_runs').insert(
        validRuns.map((r, idx) => ({
          session_id: sess.id,
          rep_number: idx + 1,
          distance_m: r.distance_m,
          rep_time_sec: r.rep_time_sec,
          rest_sec: Math.round((Number(r.rest_mins) || 0) * 60),
        }))
      );

      if (runErr) {
        setSavingSession(false);
        setSessionFeedback({
          type: 'err',
          text: `Session created, but runs failed to save: ${runErr.message}`,
        });
        onSaved();
        return;
      }
    }

    const totalDist = validRuns.reduce((sum, r) => sum + (Number(r.distance_m) || 0), 0);
    setNotes('');
    setSavingSession(false);
    setSessionFeedback({
      type: 'ok',
      text: `✓ Training Session Saved (${totalDist}m total • sRPE Load: ${sessionRpe * durationMins} AU)!`,
    });
    onSaved();
  }

  const totalRunVolume = runs.reduce((sum, r) => sum + (Number(r.distance_m) || 0), 0);

  return (
    <div className="space-y-6">
      <form onSubmit={saveSession} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold text-sm text-emerald-400">Log Training Session, Volume &amp; RPE Load</h3>
          <span className="text-xs text-slate-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
            Volume: <strong className="text-emerald-400">{totalRunVolume}m</strong> • Load:{' '}
            <strong className="text-amber-300">{sessionRpe * durationMins} AU</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Date</label>
            <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Session Focus</label>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2">
              <option>Track Sprints</option>
              <option>Block Starts &amp; Acceleration</option>
              <option>Speed Endurance</option>
              <option>Tempo / Conditioning</option>
              <option>Gym / Strength &amp; Power</option>
              <option>Plyometrics / Jumps</option>
              <option>Throws Technical</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Duration (mins)</label>
            <input type="number" min={5} max={240} value={durationMins} onChange={(e) => setDurationMins(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Session RPE (1–10)</label>
            <input type="number" min={1} max={10} value={sessionRpe} onChange={(e) => setSessionRpe(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
        </div>

        <div className="text-xs">
          <label className="text-slate-400 block mb-1">Session Notes (Optional)</label>
          <input type="text" placeholder="e.g. Spikes on grass, felt sharp" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Track Runs / Repetitions</span>
            <button type="button" onClick={addRun} className="text-emerald-400 flex items-center gap-1 hover:underline font-semibold">
              <Plus className="w-3.5 h-3.5" /> Add Rep
            </button>
          </div>
          {runs.map((r, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 text-xs items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Dist (m)</span>
                <input type="number" value={r.distance_m} onChange={(e) => updateRun(i, 'distance_m', Number(e.target.value))} className="w-full bg-slate-800 rounded p-1" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Time (s)</span>
                <input type="number" step="0.01" value={r.rep_time_sec} onChange={(e) => updateRun(i, 'rep_time_sec', Number(e.target.value))} className="w-full bg-slate-800 rounded p-1" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Rest (min)</span>
                <input type="number" step="0.5" value={r.rest_mins} onChange={(e) => updateRun(i, 'rest_mins', Number(e.target.value))} className="w-full bg-slate-800 rounded p-1" />
              </div>
              <button type="button" onClick={() => setRuns(runs.filter((_, idx) => idx !== i))} className="text-rose-400 justify-self-end p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {sessionFeedback && (
          <p className={`p-2 rounded border text-xs font-semibold ${sessionFeedback.type === 'ok' ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-rose-950/60 border-rose-700 text-rose-300'}`}>
            {sessionFeedback.text}
          </p>
        )}

        <button disabled={savingSession} type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg">
          {savingSession ? 'Saving...' : 'Save Training Session'}
        </button>
      </form>

      <AthleteSessionHistory sessions={sessions} onChanged={onSaved} />
    </div>
  );
}
