const {chromium} = require('playwright');
const FILE = 'file://' + require('path').resolve(__dirname, '..', process.argv[2] || process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const R = []; const ok = (id, c, d) => { R.push({id, pass: !!c, d}); console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : '')); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1600, height: 1000}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(600);
  // T08-HW-001: search → detail → leave → back/forward/reload
  await p.evaluate((v) => { const b = document.querySelector('.rail button[data-v=\"' + v + '\"]'); const d = b.closest('details'); if (d) d.open = true; }, 'explorer'); await p.click('.rail button[data-v=\"explorer\"]'); await p.waitForTimeout(200);
  const h0 = await p.evaluate(() => history.length);
  await p.fill('#exT input.search', 'T08'); await p.waitForTimeout(500);
  const h1 = await p.evaluate(() => history.length);
  ok('typing-no-history', h1 === h0, `history ${h0}→${h1}`);
  ok('search-in-url', (await p.evaluate(() => location.hash)).includes('ex.q=T08'));
  const rows = await p.$$eval('#exT tbody tr[data-rk]', (t) => t.map((x) => x.dataset.rk));
  ok('search-results', rows.length > 0, rows.length + ' rows');
  const target = rows.find((r) => /HW|T08/.test(r)) || rows[0];
  await p.click(`#exT tbody tr[data-rk="${target}"]`); await p.waitForTimeout(200);
  ok('detail-open', await p.evaluate(() => document.querySelector('#detail').classList.contains('open')), target);
  ok('detail-in-url', decodeURIComponent(await p.evaluate(() => location.hash)).includes('rec=' + target));
  await p.evaluate((v) => { const b = document.querySelector('.rail button[data-v=\"' + v + '\"]'); const d = b.closest('details'); if (d) d.open = true; }, 'mobile'); await p.click('.rail button[data-v=\"mobile\"]'); await p.waitForTimeout(250);
  ok('navigate-away', await p.evaluate(() => STATE.view === 'mobile' && !document.querySelector('#detail').classList.contains('open')));
  await p.goBack(); await p.waitForTimeout(300);
  const st1 = await p.evaluate(() => ({v: STATE.view, q: document.querySelector('#exT input.search').value, rec: STATE.rec, open: document.querySelector('#detail').classList.contains('open')}));
  ok('back-restores-detail', st1.v === 'explorer' && st1.q === 'T08' && st1.open && st1.rec === target, JSON.stringify(st1));
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  const st2 = await p.evaluate(() => ({v: STATE.view, q: document.querySelector('#exT input.search').value, open: document.querySelector('#detail').classList.contains('open')}));
  ok('escape-closes-detail-keeps-search', st2.v === 'explorer' && st2.q === 'T08' && !st2.open, JSON.stringify(st2));
  await p.reload(); await p.waitForTimeout(700);
  const st3 = await p.evaluate(() => ({v: STATE.view, q: document.querySelector('#exT input.search').value}));
  ok('reload-keeps-search', st3.v === 'explorer' && st3.q === 'T08', JSON.stringify(st3));
  await p.goForward(); await p.waitForTimeout(300);
  ok('forward-reopens-detail', await p.evaluate(() => document.querySelector('#detail').classList.contains('open')));
  // special characters in search survive reload and history
  for (const term of ['A&B', '50% + x', 'a=b?c', 'x#y', 'پل‌ها/ابر', 'T08 & HW']) {
    await p.goto(FILE + '#explorer'); await p.waitForTimeout(300);
    await p.fill('#exT input.search', term); await p.waitForTimeout(450);
    await p.reload(); await p.waitForTimeout(600);
    const got = await p.evaluate(() => ({q: document.querySelector('#exT input.search').value, toasts: document.querySelectorAll('.toast').length}));
    ok('special-chars ' + JSON.stringify(term), got.q === term && got.toasts === 0, JSON.stringify(got));
  }
  // pagination: all records browsable
  await p.goto(FILE + '#explorer'); await p.waitForTimeout(500);
  const total = await p.evaluate(() => REC.list.length);
  await p.selectOption('#exT .pager select', '250'); await p.waitForTimeout(200);
  let seen = new Set();
  for (let i = 0; i < 10; i++) { (await p.$$eval('#exT tbody tr[data-rk]', (t) => t.map((x) => x.dataset.rk))).forEach((k) => seen.add(k)); const nb = await p.$('#exT .pager button:has-text("بعدی"):not([disabled])'); if (!nb) break; await nb.click(); await p.waitForTimeout(150); }
  ok('all-records-browsable', seen.size === total, seen.size + '/' + total);
  // deep link with page/sort
  await p.goto(FILE + '#explorer?exKind=cand&ex.p=2&ex.s=v&ex.d=-1'); await p.waitForTimeout(500);
  ok('deeplink-page-sort', await p.evaluate(() => STATE.exKind === 'cand' && STATE.tbl.ex.p === 2 && document.querySelector('#exT th[data-c="v"]').getAttribute('aria-sort') === 'descending'));
  // invalid URL
  await p.goto(FILE + '#nope?zz=1'); await p.waitForTimeout(500);
  ok('invalid-url-fallback', await p.evaluate(() => STATE.view === 'command' && document.querySelector('#views').innerText.length > 500 && !!document.querySelector('.toast')));
  await p.goto(FILE + '#explorer?rec=NOT-A-RECORD'); await p.waitForTimeout(500);
  ok('invalid-record-fallback', await p.evaluate(() => STATE.view === 'explorer' && !document.querySelector('#detail').classList.contains('open') && !!document.querySelector('.toast')));
  // workbook state
  await p.goto(FILE + '#provinces'); await p.waitForTimeout(500);
  const sheets = await p.evaluate(() => D.wbPorts.map((s, i) => s.id || i));
  ok('workbook-present', sheets.length > 0, sheets.length + ' sheets');
  // three-state values
  const ts = await p.evaluate(() => [VAL(0, 'x'), VAL(null), VAL({__error: 'timeout'})].map((h) => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.trim(); }));
  ok('zero-null-error-distinct', ts[0].startsWith('۰') && ts[1] === 'ناموجود' && ts[2] === 'خطای دریافت', ts.join(' | '));
  // fullscreen panel + escape
  await p.goto(FILE + '#fixed'); await p.waitForTimeout(500);
  await p.click('#views .p .pfull'); await p.waitForTimeout(250);
  const fs1 = await p.evaluate(() => !!document.querySelector('.p.full') && /full=[a-z]/.test(location.hash));
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  const fs2 = await p.evaluate(() => [!!document.querySelector('.p.full'), location.hash, document.activeElement.id]); ok('panel-fullscreen-escape', fs1 && !fs2[0], JSON.stringify([fs1, fs2]));
  // online view: no fake data offline
  await p.goto(FILE + '#online'); await p.waitForTimeout(600);
  const on = await p.evaluate(() => ({live: [...document.querySelectorAll('#onHealth .badge')].filter((b) => b.textContent === 'دریافت فعال').length, svgTimeline: document.querySelectorAll('#onTimeline svg').length}));
  ok('online-offline-no-fake', on.live === 0 && on.svgTimeline === 0, JSON.stringify(on));
  // mobile + wide
  for (const [w, h] of [[390, 844], [2560, 1300]]) { await p.setViewportSize({width: w, height: h}); await p.goto(FILE + '#explorer'); await p.waitForTimeout(500); const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok('layout-' + w, ov <= 2, 'overflow ' + ov); }
  ok('no-page-errors', errs.length === 0, errs.join(' | '));
  require('fs').mkdirSync(__dirname + '/../test-results', {recursive: true}); require('fs').writeFileSync(__dirname + '/../test-results/nav_results.json', JSON.stringify(R, null, 1));
  await b.close();
})();
