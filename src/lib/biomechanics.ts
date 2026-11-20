export const FLAT_EVENTS = ['60m', '100m', '150m', '200m', '300m', '400m'] as const;
export const HURDLE_EVENTS = ['90mH', '100mH', '110mH', '300mH', '400mH'] as const;
export const ALL_EVENTS = [...FLAT_EVENTS, ...HURDLE_EVENTS] as const;

// Exact 10m increments from 10m up to 400m (40 distances)
export const TRAINING_DISTANCES = Array.from({ length: 40 }, (_, i) => (i + 1) * 10);

export function calculatePower(weightKg: number, pushups: number, situps: number, squatJumps: number) {
  const pushupW = (weightKg * 9.81 * 0.65 * 0.35 * pushups) / 60;
  const situpW = (weightKg * 9.81 * 0.50 * 0.35 * situps) / 60;
  const squatJumpW = (weightKg * 9.81 * 1.00 * 0.55 * squatJumps) / 60;
  const totalW = pushupW + situpW + squatJumpW;
  const totalWPerKg = weightKg > 0 ? totalW / weightKg : 0;

  return {
    pushupW: Number(pushupW.toFixed(1)),
    situpW: Number(situpW.toFixed(1)),
    squatJumpW: Number(squatJumpW.toFixed(1)),
    totalW: Number(totalW.toFixed(1)),
    totalWPerKg: Number(totalWPerKg.toFixed(2)),
  };
}

export function calculateHorizontalForce(weightKg: number, distanceM: number, timeS: number) {
  if (!weightKg || !distanceM || !timeS || timeS <= 0) return null;
  const accel = (2 * distanceM) / (timeS * timeS);
  const forceN = weightKg * accel;
  const forcePerKg = forceN / weightKg;

  return {
    accel: Number(accel.toFixed(2)),
    forceN: Number(forceN.toFixed(1)),
    forcePerKg: Number(forcePerKg.toFixed(2)),
  };
}

export function calculateTargetSplits(pbSeconds: number) {
  return {
    effort95: Number((pbSeconds / 0.95).toFixed(2)),
    effort90: Number((pbSeconds / 0.90).toFixed(2)),
    effort80: Number((pbSeconds / 0.80).toFixed(2)),
    effort70: Number((pbSeconds / 0.70).toFixed(2)),
    improve2Pct: Number((pbSeconds * 0.98).toFixed(2)),
    improve5Pct: Number((pbSeconds * 0.95).toFixed(2)),
  };
}

export function getReadinessStatus(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return { label: 'No Check-In', color: 'bg-slate-800 text-slate-400 border-slate-700', dot: 'bg-slate-500' };
  }
  if (score >= 38) {
    return { label: `${score}/50 • Green (Ready)`, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400' };
  }
  if (score >= 28) {
    return { label: `${score}/50 • Amber (Caution)`, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: 'bg-amber-400' };
  }
  return { label: `${score}/50 • Red (High Risk)`, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', dot: 'bg-rose-500' };
}
export function calculateAutoEffortPct(
  distanceM: number,
  runTimeS: number,
  races: { event: string; time_seconds: number }[],
  tests: { sprint_20m_s?: number; sprint_40m_s?: number; sprint_60m_s?: number }[] = []
): { effortPct: number; referenceLabel: string } | null {
  if (!distanceM || !runTimeS || runTimeS <= 0) return null;

  // Gather all best times by distance (from flat races + fitness test splits)
  const bestByDist: Record<number, number> = {};
  races.forEach((r) => {
    const clean = r.event.trim().toLowerCase();
    if (clean.endsWith('h')) return; // exclude hurdles for flat run effort
    const d = parseInt(clean.replace('m', ''));
    const t = Number(r.time_seconds);
    if (d > 0 && t > 0) {
      if (!bestByDist[d] || t < bestByDist[d]) bestByDist[d] = t;
    }
  });

  tests.forEach((t) => {
    if (t.sprint_20m_s && (!bestByDist[20] || Number(t.sprint_20m_s) < bestByDist[20])) {
      bestByDist[20] = Number(t.sprint_20m_s);
    }
    if (t.sprint_40m_s && (!bestByDist[40] || Number(t.sprint_40m_s) < bestByDist[40])) {
      bestByDist[40] = Number(t.sprint_40m_s);
    }
    if (t.sprint_60m_s && (!bestByDist[60] || Number(t.sprint_60m_s) < bestByDist[60])) {
      bestByDist[60] = Number(t.sprint_60m_s);
    }
  });

  // 1. Exact distance PB match
  if (bestByDist[distanceM]) {
    const pb = bestByDist[distanceM];
    const pct = Math.min(105, Math.round((pb / runTimeS) * 1000) / 10);
    return { effortPct: pct, referenceLabel: `${distanceM}m PB (${pb.toFixed(2)}s)` };
  }

  // 2. Fallback: scale from closest known PB using Riegel sprint fatigue factor (1.06)
  const knownDists = Object.keys(bestByDist).map(Number);
  if (knownDists.length === 0) return null;

  const closest = knownDists.reduce((prev, curr) =>
    Math.abs(curr - distanceM) < Math.abs(prev - distanceM) ? curr : prev
  );
  const estPb = bestByDist[closest] * Math.pow(distanceM / closest, 1.06);
  const pct = Math.min(105, Math.round((estPb / runTimeS) * 1000) / 10);
  return { effortPct: pct, referenceLabel: `Est. ${distanceM}m PB (${estPb.toFixed(2)}s from ${closest}m)` };
}
