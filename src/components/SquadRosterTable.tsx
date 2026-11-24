'use client';

import { calculatePower, getReadinessStatus } from '@/lib/biomechanics';
import { getEventsForDiscipline, formatMark, isBetterMark } from '@/lib/disciplines';
import { FileText, Link2, Check, EyeOff, RotateCcw } from 'lucide-react';

export default function SquadRosterTable({
  athletes,
  discipline = 'sprints',
  showHidden = false,
  races,
  sessions,
  tests,
  wellness,
  copiedId,
  onSelectAthlete,
  onOpenPassport,
  onCopyInvite,
  onToggleArchive,
}: {
  athletes: any[];
  discipline?: string | null;
  showHidden?: boolean;
  races: any[];
  sessions: any[];
  tests: any[];
  wellness: any[];
  copiedId: string | null;
  onSelectAthlete: (athlete: any) => void;
  onOpenPassport: (athlete: any, e?: any) => void;
  onCopyInvite: (athlete: any, e?: any) => void;
  onToggleArchive: (athlete: any, e?: any) => void;
}) {
  const allEvents = getEventsForDiscipline(discipline);
  const primaryEvents =
    allEvents.includes('100m') && allEvents.includes('200m')
      ? ['100m', '200m']
      : allEvents.slice(0, 2);
  const currentYear = String(new Date().getFullYear());

  function getBestAndSb(athRaces: any[], eventName: string) {
    const evRaces = athRaces.filter(
      (r) => r.event === eventName && Number(r.time_seconds) > 0
    );
    const firstRace = evRaces.at(0);
    if (!firstRace) return { pb: null, sb: null };

    let pb = Number(firstRace.time_seconds);
    let sb: number | null = null;

    evRaces.forEach((r) => {
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
            <th>Grade</th>
            {primaryEvents.map((ev) => (
              <th key={ev}>{ev} PB / {currentYear} SB</th>
            ))}
            <th>Power (W/kg)</th>
            <th>Volume</th>
            <th className="text-right px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {athletes.map((a) => {
            const athRaces = races.filter((r) => r.athlete_id === a.id);
            const athSessions = sessions.filter((s) => s.athlete_id === a.id);
            const athTests = tests.filter((t) => t.athlete_id === a.id);
            const athWellness = wellness
              .filter((w) => w.athlete_id === a.id)
              .sort((x, y) => (y.log_date || '').localeCompare(x.log_date || ''));

            const latestWellness = athWellness.at(0);
            const readiness = latestWellness
              ? getReadinessStatus(latestWellness.composite_score)
              : null;

            const latestTest = athTests.at(-1);
            const pwr = latestTest
              ? calculatePower(
                  Number(latestTest.body_weight_kg),
                  latestTest.pushups_1min_reps || 0,
                  latestTest.situps_1min_reps || 0,
                  latestTest.squat_jumps_1min_reps || 0
                )
              : null;

            const totalVol = athSessions.reduce(
              (sum, s) =>
                sum +
                (Array.isArray(s.training_runs)
                  ? s.training_runs.reduce(
                      (rSum: number, r: any) => rSum + (Number(r.distance_m) || 0),
                      0
                    )
                  : 0),
              0
            );

            const initials = (a.full_name || 'A')
              .split(' ')
              .map((p: string) => p.charAt(0))
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <tr
                key={a.id}
                onClick={() => onSelectAthlete(a)}
                className="hover:bg-slate-800/40 cursor-pointer transition"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {initials}
                    </span>
                    <strong className="text-white text-sm">{a.full_name}</strong>
                    {readiness ? (
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${readiness.color}`}
                      >
                        • {readiness.label}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">
                        • No Check-In
                      </span>
                    )}
                  </div>
                </td>

                <td className="text-slate-300">{a.grade || '—'}</td>

                {primaryEvents.map((ev) => {
                  const { pb, sb } = getBestAndSb(athRaces, ev);
                  return (
                    <td key={ev} className="py-3 font-mono">
                      {pb !== null ? (
                        <div className="leading-tight">
                          <span className="font-bold text-emerald-400 block">
                            {formatMark(pb, discipline)}
                          </span>
                          {sb !== null ? (
                            <span className="text-[10px] text-amber-300 font-semibold block">
                              {sb === pb ? 'SB = PB' : `SB: ${formatMark(sb, discipline)}`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 block">SB: —</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  );
                })}

                <td className="font-mono text-slate-200">
                  {pwr ? `${pwr.totalW} W (${pwr.totalWPerKg})` : '—'}
                </td>

                <td className="font-mono font-bold text-amber-300">
                  {totalVol}m
                </td>

                <td
                  onClick={(e) => e.stopPropagation()}
                  className="py-3 px-4 text-right"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => onOpenPassport(a, e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-950 font-semibold"
                    >
                      <FileText className="w-3 h-3" /> Passport
                    </button>

                    {a.user_id ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold">
                        Linked ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => onCopyInvite(a, e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold"
                      >
                        {copiedId === a.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Link2 className="w-3 h-3" /> Invite
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => onToggleArchive(a, e)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                      {showHidden ? (
                        <>
                          <RotateCcw className="w-3 h-3" /> Restore
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Hide
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {athletes.length === 0 && (
            <tr>
              <td colSpan={6 + primaryEvents.length} className="py-8 text-center text-slate-500">
                No athletes match your search filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
