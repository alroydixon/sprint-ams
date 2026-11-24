'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save } from 'lucide-react';

export const RTP_STAGES = [
  { stage: 1, short: 'Stage 1: Acute', label: 'Stage 1: Acute / Rest', status: 'Rehab' },
  { stage: 2, short: 'Stage 2: Rehab', label: 'Stage 2: Mobility & Rehab', status: 'Rehab' },
  { stage: 3, short: 'Stage 3: Linear', label: 'Stage 3: Linear / Sub-Max', status: 'Modified Training' },
  { stage: 4, short: 'Stage 4: Spikes', label: 'Stage 4: High-Intensity / Spikes', status: 'Modified Training' },
  { stage: 5, short: 'Stage 5: Cleared', label: 'Stage 5: Cleared for Competition', status: 'Cleared' },
] as const;

export default function MedicalActiveCaseCard({
  rec,
  athleteName,
  onChanged,
}: {
  rec: any;
  athleteName: string;
  onChanged: () => void;
}) {
  const [restrictions, setRestrictions] = useState(rec.restrictions ?? '');
  const [notes, setNotes] = useState(rec.diagnosis ?? '');
  const [updating, setUpdating] = useState(false);

  const currentStage =
    Number(rec.rtp_stage) || (rec.status === 'Modified Training' ? 3 : 1);
  const stageInfo = RTP_STAGES.find((s) => s.stage === currentStage) || RTP_STAGES[0];

  async function saveUpdate(nextStage?: number) {
    setUpdating(true);
    const targetStage = nextStage ?? currentStage;
    const meta = RTP_STAGES.find((s) => s.stage === targetStage) || RTP_STAGES[0];

    await supabase
      .from('medical_records')
      .update({
        rtp_stage: meta.stage,
        status: meta.status,
        restrictions: restrictions.trim() || null,
        diagnosis: notes.trim() || null,
      })
      .eq('id', rec.id);

    setUpdating(false);
    onChanged();
  }

  return (
    <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <strong className="text-sm text-white block">{athleteName}</strong>
          <span className="text-rose-300 font-semibold">{rec.injury_area}</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-600 text-rose-200 text-[10px] font-bold">
          {stageInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {RTP_STAGES.map((st) => {
          const active = st.stage === currentStage;
          const passed = st.stage < currentStage;
          return (
            <button
              key={st.stage}
              type="button"
              disabled={updating}
              onClick={() => saveUpdate(st.stage)}
              className={`py-1.5 px-1 rounded-md text-[10px] font-bold border transition text-center ${
                active
                  ? st.stage === 5
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-amber-400 border-amber-300 text-slate-950'
                  : passed
                  ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st.short}
            </button>
          );
        })}
      </div>

      <div className="space-y-2 pt-1">
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Training Restrictions</label>
          <input
            type="text"
            value={restrictions}
            onChange={(e) => setRestrictions(e.target.value)}
            placeholder="e.g. No blocks, straight-line tempo only"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-amber-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Clinical Assessment / Progress Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Treatment & rehab progress notes..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200"
          />
        </div>
        <button
          type="button"
          disabled={updating}
          onClick={() => saveUpdate()}
          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-bold px-3 py-1.5 rounded-lg transition"
        >
          <Save className="w-3 h-3" /> {updating ? 'Updating...' : 'Save Report Update'}
        </button>
      </div>
    </div>
  );
}
