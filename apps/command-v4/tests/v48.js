// v4.8: report studio — free-text request -> plan -> data-bound report -> A4 preview -> Word / PowerPoint / HTML / print.
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const API = process.argv[2] || 'http://127.0.0.1:8765';
let FAILS = 0;
const ok = (id, c, d) => { if (!c) FAILS++; console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : '')); };
process.on('exit', () => { if (FAILS) process.exitCode = 1; });
process.on('unhandledRejection', (e) => { console.log('FAIL crash · ' + (e && e.message)); process.exit(1); });
const unzipNames = (buf) => { const out = []; let i = 0; while ((i = buf.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), i)) >= 0) { const n = buf.readUInt16LE(i + 26), e = buf.readUInt16LE(i + 28), sz = buf.readUInt32LE(i + 18); out.push(buf.slice(i + 30, i + 30 + n).toString('utf8')); i += 30 + n + e + sz; } return out; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1366, height: 900}, acceptDownloads: true});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(FILE + '#report'); await p.waitForTimeout(700);
  const P = (q) => p.evaluate((q) => { const x = RPT.parse(q); return {...x, title: RPT.autoTitle(x)}; }, q);
  let x = await P('گزارش وضعیت شبکه ملی اطلاعات برای معاون وزیر، خلاصه و در قالب پاورپوینت');
  ok('R01 parse status/exec/brief/pptx + recipient', x.tpl === 'status' && x.aud === 'exec' && x.len === 'brief' && x.fmt === 'pptx' && x.recipient === 'معاون وزیر' && x.topics.includes('nin'), JSON.stringify([x.tpl, x.aud, x.len, x.fmt, x.recipient]));
  x = await P('مقایسه فیبر اصفهان و فارس با تحلیل و توصیه، فایل ورد');
  ok('R02 parse compare: provinces, fiber, decision, docx', x.tpl === 'compare' && x.provs.join() === 'IR-04,IR-14' && x.topics.includes('fixed') && x.topics.includes('decision') && x.fmt === 'docx', JSON.stringify([x.tpl, x.provs, x.topics, x.fmt]));
  x = await P('کارنامه تحقق اهداف شبکه ملی برای جلسه شورا');
  ok('R03 parse NIN scorecard', x.tpl === 'nin' && x.topics[0] === 'nin' && x.aud === 'exec', JSON.stringify([x.tpl, x.topics, x.aud]));
  x = await P('گزارش رخدادهای اختلال و حملات سایبری');
  ok('R04 parse incident -> online', x.tpl === 'incident' && x.topics.includes('online'), JSON.stringify([x.tpl, x.topics]));
  x = await P('وضعیت همراه اول و ایرانسل در 4G و 5G');
  ok('R05 parse operators -> mobile compare', x.ops.length === 2 && x.topics.includes('mobile'), JSON.stringify([x.ops, x.topics]));
  x = await P('گزارش کارشناسی کیفیت شبکه و ترافیک بین‌الملل، کامل');
  ok('R06 parse expert/full/quality', x.aud === 'expert' && x.len === 'full' && x.topics.includes('quality'), JSON.stringify([x.aud, x.len, x.topics]));

  // studio flow
  await p.fill('#rptQ', 'مقایسه فیبر اصفهان و فارس با تحلیل و توصیه، فایل ورد'); await p.click('#rptPlanBtn'); await p.waitForTimeout(250);
  const plan = await p.evaluate(() => ({vis: !$('#rptPlanBox').hidden, fmt: ($('#rpFmt [aria-pressed="true"]') || {}).dataset.k, provs: [...$('#rpProv').selectedOptions].map((o) => o.value), why: $('.rpt-why').textContent}));
  ok('R07 plan box shows the reading, editable', plan.vis && plan.fmt === 'docx' && plan.provs.length === 2 && /اصفهان/.test(plan.why), JSON.stringify(plan).slice(0, 160));
  await p.click('#rptBuild'); await p.waitForTimeout(2200);
  let rep = await p.evaluate(() => ({secs: RPTV.rep.sections.map((s) => s.key ? 1 : 0), titles: RPTV.rep.sections.map((s) => s.title), figs: $$('#rptDoc .rp-fig svg').length, broken: $$('#rptDoc .rp-fig .empty-state').length, tables: $$('#rptDoc .rp-t').length, sum: RPTV.rep.summary.length, src: RPTV.rep.sources.length, labels: $$('#rptDoc .rp-l').length, nan: /NaN|undefined|null/.test($('#rptDoc').textContent), bar: $$('#rptBar [data-out]').length, main: ($('#rptBar .rpt-main') || {}).dataset.out}));
  ok('R08 report has sections with a key finding each', rep.secs.length >= 3 && rep.secs.every(Boolean), JSON.stringify(rep.titles));
  ok('R09 figures drawn into paper, none broken', rep.figs >= 3 && rep.broken === 0, `figs ${rep.figs}`);
  ok('R10 tables, summary, sources appendix', rep.tables >= 3 && rep.sum === rep.secs.length && rep.src >= 4, JSON.stringify([rep.tables, rep.sum, rep.src]));
  ok('R11 evidence labels on analytic paragraphs', rep.labels >= 4, `labels ${rep.labels}`);
  ok('R12 no NaN/undefined/null text', !rep.nan);
  ok('R13 export bar: 4 formats, requested one highlighted', rep.bar === 4 && rep.main === 'docx');
  const prov = await p.evaluate(() => { const t = [...$$('#rptDoc .rp-t')].find((t) => /اصفهان/.test(t.textContent) && /فارس/.test(t.textContent)); return t ? t.textContent : ''; });
  ok('R14 province comparison table carries both provinces', /اصفهان/.test(prov) && /فارس/.test(prov));
  const paper = await p.evaluate(() => { const r = $('#rptDoc').getBoundingClientRect(); return {w: Math.round(r.width), bg: getComputedStyle($('#rptDoc')).backgroundColor, sw: document.documentElement.scrollWidth}; });
  ok('R15 A4-wide light paper, no horizontal overflow', paper.w <= 794 && paper.bg === 'rgb(255, 255, 255)' && paper.sw <= 1366, JSON.stringify(paper));
  // exports
  for (const [f, need] of [['docx', ['word/document.xml', 'word/styles.xml', 'word/media/fig1.png']], ['pptx', ['ppt/presentation.xml', 'ppt/slides/slide1.xml', 'ppt/media/img1.png']]]) {
    const [d] = await Promise.all([p.waitForEvent('download'), p.click(`#rptBar [data-out="${f}"]`)]);
    const fp = await d.path(), buf = require('fs').readFileSync(fp), names = unzipNames(buf);
    ok(`R16 ${f} package valid (${names.length} parts)`, buf.slice(0, 2).toString() === 'PK' && need.every((n) => names.includes(n)) && d.suggestedFilename().endsWith("." + f), d.suggestedFilename());
    if (process.env.KEEP) require('fs').copyFileSync(fp, process.env.KEEP + '/sample.' + f);
  }
  const crc = await p.evaluate(() => RPTX.crc32(new TextEncoder().encode('123456789')).toString(16));
  ok('R17 zip CRC32 correct', crc === 'cbf43926', crc);
  const [dh] = await Promise.all([p.waitForEvent('download'), p.click('#rptBar [data-out="html"]')]);
  const htm = require('fs').readFileSync(await dh.path(), 'utf8');
  ok('R18 standalone HTML: svg inlined, font embedded, no script', /<svg/.test(htm) && /@font-face/.test(htm) && !/<script/i.test(htm) && /dir="rtl"/.test(htm), `${Math.round(htm.length / 1024)} KB`);
  const pr = await p.evaluate(() => { let called = 0; const o = window.print; window.print = () => { called++; }; RPTX.out('pdf', RPTV.rep); return new Promise((r) => setTimeout(() => { const cls = document.body.classList.contains('rpt-print'); window.dispatchEvent(new Event('afterprint')); window.print = o; r({called, cls, after: document.body.classList.contains('rpt-print')}); }, 120)); });
  ok('R19 PDF: print mode on, print called, cleaned after', pr.called === 1 && pr.cls && !pr.after, JSON.stringify(pr));

  // executive brief drops tables, keeps one figure per section
  await p.fill('#rptQ', 'گزارش وضعیت شبکه ملی اطلاعات برای معاون وزیر، خلاصه'); await p.click('#rptPlanBtn'); await p.waitForTimeout(200); await p.click('#rptBuild'); await p.waitForTimeout(3000);
  rep = await p.evaluate(() => ({n: RPTV.rep.sections.length, tb: RPTV.rep.sections.filter((s) => s.id !== 'decision').reduce((a, s) => a + s.blocks.filter((b) => b.type === 'table').length, 0), maxF: Math.max(...RPTV.rep.sections.map((s) => s.blocks.filter((b) => b.type === 'fig').length)), recs: RPTV.rep.recs.length, broken: $$('#rptDoc .rp-fig .empty-state').length}));
  ok('R20 exec brief: data tables only in the decision section, ≤1 figure per section', rep.n >= 5 && rep.tb === 0 && rep.maxF <= 1 && rep.broken === 0, JSON.stringify(rep));
  // online section offline: an explicit note, never invented numbers
  await p.fill('#rptQ', 'گزارش رخدادهای اختلال و حملات سایبری'); await p.click('#rptPlanBtn'); await p.waitForTimeout(200); await p.click('#rptBuild'); await p.waitForTimeout(1500);
  const on = await p.evaluate(() => { const s = RPTV.rep.sections.find((s) => s.title.includes('پایش') || s.title.includes('رخداد')); return s ? s.blocks.map((b) => b.type + ':' + (b.text || b.caption || '')).join(' | ') : ''; });
  ok('R21 offline online-section says no live data', /زنده|سرور/.test(on) && !/فعال است/.test(on), on.slice(0, 200));
  // assistant hook
  const a = await p.evaluate(() => { const r = AI.route('یک گزارش مقایسه‌ای فیبر اصفهان و فارس برای مدیرکل بساز', {}); return r ? {h: r.h, b: r.b.replace(/<[^>]+>/g, ' '), go: /data-go="report"/.test(r.b)} : null; });
  ok('R22 assistant routes «گزارش … بساز» to the studio', a && a.h === 'گزارش‌ساز' && a.go && /اصفهان/.test(a.b), a && a.b.slice(0, 120));
  const a2 = await p.evaluate(() => (AI.route('گزارش ملت درباره رضایت چی میگه', {}) || {}).h);
  ok('R23 a question about a report is not hijacked', a2 !== 'گزارش‌ساز', a2);
  const g = await p.evaluate(() => (AI.route('گزارش‌ساز چیه', {}) || {}).h || '');
  ok('R24 guide knows the studio', /گزارش‌ساز/.test(g), g);
  // URL keeps the request
  await p.goto(FILE + '#report?rptQ=' + encodeURIComponent('کیفیت شبکه برای مدیرکل')); await p.waitForTimeout(700);
  ok('R25 request restored from URL and planned', await p.evaluate(() => $('#rptQ').value === 'کیفیت شبکه برای مدیرکل' && !$('#rptPlanBox').hidden));
  for (const w of [1024, 390]) { await p.setViewportSize({width: w, height: 800}); await p.waitForTimeout(250); const sw = await p.evaluate(() => document.documentElement.scrollWidth); ok(`R26 no page overflow at ${w}px`, sw <= w, String(sw)); }
  ok('R27 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  await b.close();
})();
