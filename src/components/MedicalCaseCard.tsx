'use client';

import { useState } from 'react';
import MedicalCaseUpdateForm, { RTP_STAGES } from './MedicalCaseUpdateForm';
import { Calendar, ClipboardPlus, Activity } from 'lucide-react';

export default function MedicalCaseCard({
  rec,
  athleteName,
  reporterName,
  onSaved,
}: {
  rec: any;
  athleteName: string;
  reporterName: string;
  onSaved: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const historyLog: any[] = Array.isArray(rec.progress_log) ? rec.progress_log : [];
  const currentStageObj = RTP_STAGES.find((s) => s.stage === (rec.rtp_stage || 1)) || RTP_STAGES.at(0)!;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <span className="font-bold text-white text-sm">{athleteName}</span>
          <span className="text-slate-400"> • {rec.injury_area} (Reported {rec.incident_date})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${rec.status === 'Modified Training' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>
            {rec.status}
          </span>
          {!updating && (
            <button type="button" onClick={() => setUpdating(true)} className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold">
              <ClipboardPlus className="w-3.5 h-3.5" /> Update Same Case
            </button>
          )}
        </div>
      </div>

      {/* 5-Stage Return-to-Play Stepper */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-emerald-400 font-semibold">{currentStageObj.full}</span>
          <span className="text-slate-400">Stage {rec.rtp_stage || 1} of 5</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {RTP_STAGES.map((s) => {
            const reached = s.stage <= (rec.rtp_stage || 1);
            return (
              <div key={s.stage} className={`p-1.5 rounded text-center text-[10px] font-semibold border ${reached ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                {s.short}
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Summary & Next Booking */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
        <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
          <strong className="text-slate-400 block">Physician Diagnostics:</strong>
          <span className="text-slate-200">{rec.physician_diagnostics || rec.assessment_notes || 'Pending assessment'}</span>
        </div>
        <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
          <strong className="text-slate-400 flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> Biokinetics Force Symmetry:</strong>
          <span className="text-emerald-300 font-semibold">{rec.bio_force_symmetry_pct ? `${rec.bio_force_symmetry_pct}% Limb Symmetry` : 'Not tested yet'}</span>
        </div>
        <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
          <strong className="text-amber-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Next Clinical Booking:</strong>
          <span className="text-slate-200">
            {rec.next_booking_date ? `${rec.next_booking_date} • ${rec.next_booking_specialist}` : 'None scheduled'}
          </span>
        </div>
      </div>

      {/* Chronological Progress Thread on This Same Injury */}
      {historyLog.length > 0 && (
        <div className="bg-slate-900/70 rounded-lg p-2.5 space-y-1 text-[11px] border border-slate-800">
          <strong className="text-slate-400 block">Case Progress Thread ({historyLog.length} updates):</strong>
          {historyLog.slice(0, 5).map((entry, idx) => (
            <div key={idx} className="text-slate-300 flex flex-wrap justify-between gap-1 border-t border-slate-800/60 pt-1">
              <span><strong className="text-emerald-400">[Stage {entry.stage}]</strong> {entry.note}</span>
              <span className="text-slate-500">{entry.date} • {entry.by}</span>
            </div>
          ))}
        </div>
      )}

      {updating && (
        <MedicalCaseUpdateForm
          rec={rec}
          reporterName={reporterName}
          onCancel={() => setUpdating(false)}
          onSaved={() => {
            setUpdating(false);
            onSaved();
          }}
        />
      )}
    </div>
  );
}
