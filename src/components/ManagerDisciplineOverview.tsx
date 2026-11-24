'use client';

import { useState, useMemo } from 'react';
import ManagerAthletesResultsTable from './ManagerAthletesResultsTable';
import CoachApeScoreTab from './CoachApeScoreTab';
import CoachRecordsTab from './CoachRecordsTab';
import ManagerMedicalTab from './ManagerMedicalTab';
import ManagerAthleteReadOnlyModal from './ManagerAthleteReadOnlyModal';
import { HeartPulse, Users, Award, Trophy, Stethoscope } from 'lucide-react';

export default function ManagerDisciplineOverview({
  managerName,
  discipline,
  coaches,
  athletes,
  races,
  wellness,
  medical,
  dateFrom = '',
  dateTo = '',
  onRefresh,
}: {
  managerName: string;
  discipline: string;
  coaches: any[];
  athletes: any[];
  races: any[];
  wellness: any[];
  medical: any[];
  dateFrom?: string;
  dateTo?: string;
  onRefresh: () => void;
}) {
  const [subTab, setSubTab] = useState<'athletes' | 'ape' | 'records' | 'medical'>('athletes');
  const [inspectAthlete, setInspectAthlete] = useState<any>(null);

  const activeAthletes = useMemo(() => athletes.filter((a) => !a.is_archived), [athletes]);

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

  const activeInjuryCount = useMemo(() => medical.filter((m) => !m.is_cleared).length, [medical]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
          <span className="text-[11px] text-slate-400">{coaches.length} Coach{coaches.length === 1 ? '' : 'es'} • {activeInjuryCount} Injured</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setSubTab('athletes')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition ${
            subTab === 'athletes' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Athletes &amp; Results
        </button>

        <button
          type="button"
          onClick={() => setSubTab('ape')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition ${
            subTab === 'ape' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> APE Score Leaderboard
        </button>

        <button
          type="button"
          onClick={() => setSubTab('records')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition ${
            subTab === 'records' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" /> Event Records
        </button>

        <button
          type="button"
          onClick={() => setSubTab('medical')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition ${
            subTab === 'medical' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" /> Medical ({activeInjuryCount})
        </button>
      </div>

      {subTab === 'athletes' && (
        <ManagerAthletesResultsTable
          discipline={discipline}
          coaches={coaches}
          activeAthletes={activeAthletes}
          races={races}
          wellness={wellness}
          onInspectAthlete={setInspectAthlete}
        />
      )}

      {subTab === 'ape' && (
        <CoachApeScoreTab
          athletes={activeAthletes}
          races={races}
          discipline={discipline}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}

      {subTab === 'records' && (
        <CoachRecordsTab
          athletes={activeAthletes}
          races={races}
          discipline={discipline}
        />
      )}

      {subTab === 'medical' && (
        <ManagerMedicalTab
          managerName={managerName}
          coaches={coaches}
          athletes={activeAthletes}
          medical={medical}
          onSaved={onRefresh}
        />
      )}

      {inspectAthlete && (
        <ManagerAthleteReadOnlyModal
          athlete={inspectAthlete}
          discipline={discipline}
          races={races.filter((r) => r.athlete_id === inspectAthlete.id)}
          wellness={wellness.filter((w) => w.athlete_id === inspectAthlete.id)}
          onClose={() => setInspectAthlete(null)}
        />
      )}
    </div>
  );
}
