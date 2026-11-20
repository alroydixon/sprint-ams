'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  RelayFormat,
  ExchangeEfficiency,
  getEligibleRelayCandidates,
  autoAssignBestOrder,
  computeRelayProjection,
} from '@/lib/relayCalculator';
import { ApeAgeBand } from '@/lib/apeScoring';
import RelayLegCards, { formatRelayTime } from './RelayLegCards';
import { Zap, RefreshCw, Copy, Check } from 'lucide-react';

export default function CoachRelayTab({
  athletes,
  races,
  medical,
  wellness,
}: {
  athletes: any[];
  races: any[];
  medical: any[];
  wellness: any[];
}) {
  const [format, setFormat] = useState<RelayFormat>('4x100m');
  const [division, setDivision] = useState<'Boy' | 'Girl'>('Boy');
  const [ageBand, setAgeBand] = useState<'All' | ApeAgeBand>('All');
  const [efficiency, setEfficiency] = useState<ExchangeEfficiency>('standard');
  const [excludeInjured, setExcludeInjured] = useState<boolean>(true);
  const [legIds, setLegIds] = useState<(string | '')[]>(['', '', '', '']);
  const [copied, setCopied] = useState(false);

  const candidates = useMemo(
    () =>
      getEligibleRelayCandidates(
        athletes,
        races,
        medical,
        wellness,
        format,
        division,
        ageBand,
        excludeInjured
      ),
    [athletes, races, medical, wellness, format, division, ageBand, excludeInjured]
  );

  useEffect(() => {
    const bestFour = autoAssignBestOrder(candidates.slice(0, 4));
    setLegIds(bestFour.map((c) => (c ? c.athlete.id : '')));
  }, [candidates]);

  function handleAutoOptimize() {
    const bestFour = autoAssignBestOrder(candidates.slice(0, 4));
    setLegIds(bestFour.map((c) => (c ? c.athlete.id : '')));
  }

  function handleLegChange(legIndex: number, athleteId: string) {
    const next = [...legIds];
    const existingIdx = next.findIndex((id, idx) => idx !== legIndex && id === athleteId && athleteId !== '');
    if (existingIdx !== -1) next[existingIdx] = next[legIndex];
    next[legIndex] = athleteId;
    setLegIds(next);
  }

  const selectedLegs = useMemo(
    () => legIds.map((id) => candidates.find((c) => c.athlete.id === id) || null),
    [legIds, candidates]
  );

  const projection = useMemo(
    () => computeRelayProjection(selectedLegs, format, efficiency),
    [selectedLegs, format, efficiency]
  );

  function copyLineup() {
    const lines = [
      `🏃‍♂️ *${format} RELAY LINE-UP (${division === 'Boy' ? 'Boys' : 'Girls'} • ${ageBand})*`,
      projection.isComplete
        ? `⏱ *Predicted Relay Time:* ${formatRelayTime(projection.predictedTotal)} (Raw Sum: ${formatRelayTime(projection.rawSum)} | Exchange Savings: -${projection.exchangeSavings.toFixed(2)}s)`
        : '',
      '',
      ...projection.assignedLegs.map((leg) => {
        if (!leg.candidate) return `Leg ${leg.legNumber}: Unassigned`;
        const cmText =
          leg.checkMarkMetres && leg.checkMarkSteps
            ? ` | Check-mark: ${leg.checkMarkMetres}m (${leg.checkMarkSteps} steps)`
            : '';
        return `Leg ${leg.legNumber}: ${leg.candidate.athlete.full_name} (PB: ${leg.candidate.pbSeconds.toFixed(2)}s → Split: ${leg.predictedSplit.toFixed(2)}s${cmText})`;
      }),
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Relay Team Builder &amp; Exchange Zone Split Calculator
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Auto-selects your fastest active athletes and calculates flying splits &amp; outgoing check-marks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={handleAutoOptimize} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold px-3 py-1.5 rounded-lg">
              <RefreshCw className="w-3.5 h-3.5" /> Auto-Optimize Top 4
            </button>
            <button type="button" onClick={copyLineup} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Line-Up</>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-400 mb-1">Relay Event</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['4x100m', '4x400m'] as RelayFormat[]).map((f) => (
                <button key={f} type="button" onClick={() => setFormat(f)} className={`py-2 rounded-lg font-bold ${format === f ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Division</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['Boy', 'Girl'] as const).map((div) => (
                <button key={div} type="button" onClick={() => setDivision(div)} className={`py-2 rounded-lg font-bold ${division === div ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                  {div === 'Boy' ? 'Boys' : 'Girls'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Age Category</label>
            <select value={ageBand} onChange={(e) => setAgeBand(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-semibold">
              <option value="All">Open / All Ages</option>
              <option value="U15">U15 (14 yrs &amp; under)</option>
              <option value="U16">U16 (15 yrs)</option>
              <option value="U17">U17 (16 yrs)</option>
              <option value="U18">U18 (17 yrs)</option>
              <option value="U20">U20 (18–19 yrs)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Exchange Pass Efficiency</label>
            <select value={efficiency} onChange={(e) => setEfficiency(e.target.value as ExchangeEfficiency)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-semibold">
              <option value="safe">Safe / Conservative (-{format === '4x100m' ? '1.65s' : '2.10s'})</option>
              <option value="standard">Standard Club / School (-{format === '4x100m' ? '2.10s' : '2.70s'})</option>
              <option value="sharp">Championship Sharp (-{format === '4x100m' ? '2.55s' : '3.30s'})</option>
            </select>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
          <input type="checkbox" checked={excludeInjured} onChange={(e) => setExcludeInjured(e.target.checked)} className="rounded accent-emerald-500" />
          <span>Exclude currently injured athletes (active Medical Hub cases)</span>
        </label>
      </div>

      <RelayLegCards
        format={format}
        candidates={candidates}
        legIds={legIds}
        assignedLegs={projection.assignedLegs}
        rawSum={projection.rawSum}
        exchangeSavings={projection.exchangeSavings}
        predictedTotal={projection.predictedTotal}
        isComplete={projection.isComplete}
        onLegChange={handleLegChange}
      />
    </div>
  );
}
