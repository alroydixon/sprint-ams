'use client';

import { DISCIPLINE_OPTIONS, CoachingDiscipline } from '@/lib/disciplines';
import { Shield, UserPlus, Check, KeyRound, LogOut, Calendar } from 'lucide-react';

export default function ManagerHeaderAndFilters({
  manager,
  coaches,
  activeAthleteCount,
  copiedInvite,
  onCopyInvite,
  showAccessControl,
  setShowAccessControl,
  onSignOut,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  applyQuickRange,
  selectedDiscipline,
  setSelectedDiscipline,
}: {
  manager: any;
  coaches: any[];
  activeAthleteCount: number;
  copiedInvite: boolean;
  onCopyInvite: () => void;
  showAccessControl: boolean;
  setShowAccessControl: (v: boolean) => void;
  onSignOut: () => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  applyQuickRange: (days: number | null) => void;
  selectedDiscipline: CoachingDiscipline;
  setSelectedDiscipline: (d: CoachingDiscipline) => void;
}) {
  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-amber-400">Program Manager • {manager.full_name}</h1>
              <p className="text-xs text-slate-400">
                Closed Program Group • {coaches.length} Coaches • {activeAthleteCount} Active Athletes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={onCopyInvite} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg">
              {copiedInvite ? <><Check className="w-3.5 h-3.5" /> Coach Invite Copied</> : <><UserPlus className="w-3.5 h-3.5" /> + Invite Head Coach</>}
            </button>
            <button type="button" onClick={() => setShowAccessControl(!showAccessControl)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-3 py-1.5 rounded-lg">
              <KeyRound className="w-3.5 h-3.5" /> Access &amp; Coaches ({coaches.length})
            </button>
            <button type="button" onClick={onSignOut} className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1.5">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-4 h-4 text-amber-400" />
            <button type="button" onClick={() => applyQuickRange(7)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white">Last 7 Days</button>
            <button type="button" onClick={() => applyQuickRange(14)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white">Last 14 Days</button>
            <button type="button" onClick={() => applyQuickRange(null)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300">All Dates</button>
            <span className="ml-1">Custom:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" />
            <span>to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {DISCIPLINE_OPTIONS.map((opt) => {
            const count = coaches.filter((c) => !c.is_suspended && (c.coaching_discipline || 'sprints') === opt.id).length;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedDiscipline(opt.id)}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectedDiscipline === opt.id ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{opt.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedDiscipline === opt.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
