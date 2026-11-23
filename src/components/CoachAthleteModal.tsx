'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { calculatePower } from '@/lib/biomechanics';
import { getEventsForDiscipline } from '@/lib/disciplines';
import CoachAthleteRacesSection from './CoachAthleteRacesSection';
import { X, Save } from 'lucide-react';

export default function CoachAthleteModal({
  athlete,
  discipline = 'sprints',
  races,
  tests,
  sessions,
  wellness,
  onAthleteUpdated,
  onClose,
}: {
  athlete: any;
  discipline?: string | null;
  races: any[];
  tests: any[];
  sessions: any[];
  wellness: any[];
  onAthleteUpdated: (updated: any) => void;
  onClose: () => void;
}) {
  const events = getEventsForDiscipline(discipline);
  const [fullName, setFullName] = useState(athlete.full_name || '');
  const [grade, setGrade] = useState(athlete.grade || 'Grade 10');
  const [age, setAge] = useState(athlete.age ? String(athlete.age) : '');
  const [gender, setGender] = useState(athlete.gender || 'Boy');
  const [weight, setWeight] = useState(athlete.body_weight_kg ? String(athlete.body_weight_kg) : '');
  const [phone, setPhone] = useState(athlete.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const updates = {
      full_name: fullName.trim(),
      grade,
      age: age ? parseInt(age) : null,
      gender,
      body_weight_kg: weight ? parseFloat(weight) : null,
      phone: phone.trim() || null,
    };
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', athlete.id)
      .select()
      .single();
    setSavingProfile(false);
    if (data) onAthleteUpdated(data);
  }

  const latestTest = tests.at(-1);
  const pwr = latestTest
    ? calculatePower(
        Number(latestTest.body_weight_kg),
        latestTest.pushups_1min_reps || 0,
        latestTest.situps_1min_reps || 0,
        latestTest.squat_jumps_1min_reps || 0
      )
    : null;

  const totalVolumeM = sessions.reduce(
    (sum, s) =>
      sum +
      (Array.isArray(s.training_runs)
        ? s.training_runs.reduce((rSum: number, r: any) => rSum + (Number(r.distance_m) || 0), 0)
        : 0),
    0
  );

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 space-y-5 text-xs shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-emerald-400">Athlete Profile • {athlete.full_name}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={saveProfile} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Grade / Category</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2">
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Age (yrs)</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2">
                <option value="Boy">Boy / Men</option>
                <option value="Girl">Girl / Women</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Body Weight (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Phone / Contact</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400">
              Latest Power: <strong className="text-emerald-400">{pwr ? `${pwr.totalW} W (${pwr.totalWPerKg} W/kg)` : 'No test'}</strong> • Sessions: <strong className="text-white">{sessions.length}</strong>
            </span>
            <button disabled={savingProfile} type="submit" className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg">
              <Save className="w-3.5 h-3.5" /> {savingProfile ? 'Saving...' : 'Save Athlete Details'}
            </button>
          </div>
        </form>

        {/* Logged Training Sessions & Volume Breakdown */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-emerald-400">
              Logged Training Sessions &amp; Volume ({sessions.length})
            </h4>
            <span className="text-slate-300 font-semibold">
              Total Volume:{' '}
              <strong className="text-emerald-400">{totalVolumeM.toLocaleString()}m</strong>
            </span>
          </div>

          {sessions.length === 0 ? (
            <p className="text-slate-500">No training sessions logged yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sessions
                .slice()
                .reverse()
                .map((s) => {
                  const runs = Array.isArray(s.training_runs) ? s.training_runs : [];
                  const vol = runs.reduce((sum: number, r: any) => sum + (Number(r.distance_m) || 0), 0);
                  const loadAu = (Number(s.session_rpe) || 0) * (Number(s.session_duration_mins) || 0);
                  return (
                    <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-slate-400">{s.session_date}</span>
                          <strong className="text-white">{s.session_type || s.session_title || 'Track Session'}</strong>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
                            {vol}m
                          </span>
                          {loadAu > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold">
                              RPE {s.session_rpe} • {loadAu} AU
                            </span>
                          )}
                        </div>
                      </div>
                      {runs.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {runs.map((r: any, i: number) => {
                            const sec = Number(r.rep_time_sec ?? r.time_seconds ?? 0);
                            const restMin = r.rest_sec ? Math.round((Number(r.rest_sec) / 60) * 10) / 10 : 0;
                            return (
                              <span key={r.id || i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                                {r.distance_m}m{sec > 0 ? ` @ ${sec}s` : ''}{restMin > 0 ? ` (${restMin}m rest)` : ''}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {s.notes && <p className="text-slate-400 italic">Note: {s.notes}</p>}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <CoachAthleteRacesSection
          athleteId={athlete.id}
          discipline={discipline}
          events={events}
          races={races}
          wellness={wellness}
          onChanged={() => onAthleteUpdated(athlete)}
        />
      </div>
    </div>
  );
}
