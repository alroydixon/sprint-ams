'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CoachWellnessMedicalTab({
  coachId,
  athletes,
  wellness,
  medical,
  onSaved,
}: {
  coachId: string;
  athletes: any[];
  wellness: any[];
  medical: any[];
  onSaved: () => void;
}) {
  const [selectedAthlete, setSelectedAthlete] = useState(athletes[0]?.id || '');
  const [status, setStatus] = useState<'Fit' | 'Modified Training' | 'Injured'>('Modified Training');
  const [injuryArea, setInjuryArea] = useState('');
  const [notes, setNotes] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSaveMedical(e: React.FormEvent) {
    e.preventDefault();
    const targetId = selectedAthlete || athletes[0]?.id;
    if (!targetId || !injuryArea) return;
    setSaving(true);
    const { error } = await supabase.from('medical_records').insert({
      athlete_id: targetId,
      coach_id: coachId,
      status,
      injury_area: injuryArea,
      physio_notes: notes,
      expected_return_date: returnDate || null,
    });
    if (!error) {
      setInjuryArea('');
      setNotes('');
      setReturnDate('');
      onSaved();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Squad Wellness & Readiness Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <h3 className="font-bold text-sm text-emerald-400 mb-3">Squad Wellness & Readiness Matrix (All 5 Metrics + RPE)</h3>
        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2">Athlete</th>
              <th>Date</th>
              <th>Sleep</th>
              <th>Fatigue</th>
              <th>Soreness</th>
              <th>Stress</th>
              <th>Mood</th>
              <th>Score (/50)</th>
              <th>sRPE Load</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {athletes.map((a) => {
              const latest = wellness.find((w) => w.athlete_id === a.id);
              const flagged = latest && (latest.composite_score < 28 || latest.muscle_soreness <= 4);
              return (
                <tr key={a.id} className={flagged ? 'bg-rose-950/20' : ''}>
                  <td className="py-2 font-semibold">{a.full_name}</td>
                  <td className="text-slate-400">{latest ? latest.log_date : '—'}</td>
                  <td>{latest ? latest.sleep_quality : '—'}</td>
                  <td>{latest ? latest.fatigue_level : '—'}</td>
                  <td className={latest?.muscle_soreness <= 4 ? 'text-rose-400 font-bold' : ''}>{latest ? latest.muscle_soreness : '—'}</td>
                  <td>{latest ? latest.stress_level : '—'}</td>
                  <td>{latest ? latest.mood : '—'}</td>
                  <td className="font-bold text-emerald-400">{latest ? `${latest.composite_score}/50` : 'No Log'}</td>
                  <td className="text-amber-400">{latest ? `${latest.srpe_load} AU` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Medical & Rehab Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <h3 className="font-bold text-sm text-emerald-400">Medical & Rehab Hub</h3>
        <form onSubmit={handleSaveMedical} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Athlete</label>
            <select value={selectedAthlete || athletes[0]?.id || ''} onChange={(e) => setSelectedAthlete(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2">
              {athletes.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2">
              <option value="Fit">Fit</option>
              <option value="Modified Training">Modified Training</option>
              <option value="Injured">Injured</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Area / Diagnosis</label>
            <input required type="text" value={injuryArea} onChange={(e) => setInjuryArea(e.target.value)} placeholder="Left Hamstring" className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-2" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Physio Notes / Return</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Eccentric rehab" className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-2" />
          </div>
          <button disabled={saving} type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2 rounded">
            {saving ? 'Saving...' : '+ Log Medical'}
          </button>
        </form>

        <div className="divide-y divide-slate-800 text-xs">
          {medical.map((m) => {
            const ath = athletes.find((a) => a.id === m.athlete_id);
            return (
              <div key={m.id} className="py-2 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-white">{ath?.full_name}</span> • <span className="text-slate-300">{m.injury_area}</span>
                  {m.physio_notes && <span className="text-slate-400"> — {m.physio_notes}</span>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.status === 'Fit' ? 'bg-emerald-500/20 text-emerald-300' : m.status === 'Modified Training' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {m.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
