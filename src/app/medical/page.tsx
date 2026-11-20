'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import MedicalHubTab from '@/components/MedicalHubTab';
import ProfileSettingsModal from '@/components/ProfileSettingsModal';
import { LogOut, Stethoscope, UserCog } from 'lucide-react';

export default function MedicalPortalPage() {
  const router = useRouter();
  const [medProfile, setMedProfile] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [reportedAthletes, setReportedAthletes] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);

  useEffect(() => {
    loadMedicalData();
  }, []);

  async function loadMedicalData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (prof?.role === 'coach') return router.push('/coach');
    if (prof?.role !== 'medical') return router.push('/athlete');
    setMedProfile({ ...prof, email: prof?.email || user.email });

    if (!prof.coach_id) return;

    // RLS automatically restricts this query to ONLY athletes who have a reported medical record
    const [athRes, medRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('coach_id', prof.coach_id).eq('role', 'athlete'),
      supabase.from('medical_records').select('*').eq('coach_id', prof.coach_id).order('incident_date', { ascending: false }),
    ]);

    if (athRes.data) setReportedAthletes(athRes.data);
    if (medRes.data) setMedicalRecords(medRes.data);
  }

  if (!medProfile) return <div className="min-h-screen bg-slate-950 text-white p-8">Loading medical portal...</div>;

  const displayName = `${medProfile.full_name}${medProfile.specialty ? ` (${medProfile.specialty})` : ''}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                Medical & Performance Support Portal • {medProfile.specialty || 'Medical Staff'}
              </span>
              <h1 className="text-lg font-bold">{medProfile.full_name}</h1>
              {medProfile.phone && <p className="text-xs text-slate-400">{medProfile.phone} • {medProfile.email}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingProfile(true)}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-emerald-400 font-semibold"
            >
              <UserCog className="w-3.5 h-3.5" /> Edit Profile
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-300"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6">
        {reportedAthletes.length === 0 && medicalRecords.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-2">
            <h2 className="font-bold text-sm text-emerald-400">No Active Injury Reports</h2>
            <p className="text-xs text-slate-400">
              For athlete privacy, athletes only appear in your Medical Portal once the head coach reports an injury or medical condition.
            </p>
          </div>
        ) : (
          <MedicalHubTab
            coachId={medProfile.coach_id}
            reporterName={displayName}
            isCoach={false}
            athletes={reportedAthletes}
            medical={medicalRecords}
            onSaved={loadMedicalData}
          />
        )}
      </main>

      {editingProfile && (
        <ProfileSettingsModal
          profile={medProfile}
          onUpdated={(updated) => setMedProfile(updated)}
          onClose={() => setEditingProfile(false)}
        />
      )}
    </div>
  );
}
