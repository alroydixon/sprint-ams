'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import MedicalActiveCases from './MedicalActiveCases';
import { Link2, Check } from 'lucide-react';

export default function MedicalHubTab({
  coachId,
  reporterName,
  isCoach,
  athletes,
  medical,
  onSaved,
}: {
  coachId: string;
  reporterName: string;
  isCoach: boolean;
  athletes: any[];
  medical: any[];
  onSaved: () => void;
}) {
  const [selectedAthlete, setSelectedAthlete] = useState(athletes.at(0)?.id || '');
  const [status, setStatus] = useState<'Injured' | 'Modified Training'>('Injured');
  const [injuryArea, setInjuryArea] = useState('');
  const [diagnostics, setDiagnostics] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSpec, setBookingSpec] = useState('Sports Physician');
  const [initialNote, setInitialNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedMedInvite, setCopiedMedInvite] = useState(false);

  function copyMedicalInvite() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vercel.app';
    const url = `${origin}/?role=medical&coach=${encodeURIComponent(coachId)}`;
    navigator.clipboard.writeText(url);
    setCopiedMedInvite(true);
    setTimeout(() => setCopiedMedInvite(false), 2500);
  }

  async function handleCreateCase(e: React.FormEvent) {
    e.preventDefault();
    const targetId = selectedAthlete || athletes.at(0)?.id;
    const cleanArea = injuryArea.trim();
    if (!targetId || !cleanArea) return;
    setSaving(true);

    const today = new Date().toISOString().slice(0, 10);

    // Check if an open case for this same athlete & injury already exists to prevent duplicates
    const existingOpen = medical.find(
      (m) =>
        !m.is_cleared &&
        m.athlete_id === targetId &&
        m.injury_area.trim().toLowerCase() === cleanArea.toLowerCase()
    );

    if (existingOpen) {
      const prevLog: any[] = Array.isArray(existingOpen.progress_log) ? existingOpen.progress_log : [];
      const updatedLog = [
        {
          date: today,
          by: reporterName,
          stage: existingOpen.rtp_stage || 1,
          note: initialNote.trim() || diagnostics.trim() || `Follow-up note added (${status})`,
        },
        ...prevLog,
      ];

      await supabase
        .from('medical_records')
        .update({
          status,
          physician_diagnostics: diagnostics.trim() || existingOpen.physician_diagnostics,
          next_booking_date: bookingDate || existingOpen.next_booking_date,
          next_booking_specialist: bookingDate ? bookingSpec : existingOpen.next_booking_specialist,
          progress_log: updatedLog,
          updated_by_name: reporterName,
        })
        .eq('id', existingOpen.id);
    } else {
      const firstLog = [
        {
          date: today,
          by: reporterName,
          stage: 1,
          note: initialNote.trim() || diagnostics.trim() || `Initial injury reported: ${cleanArea}`,
        },
      ];

      await supabase.from('medical_records').insert({
        athlete_id: targetId,
        coach_id: coachId,
        status,
        injury_area: cleanArea,
        rtp_stage: 1,
        physician_diagnostics: diagnostics.trim() || null,
        next_booking_date: bookingDate || null,
        next_booking_specialist: bookingDate ? bookingSpec : null,
        progress_log: firstLog,
        updated_by_name: reporterName,
        is_cleared: false,
      });
    }

    setInjuryArea('');
    setDiagnostics('');
    setBookingDate('');
    setInitialNote('');
    setSaving(false);
    onSaved();
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h3 className="font-bold text-sm text-emerald-400">
              5-Stage Return-to-Play & Clinical Tracking Hub
            </h3>
            <p className="text-[11px] text-slate-400">
              Physician Diagnostics → Physiotherapy → Biokinetics Force Testing → Return-to-Sprint → Massage & Clearance
            </p>
          </div>
          {isCoach && (
            <button
              type="button"
              onClick={copyMedicalInvite}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-emerald-400 font-semibold"
            >
              {copiedMedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Medical Invite Copied
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" /> Invite Medical Staff
                </>
              )}
            </button>
          )}
        </div>

        <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Athlete</label>
              <select
                value={selectedAthlete || athletes.at(0)?.id || ''}
                onChange={(e) => setSelectedAthlete(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
              >
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Training Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
              >
                <option value="Injured">Injured (No Sprint Load)</option>
                <option value="Modified Training">Modified Training</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Injury / Condition</label>
              <input
                required
                type="text"
                value={injuryArea}
                onChange={(e) => setInjuryArea(e.target.value)}
                placeholder="e.g. Left Hamstring Strain"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Initial Diagnostics / Notes</label>
              <input
                type="text"
                value={diagnostics}
                onChange={(e) => setDiagnostics(e.target.value)}
                placeholder="e.g. Grade 1 distal biceps femoris"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Clinical Booking Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Book Specialist</label>
              <select
                value={bookingSpec}
                onChange={(e) => setBookingSpec(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
              >
                <option>Sports Physician</option>
                <option>Physiotherapist</option>
                <option>Biokineticist</option>
                <option>Massage Therapist</option>
                <option>Biomechanist</option>
                <option>Chiropractor</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Stage 1 Action Note</label>
              <input
                type="text"
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                placeholder="e.g. Ice, compression, MRI booked"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
              />
            </div>
          </div>

          <button
            disabled={saving || athletes.length === 0}
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg"
          >
            {saving ? 'Saving...' : '+ Start Stage 1 Return-to-Play Case'}
          </button>
        </form>
      </div>

      <MedicalActiveCases
        reporterName={reporterName}
        athletes={athletes}
        medical={medical}
        onSaved={onSaved}
      />
    </div>
  );
}
