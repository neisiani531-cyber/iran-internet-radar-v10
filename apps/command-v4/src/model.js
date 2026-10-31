/* ===== v4 model: explicit classification, evidence type, admission, provenance chain ===== */
const DOM = {
  people: {n: 'مردم', d: 'تجربه، استطاعت و دسترسی', c: '#ffb340', i: '01'},
  applications: {n: 'خدمات کاربردی', d: 'دولت، پرداخت، تجارت، آموزش و سلامت', c: '#ff7eb6', i: '02'},
  base: {n: 'خدمات پایه شبکه ملی اطلاعات', d: 'سکوها، پیام‌رسان، DNS، CDN و جست‌وجو', c: '#b48cff', i: '03'},
  information: {n: 'زیرساخت اطلاعاتی', d: 'مرکز داده، ابر و میزبانی', c: '#78bfff', i: '04'},
  communications: {n: 'زیرساخت ارتباطی', d: 'دسترسی، انتقال، هسته، تبادل ترافیک و تاب‌آوری', c: '#2fd39c', i: '05'},
  security: {n: 'امنیت', d: 'فراگیر در همه لایه‌ها', c: '#ff5a54', i: 'S'},
  governance: {n: 'حکمرانی', d: 'فراگیر؛ نهاد، قانون، تنظیم‌گری، اقتصاد بازار و پاسخ‌گویی', c: '#ffd28a', i: 'G'},
  unassigned: {n: 'تعیین‌نشده', d: 'نگاشت صریح ندارد', c: '#7c8a9e', i: '?'},
};
const DOM_ORDER = ['people', 'applications', 'base', 'information', 'communications', 'security', 'governance'];
/* Dossier → owner domain. Source: taxonomy_v3 cases (research repo, via audit appendix). Rule id DOSSIER_MAP_V1. */
const DOSSIER = {
  P01: ['people', 'افکارسنجی و نارضایتی عمومی'], P02: ['people', 'تجربه کاربر و QoE'], P03: ['people', 'شکاف دیجیتال'], P04: ['people', 'پیامدهای اقتصادی و اجتماعی'],
  T01: ['communications', 'توپولوژی و لایه‌های شبکه'], T02: ['communications', 'ظرفیت و کیفیت شبکه'], T03: ['communications', 'تجهیزات و سرمایه‌گذاری'], T04: ['communications', 'شبکه ثابت و FTTH'],
  T05: ['communications', 'شبکه سیار'], T06: ['communications', 'ترانزیت و تبادل ترافیک'], T07: ['communications', 'قطعی و تاب‌آوری'], T08: ['information', 'مراکز داده و میزبانی'], T09: ['information', 'رایانش ابری و خدمات توزیع‌شده'],
  A01: ['governance', 'پالایش و سیاست دسترسی'], A02: ['people', 'VPN و رفتار دسترسی کاربر'], A03: ['security', 'امنیت و اعتماد'],
  E01: ['governance', 'اقتصاد اپراتورها'], E02: ['people', 'تعرفه و استطاعت'], E03: ['governance', 'رقابت و تنظیم‌گری'],
  G01: ['governance', 'نهادها و قوانین'], G02: ['governance', 'دولت چهاردهم'], G03: ['governance', 'مقایسه بین‌المللی'],
};
/* Evidence type: never mixes statistic, survey, measurement, claim, news and model on one level. */
const ET = {
  official: {n: 'آمار رسمی', r: 1, c: '#2fd39c'}, intl: {n: 'آمار بین‌المللی', r: 2, c: '#36c6f4'}, measurement: {n: 'اندازه‌گیری شبکه', r: 2, c: '#78bfff'},
  survey: {n: 'پیمایش', r: 3, c: '#ffb340'}, publisher: {n: 'گزارش یا ادعای ناشر/ارائه‌دهنده', r: 4, c: '#ff9b3d'}, analysis: {n: 'تحلیل یا گزارش پژوهشی', r: 4, c: '#b48cff'},
  model: {n: 'برآورد یا پیش‌بینی مدل', r: 5, c: '#ff7eb6'}, news: {n: 'خبر یا نقل رسانه', r: 5, c: '#ff5a54'}, price: {n: 'قیمت صفحه محصول', r: 4, c: '#ffd28a'},
  registry: {n: 'رجیستری یا فهرست', r: 4, c: '#93a1b3'}, catalog: {n: 'کاتالوگ منبع (شاهد نیست)', r: 9, c: '#7c8a9e'}, unknown: {n: 'نامشخص', r: 9, c: '#7c8a9e'},
};
const ADM = {
  official: {n: 'رسمی؛ تطبیق تصویری باقی', c: 'off'}, research: {n: 'پژوهشی؛ پذیرش Q5 ندارد', c: 'res'}, candidate: {n: 'نامزد؛ معلق تا رفع مانع روش', c: 'res'},
  held: {n: 'نگه‌داشته؛ تعارض یا منبع ناقص', c: 'usr'}, display: {n: 'نمایش پژوهشی؛ مجوز عمومی ندارد', c: 'usr'}, usertext: {n: 'متن کاربر؛ تأیید مستقل نشده', c: 'usr'}, catalog: {n: 'فقط کاتالوگ', c: 'calc'},
};
const SRC_ET = {MELLAT: 'survey', ISPA: 'survey', IPINFO: 'measurement', TOR: 'measurement', IRBLOCK: 'measurement', CFBGP: 'measurement', AKAMAI: 'measurement', TIC: 'measurement', PSIPHON: 'publisher',
  ISOC: 'intl', WORLDBANK: 'intl', ITU24: 'intl', ITU25: 'intl', DATAREPORTAL: 'intl', CABLE: 'intl', CRA53: 'official', IRANSTATIS: 'official',
  HRW: 'analysis', ARTICLE19: 'analysis', RSF: 'analysis', AMNESTY: 'analysis', UNOHCHR: 'analysis', EUPARL: 'analysis', ARXIV1: 'analysis', ARXIV2: 'analysis', DATAAK: 'analysis', CGI: 'analysis',
  MCI: 'publisher', MTN: 'publisher', RIGHTEL: 'publisher', TCI: 'publisher', SHATEL: 'publisher', ASIATECH: 'publisher', HIWEB: 'publisher', BALE: 'publisher', RUBIKA: 'publisher', SOROUSH: 'publisher', EITAA: 'publisher'};
