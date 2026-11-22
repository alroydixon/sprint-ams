'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthSignupFields from '@/components/AuthSignupFields';
import { submitAuthForm } from '@/lib/authSubmission';
import { CoachingDiscipline } from '@/lib/disciplines';
import { Activity } from 'lucide-react';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'athlete' | 'coach' | 'medical' | 'manager'>('athlete');
  const [discipline, setDiscipline] = useState<CoachingDiscipline>('sprints');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coachId, setCoachId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [claimAthleteId, setClaimAthleteId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [platformKey, setPlatformKey] = useState('');
  const [specialty, setSpecialty] = useState('Sports Physician');
  const [grade, setGrade] = useState('Grade 11');
  const [age, setAge] = useState('17');
  const [gender, setGender] = useState('Boy');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const qRole = searchParams.get('role');
    const qCoach = searchParams.get('coach');
    const qManager = searchParams.get('manager');
    const qAthlete = searchParams.get('athlete');
    const qKey = searchParams.get('key');

    if (qRole === 'athlete' || qRole === 'medical' || qRole === 'coach' || qRole === 'manager') {
      setRole(qRole);
      setMode('signup');
    }
    if (qCoach) {
      setCoachId(qCoach);
      setMode('signup');
    }
    if (qManager) {
      setManagerId(qManager);
      setRole('coach');
      setMode('signup');
    }
    if (qKey) {
      setPlatformKey(qKey);
      setMode('signup');
    }
    if (qAthlete) {
      setClaimAthleteId(qAthlete);
      setRole('athlete');
      setMode('signup');
      supabase.from('profiles').select('full_name, grade, age, gender').eq('id', qAthlete).maybeSingle().then(({ data }) => {
        if (data) {
          if (data.full_name) setFullName(data.full_name);
          if (data.grade) setGrade(data.grade);
          if (data.age) setAge(String(data.age));
          if (data.gender) setGender(data.gender);
        }
      });
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const targetRoute = await submitAuthForm({
        mode, role, discipline, fullName, email, password,
        coachId, managerId, claimAthleteId, inviteCode, platformKey,
        specialty, grade, age, gender,
      });
      router.push(targetRoute);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FAST Athletics AMS</h1>
          <p className="text-xs text-slate-400">Invite-Only Performance, Wellness &amp; Medical Hub</p>
        </div>

        <div className="grid grid-cols-2 bg-slate-800 p-1 rounded-lg text-sm font-medium">
          <button type="button" onClick={() => setMode('login')} className={`py-2 rounded-md transition ${mode === 'login' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-300'}`}>
            Sign In
          </button>
          <button type="button" onClick={() => setMode('signup')} className={`py-2 rounded-md transition ${mode === 'signup' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-300'}`}>
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <AuthSignupFields
              role={role} setRole={setRole}
              discipline={discipline} setDiscipline={setDiscipline}
              fullName={fullName} setFullName={setFullName}
              grade={grade} setGrade={setGrade}
              age={age} setAge={setAge}
              gender={gender} setGender={setGender}
              specialty={specialty} setSpecialty={setSpecialty}
              coachId={coachId} setCoachId={setCoachId}
              managerId={managerId} setManagerId={setManagerId}
              inviteCode={inviteCode} setInviteCode={setInviteCode}
              platformKey={platformKey} setPlatformKey={setPlatformKey}
            />
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email Address</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="coach@school.co.za" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          </div>

          {errorMsg && <p className="text-xs text-rose-400 bg-rose-950/50 border border-rose-800 p-2 rounded">{errorMsg}</p>}

          <button disabled={loading} type="submit" className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
