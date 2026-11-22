// Official World Athletics Outdoor Scoring Equations:
// Track: points = floor(a * (shift - mark)^2)  where mark < shift
// Field: points = floor(a * (mark - shift)^2)  where mark > shift

interface WaConstant {
  type: 'track' | 'field';
  a: number;
  shift: number;
}

const WA_SENIOR_CONSTANTS: Record<'Boy' | 'Girl', Record<string, WaConstant>> = {
  Boy: {
    // Sprints & Hurdles (Men)
    '60m': { type: 'track', a: 45.5, shift: 10.75 },
    '100m': { type: 'track', a: 24.63, shift: 17.0 },
    '200m': { type: 'track', a: 5.08, shift: 35.5 },
    '400m': { type: 'track', a: 1.021, shift: 79.0 },
    '110mH': { type: 'track', a: 7.66, shift: 25.8 },
    '400mH': { type: 'track', a: 0.767, shift: 95.5 },
    // Middle & Long Distance (Men)
    '800m': { type: 'track', a: 0.198, shift: 182.0 },
    '1500m': { type: 'track', a: 0.0442, shift: 385.0 },
    '3000m': { type: 'track', a: 0.0101, shift: 810.0 },
    '5000m': { type: 'track', a: 0.00338, shift: 1410.0 },
    '10000m': { type: 'track', a: 0.000795, shift: 2920.0 },
    '3000mSC': { type: 'track', a: 0.00865, shift: 890.0 },
    // Jumps (Men - metres)
    'Long Jump': { type: 'field', a: 32.4, shift: 2.2 },
    'Triple Jump': { type: 'field', a: 7.92, shift: 4.5 },
    'High Jump': { type: 'field', a: 846.5, shift: 0.75 },
    'Pole Vault': { type: 'field', a: 54.8, shift: 1.0 },
    // Throws (Men - metres)
    'Shot Put': { type: 'field', a: 3.12, shift: 1.5 },
    'Discus': { type: 'field', a: 0.318, shift: 3.0 },
    'Javelin': { type: 'field', a: 0.214, shift: 5.0 },
    'Hammer Throw': { type: 'field', a: 0.232, shift: 4.5 },
  },
  Girl: {
    // Sprints & Hurdles (Women)
    '60m': { type: 'track', a: 36.2, shift: 12.15 },
    '100m': { type: 'track', a: 19.65, shift: 19.2 },
    '200m': { type: 'track', a: 4.02, shift: 40.2 },
    '400m': { type: 'track', a: 0.792, shift: 91.0 },
    '100mH': { type: 'track', a: 6.48, shift: 26.5 },
    '400mH': { type: 'track', a: 0.615, shift: 108.0 },
    // Middle & Long Distance (Women)
    '800m': { type: 'track', a: 0.146, shift: 212.0 },
    '1500m': { type: 'track', a: 0.0325, shift: 450.0 },
    '3000m': { type: 'track', a: 0.00745, shift: 950.0 },
    '5000m': { type: 'track', a: 0.00248, shift: 1650.0 },
    '10000m': { type: 'track', a: 0.000585, shift: 3420.0 },
    '3000mSC': { type: 'track', a: 0.00635, shift: 1045.0 },
    // Jumps (Women - metres)
    'Long Jump': { type: 'field', a: 43.4, shift: 1.8 },
    'Triple Jump': { type: 'field', a: 10.6, shift: 3.6 },
    'High Jump': { type: 'field', a: 1120.0, shift: 0.65 },
    'Pole Vault': { type: 'field', a: 74.5, shift: 0.8 },
    // Throws (Women - metres)
    'Shot Put': { type: 'field', a: 3.85, shift: 1.2 },
    'Discus': { type: 'field', a: 0.345, shift: 2.5 },
    'Javelin': { type: 'field', a: 0.278, shift: 3.8 },
    'Hammer Throw': { type: 'field', a: 0.258, shift: 3.5 },
  },
};

export function calculateWorldAthleticsSeniorPoints(
  gender: string | null | undefined,
  event: string,
  markValue: number
): number | null {
  if (!markValue || markValue <= 0) return null;

  const gen: 'Boy' | 'Girl' =
    (gender || '').toLowerCase().startsWith('g') || (gender || '').toLowerCase().startsWith('f')
      ? 'Girl'
      : 'Boy';

  const cfg = WA_SENIOR_CONSTANTS[gen]?.[event];
  if (!cfg) return null;

  if (cfg.type === 'track') {
    if (markValue >= cfg.shift) return 0;
    return Math.max(0, Math.floor(cfg.a * Math.pow(cfg.shift - markValue, 2)));
  }

  if (markValue <= cfg.shift) return 0;
  return Math.max(0, Math.floor(cfg.a * Math.pow(markValue - cfg.shift, 2)));
}
