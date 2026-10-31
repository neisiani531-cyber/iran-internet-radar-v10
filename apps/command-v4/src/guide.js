/* ===== dashboard self-knowledge for the assistant =====
   Questions about the dashboard itself ("شواهد و تصمیم توش چیه؟", "پایش آنلاین چه دارد؟", "خدمات پایه چیست؟") are answered from
   the dashboard's own structure: the navigation groups, every view's heading and description, and every panel's title and lead,
   read by rendering each view's HTML off-screen. Nothing here is a statistic; numbers still come from the analytical handlers.
   Concept definitions (glossary) were written for this project and are framed as the radar's analytical frame, not an official text. */
const GUIDE = {
  CONCEPTS: [
 ['nin',['شبکه ملی اطلاعات','شبکه ملی'],'شبکه ملی اطلاعات در رادار','رادار شبکه ملی اطلاعات را از مسیر زیرساخت ارتباطی، زیرساخت اطلاعاتی، خدمات پایه و خدمات کاربردی بررسی می‌کند؛ امنیت و حکمرانی در همه حوزه‌ها مطرح‌اند و تجربه مردم معیار ارزیابی نتیجه است. درصد پیشرفت یک گزارش با کیفیت واقعی خدمات یا بی‌نیازی از ارتباط جهانی یکسان نیست. این توضیح چارچوب تحلیلی پروژه است؛ تعریف حقوقی و الزامات مصوب باید به سند مشخص ارجاع داده شود.','domains'],
 ['fiber',['پوشش فیبر','پورت دایر','اشتراک فعال','پورت منصوبه','ftth','fttx','فیبر'], 'پوشش، پورت و اشتراک سه سنجه متفاوت‌اند','پوشش فیبر نشان‌دهنده امکان ارائه خدمت در محدوده تعریف‌شده منبع است. پورت منصوبه ظرفیت نصب‌شده است. پورت دایر به اتصال برقرارشده طبق تعریف فایل اشاره دارد. اشتراک فعال وضعیت سرویس مشترک طبق تعریف منبع است. پوشش خانوار را نباید با تعداد پورت یا اشتراک برابر گرفت؛ نسبت آن‌ها فقط با صورت و مخرج هم‌جامعه و هم‌دوره قابل تفسیر است.','fixed'],
 ['quality',['qos','qoe','کیفیت تجربه','کیفیت شبکه','اتلاف بسته','jitter','جیتر','rtt','تاخیر','تأخیر','سرعت اسمی'],'کیفیت فنی و تجربه مردم','کیفیت فنی با سنجه‌هایی مانند دسترس‌پذیری، سرعت اندازه‌گیری‌شده، تأخیر، تغییر تأخیر و اتلاف بسته بررسی می‌شود. کیفیت تجربه به توان انجام کار موردنظر، رضایت و تجربه استفاده مربوط است. سرعت اسمی بسته، سرعت واقعی آزمون نیست. خوب‌بودن یک سنجه فنی به‌تنهایی رضایت مردم را اثبات نمی‌کند.','quality'],
 ['infra',['مرکز داده','مراکز داده','دیتاسنتر','خدمات ابری','ابر','میزبانی','iaas','paas','saas'],'مرکز داده و خدمات ابری','مرکز داده محل و زیرساخت میزبانی تجهیزات است. خدمات ابری، منابع پردازش، ذخیره‌سازی یا سکو و نرم‌افزار را به‌صورت خدمت عرضه می‌کنند. تعداد رک یا ظرفیت طراحی، ظرفیت فعال یا آزاد نیست. برای ظرفیت قابل استفاده، داده اشغال، برق، ارتباط و سطح خدمت همان مرکز لازم است.','infra'],
 ['ixp',['ixp','تبادل ترافیک','peering','پیرینگ'],'تبادل ترافیک و IXP','نقطه تبادل ترافیک امکان تبادل مستقیم ترافیک شبکه‌های متصل را فراهم می‌کند. تعداد اعضای دایرکتوری، ظرفیت پورت و ترافیک واقعی سه سنجه جدا هستند. وجود یک IXP به‌تنهایی استفاده مؤثر، کاهش مسیر یا کاهش تأخیر را اثبات نمی‌کند.','infra'],
 ['dns',['dns','نام دامنه'],'خدمت نام دامنه','DNS نام دامنه را به اطلاعات لازم برای یافتن خدمت، از جمله نشانی شبکه، نگاشت می‌کند. کیفیت آن با زمان پاسخ، دسترس‌پذیری و درستی پاسخ بررسی می‌شود؛ این سنجه‌ها با کیفیت کل اینترنت برابر نیستند.','d-base'],
 ['cdn',['cdn','شبکه توزیع محتوا','کش محتوا'],'توزیع محتوا و کش','CDN محتوا را از نقاط توزیع‌شده ارائه می‌کند. کش می‌تواند بخشی از درخواست‌ها را نزدیک‌تر پاسخ بدهد. برای سنجش اثر، محل ارائه خدمت، نرخ اصابت کش، تأخیر و ترافیک مسیر لازم است؛ تعداد نقاط حضور به‌تنهایی اثر را ثابت نمی‌کند.','d-base'],
 ['ipv6',['ipv6','نسخه شش','نسخه 6'],'پشتیبانی و استفاده از IPv6','پشتیبانی زیرساخت از IPv6 با سهم استفاده واقعی کاربران یکسان نیست. در رادار، عنوان شاخص، مخرج، دوره و تغییر تعریف باید همراه عدد خوانده شود؛ درصد تحقق هدف هم الزاماً درصد استفاده کاربران نیست.','d-communications'],
 ['traffic',['ترافیک داخلی','ترافیک خارجی','ترافیک بین الملل','حجم ترافیک'],'ترافیک داخلی و بین‌الملل','این سنجه‌ها حجم ترافیک را بر اساس تعریف طبقه‌بندی منبع توصیف می‌کنند. سهم مقصد خارجی، تعداد کاربران یا رضایت آن‌ها نیست. ترافیک تونلی و تفاوت دامنه اندازه‌گیری نیز تفسیر را محدود می‌کند.','quality'],
 ['views',['بازدید','ضریب نفوذ','کاربر فعال','محتوای دست اول'],'بازدید، کاربر و ضریب نفوذ هم‌معنا نیستند','بازدید شمار مشاهده طبق تعریف ناشر است و افراد یکتا نیست. کاربر فعال به دوره و قاعده فعالیت نیاز دارد. ضریب نفوذ ویراستی در گزارش ارسالی با بازدید سکوهای دیگر هم‌سنخ اعلام نشده و نباید با آن جمع شود.','platforms'],
 ['baseline',['خط مبنا','ناهنجاری','هشدار','رخداد'],'خط مبنا، ناهنجاری و رخداد','خط مبنا مرجع مقایسه همان سری با شرایط تعریف‌شده است. ناهنجاری انحراف از قاعده تشخیص است؛ الزاماً اختلال قطعی یا مسدودسازی نیست. رخداد از سیگنال‌های مرتبط ساخته می‌شود و تعیین علت به شواهد بیشتری نیاز دارد. نبود داده یا نبود داوری نباید وضعیت عادی تلقی شود.','online'],
 ['ooni',['ooni'],'OONI در رادار','داده OONI از آزمون‌های داوطلبانه دسترسی به خدمات به دست می‌آید. تعداد آزمون، تعداد افراد نیست و نرخ ناهنجاری بدون حجم نمونه، نوع آزمون و دامنه بررسی تفسیر نمی‌شود. وضعیت دریافت فعلی فقط از سرور معلوم می‌شود.','online'],
 ['ripe',['ripe','atlas','اطلس'],'RIPE و Atlas در رادار','RIPEstat اطلاعاتی درباره شبکه و مسیریابی عرضه می‌کند و RIPE Atlas بستری برای اندازه‌گیری از پروب‌هاست. موجودبودن پروب با داشتن سری اندازه‌گیری کیفیت یکسان نیست؛ نوع سنجه گردآوری‌شده باید مشخص باشد.','online'],
 ['ioda',['ioda'],'IODA در پایش','IODA برای بررسی تغییرات اتصال از سیگنال‌های مختلف استفاده می‌کند. در رادار، BGP و پینگ یا سایر نقاط دید باید جدا دیده شوند. دریافت ناموفق منبع نشانه قطع اینترنت کشور نیست.','online'],
 ['cloudflare',['cloudflare','کلادفلر','کلودفلر'],'Cloudflare در پایش','داده Cloudflare مربوط به ترافیک مشاهده‌شده در شبکه همان ارائه‌دهنده است و پوشش کامل کشور نیست. سنجه حملات با تعریف مبدأ و مقصد و مقیاس همان پاسخ تفسیر می‌شود. وضعیت فعال‌بودن کلید و دریافت فقط از سرور مشخص می‌شود.','online'],
 ['tor',['tor','تور'],'آرشیو Tor در رادار','سری تعبیه‌شده مربوط به آرشیو ژوئن تا ژوئیه ۲۰۲۵ است. کاربران تخمینی پل Tor شمار افراد یکتا یا کل کاربران VPN نیستند و با کاربران مستقیم جمع نمی‌شوند. وجود این آرشیو به معنی دریافت زنده نیست.','online'],
 ['goals',['درصد تحقق','پیشرفت هدف','وزن شاخص','عملکرد شاخص'],'عملکرد شاخص و تحقق هدف','عملکرد شاخص، درصد تحقق هدف و پیشرفت کل سه سطح جدا هستند. هدف ممکن است از شاخص‌های وزن‌دار تشکیل شود. تغییر وزن و تعریف بر مقایسه سال‌ها اثر دارد؛ روش تجمیع پیشرفت کل در فایل دریافتی کامل نیست و نباید میانگین ساده را جای آن گذاشت.','nin'],
 ['evidence',['q5','اعتبار منبع','نوع شاهد','منبع رسمی','شاهد پژوهشی'],'نوع شاهد و اعتبار داده','رادار داده رسمی، فایل ارسالی، شاهد پژوهشی، ادعا و محاسبه را جدا نگه می‌دارد. زیادبودن رکورد، تأیید صحت نیست؛ بازنشرهای یک مطالعه شاهد مستقل نیستند. شناسنامه رکورد باید منبع، دوره، دامنه و محدودیت را نشان بدهد.','registry']
 ],
  DOMAIN_NOTE: {communications: 'این حوزه دسترسی ثابت و سیار، انتقال و هسته را پوشش می‌دهد؛ وجود پوشش به معنی اشتراک فعال یا کیفیت مطلوب نیست.', information: 'ظرفیت مرکز داده و خدمات ابر باید با وضعیت بهره‌برداری، برق و ارتباط همراه باشد.', base: 'خدماتی مثل نام دامنه، توزیع محتوا، جست‌وجو و پیام‌رسان در این حوزه رادار قرار گرفته‌اند.', applications: 'خدمات مورد استفاده مردم و سازمان‌ها مانند دولت، پرداخت، آموزش و سلامت در این حوزه بررسی می‌شوند.', security: 'امنیت در همه لایه‌ها بررسی می‌شود. رخداد گزارش‌شده، ادعای مهاجم و انتساب حمله شواهد جدا دارند.', governance: 'این حوزه نقش نهادها، مقررات، تنظیم‌گری، بازار و پاسخ‌گویی را دربرمی‌گیرد.', people: 'تجربه، استطاعت، رضایت و شکاف دسترسی مردم معیار ارزیابی نتیجه توسعه‌اند.'},
  FILLER: new Set(['چیه', 'چی', 'چیست', 'چیستند', 'چه', 'هست', 'هستند', 'است', 'توش', 'توی', 'تو', 'داخلش', 'داره', 'دارد', 'دارند', 'داریم', 'نمونه', 'بخش', 'بخشی', 'صفحه', 'قسمت', 'منوی', 'منو', 'پنل', 'در', 'از', 'را', 'رو', 'این', 'آن', 'اون', 'یعنی', 'کجاست', 'کجا', 'چطور', 'چگونه', 'کار', 'میکنه', 'می', 'کند', 'میکند', 'شامل', 'میشه', 'میشود', 'و', 'به', 'با', 'برای', 'های', 'ها', 'ی', 'هم', 'معرفی', 'کن', 'بده', 'بگو', 'توضیح', 'راهنما', 'نشان', 'نشون', 'میده', 'دهد', 'میدهد', 'دیده', 'هستش', 'داشبورد', 'رادار', 'اطلاعاتی']),
  idx: null,
  short: (s, n = 180) => { s = window.RADAR_I18N?.lang==='en'?window.RADAR_I18N.toEN(String(s||'')):String(s||''); s = String(s || '').replace(/\s+/g, ' ').trim(); const i = s.indexOf('.', 40); const c = i > 0 && i < n ? s.slice(0, i + 1) : s.slice(0, n); return c + (c.length < s.length && !c.endsWith('.') ? '…' : ''); },
  build() {
    if (GUIDE.idx) return GUIDE.idx;
    const n = AI.norm, out = [];
    const views = {};
    const tmp = document.createElement('div');
    Object.keys(V).forEach((k) => {
      let html = '';
      try { html = V[k].html(); } catch (e) { html = ''; }
      tmp.innerHTML = html;
      const h2 = tmp.querySelector('.vhead h2'), p = tmp.querySelector('.vhead p');
      const panels = [...tmp.querySelectorAll('section.p, .p')].filter((x, i, a) => a.indexOf(x) === i).map((s) => ({title: (s.querySelector('header h3') || {}).textContent || '', lead: (s.querySelector(':scope > .lead') || {}).textContent || ''})).filter((x) => x.title)
        .concat([...tmp.querySelectorAll('.sec-h')].map((h) => { const items = []; for (let n = h.nextElementSibling; n && !n.classList.contains('sec-h'); n = n.nextElementSibling) n.querySelectorAll('.kpi .t span:first-child, header h3').forEach((x) => items.push(x.textContent)); return {title: (h.querySelector('h3') || {}).textContent || '', lead: (h.querySelector('p') || {}).textContent || '', section: true, items}; }).filter((x) => x.title));
      views[k] = {k, title: V[k].title, nav: (NAV.find((x) => x[0] === k) || [])[1] || V[k].title, h2: h2 ? h2.textContent : V[k].title, desc: p ? p.textContent : '', panels};
    });
    tmp.innerHTML = '';
    Object.values(views).forEach((v) => {
      out.push({kind: 'view', key: v.k, names: [v.title, v.nav, v.h2], v});
      v.panels.forEach((pn) => out.push({kind: 'panel', key: v.k, names: [pn.title], v, pn}));
    });
    NAV_GROUPS.forEach(([id, name, items]) => out.push({kind: 'group', key: id, names: [name], name, items: items.map(([k, nm]) => ({k, nm, v: views[k]}))}));
    DOM_ORDER.forEach((d) => out.push({kind: 'domain', key: d, names: [DOM[d].n]}));
    GUIDE.CONCEPTS.forEach((c) => out.push({kind: 'concept', key: c[0], names: c[1], c}));
    // alternate names: the part before a colon ("نقشه تغییر: دامنه × سیگنال") and names without the trailing "شبکه ملی اطلاعات"
    out.forEach((e) => { e.names = [...new Set(e.names.flatMap((x) => [x, String(x).split(/[:：]/)[0], String(x).replace(/\s*شبکه ملی اطلاعات\s*$/, '')]).filter((x) => x && x.trim().length > 1))]; });
    out.forEach((e) => { e.toks = e.names.map((x) => GUIDE.toks(n(x)).filter((w) => /[\p{L}\p{N}]/u.test(w))).filter((t) => t.length); });
    return (GUIDE.idx = out);
  },
  toks: (q) => q.split(' ').filter((w) => w && !GUIDE.FILLER.has(w)),
  asksAbout: (q) => /فعاله|فعال است|فعاله|وصله|وصل است|متصله|کار می ?کنه|الان چطور|چیه|چی هست|چیست|چیستند|توش|تو ?ش |داخلش|چی داره|چه داره|چه دارد|چه داریم|چی داریم|شامل|کجاست|کجا (است|هست)|چطور کار|چه کار|چکار|معرفی|راهنمای|چه بخش|چه قسمت|چه امکان|چه قابلیت|نشان (می ?)?ده|نشون (می ?)?ده|یعنی چه|یعنی چی|تعریف|فرق|تفاوت|منظور/.test(q),
  numeric: (q) => /\d|چقدر|چند درصد|تعداد|بیشترین|کمترین|رتبه|مقایسه کن|روند|رشد|کاهش|افزایش|تحلیل/.test(q.replace(/[2345]g|ipv[46]|q[1-5]/g, '')),
  match(q, withConcepts = true) {
    const qt = new Set(GUIDE.toks(q));
    let best = null;
    GUIDE.build().filter((e) => withConcepts || e.kind !== 'concept').forEach((e) => e.toks.forEach((t) => {
      // every distinctive word of the name must appear (allow one missing for names of 4+ words)
      const hit = t.filter((w) => qt.has(w) || [...qt].some((x) => x.length > 3 && (x.startsWith(w) || w.startsWith(x)))).length;
      if (hit < Math.max(1, Math.ceil(t.length * 0.6))) return;
      const def = /چیست|تعریف|یعنی|منظور/.test(q);
      const pri = {group: 5, view: 4, domain: def ? 6 : 4, panel: 3, concept: def ? 3 : 2}[e.kind];
      const sc = hit * 10 + t.length + pri + (hit === t.length && t.length === qt.size ? 6 : 0);
      if (!best || sc > best.sc) best = {e, sc, full: hit === t.length};
    }));
    return best;
  },
  route(q, ctx, opt = {}) {
    const whole = /^(این |کل )?(داشبورد|رادار|سامانه)( چه| چی| را| رو)?/.test(q) && /بخش|امکان|قابلیت|چی داره|چه دارد|چه داره|معرفی|راهنما/.test(q);
    if (whole) return GUIDE.overview();
    const asks = GUIDE.asksAbout(q), m = GUIDE.match(q, opt.concepts);
    if (!asks) {
      // a bare section name ("شواهد و تصمیم") is also a question about that section
      if (!m || !m.full || GUIDE.toks(q).length > Math.min(...m.e.toks.map((t) => t.length)) + 1 || !['group', 'view'].includes(m.e.kind)) return null;
      return GUIDE.answer(m.e, q);
    }
    if (/لایه|حوزه|معماری|ساختار/.test(q) && /شبکه ملی|رادار|داشبورد|هفت/.test(q) && !GUIDE.numeric(q)) return GUIDE.answer(GUIDE.build().find((e) => e.kind === 'group' && e.key === 'layers'), q, true);
    // a section named in full wins even when its name contains words like «تحلیل»; numbers and periods stay with the analysts
    if (m && m.full && m.e.kind !== 'concept' && !/\d/.test(q) && !/چقدر|چند|بیشترین|کمترین|رتبه|مقایسه کن|روند/.test(q)) return GUIDE.answer(m.e, q);
    if (GUIDE.numeric(q) && !/تفاوت|فرق|تعریف|یعنی/.test(q)) return null;
    return m && (opt.concepts || m.e.kind !== 'concept') ? GUIDE.answer(m.e, q) : null;
  },
  go: (k, t) => AI.goBtn(k, t || 'باز کردن «' + (V[k] ? V[k].title : k) + '»'),
  answer(e, q, layers) {
    const tbl = AI.tbl;
    const SRC = '<div class="src">از ساختار و متن همین داشبورد؛ آمار نیست</div>';
    if (e.kind === 'group' && (layers || e.key === 'layers')) {
      return {h: 'لایه‌ها و حوزه‌های شبکه ملی اطلاعات در رادار', b: `<p>داده‌های رادار در هفت حوزه سازمان‌دهی شده‌اند. چهار حوزه مسیر اتصال تا خدمت را می‌سازند، امنیت و حکمرانی در همه آن‌ها فراگیرند و مردم معیار سنجش نتیجه‌اند.</p>${tbl(['حوزه', 'موضوع', 'نقش', 'رکورد'], DOM_ORDER.map((d) => [`<a href="#d-${d}" style="color:${DOM[d].c}">${esc(DOM[d].n)}</a>`, esc(DOM[d].d), ['security', 'governance'].includes(d) ? 'فراگیر' : d === 'people' ? 'معیار سنجش نتیجه' : 'زیرساخت یا خدمت', F.i(REC.list.filter((r) => r.dom === d && r.coll !== 'src').length)]))}<p>این تقسیم‌بندی معماری اطلاعات همین داشبورد است، نه نقل یک سند مصوب؛ مردم لایه فنی نیست و امنیت و حکمرانی طبقه‌های پشت‌سرهم روی شبکه نیستند. شمار رکورد، شمار سنجه مستقل یا تأییدشده نیست.</p>${GUIDE.go('domains', 'معماری و پوشش داده هر حوزه')}${SRC}`, ctx: {kind: 'guide', ent: 'layers'}};
    }
    if (e.kind === 'group') {
      return {h: `گروه «${e.name}» در منوی کناری`, b: `<p>این گروه ${F.i(e.items.length)} بخش دارد:</p>${tbl(['بخش', 'چه چیزی در آن هست', 'پنل‌ها'], e.items.map((it) => [`<a href="#${it.k}">${esc(it.nm)}</a>`, esc(GUIDE.short(it.v && it.v.desc)), esc(it.v ? it.v.panels.slice(0, 5).map((p) => p.title).join('، ') + (it.v.panels.length > 5 ? '، …' : '') : '')]))}<p>برای جزئیات هر بخش بپرسید «${esc(e.items[0].nm)} چه دارد؟» یا روی نام آن بزنید.</p>${SRC}`, ctx: {kind: 'guide', ent: e.key}};
    }
    if (e.kind === 'view') {
      const v = e.v, extra = GUIDE.LIVE_HINT[v.k] || '';
      return {h: `بخش «${v.nav}»`, b: `<p>${esc(v.desc || v.h2)}</p>${v.panels.length ? `<h6>پنل‌های این بخش (${F.i(v.panels.length)})</h6>${tbl(['پنل', 'کاربرد'], v.panels.map((p) => [esc(p.title), esc(GUIDE.short(p.lead, 160) || '—')]))}` : ''}${extra}${GUIDE.go(v.k)}${SRC}`, ctx: {kind: 'guide', ent: v.k}, liveSelf: v.k === 'online' && API.base() && /الان|اکنون|فعال|متصل|وضعیت/.test(q)};
    }
    if (e.kind === 'panel') return {h: `${e.pn.section ? 'بخش' : 'پنل'} «${e.pn.title}» · ${e.v.nav}`, b: `<p>${esc(e.pn.lead || 'این پنل توضیح جداگانه‌ای ندارد.')}</p>${e.pn.items && e.pn.items.length ? `<p><b>شامل:</b> ${e.pn.items.map(esc).join('، ')}.</p>` : ''}<p>جای آن: بخش «${esc(e.v.nav)}».</p>${GUIDE.go(e.key)}${SRC}`, ctx: {kind: 'guide', ent: e.key}};
    if (e.kind === 'domain') {
      const d = e.key, L = REC.list.filter((r) => r.dom === d && r.coll !== 'src'), by = {};
      L.forEach((r) => { by[r.coll] = (by[r.coll] || 0) + 1; });
      return {h: `حوزه «${DOM[d].n}» در رادار`, b: `<p>${esc(DOM[d].d)}. ${esc(GUIDE.DOMAIN_NOTE[d] || '')}</p>${tbl(['مجموعه', 'رکورد'], Object.entries(by).map(([k, c]) => [esc((COLL[k] || {}).n || k), F.i(c)]))}<p><b>شکاف ثبت‌شده:</b> ${esc((DOM_GAP[d] || {}).need || 'ثبت نشده')}. شمار رکورد، شمار سنجه مستقل یا تأییدشده نیست.</p>${GUIDE.go('d-' + d, 'کارنامه این حوزه')}${SRC}`, ctx: {kind: 'guide', ent: 'd-' + d}};
    }
    const c = e.c;
    return {h: c[2], b: `<p>${esc(c[3])}</p>${GUIDE.go(c[4], 'داده‌های مرتبط')}<div class="src">تعریف و قاعده تفسیر در همین پروژه؛ وضعیت زنده نیست</div>`, ctx: {kind: 'guide', ent: c[0]}};
  },
  overview() {
    const groups = [['اصلی', NAV_PRIMARY], ...NAV_GROUPS.map(([, n, it]) => [n, it])];
    return {h: 'این رادار چه بخش‌هایی دارد؟', b: groups.map(([n, it]) => `<h6>${esc(n)}</h6>${AI.tbl(['بخش', 'کاربرد'], it.map(([k, nm]) => { const e = GUIDE.build().find((x) => x.kind === 'view' && x.key === k); return [`<a href="#${k}">${esc(nm)}</a>`, esc(GUIDE.short(e && e.v.desc, 140))]; }))}`).join('') + '<p>پایش آنلاین به سرور و داده تازه وابسته است؛ دستیار این فایل قاعده‌محور است و مدل زبانی نیست.</p><div class="src">از ساختار و متن همین داشبورد</div>', ctx: {kind: 'guide', ent: 'all'}};
  },
  LIVE_HINT: {online: '<p><b>وضعیت زنده:</b> وجود یک پنل یا نام منبع به معنی فعال بودن گردآورنده نیست. اگر نشانی سرور تنظیم شده باشد، دستیار وضعیت منابع و رخدادها را از سرور می‌پرسد؛ در غیر این صورت داده زنده‌ای در این فایل نیست.</p>'},
};

