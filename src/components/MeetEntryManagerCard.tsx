'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getEventsForDiscipline } from '@/lib/disciplines';
import { MapPin, Calendar, Plus, Trash2, Copy, Check } from 'lucide-react';

function getFedBadge(fed: string) {
  if (fed.includes('ASA')) return 'bg-amber-400/20 text-amber-300 border-amber-400/40';
  if (fed.includes('Western Province')) return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  if (fed.includes('Boland')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  return 'bg-slate-800 text-slate-300 border-slate-700';
}

export default function MeetEntryManagerCard({
  meet,
  entries,
  athletes,
  discipline = 'sprints',
  onSaved,
}: {
  meet: any;
  entries: any[];
  athletes: any[];
  discipline?: string | null;
  onSaved: () => void;
}) {
  const availableEvents = getEventsForDiscipline(discipline);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [chosenEvents, setChosenEvents] = useState<string[]>([]);
  const [targetNotes, setTargetNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const athleteMap = new Map<string, any>();
  athletes.forEach((a) => athleteMap.set(a.id, a));

  function toggleEvent(ev: string) {
    setChosenEvents((prev) => (prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]));
  }

  async function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAthleteId || chosenEvents.length === 0) return;
    setSaving(true);

    await supabase.from('meet_entries').upsert(
      {
        meet_id: meet.id,
        athlete_id: selectedAthleteId,
        events: chosenEvents,
        target_notes: targetNotes.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'meet_id,athlete_id' }
    );

    setSelectedAthleteId('');
    setChosenEvents([]);
    setTargetNotes('');
    setSaving(false);
    onSaved();
  }

  async function removeEntry(entryId: string) {
    await supabase.from('meet_entries').delete().eq('id', entryId);
    onSaved();
  }

  async function deleteMeet() {
    if (!confirm(`Delete "${meet.meet_name}" and all its entries?`)) return;
    await supabase.from('meets').delete().eq('id', meet.id);
    onSaved();
  }

  function copyEntrySheet() {
    const lines = [
      `🏆 *${meet.meet_name.toUpperCase()}* (${meet.federation})`,
      `📅 ${meet.meet_date}${meet.venue ? ` • 📍 ${meet.venue}` : ''}`,
      '',
      ...entries.map((en) => {
        const ath = athleteMap.get(en.athlete_id);
        const name = ath ? `${ath.full_name} (${ath.grade || ath.age ? `${ath.age}y` : ''})` : 'Athlete';
        return `• ${name}: ${(en.events || []).join(', ')}${en.target_notes ? ` — [${en.target_notes}]` : ''}`;
      }),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
      <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-white">{meet.meet_name}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getFedBadge(meet.federation)}`}>
              {meet.federation}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> {meet.meet_date}</span>
            {meet.venue && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-400" /> {meet.venue}</span>}
            {meet.notes && <span className="text-slate-300">• {meet.notes}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={copyEntrySheet} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold px-2.5 py-1.5 rounded-lg">
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Entry Sheet</>}
          </button>
          <button type="button" onClick={deleteMeet} title="Delete Meet" className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Assign Athlete Entry Form */}
      <form onSubmit={saveEntry} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            required
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-semibold"
          >
            <option value="">+ Select Athlete to Enter...</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.grade || ''} {a.gender || ''})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Target / Heat Note (e.g. Sub 10.45s • Lane 4)"
            value={targetNotes}
            onChange={(e) => setTargetNotes(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {availableEvents.map((ev) => {
            const active = chosenEvents.includes(ev);
            return (
              <button
                key={ev}
                type="button"
                onClick={() => toggleEvent(ev)}
                className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                  active
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                {ev}
              </button>
            );
          })}
        </div>

        <button
          disabled={saving || !selectedAthleteId || chosenEvents.length === 0}
          type="submit"
          className="inline-flex items-center gap-1 bg-emerald-500 disabled:opacity-40 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Enter Athlete in Selected Events'}
        </button>
      </form>

      {/* Entered Squad Roster */}
      {entries.length > 0 ? (
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
          {entries.map((en) => {
            const ath = athleteMap.get(en.athlete_id);
            return (
              <div key={en.id} className="bg-slate-950/60 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-white">{ath?.full_name || 'Athlete'}</span>
                  <span className="text-slate-400 ml-1.5 text-[11px]">
                    ({ath?.grade || ''} {ath?.age ? `• ${ath.age}y` : ''})
                  </span>
                  {en.target_notes && (
                    <span className="ml-2 text-amber-300 text-[11px] font-semibold">• {en.target_notes}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(en.events || []).map((ev: string) => (
                    <span key={ev} className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-[11px]">
                      {ev}
                    </span>
                  ))}
                  <button type="button" onClick={() => removeEntry(en.id)} className="ml-1 text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 text-center py-2">No athletes entered into this meet yet.</p>
      )}
    </div>
  );
}
