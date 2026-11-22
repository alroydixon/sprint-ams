'use client';

import { useState } from 'react';
import { DISCIPLINE_OPTIONS } from '@/lib/disciplines';
import ProfileSettingsModal from './ProfileSettingsModal';
import SuperAdminKeysModal from './SuperAdminKeysModal';
import {
  UserPlus,
  Check,
  KeyRound,
  Mail,
  UserCog,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export default function CoachHeader({
  coach,
  isHeadCoach,
  activeAthleteCount,
  onCoachUpdated,
  onOpenAccessModal,
  onOpenReportModal,
  onSignOut,
}: {
  coach: any;
  isHeadCoach: boolean;
  activeAthleteCount: number;
  onCoachUpdated: (updated: any) => void;
  onOpenAccessModal: () => void;
  onOpenReportModal: () => void;
  onSignOut: () => void;
}) {
  const [copiedRole, setCopiedRole] = useState<'athlete' | 'coach' | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  const disciplineMeta =
    DISCIPLINE_OPTIONS.find((d) => d.id === coach.coaching_discipline) || DISCIPLINE_OPTIONS[0];
  const isSuperAdmin = coach.email?.toLowerCase() === 'alroydixon57@gmail.com';

  function copyInviteLink(targetRole: 'athlete' | 'coach') {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://vercel.app';
    const url = `${origin}/?role=${targetRole}&coach=${encodeURIComponent(coach.id)}`;
    navigator.clipboard.writeText(url);
    setCopiedRole(targetRole);
    setTimeout(() => setCopiedRole(null), 2500);
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center font-bold text-sm text-emerald-400 shrink-0">
              {coach.avatar_url ? (
                <img src={coach.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (coach.full_name || 'CH').slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-emerald-400">
                  Coach Portal • {coach.full_name}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold">
                  {disciplineMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {coach.club_name || 'FAST Athletics Academy'} • {activeAthleteCount} Active Athletes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setShowSuperAdmin(true)}
                className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold px-3 py-1.5 rounded-lg"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Client Keys
              </button>
            )}

            {isHeadCoach && (
              <>
                <button
                  type="button"
                  onClick={() => copyInviteLink('athlete')}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold px-3 py-1.5 rounded-lg"
                >
                  {copiedRole === 'athlete' ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Athlete Invite Copied
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Athlete Invite
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => copyInviteLink('coach')}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold px-3 py-1.5 rounded-lg"
                >
                  {copiedRole === 'coach' ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Assistant Link Copied
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> + Assistant Coach
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onOpenAccessModal}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-3 py-1.5 rounded-lg"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Access Codes
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onOpenReportModal}
              className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg"
            >
              <Mail className="w-3.5 h-3.5" /> Weekly Report
            </button>

            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg"
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
      </header>

      {showProfileModal && (
        <ProfileSettingsModal
          profile={coach}
          onUpdated={onCoachUpdated}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showSuperAdmin && (
        <SuperAdminKeysModal onClose={() => setShowSuperAdmin(false)} />
      )}
    </>
  );
}
