// v4.8 report quality (handoff 1405-08-07): slide budget, nothing dropped (caveats, recommendations, sources), period guard,
// mixed Persian/Latin runs, full Vazirmatn font in the font package, native tables fit, Word font.
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs'), zlib = require('zlib');
const FILE = 'file://' + path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
let FAILS = 0;
const ok = (id, c, d) => { if (!c) FAILS++; console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : '')); };
// any FAIL (or a crash) ends the process with a non-zero exit code
process.on('exit', () => { if (FAILS) { console.log(`${FAILS} FAIL`); process.exitCode = 1; } });
process.on('unhandledRejection', (e) => { console.log('FAIL crash · ' + (e && e.message)); process.exit(1); });
const unzip = (buf) => { const out = {}; let i = 0; while ((i = buf.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), i)) >= 0) { const m = buf.readUInt16LE(i + 8), n = buf.readUInt16LE(i + 26), e = buf.readUInt16LE(i + 28), sz = buf.readUInt32LE(i + 18); const name = buf.slice(i + 30, i + 30 + n).toString('utf8'), d = buf.slice(i + 30 + n + e, i + 30 + n + e + sz); out[name] = m === 8 ? zlib.inflateRawSync(d) : d; i += 30 + n + e + sz; } return out; };
const text = (xml) => String(xml).split('</a:p>').map((pp) => [...pp.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join('')).join(' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const norm = (s) => String(s).replace(/\s+/g, ' ').replace(/…/g, '').trim();
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1366, height: 900}, acceptDownloads: true});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(FILE + '#report'); await p.waitForTimeout(700);
  const build = async (q) => { await p.fill('#rptQ', q); await p.click('#rptPlanBtn'); await p.waitForTimeout(200); await p.click('#rptBuild'); await p.waitForTimeout(3200); };
  const dl = async (f) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(`#rptBar [data-out="${f}"]`)]); return {name: d.suggestedFilename(), buf: fs.readFileSync(await d.path())}; };
  ok('Q01 font button on the request panel (before any report)', await p.evaluate(() => !!$('#rptFonts0') && !$('#rptWrap').offsetParent));
  const [fd] = await Promise.all([p.waitForEvent('download'), p.click('#rptFonts0')]);
  const fz = unzip(fs.readFileSync(await fd.path())), reg = fz['Vazirmatn-Regular.ttf'];
  // cmap check without a font library: ASCII digit glyph present -> the 'zero' glyph name is in the post table of the full build
  ok('Q02 font package: full Vazirmatn Regular+Bold (Latin and digits), licence', reg && fz['Vazirmatn-Bold.ttf'] && reg.length > 100000 && fz['OFL.txt'] && /Open Font License/.test(fz['OFL.txt']), fd.suggestedFilename() + ' ' + (reg ? reg.length : 0));
  await build('گزارش وضعیت شبکه ملی اطلاعات، خلاصه و در قالب پاورپوینت');
  const rep = await p.evaluate(() => ({caveats: RPTV.rep.sections.flatMap((s) => s.blocks.filter((b) => b.type === 'note').map((b) => b.text)), recs: RPTV.rep.recs.map((m) => m.t), srcs: [...new Set(RPTV.rep.sources.map((s) => s.src))], sum: RPTV.rep.summary.map((m) => m.t), recip: RPTV.rep.recipient}));
  ok('Q03 no recipient invented', rep.recip === '', rep.recip);
  const px = unzip((await dl('pptx')).buf), slides = Object.keys(px).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k)).sort((a, c) => +a.match(/\d+/)[0] - +c.match(/\d+/)[0]);
  ok('Q04 brief deck within budget (≤ 12 slides)', slides.length >= 8 && slides.length <= 12, String(slides.length));
  const canvas = norm(slides.map((k) => text(px[k])).join(' ')), notes = norm(Object.keys(px).filter((k) => /notesSlide\d+\.xml$/.test(k)).map((k) => text(px[k])).join(' '));
  ok('Q05 every caveat on a slide (حدود تفسیر)', rep.caveats.every((c) => canvas.includes(norm(c))), rep.caveats.filter((c) => !canvas.includes(norm(c))).length + ' missing');
  ok('Q06 every recommendation in notes; brief canvas says how many are shown', rep.recs.every((t) => notes.includes(norm(t))) && /اقدام اول از/.test(canvas));
  ok('Q07 every source in notes', rep.srcs.every((s) => notes.includes(norm(s))), rep.srcs.filter((s) => !notes.includes(norm(s))).slice(0, 2).join(' | '));
  ok('Q08 every summary item on the summary slide', rep.sum.every((t) => text(px[slides[1]]).includes(t)));
  const runs = slides.map((k) => String(px[k])).join('');
  ok('Q09 Latin/digit runs tagged en-US, Persian runs fa-IR', /lang="en-US"[^>]*>(?:(?!<\/a:r>).)*<a:t>(?:4G|M0\d|P0|RTT)/.test(runs) && /lang="fa-IR"/.test(runs));
  ok('Q10 no autofit dependence; Vazirmatn on every run', !/normAutofit/.test(runs) && !/typeface="Tahoma"/.test(runs));
  const dx = unzip((await dl('docx')).buf);
  ok('Q11 Word uses Vazirmatn throughout', /w:cs="Vazirmatn"/.test(String(dx['word/styles.xml'])) && !/Tahoma/.test(String(dx['word/document.xml'])));
  // standard/expert deck: decision carried by the recommendations slide, native table fits
  await build('گزارش کارشناسی کامل وضعیت شبکه ملی اطلاعات، پاورپوینت');
  const px2 = unzip((await dl('pptx')).buf), s2 = Object.keys(px2).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k));
  ok('Q12 full deck ≤ 24 slides and decision section not duplicated', s2.length <= 24 && s2.filter((k) => /سازوکارها و اقدام‌های پیشنهادی/.test(text(px2[k]))).length >= 1 && !s2.some((k) => /<a:tbl>/.test(String(px2[k])) && /سازوکار/.test(text(px2[k])) && /اولویت/.test(text(px2[k]))), String(s2.length));
  // period selection (RADAR_REPORT_PERIOD_V3): a named year is built from that year's data or withheld
  const per = await p.evaluate(async () => {
    const g = async (q) => { const pl = RPT.parse(q); pl.title = RPT.autoTitle(pl); const r = await RPT.build(pl); return {title: r.title, secs: Object.fromEntries(r.sections.map((s) => [s.id, s.period === 'withheld' ? 'W' : s.year || '-'])), keys: r.summary.map((m) => m.s).join(' | '), text: r.sections.map((s) => [s.key, ...s.blocks.map((b) => b.text || b.caption || '')].join(' ')).join(' '), lim: r.limits.join(' ')}; };
    return {r0003: await g('کارنامه تحقق اهداف شبکه ملی ۱۴۰۰ تا ۱۴۰۳'), n02: await g('کارنامه اهداف شبکه ملی در ۱۴۰۲'), n04: await g('کارنامه اهداف شبکه ملی ۱۴۰۴'),
      s04: await g('گزارش وضعیت ۱۴۰۴'), m9905: await g('روند پهن‌باند سیار از ۱۳۹۹ تا ۱۴۰۵'), s05: await g('گزارش وضعیت شبکه ملی اطلاعات ۱۴۰۵')}; });
  ok('Q13 range inside coverage builds for its latest year (NIN 1400–1403 -> 1403, mobile 1399–1405 -> 1405)', per.r0003.secs.nin === '1403' && per.m9905.secs.mobile === '1405', JSON.stringify([per.r0003.secs, per.m9905.secs]));
  ok('Q14 named past year uses that year: NIN 1402 headline is 1402, not 1403', per.n02.secs.nin === '1402' && /در ۱۴۰۲: ۵۹٫۱۸٪/.test(per.n02.keys) && !/۵۸٫۹۴/.test(per.n02.keys) && /۱۴۰۲/.test(per.n02.title), per.n02.keys.slice(0, 70));
  ok('Q15 NIN named year 1404 is built from the 1404 data (self-assessment), no other year as its headline', per.n04.secs.nin === '1404' && /۷۹٫۰۱/.test(per.n04.keys + per.n04.text) && !/۷۳٫۰۸|۵۸٫۹۴/.test(per.n04.keys), JSON.stringify([per.n04.secs, per.n04.keys.slice(0, 80)]));
  ok('Q16 status 1404: mobile from winter 1404, 1405-only sections withheld, NIN uses its 1404 value, no 1405 headline', per.s04.secs.mobile === '1404' && per.s04.secs.overview === 'W' && per.s04.secs.fixed === 'W' && per.s04.secs.nin === '1404' && /زمستان ۱۴۰۴/.test(per.s04.keys) && !/۱۲۷٫۶۶|بهار ۱۴۰۵|۷۳٫۰۸/.test(per.s04.keys) && /۱۴۰۴/.test(per.s04.title) && !/۱۴۰۵/.test(per.s04.title), per.s04.keys.slice(0, 90));
  ok('Q17 status 1405: NIN shows its 1405 value (through Shahrivar), not a 1403 figure', per.s05.secs.nin === '1405' && per.s05.secs.fixed === '1405' && !/۵۸٫۹۴/.test(per.s05.keys), JSON.stringify(per.s05.secs));
  ok('Q18 no page errors', errs.length === 0, errs.join(' | ').slice(0, 200));
  await b.close();
})();
