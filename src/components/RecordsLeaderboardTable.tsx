'use client';

import { formatMark } from '@/lib/disciplines';
import { Medal } from 'lucide-react';

export default function RecordsLeaderboardTable({
  selectedEvent,
  setSelectedEvent,
  allEvents,
  eventLeaderboard,
  discipline = 'sprints',
}: {
  selectedEvent: string;
  setSelectedEvent: (ev: string) => void;
  allEvents: string[];
  eventLeaderboard: { race: any; athlete: any }[];
  discipline?: string | null;
}) {
  return (
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
          {allEvents.map((ev) => (
            <option key={ev} value={ev}>{ev}</option>
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
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-normal">Alumni</span>
                )}
              </td>
              <td className="text-slate-400">{athlete.grade || '—'} {athlete.age ? `• ${athlete.age}y` : ''}</td>
              <td className="font-mono font-bold text-emerald-400 text-sm">
                {formatMark(Number(race.time_seconds), discipline)}
              </td>
              <td className="text-slate-300">
                {race.wind_ms !== null && race.wind_ms !== undefined ? `${race.wind_ms > 0 ? `+${race.wind_ms}` : race.wind_ms} m/s` : '—'}
              </td>
              <td className="text-slate-300">{race.meet_name || '—'}</td>
              <td className="text-slate-400">{race.race_date}</td>
            </tr>
          ))}
          {eventLeaderboard.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-slate-500">
                No recorded marks for {selectedEvent} in this age group / division.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
