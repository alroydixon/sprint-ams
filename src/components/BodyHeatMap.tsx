'use client';

export interface SoreZone {
  id: string;
  label: string;
  level: 1 | 2 | 3; // 1 = Mild (Yellow), 2 = Moderate (Amber), 3 = Severe (Red)
}

const BODY_ZONES = [
  // Front view hotspots (cx, cy on 0..140 x 0..260)
  { id: 'l_shoulder', label: 'Left Shoulder', view: 'front', cx: 92, cy: 56 },
  { id: 'r_shoulder', label: 'Right Shoulder', view: 'front', cx: 48, cy: 56 },
  { id: 'core_abs', label: 'Core / Abs', view: 'front', cx: 70, cy: 95 },
  { id: 'l_hip', label: 'Left Hip Flexor', view: 'front', cx: 83, cy: 118 },
  { id: 'r_hip', label: 'Right Hip Flexor', view: 'front', cx: 57, cy: 118 },
  { id: 'groin', label: 'Groin / Adductors', view: 'front', cx: 70, cy: 128 },
  { id: 'l_quad', label: 'Left Quad', view: 'front', cx: 84, cy: 152 },
  { id: 'r_quad', label: 'Right Quad', view: 'front', cx: 56, cy: 152 },
  { id: 'l_knee', label: 'Left Knee', view: 'front', cx: 84, cy: 182 },
  { id: 'r_knee', label: 'Right Knee', view: 'front', cx: 56, cy: 182 },
  { id: 'l_shin', label: 'Left Shin / Ankle', view: 'front', cx: 84, cy: 222 },
  { id: 'r_shin', label: 'Right Shin / Ankle', view: 'front', cx: 56, cy: 222 },

  // Back view hotspots
  { id: 'upper_back', label: 'Upper Back / Neck', view: 'back', cx: 70, cy: 58 },
  { id: 'lower_back', label: 'Lower Back / Lumbar', view: 'back', cx: 70, cy: 102 },
  { id: 'l_glute', label: 'Left Glute', view: 'back', cx: 56, cy: 124 },
  { id: 'r_glute', label: 'Right Glute', view: 'back', cx: 84, cy: 124 },
  { id: 'l_hamstring', label: 'Left Hamstring', view: 'back', cx: 56, cy: 155 },
  { id: 'r_hamstring', label: 'Right Hamstring', view: 'back', cx: 84, cy: 155 },
  { id: 'l_calf', label: 'Left Calf', view: 'back', cx: 56, cy: 198 },
  { id: 'r_calf', label: 'Right Calf', view: 'back', cx: 84, cy: 198 },
  { id: 'l_achilles', label: 'Left Achilles / Heel', view: 'back', cx: 56, cy: 232 },
  { id: 'r_achilles', label: 'Right Achilles / Heel', view: 'back', cx: 84, cy: 232 },
];

export default function BodyHeatMap({
  selected,
  onChange,
}: {
  selected: SoreZone[];
  onChange: (next: SoreZone[]) => void;
}) {
  function toggleZone(zone: { id: string; label: string }) {
    const existing = selected.find((s) => s.id === zone.id);
    if (!existing) {
      onChange([...selected, { id: zone.id, label: zone.label, level: 1 }]);
    } else if (existing.level < 3) {
      onChange(
        selected.map((s) =>
          s.id === zone.id ? { ...s, level: (s.level + 1) as 1 | 2 | 3 } : s
        )
      );
    } else {
      onChange(selected.filter((s) => s.id !== zone.id));
    }
  }

  function zoneColor(level?: 1 | 2 | 3) {
    if (level === 1) return '#facc15'; // Mild (Yellow)
    if (level === 2) return '#f97316'; // Moderate (Orange)
    if (level === 3) return '#ef4444'; // Severe (Red)
    return '#334155';
  }

  function renderSilhouette(view: 'front' | 'back') {
    const zones = BODY_ZONES.filter((z) => z.view === view);
    return (
      <div className="flex flex-col items-center bg-slate-950 border border-slate-800 rounded-xl p-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          {view === 'front' ? 'Front View' : 'Back View'}
        </span>
        <svg viewBox="0 0 140 255" className="w-36 h-60 select-none">
          {/* Anatomical Silhouette */}
          <circle cx="70" cy="22" r="14" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          <rect x="64" y="36" width="12" height="10" rx="4" fill="#1e293b" />
          <path
            d="M44 48 Q70 42 96 48 L104 105 L94 108 L88 68 L88 124 L92 182 L90 242 L78 242 L75 182 L70 140 L65 182 L62 242 L50 242 L48 182 L52 124 L52 68 L46 108 L36 105 Z"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Interactive Muscle & Joint Hotspots */}
          {zones.map((z) => {
            const active = selected.find((s) => s.id === z.id);
            return (
              <g
                key={z.id}
                onClick={() => toggleZone(z)}
                className="cursor-pointer"
              >
                {active && (
                  <circle
                    cx={z.cx}
                    cy={z.cy}
                    r="11"
                    fill={zoneColor(active.level)}
                    opacity="0.35"
                  />
                )}
                <circle
                  cx={z.cx}
                  cy={z.cy}
                  r="6.5"
                  fill={zoneColor(active?.level)}
                  stroke={active ? '#ffffff' : '#64748b'}
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h4 className="font-bold text-xs text-emerald-400">Anatomical Body Heat Map (Tap Sore Muscles or Joints)</h4>
          <p className="text-[11px] text-slate-400">Tap once = Mild (Yellow) • Twice = Moderate (Orange) • 3x = Pain/Tight (Red) • 4x = Clear</p>
        </div>
        {selected.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-[11px] text-slate-400 hover:text-white underline">
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {renderSilhouette('front')}
        {renderSilhouette('back')}
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map((s) => (
            <span
              key={s.id}
              onClick={() => toggleZone(s)}
              className={`cursor-pointer text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                s.level === 3
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : s.level === 2
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40'
              }`}
            >
              {s.label} ({s.level === 3 ? 'Severe' : s.level === 2 ? 'Moderate' : 'Mild'})
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 text-center">No body soreness or joint tightness reported today.</p>
      )}
    </div>
  );
}
