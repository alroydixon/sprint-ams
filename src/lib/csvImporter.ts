import { supabase } from './supabase';

function parseNum(val: any): number {
  if (val === null || val === undefined) return NaN;
  const cleaned = String(val).trim().replace(',', '.').replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned);
}

function normalizeEventCode(rawHeaderOrValue: string): string | null {
  const h = rawHeaderOrValue.trim().toLowerCase().replace(/\s+/g, '');
  if (!h || h.startsWith('20m') || h.startsWith('40m')) return null;

  // Match English ("hurdle", "hudle" typo, "100mh") AND Afrikaans ("hekkies", "hekkie")
  const isHurdle =
    h.includes('hurdle') ||
    h.includes('hudle') ||
    h.includes('hekkie') ||
    /^(80|90|100|110|300|400)mh/.test(h);

  if (isHurdle) {
    if (h.includes('80')) return '80mH';
    if (h.includes('90')) return '90mH';
    if (h.includes('100')) return '100mH';
    if (h.includes('110')) return '110mH';
    if (h.includes('300')) return '300mH';
    if (h.includes('400')) return '400mH';
  }

  // Flat sprints
  if (h.startsWith('60m') || h === '60') return '60m';
  if (h.startsWith('100m') || h === '100') return '100m';
  if (h.startsWith('150m') || h === '150') return '150m';
  if (h.startsWith('200m') || h === '200') return '200m';
  if (h.startsWith('300m') || h === '300') return '300m';
  if (h.startsWith('400m') || h === '400') return '400m';

  return null;
}

