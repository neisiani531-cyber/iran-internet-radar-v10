// v4.5: numbers into visuals; interactivity; motion; data tables for every chart.
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const ok = (id, c, d) => console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1600, height: 1000}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const at = async (h, t = 900) => { await p.goto(FILE + h); await p.waitForTimeout(t); };
  await at('#command');
  const c = await p.evaluate(() => ({tiles: document.querySelectorAll('#views .strip .kpi').length, vis: [...document.querySelectorAll('#views .strip .kpi')].filter((k) => k.querySelector('.vz, svg.spark')).length, brief: document.querySelectorAll('.brief-viz svg, .brief-viz .vz').length, fresh: !!document.querySelector('.fresh-tl')}));
  ok('G01 every command KPI tile carries a visual', c.tiles === 8 && c.vis === 8, JSON.stringify(c));
  ok('G02 executive brief messages are drawn, freshness is a timeline', c.brief >= 3 && c.fresh, JSON.stringify(c));
  // every chart has a data table
  const miss = [];
  for (const v of ['command', 'fixed', 'mobile', 'quality', 'platforms', 'research', 'decision', 'nin', 'domains', 'infra', 'provinces']) {
    await at('#' + v, 1100);
    const m = await p.evaluate(() => [...document.querySelectorAll('#views .ch')].filter((ch) => ch.querySelector(':scope > svg') && !ch.querySelector(':scope > .srwrap')).map((ch) => ch.id || ch.closest('.p')?.dataset.pid));
    if (m.length) miss.push(v + ':' + m.join(','));
  }
  ok('G03 every drawn chart has a screen-reader data table', !miss.length, miss.join(' | '));
  // mobile: operator dot plot + table toggle
  await at('#mobile');
  const mb = await p.evaluate(() => ({rows: document.querySelectorAll('#mbDots svg circle').length, table: document.querySelector('#mbTable').hidden}));
  await p.click('#mbView button[data-m="table"]'); await p.waitForTimeout(150);
  const mb2 = await p.evaluate(() => ({t: !document.querySelector('#mbTable').hidden, d: document.querySelector('#mbDots').hidden}));
  ok('G04 operator scorecard drawn as dots, table on demand', mb.rows >= 40 && mb.table && mb2.t && mb2.d, JSON.stringify({mb, mb2}));
  ok('G05 derived official values labelled as derived', await p.evaluate(() => [...document.querySelectorAll('#views .kpi')].some((k) => /سایت فعال 4G/.test(k.textContent) && /محاسبه از رسمی/.test(k.textContent))));
  // fixed: mixed units on separate scales + complaint ratio wording
  await at('#fixed');
  const fx = await p.evaluate(() => ({ug: document.querySelectorAll('#fxRural .ug').length, lead: document.querySelector('#fxComp').closest('.p').querySelector('.lead').textContent}));
  ok('G06 rural access split by unit; complaint ratio stated honestly', fx.ug >= 2 && /برابر/.test(fx.lead) && !/سه برابر/.test(fx.lead), JSON.stringify(fx).slice(0, 220));
  // decision: roadmap + readiness, click opens card
  await at('#decision');
  const dc = await p.evaluate(() => ({road: document.querySelectorAll('#dcRoad svg rect[rx="5"]').length, ready: document.querySelectorAll('#dcReady svg rect[rx="5"]').length}));
  await p.evaluate(() => document.querySelector('#dcReady svg rect[rx="5"]').dispatchEvent(new MouseEvent('click', {bubbles: true}))); await p.waitForTimeout(300);
  ok('G07 decision roadmap (6×4) and readiness matrix (6×9) drawn and clickable', dc.road === 24 && dc.ready === 54 && await p.evaluate(() => !!document.querySelector('.mc.flash')), JSON.stringify(dc));
  // research rows open the record
  await at('#research');
  await p.click('#rsList .evlink'); await p.waitForTimeout(400);
  ok('G08 evidence browser rows open the record card', await p.evaluate(() => DETAIL.isOpen() && STATE.rec.startsWith('res:')));
  // NIN: domain sparkline never draws missing as zero; heat ink readable; NIN tiles show goal dots
  await at('#nin');
  const sp = await p.evaluate(() => { const s = VZ.spark([null, 10, 20], '#fff'); return /ناموجود/.test(s) && /d="M/.test(s) && !/M3\.0,/.test(s); });
  const ink = await p.evaluate(() => INK('#ff5a54') !== INK('#1a2533') && INK('#121b26') === '#eef3f8' && INK('#2fd39c') === '#0b0f14');
  const dots = await p.evaluate(() => document.querySelectorAll('.nin-strip .vz-dots').length);
  ok('G09 null never plotted as zero; ink by luminance; goal dots on NIN tiles', sp && ink && dots === 3, JSON.stringify({sp, ink, dots}));
  ok('G10 consistency claim computed, not asserted', await p.evaluate(() => { const c = NIN.consistency(); return c.n > 60 && c.bad === 6 && c.maxOk <= 1; }), await p.evaluate(() => JSON.stringify(NIN.consistency())));
  // domains: evidence mix bars
  await at('#domains');
  ok('G11 architecture cards show evidence mix as a bar', await p.evaluate(() => document.querySelectorAll('.dl .vz-split').length >= 6));
  // motion: on by request, entrance + count-up, off under reduced motion
  await p.evaluate(() => localStorage.setItem('radar-motion', '1'));
  await at('#command', 120);
  const mid = await p.evaluate(() => ({draw: document.querySelectorAll('.vz-draw').length, inn: document.querySelectorAll('.vz-in').length, txt: document.querySelector('.strip .kpi .v span').textContent}));
  await p.waitForTimeout(1200);
  const end = await p.evaluate(() => document.querySelector('.strip .kpi .v span').textContent);
  ok('G12 entrance animation and count-up settle on the exact value', mid.draw > 3 && mid.inn > 20 && end === await p.evaluate(() => document.querySelector('.strip .kpi .v span').getAttribute('aria-label')), JSON.stringify({...mid, end}));
  const p2 = await b.newPage({reducedMotion: 'reduce'}); await p2.addInitScript(() => localStorage.setItem('radar-motion', '1'));
  await p2.goto(FILE + '#command'); await p2.waitForTimeout(400);
  ok('G13 reduced-motion users get no animation', await p2.evaluate(() => document.querySelectorAll('.vz-draw,.vz-in').length === 0 && document.documentElement.classList.contains('no-motion')));
  await p.evaluate(() => localStorage.removeItem('radar-motion'));
  // assistant answers carry pictures
  ok('G14 assistant trend answer includes a chart', await p.evaluate(() => /<svg class="aiviz"/.test(AI.route('روند شبکه ملی را تحلیل کن', {}).b)));
  ok('G15 no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  await b.close();
})();
