'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Ban, UserCheck, Trash2 } from 'lucide-react';

export default function ManagerAccessDrawer({
  managerId,
  initialCode,
  coaches,
  onUpdated,
}: {
  managerId: string;
  initialCode: string;
  coaches: any[];
  onUpdated: () => void;
}) {
  const [programCode, setProgramCode] = useState(initialCode || 'FASTPROGRAM');
  const [saving, setSaving] = useState(false);

  async function saveProgramCode(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ program_invite_code: programCode.trim().toUpperCase() || 'FASTPROGRAM' })
      .eq('id', managerId);
    setSaving(false);
    onUpdated();
  }

  async function toggleSuspendCoach(coach: any) {
    await supabase.from('profiles').update({ is_suspended: !coach.is_suspended }).eq('id', coach.id);
    onUpdated();
  }

  async function removeCoachFromProgram(coach: any) {
    if (!confirm(`Remove Coach ${coach.full_name} from your closed program?`)) return;
    await supabase.from('profiles').update({ program_manager_id: null }).eq('id', coach.id);
    onUpdated();
  }

  return (
    <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 space-y-4 text-xs">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-amber-300">Closed Program Access Control</h3>
          <p className="text-[11px] text-slate-400">Only Head Coaches with your Program Access Code can join this closed group.</p>
        </div>
        <form onSubmit={saveProgramCode} className="flex items-center gap-2">
          <span className="text-slate-400">Program Code:</span>
          <input
            type="text"
            value={programCode}
            onChange={(e) => setProgramCode(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 font-mono uppercase text-amber-300 w-36"
          />
          <button disabled={saving} type="submit" className="bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      <div className="divide-y divide-slate-800">
        {coaches.map((c) => (
          <div key={c.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-white">{c.full_name}</span>
              <span className="ml-2 px-2 py-0.5 rounded bg-slate-800 text-emerald-300 capitalize">
                {c.coaching_discipline || 'sprints'}
              </span>
              {c.is_suspended && (
                <span className="ml-2 px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-semibold">Suspended</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSuspendCoach(c)}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-200"
              >
                {c.is_suspended ? <><UserCheck className="w-3 h-3 text-emerald-400" /> Restore Access</> : <><Ban className="w-3 h-3 text-amber-400" /> Suspend</>}
              </button>
              <button
                type="button"
                onClick={() => removeCoachFromProgram(c)}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-rose-950 px-2.5 py-1 rounded text-rose-400"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        ))}
        {coaches.length === 0 && (
          <p className="py-3 text-slate-500">No coaches linked yet. Click "+ Invite Head Coach" above to send an invite link.</p>
        )}
      </div>
    </div>
  );
}
