'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import MesocycleTimeline from './MesocycleTimeline';
import { Plus } from 'lucide-react';

const PHASE_TYPES = [
  'General Prep (GPP)',
  'Special Prep (SPP)',
  'Pre-Competition',
  'Competition Peak',
  'Taper / Championship',
  'Active Recovery',
];

export default function CoachPeriodizationTab({
  coachId,
  blocks,
  sessions,
  activeAthleteCount,
  onSaved,
}: {
  coachId: string;
  blocks: any[];
  sessions: any[];
  activeAthleteCount: number;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const fourWeeks = new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);

  const [phaseName, setPhaseName] = useState('');
  const [phaseType, setPhaseType] = useState(PHASE_TYPES[0]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(fourWeeks);
  const [targetVol, setTargetVol] = useState('1600');
  const [intensityZone, setIntensityZone] = useState('75% - 85% (GPP Volume)');
  const [keyFocus, setKeyFocus] = useState('');
  const [targetMeet, setTargetMeet] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!phaseName.trim()) return;
    setSaving(true);

    await supabase.from('training_blocks').insert({
      coach_id: coachId,
      phase_name: phaseName.trim(),
      phase_type: phaseType,
      start_date: startDate,
      end_date: endDate,
      target_weekly_volume_m: parseInt(targetVol) || 1500,
      intensity_zone: intensityZone,
      key_focus: keyFocus.trim() || null,
      target_meet: targetMeet.trim() || null,
    });

    setPhaseName('');
    setKeyFocus('');
    setTargetMeet('');
    setSaving(false);
    onSaved();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddBlock} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-emerald-400">Create Season Mesocycle / Training Block</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            required
            type="text"
            placeholder="Block Name (e.g. Block 1: Acceleration)"
            value={phaseName}
            onChange={(e) => setPhaseName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
          />
          <select value={phaseType} onChange={(e) => setPhaseType(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2">
            {PHASE_TYPES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">From</span>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">To</span>
            <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="number"
            placeholder="Target Weekly Vol (m)"
            value={targetVol}
            onChange={(e) => setTargetVol(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
          />
          <select value={intensityZone} onChange={(e) => setIntensityZone(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2">
            <option>70% - 80% (Tempo / Aerobic)</option>
            <option>75% - 85% (GPP Volume)</option>
            <option>85% - 95% (Speed Endurance)</option>
            <option>95% - 100% (Max Velocity / Peak)</option>
          </select>
          <input
            type="text"
            placeholder="Key Focus (e.g. Block Starts & 30m Drive)"
            value={keyFocus}
            onChange={(e) => setKeyFocus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
          />
          <input
            type="text"
            placeholder="Target Meet (e.g. Western Province Champs)"
            value={targetMeet}
            onChange={(e) => setTargetMeet(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2"
          />
        </div>

        <button disabled={saving} type="submit" className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg">
          <Plus className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Add Mesocycle to Season Plan'}
        </button>
      </form>

      <MesocycleTimeline
        blocks={blocks}
        sessions={sessions}
        activeAthleteCount={activeAthleteCount}
        onSaved={onSaved}
      />
    </div>
  );
}
