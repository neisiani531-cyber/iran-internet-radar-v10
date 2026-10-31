// Connected mode against the FastAPI harness (tests/e2e_server.py): source health, timeline, signals, assistant via server, web toggle, API error.
const {chromium} = require('playwright');
const FILE = 'file://' + require('path').resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const API = process.argv[2] || 'http://127.0.0.1:8765';
const ok = (id, c, d) => console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1600, height: 1000}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(FILE); await p.evaluate((a) => localStorage.setItem('radarApi', a), API);
  await p.goto(FILE + '#online'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelector('#onMore').open = true; }); await p.waitForTimeout(900); // raw data is drawn when its section is opened
  const h = await p.evaluate(() => [...document.querySelectorAll('#onHealth tbody tr')].map((tr) => tr.children[1].textContent));
  ok('health-from-server', h[0] === 'دریافت فعال' && h.includes('موقتاً ناموفق') && h.includes('نیازمند کلید') && h.includes('در انتظار نخستین دریافت'), h.join('|'));
  ok('collector-error-shown', await p.evaluate(() => document.querySelector('#onHealth').textContent.includes('خطای گردآورنده: HTTP 503')));
  ok('timeline-rendered', await p.evaluate(() => document.querySelectorAll('#onTimeline rect').length >= 1));
  ok('signals-rendered-with-gap', await p.evaluate(() => document.querySelectorAll('#onSignals svg').length >= 1 && document.querySelector('#onSignals').textContent.includes('ioda')));
  await p.screenshot({path: __dirname + '/../test-results/online_connected.png'});
  await p.evaluate(() => AIUI.ask('خطوط فعال سیار چقدر است؟')); await p.waitForTimeout(1500);
  const a = await p.evaluate(() => { const m = [...document.querySelectorAll('#aiMsgs .m.a')].pop(); return {t: m.textContent, link: !!m.querySelector('a[data-rk="off:CRA57-MOB-1405"]')}; });
  ok('assistant-server-answer', /مدل زبانی سرور/.test(a.t) && a.link && /ابزارها: get_record/.test(a.t), a.t.slice(0, 120));
  ok('web-tools-hidden-by-default', /ابزارهای وب: (\.|$|\s|ابزارها)/.test(a.t) || !/web_search/.test(a.t));
  await p.evaluate(() => { localStorage.setItem('radarWeb', '1'); }); await p.reload(); await p.waitForTimeout(800);
  await p.evaluate(() => AIUI.ask('آزمون وب')); await p.waitForTimeout(1500);
  ok('web-tools-offered-when-allowed', await p.evaluate(() => /web_search/.test([...document.querySelectorAll('#aiMsgs .m.a')].pop().textContent)));
  // API down → honest fallback
  await p.evaluate(() => localStorage.setItem('radarApi', 'http://127.0.0.1:9')); await p.goto(FILE + '#online'); await p.waitForTimeout(1500);
  ok('api-down-online', await p.evaluate(() => document.querySelector('#onHealth').textContent.includes('اتصال به سرور ناموفق') && document.querySelectorAll('#onTimeline rect').length === 0));
  await p.evaluate(() => AIUI.ask('خطوط فعال سیار چقدر است؟')); await p.waitForTimeout(1500);
  ok('api-down-assistant-fallback', await p.evaluate(() => /در دسترس نبود/.test([...document.querySelectorAll('#aiMsgs .m.a')].pop().textContent)));
  // review 2.1: leaving the online view while its fetch is in flight must not write into the next view
  await p.evaluate((a) => localStorage.setItem('radarApi', a), API); await p.goto(FILE + '#command'); await p.waitForTimeout(500);
  await p.evaluate(() => { go('online'); go('fixed'); }); await p.waitForTimeout(1800);
  ok('2.1 online-race', await p.evaluate(() => STATE.view === 'fixed' && !document.querySelector('#onHealth') && document.querySelector('#views').textContent.includes('فیبر')));
  ok('no-page-errors', errs.length === 0, errs.join('|'));
  await b.close();
})();
