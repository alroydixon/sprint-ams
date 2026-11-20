'use client';

import { useState, useMemo } from 'react';
import { calculateApePoints, ApeAgeBand } from '@/lib/apeScoring';
import { Award } from 'lucide-react';

interface EventScoreEntry {
  event: string;
  time: number;
  points: number;
  standardBadge: string;
  raceDate: string;
}

interface AthleteApeRow {
  athlete: any;
  ageBand: ApeAgeBand;
  top1: EventScoreEntry;
  top2: EventScoreEntry | null;
  combinedPoints: number;
}

function getStandardPillStyle(badge: string) {
  if (badge === 'International') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (badge === 'National') return 'bg-amber-400/20 text-amber-300 border-amber-400/40';
  if (badge === 'Provincial') return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  return 'bg-slate-800 text-slate-300 border-slate-700';
}

export default function CoachApeScoreTab({
  athletes,
  races,
  dateFrom,
  dateTo,
}: {
  athletes: any[];
  races: any[];
  dateFrom: string;
  dateTo: string;
}) {
  const [divisionFilter, setDivisionFilter] = useState<'All' | 'Boy' | 'Girl'>('All');
  const [ageFilter, setAgeFilter] = useState<'All' | ApeAgeBand>('All');

  const leaderboard = useMemo(() => {
    const rows: AthleteApeRow[] = [];

    athletes.forEach((ath) => {
      if (divisionFilter !== 'All' && (ath.gender || '').toLowerCase() !== divisionFilter.toLowerCase()) {
        return;
      }

      // Only include races inside the selected date period
      const periodRaces = races.filter((r) => r.athlete_id === ath.id);
      if (periodRaces.length === 0) return;

      // Best time per event in the selected period
      const bestByEvent = new Map<string, any>();
      periodRaces.forEach((r) => {
        const existing = bestByEvent.get(r.event);
        if (!existing || Number(r.time_seconds) < Number(existing.time_seconds)) {
          bestByEvent.set(r.event, r);
        }
      });

      const scoredEvents: EventScoreEntry[] = [];
      let resolvedBand: ApeAgeBand = 'U20';

      bestByEvent.forEach((r, ev) => {
        const res = calculateApePoints(ath.gender, ath.age, ath.grade, ev, Number(r.time_seconds));
        if (res) {
          resolvedBand = res.ageBand;
          scoredEvents.push({
            event: ev,
            time: Number(r.time_seconds),
            points: res.points,
            standardBadge: res.standardBadge,
            raceDate: r.race_date,
          });
        }
      });

      if (scoredEvents.length === 0) return;
      if (ageFilter !== 'All' && resolvedBand !== ageFilter) return;

      // Sort athlete's events by highest APE points first and take Top 2
      scoredEvents.sort((a, b) => b.points - a.points);
      const top1 = scoredEvents.at(0)!;
      const top2 = scoredEvents.at(1) || null;
      const combinedPoints = top1.points + (top2 ? top2.points : 0);

      rows.push({
        athlete: ath,
        ageBand: resolvedBand,
        top1,
        top2,
        combinedPoints,
      });
    });

    return rows.sort((a, b) => b.combinedPoints - a.combinedPoints);
  }, [athletes, races, divisionFilter, ageFilter]);

  const periodLabel =
    dateFrom && dateTo
      ? `${dateFrom} to ${dateTo}`
      : dateFrom
      ? `From ${dateFrom}`
      : dateTo
      ? `Up to ${dateTo}`
      : 'All Dates';

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> ASA / SASA 2024–2027 APE Top-2 Events Leaderboard ({leaderboard.length} Ranked)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Active Period: <strong className="text-white">{periodLabel}</strong> • Ranks only athletes with recorded times in this period based on their Top 2 highest-scoring events
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {(['All', 'U15', 'U16', 'U17', 'U18', 'U20'] as const).map((band) => (
              <button
                key={band}
                type="button"
                onClick={() => setAgeFilter(band)}
                className={`px-2 py-1 rounded font-semibold ${
                  ageFilter === band ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {band}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {(['All', 'Boy', 'Girl'] as const).map((gen) => (
              <button
                key={gen}
                type="button"
                onClick={() => setDivisionFilter(gen)}
                className={`px-2.5 py-1 rounded font-semibold ${
                  divisionFilter === gen ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {gen === 'All' ? 'All' : gen === 'Boy' ? 'Boys' : 'Girls'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* APE Standard Legend */}
      <div className="flex flex-wrap gap-2 text-[11px] px-1">
        <span className="px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold">Green: International (900+ pts)</span>
        <span className="px-2.5 py-0.5 rounded-full border bg-amber-400/20 text-amber-300 border-amber-400/40 font-semibold">Yellow: National (800–899 pts)</span>
        <span className="px-2.5 py-0.5 rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold">Blue: Provincial (650–799 pts)</span>
        <span className="px-2.5 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700 font-semibold">White: Development (&lt;650 pts)</span>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2">Rank</th>
              <th>Athlete</th>
              <th>APE Group</th>
              <th>#1 Best Event &amp; Points</th>
              <th>#2 Best Event &amp; Points</th>
              <th className="text-right">Combined 2-Event APE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {leaderboard.map((row, idx) => (
              <tr key={row.athlete.id} className={idx === 0 ? 'bg-amber-950/20' : ''}>
                <td className="py-3 font-bold">
                  {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                </td>
                <td className="font-semibold text-white">
                  {row.athlete.full_name}
                  <span className="block text-[10px] text-slate-400 font-normal">
                    {row.athlete.grade || ''} {row.athlete.age ? `• ${row.athlete.age} yrs` : ''} • {row.athlete.gender || 'Boy'}
                  </span>
                </td>
                <td>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold text-[11px]">
                    {row.ageBand}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{row.top1.event}:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{row.top1.time.toFixed(2)}s</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStandardPillStyle(row.top1.standardBadge)}`}>
                      {row.top1.points} pts
                    </span>
                  </div>
                </td>
                <td>
                  {row.top2 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{row.top2.event}:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{row.top2.time.toFixed(2)}s</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStandardPillStyle(row.top2.standardBadge)}`}>
                        {row.top2.points} pts
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500">Only 1 event in period</span>
                  )}
                </td>
                <td className="text-right font-mono text-base font-bold text-amber-300">
                  {row.combinedPoints} pts
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No athletes have recorded race times in the selected date period ({periodLabel}).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
