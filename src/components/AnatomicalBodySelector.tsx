'use client';

import { useState } from 'react';

interface BodyZone {
  id: string;
  label: string;
  x: number;
  y: number;
}

const FRONT_ZONES: BodyZone[] = [
  { id: 'Neck / Shoulder (L)', label: 'L Shoulder', x: 64, y: 24 },
  { id: 'Neck / Shoulder (R)', label: 'R Shoulder', x: 36, y: 24 },
  { id: 'Chest / Ribs', label: 'Chest', x: 50, y: 31 },
  { id: 'Core / Abdominals', label: 'Core', x: 50, y: 42 },
  { id: 'Hip Flexor / Groin (L)', label: 'L Hip/Groin', x: 58, y: 51 },
  { id: 'Hip Flexor / Groin (R)', label: 'R Hip/Groin', x: 42, y: 51 },
  { id: 'Quadriceps (L)', label: 'L Quad', x: 58, y: 63 },
  { id: 'Quadriceps (R)', label: 'R Quad', x: 42, y: 63 },
  { id: 'Knee (L)', label: 'L Knee', x: 58, y: 74 },
  { id: 'Knee (R)', label: 'R Knee', x: 42, y: 74 },
  { id: 'Shin / Tibia (L)', label: 'L Shin', x: 58, y: 84 },
  { id: 'Shin / Tibia (R)', label: 'R Shin', x: 42, y: 84 },
  { id: 'Ankle / Foot (L)', label: 'L Ankle/Foot', x: 58, y: 94 },
  { id: 'Ankle / Foot (R)', label: 'R Ankle/Foot', x: 42, y: 94 },
];

const BACK_ZONES: BodyZone[] = [
  { id: 'Upper Back / Traps', label: 'Upper Back', x: 50, y: 28 },
  { id: 'Lower Back / Lumbar', label: 'Lower Back', x: 50, y: 44 },
  { id: 'Glute / Piriformis (L)', label: 'L Glute', x: 42, y: 53 },
  { id: 'Glute / Piriformis (R)', label: 'R Glute', x: 58, y: 53 },
  { id: 'Hamstring (L)', label: 'L Hamstring', x: 42, y: 64 },
  { id: 'Hamstring (R)', label: 'R Hamstring', x: 58, y: 64 },
  { id: 'Calf / Gastroc (L)', label: 'L Calf', x: 42, y: 81 },
  { id: 'Calf / Gastroc (R)', label: 'R Calf', x: 58, y: 81 },
  { id: 'Achilles / Heel (L)', label: 'L Achilles', x: 42, y: 92 },
  { id: 'Achilles / Heel (R)', label: 'R Achilles', x: 58, y: 92 },
];

export default function AnatomicalBodySelector({
  selectedZones,
  onToggleZone,
  onClearAll,
}: {
  selectedZones: string[];
  onToggleZone: (zone: string) => void;
  onClearAll: () => void;
}) {
  const [view, setView] = useState<'front' | 'back'>('back');
  const zones = view === 'front' ? FRONT_ZONES : BACK_ZONES;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-emerald-400 block">
            Tap Sore / Tight Body Areas (Anatomical Map)
          </span>
          <span className="text-[11px] text-slate-400">
            Tap any spot on the diagram below to alert your coach &amp; medical staff
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex bg-slate-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setView('back')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                view === 'back' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Back (Posterior)
            </button>
            <button
              type="button"
              onClick={() => setView('front')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                view === 'front' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Front (Anterior)
            </button>
          </div>
          {selectedZones.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-2 py-1 rounded-lg bg-rose-950/70 border border-rose-700/50 text-rose-300 font-semibold"
            >
              Clear ({selectedZones.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Interactive SVG Silhouette with Tappable Hotspots */}
        <div className="relative mx-auto w-56 h-72 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-center select-none">
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-slate-600 fill-slate-800/80" strokeWidth="1.2">
            {/* Head & Neck */}
            <circle cx="50" cy="11" r="6.5" />
            <rect x="47" y="17.5" width="6" height="4" rx="1.5" />
            {/* Torso */}
            <path d="M35 22 L65 22 L62 50 L38 50 Z" />
            {/* Left & Right Arms */}
            <path d="M35 23 L26 42 L29 56 L33 55 L36 35" />
            <path d="M65 23 L74 42 L71 56 L67 55 L64 35" />
            {/* Left & Right Legs */}
            <path d="M38 50 L49 50 L47 74 L46 95 L39 95 L38 74 Z" />
            <path d="M51 50 L62 50 L62 74 L61 95 L54 95 L53 74 Z" />
          </svg>

          {zones.map((z) => {
            const active = selectedZones.includes(z.id);
            return (
              <button
                key={z.id}
                type="button"
                title={z.id}
                onClick={() => onToggleZone(z.id)}
                style={{ left: `${z.x}%`, top: `${z.y}%` }}
                className={`-translate-x-1/2 -translate-y-1/2 absolute w-5 h-5 rounded-full flex items-center justify-center transition transform hover:scale-125 ${
                  active
                    ? 'bg-rose-500 ring-4 ring-rose-500/40 text-white shadow-lg'
                    : 'bg-emerald-500/25 border border-emerald-400/70 hover:bg-amber-400/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-emerald-300'}`} />
              </button>
            );
          })}
        </div>

        {/* Quick-Tap Chips + Selected Summary */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {view === 'back' ? 'Posterior Muscle Groups:' : 'Anterior Muscle Groups:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {zones.map((z) => {
              const active = selectedZones.includes(z.id);
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => onToggleZone(z.id)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                    active
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {active ? `✓ ${z.label}` : z.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-1">Selected Sore Areas:</span>
            {selectedZones.length === 0 ? (
              <span className="text-emerald-400 font-semibold">No soreness / 100% pain-free</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedZones.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-600/50 text-rose-200 font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