const THEME_DOM = {resilience: 'communications', infrastructure: 'communications', experience: 'people', access: 'governance', governance: 'governance', economy: 'governance', operators: 'communications', platforms: 'base', isps: 'communications', regional: 'governance'};
const candET = (st) => {
  st = String(st || '');
  if (/SCENARIO|FORECAST|EXTRAPOLAT|_ESTIMATE$|ESTIMATE/.test(st)) return 'model';
  if (/SURVEY|LIKERT|COMPLAINT/.test(st)) return 'survey';
  if (/SAMPLE|EVENT|COMPOSITE|SUBINDEX|PANEL|MEDIAN|TREND|COMPARISON|BENCHMARK|SAMPLED/.test(st)) return 'analysis';
  if (/RATE_CHANGE|DAU|HEADLINE/.test(st)) return 'publisher';
  return 'unknown';
};

/* tolerate either layout of the research registers (inside D.reg or at the top level of the data) */
['catalog', 'sources', 'relations', 'conflicts', 'claims', 'gaps', 'outage', 'evreg'].forEach((k) => { D.reg = D.reg || {}; if (!Array.isArray(D.reg[k])) D.reg[k] = Array.isArray(D[k]) ? D[k] : []; });
const REC = (() => {
  const dr = D.domainReg, list = [];
  const catById = Object.fromEntries(D.reg.catalog.map((c) => [c.catalog_id, c]));
  const dossOf = (s) => String(s || '').split(/[;,\s]+/).filter((x) => DOSSIER[x]);
  const byDoss = (ds, rule) => (ds.length ? {dom: DOSSIER[ds[0]][0], cross: [...new Set(ds.slice(1).map((d) => DOSSIER[d][0]))].filter((x) => x !== DOSSIER[ds[0]][0]), rule: rule + ':' + ds.join(',')} : {dom: 'unassigned', cross: [], rule: 'NO_DOSSIER'});
  const reg = (sec, id) => (dr[sec + '::' + id] ? {dom: dr[sec + '::' + id], cross: [], rule: 'DOMAIN_REGISTRY:' + sec} : null);
  const push = (r) => { r.k = r.coll + ':' + r.id; list.push(r); };
  /* official values whose scale looks inconsistent with sibling rows; kept unchanged, held until checked against the source page */
  const VERIFY = {'CRA57-POSTAL-INTERNATIONAL': 'مقدار ۴۲۲ مرسوله در کنار ۷۴ میلیون مرسوله کل ناهمخوان به نظر می‌رسد؛ واحد یا مقیاس باید با صفحه ۱۸ سند اصلی فصلنامه ۵۷ بازبینی شود. عدد تغییر داده نشده است.'};
  D.kpi.forEach((k) => push({coll: 'off', id: k.id, ...(reg('رسمی نسخه ۹٫۱۷', k.id) || {dom: 'unassigned', cross: [], rule: 'NO_MAP'}), t: k.l, def: k.en, v: k.v, u: k.u, p: k.p, pop: k.den, geo: 'کل کشور', method: k.method || 'جداول فصلنامه ۵۷', src: 'فصلنامه آماری ۵۷ سازمان تنظیم مقررات', loc: 'صفحه ' + k.pg, got: 'استخراج متن PDF؛ ۱۴۰۵-۰۷', et: 'official', adm: VERIFY[k.id] ? 'held' : 'official', lim: [VERIFY[k.id], 'تطبیق تصویری صفحه منبع باقی است'].filter(Boolean), raw: k}));
  D.evidence.forEach((e) => {
    const m = reg('شواهد نسخه ۹٫۱۷', e.id) || {dom: THEME_DOM[e.th] || 'unassigned', cross: [], rule: 'THEME_MAP:' + e.th};
    push({coll: 'res', id: e.id, ...m, t: e.t, v: e.v, u: e.u, p: e.p, pop: e.pop, geo: '', method: e.m, src: e.s, loc: '', got: '', et: e.lv === 'modeled' ? 'model' : (SRC_ET[e.s] || 'unknown'), adm: e.lv === 'disputed' ? 'held' : 'research', lim: [e.lim, e.lv === 'disputed' ? 'سطح: مورد اختلاف' : ''].filter(Boolean), lvl: e.lv, theme: e.th, raw: e});
  });
  const platPush = (r, sub, sec, src, et) => push({coll: 'plat', sub, id: r.id, ...(reg(sec, r.id) || {dom: 'base', cross: [], rule: 'PLATFORM_DEFAULT'}), t: (PLAT[r.platform] || r.platform) + ' · ' + (r.topic ? r.topic + ' · ' : '') + r.metric, v: r.value, u: r.unit, p: r.period, pop: r.den || '', geo: '', method: '', src, loc: '', got: '', et, adm: et === 'news' ? 'held' : 'usertext', lim: [r.note, r.approx ? 'عدد تقریبی در متن منبع' : '', r.metric && /ضریب نفوذ/.test(r.metric) ? 'ضریب نفوذ با بازدید جمع یا مقایسه نمی‌شود' : ''].filter(Boolean), pl: r.platform, raw: r});
  D.plat.records.forEach((r) => platPush(r, 'شش‌ماهه', 'سکوها؛ شش‌ماهه', 'گزارش شش‌ماهه مرکز ملی فضای مجازی (متن ارائه‌شده کاربر)', 'publisher'));
  D.mordad.records.forEach((r) => platPush(r, 'مرداد', 'سکوها؛ مرداد', 'گزارش مرداد ۱۴۰۵ (متن ارائه‌شده کاربر)', 'publisher'));
  D.platSupp.forEach((r) => platPush(r, 'تکمیلی', 'سکوها؛ نقل تکمیلی', 'نقل خبری نشست (' + r.source + ')', 'news'));
  D.infra.forEach((r) => {
    const sec = r.sec, et = sec === 't09' ? (typeof r.v === 'number' ? 'price' : 'registry') : sec === 't06' ? (/LEGACY|HELD/.test(r.st) ? 'analysis' : 'registry') : 'publisher';
    const cross = /cdn|dns|edge/i.test(r.id) ? ['base'] : /logs/i.test(r.id) ? ['security'] : [];
    push({coll: 'infra', sub: sec, id: r.id, dom: sec === 't06' ? 'communications' : 'information', cross, rule: 'DOSSIER_MAP_V1:' + sec.toUpperCase(), t: r.raw.label_fa || r.raw.name || r.l, def: r.raw.metric_id || r.raw.service_class_candidate || '', v: r.v, u: r.u, p: r.p, pop: '', geo: '', method: r.raw.price_scope || r.raw.production_type || '', src: r.src, url: r.url, loc: r.loc, got: r.raw.retrieved_date || r.raw.observed_date || '', et, adm: /HOLD|PENDING|NOT_ADMITTED/.test(r.st) ? 'held' : 'display', lim: [].concat(r.lim || [], r.raw.scope ? [r.raw.scope] : [], et === 'price' ? ['قیمت درج‌شده در صفحه محصول در تاریخ بازیابی؛ قیمت قطعی امروز یا هزینه کامل خدمت نیست'] : []), ent: r.ent, raw: r.raw});
  });
  const cd = D.cand;
  const doss = (r) => dossOf(r.dossier_ids || r.dossier_id || (catById[r.source_catalog_id] || {}).dossier_ids);
  cd.dataak.forEach((r) => push({coll: 'cand', sub: 'داده‌کاوی', id: r.candidate_id, ...byDoss(doss(r), 'DOSSIER_MAP_V1'), t: (CODE_FA.fa(r.statistic_type) || '') + ' · ' + (r.denominator_or_base || ''), v: r.numeric_value, u: r.unit, p: r.period_label, pop: r.denominator_or_base, src: r.source_catalog_id, loc: 'صفحه ' + r.pdf_page, et: candET(r.statistic_type), adm: 'candidate', lim: [r.critical_limitation], raw: r}));
  cd.shnum.forEach((r) => push({coll: 'cand', sub: 'شناختیک · عددی', id: r.candidate_id, ...byDoss(doss(r), 'DOSSIER_MAP_V1'), t: r.metric_description, v: r.value, u: r.unit, p: r.period_label, src: r.source_catalog_id, loc: r.source_extraction_level, et: candET(r.statistic_semantics), adm: 'candidate', lim: [r.critical_limitation, /index/i.test(r.unit) ? 'امتیاز شاخص است، نه درصد افراد' : '', /forecast/i.test(r.unit) ? 'پیش‌بینی مدل است، نه مشاهده' : ''].filter(Boolean), raw: r}));
  cd.shclaim.forEach((r) => push({coll: 'cand', sub: 'شناختیک · ادعا', id: r.candidate_claim_id, ...byDoss(doss(r), 'DOSSIER_MAP_V1'), t: r.claim_label, v: r.value_as_reported, u: r.unit, p: r.observation_period, pop: r.denominator_or_population, src: r.source_catalog_id, loc: r.evidence_acquisition, et: /SURVEY/.test(r.claim_kind) ? 'survey' : /CLASSIFIER/.test(r.claim_kind) ? 'analysis' : 'publisher', adm: 'candidate', lim: [r.critical_limitation, r.ai_answer_policy], raw: r}));
  cd.fw.forEach((r) => push({coll: 'cand', sub: 'Filterwatch', id: r.candidate_id, ...byDoss(dossOf(r.dossier_id), 'DOSSIER_MAP_V1'), t: r.reported_claim, v: null, u: '', p: r.observation_window, src: r.report_title, url: r.report_url, et: 'analysis', adm: 'candidate', lim: [r.critical_limitation, 'شواهد زیرین: ' + r.underlying_evidence], raw: r}));
  cd.t02.forEach((r) => push({coll: 'cand', sub: 'T02 · 4G بهار ۱۴۰۴', id: r.id, ...byDoss(['T02'], 'DOSSIER_MAP_V1'), t: r.operator + ' · ' + r.metric, v: r.value, u: r.unit, p: r.period, src: 'فصلنامه ۵۳ رگولاتوری (بازنشر)', et: 'official', adm: 'candidate', lim: ['دوره بهار ۱۴۰۴؛ با فصلنامه ۵۷ هم‌دوره نیست'], raw: r}));
  D.reg.evreg.filter((r) => r._st !== 'IDENTIFIER_PRESENT').forEach((r) => push({coll: 'cand', sub: 'رجیستر شواهد', id: r.evidence_id, ...byDoss(dossOf(r.dossier_id), 'DOSSIER_MAP_V1'), t: r.claim_or_observation, v: r.figure, u: r.unit, p: r.measurement_period, pop: r.population_denominator, src: r.source_id, method: r.method, et: /رسانه/.test(r.method) ? 'news' : /مشاهده|ساعت/.test(r.method) ? 'measurement' : 'unknown', adm: 'held', lim: [r.limitations], raw: r}));
  D.reg.catalog.forEach((r) => push({coll: 'src', sub: r.record_kind, id: r.catalog_id, ...byDoss(dossOf(r.dossier_ids), 'DOSSIER_MAP_V1'), t: r.title, v: null, u: '', p: r.measurement_period || r.publication_date, src: r.publisher_name, url: r.url, method: r.provenance_role, et: 'catalog', adm: 'catalog', lim: [r.known_limitations].filter(Boolean), study: r.canonical_study_id, raw: r}));
  const byId = {};
  list.forEach((r) => { byId[r.k] = r; if (!byId[r.id]) byId[r.id] = r; r.cross = r.cross || []; r.lim = (r.lim || []).filter(Boolean); });
  return {list, byId, catById};
})();

