// NIN operational-goals monitoring: data fidelity, interactions, placement, assistant analysis.
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const SRC = require(path.resolve(__dirname, '..', 'src/nin.json'));
const HATCH = 26; // goals x years without a value in the files (new goals before 1404, two of them partly)
const ok = (id, c, d) => console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1600, height: 1000}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE + '#nin'); await p.waitForTimeout(900);
  // data fidelity: every embedded number equals the extractor output; overall from Sheet1 row 116
  const fid = await p.evaluate((S) => { let bad = 0; NIN.goals.forEach((g) => { const s = S.goals.find((x) => x.no === g.no); ['1400', '1401', '1402', '1403', '1404', '1405'].forEach((y) => { if (g.progress[y] !== s.progress[y]) bad++; }); }); return {bad, ov: ['1400', '1401', '1402', '1403', '1404', '1405'].map((y) => Math.round(NIN.S.overall[y].value * 100) / 100), goals: NIN.goals.length, inds: NIN.inds.length}; }, SRC);
  ok('N01 data fidelity', fid.bad === 0 && fid.goals === 30 && fid.inds === 122 && JSON.stringify(fid.ov) === JSON.stringify([23, 56.88, 59.18, 58.94, 79.01, 73.08]), JSON.stringify(fid));
  ok('N02 recomputation flags: goal12/1402, goal19/1401 and, in 1405, goals 1,2,3,5 (text cells)', await p.evaluate(() => JSON.stringify(NIN.S.issues.filter((x) => x.kind === 'reported_differs_from_recomputed').map((x) => x.year + ':' + x.goal).sort()) === JSON.stringify(['1401:19', '1402:12', '1405:1', '1405:2', '1405:3', '1405:5'])));
  ok('N03 records in radar (30 goals + 122 indicators), other collections unchanged', await p.evaluate(() => REC.list.filter((r) => r.coll === 'nin').length === 152 && REC.list.filter((r) => r.coll !== 'nin').length === 840));
  // placement
  ok('N04 rail entry next to command', await p.evaluate(() => { const b = [...document.querySelectorAll('.rail button[data-v]')].map((x) => x.dataset.v); return b.indexOf('nin') === b.indexOf('command') + 1 && document.querySelector('.rail button[data-v="nin"]').getAttribute('aria-current') === 'page'; }));
  ok('N05 no floating overlay button', await p.evaluate(() => !document.querySelector('#nin-open') && !document.querySelector('#nin-panel')));
  // charts
  const ch = await p.evaluate(() => ({traj: document.querySelectorAll('#ninTraj path').length, heatRows: document.querySelectorAll('#ninHeat svg > g').length, dumb: document.querySelectorAll('#ninDumb circle').length, gauge: document.querySelector('#ninGauge svg text').textContent, owners: document.querySelectorAll('#ninOwn rect').length, gap: document.querySelectorAll('#ninGap rect').length, doms: document.querySelectorAll('.nin-dom').length, hatched: document.querySelectorAll('#ninHeat rect[fill^="url(#ninHatch-"]').length}));
  ok('N06 charts rendered', ch.traj > 25 && ch.heatRows === 30 && ch.dumb >= 44 && ch.owners >= 5 && ch.gap >= 12 && ch.doms === 7, JSON.stringify(ch));
  ok('N07 missing values hatched, not zero', ch.hatched === HATCH, 'hatched ' + ch.hatched);
  ok('N08 gauge shows latest-year overall', /۷۳٫۰۸/.test(ch.gauge), ch.gauge);
  // interactions
  await p.click('#ninYear button[data-y="1402"]'); await p.waitForTimeout(500);
  ok('N09 year switch', await p.evaluate(() => STATE.ninYear === '1402' && /۵۹٫۱۸/.test(document.querySelector('#ninGauge svg text').textContent) && location.hash.includes('ninYear=1402')));
  await p.click('#ninHeat svg > g:nth-of-type(3)'); await p.waitForTimeout(800);
  const sel = await p.evaluate(() => ({g: STATE.ninGoal, drill: !!document.querySelector('#ninContrib svg'), url: location.hash}));
  ok('N10 heat row click opens goal drill-down', sel.g > 0 && sel.drill && sel.url.includes('ninGoal=' + sel.g), JSON.stringify(sel));
  await p.reload(); await p.waitForTimeout(900);
  ok('N11 reload keeps year and goal', await p.evaluate((g) => STATE.ninGoal === g && STATE.ninYear === '1402' && !!document.querySelector('#ninContrib svg'), sel.g));
  await p.goto(FILE + '#nin?ninGoal=19'); await p.waitForTimeout(800);
  ok('N12 drill shows recomputation mismatch for goal 19', await p.evaluate(() => /ناسازگار/.test(document.querySelector('#ninDrill').textContent)));
  const contrib = await p.evaluate(() => { const g = NIN.byNo[1]; return NIN.gapRows(g, '1403').reduce((s, r) => s + r.got, 0); });
  ok('N13 contributions sum to recomputed goal', Math.abs(contrib - 79.928) < 0.01, contrib.toFixed(3));
  const dec = await p.evaluate(() => { const g = NIN.byNo[7]; return [NIN.decomp(g, '1402', '1403').reduce((s, r) => s + r.d, 0), g.recomputed['1403'] - g.recomputed['1402']]; });
  ok('N14 change decomposition adds up', Math.abs(dec[0] - dec[1]) < 1e-6, dec.map((x) => x.toFixed(3)).join(' = '));
  await p.click('.nin-dom[data-d="security"]'); await p.waitForTimeout(600);
  ok('N15 domain card filters heatmap', await p.evaluate(() => STATE.ninDom === 'security' && document.querySelectorAll('#ninHeat svg > g').length === NIN.goals.filter((g) => g.dom === 'security').length));
  await p.goto(FILE + '#nin'); await p.waitForTimeout(700);
  await p.click('.nin-band[data-b="b3"]'); await p.waitForTimeout(600);
  ok('N16 band filter', await p.evaluate(() => document.querySelectorAll('#ninHeat svg > g').length === NIN.goals.filter((g) => NIN.prog(g, NIN.LAST) >= 75).length));
  // command and domain integration
  await p.goto(FILE + '#command'); await p.waitForTimeout(800);
  ok('N17 command view summary panel', await p.evaluate(() => !!document.querySelector('.nin-cmd #cmdNin svg') && /۷۳٫۰۸/.test(document.querySelector('.nin-cmd').textContent)));
  await p.click('.nin-cmd [data-go="nin"]'); await p.waitForTimeout(600);
  ok('N18 command → NIN view', await p.evaluate(() => STATE.view === 'nin'));
  await p.goto(FILE + '#d-security'); await p.waitForTimeout(700);
  ok('N19 domain scorecard lists its NIN goals', await p.evaluate(() => document.querySelectorAll('.nin-mini a.nm-row').length >= 8));
  // detail
  await p.goto(FILE + '#explorer?exKind=nin&ex.q=524'); await p.waitForTimeout(700);
  await p.click('#exT tbody tr[data-rk]'); await p.waitForTimeout(400);
  ok('N20 indicator record detail with source cell', await p.evaluate(() => /Sheet1!K115/.test(document.querySelector('#detail').textContent)));
  // assistant
  const QA = [
    ['پیشرفت کل شبکه ملی اطلاعات در ۱۴۰۳ چقدر است؟', /پیشرفت کل/, /۵۸٫۹۴/],
    ['چرا پیشرفت کل اهداف در ۱۴۰۳ کم شد؟', /چرا/, /نمی‌توان با قطعیت/],
    ['ضعیف‌ترین اهداف شبکه ملی کدام‌اند؟', /ضعیف‌ترین/, /گذرگاه‌های ایمن داخلی/],
    ['بیشترین افت اهداف در ۱۴۰۳', /بیشترین افت/, /وزن/],
    ['وضعیت هدف ۱۳ را تحلیل کن', /هدف ۱۳/, /سهم از شکاف/],
    ['همین را برای هدف ۱۴', /هدف ۱۴/, /فراهم‌کننده ابری/],
    ['شاخص ۵۲۴ چیست؟', /524/, /فیلتر شکن/],
    ['عملکرد کمیته راهبری امنیت در اهداف شبکه ملی', /کمیته راهبری امنیت/, /ضعیف‌ترین شاخص/],
    ['اهداف حوزه امنیت چطورند؟', /حوزه امنیت/, /NIN_GOAL_MAP_V1/],
    ['آیا داده‌های فایل اهداف شبکه ملی قابل اعتماد است؟', /اعتبار/, /هدف ۱۲/],
    ['پیشرفت ۱۴۰۴ اهداف شبکه ملی', /۱۴۰۴/, /۷۹٫۰۱[\s\S]*مرز ۱۴۰۳ به ۱۴۰۴/],
    ['چرا پیشرفت کل اهداف در ۱۴۰۵ کم شد؟', /چرا/, /سه عدد کل[\s\S]*۶۶٫۴۴[\s\S]*۷۶٫۰۷/],
    ['مقایسه هدف ۱۳ و ۱۴', /مقایسه/, /۱۴۰۰/],
    ['آیا مراکز داده ظرفیت خالی دارند؟', /ظرفیت خالی/, /اشغال/],
  ];
  for (const [q, h, t] of QA) {
    await p.evaluate((q) => AIUI.ask(q), q); await p.waitForTimeout(350);
    const r = await p.evaluate(() => { const m = [...document.querySelectorAll('#aiMsgs .m.a')].pop(); return {h: (m.querySelector('h5') || {}).textContent || '', t: m.textContent}; });
    ok('A ' + q, h.test(r.h) && t.test(r.t), r.h);
  }
  // layout
  for (const [w, hh] of [[390, 844], [2560, 1300]]) { await p.setViewportSize({width: w, height: hh}); await p.goto(FILE + '#nin?ninGoal=1'); await p.waitForTimeout(800); const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok('N layout ' + w, ov <= 2, 'overflow ' + ov); }
  ok('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
})();
