'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getEventsForDiscipline, formatMark, isBetterMark } from '@/lib/disciplines';
import { Trophy } from 'lucide-react';

export default function AthleteSquadRecordsCard({
  coachId,
  discipline = 'sprints',
}: {
  coachId?: string | null;
  discipline?: string | null;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachId) {
      setLoading(false);
      return;
    }
    supabase
      .rpc('get_squad_records_board', { p_coach_id: coachId })
      .then(({ data }) => {
        setRows(data || []);
        setLoading(false);
      });
  }, [coachId]);

  const events = getEventsForDiscipline(discipline);

  const recordsByGender = useMemo(() => {
    const out: Record<'Boy' | 'Girl', Record<string, any>> = { Boy: {}, Girl: {} };

    rows.forEach((r) => {
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
  }, [rows, discipline]);

  if (!coachId) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
          <Trophy className="w-4 h-4" /> All-Time Squad Records Board
        </h3>
        <span className="text-[11px] text-slate-400">Official Club / School Benchmarks</span>
      </div>

      {loading ? (
        <p className="text-slate-500 py-4 text-center">Loading squad records...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['Boy', 'Girl'] as const).map((gen) => (
            <div key={gen} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <h4 className="font-bold text-xs text-emerald-400 border-b border-slate-800 pb-1.5">
                {gen === 'Boy' ? 'Boys / Men Records' : 'Girls / Women Records'}
              </h4>
              <div className="divide-y divide-slate-800/80">
                {events.map((ev) => {
                  const rec = recordsByGender[gen][ev];
                  return (
                    <div key={ev} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-white">{ev}</span>
                        {rec && (
                          <span className="text-[11px] text-slate-400 block">
                            {rec.athlete_name} • {rec.race_date}
                            {rec.meet_name ? ` (${rec.meet_name})` : ''}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-extrabold text-sm text-amber-300">
                        {rec ? formatMark(Number(rec.time_seconds), discipline) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
