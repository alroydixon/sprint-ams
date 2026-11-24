'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function MedicalRecordsSection({
  medicalStaffId,
  athletes,
  records,
  onChanged,
}: {
  medicalStaffId: string;
  athletes: any[];
  records: any[];
  onChanged: () => void;
}) {
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [injuryArea, setInjuryArea] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [status, setStatus] = useState<'Rehab' | 'Modified Training' | 'Cleared'>('Rehab');
  const [restrictions, setRestrictions] = useState('');
  const [saving, setSaving] = useState(false);

  async function addMedicalRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAthleteId || !injuryArea.trim()) return;
    setSaving(true);

    await supabase.from('medical_records').insert({
      athlete_id: selectedAthleteId,
      medical_staff_id: medicalStaffId,
      injury_area: injuryArea.trim(),
      diagnosis: diagnosis.trim() || null,
      status,
      restrictions: restrictions.trim() || null,
    });

    setSelectedAthleteId('');
    setInjuryArea('');
    setDiagnosis('');
    setStatus('Rehab');
    setRestrictions('');
    setSaving(false);
    onChanged();
  }

  async function updateStatus(recordId: string, nextStatus: string) {
    await supabase.from('medical_records').update({ status: nextStatus }).eq('id', recordId);
    onChanged();
  }

  return (
    <>
      <form onSubmit={addMedicalRecord} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Log Clinical Assessment / Return-to-Play Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <select
            required
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          >
            <option value="">Select Athlete...</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.grade || '—'})
              </option>
            ))}
          </select>

          <input
            required
            type="text"
            placeholder="Body Area (e.g. Right Hamstring)"
            value={injuryArea}
            onChange={(e) => setInjuryArea(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          >
            <option value="Rehab">Rehab (No Sprinting)</option>
            <option value="Modified Training">Modified Training</option>
            <option value="Cleared">Cleared for Full Training</option>
          </select>

          <input
            type="text"
            placeholder="Training Restrictions (e.g. No blocks / max 80%)"
            value={restrictions}
            onChange={(e) => setRestrictions(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
        </div>

        <input
          type="text"
          placeholder="Clinical Notes / Diagnosis (e.g. Grade 1 Biceps Femoris strain — isometric loading)"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2"
        />

        <button
          disabled={saving}
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg"
        >
          {saving ? 'Saving...' : 'Save Medical Record'}
        </button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-emerald-400">
          Squad Injury &amp; Clearance Log ({records.length})
        </h3>

        {records.length === 0 ? (
          <p className="text-slate-400 py-4 text-center">No medical cases logged yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {records.map((rec) => {
              const ath = athletes.find((a) => a.id === rec.athlete_id);
              const isCleared = rec.status === 'Cleared';
              return (
                <div
                  key={rec.id}
                  className={`bg-slate-950 border rounded-xl p-3.5 space-y-2 ${
                    isCleared ? 'border-emerald-500/40' : 'border-rose-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="text-sm text-white block">{ath?.full_name || 'Athlete'}</strong>
                      <span className="text-slate-300 font-semibold">{rec.injury_area}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                        isCleared
                          ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                          : 'bg-rose-950 border-rose-600 text-rose-300'
                      }`}
                    >
                      {isCleared ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {rec.status}
                    </span>
                  </div>

                  {rec.diagnosis && <p className="text-slate-300">{rec.diagnosis}</p>}
                  {rec.restrictions && (
                    <p className="text-amber-300 font-semibold">Restrictions: {rec.restrictions}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800">
                    {(['Rehab', 'Modified Training', 'Cleared'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateStatus(rec.id, st)}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          rec.status === st
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
