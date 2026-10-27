const esbuild=require('esbuild'),fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-navigation-'));
esbuild.buildSync({entryPoints:['src/RadarRoutes.ts'],bundle:true,platform:'node',format:'cjs',outfile:path.join(dir,'routes.cjs')});
esbuild.buildSync({entryPoints:['src/CommandDataWall.tsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(dir,'domains.cjs')});
const r=require(path.join(dir,'routes.cjs')),d=require(path.join(dir,'domains.cjs'));let roundTrips=0;
for(const area of r.AREAS)for(const domain of r.DOMAINS){const state={area,domain,view:'overview',query:''};assert.deepStrictEqual(r.parseRoute(r.routeHash(state)),state);roundTrips++;}
for(const domain of r.DOMAINS)for(const view of ['overview','data','explore'])for(const query of ['','EV-P01-002','سرعت & کیفیت؟']){const state={area:'target',domain,view,query};assert.deepStrictEqual(r.parseRoute(r.routeHash(state)),state);roundTrips++;}
assert.strictEqual(r.parseRoute('#nonsense/nonsense').area,'target');assert.strictEqual(r.parseRoute('#target/nonsense').domain,'communications');assert.strictEqual(d.domainForRecord({section:'UNKNOWN',label:'حکمرانی',raw:{id:'NEW'}}),'unassigned');
const inventory=JSON.parse(fs.readFileSync('src/command-statistics.json'));const technical=inventory.records.filter(x=>['ثابت؛ قرارداد جاری','سیار؛ قرارداد جاری','کیفیت اتصال','RTT و Jitter','تاریخچه سیار'].includes(x.section));assert.strictEqual(technical.length,123);assert(technical.every(x=>d.domainForRecord(x)==='communications'));
const registry=JSON.parse(fs.readFileSync('src/domain-registry.json'));const extra=JSON.parse(fs.readFileSync('src/command-infrastructure.json'));for(const row of [...inventory.records,...extra])assert(registry.entries[row.section+'::'+row.row_id]);
const result={route_round_trip_cases:roundTrips,invalid_route_fallback:true,unknown_record_not_governance:true,technical_rows_corrected:123,source_keys_registered:Object.keys(registry.entries).length};fs.writeFileSync('docs/audits/R5_NAVIGATION_UNIT_QA.json',JSON.stringify(result,null,2));console.log(result);
