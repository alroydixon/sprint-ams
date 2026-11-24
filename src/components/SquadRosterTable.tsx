'use client';

import { getPrimaryHeadlineEvents } from '@/lib/disciplines';
import SquadRosterRow from './SquadRosterRow';

export default function SquadRosterTable({
  athletes,
  discipline = 'sprints',
  showHidden = false,
  races,
  sessions,
  tests,
  wellness,
  copiedId,
  onSelectAthlete,
  onOpenPassport,
  onCopyInvite,
  onToggleArchive,
}: {
  athletes: any[];
  discipline?: string | null;
  showHidden?: boolean;
  races: any[];
  sessions: any[];
  tests: any[];
  wellness: any[];
  copiedId: string | null;
  onSelectAthlete: (athlete: any) => void;
  onOpenPassport: (athlete: any, e?: any) => void;
  onCopyInvite: (athlete: any, e?: any) => void;
  onToggleArchive: (athlete: any, e?: any) => void;
}) {
  const primaryEvents = getPrimaryHeadlineEvents(discipline);
  const currentYear = String(new Date().getFullYear());

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
          <tr>
            <th className="py-3 px-4">Athlete &amp; Readiness</th>
            <th>Grade</th>
            {primaryEvents.map((ev: string) => (
              <th key={ev}>
                {ev} PB / {currentYear} SB
              </th>
            ))}
            <th>Power (W/kg)</th>
            <th>Volume</th>
            <th className="text-right px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {athletes.map((a) => (
            <SquadRosterRow
              key={a.id}
              athlete={a}
              discipline={discipline}
              primaryEvents={primaryEvents}
              currentYear={currentYear}
              showHidden={showHidden}
              athRaces={races.filter((r) => r.athlete_id === a.id)}
              athSessions={sessions.filter((s) => s.athlete_id === a.id)}
              athTests={tests.filter((t) => t.athlete_id === a.id)}
              athWellness={wellness.filter((w) => w.athlete_id === a.id)}
              copiedId={copiedId}
              onSelectAthlete={onSelectAthlete}
              onOpenPassport={onOpenPassport}
              onCopyInvite={onCopyInvite}
              onToggleArchive={onToggleArchive}
            />
          ))}
          {athletes.length === 0 && (
            <tr>
              <td
                colSpan={6 + primaryEvents.length}
                className="py-8 text-center text-slate-500"
              >
                No athletes match your search filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
