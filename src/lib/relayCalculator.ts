import { resolveApeAgeBand, ApeAgeBand } from './apeScoring';

export type RelayFormat = '4x100m' | '4x400m';
export type ExchangeEfficiency = 'safe' | 'standard' | 'sharp';

export interface RelayCandidate {
  athlete: any;
  ageBand: ApeAgeBand;
  pbSeconds: number;
  pbDate: string;
  isInjured: boolean;
  readinessScore?: number;
}

export interface AssignedRelayLeg {
  legNumber: 1 | 2 | 3 | 4;
  roleTitle: string;
  roleTip: string;
  candidate: RelayCandidate | null;
  predictedSplit: number;
  checkMarkMetres: number | null;
  checkMarkSteps: number | null;
}

const LEG_META: Record<RelayFormat, { title: string; tip: string }[]> = {
  '4x100m': [
    { title: 'Leg 1 • Block Start & First Curve', tip: 'Fastest reaction & 0–30m block drive; carries baton in right hand.' },
    { title: 'Leg 2 • Backstretch (~126m Fly)', tip: 'Longest leg; strong top-end speed endurance; receives in left hand.' },
    { title: 'Leg 3 • Second Curve Specialist', tip: 'Tight curve mechanics & smooth outgoing acceleration; receives in right.' },
    { title: 'Leg 4 • Anchor & Finish Drive', tip: 'Strongest finisher under pressure; receives in left hand.' },
  ],
  '4x400m': [
    { title: 'Leg 1 • Lane Break & Pace Setter', tip: 'Disciplined first 200m pace from blocks before cutting in at breakline.' },
    { title: 'Leg 2 • Traffic & Second Leg', tip: 'Strong positional runner through first open-lane exchange.' },
    { title: 'Leg 3 • Setup & Tempo Builder', tip: 'Maintains rhythm and sets up anchor in top contention.' },
    { title: 'Leg 4 • Anchor & Kick Specialist', tip: 'Best closing 150m kick and tactical racing composure.' },
  ],
};

// Total baton exchange savings across 3 exchanges (in seconds)
const EXCHANGE_SAVINGS: Record<RelayFormat, Record<ExchangeEfficiency, number>> = {
  '4x100m': { safe: 1.65, standard: 2.10, sharp: 2.55 },
  '4x400m': { safe: 2.10, standard: 2.70, sharp: 3.30 },
};

export function getEligibleRelayCandidates(
  athletes: any[],
  races: any[],
  medical: any[],
  wellness: any[],
  format: RelayFormat,
  division: 'Boy' | 'Girl',
  ageBandFilter: 'All' | ApeAgeBand,
  excludeInjured: boolean
): RelayCandidate[] {
  const targetEvent = format === '4x100m' ? '100m' : '400m';
  const injuredIds = new Set(medical.filter((m) => !m.is_cleared).map((m) => m.athlete_id));

  const latestWellness = new Map<string, number>();
  wellness.forEach((w) => {
    if (!latestWellness.has(w.athlete_id) && w.composite_score) {
      latestWellness.set(w.athlete_id, w.composite_score);
    }
  });

  const bestRaceByAthlete = new Map<string, any>();
  races.forEach((r) => {
    if (r.event !== targetEvent) return;
    const existing = bestRaceByAthlete.get(r.athlete_id);
    if (!existing || Number(r.time_seconds) < Number(existing.time_seconds)) {
      bestRaceByAthlete.set(r.athlete_id, r);
    }
  });

  const candidates: RelayCandidate[] = [];

  athletes.forEach((ath) => {
    if (ath.is_archived) return;

    const g = (ath.gender || '').trim().toLowerCase();
    const isGirl = g.startsWith('g') || g.startsWith('f');
    const athDiv = isGirl ? 'Girl' : 'Boy';
    if (athDiv !== division) return;

    const band = resolveApeAgeBand(ath.age, ath.grade);
    if (ageBandFilter !== 'All' && band !== ageBandFilter) return;

    const isInjured = injuredIds.has(ath.id);
    if (excludeInjured && isInjured) return;

    const bestRace = bestRaceByAthlete.get(ath.id);
    if (!bestRace) return;

    candidates.push({
      athlete: ath,
      ageBand: band,
      pbSeconds: Number(bestRace.time_seconds),
      pbDate: bestRace.race_date,
      isInjured,
      readinessScore: latestWellness.get(ath.id),
    });
  });

  return candidates.sort((a, b) => a.pbSeconds - b.pbSeconds);
}

