'use client';

import { calculatePower, getReadinessStatus } from '@/lib/biomechanics';
import { getPrimaryHeadlineEvents, formatMark, isBetterMark } from '@/lib/disciplines';
import { Link2, EyeOff, Eye, IdCard } from 'lucide-react';

export default function SquadRosterTable({
  athletes,
  races,
  sessions,
  tests,
  wellness,
  discipline = 'sprints',
  showHidden,
  copiedId,
  onSelectAthlete,
  onOpenPassport,
  onCopyInvite,
  onToggleArchive,
}: {
  athletes: any[];
  races: any[];
  sessions: any[];
  tests: any[];
  wellness: any[];
  discipline?: string | null;
  showHidden: boolean;
  copiedId: string | null;
  onSelectAthlete: (a: any) => void;
  onOpenPassport: (a: any, e: React.MouseEvent) => void;
  onCopyInvite: (a: any, e: React.MouseEvent) => void;
  onToggleArchive: (a: any, e: React.MouseEvent) => void;
}) {
  const [ev1, ev2] = getPrimaryHeadlineEvents(discipline);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
          <tr>
            <th className="py-3 px-4">Athlete &amp; Readiness</th>
            <th>Grade</th>
            <th>{ev1} Best</th>
            <th>{ev2} Best</th>
            <th>Power (W/kg)</th>
            <th>Volume</th>
            <th className="text-right px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {athletes.map((a) => {
            const athRaces = races.filter((r) => r.athlete_id === a.id);
            const best1 = athRaces
              .filter((r) => r.event === ev1)
              .reduce((best: any, cur: any) => (!best || isBetterMark(Number(cur.time_seconds), Number(best.time_seconds), discipline) ? cur : best), null);
            const best2 = athRaces
              .filter((r) => r.event === ev2)
              .reduce((best: any, cur: any) => (!best || isBetterMark(Number(cur.time_seconds), Number(best.time_seconds), discipline) ? cur : best), null);

            const athTests = tests.filter((t) => t.athlete_id === a.id);
            const latestTest = athTests.at(-1);
            const pwr = latestTest
              ? calculatePower(Number(latestTest.body_weight_kg), latestTest.pushups_1min_reps || 0, latestTest.situps_1min_reps || 0, latestTest.squat_jumps_1min_reps || 0)
              : null;

            const athSessions = sessions.filter((s) => s.athlete_id === a.id);
            const vol = athSessions.reduce(
              (sum, s) => sum + (s.training_runs || []).reduce((acc: number, r: any) => acc + Number(r.distance_m), 0),
              0
            );

            const latestW = wellness.find((w) => w.athlete_id === a.id);
            const readiness = getReadinessStatus(latestW?.composite_score);

            return (
              <tr key={a.id} onClick={() => onSelectAthlete(a)} className="hover:bg-slate-800/50 cursor-pointer transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-emerald-500/40 overflow-hidden flex items-center justify-center font-bold text-[10px] text-emerald-400 shrink-0">
                      {a.avatar_url ? (
                        <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (a.full_name || 'AT').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="font-bold text-white">{a.full_name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${readiness.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${readiness.dot}`} />
                      {readiness.label}
                    </span>
                  </div>
                </td>
                <td className="text-slate-300">{a.grade || '—'}</td>
                <td className="font-mono font-bold text-emerald-400">{best1 ? formatMark(Number(best1.time_seconds), discipline) : '—'}</td>
                <td className="font-mono font-bold text-emerald-400">{best2 ? formatMark(Number(best2.time_seconds), discipline) : '—'}</td>
                <td className="text-slate-200">{pwr ? `${pwr.totalW} W (${pwr.totalWPerKg})` : '—'}</td>
                <td className="text-amber-400 font-semibold">{vol}m</td>
                <td className="px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => onOpenPassport(a, e)}
                      className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 px-2 py-1 rounded text-[11px] font-semibold"
                    >
                      <IdCard className="w-3 h-3" /> Passport
                    </button>
                    {!a.email ? (
                      <button
                        type="button"
                        onClick={(e) => onCopyInvite(a, e)}
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2.5 py-1 rounded text-[11px] font-semibold"
                      >
                        <Link2 className="w-3 h-3" /> {copiedId === a.id ? 'Copied!' : 'Invite'}
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 font-semibold">
                        Linked ✓
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => toggleArchive(a, e)}
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px]"
                    >
                      {showHidden ? <><Eye className="w-3 h-3" /> Unhide</> : <><EyeOff className="w-3 h-3" /> Hide</>}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
