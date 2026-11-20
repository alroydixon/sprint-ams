'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getReadinessStatus } from '@/lib/biomechanics';
import { buildSquadRows, buildDailySquadVolume } from '@/lib/squadStats';
import CoachAthleteModal from './CoachAthleteModal';
import { EyeOff, Eye, Link2, Check } from 'lucide-react';

export default function CoachSquadTab({
  coachId,
  athletes,
  races,
  sessions,
  tests,
  wellness,
  onSquadUpdated,
}: {
  coachId: string;
  athletes: any[];
  races: any[];
  sessions: any[];
  tests: any[];
  wellness: any[];
  onSquadUpdated: () => void;
}) {
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleAthletes = useMemo(
    () => athletes.filter((a) => (showHidden ? a.is_archived : !a.is_archived)),
    [athletes, showHidden]
  );

  const hiddenCount = useMemo(
    () => athletes.filter((a) => a.is_archived).length,
    [athletes]
  );

  async function toggleArchive(e: React.MouseEvent, athlete: any) {
    e.stopPropagation();
    await supabase
      .from('profiles')
      .update({ is_archived: !athlete.is_archived })
      .eq('id', athlete.id);
    onSquadUpdated();
  }

  function copyInviteLink(e: React.MouseEvent, athlete: any) {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vercel.app';
    const url = `${origin}/?invite=${encodeURIComponent(athlete.full_name)}&coach=${encodeURIComponent(coachId)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(athlete.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  const squadRows = useMemo(
    () => buildSquadRows(visibleAthletes, races, sessions, tests, wellness),
    [visibleAthletes, races, sessions, tests, wellness]
  );

  const dailySquadVol = useMemo(
    () => buildDailySquadVolume(sessions, visibleAthletes),
    [sessions, visibleAthletes]
  );

  const maxVol = Math.max(...dailySquadVol.map((d) => d.metres), 100);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <div>
            <h3 className="font-bold text-sm text-emerald-400">
              {showHidden ? `Hidden / Former Squad Athletes (${hiddenCount})` : `Active Squad Overview & Leaderboard (${visibleAthletes.length})`}
            </h3>
            <span className="text-[11px] text-slate-400">Click any athlete to open their Feedback Card, copy an invite link, or hide inactive runners</span>
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHidden(!showHidden)}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300"
            >
              {showHidden ? <><Eye className="w-3.5 h-3.5 text-emerald-400" /> View Active Squad</> : <><EyeOff className="w-3.5 h-3.5 text-amber-400" /> Hidden Athletes ({hiddenCount})</>}
            </button>
          )}
        </div>

        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2">Athlete & Daily Readiness</th>
              <th>Grade</th>
              <th>100m Best</th>
              <th>200m Best</th>
              <th>Power (W / W/kg)</th>
              <th>Volume (m)</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {squadRows.map((row) => {
              const status = getReadinessStatus(row.readiness);
              return (
                <tr key={row.id} onClick={() => setSelectedAthlete(row)} className="cursor-pointer hover:bg-slate-800/60 transition">
                  <td className="py-2.5 flex items-center gap-2 flex-wrap">
                    <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-[10px] font-bold text-emerald-400">
                      {row.avatar_url ? <img src={row.avatar_url} alt="" className="w-full h-full object-cover" /> : row.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-white hover:text-emerald-400 underline-offset-2 hover:underline">{row.full_name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="text-slate-400">{row.grade || '—'}</td>
                  <td className="font-mono text-emerald-300">{row.pb100}</td>
                  <td className="font-mono text-emerald-300">{row.pb200}</td>
                  <td>{row.power ? `${row.power.totalW} W (${row.power.totalWPerKg})` : '—'}</td>
                  <td className="font-semibold text-amber-400">{row.totalMetres}m</td>
                  <td className="text-right whitespace-nowrap space-x-1.5">
                    {!row.is_archived && (
                      <button type="button" onClick={(e) => copyInviteLink(e, row)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-400">
                        {copiedId === row.id ? <><Check className="w-3 h-3" /> Copied</> : <><Link2 className="w-3 h-3" /> Invite</>}
                      </button>
                    )}
                    <button type="button" onClick={(e) => toggleArchive(e, row)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300">
                      {row.is_archived ? <><Eye className="w-3 h-3 text-emerald-400" /> Restore</> : <><EyeOff className="w-3 h-3 text-slate-400" /> Hide</>}
                    </button>
                  </td>
                </tr>
              );
            })}
            {squadRows.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-slate-500">No athletes in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <h4 className="font-bold text-xs text-slate-300">Active Squad Daily Training Volume (m)</h4>
        {dailySquadVol.length > 0 ? (
          <svg viewBox="0 0 400 120" className="w-full h-32 bg-slate-950 rounded-lg p-2">
            {dailySquadVol.map((d, i) => {
              const barW = Math.min(36, 320 / dailySquadVol.length - 6);
              const x = 30 + i * (340 / dailySquadVol.length);
              const h = (d.metres / maxVol) * 80;
              return (
                <g key={d.date}>
                  <rect x={x} y={95 - h} width={barW} height={h} rx="3" fill="#10b981" />
                  <text x={x + barW / 2} y={91 - h} fontSize="8" fill="#cbd5e1" textAnchor="middle">{d.metres}m</text>
                  <text x={x + barW / 2} y={108} fontSize="7" fill="#64748b" textAnchor="middle">{d.date.slice(5)}</text>
                </g>
              );
            })}
          </svg>
        ) : (
          <p className="text-xs text-slate-500 text-center py-6">No squad training sessions logged in this date range.</p>
        )}
      </div>

            {selectedAthlete && (
        <CoachAthleteModal
          athlete={selectedAthlete}
          races={races.filter((r) => r.athlete_id === selectedAthlete.id)}
          tests={tests.filter((t) => t.athlete_id === selectedAthlete.id)}
          sessions={sessions.filter((s) => s.athlete_id === selectedAthlete.id)}
          wellness={wellness.filter((w) => w.athlete_id === selectedAthlete.id)}
          onAthleteUpdated={() => onSquadUpdated()}
          onClose={() => setSelectedAthlete(null)}
        />
      )}
    </div>
  );
}
