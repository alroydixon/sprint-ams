'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CoachingDiscipline } from '@/lib/disciplines';
import ManagerHeaderAndFilters from '@/components/ManagerHeaderAndFilters';
import ManagerAccessDrawer from '@/components/ManagerAccessDrawer';
import ManagerDisciplineOverview from '@/components/ManagerDisciplineOverview';

async function fetchAllProgramRows(table: 'race_results' | 'wellness_logs', ids: string[], orderCol: string, asc: boolean) {
  const all: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .in('athlete_id', ids)
      .order(orderCol, { ascending: asc })
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export default function ProgramManagerDashboard() {
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [wellness, setWellness] = useState<any[]>([]);
  const [medical, setMedical] = useState<any[]>([]);

  const [selectedDiscipline, setSelectedDiscipline] = useState<CoachingDiscipline>('sprints');
  const [showAccessControl, setShowAccessControl] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadProgramData();
  }, []);

  async function loadProgramData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!prof) return;
    if (prof.role !== 'manager') return router.push('/');
    setManager(prof);

    const { data: coachList } = await supabase
      .from('profiles')
      .select('*')
      .eq('program_manager_id', user.id)
      .eq('role', 'coach')
      .order('full_name', { ascending: true });

    const activeCoachList = coachList || [];
    setCoaches(activeCoachList);
    const coachIds = activeCoachList.map((c) => c.id);

    if (coachIds.length > 0) {
      const { data: athList } = await supabase
        .from('profiles')
        .select('*')
        .in('coach_id', coachIds)
        .eq('role', 'athlete')
        .order('full_name', { ascending: true });

      const programAthletes = athList || [];
      setAthletes(programAthletes);
      const athIds = programAthletes.map((a) => a.id);

      if (athIds.length > 0) {
        const [allRaces, allWellness, mRes] = await Promise.all([
          fetchAllProgramRows('race_results', athIds, 'race_date', true),
          fetchAllProgramRows('wellness_logs', athIds, 'log_date', false),
          supabase.from('medical_records').select('*').in('athlete_id', athIds).order('incident_date', { ascending: false }),
        ]);
        setRaces(allRaces);
        setWellness(allWellness);
        if (mRes.data) setMedical(mRes.data);
      }
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

  function copyCoachInvite() {
    if (!manager) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vercel.app';
    const url = `${origin}/?role=coach&manager=${encodeURIComponent(manager.id)}`;
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  }

  const inRange = (d: string) => (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);

  const disciplineCoaches = useMemo(
    () => coaches.filter((c) => !c.is_suspended && (c.coaching_discipline || 'sprints') === selectedDiscipline),
    [coaches, selectedDiscipline]
  );

  const disciplineAthletes = useMemo(() => {
    const cIds = new Set(disciplineCoaches.map((c) => c.id));
    return athletes.filter((a) => cIds.has(a.coach_id));
  }, [athletes, disciplineCoaches]);

  const disciplineRaces = useMemo(() => {
    const aIds = new Set(disciplineAthletes.map((a) => a.id));
    return races.filter((r) => aIds.has(r.athlete_id) && inRange(r.race_date));
  }, [races, disciplineAthletes, dateFrom, dateTo]);

  const disciplineWellness = useMemo(() => {
    const aIds = new Set(disciplineAthletes.map((a) => a.id));
    return wellness.filter((w) => aIds.has(w.athlete_id) && inRange(w.log_date));
  }, [wellness, disciplineAthletes, dateFrom, dateTo]);

  const disciplineMedical = useMemo(() => {
    const aIds = new Set(disciplineAthletes.map((a) => a.id));
    return medical.filter((m) => aIds.has(m.athlete_id));
  }, [medical, disciplineAthletes]);

  if (!manager) return <div className="min-h-screen bg-slate-950 text-white p-8">Loading Program Manager Hub...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <ManagerHeaderAndFilters
        manager={manager}
        coaches={coaches}
        activeAthleteCount={athletes.filter((a) => !a.is_archived).length}
        copiedInvite={copiedInvite}
        onCopyInvite={copyCoachInvite}
        showAccessControl={showAccessControl}
        setShowAccessControl={setShowAccessControl}
        onSignOut={async () => { await supabase.auth.signOut(); router.push('/'); }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        applyQuickRange={applyQuickRange}
        selectedDiscipline={selectedDiscipline}
        setSelectedDiscipline={setSelectedDiscipline}
      />

      <main className="max-w-6xl mx-auto px-4 mt-6 space-y-6">
        {showAccessControl && (
          <ManagerAccessDrawer
            managerId={manager.id}
            initialCode={manager.program_invite_code || 'FASTPROGRAM'}
            coaches={coaches}
            onUpdated={loadProgramData}
          />
        )}

        <ManagerDisciplineOverview
          managerName={manager.full_name}
          discipline={selectedDiscipline}
          coaches={disciplineCoaches}
          athletes={disciplineAthletes}
          races={disciplineRaces}
          wellness={disciplineWellness}
          medical={disciplineMedical}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onRefresh={loadProgramData}
        />
      </main>
    </div>
  );
}
