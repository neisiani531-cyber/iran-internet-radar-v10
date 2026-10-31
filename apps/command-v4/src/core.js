/* ===== core: formatting, data model, derived analytics ===== */
const D = window.RADAR_DATA;
const GEO = window.RADAR_GEO;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
/* one Intl.NumberFormat per locale+options (constructing it on every call is slow in long tables) */
const _nfm = new Map();
const mkNF = (o, loc) => { const l = loc || (window.RADAR_PRESENTATION?.lang === 'en' ? 'en-US' : 'fa-IR'), k = l + JSON.stringify(o); let f = _nfm.get(k); if (!f) { f = new Intl.NumberFormat(l, o); _nfm.set(k, f); } return f; };
const NF = {format: v => mkNF({maximumFractionDigits: 2}).format(v)};
const NF1 = {format: v => mkNF({maximumFractionDigits: 1, minimumFractionDigits: 0}).format(v)};
const NF0 = {format: v => mkNF({maximumFractionDigits: 0}).format(v)};
const F = {
  n: (v) => (v == null || isNaN(v) ? '—' : NF.format(v)),
  i: (v) => (v == null || isNaN(v) ? '—' : NF0.format(Math.round(v))),
  p: (v, d = 1) => (v == null || isNaN(v) ? '—' : mkNF({maximumFractionDigits: d}).format(v) + '٪'),
  sp: (v, d = 1) => (v == null || isNaN(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + mkNF({maximumFractionDigits: d}).format(Math.abs(v)) + '٪'),
  big: (v) => {
    if (v == null || isNaN(v)) return '—';
    const a = Math.abs(v);
    if (a >= 1e9) return NF.format(Math.round(v / 1e7) / 100) + ' میلیارد';
    if (a >= 1e6) return NF.format(Math.round(v / 1e4) / 100) + ' میلیون';
    if (a >= 1e4) return NF1.format(Math.round(v / 100) / 10) + ' هزار';
    return NF.format(v);
  },
  bigPair: (v) => {
    const a = Math.abs(v);
    if (a >= 1e9) return [NF.format(Math.round(v / 1e7) / 100), 'میلیارد'];
    if (a >= 1e6) return [NF.format(Math.round(v / 1e4) / 100), 'میلیون'];
    if (a >= 1e4) return [NF1.format(Math.round(v / 100) / 10), 'هزار'];
    return [NF.format(v), ''];
  },
  ax: (v) => {
    const a = Math.abs(v);
    if (a >= 1e9) return NF.format(+(v / 1e9).toFixed(1)) + 'B';
    if (a >= 1e6) return NF.format(+(v / 1e6).toFixed(1)) + 'M';
    if (a >= 1e3) return NF.format(+(v / 1e3).toFixed(0)) + 'K';
    return NF.format(v);
  },
};
const fa2en = (s) => String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const SEASON = {Q1: 'بهار', Q2: 'تابستان', Q3: 'پاییز', Q4: 'زمستان'};
const per = (p) => { const [y, q] = p.split('-'); return SEASON[q] + ' ' + NF0.format(+y).replace(/٬/g, ''); };
const perShort = (p) => { const [y, q] = p.split('-'); return SEASON[q].slice(0, 3) + '٬' + NF0.format(+y % 100).padStart(2, '۰'); };
const pct = (a, b) => (b ? (a / b - 1) * 100 : null);
const r1 = (x) => Math.round(x * 10) / 10;

/* colors */
const C = {
  fg: '#e9eef4', bg: '#0b1119', amber: '#ffb340', ice: '#78bfff', teal: '#2fd39c', red: '#ff5a54', violet: '#b48cff', pink: '#ff7eb6', mut: '#93a1b3', dim: '#7c8a9e', grid: '#16202c', line: '#283647',
  op: {'همراه اول': '#36c6f4', 'ایرانسل': '#ffd400', 'ايرانسل': '#ffd400', 'رایتل': '#c66bff'},
  tech: {FTTx: '#2fd39c', FTTH: '#2fd39c', XDSL: '#ff8a5c', ADSL: '#ff8a5c', VDSL: '#ffb340', TDLTE: '#78bfff', WiFi: '#b48cff', WIFI: '#b48cff', TEL: '#93a1b3'},
  plat: {RUBIKA: '#ff5a87', EITAA: '#ff9b3d', BALE: '#2fd39c', SOROUSH: '#36c6f4', VIRASTY: '#b48cff'},
  sev: {crit: '#ff5a54', warn: '#ffb340', info: '#78bfff', ok: '#2fd39c', res: '#b48cff'},
};
const PLAT = {RUBIKA: 'روبیکا', EITAA: 'ایتا', BALE: 'بله', SOROUSH: 'سروش‌پلاس', VIRASTY: 'ویراستی'};
const TECHN = {FTTH: 'فیبر FTTH', ADSL: 'ADSL', VDSL: 'VDSL', XDSL: 'XDSL', WIFI: 'WiFi', TDLTE: 'TD-LTE', TEL: 'تلفن ثابت'};

/* ---------- official KPI lookup ---------- */
const KPI = Object.fromEntries(D.kpi.map((k) => [k.id, k]));
const kv = (id) => (KPI[id] ? KPI[id].v : null);
/* Tor bridge-user series on a continuous daily axis: days absent in the source appear as null (a gap), never interpolated */
const TOR_DAILY = (() => { const t = D.tor || []; if (!t.length) return []; const by = Object.fromEntries(t.map((r) => [r.date, r])); const out = []; for (let d = new Date(t[0].date + 'T00:00:00Z'); d <= new Date(t[t.length - 1].date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) { const k = d.toISOString().slice(0, 10); out.push(by[k] || {date: k, users: null, frac: null}); } return out; })();

/* ---------- derived model ---------- */
const M = (() => {
  const m = {};
  const fq = D.fixedQ;
  const f0 = fq[0], f1 = fq[fq.length - 1];
  m.fixed = {first: f0, last: f1,
    techs: ['FTTx', 'XDSL', 'TDLTE', 'WiFi'].map((k) => ({k, from: f0[k], to: f1[k], d: f1[k] - f0[k], pct: pct(f1[k], f0[k]), share: f1[k] / f1.t * 100, share0: f0[k] / f0.t * 100})),
    total: f1.t, totalPct: pct(f1.t, f0.t)};
  m.fixed.offset = (f1.FTTx - f0.FTTx) / (f0.XDSL - f1.XDSL) * 100;
  const cov = D.fiberCov;
  m.fiber = {hh: cov[cov.length - 1][1], hhYA: cov[cov.length - 5][1], subs: f1.FTTx};
  m.fiber.takeup = m.fiber.subs / m.fiber.hh * 100;
  m.fiber.covYoY = pct(m.fiber.hh, m.fiber.hhYA);
  m.fiber.subsYoY = pct(f1.FTTx, f0.FTTx);
  m.fiber.idle = m.fiber.hh - m.fiber.subs;
  // mobile broadband history
  const mb = D.mobBB, L = mb.values.length;
  const tot = (row) => row.reduce((s, v) => s + v, 0);
  m.mob = {periods: mb.periods, ops: mb.ops, values: mb.values,
    total: tot(mb.values[L - 1]), totalYA: tot(mb.values[L - 5]), total0: tot(mb.values[0])};
  m.mob.yoy = pct(m.mob.total, m.mob.totalYA);
  m.mob.share = Object.fromEntries(mb.ops.map((o, i) => [o, mb.values[L - 1][i] / m.mob.total * 100]));
  m.mob.since = Object.fromEntries(mb.ops.map((o, i) => [o, pct(mb.values[L - 1][i], mb.values[0][i])]));
  m.mob.opYoY = Object.fromEntries(mb.ops.map((o, i) => [o, pct(mb.values[L - 1][i], mb.values[L - 5][i])]));
  m.gen = {g3: kv('CRA57-MOBBB-3G'), g4: kv('CRA57-MOBBB-4G'), g5: kv('CRA57-MOBBB-5G')};
  m.gen.t = m.gen.g3 + m.gen.g4 + m.gen.g5;
  // latency
  const lt = (mt, n, r) => D.latency.find((x) => x.metric === mt && x.network === n && x.route === r).value;
  m.lat = {fd: lt('rtt', 'fixed', 'domestic'), fi: lt('rtt', 'fixed', 'international'), md: lt('rtt', 'mobile', 'domestic'), mi: lt('rtt', 'mobile', 'international'),
    jfd: lt('jitter', 'fixed', 'domestic'), jfi: lt('jitter', 'fixed', 'international'), jmd: lt('jitter', 'mobile', 'domestic'), jmi: lt('jitter', 'mobile', 'international')};
  // traffic (Q2 1405 monitoring workbook, GB)
  const tr = (l) => D.traffic.find((x) => x.label === l);
  const tAll = tr('جمع کل دیتای مصرفی'), tFix = tr('اینترنت ثابت'), tMob = tr('جمع سیار');
  m.traffic = {dom: tAll.domestic, intl: tAll.international, tot: tAll.domestic + tAll.international,
    intlShare: tAll.international / (tAll.domestic + tAll.international) * 100,
    fix: tFix, mob: tMob,
    fixIntl: tFix.international / (tFix.domestic + tFix.international) * 100,
    mobIntl: tMob.international / (tMob.domestic + tMob.international) * 100,
    ops: ['همراه اول', 'ایرانسل', 'رایتل'].map((o) => ({o, ...tr(o)}))};
  // GB per subscription per month (Q2 traffic / Q1 subs / 3) — approximate
  m.traffic.gbFix = (tFix.domestic + tFix.international) / kv('CRA57-FIXBB-1405') / 3;
  m.traffic.gbMob = (tMob.domestic + tMob.international) / kv('CRA57-MOBB-1405') / 3;
  // complaints per 1000 subs
  m.comp = {fixbb: kv('CRA57-COMP-FIXBB') / kv('CRA57-FIXBB-1405') * 1000, fixtel: kv('CRA57-COMP-FIXTEL') / kv('CRA57-FIXEDTEL-1405') * 1000, mob: kv('CRA57-COMP-MOBILEVOICE') / kv('CRA57-MOB-1405') * 1000};
  // provinces
  const P = D.prov;
  m.prov = Object.entries(P).map(([iso, p]) => {
    const t = p.t, g = (k, f) => (t[k] && t[k][f] != null ? t[k][f] : 0);
    const fthI = g('FTTH', 'i'), fthA = g('FTTH', 'a'), xA = g('ADSL', 'a') + g('VDSL', 'a'), lteA = g('TDLTE', 'a'), wA = g('WIFI', 'a'), telA = g('TEL', 'a'), telI = g('TEL', 'i'), xI = g('ADSL', 'i') + g('VDSL', 'i');
    const bb = fthA + xA + lteA + wA;
    let flag = '';
    if (fthI === 0 && fthA > 0) flag = 'دایر بدون منصوبه';
    else if (fthI > 0 && fthA / fthI > 0.5) flag = 'نیازمند بازبینی';
    else if (fthI === 0 && fthA === 0) flag = 'بدون فیبر در فایل';
    return {iso, n: p.n, fthI, fthA, fthU: fthI ? fthA / fthI * 100 : null, xA, xI, xU: xI ? xA / xI * 100 : null, lteA, wA, telA, telI, bb,
      fibShare: bb ? fthA / bb * 100 : null, lteShare: bb ? lteA / bb * 100 : null, f2: p.f2, flag};
  });
  const S = (k) => m.prov.reduce((s, p) => s + (p[k] || 0), 0);
  m.provT = {fthI: S('fthI'), fthA: S('fthA'), xA: S('xA'), xI: S('xI'), lteA: S('lteA'), wA: S('wA'), telA: S('telA'), bb: S('bb')};
  /* ratio only over provinces with a usable base: installed >= 1000 and not flagged (active without installed, active/installed > 0.5) */
  const okBase = (p) => p.fthI >= 1000 && !p.flag;
  m.provT.fthUBase = {I: m.prov.filter(okBase).reduce((s, p) => s + p.fthI, 0), A: m.prov.filter(okBase).reduce((s, p) => s + p.fthA, 0), n: m.prov.filter(okBase).length,
    excluded: m.prov.filter((p) => !okBase(p) && (p.fthI || p.fthA)).map((p) => ({iso: p.iso, n: p.n, fthI: p.fthI, fthA: p.fthA, why: p.flag || 'پایه کمتر از ۱٬۰۰۰ پورت'}))};
  m.provT.fthU = m.provT.fthUBase.I ? m.provT.fthUBase.A / m.provT.fthUBase.I * 100 : null;
  m.provT.fthURaw = m.provT.fthA / m.provT.fthI * 100;
  m.provT.xU = m.provT.xA / m.provT.xI * 100;
  const teh = m.prov.find((p) => p.iso === 'IR-07');
  m.provT.tehShareI = teh.fthI / m.provT.fthI * 100;
  m.provT.tehShareBB = teh.bb / m.provT.bb * 100;
  m.provT.flags = m.prov.filter((p) => p.flag === 'دایر بدون منصوبه' || p.flag === 'نیازمند بازبینی').length;
  // speed distribution
  const sp = D.speed.data;
  const share = (arr) => { const t = arr.reduce((a, b) => a + b, 0); return arr.map((v) => (t ? v / t * 100 : 0)); };
  m.speed = Object.fromEntries(Object.entries(sp).filter(([k, v]) => v.some((x) => x > 0)).map(([k, v]) => [k, {raw: v, share: share(v), tot: v.reduce((a, b) => a + b, 0)}]));
  m.speed.xLe10 = m.speed.XDSL.share.slice(0, 3).reduce((a, b) => a + b, 0);
  m.speed.fGe100 = m.speed.FTTH.share[6];
  m.speed.lte30 = m.speed.TDLTE.share[5];
  // platforms
  const pr = D.plat.records, pv = (pl, met) => { const r = pr.find((x) => x.platform === pl && x.metric === met); return r ? r.value : null; };
  m.plat = Object.keys(PLAT).map((k) => ({k, n: PLAT[k], content: pv(k, 'تولید محتوا'), channels: pv(k, 'کانال / صفحه فعال'), views: pv(k, 'بازدید'),
    cShare: pv(k, 'سهم از محتوای پنج سکو'), vShare: pv(k, 'سهم از بازدید چهار پیام‌رسان'),
    vpc: pv(k, 'بازدید / محتوا · عدد منتشرشده'), cpc: pv(k, 'محتوا / کانال یا صفحه · عدد منتشرشده'),
    news: pv(k, 'خبر · سهم محتوا'), analysis: pv(k, 'تحلیل و اظهارنظر · سهم محتوا'), nonnews: pv(k, 'غیرخبری · سهم محتوا'),
    newsV: pv(k, 'خبر · سهم بازدید'), analysisV: pv(k, 'تحلیل و اظهارنظر · سهم بازدید'), nonnewsV: pv(k, 'غیرخبری · سهم بازدید'),
    top3: pv(k, 'سه محور اصلی · سهم محتوا')}));
  const rb = m.plat.find((p) => p.k === 'RUBIKA'), et = m.plat.find((p) => p.k === 'EITAA');
  m.platX = rb.vpc / et.vpc;
  // operators
  m.ops = D.ops;
  // TIC backbone
  m.tic = D.tic; m.ticChg = pct(D.tic[D.tic.length - 1].rtt, D.tic[0].rtt);
  // evidence
  m.evThemes = [...new Set(D.evidence.map((e) => e.th))];
  return m;
})();

const THEME_FA = {resilience: 'تاب‌آوری و اختلال', infrastructure: 'زیرساخت', experience: 'تجربه کاربر', access: 'دسترسی و فیلترینگ', governance: 'حکمرانی', economy: 'اقتصاد و هزینه', operators: 'اپراتورها', platforms: 'سکوها', isps: 'ISPها', regional: 'منطقه‌ای'};
const LEVEL_FA = {primary: 'منبع اولیه', qualified: 'مشروط', attributed: 'نقل‌شده', secondary: 'ثانویه', user: 'برآورد کاربری', disputed: 'مورد اختلاف', modeled: 'مدل‌سازی'};
const GROUP_FA = {overview: 'نمای کلان', fixed: 'ثابت و فیبر', mobile: 'شبکه سیار', services: 'خدمات و سهم بازار', reach: 'دسترسی روستایی', citizen: 'شکایات مردمی', other: 'پست و ماهواره', quality: 'کیفیت'};

/* net FTTx gain relative to net XDSL loss, worded as a fraction so it is not read as a share of migrating users */
const OFFSET_TXT = () => { const v = M.fixed.offset; const f = [[1 / 4, 'حدود یک‌چهارم'], [1 / 3, 'حدود یک‌سوم'], [1 / 2, 'حدود نیمی از'], [2 / 3, 'حدود دوسوم']].find(([q]) => Math.abs(v / 100 - q) < 0.04); return (f ? f[1] : 'معادل ' + F.p(v) + ' ') + ' (' + F.p(v) + ')'; };
/* ---------- alert engine: every signal computed from data ---------- */
const ALERTS = (() => {
  const a = [];
  const add = (sev, t, s, view, code) => a.push({sev, t, s, view, code});
  add('crit', 'پایه پهن‌باند ثابت کوچک شد', `اشتراک ثابت ${F.sp(kv('CRA57-FIXBB-GROWTH'), 2)} در یک سال. افزایش خالص FTTx ${OFFSET_TXT()} کاهش خالص XDSL بود (نسبت حسابی دو تفاضل؛ سهم مشترکان مهاجر نیست)؛ این مقایسه حسابی دو تفاضل است و جابه‌جایی مشترک از XDSL به فیبر را نشان نمی‌دهد.`, 'fixed', 'CRA57 · P3/P22');
  add('warn', 'شکاف پورت منصوبه و دایر FTTH در فایل FCP/UNSP', `در فایل پورت شرکت‌های FCP/UNSP (شهریور ۱۴۰۵؛ بدون مخابرات ایران، نه کل کشور) نسبت پورت FTTH دایر به منصوبه ${F.p(M.provT.fthU)} است (${F.i(M.provT.fthUBase.n)} استان با پایه معتبر؛ ${F.i(M.provT.fthUBase.excluded.length)} استان با پایه کوچک یا داده ناسازگار کنار گذاشته شد) و ${F.p(M.provT.tehShareI)} پورت‌های منصوبه در تهران است. علت این شکاف از این داده معلوم نیست.`, 'provinces', 'PORT 1405.06');
  add('info', 'نسبت اشتراک FTTx به خانوار تحت پوشش', `${F.big(M.fiber.subs)} اشتراک FTTx در برابر ${F.big(M.fiber.hh)} خانوار تحت پوشش؛ نسبت توصیفی ${F.p(M.fiber.takeup)}. صورت و مخرج هم‌جامعه نیستند (اشتراک غیرخانگی در صورت هست)، پس این نسبت «نرخ تبدیل» نیست.`, 'fixed', 'CRA57 · P4/P22');
  add('warn', `${F.p(M.traffic.intlShare, 0)} ترافیک داده به مقصد خارجی است`, `در تابستان ۱۴۰۵ سهم بین‌الملل در سیار ${F.p(M.traffic.mobIntl)} و در ثابت ${F.p(M.traffic.fixIntl)} بوده؛ برای داوری درباره شبکه ملی، هدف مصوب و تعریف سنجه لازم است.`, 'quality', 'MONITORING Q2-1405');
  add('warn', 'شکایت پهن‌باند ثابت نامتناسب است', `به ازای هر هزار مشترک، ${F.n(r1(M.comp.fixbb))} شکایت پهن‌باند ثابت در برابر ${F.n(Math.round(M.comp.mob * 1000) / 1000)} شکایت تلفن همراه.`, 'fixed', 'CRA57 · P28');
  add('warn', 'سرعت فروخته‌شده XDSL پایین است', `در فایل سرعت ارسالی (شهریور ۱۴۰۵؛ نه کل کشور) ${F.p(M.speed.xLe10)} سرویس‌های XDSL حداکثر ۱۰ مگابیت‌اند و ${F.p(M.speed.fGe100)} سرویس‌های FTTH بالای ۱۰۰ مگابیت. این سرعت اسمی سرویس است، نه سرعت اندازه‌گیری‌شده.`, 'fixed', 'SPEED 1405.06');
  const r = M.ops.find((o) => o.id === 'rightel');
  add('warn', 'فاصله رایتل در پوشش و 5G', `رایتل ${F.p(M.mob.share['رایتل'])} پهن‌باند سیار، ${F.n(r.sites5g)} سایت 5G و پوشش جمعیتی 4G ${F.p(r.coverage4g)} دارد.`, 'mobile', 'CRA57 · P10/P25');
  add('info', 'تأخیر مسیر بین‌الملل', `RTT بین‌الملل: سیار ${F.n(M.lat.mi)} و ثابت ${F.n(M.lat.fi)} میلی‌ثانیه؛ داخلی: سیار ${F.n(M.lat.md)} و ثابت ${F.n(M.lat.fd)}. مقایسه سیار بین‌الملل با ثابت داخلی اثر مسیر و فناوری را از هم جدا نمی‌کند.`, 'quality', 'CRA57 · P14');
  add('info', 'بازدید به ازای محتوا: روبیکا در برابر ایتا', `طبق آمار ناشر، بازدید به ازای هر محتوای روبیکا ${F.n(r1(M.platX))} برابر ایتاست (تعریف «بازدید» میان سکوها یکسان‌سازی نشده)؛ ایتا ${F.p(M.plat[1].cShare)} محتوا و ${F.p(M.plat[1].vShare)} بازدید.`, 'platforms', 'NCC · H1-1405');
  add('ok', 'رشد پهن‌باند سیار ادامه دارد', `${F.big(M.mob.total)} اشتراک، ${F.sp(M.mob.yoy)} سالانه؛ ضریب نفوذ ${F.p(kv('CRA57-MOBB-PEN'))}.`, 'mobile', 'CRA57 · P3');
  add('res', 'تأخیر ستون فقرات بهتر شده', `RTT شبکه مادر از ${F.n(M.tic[0].rtt)} به ${F.n(M.tic[M.tic.length - 1].rtt)} میلی‌ثانیه (${F.sp(M.ticChg)}) در ۹ فصل؛ داده پژوهشی.`, 'quality', 'TIC · RESEARCH');
  const vpn = D.evidence.find((e) => e.t === 'استفاده کلی از VPN');
  if (vpn) add('res', 'استفاده گسترده از ابزار دور زدن', `${F.p(vpn.v)} کاربران در پیمایش ISPA از VPN استفاده می‌کنند؛ داده پژوهشی و ثانویه.`, 'research', 'ISPA · RESEARCH');
  return a;
})();

// Translate an entire authored label before clipping it for a compact display.
const LTXT=(value,n)=>{const raw=String(value??'');const text=window.RADAR_I18N?.lang==='en'?window.RADAR_I18N.toEN(raw):raw;return text.slice(0,n)};
