// Regression tests for the external technical review (v4.2). Each check names the review item.
const {chromium} = require('playwright');
const FILE = 'file://' + require('path').resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const ok = (id, c, d) => console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1600, height: 1000}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(700);
  // 1.1 cold load: registers resolved, REC built, CHAIN works
  ok('1.1 cold-load registers', await p.evaluate(() => REC.list.filter((r) => r.coll !== 'nin').length === 840 && D.reg.evreg.length > 0 && D.reg.claims.length > 0 && CHAIN.forRec(REC.list[0]) != null));
  // 1.3 unsafe URL schemes never become links
  ok('1.3 SAFEURL', await p.evaluate(() => !SAFEURL('javascript:alert(1)') && !SAFEURL('JaVaScRiPt:x') && !SAFEURL('data:text/html,x') && !SAFEURL('https://a b') && SAFEURL('https://ok.example/x')));
  // 1.4 null breaks the line (gap), not interpolated: Tor 2025-06-27 present as null
  await p.evaluate(() => go('research')); await p.waitForTimeout(500);
  const tor = await p.evaluate(() => ({gapDay: TOR_DAILY.find((t) => t.date === '2025-06-27'), sr: [...document.querySelectorAll('#rsTor table.sr td')].map((t) => t.textContent).join('|'), paths: [...document.querySelectorAll('#rsTor svg path')].map((x) => (x.getAttribute('d') || '').split('M').length - 1)}));
  ok('1.4 line gap on missing day', tor.gapDay && tor.gapDay.users === null && tor.sr.includes('2025-06-27|ناموجود') && Math.max(...tor.paths) >= 2, JSON.stringify(tor.paths));
  // 1.5 common verbs are not "unknown terms"
  const un = await p.evaluate(() => [V4H.unknownTerms(AI.norm('چند کاربر اینترنت در ایران داریم؟'), []), V4H.unknownTerms(AI.norm('تعداد کاربران استارلینک در یزد چند نفر است؟'), [])]);
  ok('1.5 داریم not unknown; استارلینک unknown', un[0].length === 0 && un[1].includes('استارلینک'), JSON.stringify(un));
  // 2.5 clear filters
  await p.goto(FILE + '#explorer?exKind=cand&exEt=survey&ex.q=zzzz'); await p.waitForTimeout(500);
  const before = await p.evaluate(() => !document.querySelector('#exClear').hidden);
  await p.click('#exClear'); await p.waitForTimeout(300);
  ok('2.5 clear filters', before && await p.evaluate(() => STATE.exKind === 'all' && STATE.exEt === 'all' && document.querySelector('#exT input.search').value === '' && document.querySelectorAll('#exT tbody tr[data-rk]').length === 50));
  // 2.7 / 3.7 ratio base: flagged and small-base provinces excluded from numerator and denominator
  const pr = await p.evaluate(() => ({u: M.provT.fthU, ex: M.provT.fthUBase.excluded.map((x) => x.iso), sum: M.prov.filter((q) => q.fthI >= 1000 && !q.flag).reduce((s, q) => s + q.fthA, 0) / M.prov.filter((q) => q.fthI >= 1000 && !q.flag).reduce((s, q) => s + q.fthI, 0) * 100}));
  ok('3.7 FTTH ratio base', Math.abs(pr.u - pr.sum) < 1e-9 && pr.ex.includes('IR-05') && pr.ex.includes('IR-27'), JSON.stringify(pr));
  await p.goto(FILE + '#provinces?pvMap=fthU'); await p.waitForTimeout(600);
  ok('2.7 map tooltip says not meaningful', await p.evaluate(() => [...document.querySelectorAll('#pvMap table.sr td')].some((t) => /معنادار نیست/.test(t.textContent))));
  // 2.8 invalid ASN in URL
  await p.goto(FILE + '#online?onAsn=abc'); await p.waitForTimeout(600);
  ok('2.8 ASN sanitised', await p.evaluate(() => STATE.onAsn === '' && !!document.querySelector('.toast')));
  // 3.1 postal value held with note, value unchanged
  ok('3.1 postal held', await p.evaluate(() => { const r = REC.byId['off:CRA57-POSTAL-INTERNATIONAL']; return r.v === 422 && r.adm === 'held' && /صفحه ۱۸/.test(r.lim[0]); }));
  // 3.2 operator definition note
  await p.goto(FILE + '#mobile'); await p.waitForTimeout(600);
  ok('3.2 MCI definition note', await p.evaluate(() => /OP-MCI-SUBS/.test(document.querySelector('#views').textContent)));
  // 3.4 wording as fraction
  ok('3.4 offset wording', await p.evaluate(() => /یک‌سوم/.test(OFFSET_TXT()) && ALERTS.some((a) => /سهم مشترکان مهاجر نیست/.test(a.s))));
  // 3.5 TIC outlier marked
  await p.goto(FILE + '#quality'); await p.waitForTimeout(600);
  ok('3.5 TIC outlier marker', await p.evaluate(() => [...document.querySelectorAll('#qTic circle title')].some((t) => /داده پرت/.test(t.textContent))));
  // 4.1 charts have role=img + aria-label and an SR table
  ok('4.1 chart a11y', await p.evaluate(() => { const s = [...document.querySelectorAll('.ch svg')]; return s.length > 0 && s.every((x) => x.getAttribute('role') === 'img' && x.getAttribute('aria-label')); }) && await p.evaluate(() => document.querySelectorAll('.ch table.sr').length > 0));
  // 4.2 contrast of --dim on panel >= 4.5
  const cr = await p.evaluate(() => { const L = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }; const d = getComputedStyle(document.documentElement).getPropertyValue('--dim').trim(); return (L(d) + 0.05) / (L('#0f1620') + 0.05); });
  ok('4.2 --dim contrast', cr >= 4.5, cr.toFixed(2));
  // 4.4 / 4.5 assistant input and log
  ok('4.4/4.5 assistant aria', await p.evaluate(() => document.querySelector('#aiIn').getAttribute('aria-label') && document.querySelector('#aiMsgs').getAttribute('role') === 'log'));
  // 6.1 / 6.6 evidence badges on KPI cards
  await p.goto(FILE + '#command'); await p.waitForTimeout(600);
  ok('6.1 KPI evidence badge', await p.evaluate(() => { const k = [...document.querySelectorAll('.strip .kpi')]; return k.length > 0 && k.every((x) => x.querySelector('.kev .badge')) && [...document.querySelectorAll('.kpi .scope')].some((s) => /FCP/.test(s.textContent)); }));
  // 6.3 staleness chip
  ok('6.3 staleness chip', await p.evaluate(() => /ماه پس از پایان دوره/.test(document.querySelector('#staleChip').textContent)));
  // 6.4 print stylesheet hides chrome
  await p.emulateMedia({media: 'print'});
  ok('6.4 print css', await p.evaluate(() => getComputedStyle(document.querySelector('.rail')).display === 'none'));
  await p.emulateMedia({media: 'screen'});
  // 6.5 map zoom controls
  await p.goto(FILE + '#provinces'); await p.waitForTimeout(600);
  await p.click('#pvMap .zoombtns button'); await p.waitForTimeout(400);
  ok('6.5 map zoom', await p.evaluate(() => /scale\(/.test(document.querySelector('#pvMap svg > g').getAttribute('transform') || '')));
  const G = {"offset": 32.249563091132565, "takeup": 9.32546104129493, "fthU": 5.440958714142454}; // computed independently in Python from src/data3.json
  const mv = await p.evaluate(() => ({offset: M.fixed.offset, takeup: M.fiber.takeup, fthU: M.provT.fthU}));
  ok('7.6 model values = independent computation', Object.keys(G).every((k) => Math.abs(G[k] - mv[k]) < 1e-9), JSON.stringify(mv));
  ok('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
})();
