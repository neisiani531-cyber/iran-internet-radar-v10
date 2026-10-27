const esbuild=require('esbuild'),fs=require('fs'),os=require('os'),path=require('path');
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'radar-coverage-')),'coverage.cjs');
esbuild.buildSync({entryPoints:['src/CommandDataWall.tsx'],bundle:true,platform:'node',format:'cjs',outfile:tmp});
const c=require(tmp).commandCoverage(),inventory=JSON.parse(fs.readFileSync('src/command-statistics.json'));
const expected=inventory.records.filter(r=>r.section==='رسمی نسخه ۹٫۱۷');
if(c.officialObservations.length!==130||new Set(c.officialObservations.map(x=>x.id)).size!==130)throw Error('Coverage failed');
for(const r of expected){const actual=c.officialObservations.find(x=>x.id===r.row_id);if(!actual||actual.value!==r.value||actual.unit!==r.unit)throw Error('Value/unit changed '+r.row_id)}
const workbook=JSON.parse(fs.readFileSync('src/command-workbooks.json'));if(workbook.files.length!==6||workbook.sheet_count!==33||workbook.cell_count!==52468)throw Error('Workbook coverage failed');
c.verification={officialIdsValuesUnitsExact:true,files:6,sheets:33,nonemptyCells:52468,qualityObservations:workbook.quality.length};
fs.writeFileSync('docs/audits/seven-domain-command-coverage.json',JSON.stringify(c,null,2));
console.log(JSON.stringify({official:130,panels:c.panels.length,charts:c.panels.filter(p=>p.chart).length,...c.verification}));
