'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getReadinessStatus } from '@/lib/biomechanics';

export default function AthleteWellnessTab({ athleteId, logs, onSaved }: { athleteId: string; logs: any[]; onSaved: () => void }) {
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [sleep, setSleep] = useState(8);
  const [fatigue, setFatigue] = useState(8);
  const [soreness, setSoreness] = useState(8);
  const [stress, setStress] = useState(8);
  const [mood, setMood] = useState(8);
  const [painLoc, setPainLoc] = useState('');
  const [saving, setSaving] = useState(false);

  const composite = sleep + fatigue + soreness + stress + mood;
  const status = getReadinessStatus(composite);

  async function saveWellness(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await supabase.from('wellness_logs').upsert(
      {
        athlete_id: athleteId,
        log_date: logDate,
        sleep_quality: sleep,
        fatigue_level: fatigue,
        muscle_soreness: soreness,
        stress_level: stress,
        mood_score: mood,
        pain_location: painLoc.trim() || null,
      },
      { onConflict: 'athlete_id,log_date' }
    );

    setSaving(false);
    onSaved();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveWellness} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold text-sm text-emerald-400">Daily Morning Readiness Check-In</h3>
          <span className={`px-2.5 py-1 rounded-full border font-semibold ${status.color}`}>{status.label}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 block mb-1">Check-In Date</label>
            <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Muscle Soreness / Pain Area (Optional)</label>
            <input type="text" placeholder="e.g. Right hamstring tightness" value={painLoc} onChange={(e) => setPainLoc(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Sleep Quality (1=Poor, 10=Great)', val: sleep, set: setSleep },
            { label: 'Energy / Freshness (1=Exhausted, 10=Fresh)', val: fatigue, set: setFatigue },
            { label: 'Muscle Readiness (1=Very Sore, 10=No Soreness)', val: soreness, set: setSoreness },
            { label: 'Stress Control (1=High Stress, 10=Relaxed)', val: stress, set: setStress },
            { label: 'Mood & Motivation (1=Low, 10=High)', val: mood, set: setMood },
          ].map((item) => (
            <div key={item.label} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">{item.label}</span>
                <strong className="text-emerald-400">{item.val}/10</strong>
              </div>
              <input type="range" min={1} max={10} value={item.val} onChange={(e) => item.set(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
          ))}
        </div>

        <button disabled={saving} type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg">
          {saving ? 'Submitting...' : 'Submit Morning Check-In'}
        </button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <h3 className="font-bold text-sm text-emerald-400 mb-3">Recent Wellness History</h3>
        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2">Date</th>
              <th>Readiness</th>
              <th>Pain / Soreness Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.slice(0, 14).map((l) => {
              const st = getReadinessStatus(l.composite_score);
              return (
                <tr key={l.id}>
                  <td className="py-2">{l.log_date}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="text-slate-400">{l.pain_location || 'None'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
