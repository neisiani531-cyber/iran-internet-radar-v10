// v4.9.4: changes panel is reached through its dedicated page, not the command overview.
// v4.9 «از آخرین بازدید چه تغییر کرده؟» acceptance tests. Exits 1 on any FAIL or crash.
// Every non-real value below is a TEST FIXTURE: periodic data are patched copies of the real bundle (records marked
// «TEST FIXTURE»), and the online API is served by Playwright route interception, never by the real server.
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs'), zlib = require('zlib');
const HTML_PATH = path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
// served from a real http origin (route interception) so localStorage persists like on the server, incl. storageState/reopen
const ORIGIN = 'http://radar.test', FILE = ORIGIN + '/index.html', HTML = fs.readFileSync(HTML_PATH);
const site = async (ctx) => { await ctx.route(ORIGIN + '/**', (r) => r.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: HTML})); return ctx; };
let FAILS = 0, PASSES = 0;
const ok = (id, c, d) => { if (c) PASSES++; else FAILS++; console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + String(d).slice(0, 220) : '')); };
process.on('exit', () => { console.log(`SUMMARY v49_changes: ${PASSES} passed, ${FAILS} failed, 0 skipped`); if (FAILS) process.exitCode = 1; });
process.on('unhandledRejection', (e) => { console.log('FAIL crash · ' + (e && e.stack || e)); FAILS++; process.exit(1); });
const unzip = (buf) => { const out = {}; let i = 0; while ((i = buf.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), i)) >= 0) { const m = buf.readUInt16LE(i + 8), n = buf.readUInt16LE(i + 26), e = buf.readUInt16LE(i + 28), sz = buf.readUInt32LE(i + 18); const name = buf.slice(i + 30, i + 30 + n).toString('utf8'), d = buf.slice(i + 30 + n + e, i + 30 + n + e + sz); out[name] = m === 8 ? zlib.inflateRawSync(d) : d; i += 30 + n + e + sz; } return out; };
const xmlText = (x) => String(x).split(/<\/a:p>|<\/w:p>/).map((pp) => [...pp.matchAll(/<(?:a|w):t(?: [^>]*)?>([^<]*)<\/(?:a|w):t>/g)].map((m) => m[1]).join('')).join('\n').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

/* ---------- TEST FIXTURES ---------- */
const FX_TAG = ' (TEST FIXTURE)';
// fixtures continuing a real series keep the real title pattern (the series key) and carry the TEST FIXTURE label in «den»
const kpi = (id, l, v, u, p, en, cont) => ({id, g: 'overview', l: cont ? l : l + FX_TAG, en: en || l, v, u, p, pg: 0, den: 'TEST FIXTURE'});
// v1: real bundle + two fixture series (zero base, percent indicator)
const DATA_V1 = {date: '2026-10-28', add: [kpi('TFX-ZERO-1405', 'شاخص صفرپایه / TFX-ZERO', 0, 'درصد', '1405-Q1'), kpi('TFX-PCT-1405', 'شاخص درصدی / TFX-PCT', 40, 'درصد', '1405-Q1')], set: {}, del: [], unit: {}};
// v2: a later release
const DATA_V2 = {date: '2026-11-15',
  add: [kpi('TFX-ZERO-1405', 'شاخص صفرپایه / TFX-ZERO', 5, 'درصد', '1405-Q1'), kpi('TFX-PCT-1405', 'شاخص درصدی / TFX-PCT', 50, 'درصد', '1405-Q1'),
    kpi('CRA57-MOB-1406', 'خط فعال / MOB-1406', 180000000, 'خط فعال', '1406-Q1', 'Mobile active connections', true),
    kpi('CRA57-MOB-1403', 'خط فعال / MOB-1403', 150000000, 'خط فعال', '1403-Q1', 'Mobile active connections', true)],
  set: {'CRA57-FIXBB-1405': 10500000, 'CRA57-FIXEDTEL-1405': null}, del: ['CRA57-FIXBB-PEN'], unit: {'CRA57-MOB-PEN': 'نسبت'}};
const patchData = async (ctx, mods) => ctx.addInitScript((m) => {
  let v; Object.defineProperty(window, 'RADAR_DATA', {configurable: true, get: () => v, set: (x) => {
    /* TEST FIXTURE: patched copy of the real bundle */
    x.auditMeta = {...(x.auditMeta || {}), date: m.date};
    x.kpi = x.kpi.filter((r) => !m.del.includes(r.id) && !m.add.some((a) => a.id === r.id)).map((r) => ({...r, ...(r.id in m.set ? {v: m.set[r.id]} : {}), ...(m.unit[r.id] ? {u: m.unit[r.id]} : {})}));
    x.kpi.push(...m.add); v = x; }});
}, mods);

