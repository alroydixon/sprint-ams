'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getEventsForDiscipline,
  isFieldDiscipline,
  formatMark,
  parseMarkInput,
} from '@/lib/disciplines';
import AthleteEventChartCard from './AthleteEventChartCard';

export default function AthleteRacesTab({
  athleteId,
  discipline = 'sprints',
  races,
  wellness = [],
  onSaved,
}: {
  athleteId: string;
  discipline?: string | null;
  races: any[];
  wellness?: any[];
  onSaved: () => void;
}) {
  const events = getEventsForDiscipline(discipline);
  const isField = isFieldDiscipline(discipline);

  const [event, setEvent] = useState(events.at(0) || '100m');
  const [raceDate, setRaceDate] = useState(new Date().toISOString().slice(0, 10));
  const [markInput, setMarkInput] = useState('');
  const [wind, setWind] = useState('');
  const [meetName, setMeetName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const list = getEventsForDiscipline(discipline);
    if (list.length > 0 && !list.includes(event)) {
      setEvent(list.at(0)!);
    }
  }, [discipline]);

  async function addRace(e: React.FormEvent) {
    e.preventDefault();
    const numericVal = parseMarkInput(markInput);
    if (!numericVal || isNaN(numericVal) || numericVal <= 0) return;
    setSaving(true);

    await supabase.from('race_results').insert({
      athlete_id: athleteId,
      event,
      race_date: raceDate,
      time_seconds: numericVal,
      wind_ms: wind ? parseFloat(wind) : null,
      meet_name: meetName.trim() || null,
    });

    setMarkInput('');
    setWind('');
    setMeetName('');
    setSaving(false);
    onSaved();
  }

  const wellnessByDate = new Map<string, any>();
  wellness.forEach((w) => wellnessByDate.set(w.log_date, w));

  const byEvent: Record<string, any[]> = {};
  races.forEach((r) => {
    if (!byEvent[r.event]) byEvent[r.event] = [];
    byEvent[r.event].push(r);
  });

  const placeholderText = isField
    ? 'Mark e.g. 7.42 or 58.90'
    : discipline === 'distance'
    ? 'Time e.g. 1:52.40 or 4:05.12'
    : 'Time (s) e.g. 10.39';

  return (
    <div className="space-y-6">
      <form onSubmit={addRace} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-emerald-400">
          {isField ? 'Log New Competition Mark' : 'Log New Race Performance'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <select value={event} onChange={(e) => setEvent(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2">
            {events.map((ev) => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
          <input required type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2" />
          <input
            required
            type="text"
            placeholder={placeholderText}
            value={markInput}
            onChange={(e) => setMarkInput(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
          <input
            type="number"
            step="0.1"
            placeholder={isField ? 'Wind (m/s) opt.' : 'Wind (m/s)'}
            value={wind}
            onChange={(e) => setWind(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
          <input type="text" placeholder="Meet / Competition" value={meetName} onChange={(e) => setMeetName(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2" />
        </div>
        <button disabled={saving} type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg">
          {saving ? 'Saving...' : isField ? '+ Add Competition Mark' : '+ Add Race Result'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(byEvent).map(([ev, evRaces]) => (
          <AthleteEventChartCard
            key={ev}
            event={ev}
            evRaces={evRaces}
            wellnessByDate={wellnessByDate}
            discipline={discipline}
          />
        ))}
        {Object.keys(byEvent).length === 0 && (
          <p className="text-xs text-slate-500 col-span-2 text-center py-6">
            {isField ? 'No competition marks logged in this date range.' : 'No race results logged in this date range.'}
          </p>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <h3 className="font-bold text-sm text-emerald-400 mb-3">
          {isField ? 'Competition Mark History' : 'Race History'}
        </h3>
        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2">Date</th>
              <th>Event</th>
              <th>{isField ? 'Mark' : 'Time'}</th>
              <th>Wind</th>
              <th>Meet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {races.slice().reverse().map((r) => (
              <tr key={r.id}>
                <td className="py-2">{r.race_date}</td>
                <td className="font-semibold text-emerald-400">{r.event}</td>
                <td className="font-mono font-bold">{formatMark(Number(r.time_seconds), discipline)}</td>
                <td>{r.wind_ms !== null && r.wind_ms !== undefined ? `${r.wind_ms} m/s` : '—'}</td>
                <td className="text-slate-400">{r.meet_name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
