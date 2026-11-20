'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { importSquadRows } from '@/lib/csvImporter';
import { calculatePower, calculateHorizontalForce } from '@/lib/biomechanics';
import { Upload, Link2, Download, Printer } from 'lucide-react';

export default function CoachImportExportTab({
  athletes,
  races,
  tests,
  onImported,
}: {
  athletes: any[];
  races: any[];
  tests: any[];
  onImported: () => void;
}) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [importing, setImporting] = useState(false);

  function parseCsvText(csvText: string) {
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    setPreviewRows(parsed.data || []);
    setStatusMsg(`Parsed ${parsed.data?.length || 0} rows ready for import.`);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseCsvText(String(ev.target?.result || ''));
    reader.readAsText(file);
  }

    async function handleGoogleSheetFetch() {
    if (!sheetUrl) return;
    setStatusMsg('Fetching Google Sheet...');
    try {
      const res = await fetch('/api/fetch-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || 'Could not fetch Google Sheet.');
        return;
      }
      parseCsvText(data.csvText);
    } catch {
      setStatusMsg('Network error fetching Google Sheet.');
    }
  }

  async function handleCommitImport() {
    if (previewRows.length === 0) return;
    setImporting(true);
    setStatusMsg('Importing athletes, tests, and races...');
    const summary = await importSquadRows(previewRows, athletes);
    setStatusMsg(summary);
    setPreviewRows([]);
    setImporting(false);
    onImported();
  }

  function handleExportCsv() {
    const exportRows = athletes.map((a) => {
      const aTests = tests.filter((t) => t.athlete_id === a.id);
      const lt = aTests[aTests.length - 1];
      const pwr = lt
        ? calculatePower(Number(lt.body_weight_kg), lt.pushups_1min_reps || 0, lt.situps_1min_reps || 0, lt.squat_jumps_1min_reps || 0)
        : null;
      const f20 = lt?.sprint_20m_s ? calculateHorizontalForce(Number(lt.body_weight_kg), 20, Number(lt.sprint_20m_s)) : null;

      const aRaces = races.filter((r) => r.athlete_id === a.id);
      const pb100 = aRaces.filter((r) => r.event === '100m').map((r) => Number(r.time_seconds));
      const pb200 = aRaces.filter((r) => r.event === '200m').map((r) => Number(r.time_seconds));

      return {
        Athlete: a.full_name,
        Grade: a.grade || '',
        Weight_kg: lt?.body_weight_kg || a.body_weight_kg || '',
        Total_Power_W: pwr?.totalW || '',
        Relative_Power_W_kg: pwr?.totalWPerKg || '',
        Force_20m_N: f20?.forceN || '',
        PB_100m_s: pb100.length ? Math.min(...pb100).toFixed(2) : '',
        PB_200m_s: pb200.length ? Math.min(...pb200).toFixed(2) : '',
      };
    });

    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `squad_performance_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <h3 className="font-bold text-sm text-emerald-400">Auto-Import Data (CSV File or Google Sheets Link)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 cursor-pointer bg-slate-950">
            <Upload className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="font-semibold">Upload .CSV Spreadsheet</span>
            <span className="text-slate-500 text-[11px]">Auto-creates missing athletes under your squad</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Link2 className="w-4 h-4 text-emerald-400" /> Google Sheets Published CSV URL
            </div>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://google.com"
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5"
            />
            <button type="button" onClick={handleGoogleSheetFetch} className="w-full bg-slate-800 hover:bg-slate-700 py-1.5 rounded font-semibold">
              Fetch Sheet Rows
            </button>
          </div>
        </div>

        {statusMsg && <p className="text-xs text-amber-400">{statusMsg}</p>}

        {previewRows.length > 0 && (
          <button disabled={importing} onClick={handleCommitImport} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-lg text-xs">
            {importing ? 'Importing...' : `Confirm & Import ${previewRows.length} Rows into Database`}
          </button>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-emerald-400">Downloadable Squad Reports</h3>
          <p className="text-xs text-slate-400">Export live Power, Force, and Personal Best spreadsheets or print PDF feedback sheets.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCsv} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-2 rounded-lg text-xs">
            <Download className="w-3.5 h-3.5" /> Export Squad CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs">
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
