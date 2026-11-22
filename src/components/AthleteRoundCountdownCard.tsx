'use client';

import { useState, useEffect } from 'react';
import { BellRing } from 'lucide-react';

export default function AthleteRoundCountdownCard({
  enteredEvents,
  now,
}: {
  enteredEvents: string[];
  now: Date;
}) {
  const [selectedEvent, setSelectedEvent] = useState(enteredEvents.at(0) || '100m');
  const [round, setRound] = useState<'Heats' | 'Semi-Final' | 'Final'>('Heats');
  const [raceTime, setRaceTime] = useState('14:00');

  useEffect(() => {
    if (enteredEvents.length > 0 && !enteredEvents.includes(selectedEvent)) {
      setSelectedEvent(enteredEvents.at(0)!);
    }
  }, [enteredEvents, selectedEvent]);

  const [hh, mm] = raceTime.split(':').map((n) => parseInt(n, 10) || 0);
  const todayRaceTarget = new Date(now);
  todayRaceTarget.setHours(hh, mm, 0, 0);

  const raceDiffMs = Math.max(0, todayRaceTarget.getTime() - now.getTime());
  const raceHours = Math.floor(raceDiffMs / (1000 * 60 * 60));
  const raceMins = Math.floor((raceDiffMs / (1000 * 60)) % 60);
  const raceSecs = Math.floor((raceDiffMs / 1000) % 60);
  const minsUntilGun = Math.round(raceDiffMs / 60000);

  let phaseAlert = `⏳ ${minsUntilGun} mins until ${selectedEvent} (${round})`;
  if (raceDiffMs === 0) phaseAlert = '🏁 Race Time / Gun Ready!';
  else if (minsUntilGun <= 15) phaseAlert = '🚨 Report to Call Room NOW (T-15m)';
  else if (minsUntilGun <= 30) phaseAlert = '⚡ Spikes On • 3x60m Strides & Block Starts (T-30m)';
  else if (minsUntilGun <= 60) phaseAlert = '🔥 Start Dynamic Warm-Up & Drills (T-60m)';

  return (
    <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
          <BellRing className="w-4 h-4 text-amber-400" /> On-The-Day Event &amp; Round Countdown
        </h3>
        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold">
          {phaseAlert}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="text-slate-400 block mb-1">Event</label>
          {enteredEvents.length > 0 ? (
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
            >
              {enteredEvents.map((ev) => (
                <option key={ev} value={ev}>{ev}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              placeholder="e.g. 100m"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
            />
          )}
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Competition Round</label>
          <div className="grid grid-cols-3 bg-slate-800 p-0.5 rounded-lg gap-0.5">
            {(['Heats', 'Semi-Final', 'Final'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRound(r)}
                className={`py-1.5 rounded-md font-bold transition ${
                  round === r ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                {r === 'Semi-Final' ? 'Semi' : r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Scheduled Gun Time (Today)</label>
          <input
            type="time"
            value={raceTime}
            onChange={(e) => setRaceTime(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-mono font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 text-center">
        {[
          { label: 'Hours', val: String(raceHours).padStart(2, '0') },
          { label: 'Minutes', val: String(raceMins).padStart(2, '0') },
          { label: 'Seconds', val: String(raceSecs).padStart(2, '0') },
        ].map((u) => (
          <div key={u.label} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <strong className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-400 block">
              {u.val}
            </strong>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
