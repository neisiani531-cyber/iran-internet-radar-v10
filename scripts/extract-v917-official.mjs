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
const officialCompanion = {
 schema_version:'1.0',source:'CRA57',publication_status:'TRANSCRIBED_VISUAL_QA_PENDING',
 operators:root.operators.map(({color,marketShare,...operator})=>operator),
 fiber_coverage_history:root.coverage,
 fixed_technology_latest:root.technology,
 latency_quality:root.quality,
 fixed_technology_history:root.fixedTechnologyTimeSeries,
 totals:{operators:root.operators.length,fiber_periods:root.coverage.length,technologies:root.technology.length,quality_rows:root.quality.length}
};
if(officialCompanion.operators.length!==3||officialCompanion.fiber_coverage_history.length!==10||officialCompanion.latency_quality.length!==4||officialCompanion.fixed_technology_history.periods.length!==5)throw Error('Unexpected V9.17 official companion structure');
writeFileSync(resolve('public/data/v917-official-companion.json'),JSON.stringify(officialCompanion,null,2)+'\n');

// A separated, explicitly provisional research preview. No raw evidence library or study
// documents are exported from the legacy payload to the public site.
const tor = root.research.tor;
if(!Array.isArray(tor)||tor.length!==25||tor.some(x=>!/^20\d{2}-\d{2}-\d{2}$/.test(x.date)||!Number.isInteger(x.users)||!Number.isFinite(x.frac)||x.frac<0||x.frac>110))throw Error('Tor legacy observations failed validation');
const torDates=new Set(tor.map(x=>x.date));
if(torDates.size!==25||torDates.has('2025-06-27'))throw Error('Tor source gap was erased or duplicated');
const tic = root.research.tic;
if(!Array.isArray(tic.quarterly)||tic.quarterly.length===0)throw Error('Missing TIC quarterly series');
const researchPreview = {
 schema_version:'1.0',
 admission:'RESEARCH_EXPLORATORY_NOT_Q5',
 not_official_cra:true,
 source:'V9.17 curated legacy research preview',
 tor:{rows:tor,expected_missing_date:'2025-06-27',frac_domain:[0,110],note:'Tor frac is not a percentage constrained to 100'},
 tic:{quarterly:tic.quarterly,validation:'REQUIRES_SOURCE_MATCHING'},
 mechanisms:root.research.mechanisms.map(x=>({id:x.id,name:x.name,status:'RESEARCH_HYPOTHESIS'})),
 totals:{tor_rows:tor.length,tic_quarters:tic.quarterly.length,mechanisms:root.research.mechanisms.length}
};
writeFileSync(resolve('public/data/v917-research-exploratory.json'),JSON.stringify(researchPreview,null,2)+'\n');
const migrationAudit={
 version:'V9.17',status:'PARTIAL_NATIVE_MIGRATION',
 public_official:{official_metrics:root.official.length,operator_snapshots:root.operators.length,fiber_coverage_points:root.coverage.length,technologies:root.technology.length,latency_rows:root.quality.length,fixed_periods:root.fixedTechnologyTimeSeries.periods.length},
 public_exploratory:{tor:tor.length,tic_quarters:tic.quarterly.length,mechanisms:root.research.mechanisms.length},
 restricted_not_exported:{legacy_evidence:root.evidence.length,legacy_sources:Object.keys(root.research.sources).length,legacy_conflicts:root.research.conflicts.length,githubCentralEvidence:root.research.githubCentralEvidence.length,surveys:root.research.surveyCrosswalkV94.length},
 note:'Counts are not mutually exclusive. Restricted record payloads are not exported into the new public contracts.'
};
writeFileSync(resolve('public/data/v917-migration-manifest.json'),JSON.stringify(migrationAudit,null,2)+'\n');
const pageIndex={schema_version:'1.0',source:'CRA57_V9.17',extraction:'LEGACY_PAGE_TEXT_PENDING_SOURCE_VISUAL_QA',pages:root.pdfPages.map(p=>({number:p.n,title:p.title,en:p.en,text:p.text}))};
if(pageIndex.pages.length!==28||new Set(pageIndex.pages.map(p=>p.number)).size!==28)throw Error('Bad report page index');
writeFileSync(resolve('public/data/v917-source-pages.json'),JSON.stringify(pageIndex,null,2)+'\n');
console.log('V9.17 official catalog: ' + out.total + ' entries, ' + ids.size + ' unique IDs');
