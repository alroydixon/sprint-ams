'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import CoachHeader from '@/components/CoachHeader';
import CoachNavBar, { CoachTab } from '@/components/CoachNavBar';
import CoachSquadTab from '@/components/CoachSquadTab';
import CoachWellnessTab from '@/components/CoachWellnessTab';
import MedicalHubTab from '@/components/MedicalHubTab';
import CoachPeriodizationTab from '@/components/CoachPeriodizationTab';
import CoachMeetsTab from '@/components/CoachMeetsTab';
import CoachRecordsTab from '@/components/CoachRecordsTab';
import CoachApeScoreTab from '@/components/CoachApeScoreTab';
import CoachRelayTab from '@/components/CoachRelayTab';
import CoachImportExportTab from '@/components/CoachImportExportTab';
import ProfileSettingsModal from '@/components/ProfileSettingsModal';
import WeeklyDigestModal from '@/components/WeeklyDigestModal';
import { Calendar } from 'lucide-react';

async function fetchAllRaces(ids: string[]) {
  const all: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('race_results')
      .select('*')
      .in('athlete_id', ids)
      .order('race_date', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export default function CoachDashboard() {
  const router = useRouter();
  const [coach, setCoach] = useState<any>(null);
  const [effectiveCoachId, setEffectiveCoachId] = useState<string>('');
  const [isAssistant, setIsAssistant] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [tab, setTab] = useState<CoachTab>('squad');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [athletes, setAthletes] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [wellness, setWellness] = useState<any[]>([]);
  const [medical, setMedical] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    loadSquadData();
  }, []);

  async function loadSquadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!prof) return;
    if (prof.role === 'medical') return router.push('/medical');
    if (prof.role !== 'coach') return router.push('/athlete');
    setCoach({ ...prof, email: prof.email || user.email });

    const { data: linkRow } = await supabase
      .from('squad_coaches')
      .select('head_coach_id')
      .eq('assistant_coach_id', user.id)
      .maybeSingle();

    const targetCoachId = linkRow?.head_coach_id || user.id;
    setEffectiveCoachId(targetCoachId);
    setIsAssistant(Boolean(linkRow?.head_coach_id));

    const [{ data: squad }, { data: blockRows }] = await Promise.all([
      supabase.from('profiles').select('*').eq('coach_id', targetCoachId).eq('role', 'athlete').order('full_name', { ascending: true }),
      supabase.from('training_blocks').select('*').eq('coach_id', targetCoachId).order('start_date', { ascending: true }),
    ]);

    if (blockRows) setBlocks(blockRows);
    const squadList = squad || [];
    setAthletes(squadList);
    const ids = squadList.map((a) => a.id);

    if (ids.length > 0) {
      const [allRaces, sRes, tRes, wRes, mRes] = await Promise.all([
        fetchAllRaces(ids),
        supabase.from('training_sessions').select('*, training_runs(*)').in('athlete_id', ids).order('session_date', { ascending: true }).limit(5000),
        supabase.from('fitness_tests').select('*').in('athlete_id', ids).order('test_date', { ascending: true }).limit(5000),
        supabase.from('wellness_logs').select('*').in('athlete_id', ids).order('log_date', { ascending: false }).limit(5000),
        supabase.from('medical_records').select('*').in('athlete_id', ids).order('incident_date', { ascending: false }),
      ]);

      setRaces(allRaces);
      if (sRes.data) setSessions(sRes.data);
      if (tRes.data) setTests(tRes.data);
      if (wRes.data) setWellness(wRes.data);
      if (mRes.data) setMedical(mRes.data);
    }
  }

  function applyQuickRange(days: number | null) {
    if (!days) {
      setDateFrom('');
      setDateTo('');
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateFrom(start.toISOString().slice(0, 10));
    setDateTo(end.toISOString().slice(0, 10));
  }

  const inRange = (d: string) => (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);

  const activeAthletes = useMemo(() => athletes.filter((a) => !a.is_archived), [athletes]);
  const activeIds = useMemo(() => new Set(activeAthletes.map((a) => a.id)), [activeAthletes]);

  const filteredRaces = useMemo(() => races.filter((r) => inRange(r.race_date)), [races, dateFrom, dateTo]);
  const filteredSessions = useMemo(() => sessions.filter((s) => inRange(s.session_date)), [sessions, dateFrom, dateTo]);
  const filteredTests = useMemo(() => tests.filter((t) => inRange(t.test_date)), [tests, dateFrom, dateTo]);
  const filteredWellness = useMemo(
    () => wellness.filter((w) => activeIds.has(w.athlete_id) && inRange(w.log_date)),
    [wellness, activeIds, dateFrom, dateTo]
  );

  if (!coach) return <div className="min-h-screen bg-slate-950 text-white p-8">Loading coach portal...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <CoachHeader
        coach={coach}
        effectiveCoachId={effectiveCoachId}
        isAssistant={isAssistant}
        activeCount={activeAthletes.length}
        onDigestClick={() => setShowDigest(true)}
        onEditClick={() => setEditingProfile(true)}
        onSignOut={async () => { await supabase.auth.signOut(); router.push('/'); }}
      />

      <main className="max-w-6xl mx-auto px-4 mt-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <button type="button" onClick={() => applyQuickRange(7)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white">Last 7 Days</button>
            <button type="button" onClick={() => applyQuickRange(14)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white">Last 14 Days</button>
            <button type="button" onClick={() => applyQuickRange(null)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400">All Dates</button>
            <span className="ml-1">Custom:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" />
            <span>to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" />
          </div>
        </div>

        <CoachNavBar tab={tab} onChange={setTab} />

        {tab === 'squad' && (
          <CoachSquadTab coachId={effectiveCoachId} discipline={coach.coaching_discipline} athletes={athletes} races={filteredRaces} sessions={filteredSessions} tests={filteredTests} wellness={filteredWellness} onSquadUpdated={loadSquadData} />
        )}
        {tab === 'wellness' && <CoachWellnessTab athletes={activeAthletes} wellness={wellness} sessions={sessions} injuries={medical} />}
        {tab === 'medical' && (
          <MedicalHubTab coachId={effectiveCoachId} reporterName={`Coach ${coach.full_name}`} isCoach={true} athletes={activeAthletes} medical={medical} onSaved={loadSquadData} />
        )}
        {tab === 'season' && (
          <CoachPeriodizationTab coachId={effectiveCoachId} blocks={blocks} sessions={sessions} activeAthleteCount={activeAthletes.length} onSaved={loadSquadData} />
        )}
        {tab === 'meets' && (
          <CoachMeetsTab coachId={effectiveCoachId} discipline={coach.coaching_discipline} athletes={activeAthletes} />
        )}
        {tab === 'records' && <CoachRecordsTab athletes={athletes} races={races} discipline={coach.coaching_discipline} />}
        {tab === 'ape' && <CoachApeScoreTab athletes={activeAthletes} races={filteredRaces} discipline={coach.coaching_discipline} dateFrom={dateFrom} dateTo={dateTo} />}
        {tab === 'relays' && <CoachRelayTab athletes={activeAthletes} races={races} medical={medical} wellness={wellness} />}
        {tab === 'import' && <CoachImportExportTab athletes={athletes} races={filteredRaces} tests={filteredTests} onImported={loadSquadData} />}
      </main>

      {editingProfile && <ProfileSettingsModal profile={coach} onUpdated={(updated) => setCoach(updated)} onClose={() => setEditingProfile(false)} />}
      {showDigest && (
        <WeeklyDigestModal coach={coach} activeAthletes={activeAthletes} races={races} wellness={wellness} sessions={sessions} medical={medical} onClose={() => setShowDigest(false)} />
      )}
    </div>
  );
}
