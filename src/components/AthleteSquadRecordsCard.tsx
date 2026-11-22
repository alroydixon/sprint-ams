'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getEventsForDiscipline, formatMark, isBetterMark } from '@/lib/disciplines';
import { Trophy } from 'lucide-react';

function resolveRowAgeGroup(age?: number | null, grade?: string | null): string {
  if (age && age > 0) {
    if (age <= 14) return 'U14';
    if (age === 15) return 'U15';
    if (age === 16) return 'U16';
    if (age === 17) return 'U17';
    if (age <= 19) return 'U19';
    return 'Senior';
  }
  const g = (grade || '').toLowerCase();
  if (g.includes('8')) return 'U14';
  if (g.includes('9')) return 'U15';
  if (g.includes('10')) return 'U16';
  if (g.includes('11')) return 'U17';
  if (g.includes('12')) return 'U19';
  if (g.includes('senior')) return 'Senior';
  return 'U19';
}

export default function AthleteSquadRecordsCard({
  coachId,
  discipline = 'sprints',
}: {
  coachId?: string | null;
  discipline?: string | null;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ageFilter, setAgeFilter] = useState('ALL');
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

  const recordsByEvent = useMemo(() => {
    const map = new Map<string, any>();

    rows.forEach((r) => {
      const gen: 'Boy' | 'Girl' =
        (r.gender || '').toLowerCase().startsWith('g') || (r.gender || '').toLowerCase().startsWith('f')
          ? 'Girl'
          : 'Boy';
      if (genderFilter !== 'ALL' && gen !== genderFilter) return;

      const ag = resolveRowAgeGroup(r.age, r.grade);
      if (ageFilter !== 'ALL' && ag !== ageFilter) return;

      const cur = map.get(r.event);
      if (!cur || isBetterMark(Number(r.time_seconds), Number(cur.time_seconds), discipline)) {
        map.set(r.event, r);
      }
    });

    return map;
  }, [rows, ageFilter, genderFilter, discipline]);

  if (!coachId) return null;

  const ageLabel = ageFilter === 'ALL' ? 'All Ages' : ageFilter;
  const divLabel =
    genderFilter === 'ALL' ? 'All Divisions' : genderFilter === 'Boy' ? 'Boys' : 'Girls';

  return (
    <div className="space-y-4 text-xs">
      {/* Filter Bar matching Coach Records Tab */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-semibold">Age Category:</span>
          <div className="flex flex-wrap bg-slate-800 p-0.5 rounded-lg gap-0.5">
            {(['ALL', 'U14', 'U15', 'U16', 'U17', 'U19'] as const).map((ag) => (
              <button
                key={ag}
                type="button"
                onClick={() => setAgeFilter(ag)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  ageFilter === ag
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {ag === 'ALL' ? 'All Ages' : ag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Division:</span>
          <div className="flex bg-slate-800 p-0.5 rounded-lg">
            {(['ALL', 'Boy', 'Girl'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenderFilter(g)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  genderFilter === g
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {g === 'ALL' ? 'All' : g === 'Boy' ? 'Boys' : 'Girls'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Squad Records Board Card Grid matching Coach Records Tab */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
          <Trophy className="w-4 h-4" /> Squad Records Board ({ageLabel} • {divLabel})
        </h3>

        {loading ? (
          <p className="text-slate-500 py-4 text-center">Loading squad records...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {events.map((ev) => {
              const rec = recordsByEvent.get(ev);
              if (!rec) return null;
              return (
                <div
                  key={ev}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-emerald-400 font-bold">{ev} Record</span>
                    <span className="font-mono font-extrabold text-sm text-white">
                      {formatMark(Number(rec.time_seconds), discipline)}
                    </span>
                  </div>
                  <p className="font-bold text-white text-xs">
                    {rec.athlete_name}{' '}
                    {rec.is_archived && (
                      <span className="text-amber-400 font-semibold text-[11px]">(Alumni)</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {rec.grade || ''}
                    {rec.age ? ` (${rec.age}y)` : ''} • {rec.race_date}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
