'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import SquadRosterTable from './SquadRosterTable';
import CoachAthleteModal from './CoachAthleteModal';
import AthletePassportModal from './AthletePassportModal';
import { UserPlus, Search } from 'lucide-react';

export default function CoachSquadTab({
  coachId,
  discipline = 'sprints',
  athletes,
  races,
  sessions,
  tests,
  wellness,
  onSquadUpdated,
}: {
  coachId: string;
  discipline?: string | null;
  athletes: any[];
  races: any[];
  sessions: any[];
  tests: any[];
  wellness: any[];
  onSquadUpdated: () => void;
}) {
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [passportAthlete, setPassportAthlete] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('Grade 10');
  const [newAge, setNewAge] = useState('16');
  const [newGender, setNewGender] = useState('Boy');

  async function addPlaceholderAthlete(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await supabase.from('profiles').insert({
      full_name: newName.trim(),
      role: 'athlete',
      coach_id: coachId,
      coaching_discipline: discipline || 'sprints',
      grade: newGrade,
      age: parseInt(newAge) || null,
      gender: newGender,
    });
    setNewName('');
    setAdding(false);
    onSquadUpdated();
  }

  async function toggleArchive(athlete: any, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from('profiles').update({ is_archived: !athlete.is_archived }).eq('id', athlete.id);
    onSquadUpdated();
  }

  function copyAthleteInvite(athlete: any, e: React.MouseEvent) {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vercel.app';
    const url = `${origin}/?role=athlete&coach=${encodeURIComponent(coachId)}&athlete=${encodeURIComponent(athlete.id)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(athlete.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  const visibleAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (Boolean(a.is_archived) !== showHidden) return false;
      if (search.trim() && !a.full_name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [athletes, showHidden, search]);

  const hiddenCount = useMemo(() => athletes.filter((a) => a.is_archived).length, [athletes]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search athlete name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHidden(!showHidden)}
            className={`px-3 py-1.5 rounded-lg font-semibold ${
              showHidden ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {showHidden ? 'Back to Active Squad' : `Hidden / Alumni (${hiddenCount})`}
          </button>
          <button
            type="button"
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg"
          >
            <UserPlus className="w-3.5 h-3.5" /> + Add Athlete
          </button>
        </div>
      </div>

      {adding && (
        <form onSubmit={addPlaceholderAthlete} className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          <input required type="text" placeholder="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2" />
          <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2">
            <option>Grade 8</option><option>Grade 9</option><option>Grade 10</option><option>Grade 11</option><option>Grade 12</option>
          </select>
          <input type="number" placeholder="Age" value={newAge} onChange={(e) => setNewAge(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2" />
          <select value={newGender} onChange={(e) => setNewGender(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2">
            <option value="Boy">Boy</option><option value="Girl">Girl</option>
          </select>
          <button type="submit" className="bg-emerald-500 text-slate-950 font-bold rounded-lg p-2">Save Athlete</button>
        </form>
      )}

      <SquadRosterTable
        athletes={visibleAthletes}
        races={races}
        sessions={sessions}
        tests={tests}
        wellness={wellness}
        discipline={discipline}
        showHidden={showHidden}
        copiedId={copiedId}
        onSelectAthlete={setSelectedAthlete}
        onOpenPassport={(a, e) => { e.stopPropagation(); setPassportAthlete(a); }}
        onCopyInvite={copyAthleteInvite}
        onToggleArchive={toggleArchive}
      />

      {selectedAthlete && (
                <CoachAthleteModal
          athlete={selectedAthlete}
          discipline={discipline}
          races={races.filter((r) => r.athlete_id === selectedAthlete.id)}
          tests={tests.filter((t) => t.athlete_id === selectedAthlete.id)}
          sessions={sessions.filter((s) => s.athlete_id === selectedAthlete.id)}
          wellness={wellness.filter((w) => w.athlete_id === selectedAthlete.id)}
          onAthleteUpdated={() => onSquadUpdated()}
          onClose={() => setSelectedAthlete(null)}
        />
      )}

      {passportAthlete && (
        <AthletePassportModal
          athlete={passportAthlete}
          discipline={discipline}
          races={races.filter((r) => r.athlete_id === passportAthlete.id)}
          tests={tests.filter((t) => t.athlete_id === passportAthlete.id)}
          sessions={sessions.filter((s) => s.athlete_id === passportAthlete.id)}
          wellness={wellness.filter((w) => w.athlete_id === passportAthlete.id)}
          onClose={() => setPassportAthlete(null)}
        />
      )}
    </div>
  );
}
