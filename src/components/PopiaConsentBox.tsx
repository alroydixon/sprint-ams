'use client';

import { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function PopiaConsentBox({
  role,
  age,
  accepted,
  onChange,
}: {
  role: 'athlete' | 'coach' | 'medical' | 'manager';
  age: string;
  accepted: boolean;
  onChange: (checked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const numericAge = parseInt(age, 10);
  const isMinorAthlete = role === 'athlete' && (!isNaN(numericAge) ? numericAge < 18 : true);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2 text-[11px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> South Africa POPIA Privacy &amp; Health Data Consent
        </span>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-white inline-flex items-center gap-0.5 underline"
        >
          {expanded ? (
            <>
              Hide Notice <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Read Notice <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-300 space-y-1.5 leading-relaxed">
          <p>
            In accordance with the <strong>Protection of Personal Information Act (POPIA, Act 4 of 2013)</strong>,{' '}
            <strong>FAST Athletics AMS</strong> and your affiliated School / Club collect and process personal
            details, competition marks, daily wellness scores, and medical/rehabilitation status solely for
            athlete coaching, injury prevention, and sports science management.
          </p>
          <p>
            Health &amp; wellness records are treated as <strong>Special Personal Information (Section 26)</strong>,
            encrypted in transit and at rest, and restricted strictly to your assigned coaching and medical staff.
            You may request access, correction, or deletion of your data at any time via your Program Manager.
          </p>
        </div>
      )}

      <label className="flex items-start gap-2.5 cursor-pointer select-none text-slate-200 pt-0.5">
        <input
          required
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 accent-emerald-500 w-3.5 h-3.5 shrink-0"
        />
        <span>
          {isMinorAthlete ? (
            <>
              I confirm that I am the <strong>Parent / Legal Guardian</strong> (or have obtained explicit
              Parent/Guardian consent) to process this minor athlete&apos;s personal, wellness, and medical
              information in accordance with <strong>POPIA (Act 4 of 2013)</strong>.
            </>
          ) : (
            <>
              I consent to the collection and processing of my personal, performance, and wellness/medical
              information in accordance with <strong>POPIA (Act 4 of 2013)</strong>.
            </>
          )}
        </span>
      </label>
    </div>
  );
}
