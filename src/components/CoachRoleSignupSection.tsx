'use client';

import { CoachingDiscipline, DISCIPLINE_OPTIONS } from '@/lib/disciplines';
import { KeyRound } from 'lucide-react';

export default function CoachRoleSignupSection({
  coachType,
  onSwitchCoachType,
  discipline,
  setDiscipline,
  platformKey,
  setPlatformKey,
  managerId,
  setManagerId,
  inviteCode,
  setInviteCode,
}: {
  coachType: 'head' | 'assistant';
  onSwitchCoachType: (next: 'head' | 'assistant') => void;
  discipline: CoachingDiscipline;
  setDiscipline: (d: CoachingDiscipline) => void;
  platformKey: string;
  setPlatformKey: (v: string) => void;
  managerId: string;
  setManagerId: (v: string) => void;
  inviteCode: string;
  setInviteCode: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => onSwitchCoachType('head')}
          className={`py-2 rounded-lg border font-semibold ${
            coachType === 'head' ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 text-slate-400'
          }`}
        >
          Head Coach (New Squad)
        </button>
        <button
          type="button"
          onClick={() => onSwitchCoachType('assistant')}
          className={`py-2 rounded-lg border font-semibold ${
            coachType === 'assistant' ? 'border-sky-500 bg-sky-500/15 text-sky-300' : 'border-slate-700 text-slate-400'
          }`}
        >
          Assistant Coach (Join)
        </button>
      </div>

      {coachType === 'head' && (
        <>
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
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
            <label className="block text-[11px] text-slate-400">
              Program Manager ID (Optional — only if joining a closed Academy / School Program)
            </label>
            <input
              type="text"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              placeholder="Leave blank if independent Head Coach"
              className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono"
            />
            {managerId.trim() !== '' && (
              <input
                required
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Program Access Code (e.g. FASTPROGRAM)"
                className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-amber-500/50 text-xs font-mono uppercase"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
