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
  const currentYear = String(new Date().getFullYear());

  function getBestAndSb(athleteId: string, eventName: string): { pb: number | null; sb: number | null } {
    const valid = races.filter(
      (r) => r.athlete_id === athleteId && r.event === eventName && Number(r.time_seconds) > 0
    );
    const first = valid.at(0);
    if (!first) return { pb: null, sb: null };

    let pb = Number(first.time_seconds);
    let sb: number | null = null;

    valid.forEach((r) => {
      const val = Number(r.time_seconds);
      if (isBetterMark(val, pb, discipline)) pb = val;
      if ((r.race_date || '').startsWith(currentYear)) {
        if (sb === null || isBetterMark(val, sb, discipline)) sb = val;
      }
    });

    return { pb, sb };
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
          <tr>
            <th className="py-3 px-4">Athlete &amp; Readiness</th>
            <th>Coach</th>
            <th>Grade / Age</th>
            <th>{ev1} PB / {currentYear} SB</th>
            <th>{ev2} PB / {currentYear} SB</th>
            <th className="text-right px-4">Profile</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {activeAthletes.map((a) => {
            const coach = coaches.find((c) => c.id === a.coach_id);
            const latestW = wellness.find((w) => w.athlete_id === a.id);
            const st = latestW ? getReadinessStatus(latestW.composite_score) : null;
            const m1 = getBestAndSb(a.id, ev1);
            const m2 = getBestAndSb(a.id, ev2);

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

                {[m1, m2].map((m, idx) => (
                  <td key={idx} className="py-3 font-mono">
                    {m.pb !== null ? (
                      <div className="leading-tight">
                        <span className="font-bold text-emerald-400 block">
                          {formatMark(m.pb, discipline)}
                        </span>
                        {m.sb !== null ? (
                          <span className="text-[10px] text-amber-300 font-semibold block">
                            {m.sb === m.pb ? 'SB = PB' : `SB: ${formatMark(m.sb, discipline)}`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 block">SB: —</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                ))}

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
