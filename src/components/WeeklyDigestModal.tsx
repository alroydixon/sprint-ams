'use client';

import { useState, useMemo } from 'react';
import { generateWeeklyDigest } from '@/lib/weeklyDigest';
import { X, MessageCircle, Mail, Copy, Check, Trophy, AlertTriangle, Stethoscope } from 'lucide-react';

export default function WeeklyDigestModal({
  coach,
  activeAthletes,
  races,
  wellness,
  sessions,
  medical,
  onClose,
}: {
  coach: any;
  activeAthletes: any[];
  races: any[];
  wellness: any[];
  sessions: any[];
  medical: any[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const digest = useMemo(
    () => generateWeeklyDigest(coach.full_name, activeAthletes, races, wellness, sessions, medical),
    [coach.full_name, activeAthletes, races, wellness, sessions, medical]
  );

  function handleCopy() {
    navigator.clipboard.writeText(digest.whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const cleanPhone = (coach.phone || '').replace(/[^0-9]/g, '');
const intlPhone = cleanPhone.startsWith('0') ? `27${cleanPhone.slice(1)}` : cleanPhone;
const encodedText = encodeURIComponent(digest.whatsappText);
const whatsappUrl = intlPhone
  ? 'https://wa.me' + intlPhone + '?text=' + encodedText
  : 'https://whatsapp.com' + encodedText;

  const mailtoUrl = `mailto:${encodeURIComponent(coach.email || '')}?subject=${encodeURIComponent(
    digest.emailSubject
  )}&body=${encodeURIComponent(digest.emailBody)}`;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 my-4 shadow-2xl">
        <div className="sticky top-0 z-10 bg-slate-900 pt-1 flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-emerald-400">Weekly Squad Summary & Digest</h2>
            <p className="text-xs text-slate-400">{digest.periodLabel} • Weekly Volume: <strong className="text-amber-400">{digest.squadVolumeM}m</strong></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* One-Click Share & Send Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 px-3 rounded-lg"
          >
            <MessageCircle className="w-4 h-4" /> Send via WhatsApp
          </a>
          <a
            href={mailtoUrl}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-3 rounded-lg border border-slate-700"
          >
            <Mail className="w-4 h-4 text-emerald-400" /> Email Digest
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-3 rounded-lg border border-slate-700"
          >
            {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Text</>}
          </button>
        </div>

        {/* New Personal Bests */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <h3 className="font-bold text-emerald-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> New Personal Bests — Last 7 Days ({digest.newPbs.length})
          </h3>
          {digest.newPbs.length > 0 ? (
            <ul className="space-y-1 text-slate-200">
              {digest.newPbs.map((p, i) => (
                <li key={i}>
                  <strong>{p.athleteName}</strong> — {p.event}: <span className="text-emerald-400 font-bold">{p.time.toFixed(2)}s</span>
                  {p.prevBest ? <span className="text-slate-400"> (prev {p.prevBest.toFixed(2)}s)</span> : <span className="text-slate-400"> (1st mark)</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No new PBs recorded in the last 7 days.</p>
          )}
        </div>

        {/* Readiness & Body Heat Map Flags */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <h3 className="font-bold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Readiness & Body Map Flags ({digest.readinessFlags.length})
          </h3>
          {digest.readinessFlags.length > 0 ? (
            <ul className="space-y-1.5">
              {digest.readinessFlags.map((f, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.level === 'Red' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {f.level} • {f.score}/50
                  </span>
                  <strong className="text-white">{f.athleteName}</strong>
                  {f.soreAreas.length > 0 && <span className="text-slate-400">— {f.soreAreas.join(', ')}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">All checked-in athletes are Green (Ready).</p>
          )}
        </div>

        {/* Active Medical / Rehab */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <h3 className="font-bold text-rose-400 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4" /> Active Medical / Rehab ({digest.activeMedical.length})
          </h3>
          {digest.activeMedical.length > 0 ? (
            <ul className="space-y-1 text-slate-300">
              {digest.activeMedical.map((m, i) => (
                <li key={i}><strong>{m.athleteName}</strong>: {m.injuryArea} ({m.status})</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No active injuries reported.</p>
          )}
        </div>
      </div>
    </div>
  );
}
