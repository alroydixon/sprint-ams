'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { calculatePower, calculateHorizontalForce, calculateTargetSplits } from '@/lib/biomechanics';

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
  const [pushups, setPushups] = useState('');
  const [situps, setSitups] = useState('');
  const [squatJumps, setSquatJumps] = useState('');
  const [t20, setT20] = useState('');
  const [t40, setT40] = useState('');
  const [t60, setT60] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSaveTest(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    const { error } = await supabase.from('fitness_tests').insert({
      athlete_id: athleteId,
      test_date: testDate,
      body_weight_kg: parseFloat(weight),
      pushups_1min_reps: pushups ? parseInt(pushups) : null,
      situps_1min_reps: situps ? parseInt(situps) : null,
      squat_jumps_1min_reps: squatJumps ? parseInt(squatJumps) : null,
      sprint_20m_s: t20 ? parseFloat(t20) : null,
      sprint_40m_s: t40 ? parseFloat(t40) : null,
      sprint_60m_s: t60 ? parseFloat(t60) : null,
    });
    if (!error) {
      await supabase.from('profiles').update({ body_weight_kg: parseFloat(weight) }).eq('id', athleteId);
      setPushups(''); setSitups(''); setSquatJumps(''); setT20(''); setT40(''); setT60('');
      onSaved();
    }
    setSaving(false);
  }

  const latest = tests[tests.length - 1];
  const latestPower = latest
    ? calculatePower(Number(latest.body_weight_kg), latest.pushups_1min_reps || 0, latest.situps_1min_reps || 0, latest.squat_jumps_1min_reps || 0)
    : null;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveTest} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold text-emerald-400 text-sm">Log Fitness & Biomechanics Test</h3>
          <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Body Weight (kg)</label>
            <input required type="number" step="0.05" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">1-Min Push-Ups (Reps)</label>
            <input type="number" value={pushups} onChange={(e) => setPushups(e.target.value)} placeholder="45" className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">1-Min Sit-Ups (Reps)</label>
            <input type="number" value={situps} onChange={(e) => setSitups(e.target.value)} placeholder="55" className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">1-Min Squat Jumps (Reps)</label>
            <input type="number" value={squatJumps} onChange={(e) => setSquatJumps(e.target.value)} placeholder="85" className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">20m Sprint (s)</label>
            <input type="number" step="0.01" value={t20} onChange={(e) => setT20(e.target.value)} placeholder="3.08" className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">40m Sprint (s)</label>
            <input type="number" step="0.01" value={t40} onChange={(e) => setT40(e.target.value)} placeholder="4.75" className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">60m Sprint (s)</label>
            <input type="number" step="0.01" value={t60} onChange={(e) => setT60(e.target.value)} placeholder="7.12" className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5" />
          </div>
        </div>

        <button disabled={saving} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2 rounded-lg text-xs">
          {saving ? 'Saving Test...' : '+ Save Fitness & Sprint Test'}
        </button>
      </form>

      {latest && latestPower && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs text-emerald-400">Latest Biomechanics Profile ({latest.test_date} • {latest.body_weight_kg} kg)</h4>
            <span className="text-xs font-bold text-white">{latestPower.totalW} W ({latestPower.totalWPerKg} W/kg)</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-950 p-3 rounded-lg">
            <div><span className="text-slate-400 block">Push-Ups ({latest.pushups_1min_reps || 0} reps)</span><strong className="text-emerald-400">{latestPower.pushupW} W</strong></div>
            <div><span className="text-slate-400 block">Sit-Ups ({latest.situps_1min_reps || 0} reps)</span><strong className="text-emerald-400">{latestPower.situpW} W</strong></div>
            <div><span className="text-slate-400 block">Squat Jumps ({latest.squat_jumps_1min_reps || 0} reps)</span><strong className="text-emerald-400">{latestPower.squatJumpW} W</strong></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {[
              { dist: 20, time: Number(latest.sprint_20m_s) },
              { dist: 40, time: Number(latest.sprint_40m_s) },
              { dist: 60, time: Number(latest.sprint_60m_s) },
            ].map(({ dist, time }) => {
              if (!time) return null;
              const f = calculateHorizontalForce(Number(latest.body_weight_kg), dist, time);
              const sp = calculateTargetSplits(time);
              return (
                <div key={dist} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between font-bold text-emerald-400"><span>{dist}m Test</span><span>{time.toFixed(2)}s</span></div>
                  {f && <div className="text-slate-300">Force: <strong>{f.forceN} N</strong> ({f.forcePerKg} N/kg)</div>}
                  <div className="text-[11px] text-slate-400">95%: {sp.effort95}s • 90%: {sp.effort90}s • +2%: {sp.improve2Pct}s</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
