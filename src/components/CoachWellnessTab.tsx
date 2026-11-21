'use client';

import { useState, useMemo } from 'react';
import { getReadinessStatus } from '@/lib/biomechanics';
import { CheckCircle2, Clock } from 'lucide-react';

function getLocalTodayIso(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export default function CoachWellnessTab({ athletes, wellness }: { athletes: any[]; wellness: any[] }) {
  const [selectedId, setSelectedId] = useState(athletes.at(0)?.id || '');
  const [showMissing, setShowMissing] = useState(false);

  const todayStr = getLocalTodayIso();

  const todayStats = useMemo(() => {
    const completedIds = new Set(
      wellness.filter((w) => w.log_date === todayStr).map((w) => w.athlete_id)
    );
    const completedAthletes = athletes.filter((a) => completedIds.has(a.id));
    const missingAthletes = athletes.filter((a) => !completedIds.has(a.id));
    const pct = athletes.length > 0 ? Math.round((completedAthletes.length / athletes.length) * 100) : 0;

    return {
      completedCount: completedAthletes.length,
      totalCount: athletes.length,
      missingAthletes,
      pct,
    };
  }, [athletes, wellness, todayStr]);

  const athleteLogs = wellness
    .filter((w) => w.athlete_id === selectedId)
    .slice(0, 14)
    .reverse();

  return (
    <div className="space-y-6">
      {/* Today's Daily Wellness Completion Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Today&apos;s Wellness Check-Ins ({todayStr})
              </h3>
              <p className="text-slate-400">
                <strong className="text-emerald-400 text-sm">{todayStats.completedCount}</strong> of{' '}
                <strong className="text-white">{todayStats.totalCount}</strong> active athletes completed today ({todayStats.pct}%)
              </p>
            </div>
          </div>

          {todayStats.missingAthletes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMissing(!showMissing)}
              className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold px-3 py-1.5 rounded-lg"
            >
              <Clock className="w-3.5 h-3.5" />
              {showMissing
                ? 'Hide Missing List'
                : `${todayStats.missingAthletes.length} Pending Today`}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${todayStats.pct}%` }}
          />
        </div>

        {showMissing && todayStats.missingAthletes.length > 0 && (
          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
            {todayStats.missingAthletes.map((a) => (
              <span
                key={a.id}
                className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
              >
                {a.full_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Squad Readiness Heat Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="font-bold text-sm text-emerald-400 mb-3">Squad Readiness Heat Map (Latest Check-In)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {athletes.map((a) => {
            const latest = wellness.find((w) => w.athlete_id === a.id);
            const st = getReadinessStatus(latest?.composite_score);
            return (
              <div
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`cursor-pointer p-3 rounded-xl border transition ${
                  selectedId === a.id ? 'border-emerald-500 bg-slate-800/80' : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="flex justify-between items-center">
                  <strong className="text-white text-sm">{a.full_name}</strong>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${st.color}`}>
                    {st.label}
                  </span>
                </div>
                {latest ? (
                  <p className="text-slate-400 mt-1.5">
                    Date: {latest.log_date} • RPE: {latest.session_rpe}/10 • Pain: {latest.pain_location || 'None'}
                  </p>
                ) : (
                  <p className="text-slate-500 mt-1.5">No wellness check-ins logged yet.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 14-Day Wellness Trend Graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h4 className="font-bold text-sm text-emerald-400">14-Day Wellness &amp; Fatigue Trend</h4>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
        </div>

        {athleteLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No wellness history for this athlete yet.</p>
        ) : (
          <svg viewBox="0 0 600 160" className="w-full h-44 bg-slate-950 rounded-lg p-2">
            {athleteLogs.length > 1 && (
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                points={athleteLogs
                  .map((l, i) => {
                    const x = 35 + (i / (athleteLogs.length - 1)) * 530;
                    const y = 135 - (l.composite_score / 50) * 110;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}
            {athleteLogs.map((l, i) => {
              const x = athleteLogs.length === 1 ? 300 : 35 + (i / (athleteLogs.length - 1)) * 530;
              const y = 135 - (l.composite_score / 50) * 110;
              return (
                <g key={l.id}>
                  <circle cx={x} cy={y} r="4" fill="#34d399" />
                  <text x={x} y={y - 8} fontSize="8.5" fill="#f8fafc" textAnchor="middle">{l.composite_score}</text>
                  <text x={x} y={150} fontSize="8" fill="#94a3b8" textAnchor="middle">{l.log_date.slice(5)}</text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
