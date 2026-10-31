// v4.9.4: changes panel is reached through its dedicated page, not the command overview.
// Independent review of v4.9 (cf935df) reproduced four defects in changes.js. Each block below was written to FAIL on
// cf935df and PASS after the fix. Exits 1 on any FAIL or crash. All data here are TEST FIXTURES.
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
const HTML_PATH = path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const ORIGIN = 'http://radar.test', FILE = ORIGIN + '/index.html', HTML = fs.readFileSync(HTML_PATH);
let FAILS = 0, PASSES = 0;
const ok = (id, c, d) => { if (c) PASSES++; else FAILS++; console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + String(d).slice(0, 260) : '')); };
process.on('exit', () => { console.log(`SUMMARY v49_fixes: ${PASSES} passed, ${FAILS} failed, 0 skipped`); if (FAILS) process.exitCode = 1; });
process.on('unhandledRejection', (e) => { console.log('FAIL crash · ' + (e && e.stack || e)); FAILS++; process.exit(1); });
const site = async (ctx) => { await ctx.route(ORIGIN + '/**', (r) => r.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: HTML})); return ctx; };
const kpi = (id, l, v, u, p, en) => ({id, g: 'overview', l, en: en || l, v, u, p, pg: 0, den: 'TEST FIXTURE'});
// page-level patch so two tabs of one browser can hold different data (TEST FIXTURE)
const patch = (pg, m) => pg.addInitScript((m) => { let v; Object.defineProperty(window, 'RADAR_DATA', {configurable: true, get: () => v, set: (x) => {
  x.auditMeta = {...(x.auditMeta || {}), date: m.date}; x.kpi = x.kpi.filter((r) => !m.add.some((a) => a.id === r.id)); x.kpi.push(...m.add); v = x; }}); }, m);
const ready = (pg) => pg.waitForFunction(() => typeof CHG !== 'undefined' && CHG.current, null, {timeout: 15000});
const API = 'http://127.0.0.1:9';
const serve = async (ctx, st) => {
  await ctx.addInitScript((a) => { try { localStorage.setItem('radarApi', a); } catch (e) {} }, API);
  await ctx.route(API + '/**', (route) => { const u = new URL(route.request().url()); const json = (o) => route.fulfill({status: 200, contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: JSON.stringify(o)});
    if (u.pathname.endsWith('/status')) return json({generated_at: new Date().toISOString(), signals: st.signals, incidents: st.incidents.filter((i) => i.status !== 'closed')});
    if (u.pathname.endsWith('/incidents')) return json({incidents: st.incidents});
    if (u.pathname.endsWith('/sources')) return json({sources: st.sources});
    return json({}); });
};
const T = (m) => new Date(Date.UTC(2026, 9, 29, 6, 0) + m * 60000).toISOString().replace('.000Z', 'Z');
const sig = (k, state, obs) => ({series_key: k, source_id: 'ioda', metric_id: 'ping-slash24.up_slash24', label: 'TEST FIXTURE ' + k, layer: 'access', scope: 'AS1', unit: '/24', state, current: 5, baseline: 6, last_observed: obs, last_fetched: obs});
const inc = (id, status) => ({id, status, severity: 'medium', severity_fa: 'متوسط', title: 'TEST FIXTURE ' + id, layer: 'access', scope: 'AS1', scope_fa: 'AS1', started_at: T(0), last_active_at: T(1), closed_at: null, log: [{at: T(0), kind: 'opened'}], signals: []});
const ONLINE = {signals: [sig('k1', 'normal', T(0))], incidents: [inc(1, 'open')], sources: [{id: 'ioda', name: 'IODA', status: 'live', status_fa: 'دریافت فعال', last_success: T(0), last_attempt: T(0)}]};

