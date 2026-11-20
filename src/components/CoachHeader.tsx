'use client';

import { LogOut, UserCog, Send } from 'lucide-react';

export default function CoachHeader({
  coach,
  activeCount,
  onDigestClick,
  onEditClick,
  onSignOut,
}: {
  coach: any;
  activeCount: number;
  onDigestClick: () => void;
  onEditClick: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Coach Portal</span>
          <h1 className="text-lg font-bold">
            {coach.full_name} • Active Squad ({activeCount})
          </h1>
          {coach.phone && (
            <p className="text-xs text-slate-400">
              {coach.phone} • {coach.email}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDigestClick}
            className="flex items-center gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 px-3 py-2 rounded-lg text-slate-950 font-semibold"
          >
            <Send className="w-3.5 h-3.5" /> Weekly Digest
          </button>
          <button
            onClick={onEditClick}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-emerald-400 font-semibold"
          >
            <UserCog className="w-3.5 h-3.5" /> Edit Profile
          </button>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-300"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
