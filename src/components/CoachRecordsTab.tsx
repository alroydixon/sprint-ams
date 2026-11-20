'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  getEventsForDiscipline,
  isFieldDiscipline,
  isBetterMark,
  formatMark,
} from '@/lib/disciplines';
import RecordsLeaderboardTable from './RecordsLeaderboardTable';
import { Trophy } from 'lucide-react';

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
  discipline = 'sprints',
}: {
  athletes: any[];
  races: any[];
  discipline?: string | null;
}) {
  const allEvents = getEventsForDiscipline(discipline);
  const isField = isFieldDiscipline(discipline);

  const [selectedEvent, setSelectedEvent] = useState<string>(allEvents.at(0) || '100m');
  const [ageGroup, setAgeGroup] = useState<string>('All Ages');
  const [genderFilter, setGenderFilter] = useState<string>('All');

  useEffect(() => {
    const list = getEventsForDiscipline(discipline);
    if (list.length > 0 && !list.includes(selectedEvent)) {
      setSelectedEvent(list.at(0)!);
    }
  }, [discipline]);

  const athleteMap = useMemo(() => {
    const m = new Map<string, any>();
    athletes.forEach((a) => m.set(a.id, a));
    return m;
  }, [athletes]);

  const eligibleIds = useMemo(() => {
    return new Set(
      athletes
        .filter((a) => matchesGender(a.gender, genderFilter) && matchesAgeGroup(a.age, ageGroup))
        .map((a) => a.id)
    );
  }, [athletes, ageGroup, genderFilter]);

  const squadRecords = useMemo(() => {
    const records: { event: string; race: any; athlete: any }[] = [];

    allEvents.forEach((ev) => {
      const evRaces = races.filter((r) => r.event === ev && eligibleIds.has(r.athlete_id));
      if (evRaces.length === 0) return;

      const best = evRaces.reduce((curBest, cur) =>
        isBetterMark(Number(cur.time_seconds), Number(curBest.time_seconds), discipline) ? cur : curBest
      );
      const ath = athleteMap.get(best.athlete_id);
      if (ath) records.push({ event: ev, race: best, athlete: ath });
    });

    return records;
  }, [races, eligibleIds, athleteMap, allEvents, discipline]);

  const eventLeaderboard = useMemo(() => {
    const bestPerAthlete = new Map<string, any>();

    races.forEach((r) => {
      if (r.event !== selectedEvent || !eligibleIds.has(r.athlete_id)) return;
      const existing = bestPerAthlete.get(r.athlete_id);
      if (!existing || isBetterMark(Number(r.time_seconds), Number(existing.time_seconds), discipline)) {
        bestPerAthlete.set(r.athlete_id, r);
      }
    });

    return Array.from(bestPerAthlete.values())
      .map((race) => ({ race, athlete: athleteMap.get(race.athlete_id) }))
      .filter((item) => item.athlete)
      .sort((a, b) =>
        isField
          ? Number(b.race.time_seconds) - Number(a.race.time_seconds)
          : Number(a.race.time_seconds) - Number(b.race.time_seconds)
      );
  }, [races, selectedEvent, eligibleIds, athleteMap, discipline, isField]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Age Category:</span>
          {AGE_GROUPS.map((g) => (
            <button key={g} type="button" onClick={() => setAgeGroup(g)} className={`px-2.5 py-1.5 rounded-lg font-semibold ${ageGroup === g ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Division:</span>
          {['All', 'Boy', 'Girl'].map((gen) => (
            <button key={gen} type="button" onClick={() => setGenderFilter(gen)} className={`px-2.5 py-1.5 rounded-lg font-semibold ${genderFilter === gen ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
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
          <span className="text-[11px] text-slate-400">Click any card for full rankings</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {squadRecords.map(({ event, race, athlete }) => (
            <div key={event} onClick={() => setSelectedEvent(event)} className={`cursor-pointer rounded-xl p-3 border transition ${selectedEvent === event ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-400">{event} Record</span>
                <span className="text-base font-mono font-bold text-amber-300">
                  {formatMark(Number(race.time_seconds), discipline)}
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-1 truncate">
                {athlete.full_name}{' '}
                {athlete.is_archived && <span className="text-[10px] text-amber-400 font-normal">(Alumni)</span>}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {athlete.grade || ''} {athlete.age ? `(${athlete.age}y)` : ''} • {race.race_date}
              </p>
            </div>
          ))}
          {squadRecords.length === 0 && (
            <p className="text-xs text-slate-500 col-span-full text-center py-4">
              No records found for this age group / division filter.
            </p>
          )}
        </div>
      </div>

      <RecordsLeaderboardTable
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        allEvents={allEvents}
        eventLeaderboard={eventLeaderboard}
        discipline={discipline}
      />
    </div>
  );
}
