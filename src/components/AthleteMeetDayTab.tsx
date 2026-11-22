'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AthleteSquadRecordsCard from './AthleteSquadRecordsCard';
import { Clock, Calendar, MapPin, CheckSquare, Square, Flame } from 'lucide-react';

const CHECKLIST = [
  'Track spikes & 6mm/9mm pins packed',
  'Club / School competition vest & shorts',
  '2L hydration bottle + electrolytes',
  'Light carb snack (banana / energy bar)',
  'Foam roller / mobility band',
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
  const [now, setNow] = useState<Date>(() => new Date());
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('meet_entries')
      .select('*, meets(*)')
      .eq('athlete_id', athleteId)
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) =>
          (a.meets?.meet_date || '').localeCompare(b.meets?.meet_date || '')
        );
        setEntries(sorted);
        setLoading(false);
      });
  }, [athleteId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const upcomingEntry = entries.find((e) => {
    const d = e.meets?.meet_date;
    if (!d) return false;
    return new Date(`${d}T23:59:59`).getTime() >= now.getTime();
  }) || entries.at(0);

  const targetDateStr = upcomingEntry?.meets?.meet_date;
  const targetTime = targetDateStr ? new Date(`${targetDateStr}T09:00:00`).getTime() : null;
  const diffMs = targetTime ? Math.max(0, targetTime - now.getTime()) : 0;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  return (
    <div className="space-y-6 text-xs">
      {/* Live Meet Countdown Clock & Entered Events */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Next Competition Countdown
          </h3>
          {upcomingEntry?.meets && (
            <span className="text-slate-300 font-semibold">
              {upcomingEntry.meets.meet_name} • {upcomingEntry.meets.meet_date}
            </span>
          )}
        </div>

        {targetTime ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Days', val: String(days).padStart(2, '0') },
              { label: 'Hours', val: String(hours).padStart(2, '0') },
              { label: 'Mins', val: String(minutes).padStart(2, '0') },
              { label: 'Secs', val: String(seconds).padStart(2, '0') },
            ].map((unit) => (
              <div key={unit.label} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <strong className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-300 block">
                  {unit.val}
                </strong>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider">{unit.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 py-2">No upcoming meet scheduled yet.</p>
        )}

        {/* Entered Meet Events */}
        {!loading && entries.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Entered Meet Schedule
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {entries.map((entry) => {
                const m = entry.meets;
                if (!m) return null;
                const eventList = String(entry.events || 'Selected')
                  .split(/[,/&]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);

                return (
                  <div key={entry.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-white text-sm">{m.meet_name}</strong>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {eventList.map((ev) => (
                          <span key={ev} className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-amber-400" /> {m.meet_date}
                      {m.location && (
                        <>
                          <span>•</span>
                          <MapPin className="w-3 h-3 text-sky-400" /> {m.location}
                        </>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pre-Race Warmup Timeline & Kit Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" /> Race-Day Warm-Up Timeline
          </h3>
          <ul className="space-y-1.5 text-slate-300">
            <li className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"><strong className="text-amber-300">T-60m:</strong> 8 min easy jog + dynamic joint mobility</li>
            <li className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"><strong className="text-amber-300">T-45m:</strong> Sprint mechanics (A-skips, B-skips, high knees)</li>
            <li className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"><strong className="text-amber-300">T-30m:</strong> 3 × 60m progressive build-up strides (80%→95%)</li>
            <li className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"><strong className="text-amber-300">T-20m:</strong> Spikes on + 2 × 20m explosive block/standing starts</li>
            <li className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"><strong className="text-emerald-400">T-10m:</strong> Call room check-in, sip electrolytes &amp; stay warm</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <h3 className="font-bold text-sm text-emerald-400">Competition Kit Checklist</h3>
          <div className="space-y-2">
            {CHECKLIST.map((item) => {
              const done = Boolean(checked[item]);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setChecked((p) => ({ ...p, [item]: !p[item] }))}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition ${
                    done ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200 line-through' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  {done ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" /> : <Square className="w-4 h-4 text-slate-500 shrink-0" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exact Coach-Style Squad Records Board with Age Category & Division Filters */}
      <AthleteSquadRecordsCard coachId={coachId} discipline={discipline} />
    </div>
  );
}
