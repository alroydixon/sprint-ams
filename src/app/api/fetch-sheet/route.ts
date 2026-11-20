import { NextResponse } from 'next/server';
import https from 'https';

function fetchTextWithRedirects(targetUrl: string, hops = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (hops > 5) return reject(new Error('Too many redirects from Google'));
    https
      .get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchTextWithRedirects(res.headers.location, hops + 1));
        }
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`Google returned HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawUrl = String(body?.url || '').trim();

    if (!rawUrl.includes('spreadsheets/d/')) {
      return NextResponse.json({ error: 'Please paste a valid Google Sheets URL.' }, { status: 400 });
    }

    let csvUrl = rawUrl;
    if (!rawUrl.includes('output=csv') && !rawUrl.includes('format=csv')) {
      const afterD = rawUrl.split('spreadsheets/d/').pop() || '';
      const sheetId = afterD.split('/').shift()?.split('?').shift() || '';
      const gidPart = rawUrl.includes('gid=')
        ? rawUrl.split('gid=').pop()?.split('&').shift()?.split('#').shift()
        : '0';
      const host = ['https://docs', 'google', 'com'].join('.');
const basePath = ['', 'spreadsheets', 'd', sheetId, 'export'].join('/');
csvUrl = `${host}${basePath}?format=csv&gid=${gidPart || '0'}`;
    }

    const csvText = await fetchTextWithRedirects(csvUrl);
    if (csvText.trim().startsWith('<!DOCTYPE html')) {
      return NextResponse.json(
        { error: 'Sheet is private. Set Share -> General Access -> Anyone with the link (Viewer).' },
        { status: 400 }
      );
    }

    return NextResponse.json({ csvText });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Could not fetch Google Sheet.' }, { status: 500 });
  }
}
