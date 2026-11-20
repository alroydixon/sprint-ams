'use client';

import { getReadinessStatus } from '@/lib/biomechanics';
import { SoreZone } from './BodyHeatMap';

export default function CoachWellnessTab({
  athletes,
  wellness,
}: {
  athletes: any[];
  wellness: any[];
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm text-emerald-400">
          Active Squad Wellness & Readiness Matrix ({athletes.length} Active Athletes)
        </h3>
        <span className="text-[11px] text-slate-400">Hidden athletes are excluded automatically</span>
      </div>

      <table className="w-full text-xs text-left">
        <thead className="text-slate-400 border-b border-slate-800">
          <tr>
            <th className="py-2">Athlete</th>
            <th>Date</th>
            <th>Sleep</th>
            <th>Fatigue</th>
            <th>Soreness</th>
            <th>Stress</th>
            <th>Mood</th>
            <th>Readiness</th>
            <th>Body Map Alerts</th>
            <th>sRPE Load</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {athletes.map((a) => {
            const latest = wellness.find((w) => w.athlete_id === a.id);
            const status = getReadinessStatus(latest?.composite_score);
            const areas: SoreZone[] = Array.isArray(latest?.sore_areas) ? latest.sore_areas : [];
            const flagged =
              latest && (latest.composite_score < 28 || latest.muscle_soreness <= 4 || areas.some((z) => z.level >= 2));

            return (
              <tr key={a.id} className={flagged ? 'bg-rose-950/20' : ''}>
                <td className="py-2.5 font-semibold text-white">{a.full_name}</td>
                <td className="text-slate-400">{latest ? latest.log_date : '—'}</td>
                <td>{latest ? latest.sleep_quality : '—'}</td>
                <td>{latest ? latest.fatigue_level : '—'}</td>
                <td className={latest?.muscle_soreness <= 4 ? 'text-rose-400 font-bold' : ''}>
                  {latest ? latest.muscle_soreness : '—'}
                </td>
                <td>{latest ? latest.stress_level : '—'}</td>
                <td>{latest ? latest.mood : '—'}</td>
                <td>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${status.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </td>
                <td>
                  {areas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {areas.map((z) => (
                        <span
                          key={z.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            z.level === 3
                              ? 'bg-rose-500/20 text-rose-300'
                              : z.level === 2
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-yellow-500/20 text-yellow-200'
                          }`}
                        >
                          {z.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="text-amber-400">{latest ? `${latest.srpe_load} AU` : '—'}</td>
              </tr>
            );
          })}
          {athletes.length === 0 && (
            <tr>
              <td colSpan={10} className="py-6 text-center text-slate-500">
                No active athletes to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
