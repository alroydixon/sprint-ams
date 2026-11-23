'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { calculatePower } from '@/lib/biomechanics';

export default function AthletePowerTestCard({
  athleteId,
  tests,
  onSaved,
}: {
  athleteId: string;
  tests: any[];
  onSaved: () => void;
}) {
  const [weight, setWeight] = useState('');
  const [pushups, setPushups] = useState('');
  const [situps, setSitups] = useState('');
  const [squats, setSquats] = useState('');
  const [savingTest, setSavingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function saveFitnessTest(e: React.FormEvent) {
    e.preventDefault();
    setSavingTest(true);
    setTestFeedback(null);

    const { error } = await supabase.from('fitness_tests').insert({
      athlete_id: athleteId,
      test_date: new Date().toISOString().slice(0, 10),
      body_weight_kg: parseFloat(weight),
      pushups_1min_reps: parseInt(pushups),
      situps_1min_reps: parseInt(situps),
      squat_jumps_1min_reps: parseInt(squats),
    });

    setSavingTest(false);
    if (error) {
      setTestFeedback({ type: 'err', text: `Could not save power test: ${error.message}` });
      return;
    }

    setWeight('');
    setPushups('');
    setSitups('');
    setSquats('');
    setTestFeedback({ type: 'ok', text: '✓ 1-Minute Anaerobic Power Test Saved!' });
    onSaved();
  }

  return (
    <form onSubmit={saveFitnessTest} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <h3 className="font-bold text-sm text-emerald-400">1-Minute Anaerobic Power Test</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <input required type="number" step="0.1" placeholder="Body Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2" />
        <input required type="number" placeholder="Push-ups (1 min)" value={pushups} onChange={(e) => setPushups(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2" />
        <input required type="number" placeholder="Sit-ups (1 min)" value={situps} onChange={(e) => setSitups(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2" />
        <input required type="number" placeholder="Squat Jumps (1 min)" value={squats} onChange={(e) => setSquats(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2" />
      </div>

      {testFeedback && (
        <p className={`p-2 rounded border text-xs font-semibold ${testFeedback.type === 'ok' ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-rose-950/60 border-rose-700 text-rose-300'}`}>
          {testFeedback.text}
        </p>
      )}

      <button disabled={savingTest} type="submit" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg">
        {savingTest ? 'Saving...' : 'Log Power Test'}
      </button>

      {tests.length > 0 && (
        <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
          {tests.slice(-3).reverse().map((t) => {
            const p = calculatePower(Number(t.body_weight_kg), t.pushups_1min_reps, t.situps_1min_reps, t.squat_jumps_1min_reps);
            return (
              <div key={t.id} className="flex justify-between text-slate-300">
                <span>{t.test_date} ({t.body_weight_kg} kg)</span>
                <span className="text-emerald-400 font-semibold">{p.totalW} W ({p.totalWPerKg} W/kg)</span>
              </div>
            );
          })}
        </div>
      )}
    </form>
  );
}
