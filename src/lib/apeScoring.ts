// Official 2024 - 2027 ASA / SASA High Schools Athletics Performance Evaluation (APE) Tables
// Anchored to exact 1000-pt and 500-pt electronic times from the uploaded Bekker Sport tables

export type ApeAgeBand = 'U15' | 'U16' | 'U17' | 'U18' | 'U20';
export type ApeGender = 'Boy' | 'Girl';

interface EventAnchor {
  t1000: number;
  t500: number;
}

const APE_ANCHORS: Record<ApeGender, Record<ApeAgeBand, Record<string, EventAnchor>>> = {
  Boy: {
    U15: {
      '100m': { t1000: 10.70, t500: 13.27 },
      '200m': { t1000: 21.56, t500: 26.33 },
      '400m': { t1000: 48.19, t500: 62.83 },
      '100mH': { t1000: 12.84, t500: 19.38 },
      '300mH': { t1000: 36.66, t500: 47.09 },
    },
    U16: {
      '100m': { t1000: 10.58, t500: 13.12 },
      '200m': { t1000: 21.32, t500: 26.05 },
      '400m': { t1000: 47.69, t500: 62.17 },
      '100mH': { t1000: 12.62, t500: 19.04 },
      '300mH': { t1000: 36.84, t500: 47.32 },
    },
    U17: {
      '100m': { t1000: 10.49, t500: 13.00 },
      '200m': { t1000: 21.12, t500: 25.80 },
      '400m': { t1000: 47.22, t500: 61.57 },
      '110mH': { t1000: 13.36, t500: 20.17 },
      '400mH': { t1000: 52.21, t500: 65.26 },
    },
    U18: {
      '100m': { t1000: 10.39, t500: 12.88 },
      '200m': { t1000: 20.93, t500: 25.57 },
      '400m': { t1000: 46.81, t500: 61.03 },
      '110mH': { t1000: 13.52, t500: 18.84 },
      '400mH': { t1000: 51.76, t500: 64.70 },
    },
    U20: {
      '100m': { t1000: 10.23, t500: 12.69 },
      '200m': { t1000: 20.62, t500: 25.19 },
      '400m': { t1000: 46.11, t500: 60.12 },
      '110mH': { t1000: 13.48, t500: 20.65 },
      '400mH': { t1000: 50.33, t500: 82.71 },
    },
  },
  Girl: {
    U15: {
      '100m': { t1000: 11.75, t500: 18.37 },
      '200m': { t1000: 24.03, t500: 39.76 },
      '400m': { t1000: 54.00, t500: 91.78 },
      '90mH': { t1000: 13.10, t500: 21.89 },
      '300mH': { t1000: 41.65, t500: 72.25 },
    },
    U16: {
      '100m': { t1000: 11.65, t500: 18.23 },
      '200m': { t1000: 23.84, t500: 39.45 },
      '400m': { t1000: 54.12, t500: 92.48 },
      '90mH': { t1000: 12.73, t500: 21.27 },
      '300mH': { t1000: 41.30, t500: 71.64 },
    },
    U17: {
      '100m': { t1000: 11.57, t500: 18.09 },
      '200m': { t1000: 23.65, t500: 39.14 },
      '400m': { t1000: 53.20, t500: 90.49 },
      '100mH': { t1000: 13.80, t500: 20.25 },
      '400mH': { t1000: 58.91, t500: 108.10 },
    },
    U18: {
      '100m': { t1000: 11.48, t500: 17.96 },
      '200m': { t1000: 23.49, t500: 38.87 },
      '400m': { t1000: 53.33, t500: 91.12 },
      '100mH': { t1000: 13.45, t500: 19.73 },
      '400mH': { t1000: 58.51, t500: 107.36 },
    },
    U20: {
      '100m': { t1000: 11.32, t500: 17.71 },
      '200m': { t1000: 23.17, t500: 38.34 },
      '400m': { t1000: 52.61, t500: 89.88 },
      '100mH': { t1000: 13.27, t500: 23.70 },
      '400mH': { t1000: 57.82, t500: 106.10 },
    },
  },
};

export function resolveApeAgeBand(age?: number | null, grade?: string | null): ApeAgeBand {
  if (age && age > 0) {
    if (age <= 14) return 'U15';
    if (age === 15) return 'U16';
    if (age === 16) return 'U17';
    if (age === 17) return 'U18';
    return 'U20';
  }
  const g = (grade || '').toLowerCase();
  if (g.includes('8')) return 'U15';
  if (g.includes('9')) return 'U16';
  if (g.includes('10')) return 'U17';
  if (g.includes('11')) return 'U18';
  return 'U20';
}

export function calculateApePoints(
  gender: string | null | undefined,
  age: number | null | undefined,
  grade: string | null | undefined,
  event: string,
  timeSeconds: number
): { points: number; ageBand: ApeAgeBand; standardBadge: string } | null {
  if (!timeSeconds || timeSeconds <= 0) return null;

  const gen: ApeGender = (gender || '').toLowerCase().startsWith('g') || (gender || '').toLowerCase().startsWith('f')
    ? 'Girl'
    : 'Boy';
  const ageBand = resolveApeAgeBand(age, grade);
  const anchor = APE_ANCHORS[gen]?.[ageBand]?.[event];
  if (!anchor) return null;

  const k = Math.log(0.5) / Math.log(anchor.t1000 / anchor.t500);
  const rawPts = 1000 * Math.pow(anchor.t1000 / timeSeconds, k);
  const points = Math.max(0, Math.round(rawPts));

  // Official APE colour standards: Green >= 900 (International), Yellow >= 800 (National), Blue >= 650 (Provincial), White < 650 (Development)
  let standardBadge = 'Development';
  if (points >= 900) standardBadge = 'International';
  else if (points >= 800) standardBadge = 'National';
  else if (points >= 650) standardBadge = 'Provincial';

  return { points, ageBand, standardBadge };
}
