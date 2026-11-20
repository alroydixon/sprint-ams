'use client';

import { Users, HeartPulse, Stethoscope, CalendarRange, CalendarCheck, Trophy, Award, Zap, FileSpreadsheet } from 'lucide-react';

export type CoachTab = 'squad' | 'wellness' | 'medical' | 'season' | 'meets' | 'records' | 'ape' | 'relays' | 'import';

const NAV_ITEMS: { id: CoachTab; label: string; Icon: any }[] = [
  { id: 'squad', label: 'Squad', Icon: Users },
  { id: 'wellness', label: 'Wellness', Icon: HeartPulse },
  { id: 'medical', label: 'Medical', Icon: Stethoscope },
  { id: 'season', label: 'Season Plan', Icon: CalendarRange },
  { id: 'meets', label: 'Meets', Icon: CalendarCheck },
  { id: 'records', label: 'Records', Icon: Trophy },
  { id: 'ape', label: 'APE Score', Icon: Award },
  { id: 'relays', label: 'Relays', Icon: Zap },
  { id: 'import', label: 'Import', Icon: FileSpreadsheet },
];

export default function CoachNavBar({
  tab,
  onChange,
}: {
  tab: CoachTab;
  onChange: (next: CoachTab) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-semibold ${
            tab === id ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icon className="w-3.5 h-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}
