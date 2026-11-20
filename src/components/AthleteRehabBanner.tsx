'use client';

import { RTP_STAGES } from './MedicalCaseUpdateForm';
import { Stethoscope, Calendar, Activity } from 'lucide-react';

export default function AthleteRehabBanner({ activeCases }: { activeCases: any[] }) {
  if (!activeCases || activeCases.length === 0) return null;

  return (
    <div className="space-y-3">
      {activeCases.map((rec) => {
        const stageNum = rec.rtp_stage || 1;
        const currentStageObj = RTP_STAGES.find((s) => s.stage === stageNum) || RTP_STAGES.at(0)!;
        const historyLog: any[] = Array.isArray(rec.progress_log) ? rec.progress_log : [];
        const latestUpdate = historyLog.at(0);

        return (
          <div
            key={rec.id}
            className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-4 space-y-3 text-xs shadow-lg"
          >
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
                    Active Return-to-Play Plan • {rec.status}
                  </span>
                  <strong className="text-sm text-white">{rec.injury_area}</strong>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Stage {stageNum} of 5
              </span>
            </div>

            {/* 5-Stage Visual Progress Bar */}
            <div className="space-y-1">
              <p className="text-[11px] text-emerald-300 font-semibold">{currentStageObj.full}</p>
              <div className="grid grid-cols-5 gap-1.5">
                {RTP_STAGES.map((s) => {
                  const reached = s.stage <= stageNum;
                  return (
                    <div
                      key={s.stage}
                      className={`p-1.5 rounded text-center text-[10px] font-semibold border ${
                        reached
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900/80 border-slate-800 text-slate-500'
                      }`}
                    >
                      {s.short}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Clinical Booking & Biokinetics Symmetry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block">Next Clinical Booking</span>
                  <strong className="text-white">
                    {rec.next_booking_date
                      ? `${rec.next_booking_date} • ${rec.next_booking_specialist}`
                      : 'No upcoming booking scheduled'}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block">Biokinetics Limb Symmetry</span>
                  <strong className="text-emerald-300">
                    {rec.bio_force_symmetry_pct ? `${rec.bio_force_symmetry_pct}% Symmetry` : 'Pending Stage 3 testing'}
                  </strong>
                </div>
              </div>
            </div>

            {latestUpdate && (
              <p className="text-[11px] text-slate-300 bg-slate-900/70 px-3 py-2 rounded-lg border border-slate-800/80">
                <strong className="text-emerald-400">Latest Update ({latestUpdate.date}):</strong> {latestUpdate.note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
