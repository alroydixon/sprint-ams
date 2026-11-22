import { supabase } from './supabase';
import { CoachingDiscipline } from './disciplines';

export async function submitAuthForm({
  mode,
  role,
  discipline,
  fullName,
  email,
  password,
  coachId,
  managerId,
  claimAthleteId,
  inviteCode,
  platformKey,
  specialty,
  grade,
  age,
  gender,
}: {
  mode: 'login' | 'signup';
  role: 'athlete' | 'coach' | 'medical' | 'manager';
  discipline: CoachingDiscipline;
  fullName: string;
  email: string;
  password: string;
  coachId: string;
  managerId: string;
  claimAthleteId: string;
  inviteCode: string;
  platformKey: string;
  specialty: string;
  grade: string;
  age: string;
  gender: string;
}): Promise<string> {
  if (mode === 'login') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: prof } = await supabase
      .from('profiles')
      .select('role, is_suspended')
      .eq('id', data.user.id)
      .single();

    if (prof?.is_suspended) {
      await supabase.auth.signOut();
      throw new Error('Your access has been suspended. Contact your Program Manager or Platform Admin.');
    }
    if (prof?.role === 'manager') return '/manager';
    if (prof?.role === 'coach') return '/coach';
    if (prof?.role === 'medical') return '/medical';
    return '/athlete';
  }

  const cleanCoachId = coachId.trim();
  const cleanManagerId = managerId.trim();
  const needsPlatformKey = role === 'manager' || (role === 'coach' && !cleanCoachId);
  let resolvedDiscipline: CoachingDiscipline = discipline;

  if (needsPlatformKey) {
    const { data: keyOk, error: keyErr } = await supabase.rpc('verify_and_redeem_platform_key', {
      p_key: platformKey.trim(),
      p_role: role,
      p_redeem: false,
    });
    if (keyErr || !keyOk) {
      throw new Error('Invalid or expired Platform License Key. Contact FAST Athletics Admin for an invite.');
    }
  }

  if (cleanCoachId) {
    const isStaff = role === 'coach' || role === 'medical';
    const { data: isValid, error: codeErr } = await supabase.rpc('verify_squad_invite_code', {
      p_coach_id: cleanCoachId,
      p_code: inviteCode.trim(),
      p_is_staff: isStaff,
    });
    if (codeErr || !isValid) {
      throw new Error(isStaff ? 'Invalid Staff Access Code.' : 'Invalid Squad Access Code.');
    }

    const { data: headCoachProf } = await supabase
      .from('profiles')
      .select('coaching_discipline')
      .eq('id', cleanCoachId)
      .maybeSingle();
    if (headCoachProf?.coaching_discipline) {
      resolvedDiscipline = headCoachProf.coaching_discipline as CoachingDiscipline;
    }
  } else if (role === 'coach' && cleanManagerId) {
    const { data: mgrValid, error: mgrErr } = await supabase.rpc('verify_program_invite_code', {
      p_manager_id: cleanManagerId,
      p_code: inviteCode.trim(),
    });
    if (mgrErr || !mgrValid) {
      throw new Error('Invalid Program Access Code. Ask your Program Manager.');
    }
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Signup failed. Please try again.');

  const { error: profErr } = await supabase.rpc('complete_user_signup', {
    p_user_id: data.user.id,
    p_role: role,
    p_discipline: resolvedDiscipline,
    p_full_name: fullName.trim(),
    p_email: email.trim(),
    p_coach_id: cleanCoachId || null,
    p_specialty: role === 'medical' ? specialty : null,
    p_grade: role === 'athlete' ? grade : null,
    p_age: role === 'athlete' ? parseInt(age) || null : null,
    p_gender: role === 'athlete' ? gender : null,
    p_claim_athlete_id: claimAthleteId.trim() || null,
    p_program_manager_id: role === 'coach' && !cleanCoachId ? cleanManagerId || null : null,
  });
  if (profErr) throw profErr;

  if (needsPlatformKey) {
    await supabase.rpc('verify_and_redeem_platform_key', {
      p_key: platformKey.trim(),
      p_role: role,
      p_redeem: true,
    });
  }

  if (role === 'manager') return '/manager';
  if (role === 'coach') return '/coach';
  if (role === 'medical') return '/medical';
  return '/athlete';
}
