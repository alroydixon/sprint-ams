'use client';

import { useState } from 'react';
import { CoachingDiscipline, DISCIPLINE_OPTIONS } from '@/lib/disciplines';
import { ShieldCheck } from 'lucide-react';

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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => switchCoachType('head')}
              className={`py-2 rounded-lg border font-semibold ${
                coachType === 'head' ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 text-slate-400'
              }`}
            >
              Head Coach (New Squad)
            </button>
            <button
              type="button"
              onClick={() => switchCoachType('assistant')}
              className={`py-2 rounded-lg border font-semibold ${
                coachType === 'assistant' ? 'border-sky-500 bg-sky-500/15 text-sky-300' : 'border-slate-700 text-slate-400'
              }`}
            >
              Assistant Coach (Join)
            </button>
          </div>

          {coachType === 'head' && (
            <div>
              <label className="block text-xs text-emerald-400 font-semibold mb-1.5">Primary Coaching Discipline</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {DISCIPLINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDiscipline(opt.id)}
                    className={`p-2 rounded-lg border text-left transition ${
                      discipline === opt.id
                        ? 'border-emerald-500 bg-emerald-500/15 text-white'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold block text-emerald-300">{opt.label}</span>
                    <span className="text-[10px] leading-tight block mt-0.5 text-slate-400">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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

      {role === 'coach' && coachType === 'head' && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
          <label className="block text-[11px] text-slate-400">
            Program Manager ID (Optional — only if joining a closed Academy / School Program)
          </label>
          <input type="text" value={managerId} onChange={(e) => setManagerId(e.target.value)} placeholder="Leave blank if independent Head Coach" className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono" />
          {managerId.trim() !== '' && (
            <input required type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Program Access Code (e.g. FASTPROGRAM)" className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-amber-500/50 text-xs font-mono uppercase" />
          )}
        </div>
      )}
    </>
  );
}
