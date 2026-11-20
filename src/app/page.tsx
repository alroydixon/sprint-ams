'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthSignupFields from '@/components/AuthSignupFields';
import { CoachingDiscipline } from '@/lib/disciplines';
import { Activity } from 'lucide-react';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'athlete' | 'coach' | 'medical'>('athlete');
  const [discipline, setDiscipline] = useState<CoachingDiscipline>('sprints');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coachId, setCoachId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [specialty, setSpecialty] = useState('Sports Physician');
  const [grade, setGrade] = useState('Grade 11');
  const [age, setAge] = useState('17');
  const [gender, setGender] = useState('Boy');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const qRole = searchParams.get('role');
    const qCoach = searchParams.get('coach');
    if (qRole === 'athlete' || qRole === 'medical' || qRole === 'coach') {
      setRole(qRole);
      setMode('signup');
    }
    if (qCoach) {
      setCoachId(qCoach);
      setMode('signup');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (prof?.role === 'coach') router.push('/coach');
        else if (prof?.role === 'medical') router.push('/medical');
        else router.push('/athlete');
      } else {
        const cleanCoachId = coachId.trim();
        const isJoiningExistingSquad = Boolean(cleanCoachId);
        let resolvedDiscipline: CoachingDiscipline = discipline;

        if (isJoiningExistingSquad) {
          const isStaff = role === 'coach' || role === 'medical';
          const { data: isValid, error: codeErr } = await supabase.rpc('verify_squad_invite_code', {
            p_coach_id: cleanCoachId,
            p_code: inviteCode.trim(),
            p_is_staff: isStaff,
          });
          if (codeErr || !isValid) {
            throw new Error(
              isStaff
                ? 'Invalid Staff Access Code. Ask the Head Coach for the Staff Invite Code.'
                : 'Invalid Squad Access Code. Ask your Coach for the Squad Invite Code.'
            );
          }

          // Inherit Head Coach's coaching_discipline automatically
          const { data: headCoachProf } = await supabase
            .from('profiles')
            .select('coaching_discipline')
            .eq('id', cleanCoachId)
            .maybeSingle();
          if (headCoachProf?.coaching_discipline) {
            resolvedDiscipline = headCoachProf.coaching_discipline as CoachingDiscipline;
          }
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Signup failed. Please try again.');

        const { error: profErr } = await supabase.from('profiles').insert({
          id: data.user.id,
          role,
          coaching_discipline: resolvedDiscipline,
          full_name: fullName.trim(),
          email: email.trim(),
          coach_id: role === 'coach' ? null : cleanCoachId || null,
          specialty: role === 'medical' ? specialty : null,
          grade: role === 'athlete' ? grade : null,
          age: role === 'athlete' ? parseInt(age) || null : null,
          gender: role === 'athlete' ? gender : null,
        });
        if (profErr) throw profErr;

        if (role === 'coach' && isJoiningExistingSquad) {
          await supabase.from('squad_coaches').insert({
            head_coach_id: cleanCoachId,
            assistant_coach_id: data.user.id,
          });
        }

        if (role === 'coach') router.push('/coach');
        else if (role === 'medical') router.push('/medical');
        else router.push('/athlete');
      }
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
          <p className="text-xs text-slate-400">Sprints, Distance, Jumps &amp; Throws Performance, Wellness &amp; Medical Hub</p>
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
              inviteCode={inviteCode} setInviteCode={setInviteCode}
            />
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email Address</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="athlete@school.co.za" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
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