/* live self-check (connected mode): what the server reports right now; failures are not outages */
const SELF_LIVE = async (el) => {
  let src = null, st = null; const err = [];
  await Promise.all([['منابع', '/api/v1/online/sources'], ['داوری', '/api/v1/online/status']].map(async ([n, p]) => { try { const j = await API.get(p); if (n === 'منابع') src = j; else st = j; } catch (e) { err.push(n + ': ' + e.message); } }));
  if (!el.isConnected) return;
  let h = `<h6>پاسخ سرور · ${TEH(new Date().toISOString())}</h6>`;
  if (src && Array.isArray(src.sources)) h += AI.tbl(['منبع', 'وضعیت', 'آخرین موفقیت', 'تازگی'], src.sources.map((s) => [esc(s.name || s.id), esc(s.status_fa || s.status), s.last_success ? TEH(s.last_success) : 'ثبت نشده', esc(s.freshness || '—')]));
  if (st && st.overall) { const o = st.overall; h += `<p>دسترسی: ${esc((o.access || {}).text || '—')}. امنیت: ${esc((o.security || {}).text || '—')}. رخداد باز: ${F.i((st.incidents || []).length)}.</p>`; }
  if (err.length) h += `<p class="er">بررسی کامل نشد (${esc(err.join('؛ '))}). این خطا به معنی اختلال اینترنت نیست.</p>`;
  el.insertAdjacentHTML('beforeend', h);
};
