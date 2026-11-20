'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MedicalHubTab from './MedicalHubTab';
import { CalendarPlus, Clock, MapPin, Trash2 } from 'lucide-react';

const SPECIALTIES = [
  'Physiotherapist',
  'Sports Physician',
  'Biokineticist',
  'Chiropractor',
  'Sports Massage Therapist',
  'Biomechanist',
];

export default function ManagerMedicalTab({
  managerName,
  coaches,
  athletes,
  medical,
  onSaved,
}: {
  managerName: string;
  coaches: any[];
  athletes: any[];
  medical: any[];
  onSaved: () => void;
}) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [athleteId, setAthleteId] = useState('');
  const [practitionerName, setPractitionerName] = useState('');
  const [specialty, setSpecialty] = useState('Physiotherapist');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  const coachIds = coaches.map((c) => c.id);

  useEffect(() => {
    loadAppointments();
  }, [coaches]);

  async function loadAppointments() {
    if (coachIds.length === 0) {
      setAppointments([]);
      return;
    }
    const { data } = await supabase
      .from('medical_appointments')
      .select('*')
      .in('coach_id', coachIds)
      .order('appointment_date', { ascending: true });
    setAppointments(data || []);
  }

  async function bookAppointment(e: React.FormEvent) {
    e.preventDefault();
    const chosenAthlete = athletes.find((a) => a.id === athleteId);
    const targetCoachId = chosenAthlete?.coach_id || coachIds.at(0);
    if (!chosenAthlete || !targetCoachId || !practitionerName.trim() || !apptDate) return;

    setBooking(true);
    await supabase.from('medical_appointments').insert({
      coach_id: targetCoachId,
      athlete_id: chosenAthlete.id,
      practitioner_name: practitionerName.trim(),
      specialty,
      appointment_date: apptDate,
      appointment_time: apptTime.trim() || null,
      location: location.trim() || null,
      notes: notes.trim() || null,
      booked_by: `Manager ${managerName}`,
    });

    setAthleteId('');
    setPractitionerName('');
    setApptDate('');
    setApptTime('');
    setLocation('');
    setNotes('');
    setBooking(false);
    loadAppointments();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('medical_appointments').update({ status }).eq('id', id);
    loadAppointments();
  }

  async function deleteAppointment(id: string) {
    await supabase.from('medical_appointments').delete().eq('id', id);
    loadAppointments();
  }

  const athleteMap = new Map<string, any>();
  athletes.forEach((a) => athleteMap.set(a.id, a));

  const defaultCoachId = coachIds.at(0) || '';

  return (
    <div className="space-y-6">
      {/* Book Medical Appointment Card */}
      <form onSubmit={bookAppointment} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
          <CalendarPlus className="w-4 h-4 text-emerald-400" /> Book Medical / Rehab Appointment
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            required
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
          >
            <option value="">-- Select Athlete --</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.grade || ''})
              </option>
            ))}
          </select>

          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          >
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            required
            type="text"
            placeholder="Practitioner / Clinic Name"
            value={practitionerName}
            onChange={(e) => setPractitionerName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            required
            type="date"
            value={apptDate}
            onChange={(e) => setApptDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
          <input
            type="text"
            placeholder="Time (e.g. 15:30)"
            value={apptTime}
            onChange={(e) => setApptTime(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
          <input
            type="text"
            placeholder="Clinic / Venue (e.g. Stellenbosch Physio)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Referral reason / injury notes (e.g. Left hamstring ultrasound & rehab check)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 min-w-[220px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
          <button
            disabled={booking || !defaultCoachId}
            type="submit"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-lg"
          >
            {booking ? 'Booking...' : '+ Confirm Appointment'}
          </button>
        </div>

        {appointments.length > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Scheduled &amp; Recent Appointments ({appointments.length})
            </span>
            {appointments.map((ap) => {
              const ath = athleteMap.get(ap.athlete_id);
              return (
                <div key={ap.id} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong className="text-white">{ath?.full_name || 'Athlete'}</strong>
                    <span className="text-emerald-400 font-semibold ml-1.5">• {ap.specialty} ({ap.practitioner_name})</span>
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 mt-0.5">
                      <span>📅 {ap.appointment_date}</span>
                      {ap.appointment_time && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {ap.appointment_time}</span>}
                      {ap.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-400" /> {ap.location}</span>}
                      {ap.notes && <span className="text-slate-300">• {ap.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={ap.status}
                      onChange={(e) => updateStatus(ap.id, e.target.value)}
                      className={`rounded px-2 py-1 text-[11px] font-bold border ${
                        ap.status === 'Completed'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : ap.status === 'Cancelled'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button type="button" onClick={() => deleteAppointment(ap.id)} className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </form>

      {/* Full 5-Stage Return-to-Play Medical Hub */}
      {defaultCoachId ? (
        <MedicalHubTab
          coachId={defaultCoachId}
          reporterName={`Manager ${managerName}`}
          isCoach={true}
          athletes={athletes}
          medical={medical}
          onSaved={onSaved}
        />
      ) : (
        <p className="text-xs text-slate-500 text-center py-4">Assign a Head Coach to this discipline before logging medical cases.</p>
      )}
    </div>
  );
}
