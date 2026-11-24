'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import MedicalWellnessRpeMonitor from '@/components/MedicalWellnessRpeMonitor';
import MedicalRecordsSection from '@/components/MedicalRecordsSection';
import { HeartPulse, LogOut } from 'lucide-react';

const DISCIPLINE_TABS = [
  { id: 'ALL', label: 'All Disciplines' },
  { id: 'sprints', label: 'Sprints & Hurdles' },
  { id: 'distance', label: 'Distance' },
  { id: 'jumps', label: 'Jumps' },
  { id: 'throws', label: 'Throws' },
  { id: 'multi', label: 'Multi-Events' },
] as const;

export default function MedicalDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [wellness, setWellness] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadDashboard() {
    setErrorMsg('');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/');
      return;
    }

    const { data: medProfile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profErr || !medProfile) {
      setErrorMsg(profErr?.message || 'Medical profile not found.');
      setLoading(false);
      return;
    }

    if (medProfile.role !== 'medical') {
      router.push('/');
      return;
    }

    setProfile(medProfile);

    if (!medProfile.coach_id) {
      setLoading(false);
      return;
    }

    const { data: athData } = await supabase
      .from('profiles')
      .select('*')
      .eq('coach_id', medProfile.coach_id)
      .eq('role', 'athlete')
      .eq('is_archived', false)
      .order('full_name');

    const athList = athData || [];
    setAthletes(athList);

    if (athList.length > 0) {
      const athIds = athList.map((a) => a.id);
      const cutoff14 = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

      const [{ data: medData }, { data: wData }, { data: sData }] = await Promise.all([
        supabase
          .from('medical_records')
          .select('*')
          .in('athlete_id', athIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('wellness_logs')
          .select('*')
          .in('athlete_id', athIds)
          .gte('log_date', cutoff14),
        supabase
          .from('training_sessions')
          .select('*')
          .in('athlete_id', athIds)
          .gte('session_date', cutoff14),
      ]);

      setRecords(medData || []);
      setWellness(wData || []);
      setSessions(sData || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredAthletes = useMemo(() => {
    if (activeTab === 'ALL') return athletes;
    return athletes.filter(
      (a) => (a.coaching_discipline || 'sprints').toLowerCase() === activeTab
    );
  }, [athletes, activeTab]);

  const filteredRecords = useMemo(() => {
    const ids = new Set(filteredAthletes.map((a) => a.id));
    return records.filter((r) => ids.has(r.athlete_id));
  }, [records, filteredAthletes]);

  const activeTabLabel =
    DISCIPLINE_TABS.find((t) => t.id === activeTab)?.label || 'All Disciplines';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-sm">
        Loading Medical &amp; Sports Science Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5 text-xs">
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                {profile?.full_name || 'Medical Staff'} • Sports Medicine &amp; Rehab Portal
              </h1>
              <p className="text-slate-400">
                {profile?.specialty || 'Sports Physician / Physiotherapist'} • {activeTabLabel} ({filteredAthletes.length} Athletes)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2 rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex flex-wrap gap-1.5">
          {DISCIPLINE_TABS.map((tab) => {
            const tabAthIds = new Set(
              (tab.id === 'ALL'
                ? athletes
                : athletes.filter((a) => (a.coaching_discipline || 'sprints').toLowerCase() === tab.id)
              ).map((a) => a.id)
            );
            const activeCaseCount = records.filter(
              (r) => tabAthIds.has(r.athlete_id) && r.status !== 'Cleared' && Number(r.rtp_stage) !== 5
            ).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg font-bold transition inline-flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {activeCaseCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      activeTab === tab.id
                        ? 'bg-slate-950 text-rose-400'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {activeCaseCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-700 rounded-xl p-3 text-rose-200">
            {errorMsg}
          </div>
        )}

        {profile && (
          <MedicalRecordsSection
            medicalStaffId={profile.id}
            athletes={filteredAthletes}
            records={filteredRecords}
            activeDisciplineLabel={activeTabLabel}
            onChanged={loadDashboard}
          />
        )}

        <MedicalWellnessRpeMonitor
          athletes={filteredAthletes}
          wellness={wellness}
          sessions={sessions}
        />
      </div>
    </div>
  );
}
