// Exports the radar bundle consumed by the server assistant (packages/contracts/radar-bundle-v4.json).
const {chromium} = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + require('path').resolve(__dirname, '..', 'dist/Radar_NII_Command_v4.html')); await p.waitForTimeout(500);
 const out = await p.evaluate(() => {
  const strip = (o) => JSON.parse(JSON.stringify(o));
  const records = REC.list.map((r) => { const ch = CHAIN.forRec(r); return strip({k: r.k, coll: r.coll, id: r.id, dom: r.dom, dom_fa: DOM[r.dom].n, cross: r.cross, rule: r.rule, t: r.t, def: r.def, v: r.v, u: r.u, p: r.p, pop: r.pop, geo: r.geo || (r.coll === 'off' ? 'کل کشور' : ''), method: r.method, src: r.src, url: r.url, loc: r.loc, got: r.got, et: r.et, et_fa: (ET[r.et] || ET.unknown).n, adm: r.adm, adm_fa: (ADM[r.adm] || {}).n, lim: r.lim, sub: r.sub, raw: r.raw,
    chain: {claims: ch.claims.map((c) => ({id: c.claim_id, text: c.claim_text, confidence: c.confidence, status: c.status})), sources: ch.sources.map((s) => ({id: s.source_id, title: s.title, publisher: s.publisher, url: s.url})), catalog: ch.catalog.map((c) => ({id: c.catalog_id, title: c.title, role: c.provenance_role, study: c.canonical_study_id})), relations: ch.relations.map((x) => ({from: x.from_catalog_id, type: x.relation_type, to: x.to_catalog_id, note: x.explanation})), same_study: ch.study.map((c) => ({id: c.catalog_id, title: c.title, role: c.provenance_role})), conflicts: ch.conflicts.map((c) => ({id: c.conflict_id, topic: c.topic, a: c.source_a, b: c.source_b, desc: c.conflict_description, status: c.resolution_status})), admission: ch.admission}}); });
  const FCP = 'فایل پورت شرکت‌های FCP/UNSP، شهریور ۱۴۰۵؛ مخابرات ایران و کل بازار را نمی‌پوشاند؛ آمار ملی نیست';
  const datasets = {
   provinces: {desc: 'پورت منصوبه (I) و دایر (A) به تفکیک فناوری و استان؛ fthU و xU نسبت دایر به منصوبه (درصد)', scope: FCP, source: 'کاربرگ Port ارسالی', period: '۱۴۰۵-۰۶', units: 'پورت؛ درصد', rows: M.prov.map((r) => ({iso: r.iso, name: r.n, ftth_installed: r.fthI, ftth_active: r.fthA, ftth_active_pct: r.fthU == null ? null : +r.fthU.toFixed(2), xdsl_installed: r.xI, xdsl_active: r.xA, xdsl_active_pct: r.xU == null ? null : +r.xU.toFixed(2), tdlte_active: r.lteA, wifi_active: r.wA, tel_installed: r.telI, tel_active: r.telA, data_flag: r.flag || ''}))},
   operators: {desc: 'شاخص‌های اپراتورهای سیار', scope: 'سه اپراتور سیار؛ کل کشور', source: 'فصلنامه ۵۷ رگولاتوری', period: 'بهار ۱۴۰۵', units: 'coverage درصد جمعیت؛ ping میلی‌ثانیه؛ success/drop درصد', rows: D.ops},
   latency: {desc: 'RTT به تفکیک شبکه (ثابت/سیار) و مسیر (داخلی/بین‌الملل)', scope: 'کل کشور', source: 'فصلنامه ۵۷ ص۱۴', period: 'بهار ۱۴۰۵', units: 'میلی‌ثانیه', rows: D.latency},
   traffic: {desc: 'ترافیک داخلی و بین‌الملل', scope: 'کل کشور', source: 'گزارش پایش تابستان ۱۴۰۵', period: 'تابستان ۱۴۰۵', units: 'واحد ترافیک طبق منبع', rows: D.traffic},
   fixed_quarters: {desc: 'اشتراک ثابت به تفکیک فناوری در پنج فصل', scope: 'کل کشور', source: 'فصلنامه ۵۷ ص۲۲', period: '۱۴۰۴-Q1 تا ۱۴۰۵-Q1', units: 'اشتراک', rows: D.fixedQ},
   fiber_coverage: {desc: 'خانوار تحت پوشش فیبر (FTTx)', scope: 'کل کشور', source: 'فصلنامه ۵۷ ص۴', units: 'خانوار', rows: D.fiberCov.map(([p, v]) => ({period: p, households_covered: v}))},
   quality_q2: {desc: 'کیفیت صوت و داده اپراتورها', scope: 'پایش رگولاتوری', source: 'گزارش پایش تابستان ۱۴۰۵', units: 'درصد', rows: D.qualityQ2},
   speed_profile: {desc: 'توزیع سرعت سرویس فروخته‌شده به تفکیک فناوری (سرعت اسمی، نه اندازه‌گیری‌شده)', scope: 'فایل سرعت ارسالی شهریور ۱۴۰۵؛ نه کل کشور', source: 'کاربرگ سرعت', units: 'شمار سرویس', rows: [D.speed]},
   platforms: {desc: 'خلاصه سکوهای داخلی (محتوا، کانال، بازدید)؛ آمار ناشر', scope: 'گزارش ناشر', source: 'گزارش شش‌ماهه مرکز ملی فضای مجازی (متن کاربر)', period: 'شش‌ماهه نخست ۱۴۰۵', units: 'محتوا میلیون؛ بازدید میلیارد؛ کانال هزار', rows: M.plat},
   tor_archive: {desc: 'کاربران تخمینی پل Tor از ایران (آرشیو)؛ frac درصد پل‌های گزارشگر', scope: 'فقط کاربران پل؛ کاربران مستقیم را شامل نمی‌شود و با آن جمع نمی‌شود؛ افراد یکتا یا کل VPN نیست', source: 'Tor Metrics', period: 'ژوئن تا ژوئیه ۲۰۲۵', units: 'کاربر (برآورد)', rows: D.tor},
   tic_backbone: {desc: 'RTT، اتلاف بسته و jitter شبکه مادر', scope: 'پژوهشی', source: 'داده پژوهشی TIC', units: 'ms؛ درصد', rows: M.tic},
   conflicts: {desc: 'تعارض‌های ثبت‌شده میان منابع', rows: D.reg.conflicts}, relations: {desc: 'روابط منابع (اصل، بازنشر، تحلیل مشتق)', rows: D.reg.relations},
   data_gaps: {desc: 'درخواست‌های داده و شکاف‌ها', rows: D.reg.gaps}, mechanisms: {desc: 'سازوکارهای S01 و اقدام‌های پیشنهادی S02 (پیش‌نویس، مصوب نیست)', rows: D.bridge},
   nin_goals: {desc: 'اهداف عملیاتی شبکه ملی اطلاعات: درصد تحقق گزارش‌شده و بازمحاسبه‌شده (Σ وزن × عملکرد) در ۱۴۰۰ تا ۱۴۰۳', scope: 'کل کشور؛ فایل NIN1400-1404.xlsx ارسالی کاربر؛ اصالت احراز نشده؛ داده ۱۴۰۴ ندارد', source: 'NIN1400-1404.xlsx', period: '۱۴۰۰–۱۴۰۳', units: 'درصد تحقق هدف (۰ تا ۱۰۰)', rows: NIN.goals.map((g) => ({goal: g.no, short: g.short, title: g.title, owner_domain: g.dom, owners: g.owners, progress: g.progress, recomputed: g.recomputed, weight_sum: g.weight_sum, cells: Object.fromEntries(Object.entries(g.progress_cell).map(([k, v]) => [k, v.ref]))}))},
   nin_indicators: {desc: 'شاخص‌های اهداف شبکه ملی: وزن و عملکرد سالانه، فرمول و پارامترها', scope: 'همان فایل', source: 'NIN1400-1404.xlsx', units: 'عملکرد شاخص ۰ تا ۱۰۰؛ وزن کسر ۰ تا ۱ در هدف', rows: NIN.inds.map((i) => ({key: 'nin:' + i.id, code: i.code, goal: i.g.no, title: i.title, owner: i.own, weight: i.weight, perf: i.perf, formula: i.formula, params: i.params, flags: i.flags}))},
   nin_overall: {desc: 'درصد پیشرفت کل شبکه ملی اطلاعات (گزارش‌شده) و آماره‌های اهداف', scope: 'همان فایل؛ روش تجمیع کل در فایل نیامده', rows: NIN.YEARS.map((y) => ({year: y, reported: NIN.S.overall[y].value, cell: NIN.S.overall[y].cell, ...NIN.stats(y)}))},
   nin_issues: {desc: 'ناسازگاری‌ها و یادداشت‌های روش‌شناختی فایل اهداف', rows: [...NIN.S.issues, ...NIN.S.meta.notes.map((n) => ({kind: 'note', text: n}))]},
   domain_gaps: {desc: 'نیاز آماری هر حوزه', rows: Object.entries(DOM_GAP).map(([k, v]) => ({domain: k, domain_fa: DOM[k].n, ...v}))},
  };
  return {schema: 'radar-bundle-v4', snapshot: D.auditMeta && D.auditMeta.date, built_at: new Date().toISOString(), records: records, datasets};
 });
 require('fs').writeFileSync(process.argv[2], JSON.stringify(out));
 console.log(out.records.length, Object.keys(out.datasets).length, out.snapshot);
 await b.close(); })();
