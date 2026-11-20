'use client';

import { useState } from 'react';
import { calculatePower, calculateHorizontalForce, getReadinessStatus } from '@/lib/biomechanics';
import AthleteEventChartCard from './AthleteEventChartCard';
import ProfileSettingsModal from './ProfileSettingsModal';
import { X, Printer, UserCog } from 'lucide-react';

export default function CoachAthleteModal({
  athlete: initialAthlete,
  races,
  tests,
  sessions,
  wellness = [],
  onAthleteUpdated,
  onClose,
}: {
  athlete: any;
  races: any[];
  tests: any[];
  sessions: any[];
  wellness?: any[];
  onAthleteUpdated?: (updated: any) => void;
  onClose: () => void;
}) {
  const [athlete, setAthlete] = useState(initialAthlete);
  const [editingProfile, setEditingProfile] = useState(false);

  const latestTest = tests.at(-1);
  const power = latestTest
    ? calculatePower(
        Number(latestTest.body_weight_kg),
        latestTest.pushups_1min_reps || 0,
        latestTest.situps_1min_reps || 0,
        latestTest.squat_jumps_1min_reps || 0
      )
    : null;

  const totalVolume = sessions.reduce(
    (sum, s) => sum + (s.training_runs || []).reduce((acc: number, r: any) => acc + Number(r.distance_m), 0),
    0
  );

  const latestWellness = wellness.at(0);
  const readiness = getReadinessStatus(latestWellness?.composite_score);

  const wellnessByDate = new Map<string, any>();
  wellness.forEach((w) => wellnessByDate.set(w.log_date, w));

  const byEvent: Record<string, any[]> = {};
  races.forEach((r) => {
    if (!byEvent[r.event]) byEvent[r.event] = [];
    byEvent[r.event].push(r);
  });

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
        <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-6 my-4 shadow-2xl">
          <div className="sticky top-0 z-10 bg-slate-900 pt-1 flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center font-bold text-emerald-400">
                {athlete.avatar_url ? (
                  <img src={athlete.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (athlete.full_name || 'AT').slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white">{athlete.full_name} — Performance Feedback Card</h2>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border font-semibold ${readiness.color}`}>
                    <span className={`w-2 h-2 rounded-full ${readiness.dot}`} />
                    {readiness.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {athlete.grade || 'Grade N/A'} • {athlete.age ? `${athlete.age} yrs` : ''} • {athlete.gender || ''}
                  {athlete.phone ? ` • ${athlete.phone}` : ''} • Period Volume: <strong className="text-amber-400">{totalVolume}m</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold px-3 py-1.5 rounded-lg text-xs">
                <UserCog className="w-3.5 h-3.5" /> Edit Profile &amp; Photo
              </button>
              <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs">
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {latestWellness && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div><span className="text-slate-400 block">Sleep</span><strong>{latestWellness.sleep_quality}/10</strong></div>
              <div><span className="text-slate-400 block">Fatigue</span><strong>{latestWellness.fatigue_level}/10</strong></div>
              <div><span className="text-slate-400 block">Soreness</span><strong>{latestWellness.muscle_soreness}/10</strong></div>
              <div><span className="text-slate-400 block">Stress</span><strong>{latestWellness.stress_level}/10</strong></div>
              <div><span className="text-slate-400 block">Mood</span><strong>{latestWellness.mood}/10</strong></div>
              <div><span className="text-slate-400 block">sRPE Load</span><strong className="text-amber-400">{latestWellness.srpe_load} AU</strong></div>
            </div>
          )}

          {latestTest && power && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-400">Latest Biomechanics &amp; Force ({latestTest.test_date} • {latestTest.body_weight_kg} kg)</span>
                <span className="font-bold text-white">{power.totalW} W ({power.totalWPerKg} W/kg)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-950 p-3 rounded-xl">
                <div><span className="text-slate-400 block">Push-Ups ({latestTest.pushups_1min_reps || 0} reps)</span><strong className="text-emerald-400">{power.pushupW} W</strong></div>
                <div><span className="text-slate-400 block">Sit-Ups ({latestTest.situps_1min_reps || 0} reps)</span><strong className="text-emerald-400">{power.situpW} W</strong></div>
                <div><span className="text-slate-400 block">Squat Jumps ({latestTest.squat_jumps_1min_reps || 0} reps)</span><strong className="text-emerald-400">{power.squatJumpW} W</strong></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { dist: 20, time: Number(latestTest.sprint_20m_s) },
                  { dist: 40, time: Number(latestTest.sprint_40m_s) },
                  { dist: 60, time: Number(latestTest.sprint_60m_s) },
                ].map(({ dist, time }) => {
                  if (!time) return null;
                  const f = calculateHorizontalForce(Number(latestTest.body_weight_kg), dist, time);
                  return (
                    <div key={dist} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex justify-between font-bold text-emerald-400"><span>{dist}m Test</span><span>{time.toFixed(2)}s</span></div>
                      {f && <div className="text-slate-300 mt-0.5">Force: <strong>{f.forceN} N</strong> ({f.forcePerKg} N/kg)</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(byEvent).map(([ev, evRaces]) => (
              <AthleteEventChartCard key={ev} event={ev} evRaces={evRaces} wellnessByDate={wellnessByDate} />
            ))}
            {Object.keys(byEvent).length === 0 && (
              <p className="text-xs text-slate-500 col-span-2 text-center py-4">No race records in the selected date range.</p>
            )}
          </div>
        </div>
      </div>

      {editingProfile && (
        <ProfileSettingsModal
          profile={athlete}
          isCoachEditingAthlete={true}
          onUpdated={(updated) => {
            setAthlete({ ...athlete, ...updated });
            if (onAthleteUpdated) onAthleteUpdated(updated);
          }}
          onClose={() => setEditingProfile(false)}
        />
      )}
    </>
  );
}
