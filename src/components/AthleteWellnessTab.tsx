'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import BodyHeatMap, { SoreZone } from './BodyHeatMap';
import { Check } from 'lucide-react';

export default function AthleteWellnessTab({
  athleteId,
  logs,
  onSaved,
}: {
  athleteId: string;
  logs: any[];
  onSaved: () => void;
}) {
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [sleep, setSleep] = useState(8);
  const [fatigue, setFatigue] = useState(7);
  const [soreness, setSoreness] = useState(7);
  const [stress, setStress] = useState(8);
  const [mood, setMood] = useState(8);
  const [soreAreas, setSoreAreas] = useState<SoreZone[]>([]);
  const [rpe, setRpe] = useState(6);
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);

  const composite = sleep + fatigue + soreness + stress + mood;
  const srpeLoad = rpe * duration;

  async function handleSave(e: React.FormEvent) {
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
        mood,
        sore_areas: soreAreas,
        session_rpe: rpe,
        session_duration_mins: duration,
      },
      { onConflict: 'athlete_id,log_date' }
    );
    setSaving(false);
    onSaved();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold text-sm text-emerald-400">Daily Wellness Check-In & Session RPE</h3>
          <input type="date" required value={logDate} onChange={(e) => setLogDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Sleep Quality (1=Poor, 10=Great)', val: sleep, set: setSleep },
            { label: 'Fatigue / Energy (1=Exhausted, 10=Fresh)', val: fatigue, set: setFatigue },
            { label: 'Muscle Soreness (1=Very Sore, 10=No Soreness)', val: soreness, set: setSoreness },
            { label: 'Stress Level (1=High Stress, 10=Relaxed)', val: stress, set: setStress },
            { label: 'Mood (1=Low, 10=Positive)', val: mood, set: setMood },
          ].map((item) => (
            <div key={item.label} className="bg-slate-950 p-3 rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">{item.label}</span>
                <strong className="text-emerald-400">{item.val}/10</strong>
              </div>
              <input type="range" min={1} max={10} value={item.val} onChange={(e) => item.set(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
          ))}

          <div className="bg-slate-950 p-3 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300">Session RPE (1–10) & Duration (min)</span>
              <strong className="text-amber-400">{srpeLoad} AU</strong>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={1} max={10} value={rpe} onChange={(e) => setRpe(Number(e.target.value))} placeholder="RPE (1-10)" className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5" />
              <input type="number" min={5} max={300} value={duration} onChange={(e) => setDuration(Number(e.target.value))} placeholder="Mins" className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5" />
            </div>
          </div>
        </div>

        {/* Interactive Front & Back Anatomical Body Heat Map */}
        <BodyHeatMap selected={soreAreas} onChange={setSoreAreas} />

        <div className="flex justify-between items-center pt-2">
          <span className="text-xs text-slate-400">
            Composite Readiness: <strong className={composite < 28 ? 'text-rose-400' : 'text-emerald-400'}>{composite}/50</strong>
          </span>
          <button disabled={saving} type="submit" className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg">
            <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Submit Daily Check-In'}
          </button>
        </div>
      </form>

      {/* Recent Wellness Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <h4 className="font-bold text-sm text-emerald-400">Recent Wellness & Load Logs</h4>
        <div className="divide-y divide-slate-800 text-xs">
          {logs.slice(0, 10).map((l) => {
            const areas: SoreZone[] = Array.isArray(l.sore_areas) ? l.sore_areas : [];
            return (
              <div key={l.id} className="py-2.5 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <span className="text-slate-300 font-medium">{l.log_date}</span>
                  {areas.length > 0 && (
                    <span className="ml-2 text-[11px] text-amber-300">
                      ({areas.map((a) => `${a.label} L${a.level}`).join(', ')})
                    </span>
                  )}
                </div>
                <span>Readiness: <strong className={l.composite_score < 28 ? 'text-rose-400' : 'text-emerald-400'}>{l.composite_score}/50</strong></span>
                <span>RPE: <strong>{l.session_rpe}</strong> • Load: <strong className="text-amber-400">{l.srpe_load} AU</strong></span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
