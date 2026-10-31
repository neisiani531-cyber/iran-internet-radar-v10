/* ===== v4.8 report studio =====
   A request in plain Persian ("گزارش وضعیت فیبر اصفهان و فارس برای معاون وزیر، پاورپوینت") becomes a plan
   (template, topics, entities, audience, length, format), the plan becomes a structured report built only from the
   radar's data, and the report is rendered as an A4 preview (print to PDF) or exported to Word, PowerPoint or HTML.
   Rules that hold everywhere: every number comes from the data with its source and period; source statements,
   radar calculations and inferences are labelled separately; causes and attributions are never asserted beyond
   their evidence; missing data is said, never estimated. */
const RPT = (() => {
  const n = (s) => AI.norm(s);
  const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;
  const LBL = {says: 'منبع می‌گوید', calc: 'محاسبه رادار', infer: 'استنباط'};
  const TPL = {
    status: {n: 'گزارش وضعیت', d: 'تصویر کلی دوره: دسترسی، سیار، کیفیت، اهداف شبکه ملی، تجربه مردم و اقدام‌ها'},
    topic: {n: 'گزارش موضوعی', d: 'یک یا چند موضوع انتخابی با جزئیات'},
    compare: {n: 'گزارش مقایسه‌ای', d: 'استان‌ها، اپراتورها یا سکوها در دوره و دامنه یکسان'},
    nin: {n: 'کارنامه اهداف شبکه ملی اطلاعات', d: 'ارزیابی ۱۴۰۰ تا ۱۴۰۵، اهداف عقب‌مانده و شاخص‌های سازنده شکاف'},
    incident: {n: 'گزارش رخداد و امنیت', d: 'رخدادهای پایش آنلاین (نسخه متصل) و رخدادهای سایبری گزارش‌شده'},
    changes: {n: 'گزارش تغییرات', d: 'تغییرات نسبت به مبنای همین مرورگر: داده‌های دوره‌ای، پایش آنلاین و وضعیت منابع'},
  };
  const TOPICS = {
    overview: {n: 'وضعیت کلی', kw: ['وضعیت کلی', 'جامع', 'کلی']},
    fixed: {n: 'دسترسی ثابت و فیبر', kw: ['فیبر', 'ثابت', 'ftth', 'fttx', 'xdsl', 'adsl', 'پورت', 'پهن باند ثابت']},
    mobile: {n: 'شبکه سیار و اپراتورها', kw: ['سیار', 'موبایل', 'همراه', 'اپراتور', '4g', '5g', 'ایرانسل', 'رایتل', 'پهن باند سیار']},
    quality: {n: 'کیفیت شبکه و ترافیک', kw: ['کیفیت', 'تاخیر', 'تأخیر', 'ترافیک', 'بین الملل', 'بین‌الملل', 'پینگ', 'rtt', 'سرعت']},
    provinces: {n: 'مقایسه استانی', kw: ['استان', 'استانی', 'استان ها']},
    platforms: {n: 'سکوهای داخلی', kw: ['سکو', 'پیام رسان', 'پیامرسان', 'روبیکا', 'ایتا', 'سروش', 'ویراستی', 'محتوا']},
    nin: {n: 'تحقق اهداف شبکه ملی اطلاعات', kw: ['اهداف', 'هدف', 'تحقق', 'nin', 'کارنامه', 'متولی']},
    people: {n: 'تجربه و رضایت مردم', kw: ['رضایت', 'شکایت', 'مردم', 'پیمایش', 'تجربه', 'نارضایتی']},
    online: {n: 'پایش اختلال و امنیت', kw: ['اختلال', 'قطعی', 'رخداد', 'پایش آنلاین', 'حمله', 'سایبری', 'ddos', 'هک', 'امنیت']},
    infra: {n: 'مراکز داده، ابر و تبادل ترافیک', kw: ['مرکز داده', 'مراکز داده', 'دیتاسنتر', 'ابر', 'ixp', 'آروان', 'میزبانی']},
    decision: {n: 'سازوکارها و اقدام‌های پیشنهادی', kw: ['اقدام', 'توصیه', 'تصمیم', 'راهکار', 'پیشنهاد', 'سیاست']},
    changes: {n: 'تغییرات از آخرین بازدید', kw: ['گزارش تغییرات', 'آخرین بازدید', 'از آخرین مرور', 'چه تغییر کرده']},
  };
  const TPL_TOPICS = {status: ['overview', 'fixed', 'mobile', 'quality', 'nin', 'people', 'decision'], nin: ['nin', 'decision'], incident: ['online'], compare: [], topic: [], changes: ['changes']};
  const AUD = {exec: 'مدیران ارشد', expert: 'کارشناسان'};
  const LEN = {brief: 'خلاصه', standard: 'استاندارد', full: 'کامل'};
  const FMT = {pdf: 'PDF (چاپ)', docx: 'Word', pptx: 'PowerPoint', html: 'HTML'};

  /* ---------- request -> plan ---------- */
  const parse = (raw) => {
    if(typeof window!=='undefined'&&window.RADAR_I18N?.lang==='en')raw=window.RADAR_I18N.question(raw);
    const q = n(raw || '');
    const has = (...w) => w.some((x) => q.includes(n(x)));
    const provs = AI.findProvs(q).map((p) => p.iso), ops = AI.findOps(q), plats = AI.findPlats(q);
    const goals = [...q.matchAll(/هدف (\d{1,2})(?!\d)/g)].map((m) => +m[1]).filter((g) => NIN.byNo[g]);
    let topics = Object.entries(TOPICS).filter(([k, t]) => k !== 'overview' && t.kw.some((w) => q.includes(n(w)))).map(([k]) => k);
    if (provs.length && !topics.includes('provinces')) topics.push('provinces');
    if (plats.length && !topics.includes('platforms')) topics.push('platforms');
    if ((ops.length) && !topics.includes('mobile')) topics.push('mobile');
    if (goals.length && !topics.includes('nin')) topics.push('nin');
    let tpl = 'topic';
    if (topics.includes('changes') || has('گزارش تغییرات')) { tpl = 'changes'; topics = ['changes']; }
    else if (has('رخداد', 'اختلال', 'قطعی', 'حمله', 'هک', 'ddos', 'سایبری') && topics.filter((t) => t !== 'online').length <= 1) tpl = 'incident';
    else if (has('کارنامه', 'تحقق اهداف') || (topics.length === 1 && topics[0] === 'nin')) tpl = 'nin';
    else if (has('مقایسه', 'در برابر', 'تفاوت') || provs.length >= 2 || ops.length >= 2 || plats.length >= 2) tpl = 'compare';
    else if (!topics.length || has('وضعیت', 'جامع', 'کلی', 'مدیریتی', 'دوره ای', 'فصلی', 'ماهانه', 'هفتگی')) tpl = 'status';
    if (tpl !== 'topic' && tpl !== 'compare') topics = [...new Set([...TPL_TOPICS[tpl], ...topics])];
    if (tpl === 'compare' && !topics.length) topics = provs.length ? ['provinces'] : ops.length ? ['mobile'] : ['platforms'];
    if (topics.length && !topics.includes('decision') && has('اقدام', 'توصیه', 'پیشنهاد', 'راهکار')) topics.push('decision');
    const aud = has('وزیر', 'معاون', 'مدیر', 'رئیس', 'ریاست', 'هیئت', 'هیات', 'شورا', 'مدیرعامل', 'مقام') ? 'exec' : has('کارشناس', 'فنی', 'تخصصی', 'تحلیلگر', 'پژوهش') ? 'expert' : tpl === 'status' || tpl === 'nin' ? 'exec' : 'expert';
    const len = has('خلاصه', 'کوتاه', 'یک صفحه', 'یک صفحه ای') ? 'brief' : has('کامل', 'جامع', 'مفصل', 'تفصیلی', 'جزئیات') ? 'full' : 'standard';
    const fmt = has('پاورپوینت', 'اسلاید', 'ارائه', 'جلسه', 'ppt') ? 'pptx' : has('ورد', 'word', 'نامه', 'docx') ? 'docx' : has('html', 'وب') ? 'html' : 'pdf';
    const rm = String(raw || '').replace(/[ي]/g, 'ی').match(/برای\s+([^،,.؛:\n]+?)(?=\s+(?:درباره|در مورد|با |به صورت|در قالب|که )|[،,.؛:\n]|$)/);
    const recipient = rm && !/(?:استان|سکو|اپراتور|مقایسه)/.test(rm[1]) ? rm[1].trim().slice(0, 60) : '';
    const yrs = [...q.matchAll(/(?<!\d)(1[34]\d\d)(?!\d)/g)].map((m) => m[1]);
    return {raw: raw || '', tpl, topics, provs, ops, plats, goals, aud, len, fmt, recipient, years: yrs, title: ''};
  };
  const autoTitle = (p) => {
    const ent = [...p.provs.map((i) => (M.prov.find((x) => x.iso === i) || {}).n), ...p.ops, ...p.plats.map((k) => PLAT[k] || k)].filter(Boolean);
    // the title names the requested period, never a default one the request did not ask for
    const ys = [...new Set((p.years || []).map(Number))].sort(), Yf = (y) => String(y).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    const yr = ys.length ? (ys.length === 1 ? Yf(ys[0]) : Yf(ys[0]) + ' تا ' + Yf(ys[ys.length - 1])) : '';
    if (p.tpl === 'status') return 'گزارش وضعیت شبکه ملی اطلاعات · ' + (ent.length ? ent.join('، ') + ' · ' : '') + (yr || 'بهار و تابستان ۱۴۰۵');
    if (p.tpl === 'nin') return 'کارنامه تحقق اهداف عملیاتی شبکه ملی اطلاعات · ' + (yr || '۱۴۰۰ تا ' + NIN.yfa(NIN.LAST));
    if (p.tpl === 'incident') return 'گزارش رخدادهای اختلال و امنیت';
    if (p.tpl === 'changes') return 'گزارش تغییرات از آخرین بازدید';
    if (p.tpl === 'compare') return 'گزارش مقایسه‌ای · ' + (ent.length ? ent.join(' و ') : p.topics.map((t) => TOPICS[t].n).join('، '));
    return 'گزارش ' + p.topics.map((t) => TOPICS[t].n).join('، ') + (ent.length ? ' · ' + ent.join('، ') : '') + (yr ? ' · ' + yr : '');
  };

  /* ---------- building blocks ---------- */
  const P = (label, text) => ({type: 'p', label, text});
  const KP = (items) => ({type: 'kpis', items});
  const FIG = (caption, src, draw, h) => ({type: 'fig', caption, src, draw, h: h || 300});
  const TB = (caption, head, rows, src) => ({type: 'table', caption, head, rows, src});
  const NOTE = (kind, text) => ({type: 'note', kind, text});
  const off = (id) => ({key: 'off:' + id, t: (KPI[id] || {}).l || id, src: 'فصلنامه ۵۷ رگولاتوری', p: (KPI[id] || {}).p ? per(KPI[id].p) : ''});
  const S_CRA = 'فصلنامه آماری ۵۷ سازمان تنظیم مقررات، بهار ۱۴۰۵', S_PORT = 'فایل‌های Port/Speed شرکت‌های FCP/UNSP، شهریور ۱۴۰۵ (کاربرگ ارسالی؛ کل بازار نیست)';
  const S_WB = 'کاربرگ پایش تابستان ۱۴۰۵ (ارسالی کاربر؛ تأیید مستقل نشده)', S_NIN = 'فایل‌های NIN1400-1404.xlsx و NIN.1405.07.xlsx ارسالی کاربر؛ اصالت و روش تجمیع کل احراز نشده';
  const S_PLAT = 'گزارش شش‌ماهه مرکز ملی فضای مجازی (متن ارسالی کاربر؛ تأیید نشده)';

  /* ---------- section composers ---------- */
  const SEC = {};
  SEC.overview = (pl) => {
    const ov = NIN.S.overall;
    return {key: `پهن‌باند سیار ${F.sp(M.mob.yoy)} رشد کرده و پایه ثابت ${F.sp(kv('CRA57-FIXBB-GROWTH'), 2)} کوچک شده؛ ${F.p(M.traffic.intlShare)} ترافیک تابستان به مقصد خارجی رفته است.`,
      lead: 'شاخص‌های اصلی دوره و جهت تغییر آن‌ها.', blocks: [
        KP([{t: 'خطوط فعال سیار', v: F.big(kv('CRA57-MOB-1405')), d: F.sp(kv('CRA57-MOB-GROWTH'), 2) + ' سالانه', ev: 'رسمی'}, {t: 'پهن‌باند سیار', v: F.big(M.mob.total), d: F.sp(M.mob.yoy) + ' سالانه', ev: 'محاسبه از رسمی'},
          {t: 'پهن‌باند ثابت', v: F.big(kv('CRA57-FIXBB-1405')), d: F.sp(kv('CRA57-FIXBB-GROWTH'), 2) + ' سالانه', ev: 'رسمی'}, {t: 'سهم ترافیک بین‌الملل', v: F.p(M.traffic.intlShare), d: 'تابستان ۱۴۰۵', ev: 'کاربرگ'},
          ...(!pl.years.length || pl.years.includes(NIN.LAST) ? [{t: 'پیشرفت کل اهداف شبکه ملی', v: F.n(ov[NIN.LAST].value) + '٪', d: 'ارزیابی ' + NIN.yfa(NIN.LAST), ev: 'فایل کاربر'}] : []), {t: 'RTT سیار بین‌الملل', v: F.n(M.lat.mi) + ' ms', d: 'ثابت ' + F.n(M.lat.fi) + ' ms', ev: 'رسمی'}]),
        ...ALERTS.filter((a) => a.sev === 'crit' || a.sev === 'warn').slice(0, pl.len === 'brief' ? 2 : 4).map((a) => P('calc', a.t + ': ' + a.s)),
      ], src: [off('CRA57-MOB-1405'), off('CRA57-FIXBB-1405'), {t: 'ترافیک داخلی و بین‌الملل', src: S_WB}, {t: 'پیشرفت کل اهداف', src: S_NIN}]};
  };
  SEC.fixed = (pl) => {
    const T = M.fixed.techs, ft = T.find((t) => t.k === 'FTTx'), xd = T.find((t) => t.k === 'XDSL');
    const b = [
      P('says', `اشتراک پهن‌باند ثابت از ${F.big(M.fixed.first.t)} در بهار ۱۴۰۴ به ${F.big(M.fixed.last.t)} در بهار ۱۴۰۵ رسیده (${F.sp(M.fixed.totalPct)}). FTTx ${F.sp(ft.pct)} رشد کرده و XDSL ${F.big(Math.abs(xd.d))} مشترک از دست داده است.`),
      P('calc', `افزایش خالص FTTx ${OFFSET_TXT()} کاهش خالص XDSL است. این نسبت دو تفاضل است و نشان نمی‌دهد چه سهمی از مشترکان XDSL به فیبر رفته‌اند؛ برای داوری درباره مهاجرت، داده جریان مشترک (churn) لازم است.`),
      FIG('جابه‌جایی فناوری‌های ثابت در یک سال (مشترک)', S_CRA, (el) => drawShift(el), 250),
      P('says', `خانوار تحت پوشش فیبر ${F.big(M.fiber.hh)} است (${F.sp(M.fiber.covYoY)} در یک سال) و اشتراک FTTx ${F.big(M.fiber.subs)}.`),
      P('calc', `نسبت اشتراک FTTx به خانوار تحت پوشش ${F.p(M.fiber.takeup)} است. صورت و مخرج هم‌جامعه نیستند و این عدد نرخ تبدیل یا شمار خانوار بی‌اشتراک نیست.`),
    ];
    if (pl.len !== 'brief') b.push(FIG('ترکیب اشتراک ثابت در پنج فصل', S_CRA, (el) => K.vbar(el, {cats: D.fixedQ.map((q) => q.l), stacked: true, h: 260, series: [['FTTx', C.teal], ['XDSL', '#ff8a5c'], ['TDLTE', C.ice], ['WiFi', C.violet]].map(([k, c]) => ({n: k === 'TDLTE' ? 'TD-LTE' : k, c, vals: D.fixedQ.map((q) => q[k] / 1e6)})), yfmt: (v) => F.n(v) + 'M', tfmt: (v) => F.n(r2(v)) + ' میلیون'}), 270),
      TB('تغییر فناوری‌های ثابت', ['فناوری', 'بهار ۱۴۰۴', 'بهار ۱۴۰۵', 'تغییر', 'سهم ۱۴۰۵'], T.map((t) => [t.k === 'TDLTE' ? 'TD-LTE' : t.k, F.i(t.from), F.i(t.to), F.sp(t.pct), F.p(t.share)]), S_CRA));
    if (M.provT.fthU != null) b.push(P('calc', `در فایل پورت شرکت‌های FCP/UNSP، از ${F.big(M.provT.fthUBase.I)} پورت FTTH منصوبه ${F.big(M.provT.fthUBase.A)} دایر است (${F.p(M.provT.fthU)} در ${F.i(M.provT.fthUBase.n)} استان با پایه معتبر). این فایل مخابرات ایران و کل بازار را نمی‌پوشاند و علت دایر نبودن را نشان نمی‌دهد.`));
    b.push(NOTE('limit', 'آمار ثابت تا بهار ۱۴۰۵ و فایل پورت تا شهریور ۱۴۰۵ است؛ دو منبع دوره و دامنه متفاوت دارند و با هم جمع نمی‌شوند.'));
    return {key: `پایه ثابت ${F.sp(M.fixed.totalPct)} کوچک شده؛ FTTx ${F.sp(ft.pct)} رشد کرده ولی افزایش خالص آن ${OFFSET_TXT()} کاهش XDSL است.`, lead: 'اشتراک، پوشش خانوار و پورت؛ سه سنجه جدا با تعریف و دامنه متفاوت.', blocks: b,
      src: [off('CRA57-FIXBB-1405'), off('CRA57-FIXBB-GROWTH'), {t: 'ترکیب فناوری ثابت پنج فصل', src: S_CRA}, {t: 'پورت FTTH منصوبه و دایر', src: S_PORT}]};
  };
  SEC.mobile = (pl) => {
    const allOps = M.ops, ops = pl.ops.length ? allOps.filter((o) => pl.ops.includes(o.name)) : allOps, sel = ops, lead = [...ops].sort((a, b) => b.coverage4g - a.coverage4g)[0];
    const b = [
      P('says', `پهن‌باند سیار در بهار ۱۴۰۵ به ${F.big(M.mob.total)} اشتراک رسیده (${F.sp(M.mob.yoy)} در یک سال). سهم اپراتورهای انتخاب‌شده از کل بازار: ${sel.map((o) => o.name + ' ' + F.p(M.mob.share[o.name])).join('؛ ')}.`),
      FIG('اشتراک پهن‌باند سیار به تفکیک اپراتور (میلیون)', S_CRA, (el) => K.line(el, {xs: M.mob.periods, h: 260, series: sel.map((x) => x.name).map((o) => ({name: o, c: C.op[o], vals: M.mob.values.map((r) => r[opIdx(o)] / 1e6), w: 2.2})), yMin: 0, yfmt: (v) => F.n(v), endfmt: (v) => F.n(r1(v)) + 'M', tfmt: (v) => F.n(r2(v)) + ' میلیون', xlab: xlabYear, xtip: per}), 270),
      P('calc', `5G ${F.p(M.gen.g5 / M.gen.t * 100)} از اشتراک پهن‌باند سیار است؛ بیشترین پوشش جمعیتی 4G را ${lead.name} با ${F.p(lead.coverage4g)} دارد.`),
      TB('شاخص‌های اپراتورها', ['شاخص', ...sel.map((o) => o.name)], [['خطوط فعال', ...sel.map((o) => F.big(o.active))], ['پوشش جمعیتی 4G', ...sel.map((o) => F.p(o.coverage4g))], ['سایت فعال 4G', ...sel.map((o) => F.i(o.sites4g))], ['سایت فعال 5G', ...sel.map((o) => F.i(o.sites5g))], ['سرعت دانلود 4G (Mbps)', ...sel.map((o) => F.n(o.ping4g))], ['قطعی داده 4G', ...sel.map((o) => (o.drop4g == null ? 'ناموجود' : F.p(o.drop4g)))]], S_CRA),
      NOTE('limit', 'مقادیر را اپراتورها به رگولاتوری گزارش کرده‌اند و تجربه کاربر را مستقیم نمی‌سنجند؛ «خطوط فعال» تعریف هر اپراتور را دارد.'),
    ];
    if (pl.len !== 'brief') b.splice(3, 0, FIG('کارنامه اپراتورها: درصدی از بهترین مقدار هر سنجه', S_CRA, (el) => K.dotrows(el, MB_ROWS().slice(0, 12).map(([k, nm, dir, f]) => ({n: nm, dir, fmt: f, vals: ops.map((o) => (o[k] == null ? null : o[k]))})), ops.map((o) => ({n: o.name, c: C.op[o.name]}))), 400));
    return {key: `پهن‌باند سیار ${F.sp(M.mob.yoy)} رشد کرده و ${F.big(M.mob.total)} اشتراک دارد؛ ${lead.name} در پوشش 4G جلوتر است.`, lead: 'رشد، سهم بازار و کارنامه اپراتورها.', blocks: b, src: [off('CRA57-MOB-1405'), {t: 'اشتراک پهن‌باند سیار ۲۴ فصل', src: S_CRA}, {t: 'شاخص‌های اپراتورها', src: S_CRA + '، صفحات ۲۴ تا ۲۷'}]};
  };
  // mobile broadband for a past year: only the quarterly operator series has that year; coverage/5G/QoS are spring 1405 only
  SEC.mobileYear = (pl, y) => {
    const Yf = (v) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    const P0 = M.mob.periods, idx = P0.map((q, i) => [q, i]).filter(([q]) => q.startsWith(String(y) + '-')).map(([, i]) => i);
    const li = idx[idx.length - 1], pq = P0[li], prevI = P0.indexOf((+y - 1) + '-' + pq.split('-')[1]);
    const ops = pl.ops.length ? M.mob.ops.filter((o) => pl.ops.includes(o)) : M.mob.ops, row = M.mob.values[li], tot = row.reduce((a, v) => a + v, 0);
    const totPrev = prevI >= 0 ? M.mob.values[prevI].reduce((a, v) => a + v, 0) : null, g = totPrev ? (tot / totPrev - 1) * 100 : null;
    const share = (o) => row[M.mob.ops.indexOf(o)] / tot * 100;
    const b = [
      P('says', `پهن‌باند سیار در ${per(pq)} ${F.big(tot)} اشتراک داشته${g != null ? ` (${F.sp(g)} نسبت به ${per(P0[prevI])})` : '؛ فصل هم‌نام سال قبل در سری نیست'}. سهم اپراتورها: ${ops.map((o) => o + ' ' + F.p(share(o))).join('؛ ')}.`),
      FIG(`اشتراک پهن‌باند سیار به تفکیک اپراتور تا ${per(pq)} (میلیون)`, S_CRA, (el) => K.line(el, {xs: P0.slice(0, li + 1), h: 260, series: ops.map((o) => ({name: o, c: C.op[o], vals: M.mob.values.slice(0, li + 1).map((r) => r[opIdx(o)] / 1e6), w: 2.2})), yMin: 0, yfmt: (v) => F.n(v), endfmt: (v) => F.n(r1(v)) + 'M', tfmt: (v) => F.n(r2(v)) + ' میلیون', xlab: xlabYear, xtip: per}), 270),
      NOTE('limit', `برای ${Yf(y)} فقط سری فصلی اشتراک اپراتورها در داده هست؛ پوشش، سایت، سهم 5G و کیفیت اپراتورها فقط برای بهار ۱۴۰۵ ثبت شده و در این گزارش نیامده است.`),
    ];
    return {key: `پهن‌باند سیار در ${per(pq)}: ${F.big(tot)} اشتراک${g != null ? `، ${F.sp(g)} در یک سال` : ''}.`, lead: `سری فصلی اشتراک اپراتورها، ${Yf(y)}.`, blocks: b, year: String(y), src: [{t: 'اشتراک پهن‌باند سیار فصلی', src: S_CRA, p: per(pq)}]};
  };
  SEC.quality = (pl) => {
    const b = [
      P('says', `RTT ثابت داخلی ${F.n(M.lat.fd)} و ثابت بین‌الملل ${F.n(M.lat.fi)} میلی‌ثانیه است؛ برای سیار ${F.n(M.lat.md)} و ${F.n(M.lat.mi)} میلی‌ثانیه.`),
      P('calc', `مسیر بین‌الملل ${F.n(r1(M.lat.fi - M.lat.fd))} میلی‌ثانیه به تأخیر ثابت و ${F.n(r1(M.lat.mi - M.lat.md))} میلی‌ثانیه به تأخیر سیار اضافه می‌کند.`),
      P('says', `از ${F.n(r1(M.traffic.tot / 1e9))} اگزابایت ترافیک داده تابستان ۱۴۰۵، ${F.p(M.traffic.intlShare)} به مقصد بین‌الملل رفته است (سیار ${F.p(M.traffic.mobIntl)}، ثابت ${F.p(M.traffic.fixIntl)}). مصرف ماهانه هر مشترک ثابت حدود ${F.i(M.traffic.gbFix)} و سیار ${F.i(M.traffic.gbMob)} گیگابایت است.`),
      FIG('ترافیک داده داخلی و بین‌الملل (اگزابایت، تابستان ۱۴۰۵)', S_WB, (el) => K.hbar(el, [{k: 'اینترنت ثابت', o: M.traffic.fix}, ...M.traffic.ops.map((x) => ({k: x.o, o: x}))].map((r) => ({l: r.k, items: [{n: 'داخلی', v: r.o.domestic / 1e9, c: C.teal, t: F.n(r1(r.o.domestic / 1e9)) + ' EB'}, {n: 'بین‌الملل', v: r.o.international / 1e9, c: C.amber, t: F.n(r1(r.o.international / 1e9)) + ' EB'}]})), {bar: 12, gap: 2, gp: 14}), 240),
      P('infer', 'سهم بالای مقصد بین‌الملل به‌تنهایی معیار داوری درباره تحقق شبکه ملی اطلاعات نیست؛ ترافیک تونلی و تعریف طبقه‌بندی منبع، تفسیر را محدود می‌کند.'),
    ];
    if (pl.len !== 'brief') b.push(FIG('RTT ستون فقرات شبکه (TIC) در ۹ فصل · میلی‌ثانیه', 'داده TIC ارسالی', (el) => K.line(el, {xs: M.tic.map((t) => t.year + '-Q' + t.quarter), h: 220, series: [{name: 'RTT', c: C.ice, vals: M.tic.map((t) => t.rtt), w: 2.2, area: true}], yfmt: (v) => F.n(r1(v)), endfmt: (v) => F.n(r1(v)) + 'ms', tfmt: (v) => F.n(r2(v)) + ' ms', xlab: (p) => per(p), xtip: per}), 230),
      P('says', `RTT شبکه مادر در ۹ فصل ${F.sp(M.ticChg)} تغییر کرده است.`));
    return {key: `${F.p(M.traffic.intlShare)} ترافیک به مقصد بین‌الملل رفته و مسیر بین‌الملل ${F.n(r1(M.lat.fi - M.lat.fd))} میلی‌ثانیه به تأخیر ثابت می‌افزاید.`, lead: 'تأخیر، ترافیک و کیفیت ستون فقرات.', blocks: b,
      src: [off('CRA57-RTT-fixed-domestic'), off('CRA57-RTT-mobile-international'), {t: 'ترافیک داده تابستان ۱۴۰۵', src: S_WB}]};
  };
  SEC.provinces = (pl) => {
    const okBase = (p) => p.fthI >= 1000 && !(p.flag && /ناسازگار/.test(p.flag));
    const sel = pl.provs.map((i) => M.prov.find((p) => p.iso === i)).filter(Boolean);
    const ranked = [...M.prov].filter(okBase).sort((a, b) => b.fthU - a.fthU), rk = (p) => { const i = ranked.indexOf(p); return i < 0 ? 'بدون رتبه' : F.i(i + 1) + ' از ' + F.i(ranked.length); };
    const L = sel.length ? sel : [...ranked.slice(0, 5), ...ranked.slice(-5)];
    const b = [];
    if (sel.length) b.push(TB('نیم‌رخ استان‌ها · شهریور ۱۴۰۵', ['سنجه', ...sel.map((p) => p.n)], [['پورت FTTH منصوبه', ...sel.map((p) => F.i(p.fthI))], ['پورت FTTH دایر', ...sel.map((p) => F.i(p.fthA))], ['دایر به منصوبه FTTH', ...sel.map((p) => (p.fthU == null ? 'ناموجود' : F.p(p.fthU)))], ['رتبه در نسبت دایر به منصوبه', ...sel.map(rk)], ['XDSL دایر', ...sel.map((p) => F.i(p.xA))], ['TD-LTE دایر', ...sel.map((p) => F.i(p.lteA))], ['پهن‌باند ثابت دایر', ...sel.map((p) => F.i(p.bb))], ['سهم فیبر از ثابت', ...sel.map((p) => (p.fibShare == null ? 'ناموجود' : F.p(p.fibShare)))]], S_PORT));
    if (sel.length >= 2) {
      const a = [...sel].filter((p) => p.fthU != null).sort((x, y) => y.fthU - x.fthU);
      if (a.length >= 2) b.push(P('calc', `در نسبت دایر به منصوبه FTTH، ${a[0].n} با ${F.p(a[0].fthU)} از ${a[a.length - 1].n} با ${F.p(a[a.length - 1].fthU)} جلوتر است. هر دو عدد از یک فایل و یک دوره‌اند.`));
    } else if (sel.length === 1) {
      const p = sel[0];
      b.push(P('calc', p.fthU == null ? `${p.n} در فایل پورت منصوبه FTTH ندارد، پس نسبت دایر به منصوبه برایش تعریف نمی‌شود.` : `${p.n} از ${F.i(p.fthI)} پورت FTTH منصوبه ${F.i(p.fthA)} پورت دایر دارد (${F.p(p.fthU)}، رتبه ${rk(p)}).`));
    }
    b.push(FIG('نسبت پورت دایر به منصوبه FTTH در استان‌ها', S_PORT, (el) => drawProvMap(el, 'fthU', null, 380, null, sel[0] ? sel[0].iso : null), 390));
    b.push(FIG(sel.length ? 'دایر به منصوبه FTTH در استان‌های انتخابی' : 'پنج استان بالا و پنج استان پایین در نسبت دایر به منصوبه FTTH', S_PORT, (el) => K.hbar(el, L.filter((p) => p.fthU != null).map((p) => ({l: p.n, v: p.fthU, c: sel.includes(p) || !sel.length ? C.teal : C.dim, t: F.p(p.fthU)})), {bar: 14, gp: 8, max: 100}), 40 + L.length * 24));
    b.push(NOTE('limit', 'فایل پورت فقط شرکت‌های FCP/UNSP را دارد؛ مخابرات ایران و کل بازار در آن نیست و آمار رسمی استانی جایگزین آن نمی‌شود. استان‌های با کمتر از هزار پورت منصوبه یا داده ناسازگار در رتبه‌بندی نیستند.'));
    return {key: sel.length ? `${sel.map((p) => p.n).join(' و ')} در نسبت دایر به منصوبه FTTH: ${sel.map((p) => (p.fthU == null ? 'ناموجود' : F.p(p.fthU))).join(' و ')}.` : `بیشترین نسبت دایر به منصوبه FTTH در ${ranked[0].n} (${F.p(ranked[0].fthU)}) و کمترین در ${ranked[ranked.length - 1].n} (${F.p(ranked[ranked.length - 1].fthU)}) است.`,
      lead: 'پورت منصوبه، دایر و ترکیب فناوری در استان‌ها؛ فقط از فایل پورت ارسالی.', blocks: b, src: [{t: 'پورت و سرعت ۳۱ استان', src: S_PORT}]};
  };
  SEC.platforms = (pl) => {
    const ps = pl.plats.length ? M.plat.filter((p) => pl.plats.includes(p.k)) : M.plat, top = [...ps].filter((p) => p.vShare != null).sort((a, b) => b.vShare - a.vShare)[0];
    return {key: top ? `${top.n} ${F.p(top.vShare)} بازدید و ${F.p(top.cShare)} محتوا را دارد؛ دیده‌شدن متمرکزتر از تولید محتواست.` : 'برای انتخاب فعلی شاخص بازدید قابل‌مقایسه موجود نیست.', lead: 'محتوا، کانال و بازدید سکوهای داخلی طبق آمار ناشر.', blocks: [
      P('says', ps.map((p) => `${p.n}: ${F.n(p.content)} میلیون محتوا، ${F.n(p.channels)} هزار کانال فعال${p.views != null ? '، ' + F.n(p.views) + ' میلیارد بازدید' : ''}`).join('؛ ') + '.'),
      FIG('سهم محتوا در برابر سهم بازدید', S_PLAT, (el) => K.bubble(el, ps.filter((p) => p.vShare != null).map((p) => ({n: p.n, x: p.cShare, y: p.vShare, r: p.content, c: C.plat[p.k], tip: [{t: 'سهم محتوا: ' + F.p(p.cShare)}, {t: 'سهم بازدید: ' + F.p(p.vShare)}]})), {h: 280, xmax: 50, ymax: 95, xfmt: (v) => F.n(v) + '٪', yfmt: (v) => F.n(v) + '٪', xname: 'سهم محتوا ←', yname: 'سهم بازدید', diag: true, rmax: 36}), 290),
      P('calc', top ? `بازدید به ازای هر محتوا در ${top.n} ${F.i(top.vpc)} است. نقطه‌های بالای خط‌چین سهم بازدیدشان از سهم محتوایشان بیشتر است.` : 'ضریب نفوذ با بازدید یکسان نیست؛ مقایسه بازدید برای این انتخاب انجام نشد.'),
      TB('آمار سکوها', ['سکو', 'محتوا (میلیون)', 'کانال فعال (هزار)', 'بازدید (میلیارد)', 'سهم محتوا', 'سهم بازدید'], ps.map((p) => [p.n, F.n(p.content), F.n(p.channels), p.views != null ? F.n(p.views) : 'ناموجود', F.p(p.cShare), p.vShare != null ? F.p(p.vShare) : 'ناموجود']), S_PLAT),
      NOTE('limit', 'سهم‌ها نسبت به کل جامعه گزارش ناشرند، نه فقط سکوهای انتخاب‌شده. تعریف «بازدید» میان سکوها یکسان‌سازی نشده، «ضریب نفوذ» ویراستی بازدید نیست و آمار را خود ناشر منتشر کرده است.'),
    ], src: [{t: 'آمار شش‌ماهه سکوها', src: S_PLAT}]};
  };
  // year-aware: z = requested/target year (default 1403, the latest evaluation); figures never go past z
  SEC.nin = (pl, zArg) => {
    const Yf = (y) => String(y).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    const z = String(zArg || NIN.LAST), ys = NIN.YEARS.filter((y) => y <= z), ov = NIN.S.overall, p = ys.length > 1 ? ys[ys.length - 2] : null, y0 = ys[0], st = NIN.stats(z);
    const dl = (g) => (p ? NIN.delta(g, p, z) : null), comp = NIN.goals.filter((g) => dl(g) != null);
    const weak = NIN.goals.filter((g) => NIN.prog(g, z) != null).sort((a, b) => NIN.prog(a, z) - NIN.prog(b, z)).slice(0, pl.len === 'brief' ? 3 : 6);
    const gsel = pl.goals.map((g) => NIN.byNo[g]).filter(Boolean);
    const gd = NIN.goals.flatMap((g) => NIN.gapRows(g, z).filter((r) => r.gap != null).map((r) => ({...r, g}))).sort((a, b) => b.gap - a.gap).slice(0, 8);
    const C2 = NIN.consistency();
    const b = [
      P('says', p ? `پیشرفت کل درج‌شده از ${F.n(ov[y0].value)}٪ در ${Yf(y0)} به ${F.n(ov[z].value)}٪ در ${Yf(z)} رسیده؛ ${F.n(r2(Math.abs(ov[z].value - ov[y0].value)))} واحد درصد ${ov[z].value < ov[y0].value ? 'کاهش' : 'افزایش'}. ${Yf(z)} نسبت به ${Yf(p)} ${F.n(r2(Math.abs(ov[z].value - ov[p].value)))} واحد درصد ${ov[z].value < ov[p].value ? 'کاهش' : 'افزایش'} دارد.` : `پیشرفت کل درج‌شده در ${Yf(z)} ${F.n(ov[z].value)}٪ است؛ سال پیش از آن در فایل نیست.`),
      FIG(`پیشرفت کل و میانه اهداف، ${Yf(y0)} تا ${Yf(z)} (٪)`, S_NIN, (el) => K.line(el, {xs: ys, h: 230, yMin: 0, series: [{name: 'پیشرفت کل', c: C.amber, vals: ys.map((y) => ov[y].value), w: 2.8, area: true}, {name: 'میانه اهداف', c: C.ice, vals: ys.map((y) => NIN.stats(y).med), w: 1.6, dash: '4 3'}], yfmt: (v) => F.i(Math.round(v)), tfmt: (v) => F.n(v), endfmt: (v) => F.n(r1(v)) + '٪', xlab: (y) => NIN.yfa(y), xtip: (y) => NIN.yfa(y)}), 240),
      P('calc', `در ${Yf(z)} میانه ${F.i(st.n)} هدف ${F.p(st.med)} است؛ ${F.i(NIN.goals.filter((g) => NIN.prog(g, z) >= 75).length)} هدف ۷۵٪ و بیشتر و ${F.i(NIN.goals.filter((g) => NIN.prog(g, z) != null && NIN.prog(g, z) < 40).length)} هدف زیر ۴۰٪.${p ? ` نسبت به ${Yf(p)}، ${F.i(comp.filter((g) => dl(g) > 0.05).length)} هدف بهبود و ${F.i(comp.filter((g) => dl(g) < -0.05).length)} هدف افت داشته‌اند.` : ''}`),
      FIG(`ضعیف‌ترین اهداف در ${Yf(z)} (درصد تحقق)`, S_NIN, (el) => K.hbar(el, weak.map((g) => ({l: 'هدف ' + F.i(g.no) + ' · ' + g.short, v: NIN.prog(g, z), c: NIN.color(NIN.prog(g, z)), t: F.p(NIN.prog(g, z))})), {bar: 14, gp: 8, max: 100}), 40 + weak.length * 26),
    ];
    gsel.forEach((g) => b.push(P('says', `هدف ${F.i(g.no)} («${g.title}»): ${ys.map((y) => NIN.yfa(y) + ' ' + (NIN.prog(g, y) == null ? 'ناموجود' : F.p(NIN.prog(g, y)))).join('، ')}. متولی: ${g.owners.map((o) => NIN.OWN[o] || o).join('، ') || 'نامشخص'}.`)));
    if (pl.len !== 'brief') b.push(TB(`شاخص‌هایی که بیشترین فاصله تا ۱۰۰٪ را می‌سازند (${Yf(z)})`, ['کد', 'شاخص', 'هدف', 'وزن', 'عملکرد', 'سهم از شکاف'], gd.map((r) => [r.i.code || '—', r.i.title, F.i(r.g.no), F.p(r.w * 100, 0), r.p == null ? 'ناموجود' : F.p(r.p), F.n(r1(r.gap))]), S_NIN));
    // wording follows the selected period and the actual direction (was a fixed «افت آخرین سال» even when the year grew)
    const dz = p ? ov[z].value - ov[p].value : null, move = dz == null ? `عدد کل ${Yf(z)}` : Math.abs(dz) < 0.5 ? `تغییر اندک عدد کل در ${Yf(z)} نسبت به ${Yf(p)}` : dz < 0 ? `کاهش عدد گزارش‌شده‌ی کل در ${Yf(z)} نسبت به ${Yf(p)}` : `افزایش عدد کل در ${Yf(z)} نسبت به ${Yf(p)}`;
    b.push(P('infer', `وزن اهداف و روش تجمیع عدد کل در فایل نیامده و عدد کل با میانگین ساده اهداف بازتولید نمی‌شود؛ پس ${move} را نمی‌توان با قطعیت به هدف یا متولی مشخصی نسبت داد.`));
    b.push(NOTE('limit', `از ${F.i(C2.n)} مقدار هدف‌سال بازمحاسبه‌پذیر، ${F.i(C2.bad)} مورد با Σ وزن × عملکرد شاخص‌ها نمی‌خواند (بیشترین اختلاف بقیه ${F.n(r2(C2.maxOk))} واحد). ${NIN.YSTAT && NIN.YSTAT[z] ? 'ارزیابی ' + Yf(z) + ' خوداظهاری وزارتخانه است' + (String(z) === '1405' ? ' و فقط تا شهریور را پوشش می‌دهد' : '') + ' و' : ''} این درصدها کیفیت یا تجربه مردم را مستقیم نمی‌سنجند.`));
    const trend = !p ? '' : ov[z].value < ov[p].value ? ` ولی عدد گزارش‌شده در ${Yf(z)} نسبت به ${Yf(p)} کاهش یافته${NIN.YSTAT && NIN.YSTAT[z] ? ' (خوداظهاری وزارتخانه' + (String(z) === '1405' ? '، تا شهریور' : '') + '؛ روش تجمیع تأییدنشده)' : ''}` : Math.abs(ov[z].value - ov[p].value) < 0.5 ? ` ولی در ${Yf(z)} متوقف شده` : '';
    return {key: `پیشرفت کل اهداف شبکه ملی در ${Yf(z)}: ${F.n(ov[z].value)}٪${p ? ` (${Yf(y0)}: ${F.n(ov[y0].value)}٪)` : ''}${trend}؛ ضعیف‌ترین هدف «${weak[0].short}» با ${F.p(NIN.prog(weak[0], z))} است.`, year: z, lead: 'ارزیابی سالانه ' + F.i(NIN.goals.length) + ' هدف و ' + F.i(NIN.inds.filter((i) => i.perf && i.perf[z] != null).length) + ' شاخص دارای عملکرد در ' + Yf(z) + (NIN.inds.length > NIN.inds.filter((i) => i.perf && i.perf[z] != null).length ? ' (از ' + F.i(NIN.inds.length) + ' شاخص ثبت‌شده؛ بقیه فاقد مقدار یا تاریخی‌اند)' : '') + '.', blocks: b, src: [{t: 'ارزیابی سالانه اهداف و شاخص‌ها', src: S_NIN}]};
  };
  SEC.people = (pl) => {
    const sv = (D.survey || []).slice(0, 6);
    return {key: `شکایت پهن‌باند ثابت به ازای هر هزار مشترک ${F.i(M.comp.fixbb / M.comp.mob)} برابر تلفن همراه است؛ در پیمایش ملت ${F.p(sv[0] ? sv[0].value : null)} سرعت را ضعیف ارزیابی کرده‌اند.`, lead: 'شکایات رسمی و شواهد پیمایشی تجربه کاربران.', blocks: [
      P('says', `شکایات بهار ۱۴۰۵: پهن‌باند ثابت ${F.i(kv('CRA57-COMP-FIXBB'))}، تلفن ثابت ${F.i(kv('CRA57-COMP-FIXTEL'))} و تلفن همراه ${F.i(kv('CRA57-COMP-MOBILEVOICE'))} مورد.`),
      P('calc', `به ازای هر هزار مشترک: پهن‌باند ثابت ${F.n(r2(M.comp.fixbb))}، تلفن ثابت ${F.n(r2(M.comp.fixtel))} و تلفن همراه ${F.n(Math.round(M.comp.mob * 1000) / 1000)} شکایت.`),
      FIG('یافته‌های پیمایش ملت (درصد پاسخ‌دهندگان)', 'گزارش ملت ۲۱۹۲۱ (پژوهشی؛ پذیرش Q5 ندارد)', (el) => K.hbar(el, sv.map((s) => ({l: s.title, v: s.value, c: C.violet, t: F.p(s.value)})), {max: 100, bar: 15, gp: 10}), 40 + sv.length * 28),
      NOTE('limit', 'یافته‌های پیمایش پژوهشی‌اند، هر عدد مخرج و پرسش خودش را دارد و با شاخص رسمی جمع یا مقایسه مستقیم نمی‌شود.'),
    ], src: [off('CRA57-COMP-FIXBB'), off('CRA57-COMP-MOBILEVOICE'), {t: 'پیمایش ملت', src: 'گزارش ملت ۲۱۹۲۱'}]};
  };
  SEC.infra = () => {
    const L = REC.list.filter((r) => r.coll === 'infra');
    const by = {}; L.forEach((r) => { const k = CODE(r.sub || 'سایر'); by[k] = (by[k] || 0) + 1; });
    const top = L.filter((r) => typeof r.v === 'number').slice(0, 12);
    return {key: `${F.i(L.length)} رکورد مرکز داده، ابر و IXP ثبت شده که بیشترشان اعلام ارائه‌دهنده‌اند، نه آمار ظرفیت فعال.`, lead: 'آنچه ارائه‌دهندگان درباره مراکز داده، ابر و تبادل ترافیک اعلام کرده‌اند.', blocks: [
      TB('رکوردهای زیرساخت اطلاعاتی به تفکیک گروه', ['گروه', 'رکورد'], Object.entries(by).map(([k, v]) => [k, F.i(v)]), 'رجیستر زیرساخت اطلاعاتی رادار'),
      TB('نمونه مقادیر اعلام‌شده', ['رکورد', 'مقدار', 'واحد', 'منبع'], top.map((r) => [String(r.t), F.n(r.v), r.u || '', String(r.src || '')]), 'صفحه‌های ارائه‌دهندگان؛ بازیابی آبان ۱۴۰۵'),
      NOTE('limit', 'ظرفیت اعلام‌شده، ظرفیت فعال یا آزاد نیست و قیمت فهرست، هزینه کامل مالکیت نیست؛ برای داوری، داده اشغال، برق، ارتباط و سطح خدمت لازم است.'),
    ], src: [{t: 'زیرساخت اطلاعاتی', src: 'رجیستر T06 تا T09 رادار'}]};
  };
  SEC.online = async (pl) => {
    const b = [];
    let st = null;
    if (API.base()) { try { st = await API.get('/api/v1/online/status'); } catch (e) { st = {error: e.message}; } }
    if (st && !st.error) {
      const o = st.overall, inc = st.incidents || [];
      b.push(P('calc', `داوری آشکارساز ${st.rule_version} در ${TEH(st.generated_at)}: دسترسی «${o.access.text}»، امنیت «${o.security.text}». ${F.i(o.access.n_judged + o.security.n_judged)} سری داوری شد و ${F.i(o.access.n_insufficient + o.security.n_insufficient)} سری داده کافی نداشت.`));
      if (inc.length) b.push(TB('رخدادهای باز', ['رخداد', 'وضعیت', 'شدت', 'شروع تخمینی', 'نقاط دید مستقل', 'سیگنال‌های ثبت‌شده در رخداد'], inc.map((i) => [i.title, ({open:'باز',recovering:'در حال بازیابی؛ بسته نشده',closed:'بسته‌شده'}[i.status] || i.status), i.severity_fa, TEH(i.started_at), F.i(i.independent_vantages.length), i.signals.filter((s) => s.peak_state !== 'normal').map((s) => s.label + ' (مقدار ثبت‌شدهٔ رخداد؛ وضعیت فعلی: ' + ({normal: 'عادی', watch: 'زیر نظر', alert: 'هشدار', gap: 'شکاف داده', stale: 'کهنه', insufficient: 'تاریخچه ناکافی', unknown: 'نامعلوم؛ داده تازه نرسیده'}[s.state] || s.state || 'نامعلوم') + ') ' + (s.change == null ? '' : (s.change > 0 ? '+' : '−') + F.i(Math.abs(s.change) * 100) + '٪')).join('؛ ')]), 'سرور رادار، قاعده ' + st.rule_version));
      else b.push(P('calc', 'رخداد بازی ثبت نشده است؛ این به معنی سلامت شبکه نیست و فقط یعنی قاعده‌ها در سری‌های داوری‌شده تغییری به آستانه نرسیده ندیدند.'));
    } else b.push(NOTE('limit', API.base() ? 'داوری از سرور دریافت نشد؛ وضعیت لحظه‌ای در این گزارش نیامده و چیزی برآورد نشده است.' : 'این گزارش از فایل آفلاین ساخته شده و داده زنده پایش ندارد؛ برای بخش لحظه‌ای، گزارش را در نسخه متصل بسازید.'));
    const L = [...CYBER.incidents].sort((a, b2) => (a.date < b2.date ? 1 : -1));
    const EV = CYBER.evidence_levels || {};
    b.push(TB('رخدادهای سایبری گزارش‌شده علیه ایران', ['تاریخ', 'رخداد', 'اثر گزارش‌شده', 'ادعا', 'سطح شاهد'], L.map((i) => [i.date_fa, i.title, i.effects, i.claimed_by, i.evidence.map((e) => EV[e] || e).join(' + ')]), 'رجیستر رخدادهای سایبری رادار؛ منابع عمومی'));
    b.push(P('infer', 'ادعای مهاجم تأیید نیست و انتساب جدا از خود حمله سنجیده می‌شود. در رخدادهای ثبت‌شده، بیشترین اثر عمومی بر سامانه سوخت و خدمات مالی بوده است.'));
    return {key: st && !st.error ? `دسترسی: ${st.overall.access.text}؛ امنیت: ${st.overall.security.text}.` : `${F.i(L.length)} رخداد سایبری عمومی از ۱۴۰۰ تا ۱۴۰۴ با سطح شاهد ثبت شده؛ داده زنده در این گزارش نیست.`, lead: 'وضعیت آشکارساز پایش آنلاین و رخدادهای سایبری گزارش‌شده.', blocks: b,
      src: [{t: 'پایش آنلاین', src: st && !st.error ? 'سرور رادار؛ منابع داوری‌شده: ' + [...new Set([...(st.overall.access.sources_judged || []), ...(st.overall.security.sources_judged || [])])].join('، ') : 'در این گزارش داده زنده نیست'}, ...L.flatMap((i) => i.sources.map((s) => ({t: i.title, src: s.publisher, url: s.url})))]};
  };
  // reads CHG.current, the same object the panel and the assistant show; never acknowledges (review state unchanged)
  SEC.changes = async (pl) => {
    const r = await CHG.ensure();
    const T = CHG.timeFa;
    if (r.state !== 'ok') {
      const why = {none: 'هنوز مبنای مقایسه در این مرورگر ثبت نشده است؛ تغییری ساخته نمی‌شود.', corrupt: 'مبنای ذخیره‌شده در این مرورگر خوانا نیست؛ مقایسه انجام نشد.', storage_off: 'حافظه مرورگر در دسترس نیست؛ مقایسه ممکن نیست.'}[r.state];
      return {key: '', lead: 'مقایسه با مبنای همین مرورگر.', blocks: [NOTE('limit', why)], src: [], changes: r};
    }
    const b = [P('calc', `مبنای مقایسه: بررسی‌شده در ${TEH(r.baseline.reviewedAt)}؛ تصویر فعلی: ${TEH(r.viewedAt)}. نسخه داده مبنا ${r.baseline.periodic.snapshotDate} و نسخه فعلی ${r.snapshot.periodic.dataVersion}. ${(() => { const t = CHG.coverageText(r); return t.complete ? 'بررسی کامل بود.' : 'بررسی ناقص بود: ' + t.details.join('؛ ') + '.'; })()}`)];
    Object.entries(CHG.TYPES).forEach(([t, name]) => {
      const it = r.items.filter((i) => i.type === t);
      if (r.parts[t] === 'unavailable') { b.push(NOTE('limit', `${name}: در این فایل آفلاین در دسترس نیست؛ مقایسه ممکن نیست.`)); return; }
      if (r.parts[t] === 'no_baseline') { b.push(NOTE('limit', `${name}: دریافت شد ولی در این مرورگر مبنا ندارد؛ مقایسه ممکن نیست.`)); return; }
      if (!it.length) { b.push(P('calc', `${name}: تغییری نسبت به مبنا دیده نشد${t !== 'periodic' && r.parts[t] === 'incomplete' ? ' (دریافت ناقص؛ بخش ناقص بررسی نشد)' : ''}.`)); return; }
      b.push(TB(`${name}: ${F.i(it.length)} تغییر`, ['شناسه تغییر', 'مورد، نوع و حوزه', 'قبل', 'بعد', 'اختلاف و درصد تغییر', 'زمان مشاهده داده و اهمیت'],
        it.map((i) => [i.id, `${i.title} — ${i.kindFa} · ${(DOM[i.dom] || {}).n || i.dom}`, i.before ? [i.before.text, i.before.period].filter(Boolean).join(' · ') : '—', i.after ? [i.after.text, i.after.period].filter(Boolean).join(' · ') : 'در نسخه فعلی نیست', [i.absText || '—', i.relText && i.relText !== '—' ? i.relText : ''].filter(Boolean).join(' · '), T(i.observedAt) + ' · ' + CHGUI.IMP[i.importance]]), 'رادار؛ سیاست ' + r.policy));
      it.filter((i) => i.importance === 'attention').slice(0, 6).forEach((i) => b.push(P('infer', `${i.title} (${i.kindFa}، ${i.id}): ${i.why} ${i.limit}`)));
    });
    if (r.unverified.length) b.push(NOTE('limit', `${F.i(r.unverified.length)} مورد قابل مقایسه نبود (مثلاً در پاسخ سرور نیامد یا شاهدش از مبنا قدیمی‌تر بود) و تغییر حساب نشد: ` + r.unverified.slice(0, 8).map((i) => i.title).join('، ') + '.'));
    b.push(NOTE('limit', 'مبنا فقط در همین مرورگر نگهداری می‌شود. تغییر سلامت منبع، تغییر وضعیت شبکه نیست؛ اصلاح آمار تغییر عملکرد نیست؛ عددی که تعریف، واحد، دامنه یا دوره‌اش هم‌سنجه نیست رشد یا افت نام نمی‌گیرد. ساخت این گزارش وضعیت بررسی موارد را تغییر نمی‌دهد.'));
    const n = r.items.length;
    return {key: n ? `${F.i(n)} تغییر نسبت به مبنای ${TEH(r.baseline.reviewedAt)}: ` + Object.entries(CHG.TYPES).map(([t, nm]) => nm + ' ' + (r.parts[t] === 'unavailable' ? 'در این فایل نیست' : r.parts[t] === 'no_baseline' ? 'مبنا ندارد' : F.i(r.counts[t]))).join('، ') + '.' : 'نسبت به مبنا تغییری دیده نشد.',
      lead: 'مقایسه با مبنای ثبت‌شده در همین مرورگر؛ سه نوع تغییر جدا.', blocks: b, changes: r,
      src: r.items.map((i) => ({t: i.title + ' · ' + i.kindFa, src: i.source || 'رادار', key: i.id, p: T(i.observedAt)}))};
  };
  SEC.decision = (pl) => {
    const doms = new Set(pl.topics.flatMap((t) => ({fixed: ['communications'], mobile: ['communications'], quality: ['communications'], provinces: ['communications'], people: ['people'], platforms: ['base'], online: ['security', 'communications'], nin: ['governance', 'communications'], infra: ['information'], overview: ['communications', 'people', 'governance']}[t] || [])));
    const ms = D.bridge.filter((b) => !doms.size || doms.has(MECH_DOM[b.mechanism_id]));
    const L = (ms.length ? ms : D.bridge).sort((a, b) => a.priority.localeCompare(b.priority));
    return {key: `${F.i(L.length)} سازوکار پیشنهادی مرتبط؛ هیچ‌کدام مالک قانونی، خط پایه، هدف KPI و بودجه تأییدشده ندارند.`, lead: 'اقدام‌های پیشنهادی پیش‌نویس‌اند و مصوب نیستند.', recs: L.map((b) => ({p: b.priority, t: b.mechanism_id + ' · ' + b.title, a: b.proposed_action, g: CODE(b.decision_gate), r: b.principal_risk, w: [b.timeline_30_days, b.timeline_90_days]})), blocks: [
      TB('سازوکارها و اقدام پیشنهادی', ['اولویت', 'سازوکار', 'اقدام پیشنهادی', 'دروازه تصمیم', 'گام ۳۰ روزه'], L.map((b) => [b.priority, b.mechanism_id + ' · ' + b.title, b.proposed_action, CODE(b.decision_gate), b.timeline_30_days]), 'پل سازوکار نارضایتی تا اقدام (S01→S02)؛ پیش‌نویس'),
      ...[...doms].filter((d) => DOM_GAP[d]).slice(0, 4).map((d) => P('infer', `داده لازم در حوزه ${DOM[d].n}: ${DOM_GAP[d].need}.`)),
      NOTE('limit', 'مالک قانونی، بودجه و KPI هدف این اقدام‌ها تأیید نشده است؛ پیش از تصمیم، دروازه هر سازوکار باید طی شود.'),
    ], src: [{t: 'سازوکارهای S01→S02', src: 'رجیستر تصمیم رادار (پیش‌نویس)'}]};
  };

  /* ---------- plan -> report ---------- */
  const build = async (pl) => {
    const order = ['changes', 'overview', 'fixed', 'mobile', 'quality', 'provinces', 'platforms', 'infra', 'nin', 'people', 'online', 'decision'];
    const topics = order.filter((t) => pl.topics.includes(t));
    const sections = [];
    // RADAR_REPORT_PERIOD_V3: a report for a named year is built from that year's data. Each section lists the years
    // it can actually be composed for; the target is the latest requested year it supports. No supported year ->
    // the section is withheld with a limitation note; another year's figure is never used as the headline.
    const mobYears = [...new Set(M.mob.periods.map((q) => +q.split('-')[0]))];
    const SUP = {nin: {years: NIN.YEARS.map(Number), def: +NIN.LAST, fn: (y) => SEC.nin(pl, String(y))}, mobile: {years: mobYears, def: 1405, fn: (y) => (y === 1405 ? SEC.mobile(pl) : SEC.mobileYear(pl, y))}};
    ['overview', 'fixed', 'quality', 'provinces', 'platforms', 'people'].forEach((k) => { SUP[k] = {years: [1405], def: 1405, fn: () => SEC[k](pl)}; });
    const req = [...new Set(pl.years.map(Number))].sort(), Y = (y) => String(y).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    const spanOf = (ys) => (ys.length === 1 ? Y(ys[0]) : Y(Math.min(...ys)) + ' تا ' + Y(Math.max(...ys)));
    for (const t of topics) { try { const sup = SUP[t]; let pnote = '', target = null;
      if (req.length && sup) {
        const inside = req.filter((y) => sup.years.includes(y)), out = req.filter((y) => !sup.years.includes(y));
        if (!inside.length) {
          sections.push({id: t, title: TOPICS[t].n, key: '', lead: '', period: 'withheld', blocks: [NOTE('limit', `برای سال درخواستی (${req.map(Y).join('، ')}) داده‌ای در این بخش نیست؛ این بخش فقط برای ${spanOf(sup.years)} از داده موجود قابل ساخت است. عدد سال دیگری به‌جای آن آورده نشد. این محدودیت داده همین بخش است، نه نبود داده در کل رادار.`)], src: []}); continue;
        }
        target = Math.max(...inside);
        if (out.length) pnote = `برای ${out.map(Y).join('، ')} داده‌ای در این بخش نیست؛ آنچه می‌آید مربوط به ${inside.map(Y).join('، ')} است.`;
      }
      const s = target != null ? await SUP[t].fn(target) : await SEC[t](pl); s.id = t; s.title = TOPICS[t].n; if (target != null) s.year = String(target); if (pnote) s.blocks.unshift(NOTE('limit', pnote)); if (pl.aud === 'exec' && pl.len !== 'full') s.blocks = s.blocks.filter((b) => b.type !== 'table' || t === 'decision' || t === 'changes' || (t === 'provinces' && pl.provs.length)); if (pl.len === 'brief') s.blocks = s.blocks.filter((b, i) => b.type !== 'fig' || s.blocks.filter((x) => x.type === 'fig').indexOf(b) === 0); sections.push(s); } catch (e) { console.error(e); sections.push({id: t, title: TOPICS[t].n, key: '', lead: '', blocks: [NOTE('limit', 'این بخش ساخته نشد: ' + e.message)], src: []}); } }
    let fig = 0, tab = 0;
    sections.forEach((s) => s.blocks.forEach((b) => { if (b.type === 'fig') b.no = ++fig; if (b.type === 'table') b.no = ++tab; }));
    const recs = (sections.find((s) => s.recs) || {}).recs || [];
    const limits = ['همه اعداد از داده‌های همین رادار آمده‌اند؛ هیچ عددی برآورد یا ساخته نشده است. «منبع می‌گوید» نقل منبع، «محاسبه رادار» محاسبه از همان داده و «استنباط» تفسیر تحلیلی است.',
      'آمار رسمی تا بهار ۱۴۰۵، کاربرگ‌های استانی و ترافیک تا تابستان و شهریور ۱۴۰۵ و ارزیابی اهداف تا شهریور ۱۴۰۵ است؛ دوره‌ها یکسان نیستند و جمع‌پذیر نیستند.',
      ...(sections.some((x) => x.period === 'withheld') ? [`برای سال درخواستی، این بخش‌ها داده نداشتند و فقط با یادداشت محدودیت آمده‌اند: ${sections.filter((x) => x.period === 'withheld').map((x) => x.title).join('، ')}. عدد سال دیگری جایگزین نشده است.`] : [])];
    const now = new Date();
    return {plan: pl, title: pl.title || autoTitle(pl), recipient: pl.recipient, aud: pl.aud, tpl: pl.tpl,
      date: new Intl.DateTimeFormat('fa-IR-u-ca-persian', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran'}).format(now), iso: now.toISOString(),
      summary: sections.filter((s) => s.key).map((s) => ({t: s.title, s: s.key})), sections, recs, limits,
      sources: sections.flatMap((s) => (s.src || []).map((x) => ({...x, sec: s.title}))), mode: sections.some((s) => s.id === 'online') ? (sections.find((s) => s.id === 'online').src.some((x) => String(x.src).startsWith('سرور رادار')) ? 'دریافت آنلاین انجام شد' : 'داده آنلاین دریافت نشد') : 'داده‌های ذخیره‌شده رادار'};
  };
  return {parse, build, autoTitle, TPL, TOPICS, AUD, LEN, FMT, LBL};
})();
