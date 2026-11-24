'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import MedicalActiveCaseCard, { RTP_STAGES } from './MedicalActiveCaseCard';
import { Plus, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function MedicalRecordsSection({
  medicalStaffId,
  athletes,
  records,
  activeDisciplineLabel,
  onChanged,
}: {
  medicalStaffId: string;
  athletes: any[];
  records: any[];
  activeDisciplineLabel: string;
  onChanged: () => void;
}) {
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [injuryArea, setInjuryArea] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [rtpStage, setRtpStage] = useState<number>(1);
  const [restrictions, setRestrictions] = useState('');
  const [saving, setSaving] = useState(false);

  async function addMedicalRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAthleteId || !injuryArea.trim()) return;
    setSaving(true);

    const stageMeta = RTP_STAGES.find((s) => s.stage === rtpStage) || RTP_STAGES[0];
    await supabase.from('medical_records').insert({
      athlete_id: selectedAthleteId,
      medical_staff_id: medicalStaffId,
      injury_area: injuryArea.trim(),
      diagnosis: diagnosis.trim() || null,
      status: stageMeta.status,
      rtp_stage: stageMeta.stage,
      restrictions: restrictions.trim() || null,
    });

    setSelectedAthleteId('');
    setInjuryArea('');
    setDiagnosis('');
    setRtpStage(1);
    setRestrictions('');
    setSaving(false);
    onChanged();
  }

  async function reopenCase(recId: string) {
    await supabase
      .from('medical_records')
      .update({ rtp_stage: 3, status: 'Modified Training' })
      .eq('id', recId);
    onChanged();
  }

  const activeCases = records.filter((r) => r.status !== 'Cleared' && Number(r.rtp_stage) !== 5);
  const clearedCases = records.filter((r) => r.status === 'Cleared' || Number(r.rtp_stage) === 5);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Active 5-Stage Return-to-Play Cases • {activeDisciplineLabel} ({activeCases.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Tap any stage pill to advance athlete RTP progression
          </span>
        </div>

        {activeCases.length === 0 ? (
          <p className="text-slate-400 py-4 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-xl">
            No active injury cases reported in {activeDisciplineLabel}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCases.map((rec) => {
              const ath = athletes.find((a) => a.id === rec.athlete_id);
              return (
                <MedicalActiveCaseCard
                  key={rec.id}
                  rec={rec}
                  athleteName={ath?.full_name || 'Athlete'}
                  onChanged={onChanged}
                />
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={addMedicalRecord} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Log New Athlete Injury Report ({activeDisciplineLabel})
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
            value={rtpStage}
            onChange={(e) => setRtpStage(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          >
            {RTP_STAGES.map((st) => (
              <option key={st.stage} value={st.stage}>
                {st.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Training Restrictions (e.g. No sprinting)"
            value={restrictions}
            onChange={(e) => setRestrictions(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
        </div>

        <input
          type="text"
          placeholder="Clinical Notes / Diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2"
        />

        <button
          disabled={saving}
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg"
        >
          {saving ? 'Saving...' : 'Create Injury Report Card'}
        </button>
      </form>

      {clearedCases.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Cleared Athletes (Stage 5 • {clearedCases.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {clearedCases.map((rec) => {
              const ath = athletes.find((a) => a.id === rec.athlete_id);
              return (
                <div key={rec.id} className="bg-slate-950 border border-emerald-500/30 rounded-lg p-2.5 flex justify-between items-center gap-2">
                  <div>
                    <strong className="text-white">{ath?.full_name || 'Athlete'}</strong>
                    <span className="text-slate-400 ml-2">{rec.injury_area}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => reopenCase(rec.id)}
                    className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-amber-300 font-semibold"
                  >
                    Re-Open Stage 3
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
