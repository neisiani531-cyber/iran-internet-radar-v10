import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const html=readFileSync(resolve('public/legacy/v9-17.html'),'utf8');
const match=html.match(/<script\b(?=[^>]*\bid=["']radarPayload["'])[^>]*>([\s\S]*?)<\/script>/i);
if(!match)throw Error('Missing canonical V9.17 data');
const src=JSON.parse(match[1]);
const load=(file)=>JSON.parse(readFileSync(resolve('public/data/'+file),'utf8'));
const catalog=load('v917-official-catalog.json');
const companion=load('v917-official-companion.json');
const manifest=load('v917-migration-manifest.json');
const research=load('v917-research-exploratory.json');
const pages=load('v917-source-pages.json');
const checks=[
 ['official 130',catalog.observations.length===130],
 ['official exact IDs',src.official.every((x,i)=>JSON.stringify(x)===JSON.stringify(catalog.observations[i]))],
 ['unique official IDs',new Set(catalog.observations.map(x=>x.id)).size===130],
 ['operators 3',companion.operators.length===3],
 ['coverage 10',companion.fiber_coverage_history.length===10],
 ['technology 4',companion.fixed_technology_latest.length===4],
 ['latency 4',companion.latency_quality.length===4],
 ['fixed history 5',companion.fixed_technology_history.periods.length===5],
 ['source pages 28',pages.pages.length===28],
 ['source page exact order',pages.pages.every((x,i)=>x.number===src.pdfPages[i].n)],
 ['Tor 25',research.tor.rows.length===25],
 ['Tor values unchanged',research.tor.rows.every((x,i)=>JSON.stringify(x)===JSON.stringify(src.research.tor[i]))],
 ['Tor missing day preserved',!research.tor.rows.some(x=>x.date==='2025-06-27')],
 ['Tor frac valid beyond 100',research.tor.rows.every(x=>x.frac>=0&&x.frac<=110)],
 ['evidence count in quarantine',manifest.restricted_not_exported.legacy_evidence===320],
 ['no raw evidence in public research bundle',!('evidence' in research)&&!('conflicts' in research)],
 ['research approval not spoofed',research.admission==='RESEARCH_EXPLORATORY_NOT_Q5']
];
const paths=['src/CommandCenter.tsx','src/OfficialCatalog.tsx','src/OperatorExplorer.tsx','src/OfficialDataStudio.tsx','src/ResearchDataLab.tsx','src/EvidenceRoom.tsx','src/SourcePageViewer.tsx'];
checks.push(['native components exist',paths.every(x=>existsSync(resolve(x)))]);
for(const [name,ok] of checks)console.log((ok?'PASS ':'FAIL ')+name);
const failed=checks.filter(x=>!x[1]);console.log('Baseline tests: '+(checks.length-failed.length)+'/'+checks.length+' passed');
if(failed.length)process.exitCode=1;
