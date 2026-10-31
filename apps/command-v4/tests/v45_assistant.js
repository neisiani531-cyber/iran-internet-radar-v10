// v4.5: assistant follow-up analysis (ported user fix) and inline visuals.
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const ok = (id, c, d) => console.log((c ? 'PASS ' : 'FAIL ') + id + (d ? ' · ' + d : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1500, height: 950}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(FILE + '#command'); await p.waitForTimeout(800);
  const R = (q, ctx) => p.evaluate(([q, c]) => { const a = AI.route(q, c || {}); return a ? {h: a.h, b: a.b.replace(/<[^>]+>/g, ' '), svg: (a.b.match(/<svg class="aiviz"/g) || []).length, ctx: a.ctx} : null; }, [q, ctx]);
  const t1 = await R('روند توسعه شبکه ملی اطلاعات را تحلیل کن');
  ok('A01 NIN trend request gets analytical answer', /تحلیل روند/.test(t1.h) && /۲۳/.test(t1.b) && /۵۸٫۹۴/.test(t1.b) && /۷۳٫۰۸/.test(t1.b) && /۵۰٫۰۸/.test(t1.b) && /۰٫۲۴/.test(t1.b) && /افزایش/.test(t1.b) && /خودارزیابی/.test(t1.b), t1.h);
  ok('A02 trend answer carries inline visuals', t1.svg >= 2, String(t1.svg));
  const t2 = await R('من تحلیل میخوام', t1.ctx);
  ok('A03 «من تحلیل میخوام» keeps NIN topic', /تحلیل روند/.test(t2.h), t2.h);
  const t3 = await R('تحلیل کن', {});
  ok('A04 bare «تحلیل کن» without topic asks for subject, no unrelated records', /موضوع/.test(t3.h), t3.h);
  const t4 = await R('بیشتر توضیح بده', {kind: 'prov', ent: 'IR-10', lastQuestion: 'نیم رخ اصفهان'});
  ok('A05 follow-up re-runs previous question', /اصفهان/.test(t4.h), t4.h);
  const t5 = await R('پیشرفت شبکه ملی در ۱۴۰۲');
  ok('A06 single-year NIN question stays on year answer', /۱۴۰۲/.test(t5.h) && !/روند/.test(t5.h), t5.h);
  // UI flow: lastQuestion kept through the chat
  await p.evaluate(() => AIUI.ask('روند رشد شبکه ملی چطور بوده؟')); await p.waitForTimeout(700);
  await p.evaluate(() => AIUI.ask('من تحلیل میخوام')); await p.waitForTimeout(700);
  const last = await p.evaluate(() => [...document.querySelectorAll('#ai .m.a h5')].map((x) => x.textContent).slice(-2));
  ok('A07 chat UI keeps topic across turns', last.length === 2 && last.every((h) => /تحلیل روند/.test(h)), JSON.stringify(last));
  ok('A08 offline label stays honest (no LLM)', await p.evaluate(() => /بدون مدل زبانی/.test([...document.querySelectorAll('#ai .m.a > .src')].pop().textContent)));
  ok('A09 no page errors', !errs.length, errs.join(' | '));
  await b.close();
})();
