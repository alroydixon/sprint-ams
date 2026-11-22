'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getEventsForDiscipline, formatMark, isBetterMark } from '@/lib/disciplines';
import { Trophy, Filter } from 'lucide-react';

export default function AthleteSquadRecordsCard({
  coachId,
  discipline = 'sprints',
}: {
  coachId?: string | null;
  discipline?: string | null;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Boy' | 'Girl'>('ALL');

  useEffect(() => {
    if (!coachId) {
      setLoading(false);
      return;
    }
    supabase.rpc('get_squad_records_board', { p_coach_id: coachId }).then(({ data }) => {
      setRows(data || []);
      setLoading(false);
    });
  }, [coachId]);

  const events = getEventsForDiscipline(discipline);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const gen: 'Boy' | 'Girl' =
        (r.gender || '').toLowerCase().startsWith('g') || (r.gender || '').toLowerCase().startsWith('f')
          ? 'Girl'
          : 'Boy';
      if (genderFilter !== 'ALL' && gen !== genderFilter) return false;
      if (gradeFilter !== 'ALL' && (r.grade || '') !== gradeFilter) return false;
      return true;
    });
  }, [rows, gradeFilter, genderFilter]);

  const recordsByDivision = useMemo(() => {
    const out: Record<'Boy' | 'Girl', Record<string, any>> = { Boy: {}, Girl: {} };
    filteredRows.forEach((r) => {
      const gen: 'Boy' | 'Girl' =
        (r.gender || '').toLowerCase().startsWith('g') || (r.gender || '').toLowerCase().startsWith('f')
          ? 'Girl'
          : 'Boy';
      const cur = out[gen][r.event];
      if (!cur || isBetterMark(Number(r.time_seconds), Number(cur.time_seconds), discipline)) {
        out[gen][r.event] = r;
      }
    });
    return out;
  }, [filteredRows, discipline]);

  if (!coachId) return null;

  const visibleDivisions: ('Boy' | 'Girl')[] =
    genderFilter === 'ALL' ? ['Boy', 'Girl'] : [genderFilter];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> All-Time Squad Records Board
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Filter by Grade / Category &amp; Division to view official squad benchmarks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
          >
            <option value="ALL">All Grades / Ages</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
            <option value="Senior">Senior</option>
          </select>

          <div className="flex bg-slate-800 p-0.5 rounded-lg">
            {(['ALL', 'Boy', 'Girl'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenderFilter(g)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  genderFilter === g ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                {g === 'ALL' ? 'All' : g === 'Boy' ? 'Boys / Men' : 'Girls / Women'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 py-4 text-center">Loading squad records...</p>
      ) : (
        <div className={`grid grid-cols-1 ${visibleDivisions.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
          {visibleDivisions.map((gen) => (
            <div key={gen} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">
                  {gen === 'Boy' ? 'Boys / Men Division' : 'Girls / Women Division'}
                </h4>
                <span className="text-[10px] text-slate-400">
                  {gradeFilter === 'ALL' ? 'Overall Squad Record' : gradeFilter}
                </span>
              </div>

              <table className="w-full text-left">
                <thead className="text-[11px] text-slate-400 border-b border-slate-800/80">
                  <tr>
                    <th className="py-2 px-3.5">Event</th>
                    <th>Record</th>
                    <th>Holder &amp; Meet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {events.map((ev) => {
                    const rec = recordsByDivision[gen][ev];
                    return (
                      <tr key={ev} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3.5 font-bold text-white">{ev}</td>
                        <td className="font-mono font-extrabold text-amber-300">
                          {rec ? formatMark(Number(rec.time_seconds), discipline) : '—'}
                        </td>
                        <td className="py-2 pr-3.5">
                          {rec ? (
                            <div>
                              <span className="font-semibold text-slate-200 block">{rec.athlete_name}</span>
                              <span className="text-[10px] text-slate-400">
                                {rec.grade ? `${rec.grade} • ` : ''}
                                {rec.race_date}
                                {rec.meet_name ? ` • ${rec.meet_name}` : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">Vacant</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
