'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { DISCIPLINE_OPTIONS, CoachingDiscipline } from '@/lib/disciplines';
import ManagerAccessDrawer from '@/components/ManagerAccessDrawer';
import ManagerDisciplineOverview from '@/components/ManagerDisciplineOverview';
import { Shield, UserPlus, Check, KeyRound, LogOut } from 'lucide-react';

export default function ProgramManagerDashboard() {
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [wellness, setWellness] = useState<any[]>([]);

  const [selectedDiscipline, setSelectedDiscipline] = useState<CoachingDiscipline>('sprints');
  const [showAccessControl, setShowAccessControl] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

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
        const [rRes, wRes] = await Promise.all([
          supabase.from('race_results').select('*').in('athlete_id', athIds).order('race_date', { ascending: true }).limit(5000),
          supabase.from('wellness_logs').select('*').in('athlete_id', athIds).order('log_date', { ascending: false }).limit(5000),
        ]);
        if (rRes.data) setRaces(rRes.data);
        if (wRes.data) setWellness(wRes.data);
      }
    }
  }

  function copyCoachInvite() {
    if (!manager) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vercel.app';
    const url = `${origin}/?role=coach&manager=${encodeURIComponent(manager.id)}`;
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  }

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
    return races.filter((r) => aIds.has(r.athlete_id));
  }, [races, disciplineAthletes]);

  const disciplineWellness = useMemo(() => {
    const aIds = new Set(disciplineAthletes.map((a) => a.id));
    return wellness.filter((w) => aIds.has(w.athlete_id));
  }, [wellness, disciplineAthletes]);

  if (!manager) return <div className="min-h-screen bg-slate-950 text-white p-8">Loading Program Manager Hub...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-amber-400">Program Manager • {manager.full_name}</h1>
              <p className="text-xs text-slate-400">
                Closed Program Group • {coaches.length} Coaches • {athletes.filter((a) => !a.is_archived).length} Active Athletes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={copyCoachInvite} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg">
              {copiedInvite ? <><Check className="w-3.5 h-3.5" /> Coach Invite Copied</> : <><UserPlus className="w-3.5 h-3.5" /> + Invite Head Coach</>}
            </button>
            <button type="button" onClick={() => setShowAccessControl(!showAccessControl)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-3 py-1.5 rounded-lg">
              <KeyRound className="w-3.5 h-3.5" /> Access &amp; Coaches ({coaches.length})
            </button>
            <button type="button" onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1.5">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6 space-y-6">
        {showAccessControl && (
          <ManagerAccessDrawer
            managerId={manager.id}
            initialCode={manager.program_invite_code || 'FASTPROGRAM'}
            coaches={coaches}
            onUpdated={loadProgramData}
          />
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {DISCIPLINE_OPTIONS.map((opt) => {
            const count = coaches.filter((c) => !c.is_suspended && (c.coaching_discipline || 'sprints') === opt.id).length;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedDiscipline(opt.id)}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectedDiscipline === opt.id ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{opt.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedDiscipline === opt.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <ManagerDisciplineOverview
          discipline={selectedDiscipline}
          coaches={disciplineCoaches}
          athletes={disciplineAthletes}
          races={disciplineRaces}
          wellness={disciplineWellness}
        />
      </main>
    </div>
  );
}
