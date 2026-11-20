export interface QueuedRace {
  id: string;
  eventName: string;
  round: string;
  raceTime: string;
  callRoomMins: number;
  isReWarmup: boolean;
}

export interface WarmupStep {
  id: string;
  offsetMins: number;
  title: string;
  detail: string;
  isCallRoom?: boolean;
}

export const FULL_WARMUP: WarmupStep[] = [
  { id: 'arrive', offsetMins: 75, title: 'Track Arrival & Bib / Spike Check', detail: 'Confirm heat/lane draw, pin race numbers, inspect 6mm pyramid spikes.' },
  { id: 'jog', offsetMins: 60, title: 'General Pulse Raise (5–6 min)', detail: 'Easy 400m–600m jog + light skipping to elevate muscle temperature.' },
  { id: 'mobility', offsetMins: 52, title: 'Dynamic Mobility & Hurdle Walkovers', detail: 'Leg swings, hip circles, lunge matrix, ankle/calf activation.' },
  { id: 'drills', offsetMins: 44, title: 'Sprint Mechanics Drills (2×20m)', detail: 'Ankling, A-marches, A-skips, B-skips, straight-leg bounds, fast-claw dribbles.' },
  { id: 'buildups', offsetMins: 35, title: 'Progressive Strides / Build-Ups (3×40m)', detail: 'Build smoothly to 85%, 90%, and 95% speed with full walk-back recovery.' },
  { id: 'blocks', offsetMins: 26, title: 'Spikes On & Block Accelerations (2–3×20m)', detail: 'Set block pedals, test "Set" position tension, explosive 15–20m drive.' },
  { id: 'callroom', offsetMins: 20, title: 'REPORT TO CALL ROOM', detail: 'Mandatory call-room check-in with spikes, bib, and warm-up top.', isCallRoom: true },
  { id: 'strides_track', offsetMins: 8, title: 'Final Track Stride & Mental Cue', detail: '1×15m pop-out on track, shake out limbs, lock in drive-phase cue.' },
  { id: 'gun', offsetMins: 0, title: 'GUN TIME — RACE START', detail: 'Settle into blocks, react to the gun, execute your race model!' },
];

export const RE_WARMUP: WarmupStep[] = [
  { id: 'flush', offsetMins: 40, title: 'Post-Race Flush, Hydration & Fuel', detail: '3 min easy walk/jog after previous race, sip electrolytes, keep legs warm.' },
  { id: 'remob', offsetMins: 32, title: 'Quick Re-Activation & Hip Mobility', detail: 'Dynamic leg swings, 2×15m A-skips & fast-claw dribbles.' },
  { id: 'restride', offsetMins: 25, title: 'Re-Warm-Up Build-Ups & 1×15m Block Pop', detail: '2×30m progressive build-ups (85% → 92%) + 1 explosive block start.' },
  { id: 'callroom', offsetMins: 20, title: 'REPORT TO CALL ROOM', detail: 'Mandatory call-room check-in with spikes and bib.', isCallRoom: true },
  { id: 'strides_track', offsetMins: 8, title: 'Final Track Stride & Mental Cue', detail: '1×15m pop-out on track, shake out limbs, lock in race cue.' },
  { id: 'gun', offsetMins: 0, title: 'GUN TIME — RACE START', detail: 'Settle into blocks, react to the gun, execute your race!' },
];

export function parseTodayTime(timeStr: string, baseNow: Date): Date {
  const parts = timeStr.split(':');
  const hh = parseInt(parts.at(0) || '14', 10);
  const mm = parseInt(parts.at(1) || '30', 10);
  const d = new Date(baseNow.getTime());
  d.setHours(hh, mm, 0, 0);
  return d;
}

export function formatClockTime(raceDate: Date, offsetMins: number): string {
  const t = new Date(raceDate.getTime() - offsetMins * 60000);
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return 'NOW / PASSED';
  const totalSec = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}h ${pad(mins)}m ${pad(secs)}s` : `${pad(mins)}m ${pad(secs)}s`;
}
