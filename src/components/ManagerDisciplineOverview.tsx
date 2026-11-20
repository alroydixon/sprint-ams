'use client';

import { useState, useMemo } from 'react';
import { getReadinessStatus } from '@/lib/biomechanics';
import { getPrimaryHeadlineEvents, formatMark, isBetterMark } from '@/lib/disciplines';
import CoachApeScoreTab from './CoachApeScoreTab';
import CoachRecordsTab from './CoachRecordsTab';
import ManagerAthleteReadOnlyModal from './ManagerAthleteReadOnlyModal';
import { HeartPulse, Users, Award, Trophy, Eye } from 'lucide-react';

export default function ManagerDisciplineOverview({
  discipline,
  coaches,
  athletes,
  races,
  wellness,
  dateFrom = '',
  dateTo = '',
}: {
  discipline: string;
  coaches: any[];
  athletes: any[];
  races: any[];
  wellness: any[];
  dateFrom?: string;
  dateTo?: string;
}) {

  const [subTab, setSubTab] = useState<'athletes' | 'ape' | 'records'>('athletes');
  const [inspectAthlete, setInspectAthlete] = useState<any>(null);

  const activeAthletes = useMemo(() => athletes.filter((a) => !a.is_archived), [athletes]);
  const [ev1, ev2] = getPrimaryHeadlineEvents(discipline);

  const readinessSummary = useMemo(() => {
    const scores: number[] = [];
    let green = 0, amber = 0, red = 0;

    activeAthletes.forEach((a) => {
      const latest = wellness.find((w) => w.athlete_id === a.id);
      if (latest?.composite_score) {
        const s = Number(latest.composite_score);
        scores.push(s);
        if (s >= 40) green++;
        else if (s >= 30) amber++;
        else red++;
      }
    });

    const avg = scores.length > 0 ? +(scores.reduce((acc, v) => acc + v, 0) / scores.length).toFixed(1) : null;
    return { avg, checkedIn: scores.length, green, amber, red };
  }, [activeAthletes, wellness]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 flex items-center gap-1 font-semibold">
            <HeartPulse className="w-3.5 h-3.5 text-emerald-400" /> Collective Readiness
          </span>
          <strong className="text-2xl text-emerald-400 font-mono block mt-1">
            {readinessSummary.avg !== null ? `${readinessSummary.avg}/50` : '—'}
          </strong>
          <span className="text-[11px] text-slate-400">{readinessSummary.checkedIn} active check-ins</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 font-semibold block">Readiness Breakdown</span>
          <div className="flex items-center gap-2 mt-2 font-bold">
            <span className="text-emerald-400">🟢 {readinessSummary.green}</span>
            <span className="text-amber-400">🟡 {readinessSummary.amber}</span>
            <span className="text-rose-400">🔴 {readinessSummary.red}</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Ready • Caution • Fatigue</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 flex items-center gap-1 font-semibold">
            <Users className="w-3.5 h-3.5 text-sky-400" /> Discipline Roster
          </span>
          <strong className="text-2xl text-white font-mono block mt-1">{activeAthletes.length}</strong>
          <span className="text-[11px] text-slate-400">{coaches.length} Coach{coaches.length === 1 ? '' : 'es'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 font-semibold block">Logged Results</span>
          <strong className="text-2xl text-amber-300 font-mono block mt-1">{races.length}</strong>
          <span className="text-[11px] text-slate-400">Read-Only View</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
        <button type="button" onClick={() => setSubTab('athletes')} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold ${subTab === 'athletes' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
          <Users className="w-3.5 h-3.5" /> Athletes &amp; Results
        </button>
        <button type="button" onClick={() => setSubTab('ape')} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold ${subTab === 'ape' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
          <Award className="w-3.5 h-3.5" /> APE Score Leaderboard
        </button>
        <button type="button" onClick={() => setSubTab('records')} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold ${subTab === 'records' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
          <Trophy className="w-3.5 h-3.5" /> Event Records
        </button>
      </div>

      {subTab === 'athletes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Athlete &amp; Readiness</th>
                <th>Coach</th>
                <th>Grade / Age</th>
                <th>{ev1} Best</th>
                <th>{ev2} Best</th>
                <th className="text-right px-4">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeAthletes.map((a) => {
                const athRaces = races.filter((r) => r.athlete_id === a.id);
                const best1 = athRaces.filter((r) => r.event === ev1).reduce((b: any, c: any) => (!b || isBetterMark(Number(c.time_seconds), Number(b.time_seconds), discipline) ? c : b), null);
                const best2 = athRaces.filter((r) => r.event === ev2).reduce((b: any, c: any) => (!b || isBetterMark(Number(c.time_seconds), Number(b.time_seconds), discipline) ? c : b), null);
                const latestW = wellness.find((w) => w.athlete_id === a.id);
                const readiness = getReadinessStatus(latestW?.composite_score);
                const coachProf = coaches.find((c) => c.id === a.coach_id);

                return (
                  <tr key={a.id} onClick={() => setInspectAthlete(a)} className="hover:bg-slate-800/50 cursor-pointer">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white mr-2">{a.full_name}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${readiness.color}`}>
                        {readiness.label}
                      </span>
                    </td>
                    <td className="text-slate-300">{coachProf?.full_name || '—'}</td>
                    <td className="text-slate-400">{a.grade || '—'} {a.age ? `• ${a.age}y` : ''}</td>
                    <td className="font-mono font-bold text-emerald-400">{best1 ? formatMark(Number(best1.time_seconds), discipline) : '—'}</td>
                    <td className="font-mono font-bold text-emerald-400">{best2 ? formatMark(Number(best2.time_seconds), discipline) : '—'}</td>
                    <td className="px-4 text-right">
                      <button type="button" onClick={() => setInspectAthlete(a)} className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2.5 py-1 rounded text-[11px] font-semibold">
                        <Eye className="w-3 h-3" /> View Results
                      </button>
                    </td>
                  </tr>
                );
              })}
              {activeAthletes.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-slate-500">No active athletes in this discipline yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'ape' && <CoachApeScoreTab athletes={activeAthletes} races={races} discipline={discipline} dateFrom={dateFrom} dateTo={dateTo} />}
      {subTab === 'records' && <CoachRecordsTab athletes={athletes} races={races} discipline={discipline} />}

      {inspectAthlete && (
        <ManagerAthleteReadOnlyModal
          athlete={inspectAthlete}
          races={races.filter((r) => r.athlete_id === inspectAthlete.id)}
          discipline={discipline}
          onClose={() => setInspectAthlete(null)}
        />
      )}
    </div>
  );
}
