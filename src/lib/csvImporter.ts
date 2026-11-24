import { supabase } from './supabase';
import {
  parseNum,
  normalizeAthleteAlias,
  normalizeEventCode,
  parseRaceMark,
  parseFlexibleDate,
} from './csvParsingHelpers';

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

  let lastKnownDate = new Date().toISOString().slice(0, 10);
  let lastKnownMeet = 'Imported Meet';

  for (const row of previewRows) {
    const keys = Object.keys(row);

    const dateKey =
      keys.find((k) => ['date', 'race date', 'meet date', 'competition date'].includes(k.trim().toLowerCase())) ||
      keys.find((k) => k.trim().toLowerCase().startsWith('date')) ||
      keys.find((k) => k.trim().toLowerCase() === 'timestamp');

    const meetKey = keys.find((k) =>
      ['meeting', 'meet', 'competition', 'venue', 'athletics meeting'].includes(k.trim().toLowerCase())
    );

    if (dateKey && row[dateKey]) {
      const parsedDate = parseFlexibleDate(String(row[dateKey]));
      if (parsedDate) lastKnownDate = parsedDate;
    }
    if (meetKey && String(row[meetKey] || '').trim()) {
      lastKnownMeet = String(row[meetKey]).trim();
    }

    const nameKey =
      keys.find((k) =>
        ['athlete name', 'athlete name (select)', 'athlete_name', 'full name', 'name', 'athlete'].includes(k.trim().toLowerCase())
      ) || keys.find((k) => k.toLowerCase().includes('name') && !k.toLowerCase().includes('meet'));

    const rawName = nameKey ? String(row[nameKey] || '').trim() : '';
    if (!rawName) continue;

    const cleanName = normalizeAthleteAlias(rawName);
    const key = cleanName.toLowerCase();
    let athlete = rosterMap.get(key);

    if (!athlete) {
      const { data: newProf, error } = await supabase
        .from('profiles')
        .insert({
          full_name: cleanName,
          role: 'athlete',
          coach_id: user.id,
          grade: row['Grade'] || row['grade'] || row['Age group '] || row['Age group'] || null,
          age: row['Age'] ? parseInt(row['Age']) : null,
          gender: row['Gender'] || row['gender'] || row['Sex'] || null,
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

    const isoDate = lastKnownDate;
    const meetName = lastKnownMeet;
    const windKey = keys.find((k) => k.trim().toLowerCase().includes('wind'));
    const windVal = windKey ? parseNum(row[windKey]) : NaN;

    const eventColKey = keys.find((k) => ['event', 'race event', 'discipline', 'distance'].includes(k.trim().toLowerCase()));
    const timeColKey = keys.find((k) => ['time', 'race time', 'result', 'performance', 'time (s)', 'seconds'].includes(k.trim().toLowerCase()));

    if (eventColKey && timeColKey && row[eventColKey] && row[timeColKey]) {
      const evCode = normalizeEventCode(String(row[eventColKey]));
      let val = parseRaceMark(row[timeColKey]);
      if (evCode === '400m' && val > 180) val = +(val / 60).toFixed(2);
      if (evCode && val > 0 && val < 3600) {
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

    for (const col of keys) {
      const evCode = normalizeEventCode(col);
      if (!evCode) continue;
      let val = parseRaceMark(row[col]);
      if (evCode === '400m' && val > 180) val = +(val / 60).toFixed(2);
      if (val > 0 && val < 3600) {
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
  }

  const chunkSize = 500;
  const raceBatch = Array.from(raceMap.values());
  for (let i = 0; i < raceBatch.length; i += chunkSize) {
    const chunk = raceBatch.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('race_results')
      .upsert(chunk, { onConflict: 'athlete_id,race_date,event,time_seconds' });
    if (!error) insertedRecords += chunk.length;
    else lastError = error.message;
  }

  const eventsList = Array.from(matchedEvents).join(', ') || 'None';
  return `Done! Parsed ${previewRows.length} rows → Saved ${insertedRecords} records (${raceBatch.length} races across: ${eventsList}).${lastError ? ` (Error: ${lastError})` : ''}`;
}
