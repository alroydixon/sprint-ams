'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AthleteSquadRecordsCard from './AthleteSquadRecordsCard';
import { Timer, Play, Pause, RotateCcw, Calendar, MapPin, CheckSquare, Square } from 'lucide-react';

const WARMUP_STAGES = [
  { label: 'T-60m: Easy Jog & Mobility', minutes: 15 },
  { label: 'T-45m: Dynamic Sprint Drills (A/B Skips)', minutes: 15 },
  { label: 'T-30m: Progressive Build-Up Strides (3x60m)', minutes: 10 },
  { label: 'T-20m: Spikes On & 2x Block Starts', minutes: 10 },
  { label: 'T-10m: Call Room & Hydration Ready', minutes: 10 },
];

const CHECKLIST_ITEMS = [
  'Track spikes & 6mm/9mm pins packed',
  'Club / School competition vest & shorts',
  '2L water bottle + electrolytes',
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
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(WARMUP_STAGES[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase
      .from('meet_entries')
      .select('*, meets(*)')
      .eq('athlete_id', athleteId)
      .then(({ data }) => setEntries(data || []));
  }, [athleteId]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  function selectStage(idx: number) {
    setRunning(false);
    setActiveStageIdx(idx);
    setSecondsLeft(WARMUP_STAGES[idx].minutes * 60);
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="space-y-6 text-xs">
      {/* Meet-Day Warm-Up Countdown Timer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Timer className="w-4 h-4" /> Meet-Day Warm-Up Protocol Timer
          </h3>
          <span className="text-[11px] text-slate-400">{WARMUP_STAGES[activeStageIdx].label}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {WARMUP_STAGES.map((st, idx) => (
            <button
              key={st.label}
              type="button"
              onClick={() => selectStage(idx)}
              className={`px-2.5 py-1.5 rounded-lg border font-semibold transition ${
                activeStageIdx === idx
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st.label.split(':')[0]} ({st.minutes}m)
            </button>
          ))}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-4xl font-extrabold text-amber-300 tracking-wider">
            {mins}:{secs}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRunning(!running)}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg"
            >
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start Timer</>}
            </button>
            <button
              type="button"
              onClick={() => selectStage(activeStageIdx)}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Assigned Upcoming Meets */}
      {entries.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> My Selected Meets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entries.map((entry) => {
              const meet = entry.meets;
              if (!meet) return null;
              return (
                <div key={entry.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-white">{meet.meet_name}</strong>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">{entry.events || 'Selected'}</span>
                  </div>
                  <p className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {meet.meet_date} {meet.location ? `• ${meet.location}` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kit Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
        <h3 className="font-bold text-sm text-emerald-400">Competition Kit Checklist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHECKLIST_ITEMS.map((item) => {
            const done = Boolean(checked[item]);
            return (
              <button
                key={item}
                type="button"
                onClick={() => setChecked((p) => ({ ...p, [item]: !p[item] }))}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left ${
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

      {/* Coach-Style All-Time Squad Records Board with Grade & Gender Filters */}
      <AthleteSquadRecordsCard coachId={coachId} discipline={discipline} />
    </div>
  );
}
