'use client';

import { useState } from 'react';
import { CoachingDiscipline } from '@/lib/disciplines';
import CoachRoleSignupSection from './CoachRoleSignupSection';
import { ShieldCheck, KeyRound } from 'lucide-react';

export default function AuthSignupFields({
  role,
  setRole,
  discipline,
  setDiscipline,
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
  managerId,
  setManagerId,
  inviteCode,
  setInviteCode,
  platformKey,
  setPlatformKey,
}: {
  role: 'athlete' | 'coach' | 'medical' | 'manager';
  setRole: (r: 'athlete' | 'coach' | 'medical' | 'manager') => void;
  discipline: CoachingDiscipline;
  setDiscipline: (d: CoachingDiscipline) => void;
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
  managerId: string;
  setManagerId: (v: string) => void;
  inviteCode: string;
  setInviteCode: (v: string) => void;
  platformKey: string;
  setPlatformKey: (v: string) => void;
}) {
  const [coachType, setCoachType] = useState<'head' | 'assistant'>(coachId ? 'assistant' : 'head');

  function switchCoachType(next: 'head' | 'assistant') {
    setCoachType(next);
    if (next === 'head') setCoachId('');
    else setManagerId('');
  }

  return (
    <>
      <div>
        <label className="block text-xs text-slate-400 mb-1">I am a...</label>
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          {(['athlete', 'coach', 'medical', 'manager'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`py-2 rounded-lg border font-medium capitalize ${
                role === r ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {role === 'coach' && (
        <CoachRoleSignupSection
          coachType={coachType}
          onSwitchCoachType={switchCoachType}
          discipline={discipline}
          setDiscipline={setDiscipline}
          platformKey={platformKey}
          setPlatformKey={setPlatformKey}
          managerId={managerId}
          setManagerId={setManagerId}
          inviteCode={inviteCode}
          setInviteCode={setInviteCode}
        />
      )}

      {role === 'manager' && (
        <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-3 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
            <KeyRound className="w-3.5 h-3.5" /> Platform License Key (Invite-Only Access)
          </label>
          <input
            required
            type="text"
            value={platformKey}
            onChange={(e) => setPlatformKey(e.target.value)}
            placeholder="Enter key issued by FAST Athletics Admin"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/40 text-xs font-mono uppercase text-amber-200"
          />
          <p className="text-[10px] text-slate-400">
            New Program Manager accounts require an admin-issued license key.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-400 mb-1">Full Name</label>
        <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Alroy Dixon" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
      </div>

      {role === 'athlete' && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Grade</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <option>Grade 8</option><option>Grade 9</option><option>Grade 10</option><option>Grade 11</option><option>Grade 12</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <option value="Boy">Boy</option><option value="Girl">Girl</option>
            </select>
          </div>
        </div>
      )}

      {role === 'medical' && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Clinical Specialty</label>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
            <option>Sports Physician</option><option>Physiotherapist</option><option>Biokineticist</option>
            <option>Massage Therapist</option><option>Biomechanist</option><option>Chiropractor</option>
          </select>
        </div>
      )}

      {(role === 'athlete' || role === 'medical' || (role === 'coach' && coachType === 'assistant')) && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Head Coach Squad ID (Required)</label>
            <input required type="text" value={coachId} onChange={(e) => setCoachId(e.target.value)} placeholder="Paste Head Coach ID or use invite link" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono" />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs text-emerald-400 font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {role === 'athlete' ? 'Squad Access Code (Ask your Coach)' : 'Staff Access Code (Ask Head Coach)'}
            </label>
            <input required type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder={role === 'athlete' ? 'e.g. FAST2026' : 'e.g. STAFF2026'} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-emerald-500/50 text-xs font-mono uppercase" />
          </div>
        </>
      )}
    </>
  );
}
