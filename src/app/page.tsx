'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'athlete' | 'coach' | 'medical'>('athlete');
  const [specialty, setSpecialty] = useState('Physiotherapist');
  const [grade, setGrade] = useState('Grade 10');
  const [age, setAge] = useState('16');
  const [gender, setGender] = useState('Boy');
  const [coachId, setCoachId] = useState('');
  const [coaches, setCoaches] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitedName = params.get('invite');
    const invitedCoach = params.get('coach');
    const invitedRole = params.get('role');

    if (invitedName || invitedCoach || invitedRole) {
      setIsSignUp(true);
      if (invitedRole === 'medical') setRole('medical');
      else setRole('athlete');
      if (invitedName) setFullName(invitedName);
    }

    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'coach')
      .then(({ data }) => {
        if (data) {
          setCoaches(data);
          if (invitedCoach) setCoachId(invitedCoach);
          else if (data.length > 0) setCoachId(data.at(0)!.id);
        }
      });
  }, []);

  function routeForRole(userRole?: string) {
    if (userRole === 'coach') return '/coach';
    if (userRole === 'medical') return '/medical';
    return '/athlete';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            specialty: role === 'medical' ? specialty : null,
            phone,
            grade,
            age,
            gender,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.user && (role === 'athlete' || role === 'medical') && coachId) {
        await supabase.from('profiles').update({ coach_id: coachId }).eq('id', data.user.id);
      }

      if (data.session) {
        router.push(routeForRole(role));
      } else {
        setMessage('Account created! Check your email to confirm, then sign in.');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      router.push(routeForRole(profile?.role));
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-center text-emerald-400">Sprint AMS</h1>
        <p className="text-sm text-slate-400 text-center mt-1">
          {isSignUp ? 'Create your Athlete, Coach, or Medical Staff account' : 'Sign in to your performance portal'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">I am signing up as</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'athlete', label: 'Athlete' },
                    { id: 'coach', label: 'Coach' },
                    { id: 'medical', label: 'Medical Staff' },
                  ].map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRole(r.id as any)}
                      className={`py-2 rounded-lg text-xs font-semibold border ${
                        role === r.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                  <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Dr. Sarah Smit" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Contact Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="082 123 4567" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
                </div>
              </div>

              {role === 'medical' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Medical Specialty</label>
                  <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
  <option>Sports Physician</option>
  <option>Physiotherapist</option>
  <option>Biokineticist</option>
  <option>Massage Therapist</option>
  <option>Biomechanist</option>
  <option>Chiropractor</option>
</select>
                </div>
              )}

              {role === 'athlete' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Grade</label>
                    <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
                      <option>Grade 8</option>
                      <option>Grade 9</option>
                      <option>Grade 10</option>
                      <option>Grade 11</option>
                      <option>Grade 12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Age</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
                      <option>Boy</option>
                      <option>Girl</option>
                    </select>
                  </div>
                </div>
              )}

              {(role === 'athlete' || role === 'medical') && coaches.length > 0 && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Assigned Squad Coach</label>
                  <select value={coachId} onChange={(e) => setCoachId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
                    {coaches.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.co.za" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Password</label>
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          </div>

          {message && <p className="text-xs text-amber-400 bg-amber-950/50 border border-amber-800 p-2.5 rounded-lg">{message}</p>}

          <button disabled={loading} type="submit" className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition">
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button type="button" onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }} className="w-full mt-4 text-xs text-slate-400 hover:text-emerald-400 text-center">
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </main>
  );
}
