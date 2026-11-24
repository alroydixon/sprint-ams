'use client';

import { getReadinessStatus } from '@/lib/biomechanics';
import { getPrimaryHeadlineEvents, formatMark, isBetterMark } from '@/lib/disciplines';
import { Eye } from 'lucide-react';

export default function ManagerAthletesResultsTable({
  discipline,
  coaches,
  activeAthletes,
  races,
  wellness,
  onInspectAthlete,
}: {
  discipline: string;
  coaches: any[];
  activeAthletes: any[];
  races: any[];
  wellness: any[];
  onInspectAthlete: (athlete: any) => void;
}) {
  const [ev1, ev2] = getPrimaryHeadlineEvents(discipline);

  function getBestMark(athleteId: string, eventName: string): number | null {
    const valid = races.filter(
      (r) => r.athlete_id === athleteId && r.event === eventName && Number(r.time_seconds) > 0
    );
    const first = valid.at(0);
    if (!first) return null;
    let best = Number(first.time_seconds);
    valid.forEach((r) => {
      const val = Number(r.time_seconds);
      if (isBetterMark(val, best, discipline)) best = val;
    });
    return best;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
          <tr>
            <th className="py-3 px-4">Athlete &amp; Readiness</th>
            <th>Coach</th>
            <th>Grade / Age</th>
            <th>{ev1} Best</th>
            <th>{ev2} Best</th>
            <th className="text-right px-4">Profile</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {activeAthletes.map((a) => {
            const coach = coaches.find((c) => c.id === a.coach_id);
            const latestW = wellness.find((w) => w.athlete_id === a.id);
            const st = latestW ? getReadinessStatus(latestW.composite_score) : null;
            const b1 = getBestMark(a.id, ev1);
            const b2 = getBestMark(a.id, ev2);

            return (
              <tr
                key={a.id}
                onClick={() => onInspectAthlete(a)}
                className="hover:bg-slate-800/40 cursor-pointer transition"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-white">{a.full_name}</strong>
                    {st ? (
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${st.color}`}>
                        {st.label}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">
                        No Check-In
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-slate-300">{coach?.full_name || '—'}</td>
                <td className="text-slate-300">
                  {a.grade || '—'} {a.age ? `• ${a.age}y` : ''}
                </td>
                <td className="font-mono font-bold text-emerald-400">
                  {formatMark(b1, discipline)}
                </td>
                <td className="font-mono font-bold text-emerald-400">
                  {formatMark(b2, discipline)}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectAthlete(a);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 font-semibold"
                  >
                    <Eye className="w-3 h-3" /> View Results
                  </button>
                </td>
              </tr>
            );
          })}
          {activeAthletes.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-500">
                No active athletes in this discipline yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
