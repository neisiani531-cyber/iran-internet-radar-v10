import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const html=readFileSync('public/legacy/v9-17.html','utf8');
const source=JSON.parse(html.match(/<script\b(?=[^>]*\bid=["']radarPayload["'])[^>]*>([\s\S]*?)<\/script>/i)[1]);
const code=ts.transpileModule(readFileSync('src/LegacyCatalogPanels.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {buildLegacyCatalogPanels}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const panels=buildLegacyCatalogPanels(source.official);
const records=panels.flatMap(panel=>panel.rows);
assert.equal(records.length,130);assert.equal(new Set(records.map(row=>row.id)).size,130);
assert.deepEqual([...records].sort((a,b)=>a.id.localeCompare(b.id)),[...source.official].sort((a,b)=>a.id.localeCompare(b.id)));
for(const panel of panels){
 assert.ok(panel.rows.every(row=>row.unit===panel.data.unit),panel.id+' mixes units');
 if(panel.modes.length){assert.equal(panel.data.series.length,panel.data.labels.length);assert.ok(panel.data.series.every(row=>row.length===panel.data.categories.length));}
 if(panel.modes.includes('donut'))assert.ok(panel.id.startsWith('share-')||['fixed-shares','fixed-counts'].includes(panel.id),'Unqualified composition '+panel.id);
}
for(const generation of ['3g','4g']){const panel=panels.find(panel=>panel.id==='operators-ping'+generation);assert.equal(panel.data.unit,'Mbps');assert.match(panel.title,/سرعت دانلود/);}
assert.equal(source.evidence.length,320);assert.equal(Object.keys(source.research.sources).length,50);assert.equal(source.pdfPages.length,28);
assert.equal(new Set(source.pdfPages.map(page=>page.n)).size,28);assert.ok(source.pdfPages.every(page=>/^data:image\/(jpeg|png);base64,/.test(page.img)));
assert.ok(source.research.tor.some(row=>row.frac>100));assert.equal(source.research.tor.some(row=>row.date==='2025-06-27'),false);
console.log(`PASS native legacy: exact 130 observations in ${panels.length} qualified panels; units preserved; download-speed semantics; 320 evidence; 50 sources; 28 report images; Tor gap and frac preserved`);
