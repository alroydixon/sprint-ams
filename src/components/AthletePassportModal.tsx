'use client';

import { resolveApeAgeBand } from '@/lib/apeScoring';
import { calculatePower, getReadinessStatus } from '@/lib/biomechanics';
import AthletePassportRecordsTable from './AthletePassportRecordsTable';
import { Printer, X, ShieldCheck, Award } from 'lucide-react';

export default function AthletePassportModal({
  athlete,
  discipline = 'sprints',
  clubName = 'FAST Athletics Academy',
  races,
  tests,
  sessions,
  wellness,
  medical = [],
  onClose,
}: {
  athlete: any;
  discipline?: string | null;
  clubName?: string;
  races: any[];
  tests: any[];
  sessions: any[];
  wellness: any[];
  medical?: any[];
  onClose: () => void;
}) {
  const ageBand = resolveApeAgeBand(athlete.age, athlete.grade);
  const latestTest = tests.at(-1);
  const power = latestTest
    ? calculatePower(Number(latestTest.body_weight_kg), latestTest.pushups_1min_reps || 0, latestTest.situps_1min_reps || 0, latestTest.squat_jumps_1min_reps || 0)
    : null;

  const recentWellness = wellness.slice(0, 14);
  const avgReadiness =
    recentWellness.length > 0
      ? +(recentWellness.reduce((sum, w) => sum + Number(w.composite_score || 0), 0) / recentWellness.length).toFixed(1)
      : null;
  const readinessInfo = getReadinessStatus(avgReadiness ? Math.round(avgReadiness) : undefined);

  const totalVolume = sessions.reduce(
    (sum, s) => sum + (s.training_runs || []).reduce((acc: number, r: any) => acc + Number(r.distance_m), 0),
    0
  );

  const activeInjuries = medical.filter((m) => !m.is_cleared);

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 print:bg-white text-white print:text-slate-950 border border-slate-700 print:border-slate-300 rounded-2xl max-w-3xl w-full p-6 space-y-5 text-xs shadow-2xl my-auto"
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 print:hidden">
          <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> Official Athlete Performance Passport
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg">
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-slate-950 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center font-bold text-xl text-emerald-400 shrink-0">
              {athlete.avatar_url ? <img src={athlete.avatar_url} alt="" className="w-full h-full object-cover" /> : (athlete.full_name || 'AT').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 print:text-emerald-700 block">
                {clubName} • Track &amp; Field Passport
              </span>
              <h2 className="text-xl font-extrabold text-white print:text-slate-950">{athlete.full_name}</h2>
              <p className="text-slate-400 print:text-slate-700 mt-0.5">
                {athlete.grade || 'School / Club'} • {athlete.age ? `${athlete.age} yrs (${ageBand})` : ageBand} • {athlete.gender || 'Boy'} •{' '}
                <span className="capitalize">{discipline || 'sprints'}</span>
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 print:text-emerald-800 border border-emerald-500/40">
              <ShieldCheck className="w-3.5 h-3.5" /> {activeInjuries.length === 0 ? 'Medically Cleared' : `${activeInjuries.length} Active Rehab`}
            </span>
            <p className="text-[10px] text-slate-400 print:text-slate-600 font-mono">ID: {athlete.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 print:text-slate-600 block">Anaerobic Power</span>
            <strong className="text-base text-emerald-400 print:text-emerald-700 font-mono">{power ? `${power.totalW} W` : '—'}</strong>
            <span className="text-[10px] text-slate-400 block">{power ? `${power.totalWPerKg} W/kg` : 'No test'}</span>
          </div>
          <div className="bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 print:text-slate-600 block">14-Day Readiness</span>
            <strong className="text-base text-white print:text-slate-950 font-mono">{avgReadiness !== null ? `${avgReadiness}/50` : '—'}</strong>
            <span className="text-[10px] text-slate-400 block">{readinessInfo.label.split('•').at(1) || 'No logs'}</span>
          </div>
          <div className="bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 print:text-slate-600 block">Logged Volume</span>
            <strong className="text-base text-amber-300 print:text-amber-700 font-mono">{totalVolume}m</strong>
            <span className="text-[10px] text-slate-400 block">{sessions.length} sessions</span>
          </div>
          <div className="bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 print:text-slate-600 block">Competition Marks</span>
            <strong className="text-base text-sky-400 print:text-sky-700 font-mono">{races.length}</strong>
            <span className="text-[10px] text-slate-400 block">All-time entries</span>
          </div>
        </div>

        <AthletePassportRecordsTable athlete={athlete} discipline={discipline} ageBand={ageBand} races={races} />
      </div>
    </div>
  );
}
