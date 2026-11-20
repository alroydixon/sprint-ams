'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, CheckCircle2 } from 'lucide-react';

export default function AthleteUpcomingMeetsCard({
  athleteId,
  coachId,
}: {
  athleteId: string;
  coachId?: string | null;
}) {
  const [meets, setMeets] = useState<any[]>([]);
  const [myEntries, setMyEntries] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachId) {
      setLoading(false);
      return;
    }
    loadCalendar();
  }, [athleteId, coachId]);

  async function loadCalendar() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: mData }, { data: eData }] = await Promise.all([
      supabase
        .from('meets')
        .select('*')
        .eq('coach_id', coachId)
        .gte('meet_date', today)
        .order('meet_date', { ascending: true }),
      supabase.from('meet_entries').select('*').eq('athlete_id', athleteId),
    ]);

    setMeets(mData || []);
    const map = new Map<string, any>();
    (eData || []).forEach((en) => map.set(en.meet_id, en));
    setMyEntries(map);
    setLoading(false);
  }

  if (loading || meets.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-amber-400" /> Squad Competition Calendar &amp; My Entries
        </h3>
        <span className="text-[11px] text-slate-400">Assigned by Coach</span>
      </div>

      <div className="space-y-2.5">
        {meets.map((m) => {
          const entry = myEntries.get(m.id);
          const isEntered = Boolean(entry && entry.events?.length > 0);

          return (
            <div
              key={m.id}
              className={`rounded-xl p-3 border ${
                isEntered
                  ? 'bg-emerald-950/30 border-emerald-500/50'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sm text-white">{m.meet_name}</strong>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                      {m.federation}
                    </span>
                    {isEntered && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Entered
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>📅 {m.meet_date}</span>
                    {m.venue && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" /> {m.venue}
                      </span>
                    )}
                    {m.notes && <span className="text-slate-300">• {m.notes}</span>}
                  </div>
                </div>
              </div>

              {isEntered ? (
                <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-300 font-semibold">Your Events:</span>
                    {entry.events.map((ev: string) => (
                      <span
                        key={ev}
                        className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-bold text-xs"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                  {entry.target_notes && (
                    <span className="text-[11px] text-amber-300 font-semibold">
                      Coach Note: {entry.target_notes}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500">
                  Planned squad meet — not entered in an event yet.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