export function autoAssignBestOrder(topFour: RelayCandidate[]): (RelayCandidate | null)[] {
  // Rank 0 = fastest PB, Rank 1 = 2nd fastest, Rank 2 = 3rd fastest, Rank 3 = 4th fastest
  // Standard sprint relay heuristic:
  // Leg 1: 3rd fastest (quick starter), Leg 2: 2nd fastest (longest fly), Leg 3: 4th fastest (curve), Leg 4: Fastest (anchor)
  if (topFour.length === 0) return [null, null, null, null];
  if (topFour.length === 1) return [topFour.at(0)!, null, null, null];
  if (topFour.length === 2) return [topFour.at(1)!, null, null, topFour.at(0)!];
  if (topFour.length === 3) return [topFour.at(2)!, topFour.at(1)!, null, topFour.at(0)!];
  return [topFour.at(2)!, topFour.at(1)!, topFour.at(3)!, topFour.at(0)!];
}

export function computeRelayProjection(
  legs: (RelayCandidate | null)[],
  format: RelayFormat,
  efficiency: ExchangeEfficiency
): {
  assignedLegs: AssignedRelayLeg[];
  rawSum: number;
  exchangeSavings: number;
  predictedTotal: number;
  isComplete: boolean;
} {
  const totalSavings = EXCHANGE_SAVINGS[format][efficiency];
  const perExchangeSaving = +(totalSavings / 3).toFixed(2);
  const isComplete = legs.every((l) => l !== null);

  let rawSum = 0;
  const assignedLegs: AssignedRelayLeg[] = legs.map((cand, idx) => {
    const legNum = (idx + 1) as 1 | 2 | 3 | 4;
    const meta = LEG_META[format][idx];

    if (!cand) {
      return {
        legNumber: legNum,
        roleTitle: meta.title,
        roleTip: meta.tip,
        candidate: null,
        predictedSplit: 0,
        checkMarkMetres: null,
        checkMarkSteps: null,
      };
    }

    rawSum += cand.pbSeconds;

    // Leg 1 starts from blocks (no incoming exchange saving); Legs 2-4 get flying-start exchange savings
    const legSaving = legNum === 1 ? 0 : perExchangeSaving;
    const predictedSplit = +(cand.pbSeconds - legSaving).toFixed(2);

    // Check-mark distance for incoming exchange (Legs 2, 3, 4 in 4x100m)
    let checkMarkMetres: number | null = null;
    let checkMarkSteps: number | null = null;
    const incomingCand = idx > 0 ? legs[idx - 1] : null;

    if (format === '4x100m' && legNum > 1 && incomingCand) {
      // Incoming velocity in m/s (100m / PB) scaled to check-mark zone (~7.5m to 9.5m before acceleration zone)
      const incomingSpeed = 100 / incomingCand.pbSeconds;
      const baseDist = +(incomingSpeed * 0.88).toFixed(1);
      checkMarkMetres = Math.min(10.5, Math.max(6.5, baseDist));
      checkMarkSteps = Math.round(checkMarkMetres / 0.30); // ~30cm heel-to-toe shoe steps
    }

    return {
      legNumber: legNum,
      roleTitle: meta.title,
      roleTip: meta.tip,
      candidate: cand,
      predictedSplit,
      checkMarkMetres,
      checkMarkSteps,
    };
  });

  const predictedTotal = isComplete ? +(rawSum - totalSavings).toFixed(2) : 0;

  return {
    assignedLegs,
    rawSum: +rawSum.toFixed(2),
    exchangeSavings: totalSavings,
    predictedTotal,
    isComplete,
  };
}