const T = (min) => new Date(Date.UTC(2026, 9, 29, 6, 0) + min * 60000).toISOString().replace('.000Z', 'Z');
const SEV = {low: 'کم', medium: 'متوسط', high: 'بالا', critical: 'بحرانی'};
const sig = (k, state, obs, cur, base) => ({series_key: k, source_id: 'ioda', metric_id: 'ping-slash24.up_slash24', label: 'پینگ IODA' + FX_TAG + ' ' + k, layer: 'access', asn: 57218, scope: 'AS57218', vantage: 'ping', unit: '/24', state, state_fa: state, current: cur, baseline: base, last_observed: obs, last_fetched: obs, rule: 'DETECT_V1:drop'});
const inc = (id, status, sev, started, last, closed, log) => ({id, status, severity: sev, severity_fa: SEV[sev], title: 'رخداد آزمایشی ' + id + FX_TAG, layer: 'access', scope: 'AS57218', scope_fa: 'رایتل', started_at: started, last_active_at: last, closed_at: closed, log, signals: [{label: 'پینگ IODA', state_fa: 'هشدار'}], independent_vantages: []});
const src = (id, status, ls, la) => ({id, name: id.toUpperCase() + FX_TAG, status, status_fa: {live: 'دریافت فعال', temp_fail: 'موقتاً ناموفق', archive: 'آرشیوی / کهنه'}[status], last_success: ls, last_attempt: la, stale: status === 'archive', freshness: ''});
const S0 = {
  signals: [sig('k1', 'normal', T(0), 6, 6), sig('k2', 'watch', T(0), 5, 6), sig('k3', 'normal', T(0), 6, 6)],
  incidents: [inc(1, 'open', 'high', T(-120), T(0), null, [{at: T(-120), kind: 'opened'}]), inc(2, 'recovering', 'medium', T(-300), T(-60), null, [{at: T(-300), kind: 'opened'}, {at: T(-30), kind: 'recovery_verified_v2'}]), inc(4, 'open', 'low', T(-100), T(-10), null, [{at: T(-100), kind: 'opened'}])],
  sources: [src('ioda', 'live', T(0), T(0)), src('ooni', 'live', T(0), T(0)), src('atlas', 'temp_fail', T(-200), T(0))]};
const S1 = {
  signals: [sig('k1', 'alert', T(30), 3, 6), sig('k2', 'stale', T(0), 5, 6), sig('k3', 'watch', T(0), 5, 6)],
  incidents: [inc(1, 'closed', 'high', T(-120), T(0), T(25), [{at: T(-120), kind: 'opened'}, {at: T(10), kind: 'recovery_verified_v2'}, {at: T(25), kind: 'closed'}]), inc(2, 'open', 'medium', T(-300), T(20), null, [{at: T(-300), kind: 'opened'}, {at: T(-30), kind: 'recovery_verified_v2'}, {at: T(20), kind: 'reactivated'}]), inc(3, 'open', 'critical', T(15), T(28), null, [{at: T(15), kind: 'opened'}])],
  sources: [src('ioda', 'temp_fail', T(0), T(30)), src('ooni', 'archive', T(0), T(30)), src('atlas', 'live', T(30), T(30))]};
