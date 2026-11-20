'use client';

import { isFieldDiscipline, formatMark } from '@/lib/disciplines';

export default function AthleteSessionHistory({
  discipline = 'sprints',
  sessions,
  racesCount,
}: {
  discipline?: string | null;
  sessions: any[];
  racesCount: number;
}) {
  const isField = isFieldDiscipline(discipline);

  const totalVolume = sessions.reduce(
    (sum, s) => sum + (s.training_runs || []).reduce((acc: number, r: any) => acc + Number(r.distance_m), 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-xs text-slate-400 block">
            {isField ? 'Total Technical Attempts' : discipline === 'distance' ? 'Total Distance Volume' : 'Period Sprint Volume'}
          </span>
          <strong className="text-xl text-emerald-400">
            {isField
              ? `${totalVolume} reps`
              : discipline === 'distance'
              ? `${(totalVolume / 1000).toFixed(2)} km`
              : `${totalVolume}m`}
          </strong>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-xs text-slate-400 block">Sessions Logged</span>
          <strong className="text-xl text-white">{sessions.length}</strong>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-xs text-slate-400 block">Competition Marks</span>
          <strong className="text-xl text-amber-400">{racesCount}</strong>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.slice().reverse().map((s) => {
          const vol = (s.training_runs || []).reduce((a: number, r: any) => a + Number(r.distance_m), 0);
          return (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-400">{s.session_date} {s.notes ? `• ${s.notes}` : ''}</span>
                <span className="text-slate-300">
                  {isField ? `Total Attempts: ${vol}` : `Total Volume: ${vol}m`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(s.training_runs || []).map((r: any) => (
                  <span key={r.id} className="bg-slate-800 px-2.5 py-1 rounded text-slate-200">
                    {isField ? `${r.distance_m} reps` : `${r.distance_m}m`}
                    {r.time_seconds ? ` • ${formatMark(Number(r.time_seconds), discipline)}` : ''}
                    {r.rest_interval ? ` (${r.rest_interval})` : ''}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
