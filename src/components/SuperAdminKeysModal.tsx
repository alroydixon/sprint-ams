'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { KeyRound, Copy, Check, Plus, X, Power } from 'lucide-react';

export default function SuperAdminKeysModal({ onClose }: { onClose: () => void }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [clientName, setClientName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [allowedRole, setAllowedRole] = useState<'manager' | 'coach' | 'any'>('manager');
  const [maxUses, setMaxUses] = useState(1);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    const { data, error } = await supabase.rpc('admin_manage_license_keys', { p_action: 'list' });
    if (error) setErr(error.message);
    else setKeys(data || []);
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) return;
    setSaving(true);
    setErr('');

    const slug = clientName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 14);
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const finalKey = (customCode.trim() || `${slug}-${rand}`).toUpperCase();

    const { data, error } = await supabase.rpc('admin_manage_license_keys', {
      p_action: 'create',
      p_client_name: clientName.trim(),
      p_license_key: finalKey,
      p_allowed_role: allowedRole,
      p_max_uses: maxUses,
    });

    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setKeys(data || []);
    setClientName('');
    setCustomCode('');
  }

  async function toggleKey(id: string) {
    const { data } = await supabase.rpc('admin_manage_license_keys', { p_action: 'toggle', p_key_id: id });
    if (data) setKeys(data);
  }

  function copyWhatsAppInvite(k: any) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vercel.app';
    const roleParam = k.allowed_role === 'any' ? 'manager' : k.allowed_role;
    const link = `${origin}/?role=${roleParam}&key=${encodeURIComponent(k.license_key)}`;
    const msg =
      `Welcome to FAST Athletics AMS (${k.client_name})!\n\n` +
      `Click your private onboarding link below to create your account (your license key is pre-filled):\n` +
      `${link}\n\n` +
      `License Key: ${k.license_key}`;

    navigator.clipboard.writeText(msg);
    setCopiedId(k.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-2xl w-full p-5 space-y-4 text-xs shadow-2xl my-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Super Admin • Client License Keys
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={createKey} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              required
              type="text"
              placeholder="Client / School Name (e.g. Paarl Boys High)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
            <input
              type="text"
              placeholder="Custom Key (Optional — auto-generates)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 font-mono uppercase text-amber-300"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <select value={allowedRole} onChange={(e) => setAllowedRole(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white">
                <option value="manager">Program Manager (Multi-Coach)</option>
                <option value="coach">Head Coach (Single Squad)</option>
                <option value="any">Any Admin Role</option>
              </select>
              <label className="text-slate-400 flex items-center gap-1">
                Max Uses:
                <input type="number" min={1} max={50} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" />
              </label>
            </div>

            <button disabled={saving} type="submit" className="inline-flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg">
              <Plus className="w-3.5 h-3.5" /> {saving ? 'Generating...' : 'Generate Key'}
            </button>
          </div>
          {err && <p className="text-rose-400">{err}</p>}
        </form>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {keys.map((k) => (
            <div key={k.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-white">{k.client_name}</strong>
                  <span className="font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">{k.license_key}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${k.is_active ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                    {k.is_active ? `Active (${k.times_used}/${k.max_uses} used)` : 'Disabled'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 capitalize">Role: {k.allowed_role}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => copyWhatsAppInvite(k)} className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg">
                  {copiedId === k.id ? <><Check className="w-3 h-3" /> Copied Invite!</> : <><Copy className="w-3 h-3" /> Copy WhatsApp Invite</>}
                </button>
                <button type="button" onClick={() => toggleKey(k.id)} title="Enable / Disable Key" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
