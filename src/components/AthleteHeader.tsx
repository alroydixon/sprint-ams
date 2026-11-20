'use client';

import { supabase } from '@/lib/supabase';
import { getReadinessStatus } from '@/lib/biomechanics';
import { Camera, LogOut, UserCog, Trash2 } from 'lucide-react';

export default function AthleteHeader({
  profile,
  latestScore,
  onProfileUpdated,
  onEditClick,
  onSignOut,
}: {
  profile: any;
  latestScore?: number | null;
  onProfileUpdated: (updated: any) => void;
  onEditClick: () => void;
  onSignOut: () => void;
}) {
  const readiness = getReadinessStatus(latestScore);
  const initials = (profile.full_name || 'AT').slice(0, 2).toUpperCase();

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.item(0);
    if (!file || !profile) return;
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: freshUrl }).eq('id', profile.id);
      onProfileUpdated({ ...profile, avatar_url: freshUrl });
    }
  }

  async function handleRemoveAvatar() {
    if (!profile) return;
    const { data: files } = await supabase.storage.from('avatars').list(profile.id);
    if (files && files.length > 0) {
      await supabase.storage.from('avatars').remove(files.map((f) => `${profile.id}/${f.name}`));
    }
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id);
    onProfileUpdated({ ...profile, avatar_url: null });
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <label className="relative cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center font-bold text-lg text-emerald-400">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || 'Athlete'} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 p-1 rounded-full">
                <Camera className="w-3 h-3" />
              </span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
            {profile.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="flex items-center gap-0.5 text-[10px] text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="w-2.5 h-2.5" /> Reset
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold">{profile.full_name || 'Athlete'}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border font-semibold ${readiness.color}`}>
                <span className={`w-2 h-2 rounded-full ${readiness.dot}`} />
                {readiness.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {profile.grade || 'Grade N/A'} • {profile.age ? `${profile.age} yrs` : ''} • {profile.gender || ''}
              {profile.phone ? ` • ${profile.phone}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEditClick}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-emerald-400 font-semibold"
          >
            <UserCog className="w-3.5 h-3.5" /> Edit Profile
          </button>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-300"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
