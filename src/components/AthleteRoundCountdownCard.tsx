'use client';

import { useState, useEffect } from 'react';
import { BellRing, Plus, Trash2, Clock } from 'lucide-react';

interface RaceTimerItem {
  id: string;
  event: string;
  round: 'Heats' | 'Semi-Final' | 'Final';
  gunTime: string; // HH:MM
}

const STORAGE_KEY = 'fast_ams_meetday_timers_v1';

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
  const [timers, setTimers] = useState<RaceTimerItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load saved timers from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setTimers(parsed);
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  // Persist timers whenever updated
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
    } catch {
      // ignore storage errors
    }
  }, [timers, hydrated]);

  useEffect(() => {
    if (enteredEvents.length > 0 && !enteredEvents.includes(selectedEvent)) {
      setSelectedEvent(enteredEvents.at(0)!);
    }
  }, [enteredEvents, selectedEvent]);

  function addTimer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent.trim() || !raceTime) return;
    const item: RaceTimerItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      event: selectedEvent.trim(),
      round,
      gunTime: raceTime,
    };
    setTimers((prev) =>
      [...prev, item].sort((a, b) => a.gunTime.localeCompare(b.gunTime))
    );
  }

  function removeTimer(id: string) {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }

  function getCountdownState(item: RaceTimerItem) {
    const [hh, mm] = item.gunTime.split(':').map((n) => parseInt(n, 10) || 0);
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);

    const diffMs = Math.max(0, target.getTime() - now.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs / (1000 * 60)) % 60);
    const secs = Math.floor((diffMs / 1000) % 60);
    const minsUntilGun = Math.round(diffMs / 60000);

    let alertText = `⏳ ${minsUntilGun}m until gun`;
    let borderClass = 'border-slate-800';
    let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';

    if (diffMs === 0) {
      alertText = '🏁 Race Time / Gun Ready';
      borderClass = 'border-emerald-500/60';
      badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    } else if (minsUntilGun <= 15) {
      alertText = '🚨 Report to Call Room (T-15m)';
      borderClass = 'border-rose-500/70';
      badgeClass = 'bg-rose-500/20 text-rose-200 border-rose-500/50';
    } else if (minsUntilGun <= 30) {
      alertText = '⚡ Spikes On • Strides & Starts (T-30m)';
      borderClass = 'border-amber-500/60';
      badgeClass = 'bg-amber-500/20 text-amber-200 border-amber-500/50';
    } else if (minsUntilGun <= 60) {
      alertText = '🔥 Start Warm-Up & Drills (T-60m)';
      borderClass = 'border-sky-500/60';
      badgeClass = 'bg-sky-500/20 text-sky-200 border-sky-500/40';
    }

    return {
      hhStr: String(hours).padStart(2, '0'),
      mmStr: String(mins).padStart(2, '0'),
      ssStr: String(secs).padStart(2, '0'),
      alertText,
      borderClass,
      badgeClass,
    };
  }

  return (
    <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <BellRing className="w-4 h-4 text-amber-400" /> Multi-Event Race Day Countdown Timers
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Add all your Heats, Semi-Finals, Finals &amp; Relays for today — timers run simultaneously
          </p>
        </div>
        {timers.length > 0 && (
          <button
            type="button"
            onClick={() => setTimers([])}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Clear All ({timers.length})
          </button>
        )}
      </div>

      {/* Add New Event Countdown Form */}
      <form onSubmit={addTimer} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end bg-slate-950 border border-slate-800 rounded-xl p-3">
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
              required
              type="text"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              placeholder="e.g. 100m, 200m, 4x100m"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
            />
          )}
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Round</label>
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
          <label className="text-slate-400 block mb-1">Gun Time (Today)</label>
          <input
            required
            type="time"
            value={raceTime}
            onChange={(e) => setRaceTime(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-mono font-bold"
          />
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-3 rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Add Event Timer
        </button>
      </form>

      {/* Active Simultaneous Event Countdown Cards */}
      {timers.length === 0 ? (
        <p className="text-slate-400 text-center py-3 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl">
          No event timers added for today yet. Pick an event, round, and gun time above and click <strong>+ Add Event Timer</strong>.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {timers.map((item) => {
            const st = getCountdownState(item);
            return (
              <div
                key={item.id}
                className={`bg-slate-950 border ${st.borderClass} rounded-xl p-3.5 space-y-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm text-white">{item.event}</strong>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-[11px]">
                        {item.round}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-amber-400" /> {item.gunTime}
                      </span>
                    </div>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${st.badgeClass}`}>
                      {st.alertText}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeTimer(item.id)}
                    title="Remove timer"
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Hrs', val: st.hhStr },
                    { label: 'Min', val: st.mmStr },
                    { label: 'Sec', val: st.ssStr },
                  ].map((u) => (
                    <div key={u.label} className="bg-slate-900 border border-slate-800 rounded-lg py-2">
                      <strong className="text-xl font-mono font-extrabold text-emerald-400 block">
                        {u.val}
                      </strong>
                      <span className="text-[10px] text-slate-400 uppercase">{u.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
