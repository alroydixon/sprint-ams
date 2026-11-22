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

        <CoachAthleteRacesSection
          athleteId={athlete.id}
          discipline={discipline}
          events={events}
          races={races}
          onChanged={() => onAthleteUpdated(athlete)}
        />
      </div>
    </div>
  );
}
