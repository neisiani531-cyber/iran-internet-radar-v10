// v4.5: fixes for the v4.4 review (74/100) high-severity items.
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const ok = (id, c, d) => console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1600, height: 1000}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE + '#command'); await p.waitForTimeout(900);
  const txt = await p.evaluate(() => document.querySelector('#views').innerText);
  ok('F01 counts derived from data', await p.evaluate(() => [...document.querySelectorAll('#views .k')].some((x) => x.textContent === 'EVIDENCE · ' + D.evidence.length)));
  // dead buttons
  await p.click('#cmdMech button'); await p.waitForTimeout(500);
  ok('F02 mechanism cards navigate', await p.evaluate(() => STATE.view === 'decision'));
  // fullscreen redraw width
  await p.goto(FILE + '#nin'); await p.waitForTimeout(900);
  const w0 = await p.evaluate(() => document.querySelector('#ninTraj svg').getAttribute('width') || document.querySelector('#ninTraj svg').viewBox.baseVal.width);
  await p.evaluate(() => document.querySelector('#ninTraj').closest('.p').querySelector('.pfull').click()); await p.waitForTimeout(700);
  const w1 = await p.evaluate(() => { const s = document.querySelector('.p.full svg'); return s.getAttribute('width') || s.viewBox.baseVal.width; });
  ok('F03 full-screen panel redrawn at full width', +w1 > +w0 * 1.3, w0 + '→' + w1);
  // layering: detail opened inside full panel is on top, assistant from detail on top
  await p.evaluate(() => DETAIL.open('nin:' + NIN.idOf(NIN.inds[0]))); await p.waitForTimeout(300);
  const z1 = await p.evaluate(() => { const r = document.querySelector('#detail').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + 80); return !!e.closest('#detail'); });
  await p.click('#dtAsk'); await p.waitForTimeout(600);
  const z2 = await p.evaluate(() => { const r = document.querySelector('#ai').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + 120); return !!e.closest('#ai'); });
  ok('F04 detail over full panel, assistant over detail', z1 && z2, JSON.stringify({z1, z2}));
  // registry crash
  const g = await p.evaluate(() => { try { const a = AI.route('چه شکاف داده‌ای داریم؟', {}); return a.h; } catch (e) { return 'ERR ' + e.message; } });
  ok('F05 «شکاف داده» answers without crash', !/ERR/.test(g), g);
  // invalid URL state
  for (const h of ['#provinces?pvMap=zzz&prov=IR-99', '#command?cmdMap=bad', '#nin?ninYear=1499&ninGoal=77&ninBand=x']) {
    const e0 = errs.length; await p.goto(FILE + h); await p.waitForTimeout(900);
    const st = await p.evaluate(() => ({pv: STATE.pvMap, prov: STATE.prov, cm: STATE.cmdMap, y: STATE.ninYear, g: STATE.ninGoal, toast: !!document.querySelector('.toast'), err: !!document.querySelector('#views .er')}));
    ok('F06 invalid URL falls back · ' + h, errs.length === e0 && !st.err && st.pv === 'fthU' && st.prov === 'IR-07' && st.cm === 'fthU' && st.y === '1405' && st.g === 0, JSON.stringify(st));
  }
  // follow-up routing
  const f = await p.evaluate(() => AI.route('برای اصفهان چه داده داریم؟', {kind: 'ninAll'}).h);
  ok('F07 follow-up with new entity routes to that entity', /اصفهان/.test(f), f);
  const f2 = await p.evaluate(() => AI.route('همین را برای هدف ۱۴', {kind: 'ninGoal', ent: 3}).h);
  ok('F08 genuine NIN follow-up still works', /هدف ۱۴/.test(f2), f2);
  // deep-link detail close stays on page
  await p.goto('about:blank'); await p.goto(FILE + '#command?rec=' + encodeURIComponent('nin:NIN-G01')); await p.waitForTimeout(900);
  const opened = await p.evaluate(() => DETAIL.isOpen());
  await p.evaluate(() => DETAIL.close()); await p.waitForTimeout(500);
  ok('F09 closing deep-linked detail stays in app', await p.evaluate(() => location.protocol === 'file:' && !DETAIL.isOpen() && !/rec=/.test(location.hash)), String(opened));
  // url hygiene
  await p.goto(FILE + '#explorer'); await p.waitForTimeout(800); await p.evaluate(() => { TBL; }); 
  ok('F10 default table params not written to URL', await p.evaluate(() => !/\.d=-1|\.n=50/.test(URLS.ser())), await p.evaluate(() => URLS.ser()));
  ok('F11 no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  await b.close();
})();
