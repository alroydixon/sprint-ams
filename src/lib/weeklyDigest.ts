export interface WeeklyDigestData {
  periodLabel: string;
  squadVolumeM: number;
  newPbs: { athleteName: string; event: string; time: number; prevBest: number | null; date: string }[];
  readinessFlags: { athleteName: string; score: number; level: 'Red' | 'Amber'; soreAreas: string[]; date: string }[];
  activeMedical: { athleteName: string; injuryArea: string; status: string }[];
  whatsappText: string;
  emailSubject: string;
  emailBody: string;
}

export function generateWeeklyDigest(
  coachName: string,
  activeAthletes: any[],
  allRaces: any[],
  allWellness: any[],
  allSessions: any[],
  allMedical: any[]
): WeeklyDigestData {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const endStr = now.toISOString().slice(0, 10);
  const startStr = sevenDaysAgo.toISOString().slice(0, 10);
  const periodLabel = `${startStr} to ${endStr}`;

  const activeMap = new Map<string, any>();
  activeAthletes.forEach((a) => activeMap.set(a.id, a));

  // 1. Weekly Squad Volume (m)
  let squadVolumeM = 0;
  allSessions.forEach((s) => {
    if (!activeMap.has(s.athlete_id)) return;
    if (s.session_date >= startStr && s.session_date <= endStr) {
      const vol = (s.training_runs || []).reduce((acc: number, r: any) => acc + Number(r.distance_m), 0);
      squadVolumeM += vol;
    }
  });

  // 2. New Personal Bests in the last 7 days
  const newPbs: WeeklyDigestData['newPbs'] = [];
  activeAthletes.forEach((ath) => {
    const athRaces = allRaces.filter((r) => r.athlete_id === ath.id);
    const events = Array.from(new Set(athRaces.map((r) => r.event)));

    events.forEach((ev) => {
      const evRaces = athRaces.filter((r) => r.event === ev);
      const recentRaces = evRaces.filter((r) => r.race_date >= startStr && r.race_date <= endStr);
      if (recentRaces.length === 0) return;

      const priorRaces = evRaces.filter((r) => r.race_date < startStr);
      const bestRecent = recentRaces.reduce((best, cur) =>
        Number(cur.time_seconds) < Number(best.time_seconds) ? cur : best
      );
      const bestRecentTime = Number(bestRecent.time_seconds);

      if (priorRaces.length === 0) {
        newPbs.push({
          athleteName: ath.full_name,
          event: ev,
          time: bestRecentTime,
          prevBest: null,
          date: bestRecent.race_date,
        });
      } else {
        const prevBest = Math.min(...priorRaces.map((r) => Number(r.time_seconds)));
        if (bestRecentTime < prevBest) {
          newPbs.push({
            athleteName: ath.full_name,
            event: ev,
            time: bestRecentTime,
            prevBest,
            date: bestRecent.race_date,
          });
        }
      }
    });
  });

  // 3. Readiness Flags (latest check-in per active athlete in the last 7 days)
  const readinessFlags: WeeklyDigestData['readinessFlags'] = [];
  activeAthletes.forEach((ath) => {
    const recentLogs = allWellness
      .filter((w) => w.athlete_id === ath.id && w.log_date >= startStr && w.log_date <= endStr)
      .sort((a, b) => b.log_date.localeCompare(a.log_date));

    const latest = recentLogs.at(0);
    if (!latest) return;

    const areas: any[] = Array.isArray(latest.sore_areas) ? latest.sore_areas : [];
    const soreLabels = areas.map((z) => `${z.label} (L${z.level})`);

    if (latest.composite_score < 38 || soreLabels.length > 0) {
      readinessFlags.push({
        athleteName: ath.full_name,
        score: latest.composite_score,
        level: latest.composite_score < 28 ? 'Red' : 'Amber',
        soreAreas: soreLabels,
        date: latest.log_date,
      });
    }
  });

  // Sort Red flags first
  readinessFlags.sort((a, b) => a.score - b.score);

  // 4. Active Medical & Rehab Cases
  const activeMedical: WeeklyDigestData['activeMedical'] = allMedical
    .filter((m) => !m.is_cleared && activeMap.has(m.athlete_id))
    .map((m) => ({
      athleteName: activeMap.get(m.athlete_id)?.full_name || 'Athlete',
      injuryArea: m.injury_area,
      status: m.status,
    }));

  // 5. Build WhatsApp & Email formatted messages
  const lines: string[] = [
    `*SPRINT AMS — WEEKLY SQUAD DIGEST*`,
    `Coach: ${coachName}`,
    `Period: ${periodLabel}`,
    `Active Squad: ${activeAthletes.length} runners | Weekly Volume: ${squadVolumeM}m`,
    ``,
    `*NEW PERSONAL BESTS (${newPbs.length})*`,
    ...(newPbs.length > 0
      ? newPbs.map(
          (p) =>
            `• ${p.athleteName} — ${p.event}: *${p.time.toFixed(2)}s*${
              p.prevBest ? ` (prev ${p.prevBest.toFixed(2)}s)` : ' (1st mark)'
            }`
        )
      : ['• No new PBs recorded in the past 7 days']),
    ``,
    `*READINESS & BODY MAP FLAGS (${readinessFlags.length})*`,
    ...(readinessFlags.length > 0
      ? readinessFlags.map(
          (f) =>
            `• [${f.level.toUpperCase()}] ${f.athleteName}: ${f.score}/50${
              f.soreAreas.length > 0 ? ` — Sore: ${f.soreAreas.join(', ')}` : ''
            }`
        )
      : ['• All checked-in athletes are Green (Ready)']),
    ``,
    `*ACTIVE MEDICAL / REHAB (${activeMedical.length})*`,
    ...(activeMedical.length > 0
      ? activeMedical.map((m) => `• ${m.athleteName}: ${m.injuryArea} (${m.status})`)
      : ['• No active injuries reported']),
  ];

  const whatsappText = lines.join('\n');
  const emailSubject = `Sprint AMS Weekly Squad Summary (${periodLabel})`;
  const emailBody = whatsappText.replace(/\*/g, '');

  return {
    periodLabel,
    squadVolumeM,
    newPbs,
    readinessFlags,
    activeMedical,
    whatsappText,
    emailSubject,
    emailBody,
  };
}
