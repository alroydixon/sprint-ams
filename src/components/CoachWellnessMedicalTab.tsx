'use client';

import { useState } from 'react';
import { getReadinessStatus } from '@/lib/biomechanics';
import BodyHeatMap from './BodyHeatMap';
import WellnessDetailModal from './WellnessDetailModal';
import { HeartPulse, ShieldAlert } from 'lucide-react';

export default function CoachWellnessMedicalTab({
  athletes,
  wellness,
  injuries = [],
}: {
  athletes: any[];
  wellness: any[];
  injuries?: any[];
}) {
  const [selectedWellnessAthlete, setSelectedWellnessAthlete] = useState<any | null>(null);

  const activeInjuries = injuries.filter((inj) => inj.status !== 'Cleared');

  return (
    <div className="space-y-6 text-xs">
      {/* Squad Readiness Heat Map (Clickable Athlete Cards) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-emerald-400">
            Squad Readiness Heat Map (Latest Check-In)
          </h3>
          <span className="text-[11px] text-slate-400">
            Click any athlete card to view full 5-metric breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {athletes.map((a) => {
            const athLogs = wellness
              .filter((w) => w.athlete_id === a.id)
              .sort((x, y) => (y.log_date || '').localeCompare(x.log_date || ''));
            const latest = athLogs.at(0);
            const status = latest ? getReadinessStatus(latest.composite_score) : null;

            return (
              <div
                key={a.id}
                onClick={() => setSelectedWellnessAthlete(a)}
                className="bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-3 space-y-1.5 cursor-pointer transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <strong className="text-sm text-white hover:text-emerald-300 transition">
                    {a.full_name}
                  </strong>
                  {status ? (
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-semibold shrink-0">
                      No Check-In
                    </span>
                  )}
                </div>

                {latest ? (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Date: {latest.log_date} • RPE: {latest.session_rpe ? `${latest.session_rpe}/10` : '/10'} • Pain:{' '}
                    <span className={latest.pain_location ? 'text-rose-300 font-semibold' : 'text-slate-300'}>
                      {latest.pain_location || 'None'}
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">No wellness check-ins logged yet.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Squad Anatomical Injury & Soreness Heat Map */}
      <BodyHeatMap wellness={wellness} athletes={athletes} />

      {/* Active Medical & Rehab Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4" /> Active Medical &amp; Rehab Cases ({activeInjuries.length})
        </h3>

        {activeInjuries.length === 0 ? (
          <p className="text-slate-400 py-2 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400" /> All squad athletes are medically cleared for full training.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeInjuries.map((inj) => {
              const ath = athletes.find((a) => a.id === inj.athlete_id);
              return (
                <div
                  key={inj.id}
                  className="bg-slate-950 border border-rose-500/40 rounded-xl p-3 space-y-1"
                >
                  <div className="flex justify-between items-center gap-2">
                    <strong className="text-white text-sm">{ath?.full_name || 'Athlete'}</strong>
                    <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 text-[10px] font-bold">
                      {inj.status || 'Rehab'}
                    </span>
                  </div>
                  <p className="text-slate-300 font-semibold">{inj.injury_area || inj.diagnosis}</p>
                  {inj.restrictions && (
                    <p className="text-[11px] text-amber-300">Restrictions: {inj.restrictions}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedWellnessAthlete && (
        <WellnessDetailModal
          athlete={selectedWellnessAthlete}
          logs={wellness.filter((w) => w.athlete_id === selectedWellnessAthlete.id)}
          onClose={() => setSelectedWellnessAthlete(null)}
        />
      )}
    </div>
  );
}
