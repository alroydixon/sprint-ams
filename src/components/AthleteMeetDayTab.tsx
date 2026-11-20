'use client';

import { useState, useEffect, useMemo } from 'react';
import { QueuedRace, parseTodayTime, formatCountdown } from '@/lib/meetDayProtocol';
import MeetDayChecklist from './MeetDayChecklist';
import { Timer, Plus, Trash2 } from 'lucide-react';

export default function AthleteMeetDayTab() {
  const [queue, setQueue] = useState<QueuedRace[]>([
    { id: 'r1', eventName: '100m', round: 'Heat', raceTime: '11:30', callRoomMins: 20, isReWarmup: false },
    { id: 'r2', eventName: '200m', round: 'Final', raceTime: '14:45', callRoomMins: 20, isReWarmup: true },
  ]);
  const [activeId, setActiveId] = useState<string>('r1');
  const [completedMap, setCompletedMap] = useState<Record<string, string[]>>({});
  const [now, setNow] = useState<Date | null>(null);

  const [newEvent, setNewEvent] = useState('100m');
  const [newRound, setNewRound] = useState('Final');
  const [newTime, setNewTime] = useState('16:00');
  const [newCallRoom, setNewCallRoom] = useState(20);
  const [newIsReWarmup, setNewIsReWarmup] = useState(true);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedQueue = useMemo(
    () => [...queue].sort((a, b) => a.raceTime.localeCompare(b.raceTime)),
    [queue]
  );

  const activeRace = sortedQueue.find((r) => r.id === activeId) || sortedQueue.at(0);

  function addRaceToQueue(e: React.FormEvent) {
    e.preventDefault();
    const id = `race_${Date.now()}`;
    setQueue([
      ...queue,
      { id, eventName: newEvent, round: newRound, raceTime: newTime, callRoomMins: newCallRoom, isReWarmup: newIsReWarmup },
    ]);
    setActiveId(id);
  }

  function removeRace(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (queue.length <= 1) return;
    const filtered = queue.filter((r) => r.id !== id);
    setQueue(filtered);
    if (activeId === id && filtered.length > 0) setActiveId(filtered.at(0)!.id);
  }

  function toggleStep(stepId: string) {
    if (!activeRace) return;
    const current = completedMap[activeRace.id] || [];
    const updated = current.includes(stepId) ? current.filter((x) => x !== stepId) : [...current, stepId];
    setCompletedMap({ ...completedMap, [activeRace.id]: updated });
  }

  if (!now) return <div className="p-6 text-xs text-slate-400">Syncing track clock...</div>;

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
  const liveClock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <form onSubmit={addRaceToQueue} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Timer className="w-4 h-4" /> Meet Day Multi-Event Queue ({sortedQueue.length} Races)
          </h3>
          <span className="text-[11px] text-emerald-300 font-mono">
            Track Clock: {liveClock} ({localTz})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <select value={newEvent} onChange={(e) => setNewEvent(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white">
            <option>60m</option>
            <option>100m</option>
            <option>200m</option>
            <option>400m</option>
            <option>100mH / 110mH</option>
            <option>400mH</option>
            <option>4x100m Relay</option>
            <option>4x400m Relay</option>
          </select>
          <select value={newRound} onChange={(e) => setNewRound(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white">
            <option>Heat</option>
            <option>Semi-Final</option>
            <option>Final</option>
            <option>Time Trial</option>
          </select>
          <input type="time" required value={newTime} onChange={(e) => setNewTime(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white" />
          <select value={newCallRoom} onChange={(e) => setNewCallRoom(Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white">
            <option value={15}>Call Room: -15m</option>
            <option value={20}>Call Room: -20m</option>
            <option value={25}>Call Room: -25m</option>
            <option value={30}>Call Room: -30m</option>
          </select>
          <select value={newIsReWarmup ? 're' : 'full'} onChange={(e) => setNewIsReWarmup(e.target.value === 're')} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white">
            <option value="full">Full 75m Warm-Up</option>
            <option value="re">40m Re-Warm-Up</option>
          </select>
          <button type="submit" className="flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg px-3 py-2">
            <Plus className="w-3.5 h-3.5" /> Add Race
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          {sortedQueue.map((r, idx) => {
            const rDiff = parseTodayTime(r.raceTime, now).getTime() - now.getTime();
            const isSelected = activeRace?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className={`cursor-pointer rounded-xl p-3 border transition ${
                  isSelected ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Race #{idx + 1} • {r.round}</span>
                    <h4 className="text-sm font-bold text-white">{r.eventName} @ {r.raceTime}</h4>
                  </div>
                  {sortedQueue.length > 1 && (
                    <button type="button" onClick={(e) => removeRace(e, r.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2 text-[11px]">
                  <span className="font-mono font-bold text-amber-300">{formatCountdown(rDiff)}</span>
                  <span className="text-slate-400">{r.isReWarmup ? '40m Re-Warm-Up' : '75m Full Warm-Up'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </form>

      {activeRace && (
        <MeetDayChecklist
          race={activeRace}
          now={now}
          completedSteps={completedMap[activeRace.id] || []}
          onToggleStep={toggleStep}
          onReset={() => setCompletedMap({ ...completedMap, [activeRace.id]: [] })}
        />
      )}
    </div>
  );
}