function parseFlexibleDate(raw: string): string {
  const clean = raw.trim().split(' ').shift() || '';
  if (!clean) return new Date().toISOString().slice(0, 10);

  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts.at(0)!.length === 4) {
        const [yr, m, d] = parts;
        return `${yr}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      const [p1, p2, yr] = parts;
      const m = Number(p1) > 12 ? p2 : Number(p2) > 12 ? p1 : p2;
      const d = Number(p1) > 12 ? p1 : Number(p2) > 12 ? p2 : p1;
      return `${yr.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3 && parts.at(2)!.length === 4) {
      const [p1, p2, yr] = parts;
      const m = Number(p1) > 12 ? p2 : Number(p2) > 12 ? p1 : p2;
      const d = Number(p1) > 12 ? p1 : Number(p2) > 12 ? p2 : p1;
      return `${yr}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return clean;
  }
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export async function importSquadRows(previewRows: any[], existingAthletes: any[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Error: Not signed in.';

  const rosterMap = new Map<string, any>();
  existingAthletes.forEach((a) => rosterMap.set(a.full_name.trim().toLowerCase(), a));

  let createdAthletes = 0;
  let insertedRecords = 0;
  let lastError = '';

  const testBatch: any[] = [];
  const raceMap = new Map<string, any>();
  const wellnessMap = new Map<string, any>();
  const matchedEvents = new Set<string>();

  for (const row of previewRows) {
    const keys = Object.keys(row);
    const nameKey =
      keys.find((k) => ['athlete name', 'athlete_name', 'full name', 'name', 'athlete'].includes(k.trim().toLowerCase())) ||
      keys.find((k) => k.toLowerCase().includes('name') && !k.toLowerCase().includes('meet'));

    const rawName = nameKey ? String(row[nameKey] || '').trim().replace(/\s+/g, ' ') : '';
    if (!rawName) continue;
    const key = rawName.toLowerCase();

    let athlete = rosterMap.get(key);

    if (!athlete) {
      const { data: newProf, error } = await supabase
        .from('profiles')
        .insert({
          full_name: rawName,
          role: 'athlete',
          coach_id: user.id,
          grade: row['Grade'] || row['grade'] || null,
          age: row['Age'] ? parseInt(row['Age']) : null,
          gender: row['Gender'] || row['gender'] || null,
          body_weight_kg: parseNum(row['Body Weight']) || null,
        })
        .select()
        .single();

      if (!error && newProf) {
        athlete = newProf;
        rosterMap.set(key, newProf);
        createdAthletes++;
      } else {
        if (error) lastError = error.message;
        continue;
      }
    }

    const dateKey =
      keys.find((k) => ['date', 'race date', 'meet date', 'competition date'].includes(k.trim().toLowerCase())) ||
      keys.find((k) => k.trim().toLowerCase() === 'timestamp');
    const isoDate = dateKey && row[dateKey] ? parseFlexibleDate(String(row[dateKey])) : new Date().toISOString().slice(0, 10);

    // Fitness tests
    const bw = parseNum(row['Body Weight'] || row['Weight']);
    const pu = parseInt(row['Push Up'] || row['Push Ups'] || row['Pushups']);
    const su = parseInt(row['Sit Up'] || row['Sit Ups'] || row['Situps']);
    const sj = parseInt(row['Squat Jump'] || row['Squat Jumps']);
    const s20 = parseNum(row['20m Sprint'] || row['20m']);
    const s40 = parseNum(row['40m Sprint'] || row['40m']);
    const s60 = parseNum(row['60m Sprint'] || row['60m']);

    if (bw > 0 || pu > 0 || su > 0 || sj > 0 || s20 > 0 || s40 > 0) {
      testBatch.push({
        athlete_id: athlete.id,
        test_date: isoDate,
        body_weight_kg: bw || athlete.body_weight_kg || 60,
        pushups_1min_reps: pu > 0 ? pu : null,
        situps_1min_reps: su > 0 ? su : null,
        squat_jumps_1min_reps: sj > 0 ? sj : null,
        sprint_20m_s: s20 > 0 ? s20 : null,
        sprint_40m_s: s40 > 0 ? s40 : null,
        sprint_60m_s: s60 > 0 ? s60 : null,
      });
    }

    const meetKey = keys.find((k) => ['meeting', 'meet', 'competition', 'venue'].includes(k.trim().toLowerCase()));
    const windKey = keys.find((k) => k.trim().toLowerCase().includes('wind'));
    const meetName = meetKey && row[meetKey] ? String(row[meetKey]).trim() : 'Imported Meet';
    const windVal = windKey ? parseNum(row[windKey]) : NaN;

    // 1. Long format ("Event" + "Time")
    const eventColKey = keys.find((k) => ['event', 'race event', 'discipline', 'distance'].includes(k.trim().toLowerCase()));
    const timeColKey = keys.find((k) => ['time', 'race time', 'result', 'performance', 'time (s)', 'seconds'].includes(k.trim().toLowerCase()));

    if (eventColKey && timeColKey && row[eventColKey] && row[timeColKey]) {
      const evCode = normalizeEventCode(String(row[eventColKey]));
      const val = parseNum(row[timeColKey]);
      if (evCode && val > 0 && val < 120) {
        matchedEvents.add(evCode);
        raceMap.set(`${athlete.id}_${isoDate}_${evCode}_${val}`, {
          athlete_id: athlete.id,
          race_date: isoDate,
          meet_name: meetName,
          event: evCode,
          time_seconds: val,
          wind_ms: !isNaN(windVal) ? windVal : null,
        });
      }
    }

    // 2. Wide columns (matches "90M HURDLES", "100M HUDLES", "110M HURDLES", "300M HURDLES", "400M HURDLES", etc.)
    for (const col of keys) {
      const evCode = normalizeEventCode(col);
      if (!evCode) continue;
      const val = parseNum(row[col]);
      if (val > 0 && val < 120) {
        matchedEvents.add(evCode);
        raceMap.set(`${athlete.id}_${isoDate}_${evCode}_${val}`, {
          athlete_id: athlete.id,
          race_date: isoDate,
          meet_name: meetName,
          event: evCode,
          time_seconds: val,
          wind_ms: !isNaN(windVal) ? windVal : null,
        });
      }
    }

    // Wellness logs
    const hasWellness = row['Mood'] || row['Sleep'] || row['Soreness'] || row['Stress'];
    if (hasWellness) {
      const scaleVal = (v: any) => {
        const n = parseInt(v);
        if (!n || isNaN(n)) return 7;
        return n <= 5 ? n * 2 : Math.min(10, n);
      };

      wellnessMap.set(`${athlete.id}_${isoDate}`, {
        athlete_id: athlete.id,
        log_date: isoDate,
        sleep_quality: scaleVal(row['Sleep']),
        fatigue_level: scaleVal(row['Motivation'] || row['Fatigue']),
        muscle_soreness: scaleVal(row['Soreness']),
        stress_level: scaleVal(row['Stress']),
        mood: scaleVal(row['Mood']),
        session_rpe: row['RPE'] ? Math.min(10, parseInt(row['RPE'])) : 6,
        session_duration_mins: row['Duration'] ? parseInt(row['Duration']) : 60,
      });
    }
  }

  const chunkSize = 500;
  for (let i = 0; i < testBatch.length; i += chunkSize) {
    const chunk = testBatch.slice(i, i + chunkSize);
    const { error } = await supabase.from('fitness_tests').insert(chunk);
    if (!error) insertedRecords += chunk.length;
    else lastError = error.message;
  }

  const raceBatch = Array.from(raceMap.values());
  for (let i = 0; i < raceBatch.length; i += chunkSize) {
    const chunk = raceBatch.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('race_results')
      .upsert(chunk, { onConflict: 'athlete_id,race_date,event,time_seconds' });
    if (!error) insertedRecords += chunk.length;
    else lastError = error.message;
  }

  const wellnessBatch = Array.from(wellnessMap.values());
  for (let i = 0; i < wellnessBatch.length; i += chunkSize) {
    const chunk = wellnessBatch.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('wellness_logs')
      .upsert(chunk, { onConflict: 'athlete_id,log_date' });
    if (!error) insertedRecords += chunk.length;
    else lastError = error.message;
  }

  const eventsList = Array.from(matchedEvents).join(', ') || 'None';
  return `Done! Parsed ${previewRows.length} rows → Saved ${insertedRecords} records (${raceBatch.length} races across: ${eventsList}).${lastError ? ` (Error: ${lastError})` : ''}`;
}
