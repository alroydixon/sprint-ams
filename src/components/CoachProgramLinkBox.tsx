'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, CheckCircle2 } from 'lucide-react';

export default function CoachProgramLinkBox({
  profile,
  onUpdated,
}: {
  profile: any;
  onUpdated: (updated: any) => void;
}) {
  const [programManagerId, setProgramManagerId] = useState(profile.program_manager_id || '');
  const [programCode, setProgramCode] = useState('');
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [linking, setLinking] = useState(false);

  async function handleJoinProgram() {
    const cleanMgrId = programManagerId.trim();
    const cleanCode = programCode.trim();
    if (!cleanMgrId || !cleanCode) {
      setStatus({ type: 'err', text: 'Enter both Program Manager ID and Access Code.' });
      return;
    }

    setLinking(true);
    setStatus(null);

    const { data: isValid, error: rpcErr } = await supabase.rpc('verify_program_invite_code', {
      p_manager_id: cleanMgrId,
      p_code: cleanCode,
    });

    if (rpcErr || !isValid) {
      setStatus({ type: 'err', text: 'Invalid Program Manager ID or Access Code.' });
      setLinking(false);
      return;
    }

    const { data: updated } = await supabase
      .from('profiles')
      .update({ program_manager_id: cleanMgrId })
      .eq('id', profile.id)
      .select()
      .single();

    if (updated) {
      onUpdated(updated);
      setStatus({ type: 'ok', text: 'Squad linked to Program Manager!' });
      setProgramCode('');
    }
    setLinking(false);
  }

  return (
    <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-amber-300 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Closed Program Group Link
        </span>
        {profile.program_manager_id && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Linked
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-400">
        Link your existing squad to a Program Manager using their Manager ID and Program Access Code.
      </p>

      <input
        type="text"
        placeholder="Program Manager ID"
        value={programManagerId}
        onChange={(e) => setProgramManagerId(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-white"
      />

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Program Code (e.g. FASTPROGRAM)"
          value={programCode}
          onChange={(e) => setProgramCode(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 font-mono uppercase text-amber-300"
        />
        <button
          type="button"
          disabled={linking}
          onClick={handleJoinProgram}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded"
        >
          {linking ? 'Linking...' : 'Link Squad'}
        </button>
      </div>

      {status && (
        <p className={`text-[11px] font-semibold ${status.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {status.text}
        </p>
      )}
    </div>
  );
}
