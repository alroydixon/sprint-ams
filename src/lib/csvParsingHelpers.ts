export function parseNum(val: any): number {
  if (val === null || val === undefined) return NaN;
  const cleaned = String(val).trim().replace(',', '.').replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned);
}

export function normalizeAthleteAlias(rawName: string): string {
  const clean = rawName.trim().replace(/\s+/g, ' ');
  const low = clean.toLowerCase();
  if (low === 'elmira') return 'Elmira Doysen';
  if (low === 'emmoray van wyk') return 'Emmorray Van Wyk';
  if (low === 'mandraunique willems') return 'Mandraunique Williams';
  if (low === 'mickalya fritz') return 'Mikyla Fritz';
  return clean;
}

export function normalizeEventCode(rawHeaderOrValue: string): string | null {
  const h = rawHeaderOrValue.trim().toLowerCase().replace(/\s+/g, '');
  if (!h || h.startsWith('20m') || h.startsWith('40m')) return null;

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

  // Steeplechase
  if (h.includes('steeple') || h.includes('hindernis') || h.endsWith('msc')) {
    if (h.includes('1500')) return '1500mSC';
    if (h.includes('2000')) return '2000mSC';
    return '3000mSC';
  }

  // Mile
  if (h === 'mile' || h === '1mile' || h.includes('1mile')) return '1 Mile';

  // Flat sprints & middle/long distance
  if (h.startsWith('60m') || h === '60') return '60m';
  if (h.startsWith('100m') || h === '100') return '100m';
  if (h.startsWith('150m') || h === '150') return '150m';
  if (h.startsWith('200m') || h === '200') return '200m';
  if (h.startsWith('300m') || h === '300') return '300m';
  if (h.startsWith('400m') || h === '400') return '400m';
  if (h.startsWith('600m') || h === '600') return '600m';
  if (h.startsWith('800m') || h === '800') return '800m';
  if (h.startsWith('1000m') || h === '1000') return '1000m';
  if (h.startsWith('1200m') || h === '1200') return '1200m';
  if (h.startsWith('1500m') || h === '1500') return '1500m';
  if (h.startsWith('2000m') || h === '2000') return '2000m';
  if (h.startsWith('3000m') || h === '3000') return '3000m';
  if (h.startsWith('5000m') || h === '5000') return '5000m';
  if (h.startsWith('10000m') || h === '10000') return '10000m';

  // Jumps & Throws
  if (h.includes('longjump') || h === 'lj') return 'Long Jump';
  if (h.includes('triplejump') || h === 'tj') return 'Triple Jump';
  if (h.includes('highjump') || h === 'hj') return 'High Jump';
  if (h.includes('polevault') || h === 'pv') return 'Pole Vault';
  if (h.includes('shotput') || h === 'sp') return 'Shot Put';
  if (h.includes('discus')) return 'Discus';
  if (h.includes('javelin')) return 'Javelin';
  if (h.includes('hammer')) return 'Hammer Throw';

  return null;
}

export function parseRaceMark(raw: any): number {
  if (raw === null || raw === undefined) return NaN;
  const s = String(raw).trim().replace(/[*a-zA-Z\s]/g, '');
  if (!s) return NaN;

  // Handle "58:39:00" or "2:44:00" Excel mm:ss:00 formatting
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) {
    const [a, b, c] = s.split(':').map(Number);
    if (c === 0) return +(a * 60 + b).toFixed(2);
    return +(a * 60 + b + c / 100).toFixed(2);
  }

  // Handle "2:12.37" or "10:33.97" or "5:19"
  if (s.includes(':')) {
    const [mStr, sStr] = s.split(':');
    const mins = parseInt(mStr, 10);
    const secs = parseFloat(sStr.replace(',', '.'));
    if (isNaN(mins) || isNaN(secs)) return NaN;
    return +(mins * 60 + secs).toFixed(2);
  }

  // Handle double-dot typos like "2.12.84" or "19.27.38"
  const dotParts = s.split('.');
  if (dotParts.length === 3) {
    const mins = parseInt(dotParts.at(0)!, 10);
    const secs = parseFloat(`${dotParts.at(1)}.${dotParts.at(2)}`);
    if (!isNaN(mins) && !isNaN(secs)) return +(mins * 60 + secs).toFixed(2);
  }

  return parseFloat(s.replace(',', '.'));
}

export function parseFlexibleDate(raw: string): string | null {
  let clean = raw.trim().replace(/\s*\/\s*/g, '/');
  if (!clean || /^\d{4}$/.test(clean)) return null;

  // Handle multi-day ranges like "27-28/02/2026" or "02-04/04/2026"
  clean = clean.replace(/^(\d{1,2})-\d{1,2}\//, '$1/');

  if (clean.includes('/')) {
    const parts = clean.split(' ').at(0)!.split('/');
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

  const parsed = new Date(clean.replace(/^(\d{1,2})\s*-\s*\d{1,2}\s+/, '$1 '));
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}
