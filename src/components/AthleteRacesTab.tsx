'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { FLAT_EVENTS, HURDLE_EVENTS } from '@/lib/biomechanics';
import AthleteEventChartCard from './AthleteEventChartCard';
import { Plus } from 'lucide-react';

export default function AthleteRacesTab({
  athleteId,
  races,
  wellness = [],
  onSaved,
}: {
  athleteId: string;
  races: any[];
  wellness?: any[];
  onSaved: () => void;
}) {
  const [raceDate, setRaceDate] = useState(new Date().toISOString().slice(0, 10));
  const [meetName, setMeetName] = useState('');
  const [event, setEvent] = useState('100m');
  const [timeSeconds, setTimeSeconds] = useState('');
  const [windMs, setWindMs] = useState('');
  const [saving, setSaving] = useState(false);

  const wellnessByDate = useMemo(() => {
    const map = new Map<string, any>();
    wellness.forEach((w) => map.set(w.log_date, w));
    return map;
  }, [wellness]);

  async function handleAddRace(e: React.FormEvent) {
    e.preventDefault();
    if (!timeSeconds) return;
    setSaving(true);
    await supabase.from('race_results').insert({
      athlete_id: athleteId,
      race_date: raceDate,
      meet_name: meetName || 'League Meet',
      event,
      time_seconds: parseFloat(timeSeconds),
      wind_ms: windMs ? parseFloat(windMs) : null,
    });
    setTimeSeconds('');
    setWindMs('');
    setSaving(false);
    onSaved();
  }

  const eventsWithData = useMemo(() => {
    const map: Record<string, any[]> = {};
    races.forEach((r) => {
      if (!map[r.event]) map[r.event] = [];
      map[r.event].push(r);
    });
    return map;
  }, [races]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddRace} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-emerald-400">Log Race Performance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <input type="date" required value={raceDate} onChange={(e) => setRaceDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2" />
          <input type="text" placeholder="Meeting Name" value={meetName} onChange={(e) => setMeetName(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2" />
          <select value={event} onChange={(e) => setEvent(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2">
            {[...FLAT_EVENTS, ...HURDLE_EVENTS].map((ev) => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
          <input type="number" step="0.01" required placeholder="Time (sec)" value={timeSeconds} onChange={(e) => setTimeSeconds(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2" />
          <input type="number" step="0.1" placeholder="Wind (m/s)" value={windMs} onChange={(e) => setWindMs(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2.5 py-2" />
        </div>
        <button disabled={saving} type="submit" className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg">
          <Plus className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Race Time'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(eventsWithData).map(([ev, evRaces]) => (
          <AthleteEventChartCard key={ev} event={ev} evRaces={evRaces} wellnessByDate={wellnessByDate} />
        ))}
      </div>
    </div>
  );
}
