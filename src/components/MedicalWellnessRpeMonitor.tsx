'use client';

import { useState, useMemo } from 'react';
import { getReadinessStatus } from '@/lib/biomechanics';
import WellnessDetailModal from './WellnessDetailModal';
import { Activity, Filter } from 'lucide-react';

function getCutoffIso(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

export default function MedicalWellnessRpeMonitor({
  athletes,
  wellness,
  sessions = [],
}: {
  athletes: any[];
  wellness: any[];
  sessions?: any[];
}) {
  const [windowDays, setWindowDays] = useState<7 | 14>(7);
  const [selectedAthleteFilter, setSelectedAthleteFilter] = useState<string>('ALL');
  const [modalAthlete, setModalAthlete] = useState<any | null>(null);

  const cutoffIso = useMemo(() => getCutoffIso(windowDays), [windowDays]);

  const rows = useMemo(() => {
    const filteredList =
      selectedAthleteFilter === 'ALL'
        ? athletes
        : athletes.filter((a) => a.id === selectedAthleteFilter);

    return filteredList
      .map((ath) => {
        const recentWellness = wellness
          .filter((w) => w.athlete_id === ath.id && (w.log_date || '') >= cutoffIso)
          .sort((a, b) => (b.log_date || '').localeCompare(a.log_date || ''));

        const latestW = recentWellness.at(0) || null;
        const avgWellness =
          recentWellness.length > 0
            ? Math.round(
                (recentWellness.reduce((sum, w) => sum + (Number(w.composite_score) || 0), 0) /
                  recentWellness.length) *
                  10
              ) / 10
            : null;

        const recentSessions = sessions
          .filter(
            (s) =>
              s.athlete_id === ath.id &&
              (s.session_date || '') >= cutoffIso &&
              Number(s.session_rpe) > 0
          )
          .sort((a, b) => (b.session_date || '').localeCompare(a.session_date || ''));

        const latestRpe = recentSessions.at(0)?.session_rpe ?? latestW?.session_rpe ?? null;
        const avgRpe =
          recentSessions.length > 0
            ? Math.round(
                (recentSessions.reduce((sum, s) => sum + (Number(s.session_rpe) || 0), 0) /
                  recentSessions.length) *
                  10
              ) / 10
            : latestW?.session_rpe ?? null;

        const totalLoadAu = recentSessions.reduce(
          (sum, s) => sum + (Number(s.session_rpe) || 0) * (Number(s.session_duration_mins) || 0),
          0
        );

        const painNotes = Array.from(
          new Set(
            recentWellness
              .map((w) => (w.pain_location || '').trim())
              .filter(Boolean)
          )
        );

        return {
          athlete: ath,
          checkInCount: recentWellness.length,
          latestW,
          avgWellness,
          latestRpe,
          avgRpe,
          totalLoadAu,
          painSummary: painNotes.join(' • '),
        };
      })
      .sort((a, b) => {
        const aHasPain = a.painSummary ? 0 : 1;
        const bHasPain = b.painSummary ? 0 : 1;
        if (aHasPain !== bHasPain) return aHasPain - bHasPain;
        const aScore = a.latestW ? Number(a.latestW.composite_score) : 999;
        const bScore = b.latestW ? Number(b.latestW.composite_score) : 999;
        return aScore - bScore;
      });
  }, [athletes, wellness, sessions, cutoffIso, selectedAthleteFilter]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-sky-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Athlete Wellness &amp; Session RPE Monitor ({windowDays}-Day Window)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click any athlete row to inspect full 5-metric readiness &amp; sore body areas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedAthleteFilter}
            onChange={(e) => setSelectedAthleteFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
          >
            <option value="ALL">All Squad Athletes ({athletes.length})</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>

          <div className="flex bg-slate-800 p-0.5 rounded-lg">
            {([7, 14] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setWindowDays(d)}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  windowDays === d
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Last {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
            <tr>
              <th className="py-2.5 px-3">Athlete</th>
              <th>Latest Readiness</th>
              <th>{windowDays}d Avg Wellness</th>
              <th>Latest / Avg RPE</th>
              <th>{windowDays}d Load (AU)</th>
              <th>Reported Pain / Sore Zones ({windowDays}d)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row) => {
              const st = row.latestW ? getReadinessStatus(row.latestW.composite_score) : null;
              return (
                <tr
                  key={row.athlete.id}
                  onClick={() => setModalAthlete(row.athlete)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-2.5 px-3">
                    <strong className="text-white block">{row.athlete.full_name}</strong>
                    <span className="text-[10px] text-slate-400">
                      {row.athlete.grade || '—'} • {row.checkInCount} check-in{row.checkInCount === 1 ? '' : 's'}
                    </span>
                  </td>

                  <td>
                    {st && row.latestW ? (
                      <div>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${st.color}`}>
                          {st.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          {row.latestW.log_date}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">No log in {windowDays}d</span>
                    )}
                  </td>

                  <td className="font-mono font-bold text-emerald-400">
                    {row.avgWellness !== null ? `${row.avgWellness}/50` : '—'}
                  </td>

                  <td className="font-mono">
                    {row.latestRpe !== null ? (
                      <span className="text-amber-300 font-bold">
                        {row.latestRpe}/10
                        {row.avgRpe !== null && row.avgRpe !== row.latestRpe && (
                          <span className="text-slate-400 font-normal"> (avg {row.avgRpe})</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  <td className="font-mono text-slate-200">
                    {row.totalLoadAu > 0 ? `${row.totalLoadAu.toLocaleString()} AU` : '—'}
                  </td>

                  <td className="max-w-xs">
                    {row.painSummary ? (
                      <span className="text-rose-300 font-semibold">{row.painSummary}</span>
                    ) : (
                      <span className="text-slate-500">None reported</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalAthlete && (
        <WellnessDetailModal
          athlete={modalAthlete}
          logs={wellness.filter((w) => w.athlete_id === modalAthlete.id)}
          onClose={() => setModalAthlete(null)}
        />
      )}
    </div>
  );
}
