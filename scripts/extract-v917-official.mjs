import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const input = resolve('public/legacy/v9-17.html');
const html = readFileSync(input, 'utf8');
const match = html.match(/<script\b(?=[^>]*\bid=["']radarPayload["'])[^>]*>([\s\S]*?)<\/script>/i);
if (!match) throw new Error('V9.17 embedded radarPayload was not found');
const root = JSON.parse(match[1]);
if (!Array.isArray(root.official) || root.official.length !== 130) {
  throw new Error('Unexpected V9.17 official count: ' + root.official?.length);
}
const ids = new Set();
for (const row of root.official) {
  if (typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw new Error('Missing/duplicate official metric ID');
  ids.add(row.id);
  if (typeof row.value !== 'number' || !Number.isFinite(row.value)) throw new Error('Invalid metric value: ' + row.id);
  if (!row.unit || !row.period || !Number.isInteger(row.page) || row.page < 1 || row.page > 28 || row.source !== 'CRA57') {
    throw new Error('Missing provenance: ' + row.id);
  }
}
const out = {
  schema_version: '1.0',
  origin: 'V9.17 embedded payload (legacy preservation copy)',
  admission: 'SOURCE_TRANSCRIPTION_PENDING_VISUAL_QA',
  publication: 'CRA statistical quarterly 57, Spring 1405',
  total: root.official.length,
  groups: Object.fromEntries([...new Set(root.official.map(r => r.group))].map(k => [k, root.official.filter(r => r.group === k).length])),
  observations: root.official,
};
mkdirSync(resolve('public/data'), {recursive:true});
writeFileSync(resolve('public/data/v917-official-catalog.json'), JSON.stringify(out, null, 2) + '\n');
console.log('V9.17 official catalog: ' + out.total + ' entries, ' + ids.size + ' unique IDs');
