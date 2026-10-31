// v4.6 online monitoring page: judgement, incidents, change map, attacks, cyber register; offline honesty.
// Connected part runs against the FastAPI test harness (apps/api/tests/e2e_server.py, fixtures only).
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const API = process.argv[2] || 'http://127.0.0.1:8765';
const ok = (id, c, d) => console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1600, height: 1000}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  // offline first
  await p.goto(FILE + '#online'); await p.waitForTimeout(900);
  const off = await p.evaluate(() => ({now: document.querySelector('#onNow').textContent, map: !!document.querySelector('#onMap .empty-state'), inc: !!document.querySelector('#onInc .empty-state'),
    reg: document.querySelectorAll('#onReg details.or').length, dots: document.querySelectorAll('#onRegT svg circle').length}));
  ok('O01 offline: no judgement, no live numbers, register still shown', /داوری ممکن نیست/.test(off.now) && off.map && off.inc && off.reg >= 5 && off.dots === off.reg, JSON.stringify(off).slice(0, 160));
  await p.evaluate(() => document.querySelector('#onRegT svg circle').dispatchEvent(new MouseEvent('click', {bubbles: true}))); await p.waitForTimeout(300);
  ok('O02 register timeline opens the incident card with evidence and sources', await p.evaluate(() => { const d = document.querySelector('#onReg details[open]'); return !!d && /سطح شاهد/.test(d.textContent) && d.querySelector('a.lnk[href^="https://"]'); }));
  const cy = await p.evaluate(() => { const a = AI.route('هک بانک سپه تأیید شده؟', {}); return a.h + ' | ' + a.b.replace(/<[^>]+>/g, ' '); });
  ok('O03 offline assistant answers cyber questions with evidence level, claim ≠ confirmation', /سپه/.test(cy) && /ادعای مهاجم/.test(cy) && /تأیید نیست/.test(cy), cy.slice(0, 120));
  // connected
  await p.evaluate((a) => localStorage.setItem('radarApi', a), API);
  await p.goto(FILE + '#online'); await p.waitForTimeout(2600);
  const now = await p.evaluate(() => [...document.querySelectorAll('#onNow .on-layer')].map((x) => x.querySelector('.ol-st').textContent));
  ok('O04 judgement per layer from the detector', now.length === 2 && now[0] === 'اختلال محتمل' && now[1] === 'اختلال محتمل', JSON.stringify(now));
  ok('O05 never claims a healthy network', await p.evaluate(() => !/سالم است(?!\.)|شبکه سالم/.test(document.querySelector('#onNow').textContent.replace('نه اینکه شبکه سالم است', ''))));
  const inc = await p.evaluate(() => [...document.querySelectorAll('#onInc .oi')].map((x) => ({sev: x.querySelector('.oi-sev').textContent, t: x.querySelector('.oi-h b').textContent, rows: x.querySelectorAll('.oi-r').length, cor: x.querySelector('.oi-c').textContent})));
  ok('O06 incidents: critical outage with 3 signals and corroboration; attack incident separate', inc.length === 2 && inc.some((i) => i.sev === 'بحرانی' && i.rows === 3 && /IODA/.test(i.cor)) && inc.some((i) => /حملات/.test(i.t) && i.sev === 'بالا'), JSON.stringify(inc).slice(0, 300));
  ok('O07 alerts issued to the dashboard are listed', await p.evaluate(() => document.querySelectorAll('#onInc .on-al li').length >= 2));
  const map = await p.evaluate(() => ({cells: document.querySelectorAll('#onMap svg rect[rx="6"]').length, red: [...document.querySelectorAll('#onMap svg rect[rx="6"]')].filter((r) => r.getAttribute('fill') === C.red).length, sr: !!document.querySelector('#onMap .srwrap')}));
  ok('O08 change map: scopes × signals, alerts coloured, data table present', map.cells >= 12 && map.red === 3 && map.sr, JSON.stringify(map));
  await p.waitForTimeout(600);
  ok('O09 first alert series drawn with its baseline line', await p.evaluate(() => !!document.querySelector('#onSerCh svg') && !!document.querySelector('#onSerCh svg line[stroke-dasharray="4 4"]')));
  await p.evaluate(() => { const r = [...document.querySelectorAll('#onMap svg rect[rx="6"]')].find((x) => x.getAttribute('fill') === C.teal); r.dispatchEvent(new MouseEvent('click', {bubbles: true})); }); await p.waitForTimeout(800);
  ok('O10 clicking a cell redraws that series', await p.evaluate(() => /بدون نشانه/.test(document.querySelector('#onSeries h5').textContent) && !!document.querySelector('#onSerCh svg')));
  const sec = await p.evaluate(() => ({charts: document.querySelectorAll('#onSec .on-secs svg').length, badge: [...document.querySelectorAll('#onSec .on-secs .badge')].map((x) => x.textContent), share: (document.querySelector('#onSec .on-share') || {}).textContent || ''}));
  ok('O11 attacks: three normalised series, target spike flagged, IR share of L7 targets', sec.charts === 3 && sec.badge[0] === 'هشدار' && /۲٫۴|۲\.۴/.test(sec.share), JSON.stringify(sec).slice(0, 200));
  ok('O12 collection health shows permit/key needs separately', await p.evaluate(() => { const t = document.querySelector('#onColl').textContent; return /نیازمند مجوز/.test(t) && /نیازمند کلید/.test(t) && /موقتاً ناموفق/.test(t); }));
  await p.click('[data-ask-inc]'); await p.waitForTimeout(1500);
  ok('O13 incident hands off to the assistant', await p.evaluate(() => /رخداد شماره/.test([...document.querySelectorAll('#ai .m.u')].pop().textContent)));
  ok('O14 no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  await b.close();
})();
