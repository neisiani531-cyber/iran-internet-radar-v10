const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
const inv=await p.evaluate(()=>{
 const by=(arr,f)=>arr.reduce((m,x)=>{const k=f(x);m[k]=(m[k]||0)+1;return m},{});
 const L=REC.list;
 const ids=new Set(L.map(r=>r.coll+':'+r.id));
 return {
  generated: new Date().toISOString(),
  records_total: L.length, unique_coll_id: ids.size, unique_ids: new Set(L.map(r=>r.id)).size,
  by_collection: by(L,r=>r.coll), by_domain: by(L,r=>r.dom), by_coll_domain: by(L,r=>r.coll+'/'+r.dom),
  units: by(L,r=>r.u||'∅'), periods_distinct: [...new Set(L.map(r=>r.p))].length,
  null_values: L.filter(r=>r.v==null||r.v==='').length, zero_values: L.filter(r=>r.v===0).length,
  ids: L.map(r=>[r.coll,r.id,r.dom,r.u,r.p,typeof r.v]),
  registers: Object.fromEntries(Object.entries(D.reg).map(([k,v])=>[k,v.length])),
  candidates: Object.fromEntries(Object.entries(D.cand).map(([k,v])=>[k,v.length])),
  infra: by(D.infra,r=>r.sec),
  workbooks: {ports: D.wbPorts.map(p=>({id:p.id,file:p.f,sheet:p.s,cols:p.cols.length,rows:p.rows.length,has_total:!!p.total})), speed: D.wbSpeed.map(s=>({id:s.id,file:s.f,sheet:s.s,rows:s.rows.length,bands:s.bands.length}))},
  kpi_official: D.kpi.length, evidence: D.evidence.length, platform_records: {h1:D.plat.records.length, mordad:D.mordad.records.length, supp:D.platSupp.length},
  provinces: Object.keys(D.prov).length, mobile_quarters: D.mobBB.periods.length, fixed_quarters: D.fixedQ.length, fiber_cov_quarters: D.fiberCov.length,
  bridge: D.bridge.length, tic: D.tic.length, tor_days: D.tor.length, survey: D.survey.length, p01: D.p01.length, hist: D.hist.length, traffic_rows: D.traffic.length, qualityQ2: D.qualityQ2.length, latency: D.latency.length,
  views: Object.keys(V), nav: [...document.querySelectorAll('.rail button[data-v]')].map(b=>b.dataset.v),
  state_keys: Object.keys(STATE), alerts: ALERTS.length,
 };});
fs.writeFileSync(process.argv[3],JSON.stringify(inv,null,1));
console.log(JSON.stringify({...inv,ids:inv.ids.length},null,1).slice(0,3500));await b.close()})();
