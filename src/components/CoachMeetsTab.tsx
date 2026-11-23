'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getEventsForDiscipline } from '@/lib/disciplines';
import CoachMeetCard from './CoachMeetCard';
import { Calendar, Plus } from 'lucide-react';

export default function CoachMeetsTab({
  coachId,
  athletes,
  discipline = 'sprints',
}: {
  coachId: string;
  athletes: any[];
  discipline?: string | null;
}) {
  const events = getEventsForDiscipline(discipline);
  const [meets, setMeets] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [meetName, setMeetName] = useState('');
  const [org, setOrg] = useState('Provincial');
  const [meetDate, setMeetDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [venue, setVenue] = useState('');
  const [meetNotes, setMeetNotes] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadMeets() {
    const { data: mData } = await supabase
      .from('meets')
      .select('*')
      .eq('coach_id', coachId)
      .order('meet_date', { ascending: false });

    const meetList = mData || [];
    setMeets(meetList);

    if (meetList.length > 0) {
      const ids = meetList.map((m) => m.id);
      const { data: eData } = await supabase
        .from('meet_entries')
        .select('*')
        .in('meet_id', ids);
      setEntries(eData || []);
    } else {
      setEntries([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (coachId) loadMeets();
  }, [coachId]);

  async function createMeet(e: React.FormEvent) {
    e.preventDefault();
    if (!meetName.trim()) return;
    setCreating(true);
    await supabase.from('meets').insert({
      coach_id: coachId,
      meet_name: meetName.trim(),
      organization: org,
      meet_date: meetDate,
      location: venue.trim() || null,
      notes: meetNotes.trim() || null,
    });
    setMeetName('');
    setOrg('Provincial');
    setVenue('');
    setMeetNotes('');
    setCreating(false);
    loadMeets();
  }

  return (
    <div className="space-y-6 text-xs">
      <form onSubmit={createMeet} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> Post Upcoming Competition
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            required
            type="text"
            placeholder="Meet Name (e.g. Regional Track League 2)"
            value={meetName}
            onChange={(e) => setMeetName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
          <select
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          >
            <option value="Provincial">Provincial</option>
            <option value="National">National</option>
            <option value="International">International</option>
            <option value="Club / Open League">Club / Open League</option>
            <option value="School / Inter-School">School / Inter-School</option>
          </select>
          <input
            required
            type="date"
            value={meetDate}
            onChange={(e) => setMeetDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="text"
            placeholder="Venue (e.g. Coetzenburg Stadium, Stellenbosch)"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="Meet Notes (e.g. Warm-up 1h before track call)"
            value={meetNotes}
            onChange={(e) => setMeetNotes(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
        </div>

        <button
          disabled={creating}
          type="submit"
          className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> {creating ? 'Posting...' : 'Add Meet to Squad Calendar'}
        </button>
      </form>

      {loading ? (
        <p className="text-slate-500 py-6 text-center">Loading competitions...</p>
      ) : meets.length === 0 ? (
        <p className="text-slate-400 py-6 text-center bg-slate-900 border border-slate-800 rounded-xl">
          No competitions posted yet. Add your next meet above to assign athlete entries.
        </p>
      ) : (
        <div className="space-y-4">
          {meets.map((meet) => (
            <CoachMeetCard
              key={meet.id}
              meet={meet}
              meetEntries={entries.filter((e) => e.meet_id === meet.id)}
              athletes={athletes}
              events={events}
              onChanged={loadMeets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
