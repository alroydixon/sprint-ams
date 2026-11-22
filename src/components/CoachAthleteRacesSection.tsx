'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatMark, parseMarkInput } from '@/lib/disciplines';
import AthleteEventChartCard from './AthleteEventChartCard';
import { Plus, Trash2 } from 'lucide-react';

export default function CoachAthleteRacesSection({
  athleteId,
  discipline = 'sprints',
  events,
  races,
  wellness = [],
  onChanged,
}: {
  athleteId: string;
  discipline?: string | null;
  events: string[];
  races: any[];
  wellness?: any[];
  onChanged: () => void;
}) {
  const [newEvent, setNewEvent] = useState(events.at(0) || '100m');
  const [newMark, setNewMark] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newMeet, setNewMeet] = useState('');
  const [newWind, setNewWind] = useState('');
  const [addingRace, setAddingRace] = useState(false);

  const wellnessByDate = useMemo(() => {
    const map = new Map<string, any>();
    wellness.forEach((w) => map.set(w.log_date, w));
    return map;
  }, [wellness]);

  async function addRaceResult(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseMarkInput(newMark);
    if (isNaN(parsed) || parsed <= 0) return;
    setAddingRace(true);
    await supabase.from('race_results').insert({
      athlete_id: athleteId,
      event: newEvent,
      time_seconds: parsed,
      race_date: newDate,
      meet_name: newMeet.trim() || null,
      wind: newWind ? parseFloat(newWind) : null,
    });
    setNewMark('');
    setNewMeet('');
    setNewWind('');
    setAddingRace(false);
    onChanged();
  }

  async function deleteRace(id: string) {
    await supabase.from('race_results').delete().eq('id', id);
    onChanged();
  }

  return (
    <>
      <form onSubmit={addRaceResult} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
        <h4 className="font-bold text-emerald-400">Log Competition Result</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <select value={newEvent} onChange={(e) => setNewEvent(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2">
            {events.map((ev) => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
          <input required type="text" placeholder="Mark (e.g. 10.65)" value={newMark} onChange={(e) => setNewMark(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2" />
          <input required type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2" />
          <input type="text" placeholder="Meet Name" value={newMeet} onChange={(e) => setNewMeet(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2" />
          <input type="number" step="0.1" placeholder="Wind (m/s)" value={newWind} onChange={(e) => setNewWind(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2" />
        </div>
        <button disabled={addingRace} type="submit" className="inline-flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded-lg">
          <Plus className="w-3.5 h-3.5" /> {addingRace ? 'Adding...' : 'Add Result'}
        </button>
      </form>

      {events.slice(0, 2).map((ev) => (
        <AthleteEventChartCard
          key={ev}
          event={ev}
          discipline={discipline}
          evRaces={races.filter((r) => r.event === ev)}
          wellnessByDate={wellnessByDate}
        />
      ))}

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <h4 className="font-bold text-emerald-400 mb-2">Logged Competition Results ({races.length})</h4>
        <table className="w-full text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-1.5">Date</th>
              <th>Event</th>
              <th>Mark</th>
              <th>Wind</th>
              <th>Meet</th>
              <th className="text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {races.slice().reverse().map((r) => (
              <tr key={r.id}>
                <td className="py-1.5">{r.race_date}</td>
                <td className="font-semibold text-white">{r.event}</td>
                <td className="font-mono font-bold text-emerald-400">{formatMark(Number(r.time_seconds), discipline)}</td>
                <td className="text-slate-400">{r.wind !== null && r.wind !== undefined ? `${r.wind} m/s` : '—'}</td>
                <td className="text-slate-400">{r.meet_name || '—'}</td>
                <td className="text-right">
                  <button type="button" onClick={() => deleteRace(r.id)} className="text-rose-400 hover:text-rose-300 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
