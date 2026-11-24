'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Trash2, Copy, Check, UserPlus } from 'lucide-react';

function normalizeEventsList(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  return String(raw || '')
    .split(/[,/&]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CoachMeetCard({
  meet,
  meetEntries,
  athletes,
  events,
  onChanged,
}: {
  meet: any;
  meetEntries: any[];
  athletes: any[];
  events: string[];
  onChanged: () => void;
}) {
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [entryNote, setEntryNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function toggleEvent(ev: string) {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((x) => x !== ev) : [...prev, ev]
    );
  }

  async function addEntry() {
    setFeedback(null);
    if (!selectedAthlete) {
      setFeedback({ type: 'err', text: 'Please select an athlete from the dropdown first.' });
      return;
    }
    if (selectedEvents.length === 0) {
      setFeedback({
        type: 'err',
        text: 'Please tap at least one event pill (e.g. 100m, 200m) before clicking Enter Athlete.',
      });
      return;
    }

    setSubmitting(true);
    const existing = meetEntries.find((ent) => ent.athlete_id === selectedAthlete);

    if (existing) {
      const prevEvents = normalizeEventsList(existing.events);
      const mergedArray = Array.from(new Set([...prevEvents, ...selectedEvents]));
      const mergedNotes = entryNote.trim() || existing.notes || null;

      const { error } = await supabase
        .from('meet_entries')
        .update({ events: mergedArray, notes: mergedNotes })
        .eq('id', existing.id);

      setSubmitting(false);
      if (error) {
        setFeedback({ type: 'err', text: `Could not update entry: ${error.message}` });
        return;
      }
      setFeedback({ type: 'ok', text: `✓ Updated athlete events to: ${mergedArray.join(', ')}` });
    } else {
      const { error } = await supabase.from('meet_entries').insert({
        meet_id: meet.id,
        athlete_id: selectedAthlete,
        events: selectedEvents,
        notes: entryNote.trim() || null,
      });

      setSubmitting(false);
      if (error) {
        setFeedback({ type: 'err', text: `Could not enter athlete: ${error.message}` });
        return;
      }
      setFeedback({ type: 'ok', text: `✓ Athlete added to ${meet.meet_name}!` });
    }

    setSelectedAthlete('');
    setSelectedEvents([]);
    setEntryNote('');
    onChanged();
  }

  async function removeEntry(entryId: string) {
    await supabase.from('meet_entries').delete().eq('id', entryId);
    onChanged();
  }

  async function deleteMeet() {
    await supabase.from('meet_entries').delete().eq('meet_id', meet.id);
    await supabase.from('meets').delete().eq('id', meet.id);
    onChanged();
  }

  function copyEntrySheet() {
    const lines = [
      `${meet.meet_name} (${meet.organization || 'Competition'}) — ${meet.meet_date}`,
      meet.location ? `Venue: ${meet.location}` : '',
      '---',
      ...meetEntries.map((ent, idx) => {
        const ath = athletes.find((a) => a.id === ent.athlete_id);
        const name = ath ? `${ath.full_name} (${ath.grade || ''})` : 'Athlete';
        const evStr = normalizeEventsList(ent.events).join(', ');
        return `${idx + 1}. ${name}: ${evStr}${ent.notes ? ` — ${ent.notes}` : ''}`;
      }),
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-sm text-white">{meet.meet_name}</strong>
            {meet.organization && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
                {meet.organization}
              </span>
            )}
          </div>
          <p className="text-slate-400 flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> {meet.meet_date}
            </span>
            {meet.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" /> {meet.location}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyEntrySheet}
            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Sheet</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Copy Entry Sheet</>
            )}
          </button>
          <button
            type="button"
            onClick={deleteMeet}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={selectedAthlete}
            onChange={(e) => setSelectedAthlete(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          >
            <option value="">+ Select Athlete to Enter...</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.grade || '—'})
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Target / Heat Note (e.g. Sub 10.45s • Lane 4)"
            value={entryNote}
            onChange={(e) => setEntryNote(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {events.map((ev) => (
              <button
                key={ev}
                type="button"
                onClick={() => toggleEvent(ev)}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  selectedEvents.includes(ev)
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {ev}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={addEntry}
            className="inline-flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded-lg"
          >
            <UserPlus className="w-3.5 h-3.5" /> {submitting ? 'Saving...' : 'Enter Athlete'}
          </button>
        </div>

        {feedback && (
          <p className={`p-2 rounded border font-semibold ${feedback.type === 'ok' ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-rose-950/60 border-rose-700 text-rose-300'}`}>
            {feedback.text}
          </p>
        )}
      </div>

      {meetEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {meetEntries.map((ent) => {
            const ath = athletes.find((a) => a.id === ent.athlete_id);
            const evDisplay = normalizeEventsList(ent.events).join(', ');
            return (
              <div
                key={ent.id}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2"
              >
                <div>
                  <strong className="text-white">{ath?.full_name || 'Athlete'}</strong>
                  <span className="text-emerald-400 font-bold ml-2">{evDisplay}</span>
                  {ent.notes && <span className="text-slate-400 block text-[11px]">{ent.notes}</span>}
                </div>
                <button type="button" onClick={() => removeEntry(ent.id)} className="text-rose-400 hover:text-rose-300 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
