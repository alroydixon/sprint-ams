'use client';

import { formatMark } from '@/lib/disciplines';
import { X } from 'lucide-react';

export default function ManagerAthleteReadOnlyModal({
  athlete,
  races,
  discipline,
  onClose,
}: {
  athlete: any;
  races: any[];
  discipline: string;
  onClose: () => void;
}) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-base font-bold text-emerald-400">{athlete.full_name} — Read-Only Profile</h4>
            <p className="text-slate-400">
              {athlete.grade || ''} {athlete.age ? `• ${athlete.age} yrs` : ''} • {athlete.gender || ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <table className="w-full text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2">Date</th>
              <th>Event</th>
              <th>Mark / Time</th>
              <th>Wind</th>
              <th>Meet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {races.slice().reverse().map((r) => (
              <tr key={r.id}>
                <td className="py-2">{r.race_date}</td>
                <td className="font-bold text-emerald-400">{r.event}</td>
                <td className="font-mono font-bold text-white">{formatMark(Number(r.time_seconds), discipline)}</td>
                <td>{r.wind_ms ?? '—'}</td>
                <td className="text-slate-400">{r.meet_name || '—'}</td>
              </tr>
            ))}
            {races.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  No recorded results for this athlete yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
