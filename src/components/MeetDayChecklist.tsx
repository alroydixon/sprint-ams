'use client';

import {
  QueuedRace,
  FULL_WARMUP,
  RE_WARMUP,
  parseTodayTime,
  formatClockTime,
  formatCountdown,
} from '@/lib/meetDayProtocol';
import { CheckCircle2, Circle, BellRing, Flame } from 'lucide-react';

export default function MeetDayChecklist({
  race,
  now,
  completedSteps,
  onToggleStep,
  onReset,
}: {
  race: QueuedRace;
  now: Date;
  completedSteps: string[];
  onToggleStep: (stepId: string) => void;
  onReset: () => void;
}) {
  const gunDate = parseTodayTime(race.raceTime, now);
  const callRoomDate = new Date(gunDate.getTime() - race.callRoomMins * 60000);

  const steps = (race.isReWarmup ? RE_WARMUP : FULL_WARMUP)
    .map((s) => (s.id === 'callroom' ? { ...s, offsetMins: race.callRoomMins } : s))
    .sort((a, b) => b.offsetMins - a.offsetMins);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl p-4 bg-slate-900 border border-amber-500/40">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5" /> {race.eventName} CALL ROOM ({formatClockTime(gunDate, race.callRoomMins)})
            </span>
            <span>-{race.callRoomMins}m</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white mt-1">{formatCountdown(callRoomDate.getTime() - now.getTime())}</p>
        </div>

        <div className="rounded-xl p-4 bg-emerald-950/30 border border-emerald-700/60">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> {race.eventName} ({race.round}) GUN TIME ({race.raceTime})
            </span>
            <span>RACE</span>
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-300 mt-1">{formatCountdown(gunDate.getTime() - now.getTime())}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
            {race.eventName} ({race.round}) — {race.isReWarmup ? '40-Min Re-Warm-Up Protocol' : '75-Min Full Warm-Up Protocol'}
          </h4>
          {completedSteps.length > 0 && (
            <button type="button" onClick={onReset} className="text-[11px] text-slate-400 hover:text-white underline">
              Reset Checklist
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-800">
          {steps.map((step) => {
            const done = completedSteps.includes(step.id);
            const clock = formatClockTime(gunDate, step.offsetMins);
            return (
              <div
                key={step.id}
                onClick={() => onToggleStep(step.id)}
                className={`py-3 px-2 flex items-start gap-3 cursor-pointer rounded-lg transition ${
                  step.isCallRoom ? 'bg-amber-950/30 border border-amber-700/50 my-1' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="pt-0.5 text-emerald-400 shrink-0">
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className={`font-bold ${done ? 'line-through text-slate-500' : step.isCallRoom ? 'text-amber-300' : 'text-white'}`}>{step.title}</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-semibold">
                      {clock} ({step.offsetMins === 0 ? '0m' : `-${step.offsetMins}m`})
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${done ? 'text-slate-600' : 'text-slate-400'}`}>{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
