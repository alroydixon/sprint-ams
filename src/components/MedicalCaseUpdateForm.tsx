'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2 } from 'lucide-react';

export const RTP_STAGES = [
  { stage: 1, short: '1. Physician & Acute', full: 'Stage 1: Acute Assessment & Sports Physician Diagnostics' },
  { stage: 2, short: '2. Physiotherapy', full: 'Stage 2: Physiotherapy & Pain-Free Mobility' },
  { stage: 3, short: '3. Biokinetics Force', full: 'Stage 3: Biokinetics Force Testing & Eccentric Load' },
  { stage: 4, short: '4. Return-to-Sprint', full: 'Stage 4: Controlled Track Sprint Progression' },
  { stage: 5, short: '5. Massage & Clear', full: 'Stage 5: Massage Therapy & Full Competition Clearance' },
];

export default function MedicalCaseUpdateForm({
  rec,
  reporterName,
  onCancel,
  onSaved,
}: {
  rec: any;
  reporterName: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [rtpStage, setRtpStage] = useState<number>(rec.rtp_stage || 1);
  const [status, setStatus] = useState<string>(rec.status || 'Injured');
  const [diagnostics, setDiagnostics] = useState<string>(rec.physician_diagnostics || '');
  const [symmetry, setSymmetry] = useState<string>(rec.bio_force_symmetry_pct ? String(rec.bio_force_symmetry_pct) : '');
  const [bookingDate, setBookingDate] = useState<string>(rec.next_booking_date || '');
  const [bookingSpec, setBookingSpec] = useState<string>(rec.next_booking_specialist || 'Physiotherapist');
  const [newEntryNote, setNewEntryNote] = useState('');
  const [saving, setSaving] = useState(false);

  const historyLog: any[] = Array.isArray(rec.progress_log) ? rec.progress_log : [];

  async function handleSave(clearAthlete = false) {
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const nextStage = clearAthlete ? 5 : rtpStage;

    const updatedLog = [...historyLog];
    if (newEntryNote.trim() || nextStage !== (rec.rtp_stage || 1) || clearAthlete) {
      updatedLog.unshift({
        date: today,
        by: reporterName,
        stage: nextStage,
        note:
          newEntryNote.trim() ||
          (clearAthlete
            ? 'Completed Stage 5 Massage Therapy & Full Medical Clearance.'
            : `Progressed to ${RTP_STAGES.find((s) => s.stage === nextStage)?.full}`),
      });
    }

    const updates: any = {
      rtp_stage: nextStage,
      status: clearAthlete ? 'Cleared' : status,
      physician_diagnostics: diagnostics.trim() || null,
      bio_force_symmetry_pct: symmetry ? parseFloat(symmetry) : null,
      next_booking_date: clearAthlete ? null : bookingDate || null,
      next_booking_specialist: clearAthlete ? null : bookingSpec || null,
      progress_log: updatedLog,
      updated_by_name: reporterName,
    };

    if (clearAthlete) {
      updates.is_cleared = true;
      updates.cleared_date = today;
    }

    await supabase.from('medical_records').update(updates).eq('id', rec.id);
    setSaving(false);
    onSaved();
  }

  return (
    <div className="space-y-3 pt-3 border-t border-slate-800 bg-slate-900/50 p-3 rounded-lg text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Advance Return-to-Play Stage</label>
          <select value={rtpStage} onChange={(e) => setRtpStage(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2">
            {RTP_STAGES.map((s) => <option key={s.stage} value={s.stage}>{s.full}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Training Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2">
            <option value="Injured">Injured (No Sprint Load)</option>
            <option value="Modified Training">Modified Training</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Biokinetics Force Symmetry (%)</label>
          <input type="number" step="0.1" placeholder="e.g. 92.5" value={symmetry} onChange={(e) => setSymmetry(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Next Clinical Booking Date</label>
          <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Booked Specialist</label>
          <select value={bookingSpec} onChange={(e) => setBookingSpec(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2">
            <option>Sports Physician</option>
            <option>Physiotherapist</option>
            <option>Biokineticist</option>
            <option>Massage Therapist</option>
            <option>Biomechanist</option>
            <option>Chiropractor</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Sports Physician Diagnostics</label>
          <input type="text" placeholder="e.g. Ultrasound confirmed Grade 1..." value={diagnostics} onChange={(e) => setDiagnostics(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 mb-1">Clinical / Rehab Progress Update (Appends to this case)</label>
        <input type="text" placeholder="e.g. Pain-free isometric holds, cleared for Stage 3 Biokinetics..." value={newEntryNote} onChange={(e) => setNewEntryNote(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2" />
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300">Cancel</button>
        <button disabled={saving} type="button" onClick={() => handleSave(false)} className="px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-semibold">
          {saving ? 'Saving...' : 'Save Progress Update'}
        </button>
        <button disabled={saving} type="button" onClick={() => handleSave(true)} className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-400 text-slate-950 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Complete Stage 5 & Clear to History
        </button>
      </div>
    </div>
  );
}