(async () => {
  const b = await chromium.launch();

  /* 1. period consistency: annual 1404 = 100 vs Q1 1405 = 20 must not produce a performance difference */
  { const ctx = await site(await b.newContext());
    let pg = await ctx.newPage(); await patch(pg, {date: '2026-10-28', add: [kpi('TFX-ANN-1404', 'شاخص سالانه / TFX-ANN-1404', 100, 'اشتراک', '1404', 'Annual fixture')]});
    await pg.goto(FILE + '#changes'); await ready(pg); await pg.evaluate(() => CHG.ack()); await pg.close();
    pg = await ctx.newPage(); await patch(pg, {date: '2026-11-15', add: [kpi('TFX-ANN-1404', 'شاخص سالانه / TFX-ANN-1404', 100, 'اشتراک', '1404', 'Annual fixture'), kpi('TFX-ANN-1405', 'شاخص سالانه / TFX-ANN-1405', 20, 'اشتراک', '1405-Q1', 'Annual fixture')]});
    await pg.goto(FILE + '#changes'); await ready(pg);
    const it = await pg.evaluate(() => CHG.current.items.find((i) => i.ref && i.ref.id === 'off:TFX-ANN-1405'));
    ok('P1 annual 1404 vs Q1 1405: no difference, not comparable, period kinds named', it && it.comparable === false && it.abs == null && it.rel == null && !/−۸۰|-80/.test(it.absText || '') && /سالانه/.test(it.why + it.limit) && /فصل/.test(it.why + it.limit), JSON.stringify(it && {kind: it.kind, comparable: it.comparable, abs: it.abs, absText: it.absText, why: it.why}));
    const kinds = await pg.evaluate(() => [['1404', '1405-Q1'], ['1405-Q1', '1405-Q2'], ['شش‌ماهه نخست ۱۴۰۵', '1405-Q2'], ['بهار ۱۴۰۵', '1405-Q1']].map(([a, c]) => [CHG.cmpPeriod(a, c), CHG.sameKind ? CHG.sameKind(a, c) : null, CHG.periodKey(a) && CHG.periodKey(a).kind]));
    ok('P2 order and comparability are separate: cmpPeriod orders, kind check decides comparability (Y/H/Q explicit)', kinds[0][0] < 0 && kinds[0][1] === false && kinds[1][1] === true && kinds[2][1] === false && kinds[3][0] === 0 && kinds[3][1] === true && kinds[0][2] === 'Y' && kinds[2][2] === 'H', JSON.stringify(kinds));
    await ctx.close(); }

  /* 2. two tabs: same snapshotDate, different content. The newer tab's baseline must not be overwritten by an older tab */
  { const ctx = await site(await b.newContext());
    const A = await ctx.newPage(); await patch(A, {date: '2026-10-28', add: [kpi('TFX-X-1405', 'شاخص / TFX-X', 10, 'اشتراک', '1405-Q1')]});
    await A.goto(FILE + '#changes'); await ready(A); // old tab: snapshot built with X = 10
    const B = await ctx.newPage(); await patch(B, {date: '2026-10-28', add: [kpi('TFX-X-1405', 'شاخص / TFX-X', 20, 'اشتراک', '1405-Q1')]});
    await B.goto(FILE + '#changes'); await ready(B);
    const rb = await B.evaluate(() => Promise.resolve(CHG.ack()));
    const stored = () => B.evaluate(() => JSON.parse(localStorage.getItem('radarChangesBaseline.v1')).periodic.recs['off:TFX-X-1405'].v);
    ok('M1 new tab records X = 20', rb && rb.saved && (await stored()) === 20);
    await A.waitForTimeout(200);
    const ra = await A.evaluate(() => Promise.resolve(CHG.ack()));
    ok('M2 old tab (X = 10, built before) is refused with a refresh request; stored stays 20', ra && ra.saved === false && /تازه/.test(ra.reason || '') && (await stored()) === 20, JSON.stringify(ra));
    await A.waitForTimeout(200);
    const ui = await A.evaluate(() => (document.querySelector('#chgView .chg-conflict') || {}).innerText || '');
    ok('M4 the older tab shows the external acknowledgement and a refresh button (no silent state)', /زبانه یا پنجره دیگری/.test(ui) && !!(await A.$('#chgView .chg-reload')), ui.slice(0, 120));
    await A.click('#chgView .chg-ack'); await A.waitForTimeout(250);
    ok('M5 clicking «بررسی شد» in the older tab is refused in the UI; stored stays 20', (await stored()) === 20 && /تازه کنید/.test(await A.evaluate(() => (document.querySelector('#chgView .chg-conflict') || {}).innerText || '')));
    await A.reload(); await ready(A);
    const ra2 = await A.evaluate(() => Promise.resolve(CHG.ack()));
    ok('M3 after refresh, same date but different content is still not silently overwritten', ra2 && ra2.saved === false && (await stored()) === 20, JSON.stringify(ra2));
    await A.evaluate(() => CHG.ensure({force: true})); await A.click('#chgView .chg-ack'); await A.waitForTimeout(250);
    ok('M6 data-version conflict offers an explicit, separate «جایگزینی آگاهانه» action', !!(await A.$('#chgView .chg-replace')) && (await stored()) === 20);
    const hasReplace = !!(await A.$('#chgView .chg-replace')); if (hasReplace) { await A.click('#chgView .chg-replace'); await A.waitForTimeout(250); }
    ok('M7 explicit replacement records X = 10 and marks it as replaced', hasReplace && (await stored()) === 10 && await A.evaluate(() => JSON.parse(localStorage.getItem('radarChangesBaseline.v1')).ack.replaced === true));
    await ctx.close(); }

  /* 3. completeness: first online connection has no online baseline -> not «complete»; one shared status */
  { const ctx = await site(await b.newContext());
    let pg = await ctx.newPage(); await pg.goto(FILE + '#changes'); await ready(pg); await pg.evaluate(() => CHG.ack()); await pg.close(); // offline baseline only
    await serve(ctx, ONLINE);
    pg = await ctx.newPage(); await pg.goto(FILE + '#changes'); await pg.waitForFunction(() => typeof CHG !== 'undefined' && CHG.current && CHG.current.state === 'ok');
    const r = await pg.evaluate(() => ({complete: CHG.current.complete, cov: CHG.current.coverage, panel: document.querySelector('#chgView').innerText}));
    ok('C1 fetched but no baseline for signals/incidents/sources: complete is false', r.complete === false, JSON.stringify(r.cov));
    ok('C2 panel does not say «بررسی کامل»', !/بررسی کامل/.test(r.panel), r.panel.slice(0, 200));
    const a = await pg.evaluate(async () => { const t = document.createElement('div'); const x = AI.route('از آخرین بازدید چه تغییر کرده؟', {}); t.innerHTML = x.b; await CHGQ.fill(t, x.chg); return t.innerText; });
    ok('C3 assistant states the same incomplete status', !/بررسی کامل/.test(a) && /مبنا ندارد|مبنا ثبت نشده/.test(a), a.slice(0, 200));
    const rep = await pg.evaluate(async () => { const pl = RPT.parse('گزارش تغییرات از آخرین بازدید'); const r2 = await RPT.build(pl); return r2.sections[0].blocks.map((x) => x.text || x.caption || '').join(' '); });
    ok('C4 report states the same incomplete status', !/بررسی کامل بود/.test(rep) && /مبنا ندارد|مبنا ثبت نشده/.test(rep), rep.slice(0, 200));
    await ctx.close(); }

  /* 4. change identity includes before and after; stable across refresh */
  { const ctx = await site(await b.newContext());
    const ids = [];
    for (const before of [10, 20]) {
      const c2 = await site(await b.newContext());
      let pg = await c2.newPage(); await patch(pg, {date: '2026-10-28', add: [kpi('TFX-Y-1405', 'شاخص / TFX-Y', before, 'اشتراک', '1405-Q1')]}); await pg.goto(FILE + '#changes'); await ready(pg); await pg.evaluate(() => CHG.ack()); await pg.close();
      pg = await c2.newPage(); await patch(pg, {date: '2026-11-15', add: [kpi('TFX-Y-1405', 'شاخص / TFX-Y', 30, 'اشتراک', '1405-Q1')]}); await pg.goto(FILE + '#changes'); await ready(pg);
      ids.push(await pg.evaluate(() => CHG.current.items.find((i) => i.ref && i.ref.id === 'off:TFX-Y-1405').id));
      await pg.reload(); await ready(pg);
      ids.push(await pg.evaluate(() => CHG.current.items.find((i) => i.ref && i.ref.id === 'off:TFX-Y-1405').id));
      await c2.close();
    }
    ok('I1 10→30 and 20→30 have different change ids', ids[0] !== ids[2], JSON.stringify(ids));
    ok('I2 the same change keeps its id after a refresh', ids[0] === ids[1] && ids[2] === ids[3], JSON.stringify(ids));
    await ctx.close(); }

  /* 4b. online change ids: stable across refresh; different «before» -> different id */
  { const ids = [];
    for (const before of ['open', 'recovering']) {
      const st = {signals: ONLINE.signals, incidents: [inc(7, before)], sources: ONLINE.sources};
      const c2 = await site(await b.newContext()); await serve(c2, st);
      const pg = await c2.newPage(); await pg.goto(FILE + '#changes'); await pg.waitForFunction(() => typeof CHG !== 'undefined' && CHG.current); await pg.evaluate(() => CHG.ack());
      st.incidents = [{...inc(7, 'closed'), closed_at: T(30), log: [{at: T(0), kind: 'opened'}, {at: T(30), kind: 'closed'}]}];
      for (let k = 0; k < 2; k++) { await pg.reload(); await pg.waitForFunction(() => typeof CHG !== 'undefined' && CHG.current && CHG.current.state === 'ok'); ids.push(await pg.evaluate(() => (CHG.current.items.find((i) => i.ref && i.ref.kind === 'incident') || {}).id)); }
      await c2.close();
    }
    ok('I3 incident open→closed vs recovering→closed: different ids; each stable across refresh', ids.every(Boolean) && ids[0] === ids[1] && ids[2] === ids[3] && ids[0] !== ids[2], JSON.stringify(ids)); }

  await b.close();
})();
