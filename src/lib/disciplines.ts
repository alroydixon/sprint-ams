import { FLAT_EVENTS, HURDLE_EVENTS } from './biomechanics';

export type CoachingDiscipline = 'sprints' | 'distance' | 'jumps' | 'throws';

export const DISCIPLINE_OPTIONS: { id: CoachingDiscipline; label: string; description: string }[] = [
  { id: 'sprints', label: 'Sprints & Hurdles', description: '60m–400m, 80mH–400mH, Relays & Block Power' },
  { id: 'distance', label: 'Middle & Long Distance', description: '600m–10000m, Steeplechase & Interval Mileage' },
  { id: 'jumps', label: 'Jumps', description: 'Long Jump, Triple Jump, High Jump & Pole Vault' },
  { id: 'throws', label: 'Throws', description: 'Shot Put, Discus, Javelin & Hammer Throw' },
];

export const DISTANCE_EVENTS = [
  '400m',
  '600m',
  '800m',
  '1000m',
  '1200m',
  '1500m',
  '1 Mile',
  '2000m',
  '3000m',
  '5000m',
  '10000m',
  '1500mSC',
  '2000mSC',
  '3000mSC',
];


export const JUMP_EVENTS = ['Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault'];

export const THROW_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer Throw'];

export const SPRINT_REP_DISTANCES = [
  10, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 350, 400, 500,
];

export const DISTANCE_REP_DISTANCES = [
  200, 300, 400, 600, 800, 1000, 1200, 1500, 1600, 2000, 3000, 4000, 5000, 8000, 10000,
];

export const JUMP_DRILL_PRESETS = [
  'Full Approach Jumps',
  'Short Approach (6–8 Strides)',
  'Medium Approach (10–12 Strides)',
  'Bounding / Hop-Step Drills',
  'Box / Depth Jumps',
  '30m Approach Run-Throughs',
];

export const THROW_DRILL_PRESETS = [
  'Full Competition Throws',
  'Half-Turn / Glide Throws',
  'Standing Power Throws',
  'Heavy Implement Throws',
  'Light Implement Speed Throws',
  'Medicine Ball Explosive Throws',
];

export function isFieldDiscipline(discipline?: string | null): boolean {
  return discipline === 'jumps' || discipline === 'throws';
}

export function getEventsForDiscipline(discipline?: string | null): string[] {
  if (discipline === 'distance') return DISTANCE_EVENTS;
  if (discipline === 'jumps') return JUMP_EVENTS;
  if (discipline === 'throws') return THROW_EVENTS;
  return [...FLAT_EVENTS, ...HURDLE_EVENTS];
}

export function getPrimaryHeadlineEvents(discipline?: string | null): [string, string] {
  if (discipline === 'distance') return ['800m', '1500m'];
  if (discipline === 'jumps') return ['Long Jump', 'Triple Jump'];
  if (discipline === 'throws') return ['Shot Put', 'Discus'];
  return ['100m', '200m'];
}

export function getRepDistancesForDiscipline(discipline?: string | null): number[] {
  if (discipline === 'distance') return DISTANCE_REP_DISTANCES;
  return SPRINT_REP_DISTANCES;
}

// Formats seconds ("10.39s" or "1:52.40") for track, or metres ("7.42m" or "58.90m") for jumps/throws
export function formatMark(val: number | null | undefined, discipline?: string | null): string {
  if (val === null || val === undefined || isNaN(Number(val)) || Number(val) <= 0) {
    return '—';
  }
  const n = Number(val);
  if (isFieldDiscipline(discipline)) {
    return `${n.toFixed(2)}m`;
  }
  if (n < 60) return `${n.toFixed(2)}s`;
  const mins = Math.floor(n / 60);
  const rem = (n % 60).toFixed(2).padStart(5, '0');
  return `${mins}:${rem}`;
}

// Compares two marks: returns true if candidateMark is a better PB than currentBest
export function isBetterMark(candidate: number, currentBest: number, discipline?: string | null): boolean {
  if (isFieldDiscipline(discipline)) return candidate > currentBest;
  return candidate < currentBest;
}

export function parseMarkInput(raw: string): number {
  const clean = raw.trim().replace(/m$/i, '').replace(/s$/i, '');
  if (!clean) return NaN;
  if (clean.includes(':')) {
    const [mStr, sStr] = clean.split(':');
    const mins = parseInt(mStr, 10);
    const secs = parseFloat(sStr);
    if (isNaN(mins) || isNaN(secs)) return NaN;
    return +(mins * 60 + secs).toFixed(2);
  }
  return parseFloat(clean);
}
