'use client';

import { useState, useMemo } from 'react';
import { calculateApePoints, resolveApeAgeBand, ApeAgeBand } from '@/lib/apeScoring';
import { formatMark, isFieldDiscipline } from '@/lib/disciplines';
import { Award, Medal, Filter } from 'lucide-react';

export default function CoachApeScoreTab({
  athletes,
  races,
  discipline = 'sprints',
  dateFrom = '',
  dateTo = '',
}: {
  athletes: any[];
  races: any[];
  discipline?: string | null;
  dateFrom?: string;
  dateTo?: string;
}) {
  const [ageFilter, setAgeFilter] = useState<'ALL' | ApeAgeBand | 'Senior'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Boy' | 'Girl'>('ALL');

  const leaderboard = useMemo(() => {
    const field = isFieldDiscipline(discipline);

    return athletes
      .filter((a) => {
        if (genderFilter !== 'ALL' && (a.gender || 'Boy') !== genderFilter) return false;
        return true;
      })
      .map((athlete) => {
        const isSenior =
          (athlete.grade || '').trim().toLowerCase() === 'senior' ||
          (typeof athlete.age === 'number' && athlete.age >= 20);

        const ageBand: ApeAgeBand | 'Senior' = isSenior
          ? 'Senior'
          : resolveApeAgeBand(athlete.age, athlete.grade);

        const athRaces = races.filter((r) => r.athlete_id === athlete.id);
        const bestByEvent = new Map<
          string,
          { event: string; mark: number; date: string; meet: string; points: number; standardBadge: string; isField: boolean }
        >();

        athRaces.forEach((r) => {
          const mark = Number(r.time_seconds);
          const scored = calculateApePoints(athlete.gender, athlete.age, athlete.grade, r.event, mark);
          if (!scored) return;

          const cur = bestByEvent.get(r.event);
          const better = !cur || (field ? mark > cur.mark : mark < cur.mark);
          if (better) {
            bestByEvent.set(r.event, {
              event: r.event,
              mark,
              date: r.race_date,
              meet: r.meet_name || '',
              points: scored.points,
              standardBadge: scored.standardBadge,
              isField: scored.isField,
            });
          }
        });

        const topTwo = Array.from(bestByEvent.values())
          .sort((a, b) => b.points - a.points)
          .slice(0, 2);

        const totalPoints = topTwo.reduce((sum, ev) => sum + ev.points, 0);

        return {
          athlete,
          isSenior,
          ageBand,
          topTwo,
          totalPoints,
        };
      })
      .filter((row) => {
        if (row.topTwo.length === 0) return false;
        if (ageFilter !== 'ALL' && row.ageBand !== ageFilter) return false;
        return true;
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [athletes, races, discipline, ageFilter, genderFilter]);

  const getBadgeStyle = (pts: number, isSenior: boolean) => {
    if (isSenior) {
      if (pts >= 1150) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      if (pts >= 1000) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      if (pts >= 850) return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      return 'bg-slate-800 text-slate-200 border-slate-700';
    }
    if (pts >= 900) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (pts >= 800) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (pts >= 650) return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    return 'bg-slate-800 text-slate-200 border-slate-700';
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> ASA / SASA APE (School) &amp; World Athletics (Senior) Leaderboard ({leaderboard.length} Ranked)
          </h3>
          <p className="text-slate-400 mt-0.5">
            Active Period: <strong className="text-slate-200">{dateFrom || dateTo ? `${dateFrom || 'Start'} to ${dateTo || 'Latest'}` : 'All Dates'}</strong> • School athletes use 2024–2027 ASA APE; Senior (20+) uses World Athletics Senior Tables
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex bg-slate-800 p-0.5 rounded-lg">
            {(['ALL', 'U15', 'U16', 'U17', 'U18', 'U20', 'Senior'] as const).map((band) => (
              <button
                key={band}
                type="button"
                onClick={() => setAgeFilter(band)}
                className={`px-2 py-1 rounded-md font-semibold ${
                  ageFilter === band ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                {band === 'ALL' ? 'All' : band}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-800 p-0.5 rounded-lg">
            {(['ALL', 'Boy', 'Girl'] as const).map((gen) => (
              <button
                key={gen}
                type="button"
                onClick={() => setGenderFilter(gen)}
                className={`px-2 py-1 rounded-md font-semibold ${
                  genderFilter === gen ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                {gen === 'ALL' ? 'All' : `${gen}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
            <tr>
              <th className="py-3 px-4">Rank</th>
              <th>Athlete</th>
              <th>Category</th>
              <th>#1 Best Event &amp; Points</th>
              <th>#2 Best Event &amp; Points</th>
              <th className="text-right px-4">Combined 2-Event Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {leaderboard.map((row, idx) => {
              const ev1 = row.topTwo.at(0);
              const ev2 = row.topTwo.at(1);
              return (
                <tr key={row.athlete.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold">
                    {idx < 3 ? (
                      <span className="inline-flex items-center gap-1 text-amber-300">
                        <Medal className="w-4 h-4" /> #{idx + 1}
                      </span>
                    ) : (
                      <span className="text-slate-400">#{idx + 1}</span>
                    )}
                  </td>
                  <td>
                    <strong className="text-white block">{row.athlete.full_name}</strong>
                    <span className="text-[11px] text-slate-400">
                      {row.athlete.grade || '—'} • {row.athlete.age ? `${row.athlete.age} yrs • ` : ''}{row.athlete.gender || 'Boy'}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded font-bold border ${row.isSenior ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-200'}`}>
                      {row.ageBand}
                    </span>
                  </td>
                  <td>
                    {ev1 ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{ev1.event}:</span>
                        <span className="font-mono font-bold text-emerald-400">{formatMark(ev1.mark, discipline)}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${getBadgeStyle(ev1.points, row.isSenior)}`}>
                          {ev1.points} pts
                        </span>
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    {ev2 ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{ev2.event}:</span>
                        <span className="font-mono font-bold text-emerald-400">{formatMark(ev2.mark, discipline)}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${getBadgeStyle(ev2.points, row.isSenior)}`}>
                          {ev2.points} pts
                        </span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 text-right font-mono font-extrabold text-sm text-amber-300">
                    {row.totalPoints} pts
                  </td>
                </tr>
              );
            })}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  No ranked results in this filter range yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
