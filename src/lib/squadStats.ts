import { calculatePower } from './biomechanics';

export function buildSquadRows(
  athletes: any[],
  races: any[],
  sessions: any[],
  tests: any[],
  wellness: any[]
) {
  return athletes.map((a) => {
    const aRaces = races.filter((r) => r.athlete_id === a.id);
    const best100 = aRaces.filter((r) => r.event === '100m').map((r) => Number(r.time_seconds));
    const best200 = aRaces.filter((r) => r.event === '200m').map((r) => Number(r.time_seconds));

    const aSessions = sessions.filter((s) => s.athlete_id === a.id);
    const totalMetres = aSessions.reduce(
      (sum, s) => sum + (s.training_runs || []).reduce((acc: number, run: any) => acc + Number(run.distance_m), 0),
      0
    );

    const aTests = tests.filter((t) => t.athlete_id === a.id);
    const latestTest = aTests.at(-1);
    const power = latestTest
      ? calculatePower(
          Number(latestTest.body_weight_kg),
          latestTest.pushups_1min_reps || 0,
          latestTest.situps_1min_reps || 0,
          latestTest.squat_jumps_1min_reps || 0
        )
      : null;

    const aWell = wellness.filter((w) => w.athlete_id === a.id);
    const latestWell = aWell.at(0);

    return {
      ...a,
      pb100: best100.length ? Math.min(...best100).toFixed(2) + 's' : '—',
      pb200: best200.length ? Math.min(...best200).toFixed(2) + 's' : '—',
      totalMetres,
      power,
      readiness: latestWell ? latestWell.composite_score : null,
    };
  });
}

export function buildDailySquadVolume(sessions: any[], activeAthletes: any[]) {
  const activeIds = new Set(activeAthletes.map((a) => a.id));
  const map: Record<string, number> = {};
  sessions
    .filter((s) => activeIds.has(s.athlete_id))
    .forEach((s) => {
      const vol = (s.training_runs || []).reduce((acc: number, r: any) => acc + Number(r.distance_m), 0);
      map[s.session_date] = (map[s.session_date] || 0) + vol;
    });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, metres]) => ({ date, metres }));
}
