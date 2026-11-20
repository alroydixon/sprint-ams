'use client';

import { useState, useMemo } from 'react';
import { FLAT_EVENTS, HURDLE_EVENTS } from '@/lib/biomechanics';
import { Trophy, Medal } from 'lucide-react';

const ALL_EVENTS = [...FLAT_EVENTS, ...HURDLE_EVENTS];
const AGE_GROUPS = ['All Ages', 'U14', 'U15', 'U16', 'U17', 'U19'];

function matchesAgeGroup(age: number | null | undefined, group: string): boolean {
  if (group === 'All Ages') return true;
  if (!age) return false;
  if (group === 'U14') return age <= 14;
  if (group === 'U15') return age === 15;
  if (group === 'U16') return age === 16;
  if (group === 'U17') return age === 17;
  if (group === 'U19') return age >= 18 && age <= 19;
  return true;
}

function matchesGender(rawGender: string | null | undefined, filter: string): boolean {
  if (filter === 'All') return true;
  const g = (rawGender || '').trim().toLowerCase();
  if (!g) return false;
  if (filter === 'Boy') return g.startsWith('b') || g.startsWith('m');
  if (filter === 'Girl') return g.startsWith('g') || g.startsWith('f');
  return true;
}

export default function CoachRecordsTab({
  athletes,
  races,
}: {
  athletes: any[];
  races: any[];
}) {
  const [selectedEvent, setSelectedEvent] = useState<string>('100m');
  const [ageGroup, setAgeGroup] = useState<string>('All Ages');
  const [genderFilter, setGenderFilter] = useState<string>('All');

  const athleteMap = useMemo(() => {
    const m = new Map<string, any>();
    athletes.forEach((a) => m.set(a.id, a));
    return m;
  }, [athletes]);

  const eligibleAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (!matchesGender(a.gender, genderFilter)) return false;
      return matchesAgeGroup(a.age, ageGroup);
    });
  }, [athletes, ageGroup, genderFilter]);

  const eligibleIds = useMemo(() => new Set(eligibleAthletes.map((a) => a.id)), [eligibleAthletes]);

  const squadRecords = useMemo(() => {
    const records: { event: string; race: any; athlete: any }[] = [];

    ALL_EVENTS.forEach((ev) => {
      const evRaces = races.filter((r) => r.event === ev && eligibleIds.has(r.athlete_id));
      if (evRaces.length === 0) return;

      const best = evRaces.reduce((min, cur) =>
        Number(cur.time_seconds) < Number(min.time_seconds) ? cur : min
      );
      const ath = athleteMap.get(best.athlete_id);
      if (ath) records.push({ event: ev, race: best, athlete: ath });
    });

    return records;
  }, [races, eligibleIds, athleteMap]);

  const eventLeaderboard = useMemo(() => {
    const bestPerAthlete = new Map<string, any>();

    races.forEach((r) => {
      if (r.event !== selectedEvent || !eligibleIds.has(r.athlete_id)) return;
      const existing = bestPerAthlete.get(r.athlete_id);
      if (!existing || Number(r.time_seconds) < Number(existing.time_seconds)) {
        bestPerAthlete.set(r.athlete_id, r);
      }
    });

    return Array.from(bestPerAthlete.values())
      .map((race) => ({ race, athlete: athleteMap.get(race.athlete_id) }))
      .filter((item) => item.athlete)
      .sort((a, b) => Number(a.race.time_seconds) - Number(b.race.time_seconds));
  }, [races, selectedEvent, eligibleIds, athleteMap]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Age Category:</span>
          {AGE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setAgeGroup(g)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold ${
                ageGroup === g ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Division:</span>
          {['All', 'Boy', 'Girl'].map((gen) => (
            <button
              key={gen}
              type="button"
              onClick={() => setGenderFilter(gen)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold ${
                genderFilter === gen ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {gen === 'All' ? 'All' : gen === 'Boy' ? 'Boys' : 'Girls'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> Squad Records Board ({ageGroup} • {genderFilter === 'All' ? 'All Divisions' : genderFilter === 'Boy' ? 'Boys' : 'Girls'})
          </h3>
          <span className="text-[11px] text-slate-400">Includes all-time alumni records • Click any card for full rankings</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {squadRecords.map(({ event, race, athlete }) => (
            <div
              key={event}
              onClick={() => setSelectedEvent(event)}
              className={`cursor-pointer rounded-xl p-3 border transition ${
                selectedEvent === event
                  ? 'bg-emerald-950/40 border-emerald-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-400">{event} Record</span>
                <span className="text-base font-mono font-bold text-amber-300">
                  {Number(race.time_seconds).toFixed(2)}s
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-1 truncate">
                {athlete.full_name}{' '}
                {athlete.is_archived && <span className="text-[10px] text-amber-400 font-normal">(Alumni)</span>}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {athlete.grade || ''} {athlete.age ? `(${athlete.age}y)` : ''} • {race.race_date}
                {race.wind_ms !== null && race.wind_ms !== undefined ? ` • ${race.wind_ms > 0 ? `+${race.wind_ms}` : race.wind_ms}m/s` : ''}
              </p>
            </div>
          ))}
          {squadRecords.length === 0 && (
            <p className="text-xs text-slate-500 col-span-full text-center py-4">
              No race records found for this age group / division filter.
            </p>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 overflow-x-auto">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Medal className="w-4 h-4" /> {selectedEvent} Personal Best Leaderboard ({eventLeaderboard.length} Athletes)
          </h4>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold"
          >
            {ALL_EVENTS.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2">Rank</th>
              <th>Athlete</th>
              <th>Grade / Age</th>
              <th>Personal Best</th>
              <th>Wind</th>
              <th>Meet</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {eventLeaderboard.map(({ race, athlete }, idx) => (
              <tr key={athlete.id} className={idx === 0 ? 'bg-amber-950/20' : ''}>
                <td className="py-2.5 font-bold">
                  {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                </td>
                <td className="font-semibold text-white">
                  {athlete.full_name}{' '}
                  {athlete.is_archived && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-normal">
                      Alumni
                    </span>
                  )}
                </td>
                <td className="text-slate-400">
                  {athlete.grade || '—'} {athlete.age ? `• ${athlete.age}y` : ''}
                </td>
                <td className="font-mono font-bold text-emerald-400 text-sm">
                  {Number(race.time_seconds).toFixed(2)}s
                </td>
                <td className="text-slate-300">
                  {race.wind_ms !== null && race.wind_ms !== undefined
                    ? `${race.wind_ms > 0 ? `+${race.wind_ms}` : race.wind_ms} m/s`
                    : '—'}
                </td>
                <td className="text-slate-300">{race.meet_name || '—'}</td>
                <td className="text-slate-400">{race.race_date}</td>
              </tr>
            ))}
            {eventLeaderboard.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  No recorded times for {selectedEvent} in this age group / division.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
