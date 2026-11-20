'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MeetEntryManagerCard from './MeetEntryManagerCard';
import { CalendarPlus, Trophy } from 'lucide-react';

const FEDERATIONS = [
  'Boland Athletics',
  'Western Province (WPA)',
  'ASA National',
  'School / Inter-Schools',
  'Club / Open League',
];

export default function CoachMeetsTab({
  coachId,
  discipline = 'sprints',
  athletes,
}: {
  coachId: string;
  discipline?: string | null;
  athletes: any[];
}) {
  const [meets, setMeets] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [meetName, setMeetName] = useState('');
  const [federation, setFederation] = useState('Boland Athletics');
  const [meetDate, setMeetDate] = useState('');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadMeets();
  }, [coachId]);

  async function loadMeets() {
    setLoading(true);
    const { data: mData } = await supabase
      .from('meets')
      .select('*')
      .eq('coach_id', coachId)
      .order('meet_date', { ascending: true });

    const meetList = mData || [];
    setMeets(meetList);

    if (meetList.length > 0) {
      const { data: eData } = await supabase
        .from('meet_entries')
        .select('*')
        .in('meet_id', meetList.map((m) => m.id));
      setEntries(eData || []);
    } else {
      setEntries([]);
    }
    setLoading(false);
  }

  async function createMeet(e: React.FormEvent) {
    e.preventDefault();
    if (!meetName.trim() || !meetDate) return;
    setCreating(true);

    await supabase.from('meets').insert({
      coach_id: coachId,
      meet_name: meetName.trim(),
      federation,
      meet_date: meetDate,
      venue: venue.trim() || null,
      notes: notes.trim() || null,
    });

    setMeetName('');
    setMeetDate('');
    setVenue('');
    setNotes('');
    setCreating(false);
    loadMeets();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createMeet} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
          <CalendarPlus className="w-4 h-4 text-amber-400" /> Post Upcoming Boland / WPA / ASA Competition
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            required
            type="text"
            placeholder="Meet Name (e.g. Boland League 2)"
            value={meetName}
            onChange={(e) => setMeetName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
          <select
            value={federation}
            onChange={(e) => setFederation(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
          >
            {FEDERATIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <input
            required
            type="date"
            value={meetDate}
            onChange={(e) => setMeetDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Venue (e.g. Coetzenburg Stadium, Stellenbosch)"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
          <input
            type="text"
            placeholder="Optional Meet Info (e.g. Warm-up 1h before track call)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <button disabled={creating} type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg">
          {creating ? 'Posting...' : '+ Add Meet to Squad Calendar'}
        </button>
      </form>

      {loading ? (
        <p className="text-xs text-slate-400">Loading meet calendar...</p>
      ) : meets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400 space-y-1">
          <Trophy className="w-6 h-6 text-slate-600 mx-auto mb-1" />
          <p>No upcoming meets posted yet. Add your next Boland, WPA, or ASA meet above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meets.map((m) => (
            <MeetEntryManagerCard
              key={m.id}
              meet={m}
              entries={entries.filter((en) => en.meet_id === m.id)}
              athletes={athletes}
              discipline={discipline}
              onSaved={loadMeets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
