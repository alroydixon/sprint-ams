import { isFieldDiscipline } from './disciplines';
import { ApeAgeBand, ApeGender, BOY_APE_BENCHMARKS } from './apeBoyBenchmarks';
import { GIRL_APE_BENCHMARKS } from './apeGirlBenchmarks';
import { calculateWorldAthleticsSeniorPoints } from './worldAthleticsSeniorScoring';

export type { ApeAgeBand, ApeGender };

const FIELD_EVENTS = new Set([
  'Long Jump',
  'Triple Jump',
  'High Jump',
  'Pole Vault',
  'Shot Put',
  'Discus',
  'Javelin',
  'Hammer Throw',
]);

export function isSchoolGrade(grade?: string | null): boolean {
  const g = (grade || '').trim().toLowerCase();
  return g.includes('grade') || ['8', '9', '10', '11', '12'].includes(g);
}

export function isSeniorAthlete(age?: number | null, grade?: string | null): boolean {
  if (isSchoolGrade(grade)) return false;
  if ((grade || '').trim().toLowerCase() === 'senior') return true;
  return typeof age === 'number' && age >= 20;
}

export function resolveApeAgeBand(age?: number | null, grade?: string | null): ApeAgeBand {
  if (age && age > 0) {
    if (age <= 15) return 'U15';
    if (age === 16) return 'U16';
    if (age === 17) return 'U17';
    if (age === 18) return 'U18';
    return 'U20'; // U19 school category
  }

  const g = (grade || '').toLowerCase();
  if (g.includes('8') || g.includes('9')) return 'U15';
  if (g.includes('10')) return 'U16';
  if (g.includes('11')) return 'U17';
  return 'U18';
}

export function calculateApePoints(
  gender: string | null | undefined,
  age: number | null | undefined,
  grade: string | null | undefined,
  event: string,
  markValue: number
): { points: number; ageBand: ApeAgeBand; standardBadge: string; isField: boolean } | null {
  if (!markValue || markValue <= 0) return null;

  // Strictly ONLY Senior (20+ and not a school Grade 8-12 learner) uses World Athletics Senior tables
  if (isSeniorAthlete(age, grade)) {
    const waPts = calculateWorldAthleticsSeniorPoints(gender, event, markValue);
    if (waPts !== null) {
      return {
        points: waPts,
        ageBand: 'U20',
        standardBadge:
          waPts >= 1150
            ? 'WA International'
            : waPts >= 1000
            ? 'WA National'
            : waPts >= 850
            ? 'Provincial'
            : 'WA Senior',
        isField: FIELD_EVENTS.has(event),
      };
    }
  }

  // All school athletes (Grade 8-12 / U15-U19) strictly use the ASA / SASA APE tables
  const gen: ApeGender =
    (gender || '').toLowerCase().startsWith('g') || (gender || '').toLowerCase().startsWith('f')
      ? 'Girl'
      : 'Boy';
  const ageBand = resolveApeAgeBand(age, grade);
  const table = gen === 'Girl' ? GIRL_APE_BENCHMARKS : BOY_APE_BENCHMARKS;
  const bench = table[ageBand]?.[event];
  if (!bench) return null;

  // ASA/SASA APE 1000-pt reference marks are roughly 3.5% sharper than U20 championship qualifiers
  const calibratedRef = bench.isField ? bench.refMark * 1.035 : bench.refMark * 0.968;
  const rawPoints = bench.isField
    ? 1000 + (markValue - calibratedRef) * bench.slope
    : 1000 + (calibratedRef - markValue) * bench.slope;

  const points = Math.max(0, Math.min(1200, Math.round(rawPoints)));

  let standardBadge = 'Development';
  if (points >= 900) standardBadge = 'International';
  else if (points >= 800) standardBadge = 'National';
  else if (points >= 650) standardBadge = 'Provincial';

  return { points, ageBand, standardBadge, isField: Boolean(bench.isField) };
}

export function evaluateSquadApeLeaderboard(
  athletes: any[],
  races: any[],
  discipline?: string | null
) {
  const field = isFieldDiscipline(discipline);

  return athletes
    .map((athlete) => {
      const athRaces = races.filter((r) => r.athlete_id === athlete.id);
      const bestByEvent = new Map<
        string,
        { event: string; mark: number; date: string; meet: string; points: number; ageBand: ApeAgeBand; standardBadge: string; isField: boolean }
      >();

      athRaces.forEach((r) => {
        const mark = Number(r.time_seconds);
        const scored = calculateApePoints(athlete.gender, athlete.age, athlete.grade, r.event, mark);
        if (!scored) return;

        const existing = bestByEvent.get(r.event);
        const isBetter = !existing || (field ? mark > existing.mark : mark < existing.mark);
        if (isBetter) {
          bestByEvent.set(r.event, {
            event: r.event,
            mark,
            date: r.race_date,
            meet: r.meet_name || '',
            points: scored.points,
            ageBand: scored.ageBand,
            standardBadge: scored.standardBadge,
            isField: scored.isField,
          });
        }
      });

      const rankedEvents = Array.from(bestByEvent.values()).sort((a, b) => b.points - a.points);
      const topTwo = rankedEvents.slice(0, 2);
      const totalPoints = topTwo.reduce((sum, ev) => sum + ev.points, 0);
      const senior = isSeniorAthlete(athlete.age, athlete.grade);
      const rawBand = topTwo.at(0)?.ageBand || resolveApeAgeBand(athlete.age, athlete.grade);
      const ageBand = senior ? ('Senior' as any) : rawBand === 'U20' ? ('U19' as any) : rawBand;

      return {
        athlete,
        ageBand,
        topTwo,
        totalPoints,
      };
    })
    .filter((entry) => entry.topTwo.length > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);
}
