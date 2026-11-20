'use client';

import { ShieldCheck } from 'lucide-react';

export default function AuthSignupFields({
  role,
  setRole,
  fullName,
  setFullName,
  grade,
  setGrade,
  age,
  setAge,
  gender,
  setGender,
  specialty,
  setSpecialty,
  coachId,
  setCoachId,
  inviteCode,
  setInviteCode,
}: {
  role: 'athlete' | 'coach' | 'medical';
  setRole: (r: 'athlete' | 'coach' | 'medical') => void;
  fullName: string;
  setFullName: (v: string) => void;
  grade: string;
  setGrade: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  specialty: string;
  setSpecialty: (v: string) => void;
  coachId: string;
  setCoachId: (v: string) => void;
  inviteCode: string;
  setInviteCode: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-xs text-slate-400 mb-1">I am a...</label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button type="button" onClick={() => setRole('athlete')} className={`py-2 rounded-lg border font-medium ${role === 'athlete' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400'}`}>
            Athlete
          </button>
          <button type="button" onClick={() => setRole('coach')} className={`py-2 rounded-lg border font-medium ${role === 'coach' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400'}`}>
            Coach
          </button>
          <button type="button" onClick={() => setRole('medical')} className={`py-2 rounded-lg border font-medium ${role === 'medical' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400'}`}>
            Medical
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Full Name</label>
        <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Lezario Meyer" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
      </div>

      {role === 'athlete' && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Grade</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <option>Grade 8</option>
              <option>Grade 9</option>
              <option>Grade 10</option>
              <option>Grade 11</option>
              <option>Grade 12</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <option value="Boy">Boy</option>
              <option value="Girl">Girl</option>
            </select>
          </div>
        </div>
      )}

      {role === 'medical' && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Clinical Specialty</label>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
            <option>Sports Physician</option>
            <option>Physiotherapist</option>
            <option>Biokineticist</option>
            <option>Massage Therapist</option>
            <option>Biomechanist</option>
            <option>Chiropractor</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-400 mb-1">
          {role === 'coach' ? 'Head Coach Squad ID (Leave blank if creating new squad)' : 'Head Coach Squad ID (Required)'}
        </label>
        <input
          required={role !== 'coach'}
          type="text"
          value={coachId}
          onChange={(e) => setCoachId(e.target.value)}
          placeholder="Paste Head Coach ID or use invite link"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono"
        />
      </div>

      {(role !== 'coach' || coachId.trim() !== '') && (
        <div>
          <label className="flex items-center gap-1 text-xs text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {role === 'athlete' ? 'Squad Access Code (Ask your Coach)' : 'Staff Access Code (Ask Head Coach)'}
          </label>
          <input
            required
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder={role === 'athlete' ? 'e.g. FAST2026' : 'e.g. STAFF2026'}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-emerald-500/50 text-xs font-mono uppercase"
          />
        </div>
      )}
    </>
  );
}
