'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AthleteSquadRecordsCard from './AthleteSquadRecordsCard';
import { Calendar, MapPin, CheckSquare, Square, Clock } from 'lucide-react';

const CHECKLIST_ITEMS = [
  'Track spikes & correct 6mm/9mm pins packed',
  'Club / School competition vest & shorts',
  '2L hydration bottle + electrolytes',
  'Light carbohydrate snack (banana / energy bar)',
  'Foam roller / mobility band for warm-up',
  'Arrive 90 mins before first event call room',
];

export default function AthleteMeetDayTab({
  athleteId,
  coachId,
  discipline = 'sprints',
}: {
  athleteId: string;
  coachId?: string | null;
  discipline?: string | null;
}) {
  const [entries, setEntries] = useState<any[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('meet_entries')
      .select('*, meets(*)')
      .eq('athlete_id', athleteId)
      .then(({ data }) => {
        setEntries(data || []);
        setLoading(false);
      });
  }, [athleteId]);

  function toggleCheck(item: string) {
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  return (
    <div className="space-y-6 text-xs">
      {/* Assigned Upcoming Meets */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> My Upcoming Meets &amp; Events
        </h3>

        {loading ? (
          <p className="text-slate-500 py-4 text-center">Loading meet schedule...</p>
        ) : entries.length === 0 ? (
          <p className="text-slate-400 py-3">
            No upcoming meet entries assigned yet. Your coach will assign your events before competition day.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entries.map((entry) => {
              const meet = entry.meets;
              if (!meet) return null;
              return (
                <div
                  key={entry.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <strong className="text-sm text-white">{meet.meet_name}</strong>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
                      {entry.events || 'Selected'}
                    </span>
                  </div>
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> {meet.meet_date}
                    {meet.location && (
                      <>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5 text-sky-400" /> {meet.location}
                      </>
                    )}
                  </p>
                  {entry.notes && (
                    <p className="text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 mt-1">
                      Coach Note: {entry.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Competition Day Packing & Warm-Up Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-emerald-400">Competition Day Kit &amp; Prep Checklist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHECKLIST_ITEMS.map((item) => {
            const isDone = Boolean(checked[item]);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleCheck(item)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition ${
                  isDone
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200 line-through'
                    : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                }`}
              >
                {isDone ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>{item}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* All-Time Squad Records Board (Boy/Men & Girl/Women) */}
      <AthleteSquadRecordsCard coachId={coachId} discipline={discipline} />
    </div>
  );
}
