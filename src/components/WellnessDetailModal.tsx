'use client';

import { getReadinessStatus } from '@/lib/biomechanics';
import { X, Activity, Calendar, AlertTriangle } from 'lucide-react';

export default function WellnessDetailModal({
  athlete,
  logs,
  onClose,
}: {
  athlete: any;
  logs: any[];
  onClose: () => void;
}) {
  const sortedLogs = [...(logs || [])].sort((a, b) =>
    (b.log_date || '').localeCompare(a.log_date || '')
  );
  const latest = sortedLogs.at(0);
  const status = latest ? getReadinessStatus(latest.composite_score) : null;

  const metrics = latest
    ? [
        { label: 'Sleep Quality', val: Number(latest.sleep_quality) || 0, hint: '1 = Poor • 10 = Great' },
        { label: 'Energy / Freshness', val: Number(latest.fatigue_level) || 0, hint: '1 = Exhausted • 10 = Fresh' },
        { label: 'Muscle Readiness', val: Number(latest.muscle_soreness) || 0, hint: '1 = Very Sore • 10 = Pain-Free' },
        { label: 'Stress Control', val: Number(latest.stress_level) || 0, hint: '1 = High Stress • 10 = Relaxed' },
        { label: 'Mood & Motivation', val: Number(latest.mood) || 0, hint: '1 = Low • 10 = High' },
      ]
    : [];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 text-xs shadow-2xl my-auto"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              {athlete.full_name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {athlete.grade || '—'} {athlete.age ? `• ${athlete.age} yrs` : ''} • {athlete.gender || 'Boy'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!latest ? (
          <p className="text-slate-400 py-8 text-center">
            No wellness check-ins logged yet for {athlete.full_name}.
          </p>
        ) : (
          <>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block">Latest Check-In Date</span>
                <strong className="text-sm text-white font-mono">{latest.log_date}</strong>
              </div>
              {status && (
                <span className={`px-3 py-1 rounded-full border font-bold ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>

            {/* 5 Individual Metric Bars */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-emerald-400">Individual Metric Breakdown (/10)</h4>
              {metrics.map((m) => {
                const pct = Math.max(5, Math.min(100, m.val * 10));
                const barColor =
                  m.val >= 8 ? 'bg-emerald-500' : m.val >= 5 ? 'bg-amber-400' : 'bg-rose-500';
                const textColor =
                  m.val >= 8 ? 'text-emerald-400' : m.val >= 5 ? 'text-amber-300' : 'text-rose-400';

                return (
                  <div
                    key={m.label}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">{m.label}</span>
                        <span className="text-[10px] text-slate-500 ml-2">({m.hint})</span>
                      </div>
                      <strong className={`font-mono font-extrabold text-sm ${textColor}`}>
                        {m.val}/10
                      </strong>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all ${barColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reported Sore / Pain Areas */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Reported Sore / Tight Areas
              </span>
              <p className={latest.pain_location ? 'text-rose-300 font-semibold' : 'text-emerald-400'}>
                {latest.pain_location || 'None — 100% Pain-Free'}
              </p>
            </div>

            {/* Recent 7-Day Check-In History */}
            {sortedLogs.length > 1 && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Recent Check-Ins ({Math.min(7, sortedLogs.length)})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {sortedLogs.slice(0, 7).map((l) => {
                    const st = getReadinessStatus(l.composite_score);
                    return (
                      <div
                        key={l.id}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px]"
                      >
                        <span className="text-slate-400 font-mono block">{l.log_date}</span>
                        <strong className={st.color.split(' ').find((c) => c.startsWith('text-')) || 'text-white'}>
                          {l.composite_score}/50
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
