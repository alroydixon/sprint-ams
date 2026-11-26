'use client';

import { useState, useMemo, useEffect } from 'react';
import { calculateHorizontalForce } from '@/lib/biomechanics';
import { formatMark, isFieldDiscipline } from '@/lib/disciplines';
import RaceForceMetricsCard from './RaceForceMetricsCard';
import TargetTimePredictorCard from './TargetTimePredictorCard';
import { Gauge, Scale } from 'lucide-react';

function parseEventDistanceM(eventName: string): number {
  const low = eventName.trim().toLowerCase();
  if (low.includes('mile')) return 1609.34;
  const num = parseFloat(low.replace(/[^0-9.]/g, ''));
  return num > 0 ? num : 0;
}

export default function CoachForcePredictorTab({
  athletes,
  races,
  tests,
  discipline = 'sprints',
}: {
  athletes: any[];
  races: any[];
  tests: any[];
  discipline?: string | null;
}) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athletes.at(0)?.id || '');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');
  const [customWeight, setCustomWeight] = useState<string>('');

  const athlete = useMemo(
    () => athletes.find((a) => a.id === selectedAthleteId) || athletes.at(0) || null,
    [athletes, selectedAthleteId]
  );

  const trackRaces = useMemo(() => {
    if (!athlete) return [];
    return races
      .filter(
        (r) =>
          r.athlete_id === athlete.id &&
          Number(r.time_seconds) > 0 &&
          parseEventDistanceM(r.event || '') > 0
      )
      .sort((a, b) => (b.race_date || '').localeCompare(a.race_date || ''));
  }, [races, athlete]);

  const availableEvents = useMemo(
    () => Array.from(new Set(trackRaces.map((r) => r.event))),
    [trackRaces]
  );

  useEffect(() => {
    if (availableEvents.length > 0 && !availableEvents.includes(selectedEvent)) {
      setSelectedEvent(availableEvents.at(0)!);
    } else if (availableEvents.length === 0) {
      setSelectedEvent('');
    }
  }, [availableEvents, selectedEvent]);

  const eventRaces = useMemo(
    () => trackRaces.filter((r) => r.event === selectedEvent),
    [trackRaces, selectedEvent]
  );

  useEffect(() => {
    if (eventRaces.length > 0 && !eventRaces.some((r) => r.id === selectedRaceId)) {
      setSelectedRaceId(eventRaces.at(0)!.id);
    } else if (eventRaces.length === 0) {
      setSelectedRaceId('');
    }
  }, [eventRaces, selectedRaceId]);

  const selectedRace = useMemo(
    () => eventRaces.find((r) => r.id === selectedRaceId) || eventRaces.at(0) || null,
    [eventRaces, selectedRaceId]
  );

  const matchedWeightInfo = useMemo(() => {
    if (!athlete || !selectedRace) return { weightKg: 60, source: 'Default (60 kg)' };
    const raceDate = selectedRace.race_date || '';
    const athTests = tests
      .filter((t) => t.athlete_id === athlete.id && Number(t.body_weight_kg) > 0)
      .sort((a, b) => (a.test_date || '').localeCompare(b.test_date || ''));

    const onOrBefore = athTests.filter((t) => (t.test_date || '') <= raceDate).at(-1);
    if (onOrBefore) {
      return { weightKg: Number(onOrBefore.body_weight_kg), source: `Test on ${onOrBefore.test_date}` };
    }
    const earliestAfter = athTests.at(0);
    if (earliestAfter) {
      return { weightKg: Number(earliestAfter.body_weight_kg), source: `Closest test (${earliestAfter.test_date})` };
    }
    if (Number(athlete.body_weight_kg) > 0) {
      return { weightKg: Number(athlete.body_weight_kg), source: 'Athlete Profile Weight' };
    }
    return { weightKg: 60, source: 'Default Estimate (60 kg)' };
  }, [athlete, selectedRace, tests]);

  useEffect(() => {
    setCustomWeight(String(matchedWeightInfo.weightKg));
  }, [matchedWeightInfo]);

  const effectiveWeightKg = parseFloat(customWeight) > 0 ? parseFloat(customWeight) : matchedWeightInfo.weightKg;
  const distanceM = selectedRace ? parseEventDistanceM(selectedRace.event) : 0;
  const actualTimeS = selectedRace ? Number(selectedRace.time_seconds) : 0;

  const actualMetrics = useMemo(() => {
    if (!distanceM || !actualTimeS || actualTimeS <= 0) return null;
    const velocityMs = +(distanceM / actualTimeS).toFixed(2);
    const velocityKmh = +(velocityMs * 3.6).toFixed(1);
    const force = calculateHorizontalForce(effectiveWeightKg, distanceM, actualTimeS);
    const powerW = force ? +(force.forceN * velocityMs).toFixed(1) : 0;
    return { velocityMs, velocityKmh, force, powerW };
  }, [distanceM, actualTimeS, effectiveWeightKg]);

  if (isFieldDiscipline(discipline)) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
        Velocity &amp; Horizontal Force Race Predictor applies to track running &amp; hurdle events.
      </div>
    );
  }

  return (
    <div className="space-y-5 text-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div>
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Gauge className="w-4 h-4" /> Race Velocity &amp; Horizontal Force Analyzer
          </h3>
          <p className="text-slate-400 mt-0.5">
            Select an athlete, event, and logged performance to inspect m/s velocity and horizontal force using body weight recorded at that date.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">1. Select Athlete</label>
            <select
              value={athlete?.id || ''}
              onChange={(e) => setSelectedAthleteId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
            >
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">2. Select Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              disabled={availableEvents.length === 0}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
            >
              {availableEvents.length === 0 ? (
                <option value="">No track races logged</option>
              ) : (
                availableEvents.map((ev) => <option key={ev} value={ev}>{ev}</option>)
              )}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">3. Select Race Result</label>
            <select
              value={selectedRace?.id || ''}
              onChange={(e) => setSelectedRaceId(e.target.value)}
              disabled={eventRaces.length === 0}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
            >
              {eventRaces.length === 0 ? (
                <option value="">No results</option>
              ) : (
                eventRaces.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.race_date} • {formatMark(Number(r.time_seconds), discipline)} ({r.meet_name || 'Meet'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
              <Scale className="w-3 h-3 text-sky-400" /> Body Mass at Race (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={customWeight}
              onChange={(e) => setCustomWeight(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sky-300 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">{matchedWeightInfo.source}</span>
          </div>
        </div>

        <RaceForceMetricsCard
          selectedRace={selectedRace}
          actualTimeS={actualTimeS}
          actualMetrics={actualMetrics}
          effectiveWeightKg={effectiveWeightKg}
          discipline={discipline}
        />
      </div>

      {selectedRace && actualMetrics?.force && (
        <TargetTimePredictorCard
          eventName={selectedEvent}
          distanceM={distanceM}
          actualTimeS={actualTimeS}
          actualVelocityMs={actualMetrics.velocityMs}
          actualForceN={actualMetrics.force.forceN}
          actualPowerW={actualMetrics.powerW}
          effectiveWeightKg={effectiveWeightKg}
          discipline={discipline}
        />
      )}
    </div>
  );
}