const S2 = {...S1, incidents: [S1.incidents[0], S1.incidents[1], inc(3, 'recovering', 'critical', T(15), T(28), null, [{at: T(15), kind: 'opened'}, {at: T(40), kind: 'recovery_verified_v2'}])]};
const API = 'http://127.0.0.1:9';
const serve = async (ctx, fx) => {
  await ctx.addInitScript((a) => { try { localStorage.setItem('radarApi', a); } catch (e) {} }, API);
  await ctx.route(API + '/**', (route) => {
    const u = new URL(route.request().url()), st = fx.state, f = fx.fail || {};
    const which = u.pathname.endsWith('/status') ? 'status' : u.pathname.endsWith('/incidents') ? 'incidents' : u.pathname.endsWith('/sources') ? 'sources' : 'other';
    if (f[which] === 'abort') return route.abort('connectionreset');
    if (f[which] === 500) return route.fulfill({status: 500, body: 'TEST FIXTURE error'});
    const json = (o) => route.fulfill({status: 200, contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: JSON.stringify(o)});
    if (which === 'status') return json(f.status === 'partial' ? {generated_at: new Date().toISOString(), signals: [{label: 'بی‌شناسه'}]} : {generated_at: new Date().toISOString(), rule_version: 'DETECT_V1', overall: {}, signals: st.signals, incidents: st.incidents.filter((i) => i.status !== 'closed')});
    if (which === 'incidents') return json({incidents: st.incidents});
    if (which === 'sources') return json({sources: st.sources, mode: 'connected'});
    return json({});
  });
};

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const page = async (ctx, hash = '#changes', vp = {width: 1366, height: 900}) => { const p = await ctx.newPage(); await p.setViewportSize(vp); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(FILE + hash); await p.waitForFunction((h) => typeof CHG !== 'undefined' && (h.startsWith('#report') ? typeof RPT !== 'undefined' : CHG.current), hash, {timeout: 15000}); await p.waitForTimeout(150); return p; };
  const cur = (p) => p.evaluate(() => { const r = CHG.current; return {state: r.state, complete: r.complete, coverage: r.coverage, gaps: r.gaps, parts: r.parts, counts: r.counts, items: r.items.map((i) => ({id: i.id, type: i.type, kind: i.kind, kindFa: i.kindFa, title: i.title, before: i.before, after: i.after, absText: i.absText, relText: i.relText, abs: i.abs, rel: i.rel, comparable: i.comparable, importance: i.importance, dom: i.dom, observedAt: i.observedAt, fetchedAt: i.fetchedAt, viewedAt: i.viewedAt, why: i.why, limit: i.limit, link: i.link, ref: i.ref})), unverified: r.unverified.map((i) => ({id: i.id, kind: i.kind, title: i.title})), noBase: r.noBaselineParts}; });
  const stored = (p) => p.evaluate((k) => localStorage.getItem(k), 'radarChangesBaseline.v1');
  const ack = async (p) => { await p.click('#chgView .chg-ack'); await p.waitForTimeout(150); };

  /* A. first visit, re-visit, browser reopen (offline) */
  let ctx = await site(await b.newContext({acceptDownloads: true}));
  let p = await page(ctx);
  let c = await cur(p);
  const txt0 = await p.$eval('#chgView', (e) => e.innerText);
  ok('A01 first visit: «هنوز مبنای مقایسه ثبت نشده», no fabricated change', c.state === 'none' && c.items.length === 0 && /هنوز مبنای مقایسه ثبت نشده/.test(txt0) && !/[۱-۹]\s*تغییر/.test(txt0), txt0.slice(0, 120));
  ok('A02 offline: online/sources «در این فایل … نیست», not incomplete, not zero', /در این فایل آفلاین در دسترس نیست/.test(txt0) && (await p.$$eval('.chg-c b', (bs) => bs.map((x) => x.textContent))).every((t) => t === '—'));
  ok('A03 page load did not create a baseline', (await stored(p)) === null);
  await ack(p);
  const base1 = await stored(p);
  c = await cur(p);
  { const tx = await p.$eval('#chgView', (e) => e.innerText); ok('A04 «تا این لحظه بررسی شد» records a baseline; then no changes; offline is «بررسی ناقص» (online parts unavailable), never «کامل»', !!base1 && c.state === 'ok' && c.items.length === 0 && /تغییری دیده نشد/.test(tx) && /بررسی ناقص/.test(tx) && /در این فایل آفلاین در دسترس نیست/.test(tx) && !/بررسی کامل/.test(tx), tx.slice(0, 200)); }
  await p.reload(); await p.waitForFunction(() => CHG.current); c = await cur(p);
  ok('A05 re-visit without change: baseline unchanged, zero changes', (await stored(p)) === base1 && c.items.length === 0 && c.state === 'ok');
  await ctx.close();
  { // real reopen: persistent profile closed and launched again
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'radar-profile-'));
    let pc = await site(await chromium.launchPersistentContext(dir)); let pp = await page(pc); await ack(pp); const bp = await stored(pp); await pc.close();
    pc = await site(await chromium.launchPersistentContext(dir)); pp = await page(pc); const cc = await cur(pp);
    ok('A06 browser closed and reopened (persistent profile): same baseline, no change', !!bp && (await stored(pp)) === bp && cc.state === 'ok' && cc.items.length === 0);
    await pc.close();
  }
  ctx = await site(await b.newContext()); p = await page(ctx); await ack(p);
  await p.evaluate((k) => localStorage.setItem(k, '{"schema":1,"broken":'), 'radarChangesBaseline.v1'); await p.reload(); await p.waitForFunction(() => CHG.current); c = await cur(p);
  ok('A07 corrupt baseline: stated, no comparison, not overwritten by loading', c.state === 'corrupt' && c.items.length === 0 && (await stored(p)) === '{"schema":1,"broken":' && /خوانا نیست/.test(await p.$eval('#chgView', (e) => e.innerText)));
  await ctx.close();
  ctx = await site(await b.newContext()); await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', {configurable: true, get: () => { throw new Error('denied (TEST FIXTURE)'); }}); });
  p = await page(ctx); c = await cur(p);
  ok('A08 storage unavailable: says comparison impossible, button disabled', c.state === 'storage_off' && await p.$eval('#chgView .chg-ack', (x) => x.disabled) && /حافظه این مرورگر در دسترس نیست/.test(await p.$eval('#chgView', (e) => e.innerText)));
  await ctx.close();

  /* C. periodic data: new period, revision, definition/unit, zero, NULL, removal, out-of-order */
  ctx = await site(await b.newContext({acceptDownloads: true}));
  await patchData(ctx, DATA_V1);
  p = await page(ctx); await ack(p); const baseV1 = await stored(p); await p.close();
  const ctx2 = await site(await b.newContext({acceptDownloads: true, storageState: await ctx.storageState()})); await ctx.close(); ctx = ctx2;
  await patchData(ctx, DATA_V2);
  p = await page(ctx); c = await cur(p);
  const by = (k) => c.items.find((i) => i.ref && i.ref.id === k);
  const np = by('off:CRA57-MOB-1406'), rv = by('off:CRA57-FIXBB-1405'), df = by('off:CRA57-MOB-PEN'), nl = by('off:CRA57-FIXEDTEL-1405'), rm = by('off:CRA57-FIXBB-PEN'), bf = by('off:CRA57-MOB-1403'), z = by('off:TFX-ZERO-1405'), pc = by('off:TFX-PCT-1405');
  ok('C01 new period: «انتشار دوره تازه» vs latest baseline period, comparable, abs and relative', np && np.kind === 'new_period' && np.comparable && np.before.periodId === '1405-Q1' && np.after.periodId === '1406-Q1' && /بهار ۱۴۰۶/.test(np.after.period) && np.abs === 180000000 - 174355156 && /^\+/.test(np.absText) && np.rel != null, JSON.stringify(np && [np.kind, np.before, np.absText, np.relText, np.why]));
  ok('C02 revision of a past figure: «اصلاح آمار», not growth; official -> attention', rv && rv.kind === 'revision' && rv.kindFa === 'اصلاح آمار' && /نه تغییر عملکرد/.test(rv.limit) && rv.importance === 'attention', JSON.stringify(rv && [rv.kind, rv.absText, rv.importance]));
  ok('C03 unit/definition change: not comparable, no abs/percent, no growth wording', df && df.kind === 'definition' && !df.comparable && df.abs == null && df.absText === 'قابل مقایسه نیست' && /واحد/.test(df.why), JSON.stringify(df && [df.kind, df.why]));
  ok('C04 NULL is not zero: no difference computed', nl && nl.after.text === 'ناموجود' && nl.abs == null && /ناموجود صفر نیست/.test(nl.absText), JSON.stringify(nl && [nl.after.text, nl.absText]));
  ok('C05 removed record: «حذف رکورد», not zero', rm && rm.kind === 'removed' && rm.after == null && /صفر شدن/.test(rm.limit));
  ok('C06 out-of-order data: «ورود داده دوره گذشته», no growth', bf && bf.kind === 'backfill' && bf.abs == null && /خارج از ترتیب/.test(bf.why));
  ok('C07 zero base: percent change invalid', z && z.relText === 'درصد تغییر نامعتبر (مبنای صفر)' && z.abs === 5, JSON.stringify(z && [z.absText, z.relText]));
  ok('C08 percent indicator: «واحد درصد» separate from relative change', pc && /^\+۱۰ واحد درصد$/.test(pc.absText.trim()) && /تغییر نسبی \+۲۵٪/.test(pc.relText), JSON.stringify(pc && [pc.absText, pc.relText]));
  ok('C09 three separate types; periodic counted only as periodic', c.counts.periodic === c.items.filter((i) => i.type === 'periodic').length && c.items.every((i) => ['periodic', 'online', 'sources'].includes(i.type)));
  ok('C10 no «رشد/افت/بحرانی» label on any periodic change', c.items.every((i) => !/رشد|افت|بحرانی/.test(i.kindFa + i.why + (i.importance === 'attention' ? '' : ''))) && c.items.every((i) => ['attention', 'info'].includes(i.importance)));
  ok('C11 three times kept apart (observed = period, fetched = bundle, viewed = browser)', np.observedAt === '1406-Q1' && /بسته داده 2026-11-15/.test(np.fetchedAt) && /^\d{4}-\d\d-\d\dT/.test(np.viewedAt), JSON.stringify([np.observedAt, np.fetchedAt, np.viewedAt]));
  ok('C12 every item has id, domain, source link', c.items.every((i) => i.id && i.dom && i.link && i.link.href));
  ok('C13 loading v2 did not advance the baseline', (await stored(p)) === baseV1);

  /* I. same values in panel, assistant and report (report does not acknowledge) */
  const panelIds = await p.$$eval('#chgView .chg-row', (as) => as.map((a) => a.dataset.chid));
  ok('I01 dedicated page shows all items of the shared list', panelIds.length === c.items.length && panelIds.every((id, i) => id === c.items[i].id));
  const asst = await p.evaluate(async () => { const t = document.createElement('div'); const a = AI.route('از آخرین بازدید چه تغییر کرده؟', {}); t.innerHTML = a.b; await CHGQ.fill(t, a.chg); return {h: a.h, text: t.innerText}; });
  ok('I02 assistant answers from the same items (ids, before/after) with baseline and limitation', c.items.slice(0, 12).every((i) => asst.text.includes(i.id)) && /مبنای مقایسه: بررسی‌شده در/.test(asst.text) && /اصلاح آمار، تغییر عملکرد نیست/.test(asst.text), asst.text.slice(0, 160));
  const nat = await p.evaluate(async () => { const t = document.createElement('div'); const a = AI.route('این تغییر مربوط به عملکرد است یا اصلاح آمار؟', {}); t.innerHTML = a.b; await CHGQ.fill(t, a.chg); return t.innerText; });
  ok('I03 assistant: performance vs revision split from the same data', /اصلاح آمار همان دوره ۴/.test(nat) && /انتشار دوره تازه ۱/.test(nat), nat.slice(0, 200));
  const before = await stored(p);
  await p.goto(FILE + '#report'); await p.waitForFunction(() => typeof RPT !== 'undefined');
  await p.fill('#rptQ', 'گزارش تغییرات از آخرین بازدید، پاورپوینت'); await p.click('#rptPlanBtn'); await p.waitForTimeout(150); await p.click('#rptBuild'); await p.waitForTimeout(1500);
  const repIds = await p.evaluate(() => RPTV.rep.sections[0].blocks.filter((x) => x.type === 'table').flatMap((t) => t.rows.map((r) => r[0])));
  const cNow = await cur(p);
  ok('I04 report built from CHG.current: same ids, same count, plan = «گزارش تغییرات»', repIds.length === cNow.items.length && cNow.items.every((i) => repIds.includes(i.id)) && await p.evaluate(() => RPTV.rep.tpl === 'changes'), repIds.length + ' vs ' + cNow.items.length);
  const dl = async (f) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(`#rptBar [data-out="${f}"]`)]); const buf = fs.readFileSync(await d.path()); if (process.env.KEEP) fs.copyFileSync(await d.path(), path.join(process.env.KEEP, 'changes-report.' + f)); return unzip(buf); };
  const px = await dl('pptx'), dx = await dl('docx');
  const pAll = Object.keys(px).filter((k) => /^ppt\/(slides|notesSlides)\/\w+\d+\.xml$/.test(k)).map((k) => xmlText(px[k])).join('\n'), dAll = xmlText(dx['word/document.xml']);
  ok('I05 Word and PowerPoint carry every change id with before/after and periods', cNow.items.every((i) => dAll.includes(i.id) && pAll.includes(i.id)) && dAll.includes('1406-Q1') && pAll.includes('1406-Q1'));
  ok('I06 building the report did not change the review state', (await stored(p)) === before);
  const spc = [...Object.keys(px).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k)).map((k) => String(px[k])).join('').matchAll(/<a:spcPct val="(\d+)"/g)].map((m) => +m[1]);
  ok('K01 PowerPoint line spacing in thousandths of a percent (no 118-style values)', spc.length > 0 && spc.every((v) => v >= 50000 && v <= 300000), [...new Set(spc)].join(','));

  /* J. navigation, filter, back, scroll, keyboard, mobile */
  await p.goto(FILE + '#changes?chType=periodic'); await p.waitForFunction(() => document.querySelectorAll('.chg-row[data-chid]').length > 3);
  await p.setViewportSize({width: 1366, height: 500});
  await p.evaluate(() => window.scrollTo(0, 400)); await p.waitForTimeout(250);
  const y0 = await p.evaluate(() => scrollY);
  // a row already inside the viewport, so the click itself does not scroll the page
  const firstId = await p.evaluate(() => { const r = [...document.querySelectorAll('.chg-row[data-chid]')].find((a) => { const b = a.getBoundingClientRect(); return b.top > 80 && b.bottom < innerHeight - 10; }); return r && r.dataset.chid; });
  await p.evaluate(() => addEventListener('click', () => { window.__yAtClick = scrollY; }, {capture: true, once: true }));
  await p.$eval(`.chg-row[data-chid="${firstId}"]`, (a) => a.click()); await p.waitForSelector('#chgDetail'); // DOM click: no auto-scroll before it
  const det = await p.$eval('#chgDetail', (e) => e.innerText);
  ok('J01 click opens the detail of that change with all fields', det.includes(firstId) && /قبل/.test(det) && /بعد/.test(det) && /زمان مشاهده داده/.test(det) && /زمان دریافت/.test(det) && /زمان مشاهده کاربر/.test(det) && /محدودیت تفسیر/.test(det) && /مبنای مقایسه/.test(det));
  await p.goBack(); await p.waitForSelector('.chg-row[data-chid]'); await p.waitForTimeout(400);
  const back = await p.evaluate(() => ({t: STATE.chType, id: STATE.chId, y: scrollY, yClick: window.__yAtClick, pressed: (document.querySelector('#chgType [aria-pressed="true"]') || {}).dataset.k}));
  ok('J02 back keeps the filter and the scroll position', back.t === 'periodic' && back.pressed === 'periodic' && !back.id && Math.abs(back.yClick - y0) < 5 && Math.abs(back.y - back.yClick) < 30, JSON.stringify({...back, y0}));
  await p.focus(`.chg-row[data-chid="${firstId}"]`); await p.keyboard.press('Enter'); await p.waitForSelector('#chgDetail');
  ok('J03 keyboard: a focused change opens with Enter; labels are text, not colour only', await p.evaluate(() => !!document.querySelector('#chgDetail') && document.querySelector('.chg-imp').textContent.trim().length > 3));
  await p.goBack(); await p.waitForSelector('.chg-row[data-chid]');
  await p.selectOption('#chgDom', 'communications'); await p.waitForTimeout(100);
  ok('J04 domain filter', await p.evaluate(() => [...document.querySelectorAll('.chg-row[data-chid]')].length > 0 && STATE.chDom === 'communications'), await p.evaluate(() => JSON.stringify([STATE.chDom, STATE.chType, STATE.chRev, document.querySelectorAll('.chg-row[data-chid]').length, CHG.current.items.map((i) => i.dom + ':' + i.type).join(',')])));
  await p.click('#chgRev [data-k="reviewed"]'); await p.waitForTimeout(100);
  ok('J05 review filter «بررسی‌شده در آخرین مرور» lists the last acknowledgement', /آخرین مرور/.test(await p.$eval('#chgView', (e) => e.innerText)));
  for (const [w, h] of [[390, 800], [768, 900]]) {
    await p.setViewportSize({width: w, height: h});
    for (const hash of ['#changes', '#changes', '#changes?chId=' + encodeURIComponent(firstId)]) { await p.goto(FILE + hash); await p.waitForFunction(() => typeof CHG !== 'undefined' && CHG.current); await p.waitForTimeout(250); const sw = await p.evaluate(() => document.documentElement.scrollWidth); ok(`J06 no horizontal overflow ${w}px ${hash.slice(0, 18)}`, sw <= w, String(sw)); if (process.env.KEEP && w === 390) await p.waitForTimeout(1300), await p.screenshot({path: path.join(process.env.KEEP, `mobile-${hash.replace(/[^a-z]/g, '').slice(0, 14) || 'cmd'}.png`), fullPage: false}); }
  }
  await ctx.close();

  /* D. online: incident opened / recovering / closed / reactivated; signal state; sources; ignored stale evidence */
  const fx = {state: S0, fail: {}};
  ctx = await site(await b.newContext()); await serve(ctx, fx);
  p = await page(ctx); c = await cur(p);
  ok('D00 first online visit: no baseline, no changes, not complete', c.state === 'none' && c.items.length === 0 && c.parts.online === 'no_baseline' && c.complete === false, JSON.stringify(c.parts));
  await ack(p); const bS0 = JSON.parse(await stored(p));
  ok('D01 ack recorded all three online parts', bS0.online.has.incidents && bS0.online.has.signals && bS0.online.has.sources && Object.keys(bS0.online.incidents).length === 3);
  fx.state = S1; await p.reload(); await p.waitForFunction(() => CHG.current && CHG.current.state === 'ok'); c = await cur(p);
  const it = (pred) => c.items.find(pred);
  const i1 = it((x) => x.ref && x.ref.id === '1' && x.ref.kind === 'incident'), i2 = it((x) => x.ref && x.ref.id === '2'), i3 = it((x) => x.ref && x.ref.id === '3');
  ok('D02 closed incident: «بسته‌شدن رخداد» with fresh-normal-evidence basis', i1 && i1.kind === 'closed' && /RECOVERY_VERIFIED_V2/.test(i1.why) && /نه اینکه شبکه سالم است/.test(i1.limit), JSON.stringify(i1 && [i1.kind]));
  ok('D03 reactivated incident (recovering -> open)', i2 && i2.kind === 'reactivated');
  ok('D04 new critical incident: opened, attention (rule: severity high/critical), technical severity shown separately', i3 && i3.kind === 'opened' && i3.importance === 'attention' && i3.type === 'online');
  ok('D05 baseline incident missing from the response is «unknown», not closed', c.unverified.some((u) => u.id === 'inc-miss:4') && !c.items.some((x) => x.ref && x.ref.id === '4'));
  const s1 = it((x) => x.ref && x.ref.id === 'k1'), s2 = it((x) => x.ref && x.ref.id === 'k2'), s3 = it((x) => x.ref && x.ref.id === 'k3');
  ok('D06 signal normal -> alert with newer observation: online change with before/after blocks', s1 && s1.type === 'online' && s1.kind === 'signal_state' && s1.before.value === 6 && s1.after.value === 3 && /بلوک/.test(s1.absText), JSON.stringify(s1 && [s1.absText, s1.relText]));
  ok('D07 signal watch -> stale is a source/data change, not a network change', s2 && s2.type === 'sources' && s2.kind === 'data_gap' && /تغییر وضعیت شبکه نیست/.test(s2.limit));
  ok('D08 state change without a newer observation is not reported', !s3);
  const src1 = it((x) => x.ref && x.ref.id === 'ioda'), src2 = it((x) => x.ref && x.ref.id === 'atlas'), src3 = it((x) => x.ref && x.ref.id === 'ooni');
  ok('D09 sources: fetch failed (attention, was live), restored, stale — never a network change', src1 && src1.kind === 'fetch_failed' && src1.importance === 'attention' && src1.type === 'sources' && src2 && src2.kind === 'fetch_restored' && src3 && src3.kind === 'stale' && /اختلال اینترنت نیست/.test(src1.limit));
  ok('D10 no online/sources change uses response generated_at (all ids carry API times)', c.items.filter((x) => x.type !== 'periodic').every((x) => !/generated/.test(x.id)));
  const incAns = await p.evaluate(async () => { const t = document.createElement('div'); const a = AI.route('چه رخدادی باز یا بسته شده و بر چه اساسی؟', {}); t.innerHTML = a.b; await CHGQ.fill(t, a.chg); return t.innerText; });
  ok('D11 assistant: incidents opened/closed with basis and limitation', /بسته‌شدن رخداد/.test(incAns) && /RECOVERY_VERIFIED_V2/.test(incAns) && /مبنای مقایسه/.test(incAns));
  const srcAns = await p.evaluate(async () => { const t = document.createElement('div'); const a = AI.route('کدام منابع دیگر داده تازه نمی‌دهند؟', {}); t.innerHTML = a.b; await CHGQ.fill(t, a.chg); return t.innerText; });
  ok('D12 assistant: sources not live, from /sources, with times', /IODA/.test(srcAns) && /OONI/.test(srcAns) && /اختلال اینترنت نیست/.test(srcAns), srcAns.slice(0, 160));

  /* G. auto refresh / repeated evaluation never moves the baseline */
  const bBefore = await stored(p);
  for (let k = 0; k < 3; k++) await p.evaluate(() => CHG.ensure({force: true}));
  await p.evaluate(() => render()); await p.reload(); await p.waitForFunction(() => CHG.current && CHG.current.state === 'ok');
  ok('G01 refreshes, re-render and reload keep the previous baseline', (await stored(p)) === bBefore && (await cur(p)).items.length === c.items.length);
  await p.goto(FILE + '#online'); await p.waitForTimeout(1500); await p.goto(FILE + '#changes'); await p.waitForFunction(() => CHG.current);
  ok('G02 visiting the online page (which auto-refreshes) does not move the baseline', (await stored(p)) === bBefore);

  /* E. API error, partial response, connection loss: incomplete, not a change; ack skips those parts */
  fx.fail = {sources: 500}; await p.reload(); await p.waitForFunction(() => CHG.current && CHG.current.state === 'ok'); c = await cur(p);
  ok('E01 API error on /sources: «بررسی ناقص», sources not compared, no source changes', !c.complete && c.gaps.some((g) => g.part === 'sources') && c.parts.sources === 'incomplete' && !c.items.some((x) => x.ref && x.ref.kind === 'source') && /بررسی ناقص/.test(await p.$eval('#chgView', (e) => e.innerText)));
  await ack(p); const bAfterErr = JSON.parse(await stored(p));
  ok('E02 ack with a failed part: sources baseline untouched, received parts recorded', JSON.stringify(bAfterErr.online.sources) === JSON.stringify(bS0.online.sources) && bAfterErr.online.incidents['1'].status === 'closed' && bAfterErr.online.signals.k1.state === 'alert' && bAfterErr.ack.skipped.includes('sources'));
  fx.fail = {sources: 500, status: 'partial'}; await p.reload(); await p.waitForFunction(() => CHG.current && CHG.current.state === 'ok'); c = await cur(p);
  ok('E03 partial/malformed response: signals part incomplete, nothing invented', c.gaps.some((g) => g.part === 'signals') && !c.items.some((x) => x.ref && x.ref.kind === 'signal'));
  fx.fail = {status: 'abort', incidents: 'abort', sources: 'abort'}; await p.reload(); await p.waitForFunction(() => CHG.current && CHG.current.state === 'ok'); c = await cur(p);
  ok('E04 connection lost: all online parts incomplete, zero online changes, periodic still compared', c.gaps.length === 3 && c.items.filter((x) => x.type !== 'periodic').length === 0 && c.parts.periodic === 'ok');
  const bLost = await stored(p); await ack(p); const bLost2 = JSON.parse(await stored(p));
  ok('E05 ack while disconnected changes no online baseline', JSON.stringify(bLost2.online) === JSON.stringify(JSON.parse(bLost).online));
  fx.fail = {};
  /* D-2: recovering */
  fx.state = S1; await p.reload(); await p.waitForFunction(() => CHG.current && CHG.current.state === 'ok'); await ack(p);
  fx.state = S2; await p.reload(); await p.waitForFunction(() => CHG.current && CHG.current.state === 'ok'); c = await cur(p);
  const r3 = c.items.find((x) => x.ref && x.ref.id === '3');
  ok('D13 recovering: «بازیابی رخداد (هنوز بسته نشده)»', r3 && r3.kind === 'recovering' && /بسته نمی‌شود/.test(r3.why));
  await ctx.close();

  /* H. two tabs: newer evidence is never overwritten by an older tab; other tab updates */
  const fx2 = {state: S0, fail: {}};
  ctx = await site(await b.newContext()); await serve(ctx, fx2);
  const tA = await page(ctx); await ack(tA);                    // baseline S0
  fx2.state = S1;
  const tB = await page(ctx); await ack(tB);                    // tab B acknowledges S1
  await tA.waitForTimeout(300);
  const aBase = await tA.evaluate(() => CHG.current.baseline && CHG.current.baseline.reviewedAt), bBase = JSON.parse(await stored(tB)).reviewedAt;
  ok('H01 tab A sees tab B\'s acknowledgement (storage event)', aBase === bBase);
  await tA.evaluate(() => CHG.ack());                           // tab A still holds the older S0 snapshot
  const merged = JSON.parse(await stored(tA));
  ok('H02 older tab cannot roll the baseline back (incident 1 stays closed, k1 stays alert)', merged.online.incidents['1'].status === 'closed' && merged.online.signals.k1.state === 'alert' && merged.online.sources.ioda.status === 'temp_fail');
  await ctx.close();
  ctx = await site(await b.newContext()); await patchData(ctx, DATA_V2); const pB = await page(ctx); await ack(pB); await pB.close();
  const ss2 = await ctx.storageState(); await ctx.close(); ctx = await site(await b.newContext({storageState: ss2})); await patchData(ctx, DATA_V1);
  const pA = await page(ctx); await pA.evaluate(() => CHG.ack());
  ok('H03 a tab with an older data bundle keeps the newer periodic baseline', JSON.parse(await stored(pA)).periodic.snapshotDate === '2026-11-15');
  await ctx.close();

  /* S. all three types together (periodic v1->v2 and online S0->S1); screenshots when KEEP is set */
  { const fx3 = {state: S0, fail: {}};
    let cx = await site(await b.newContext()); await patchData(cx, DATA_V1); await serve(cx, fx3);
    let pg = await page(cx); await ack(pg); const st3 = await cx.storageState(); await cx.close();
    fx3.state = S1; cx = await site(await b.newContext({storageState: st3, acceptDownloads: true})); await patchData(cx, DATA_V2); await serve(cx, fx3);
    pg = await page(cx); await pg.waitForFunction(() => CHG.current.state === 'ok');
    const cc = await cur(pg);
    const cnt = await pg.$$eval('.chg-c b', (bs) => bs.map((x) => x.textContent));
    ok('S01 panel separates the three types with their own counts', cc.counts.periodic > 0 && cc.counts.online > 0 && cc.counts.sources > 0 && cnt.length === 3 && cnt.every((t) => /[۰-۹]/.test(t)), JSON.stringify(cc.counts));
    ok('S02 attention items first; labels are text («نیازمند توجه»/«برای اطلاع»), no alert colour class', await pg.evaluate(() => { const L = [...document.querySelectorAll('#chgView .chg-imp')].map((x) => x.textContent); const first = L.indexOf('برای اطلاع'); return L.length > 0 && (first < 0 || L.slice(first).every((t) => t === 'برای اطلاع')) && !document.querySelector('#chgView .crit, #chgView .bad'); }));
    if (process.env.KEEP) {
      const K = process.env.KEEP;
      await pg.evaluate(() => document.getElementById('cmdChanges').scrollIntoView()); await pg.waitForTimeout(200);
      await pg.waitForTimeout(1300); await pg.screenshot({path: path.join(K, 'desktop-panel.png')});
      await pg.goto(FILE + '#changes'); await pg.waitForFunction(() => document.querySelectorAll('.chg-row[data-chid]').length > 3); await pg.waitForTimeout(1300); await pg.screenshot({path: path.join(K, 'desktop-changes.png'), fullPage: true});
      const id = cc.items.find((i) => i.ref && i.ref.kind === 'incident').id;
      await pg.goto(FILE + '#changes?chId=' + encodeURIComponent(id)); await pg.waitForSelector('#chgDetail'); await pg.waitForTimeout(1300); await pg.screenshot({path: path.join(K, 'desktop-detail-incident.png'), fullPage: true});
      const id2 = cc.items.find((i) => i.kind === 'new_period').id;
      await pg.goto(FILE + '#changes?chId=' + encodeURIComponent(id2)); await pg.waitForSelector('#chgDetail'); await pg.waitForTimeout(1300); await pg.screenshot({path: path.join(K, 'desktop-detail-period.png'), fullPage: true});
      await pg.setViewportSize({width: 390, height: 844}); await pg.goto(FILE + '#changes'); await pg.waitForFunction(() => CHG.current && CHG.current.state === 'ok'); await pg.evaluate(() => document.getElementById('cmdChanges').scrollIntoView()); await pg.waitForTimeout(200); await pg.waitForTimeout(1300); await pg.screenshot({path: path.join(K, 'mobile-panel-all-types.png')});
      await pg.setViewportSize({width: 1366, height: 900});
      await pg.goto(FILE + '#report'); await pg.reload(); await pg.waitForFunction(() => typeof RPT !== 'undefined' && !!document.querySelector('#rptPlanBtn')); await pg.waitForTimeout(300);
      await pg.fill('#rptQ', 'گزارش تغییرات از آخرین بازدید، پاورپوینت'); await pg.click('#rptPlanBtn'); await pg.waitForTimeout(300); if (!(await pg.$('#rptBuild'))) console.log('DEBUG', errs.slice(-3), await pg.evaluate(() => [location.hash, STATE.view, !!document.querySelector('#rptQ'), document.querySelector('#rptPlanBox') && document.querySelector('#rptPlanBox').hidden])); await pg.click('#rptBuild'); await pg.waitForTimeout(1500);
      for (const f of ['pptx', 'docx']) { const [d] = await Promise.all([pg.waitForEvent('download'), pg.click(`#rptBar [data-out="${f}"]`)]); fs.copyFileSync(await d.path(), path.join(K, 'changes-report-all-types.' + f)); }
      const t0 = await pg.evaluate(() => { const t = document.createElement('div'); document.body.appendChild(t); const a = AI.route('از آخرین بازدید چه تغییر کرده؟', {}); t.innerHTML = a.b; return CHGQ.fill(t, a.chg).then(() => t.innerText); });
      fs.writeFileSync(path.join(K, 'assistant-answer.txt'), t0);
    }
    await cx.close(); }

  /* M. NIN wording follows period and direction (was a fixed «افت آخرین سال») */
  ctx = await site(await b.newContext()); p = await page(ctx, '#report');
  const nin = await p.evaluate(async () => { const g = async (q) => { const pl = RPT.parse(q); const r = await RPT.build(pl); const s = r.sections.find((x) => x.id === 'nin'); return s.blocks.filter((x) => x.type === 'p').map((x) => x.text).join(' '); }; const ov = NIN.S.overall; return {t02: await g('کارنامه اهداف شبکه ملی ۱۴۰۲'), t03: await g('کارنامه اهداف شبکه ملی ۱۴۰۳'), d02: ov['1402'].value - ov['1401'].value, d03: ov['1403'].value - ov['1402'].value}; });
  const w = (d, y, p0) => (Math.abs(d) < 0.5 ? `تغییر اندک عدد کل در ${y} نسبت به ${p0}` : d < 0 ? `افت عدد کل در ${y} نسبت به ${p0}` : `افزایش عدد کل در ${y} نسبت به ${p0}`);
  ok('M01 NIN analysis wording matches the selected year and the sign of the change', nin.t02.includes(w(nin.d02, '۱۴۰۲', '۱۴۰۱')) && nin.t03.includes(w(nin.d03, '۱۴۰۳', '۱۴۰۲')) && !/افت آخرین سال/.test(nin.t02 + nin.t03), JSON.stringify({d02: nin.d02, d03: nin.d03}));
  await ctx.close();

  ok('Z01 no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
})();
