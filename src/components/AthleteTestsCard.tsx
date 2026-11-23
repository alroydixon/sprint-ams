'use client';

import AthleteBiomechanicsGraphs from './AthleteBiomechanicsGraphs';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  calculatePower,
  calculateHorizontalForce,
  calculateTargetSplits,
} from '@/lib/biomechanics';
import { Activity, Ruler } from 'lucide-react';

export default function AthleteTestsCard({
  athleteId,
  tests,
  onSaved,
}: {
  athleteId: string;
  tests: any[];
  onSaved: () => void;
}) {
  const [testDate, setTestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState('60');
  const [heightCm, setHeightCm] = useState('');
  const [pushups, setPushups] = useState('');
  const [situps, setSitups] = useState('');
  const [squatJumps, setSquatJumps] = useState('');
  const [t20, setT20] = useState('');
  const [t40, setT40] = useState('');
  const [t60, setT60] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleSaveTest(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    setFeedback(null);

    const { error } = await supabase.from('fitness_tests').insert({
      athlete_id: athleteId,
      test_date: testDate,
      body_weight_kg: parseFloat(weight),
      height_cm: heightCm ? parseFloat(heightCm) : null,
      pushups_1min_reps: parseInt(pushups) || 0,
      situps_1min_reps: parseInt(situps) || 0,
      squat_jumps_1min_reps: parseInt(squatJumps) || 0,
      sprint_20m_sec: t20 ? parseFloat(t20) : null,
      sprint_40m_sec: t40 ? parseFloat(t40) : null,
      sprint_60m_sec: t60 ? parseFloat(t60) : null,
    });

    setSaving(false);
    if (error) {
      setFeedback({ type: 'err', text: `Could not save fitness test: ${error.message}` });
      return;
    }

    setHeightCm('');
    setPushups('');
    setSitups('');
    setSquatJumps('');
    setT20('');
    setT40('');
    setT60('');
    setFeedback({ type: 'ok', text: '✓ Fitness & Biomechanics Test Saved!' });
    onSaved();
  }

  const latest = tests.at(-1);
  const pwr = latest
    ? calculatePower(
        Number(latest.body_weight_kg),
        latest.pushups_1min_reps || 0,
        latest.situps_1min_reps || 0,
        latest.squat_jumps_1min_reps || 0
      )
    : null;

  const force =
    latest && latest.sprint_20m_sec && latest.sprint_40m_sec
      ? calculateHorizontalForce(
          Number(latest.body_weight_kg),
          Number(latest.sprint_20m_sec),
          Number(latest.sprint_40m_sec)
        )
      : null;

  const splits =
    latest && latest.sprint_60m_sec ? calculateTargetSplits(Number(latest.sprint_60m_sec)) : null;

  const testsWithHeight = tests.filter((t) => Number(t.height_cm) > 0);
  const firstHeightTest = testsWithHeight.at(0);
  const latestHeightTest = testsWithHeight.at(-1);
  const growthCm =
    firstHeightTest && latestHeightTest && firstHeightTest.id !== latestHeightTest.id
      ? Number(latestHeightTest.height_cm) - Number(firstHeightTest.height_cm)
      : 0;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSaveTest} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Log Fitness &amp; Biomechanics Test
          </h3>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div>
            <label className="text-slate-400 block mb-1">Body Weight (kg)</label>
            <input required type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Height (cm)</label>
            <input type="number" step="0.1" placeholder="e.g. 174.5" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">1-Min Push-Ups (Reps)</label>
            <input type="number" placeholder="45" value={pushups} onChange={(e) => setPushups(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">1-Min Sit-Ups (Reps)</label>
            <input type="number" placeholder="55" value={situps} onChange={(e) => setSitups(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">1-Min Squat Jumps (Reps)</label>
            <input type="number" placeholder="65" value={squatJumps} onChange={(e) => setSquatJumps(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="text-slate-400 block mb-1">20m Sprint (s)</label>
            <input type="number" step="0.01" placeholder="3.08" value={t20} onChange={(e) => setT20(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">40m Sprint (s)</label>
            <input type="number" step="0.01" placeholder="4.75" value={t40} onChange={(e) => setT40(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">60m Sprint (s)</label>
            <input type="number" step="0.01" placeholder="7.12" value={t60} onChange={(e) => setT60(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
          </div>
        </div>

        {feedback && (
          <p className={`p-2 rounded border font-semibold ${feedback.type === 'ok' ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-rose-950/60 border-rose-700 text-rose-300'}`}>
            {feedback.text}
          </p>
        )}

        <button disabled={saving} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg transition">
          {saving ? 'Saving...' : '+ Save Fitness & Sprint Test'}
        </button>
      </form>

      {latest && pwr && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="font-bold text-emerald-400 flex items-center gap-2 flex-wrap">
              <span>
                Latest Biomechanics Profile ({latest.test_date} • {latest.body_weight_kg} kg
                {latestHeightTest ? ` • ${latestHeightTest.height_cm} cm` : ''})
              </span>
              {growthCm > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 text-[11px]">
                  <Ruler className="w-3 h-3" /> +{growthCm.toFixed(1)} cm growth since {firstHeightTest.test_date}
                </span>
              )}
            </span>
            <strong className="text-sm text-white">
              {pwr.totalW} W ({pwr.totalWPerKg} W/kg)
            </strong>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
              <span className="text-slate-400 block">Push-Ups ({latest.pushups_1min_reps || 0} reps)</span>
              <strong className="text-emerald-400 font-bold">{pwr.pushupW} W</strong>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
              <span className="text-slate-400 block">Sit-Ups ({latest.situps_1min_reps || 0} reps)</span>
              <strong className="text-emerald-400 font-bold">{pwr.situpW} W</strong>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
              <span className="text-slate-400 block">Squat Jumps ({latest.squat_jumps_1min_reps || 0} reps)</span>
              <strong className="text-emerald-400 font-bold">{pwr.squatJumpW} W</strong>
            </div>
          </div>

          {(force || splits) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800 text-slate-300">
              {force && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-slate-400 block">Horizontal Force (20m–40m)</span>
                  <strong className="text-amber-300">{force.forceN} N ({force.forcePerKg} N/kg)</strong>
                </div>
              )}
              {splits && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-slate-400 block">60m Training Paces</span>
                  <strong className="text-sky-300">95%: {splits.effort95}s • 90%: {splits.effort90}s • 80%: {splits.effort80}s</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <AthleteBiomechanicsGraphs tests={tests} />
    </div>
  );
}
