'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Camera, Trash2 } from 'lucide-react';

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
  const [email, setEmail] = useState(profile.email || '');
  const [grade, setGrade] = useState(profile.grade || 'Grade 10');
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile.gender || 'Boy');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const initials = (fullName || 'AT').slice(0, 2).toUpperCase();

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.item(0);
    if (!file) return;
    setUploadingPhoto(true);
    setMsg('');

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${profile.id}/avatar.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      setMsg(error.message);
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: freshUrl }).eq('id', profile.id);
    setAvatarUrl(freshUrl);
    setUploadingPhoto(false);
  }

  async function handleRemovePhoto() {
    setUploadingPhoto(true);
    setMsg('');
    const { data: files } = await supabase.storage.from('avatars').list(profile.id);
    if (files && files.length > 0) {
      await supabase.storage.from('avatars').remove(files.map((f) => `${profile.id}/${f.name}`));
    }
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id);
    setAvatarUrl(null);
    setUploadingPhoto(false);
  }

    async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const { data, error } = await supabase.rpc('coach_update_athlete_profile', {
      p_athlete_id: profile.id,
      p_full_name: fullName.trim(),
      p_phone: phone.trim(),
      p_email: email.trim(),
      p_grade: grade,
      p_age: age ? parseInt(age, 10) : null,
      p_gender: gender,
      p_avatar_url: avatarUrl,
    });

    if (error) {
      setMsg(error.message);
      setSaving(false);
      return;
    }

    if (!isCoachEditingAthlete && email.trim() && email.trim() !== profile.email) {
      await supabase.auth.updateUser({ email: email.trim() });
    }

    onUpdated(data || { ...profile, full_name: fullName.trim(), phone, email, grade, age: age ? parseInt(age, 10) : null, gender, avatar_url: avatarUrl });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-emerald-400">
            {isCoachEditingAthlete ? `Edit Athlete Profile — ${profile.full_name}` : 'Edit My Profile'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center font-bold text-lg text-emerald-400 shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="space-y-2 text-xs">
            <p className="text-slate-300 font-semibold">Profile Photo</p>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold px-3 py-1.5 rounded-lg">
                <Camera className="w-3.5 h-3.5" /> {uploadingPhoto ? 'Working...' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 text-rose-300 px-2.5 py-1.5 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset Default
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Full Name</label>
            <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Contact Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="082 123 4567" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.co.za" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>

          {profile.role === 'athlete' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Grade</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white">
                  <option>Grade 8</option>
                  <option>Grade 9</option>
                  <option>Grade 10</option>
                  <option>Grade 11</option>
                  <option>Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white">
                  <option>Boy</option>
                  <option>Girl</option>
                </select>
              </div>
            </div>
          )}

          {msg && <p className="text-rose-400">{msg}</p>}

          <button disabled={saving} type="submit" className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-lg">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
