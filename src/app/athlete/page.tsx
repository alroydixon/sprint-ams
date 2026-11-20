'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AthleteHeader from '@/components/AthleteHeader';
import AthleteRehabBanner from '@/components/AthleteRehabBanner';
import AthleteRacesTab from '@/components/AthleteRacesTab';
import AthleteTrainingTab from '@/components/AthleteTrainingTab';
import AthleteTestsCard from '@/components/AthleteTestsCard';
import AthleteWellnessTab from '@/components/AthleteWellnessTab';
import AthleteMeetDayTab from '@/components/AthleteMeetDayTab';
import ProfileSettingsModal from '@/components/ProfileSettingsModal';
import { Trophy, Dumbbell, HeartPulse, Timer, Calendar } from 'lucide-react';

export default function AthleteDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [tab, setTab] = useState<'races' | 'training' | 'wellness' | 'meetday'>('races');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [races, setRaces] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [wellness, setWellness] = useState<any[]>([]);
  const [activeMedical, setActiveMedical] = useState<any[]>([]);
  const [activeBlock, setActiveBlock] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');

    const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profErr || !prof) {
      setLoadError(profErr?.message || `No profile row found for user ID: ${user.id}`);
      return;
    }
    if (prof.role === 'coach') return router.push('/coach');
    if (prof.role === 'medical') return router.push('/medical');
    setProfile({ ...prof, email: prof.email || user.email });

    const [rRes, sRes, tRes, wRes, mRes] = await Promise.all([
      supabase.from('race_results').select('*').eq('athlete_id', user.id).order('race_date', { ascending: true }),
      supabase.from('training_sessions').select('*, training_runs(*)').eq('athlete_id', user.id).order('session_date', { ascending: true }),
      supabase.from('fitness_tests').select('*').eq('athlete_id', user.id).order('test_date', { ascending: true }),
      supabase.from('wellness_logs').select('*').eq('athlete_id', user.id).order('log_date', { ascending: false }),
      supabase.from('medical_records').select('*').eq('athlete_id', user.id).eq('is_cleared', false).order('incident_date', { ascending: false }),
    ]);

    if (rRes.data) setRaces(rRes.data);
    if (sRes.data) setSessions(sRes.data);
    if (tRes.data) setTests(tRes.data);
    if (wRes.data) setWellness(wRes.data);
    if (mRes.data) setActiveMedical(mRes.data);

    if (prof.coach_id) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: bData } = await supabase
        .from('training_blocks')
        .select('*')
        .eq('coach_id', prof.coach_id)
        .lte('start_date', today)
        .gte('end_date', today)
        .limit(1);
      setActiveBlock(bData?.at(0) || null);
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

  const filteredRaces = useMemo(() => races.filter((r) => inRange(r.race_date)), [races, dateFrom, dateTo]);
  const filteredSessions = useMemo(() => sessions.filter((s) => inRange(s.session_date)), [sessions, dateFrom, dateTo]);
  const filteredTests = useMemo(() => tests.filter((t) => inRange(t.test_date)), [tests, dateFrom, dateTo]);
  const filteredWellness = useMemo(() => wellness.filter((w) => inRange(w.log_date)), [wellness, dateFrom, dateTo]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 space-y-4">
        <p className="text-sm text-slate-300">Loading athlete portal...</p>
        {loadError && (
          <div className="bg-rose-950/60 border border-rose-700 text-rose-200 p-4 rounded-xl text-xs max-w-lg space-y-3">
            <p><strong>Database Message:</strong> {loadError}</p>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="bg-emerald-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg">
              Sign Out & Return to Login
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <AthleteHeader
        profile={profile}
        latestScore={wellness.at(0)?.composite_score}
        onProfileUpdated={(updated) => setProfile(updated)}
        onEditClick={() => setEditingProfile(true)}
        onSignOut={async () => { await supabase.auth.signOut(); router.push('/'); }}
      />

      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        <AthleteRehabBanner activeCases={activeMedical} />

        {activeBlock && (
          <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-xl p-3.5 flex flex-wrap justify-between items-center gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                Current Season Phase • {activeBlock.phase_type}
              </span>
              <strong className="text-sm text-white">{activeBlock.phase_name}</strong>
              {activeBlock.key_focus && <span className="text-slate-300"> — Focus: {activeBlock.key_focus}</span>}
            </div>
            <div className="text-right text-[11px] text-slate-300">
              <div>Intensity: <strong className="text-emerald-300">{activeBlock.intensity_zone}</strong></div>
              {activeBlock.target_meet && <div>Target Meet: <strong className="text-amber-300">{activeBlock.target_meet}</strong></div>}
            </div>
          </div>
        )}

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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button onClick={() => setTab('races')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold ${tab === 'races' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
            <Trophy className="w-4 h-4" /> Race Performance
          </button>
          <button onClick={() => setTab('training')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold ${tab === 'training' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
            <Dumbbell className="w-4 h-4" /> Training & Tests
          </button>
          <button onClick={() => setTab('wellness')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold ${tab === 'wellness' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
            <HeartPulse className="w-4 h-4" /> Daily Wellness & RPE
          </button>
          <button onClick={() => setTab('meetday')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold ${tab === 'meetday' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
            <Timer className="w-4 h-4" /> Meet Day
          </button>
        </div>

        {tab === 'races' && <AthleteRacesTab athleteId={profile.id} races={filteredRaces} wellness={wellness} onSaved={loadData} />}
        {tab === 'training' && (
          <div className="space-y-6">
            <AthleteTrainingTab athleteId={profile.id} sessions={filteredSessions} races={races} tests={tests} onSaved={loadData} />
            <AthleteTestsCard athleteId={profile.id} tests={filteredTests} onSaved={loadData} />
          </div>
        )}
        {tab === 'wellness' && <AthleteWellnessTab athleteId={profile.id} logs={filteredWellness} onSaved={loadData} />}
        {tab === 'meetday' && <AthleteMeetDayTab />}
      </main>

      {editingProfile && (
        <ProfileSettingsModal profile={profile} onUpdated={(updated) => setProfile(updated)} onClose={() => setEditingProfile(false)} />
      )}
    </div>
  );
}
