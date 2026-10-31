// v4.7: dashboard self-knowledge in the assistant, chart-first online page, refresh, no horizontal overflow, review fixes.
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const API = process.argv[2] || 'http://127.0.0.1:8765';
const ok = (id, c, d) => console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1366, height: 800}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(FILE + '#command'); await p.waitForTimeout(800);
  const A = (q, ctx) => p.evaluate(([q, c]) => { const a = AI.route(q, c || {}); return a ? {h: a.h, b: a.b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')} : {h: 'NULL', b: ''}; }, [q, ctx]);
  const cases = [
    ['نمونه شواهد و تصمیم توش چیه؟', /شواهد و تصمیم/, /کاوش همه داده‌ها.*تحلیل‌های پژوهشی.*منابع و شواهد.*پشتیبان تصمیم.*معماری/],
    ['شواهد و تصمیم', /شواهد و تصمیم/, /پشتیبان تصمیم/],
    ['تحلیل‌های تخصصی چی داره', /تحلیل‌های تخصصی/, /دسترسی ثابت و فیبر/],
    ['پایش آنلاین چه دارد؟', /پایش آنلاین/, /رخدادهای باز.*نقشه تغییر/],
    ['لایه‌های شبکه ملی اطلاعات چیه؟', /لایه/, /زیرساخت ارتباطی.*حکمرانی.*مردم/],
    ['خدمات پایه چیست', /حوزه «خدمات پایه/, /DNS/],
    ['نقشه تغییر چی نشون میده؟', /نقشه تغییر/, /خط مبنا/],
    ['نقشه راه پیشنهادی چی نشون میده', /نقشه راه/, /سازوکار/],
    ['شاخص های کلیدی چیه', /شاخص‌های کلیدی/, /خطوط فعال سیار/],
    ['این داشبورد چه بخش‌هایی دارد؟', /چه بخش/, /پایش آنلاین/],
    ['فرق پوشش فیبر و پورت دایر چیه', /سه سنجه/, /پورت/],
    ['خط مبنا یعنی چه', /خط مبنا/, /ناهنجاری/],
  ];
  for (const [q, h, b] of cases) { const a = await A(q); ok('G · ' + q, h.test(a.h) && b.test(a.b), a.h + ' | ' + a.b.slice(0, 90)); }
  // analysis questions still go to the analysts, not the guide
  const an = [['روند توسعه شبکه ملی اطلاعات را تحلیل کن', /تحلیل روند/], ['پیشرفت شبکه ملی در ۱۴۰۲', /۱۴۰۲/], ['اصفهان و فارس را مقایسه کن', /اصفهان/], ['بیشترین پوشش 4G کدام اپراتور است', /اپراتور/], ['سرعت 4G اپراتورها', /اپراتور/]];
  for (const [q, h] of an) { const a = await A(q); ok('N · ' + q, h.test(a.h) && !/^(بخش|پنل|گروه)/.test(a.h), a.h); }
  const il = await A('نیم رخ ایلام');
  ok('R4 province without a ratio shows «بدون رتبه», never rank 0', /بدون رتبه/.test(il.b) && !/دایر به منصوبه FTTH — ۰/.test(il.b), il.b.slice(0, 160));
  // guide answers stay local in connected mode and say they are not statistics
  ok('G-src guide answers are labelled as structure, not statistics', /آمار نیست/.test(await p.evaluate(() => AI.route('شواهد و تصمیم توش چیه', {}).b)));
  // review fixes
  await p.goto(FILE + '#nin'); await p.waitForTimeout(900);
  ok('R1 consistency tile aria-label reads «n−bad of n»', await p.evaluate(() => { const c = NIN.consistency(); return [...document.querySelectorAll('.nin-strip .vz-meter')].some((m) => m.getAttribute('aria-label') === 'سازگار ' + (c.n - c.bad) + ' از ' + c.n + ' هدف‌سال'); }));
  await p.focus('#ninYear button[data-y="1401"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
  ok('R23 focus survives re-render (year buttons)', await p.evaluate(() => document.activeElement && document.activeElement.dataset.y === '1401' && STATE.ninYear === '1401'));
  await p.goto(FILE + '#d-communications'); await p.waitForTimeout(900);
  ok('R5 NIN mini table header comes before its rows', await p.evaluate(() => { const m = document.querySelector('.nin-mini'); return m && m.firstElementChild.classList.contains('nm-h'); }));
  await p.goto(FILE + '#research'); await p.waitForTimeout(900);
  ok('R2 international comparisons split by unit', await p.evaluate(() => document.querySelectorAll('#rsHist .ug').length >= 3));
  ok('R21 data-table captions name their panel', await p.evaluate(() => [...document.querySelectorAll('#views caption')].every((c) => /داده نمودار: .+/.test(c.textContent))));
  ok('R8 a missing value in bar charts is drawn as missing, not as zero', await p.evaluate(() => { const el = document.createElement('div'); el.style.width = '500px'; document.body.appendChild(el); K.vbar(el, {cats: ['الف', 'ب'], series: [{n: 'س', c: '#fff', vals: [3, null]}]}); const r = [...el.querySelectorAll('td')].some((t) => t.textContent === 'ناموجود') && !!el.querySelector('rect[stroke-dasharray]'); el.remove(); return r; }));
  await p.goto(FILE + '#explorer'); await p.waitForTimeout(700);
  ok('R9 explorer panel has a header and a full-screen button', await p.evaluate(() => !!document.querySelector('#views .p[data-pid="explorer"] header .pfull')));
  await p.goto(FILE + '#provinces?pvs=fthA:1'); await p.waitForTimeout(600); await p.goto(FILE + '#provinces'); await p.waitForTimeout(600);
  ok('R6 a URL without pvs resets the province sort', await p.evaluate(() => STATE.pvSort.k === 'fthI' && STATE.pvSort.dir === -1));
  ok('R3 assistant: «بیشترین پوشش 4G» answers operators', /اپراتور/.test((await A('بیشترین پوشش 4G')).h));
  // no page wider than the window
  const wide = [];
  for (const w of [1920, 1600, 1366, 1280, 1024, 768, 390]) {
    await p.setViewportSize({width: w, height: 800});
    for (const v of ['command', 'online', 'nin', 'decision']) { await p.goto(FILE + '#' + v); await p.waitForTimeout(350); const sw = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (sw > 1) wide.push(v + '@' + w + '+' + sw); }
  }
  ok('L1 no horizontal page scroll from 1920 to 390 px', !wide.length, wide.join(' '));
  await p.setViewportSize({width: 1366, height: 800});
  // online page: charts first, compact offline
  await p.goto(FILE + '#online'); await p.waitForTimeout(800);
  const off = await p.evaluate(() => ({trends: document.querySelectorAll('.on-trs .on-tr .empty-state').length, top: Math.round(document.querySelector('.on-trends').getBoundingClientRect().top), setBtn: !!document.querySelector('#onSetServer'), more: !document.querySelector('#onMore').open}));
  ok('O1 offline: three trend slots, no fake series, method/raw collapsed, server setup button', off.trends === 3 && off.setBtn && off.more, JSON.stringify(off));
  ok('O2 trends start within the first screen (1366×800)', off.top < 560, String(off.top));
  await p.evaluate((a) => localStorage.setItem('radarApi', a), API);
  await p.goto(FILE + '#online'); await p.waitForTimeout(2800);
  const con = await p.evaluate(() => ({svgs: document.querySelectorAll('.on-trs svg').length, base: document.querySelectorAll('.on-trs svg line[stroke-dasharray="4 4"]').length, upd: document.querySelector('#onUpdated').textContent, timer: !!ON.timer}));
  ok('O3 connected: BGP, ping and OONI drawn with their baselines; update time shown', con.svgs >= 3 && con.base === 3 && /به‌روزرسانی/.test(con.upd) && con.timer, JSON.stringify(con));
  await p.evaluate(() => { window.__u = document.querySelector('#onUpdated').textContent; }); await p.waitForTimeout(1100);
  await p.click('#onRefresh'); await p.waitForTimeout(2200);
  ok('O4 manual refresh re-fetches', await p.evaluate(() => document.querySelector('#onUpdated').textContent !== window.__u));
  await p.click('#onAuto'); ok('O5 auto-refresh choice remembered', await p.evaluate(() => localStorage.getItem('radarOnAuto') === '0' && !ON.autoOn()));
  await p.click('#onAuto');
  const g = await p.evaluate(() => AI.route('پایش آنلاین الان فعاله؟', {}));
  ok('O6 «is online monitoring live?» checks the server instead of guessing', g && g.liveSelf === true, g && g.h);
  await p.evaluate(() => AIUI.ask('پایش آنلاین الان فعاله؟')); await p.waitForTimeout(1500);
  ok('O7 live self-check lists source states from the server', await p.evaluate(() => /پاسخ سرور/.test([...document.querySelectorAll('#aiMsgs .m.a')].pop().textContent)));
  ok('Z no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  await b.close();
})();