/* ---------- provenance chain: claim → evidence → primary source → republication/derivation → conflict → admission ---------- */
const CHAIN = (() => {
  const R = D.reg, cat = REC.catById, cache = new Map();
  const srcReg = Object.fromEntries(R.sources.map((s) => [s.source_id, s]));
  const evReg = Object.fromEntries(R.evreg.map((e) => [e.evidence_id, e]));
  const rels = (cid) => R.relations.filter((x) => x.from_catalog_id === cid || x.to_catalog_id === cid);
  const studyMembers = (sid) => (sid ? R.catalog.filter((c) => c.canonical_study_id === sid) : []);
  const forRec = (r) => {
    if (cache.has(r.k)) return cache.get(r.k);
    const out = {claims: [], evidence: [], sources: [], catalog: [], relations: [], study: [], conflicts: [], admission: ADM[r.adm] ? ADM[r.adm].n : r.adm};
    const evId = r.coll === 'res' || r.coll === 'cand' ? r.id : null;
    if (evId) { out.claims = R.claims.filter((c) => String(c.evidence_ids).split(/[;,]/).includes(evId)); if (evReg[evId]) out.evidence.push(evReg[evId]); }
    const sid = (evReg[evId] || {}).source_id || r.raw.source_id || '';
    if (srcReg[sid]) out.sources.push(srcReg[sid]);
    const cids = new Set();
    if (r.coll === 'src') cids.add(r.id);
    if (r.raw.source_catalog_id) cids.add(r.raw.source_catalog_id);
    R.catalog.filter((c) => c.source_registry_id && c.source_registry_id === sid).forEach((c) => cids.add(c.catalog_id));
    cids.forEach((c) => { if (cat[c]) out.catalog.push(cat[c]); rels(c).forEach((x) => out.relations.push(x)); });
    out.catalog.forEach((c) => studyMembers(c.canonical_study_id).forEach((m) => { if (!out.study.find((s) => s.catalog_id === m.catalog_id)) out.study.push(m); }));
    const ds = String(r.rule || '').split(':')[1] || '';
    const dossiers = ds.split(',').filter((x) => /^[PTAEG]\d\d$/.test(x));
    out.conflicts = R.conflicts.filter((c) => dossiers.some((d) => String(c.dossier_ids).includes(d)) || (r.src && (String(c.source_a).includes(r.src) || String(c.source_b).includes(r.src))));
    out.dossiers = dossiers.map((d) => d + ' · ' + (DOSSIER[d] ? DOSSIER[d][1] : ''));
    cache.set(r.k, out);
    return out;
  };
  const families = () => { const m = {}; R.catalog.forEach((c) => { if (c.canonical_study_id) (m[c.canonical_study_id] = m[c.canonical_study_id] || []).push(c); }); return Object.entries(m).filter(([, v]) => v.length > 1); };
  return {forRec, families};
})();

/* value formatting with three distinct states: zero, missing (null), error */
const VAL = (v, u) => {
  if (v === undefined || v === null || v === '') return '<span class="na" title="مقدار در منبع ثبت نشده">ناموجود</span>';
  if (v && typeof v === 'object' && v.__error) return `<span class="er" title="${esc(v.__error)}">خطای دریافت</span>`;
  const s = typeof v === 'number' ? F.n(v) : esc(LTXT(v,60));
  return `<b class="num">${s}</b>${u ? ` <small class="u">${CODE(u)}</small>` : ''}`;
};
