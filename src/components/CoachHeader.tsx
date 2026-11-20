'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogOut, Copy, Check, Mail, UserCog, UserPlus, KeyRound } from 'lucide-react';

export default function CoachHeader({
  coach,
  effectiveCoachId,
  isAssistant = false,
  activeCount,
  onDigestClick,
  onEditClick,
  onSignOut,
}: {
  coach: any;
  effectiveCoachId: string;
  isAssistant?: boolean;
  activeCount: number;
  onDigestClick: () => void;
  onEditClick: () => void;
  onSignOut: () => void;
}) {
  const [copiedType, setCopiedType] = useState<'athlete' | 'assistant' | null>(null);
  const [showCodes, setShowCodes] = useState(false);
  const [squadCode, setSquadCode] = useState(coach.squad_invite_code || 'FAST2026');
  const [staffCode, setStaffCode] = useState(coach.staff_invite_code || 'STAFF2026');
  const [savingCodes, setSavingCodes] = useState(false);

  function copyInviteLink(type: 'athlete' | 'assistant') {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vercel.app';
    const roleParam = type === 'assistant' ? 'coach' : 'athlete';
    const url = `${origin}/?role=${roleParam}&coach=${encodeURIComponent(effectiveCoachId)}`;
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  }

  async function saveCodes(e: React.FormEvent) {
    e.preventDefault();
    setSavingCodes(true);
    await supabase
      .from('profiles')
      .update({
        squad_invite_code: squadCode.trim().toUpperCase() || 'FAST2026',
        staff_invite_code: staffCode.trim().toUpperCase() || 'STAFF2026',
      })
      .eq('id', effectiveCoachId);
    setSavingCodes(false);
    setShowCodes(false);
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center font-bold text-emerald-400">
            {coach.avatar_url ? (
              <img src={coach.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (coach.full_name || 'CH').slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-emerald-400">Coach Portal • {coach.full_name}</h1>
              {isAssistant && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold">
                  Assistant Coach
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {coach.club_name || 'FAST Sprint Academy'} • {activeCount} Active Athletes
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => copyInviteLink('athlete')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-emerald-400 font-semibold"
          >
            {copiedType === 'athlete' ? <><Check className="w-3.5 h-3.5" /> Athlete Link Copied</> : <><Copy className="w-3.5 h-3.5" /> Athlete Invite</>}
          </button>
          {!isAssistant && (
            <>
              <button
                type="button"
                onClick={() => copyInviteLink('assistant')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-sky-400 font-semibold"
              >
                {copiedType === 'assistant' ? <><Check className="w-3.5 h-3.5" /> Assistant Link Copied</> : <><UserPlus className="w-3.5 h-3.5" /> + Assistant Coach</>}
              </button>
              <button
                type="button"
                onClick={() => setShowCodes(!showCodes)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-amber-300 font-semibold"
              >
                <KeyRound className="w-3.5 h-3.5" /> Access Codes
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onDigestClick}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg"
          >
            <Mail className="w-3.5 h-3.5" /> Weekly Report
          </button>
          <button
            type="button"
            onClick={onEditClick}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200"
          >
            <UserCog className="w-3.5 h-3.5" /> Edit Profile
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {showCodes && !isAssistant && (
        <form onSubmit={saveCodes} className="max-w-6xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-3 text-xs border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Athlete Squad Code:</span>
            <input
              type="text"
              value={squadCode}
              onChange={(e) => setSquadCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 font-mono uppercase text-emerald-300 w-32"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Assistant Coach / Medical Code:</span>
            <input
              type="text"
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 font-mono uppercase text-sky-300 w-32"
            />
          </div>
          <button disabled={savingCodes} type="submit" className="bg-emerald-500 text-slate-950 font-semibold px-3 py-1 rounded">
            {savingCodes ? 'Saving...' : 'Save Codes'}
          </button>
        </form>
      )}
    </header>
  );
}
