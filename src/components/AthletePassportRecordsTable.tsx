'use client';

import { useMemo } from 'react';
import { calculateApePoints } from '@/lib/apeScoring';
import { formatMark, isBetterMark } from '@/lib/disciplines';

export default function AthletePassportRecordsTable({
  athlete,
  discipline = 'sprints',
  ageBand,
  races,
}: {
  athlete: any;
  discipline?: string | null;
  ageBand: string;
  races: any[];
}) {
  const currentYear = String(new Date().getFullYear());

  const eventSummary = useMemo(() => {
    const map = new Map<string, { pb: any; sb: any }>();

    races.forEach((r) => {
      const cur = map.get(r.event) || { pb: null, sb: null };
      if (!cur.pb || isBetterMark(Number(r.time_seconds), Number(cur.pb.time_seconds), discipline)) {
        cur.pb = r;
      }
      if ((r.race_date || '').startsWith(currentYear)) {
        if (!cur.sb || isBetterMark(Number(r.time_seconds), Number(cur.sb.time_seconds), discipline)) {
          cur.sb = r;
        }
      }
      map.set(r.event, cur);
    });

    return Array.from(map.entries()).map(([event, { pb, sb }]) => {
      const ape = pb ? calculateApePoints(athlete.gender, athlete.age, athlete.grade, event, Number(pb.time_seconds)) : null;
      return { event, pb, sb, ape };
    });
  }, [races, athlete, discipline, currentYear]);

  return (
    <div className="bg-slate-950 print:bg-white border border-slate-800 print:border-slate-300 rounded-xl p-4 overflow-x-auto">
      <h3 className="font-bold text-sm text-emerald-400 print:text-emerald-800 mb-2">
        Official Personal Bests &amp; ASA / SASA APE Ratings ({ageBand})
      </h3>
      <table className="w-full text-left">
        <thead className="text-slate-400 print:text-slate-700 border-b border-slate-800 print:border-slate-300">
          <tr>
            <th className="py-2">Event</th>
            <th>All-Time PB</th>
            <th>{currentYear} SB</th>
            <th>APE Score</th>
            <th>Standard</th>
            <th>PB Date &amp; Meet</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 print:divide-slate-200">
          {eventSummary.map(({ event, pb, sb, ape }) => (
            <tr key={event}>
              <td className="py-2 font-bold text-white print:text-slate-950">{event}</td>
              <td className="font-mono font-bold text-emerald-400 print:text-emerald-800">
                {pb ? formatMark(Number(pb.time_seconds), discipline) : '—'}
              </td>
              <td className="font-mono text-slate-200 print:text-slate-800">
                {sb ? formatMark(Number(sb.time_seconds), discipline) : '—'}
              </td>
              <td className="font-mono font-bold text-amber-300 print:text-amber-700">
                {ape ? `${ape.points} pts` : '—'}
              </td>
              <td className="font-semibold text-slate-300 print:text-slate-700">
                {ape ? ape.standardBadge : '—'}
              </td>
              <td className="text-slate-400 print:text-slate-600">
                {pb ? `${pb.race_date}${pb.meet_name ? ` • ${pb.meet_name}` : ''}` : '—'}
              </td>
            </tr>
          ))}
          {eventSummary.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-slate-500">
                No official competition marks recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
