'use client';

import MedicalCaseCard from './MedicalCaseCard';
import { History } from 'lucide-react';

export default function MedicalActiveCases({
  reporterName,
  athletes,
  medical,
  onSaved,
}: {
  reporterName: string;
  athletes: any[];
  medical: any[];
  onSaved: () => void;
}) {
  const activeCases = medical.filter((m) => !m.is_cleared);
  const clearedHistory = medical.filter((m) => m.is_cleared);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">
          Active 5-Stage Return-to-Play Cases ({activeCases.length})
        </h4>
        {activeCases.map((rec) => {
          const ath = athletes.find((a) => a.id === rec.athlete_id);
          return (
            <MedicalCaseCard
              key={rec.id}
              rec={rec}
              athleteName={ath?.full_name || 'Athlete'}
              reporterName={reporterName}
              onSaved={onSaved}
            />
          );
        })}
        {activeCases.length === 0 && (
          <p className="text-xs text-slate-500 py-3">No active medical cases reported.</p>
        )}
      </div>

      {/* Cleared Medical History (Full Injury Thread Preserved) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <h4 className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-emerald-400" /> Medical History — Cleared Cases ({clearedHistory.length})
        </h4>
        <div className="divide-y divide-slate-800 text-xs">
          {clearedHistory.map((rec) => {
            const ath = athletes.find((a) => a.id === rec.athlete_id);
            const log: any[] = Array.isArray(rec.progress_log) ? rec.progress_log : [];
            return (
              <div key={rec.id} className="py-3 space-y-1">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="font-semibold text-white">{ath?.full_name || 'Athlete'}</span> • <span className="text-slate-300">{rec.injury_area}</span>
                    <span className="text-slate-500 text-[11px]"> (Reported {rec.incident_date} → Cleared {rec.cleared_date || 'Yes'})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Stage 5 Cleared
                  </span>
                </div>
                {rec.physician_diagnostics && (
                  <p className="text-[11px] text-slate-400">Diagnostics: {rec.physician_diagnostics} {rec.bio_force_symmetry_pct ? `• Biokinetics Symmetry: ${rec.bio_force_symmetry_pct}%` : ''}</p>
                )}
                {log.length > 0 && (
                  <p className="text-[11px] text-slate-400">
                    Rehab Journey: {log.slice().reverse().map((e) => `[S${e.stage} ${e.date}] ${e.note}`).join(' → ')}
                  </p>
                )}
              </div>
            );
          })}
          {clearedHistory.length === 0 && <p className="text-xs text-slate-500 py-3">No cleared cases in medical history yet.</p>}
        </div>
      </div>
    </div>
  );
}
