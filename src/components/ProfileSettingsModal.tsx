'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import CoachProgramLinkBox from './CoachProgramLinkBox';
import { X, Camera } from 'lucide-react';

export default function ProfileSettingsModal({
  profile,
  isCoachEditingAthlete = false,
  onUpdated,
  onClose,
}: {
  profile: any;
  isCoachEditingAthlete?: boolean;
  onUpdated: (updated: any) => void;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [grade, setGrade] = useState(profile.grade || 'Grade 11');
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile.gender || 'Boy');
  const [clubName, setClubName] = useState(profile.club_name || '');
  const [specialty, setSpecialty] = useState(profile.specialty || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const updates: any = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl || null,
    };

    if (profile.role === 'athlete') {
      updates.grade = grade;
      updates.age = age ? parseInt(age) : null;
      updates.gender = gender;
    } else if (profile.role === 'coach') {
      updates.club_name = clubName.trim() || null;
    } else if (profile.role === 'medical') {
      updates.specialty = specialty.trim() || null;
    }

    const { data } = await supabase.from('profiles').update(updates).eq('id', profile.id).select().single();
    setSaving(false);
    if (data) onUpdated(data);
    onClose();
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-emerald-400">
            {isCoachEditingAthlete ? `Edit Athlete • ${profile.full_name}` : 'Edit Profile & Photo'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-300"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center font-bold text-lg text-emerald-400 shrink-0">
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : (fullName || 'U').slice(0, 2).toUpperCase()}
            </div>
            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 text-slate-200">
              <Camera className="w-4 h-4 text-emerald-400" />
              {uploading ? 'Uploading...' : 'Upload Profile Photo'}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Full Name</label>
            <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Phone / WhatsApp Number</label>
            <input type="text" placeholder="e.g. +27 82 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
          </div>

          {profile.role === 'athlete' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Grade</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2">
                  <option>Grade 8</option><option>Grade 9</option><option>Grade 10</option><option>Grade 11</option><option>Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Division</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2">
                  <option value="Boy">Boy</option><option value="Girl">Girl</option>
                </select>
              </div>
            </div>
          )}

          {profile.role === 'coach' && (
            <>
              <div>
                <label className="block text-slate-400 mb-1">Club / School / Academy Name</label>
                <input type="text" placeholder="e.g. FAST Sprint Academy" value={clubName} onChange={(e) => setClubName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
              </div>
              <CoachProgramLinkBox profile={profile} onUpdated={onUpdated} />
            </>
          )}

          {profile.role === 'medical' && (
            <div>
              <label className="block text-slate-400 mb-1">Clinical Specialty</label>
              <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">Notes / Bio</label>
            <textarea rows={2} placeholder="Primary events, goals, or coaching notes..." value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
          </div>

          <button disabled={saving} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-lg">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
