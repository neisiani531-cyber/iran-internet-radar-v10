// The 15 acceptance questions against the offline engine. Checks the handler chosen and key honesty properties.
const {chromium} = require('playwright');
const FILE = 'file://' + require('path').resolve(__dirname, '..', process.env.RADAR_HTML || 'dist/Radar_NII_Command_v4.html');
const Q = [
 ['A01', 'چه داده‌هایی درباره اصفهان داریم و چه داده‌هایی نداریم؟', (h, t) => /اصفهان/.test(h) && /نداریم/.test(t) && /FCP\/UNSP/.test(t)],
 ['A02', 'اصفهان و فارس را با دوره و دامنه یکسان مقایسه کن', (h, t) => /اصفهان/.test(h) && /فارس/.test(h) && /دوره: شهریور ۱۴۰۵/.test(t)],
 ['A03', 'تفاوت پوشش فیبر، پورت دایر و اشتراک چیست؟', (h, t) => /سه سنجه/.test(h) && /نرخ تبدیل» نیست/.test(t)],
 ['A04', 'آیا کاهش XDSL مهاجرت به فیبر را ثابت می‌کند؟', (h, t) => /خیر/.test(h) && /جریان/.test(t)],
 ['A05', 'چرا بازدید بله نسبت به محتوایش بالاست؟', (h, t) => /بله/.test(h) && /علت را نشان نمی‌دهد/.test(t)],
 ['A06', 'آیا ۶۱ شناختیک درصد افراد است؟', (h, t) => /خیر/.test(h) && /لیکرت/.test(t)],
 ['A07', 'آیا مراکز داده ظرفیت خالی دارند؟', (h, t) => /نمی‌توان گفت/.test(h) && /اشغال/.test(t)],
 ['A08', 'هزینه خدمت ابری هم‌ارز چقدر است و چه هزینه‌هایی نامعلوم است؟', (h, t) => /ابری/.test(h) && /قیمت فهرست است/.test(t)],
 ['A09', 'الان چه شواهدی از اختلال داریم و آخرین زمان دریافت هر منبع چیست؟', (h, t) => /آخرین زمان دریافت/.test(h) && /داده زنده ندارد/.test(t) && !/دریافت فعال<\/td>/.test(t)],
 ['A10', 'اگر رادار آروان و IODA نتیجه متفاوت بدهند چه کنیم؟', (h, t) => /آروان/.test(h) && /نقطه دید/.test(t)],
 ['A11', 'کدام منابع از یک پیمایش مشترک نقل کرده‌اند؟', (h, t) => /پیمایش مشترک/.test(h) && /SURVEY_MELLAT_21921/.test(t)],
 ['A12', 'سه اقدام برای بهبود تجربه مردم با شواهد و معیار پیشنهاد کن', (h, t) => /سه اقدام/.test(h) && /معیار ارزیابی/.test(t)],
 ['A13a', 'وضعیت همراه اول', (h, t) => /همراه اول/.test(h)],
 ['A13b', 'همین تحلیل را برای اپراتور دیگر انجام بده', (h, t) => /ایرانسل/.test(h) && /رایتل/.test(h) && /همراه اول بود/.test(t)],
 ['A14', 'در وب جست‌وجو کن آخرین مصوبه شورای عالی فضای مجازی درباره پهنای باند چیست', (h, t) => /وب/.test(h) && /پاسخی از وب نمی‌سازد/.test(t)],
 ['A15', 'تعداد کاربران اینترنت ماهواره‌ای استارلینک در شهر یزد چند نفر است؟', (h, t) => /داده‌ای برای پاسخ/.test(h) || (/نزدیک‌ترین/.test(h) && /پاسخ مستقیم نیست/.test(t))],
];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1600, height: 1000}});
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(600);
  const R = [];
  for (const [id, q, chk] of Q) {
    await p.evaluate((q) => AIUI.ask(q), q); await p.waitForTimeout(450);
    const {h, t} = await p.evaluate(() => { const m = [...document.querySelectorAll('#aiMsgs .m.a')].pop(); return {h: (m.querySelector('h5') || {}).textContent || '', t: m.innerHTML}; });
    const pass = !!chk(h, t); R.push({id, q, pass, h}); console.log((pass ? 'PASS ' : 'FAIL ') + id + ' · ' + h);
  }
  // A15 honesty: answer must not contain digits that look like a user count
  const last = await p.evaluate(() => [...document.querySelectorAll('#aiMsgs .m.a')].pop().textContent);
  const fab = /استارلینک/.test(last) && /\d{3,}/.test(last.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/140\d/g, ''));
  console.log((fab ? 'FAIL' : 'PASS') + ' A15-no-fabricated-number');
  console.log(errs.length ? 'PAGE ERRORS ' + errs.join(' | ') : 'no page errors');
  require('fs').writeFileSync(__dirname + '/../test-results/assistant_results.json', JSON.stringify(R, null, 1));
  await p.evaluate(() => AIUI.open()); await p.screenshot({path: __dirname + '/../test-results/assistant.png'});
  await b.close();
})();
