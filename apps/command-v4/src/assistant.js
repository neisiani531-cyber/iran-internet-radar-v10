/* ===== analytical assistant: local reasoning engine over the full data base, optional server LLM ===== */
const RK = (x) => (typeof x === 'number' ? F.i(x) : x);
const AI = (() => {
  const norm = (s) => fa2en(String(s || '')).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‎‏]/g, ' ').replace(/[ًٌٍَُِّْ]/g, '').replace(/[؟?!.,،:؛()«»"']/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const has = (q, ...ws) => ws.some((w) => { const n = norm(w); return n.length <= 3 && /[آ-ی]/.test(n) ? (' ' + q).includes(' ' + n) : q.includes(n); }); // short Persian keywords match at word start («وب» must not fire inside «روبیکا», «ابر» inside «برابر»)
  const PV = M.prov.map((p) => ({p, k: norm(p.n)}));
  const provAlias = {'تهران': 'IR-07', 'مشهد': 'IR-30', 'خراسان': 'IR-30', 'اصفهان': 'IR-04', 'شیراز': 'IR-14', 'تبریز': 'IR-01', 'اهواز': 'IR-10', 'کرج': 'IR-09', 'رشت': 'IR-19', 'ساری': 'IR-21', 'کهگیلویه': 'IR-18', 'بویراحمد': 'IR-18', 'بلوچستان': 'IR-13', 'سیستان': 'IR-13', 'چهارمحال': 'IR-08', 'بختیاری': 'IR-08'};
  const findProvs = (q) => {
    const out = [];
    PV.sort((a, b) => b.k.length - a.k.length).forEach(({p, k}) => { if (q.includes(k) && !out.includes(p)) out.push(p); });
    Object.entries(provAlias).forEach(([a, iso]) => { if (q.includes(norm(a))) { const p = M.prov.find((x) => x.iso === iso); if (p && !out.includes(p)) out.push(p); } });
    // drop provinces whose name is substring of another found (e.g. خراسان)
    return out.filter((p, i) => !out.some((o, j) => j !== i && norm(o.n).includes(norm(p.n)) && o !== p));
  };
  const OPN = {'همراه اول': ['همراه اول', 'همراه', 'mci', 'همراه‌اول'], 'ایرانسل': ['ایرانسل', 'irancell', 'mtn'], 'رایتل': ['رایتل', 'rightel']};
  const findOps = (q) => Object.entries(OPN).filter(([, ws]) => ws.some((w) => q.includes(norm(w)))).map(([n]) => n);
  const PLN = {RUBIKA: ['روبیکا', 'rubika'], EITAA: ['ایتا', 'eitaa'], BALE: ['بله', 'bale'], SOROUSH: ['سروش', 'soroush'], VIRASTY: ['ویراستی', 'virasty']};
  const findPlats = (q) => Object.entries(PLN).filter(([, ws]) => ws.some((w) => new RegExp('(^| )' + norm(w)).test(q))).map(([k]) => k);
  const provMetric = (q) => {
    if (has(q, 'بهره', 'استفاده از ظرفیت', 'ضریب', 'خالی', 'بیکار')) return has(q, 'xdsl', 'adsl') ? 'xU' : 'fthU';
    if (has(q, 'سهم فیبر')) return 'fibShare';
    if (has(q, 'منصوبه', 'نصب')) return 'fthI';
    if (has(q, 'فیبر', 'ftth', 'fttx')) return 'fthA';
    if (has(q, 'xdsl', 'adsl', 'dsl')) return 'xA';
    if (has(q, 'td-lte', 'tdlte', 'lte', 'td lte')) return 'lteA';
    if (has(q, 'تلفن')) return 'telA';
    return 'bb';
  };
  const tbl = (head, rows) => `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const goBtn = (v, t) => `<button class="go" data-go="${v}">${t || 'نمایش در داشبورد'} ←</button>`;
  const src = (s) => `<div class="src">منبع: ${s}</div>`;

  const ASKW = new Set(['تحلیل', 'تحلیلش', 'کن', 'بده', 'میخوام', 'میخواهم', 'می', 'خواهم', 'خوام', 'روند', 'بررسی', 'توضیح', 'بیشتر', 'کامل', 'دقیق']);
  const STOP = new Set(['چه', 'چی', 'کدام', 'است', 'هست', 'را', 'به', 'از', 'در', 'با', 'که', 'این', 'آن', 'برای', 'های', 'ها', 'می', 'آیا', 'چند', 'چقدر', 'داریم', 'نداریم', 'درباره', 'مورد', 'کن', 'بده', 'بگو', 'دارد', 'دارند', 'هستند', 'شده', 'بود', 'یک', 'هم', 'یا', 'و', 'تا']);
  const H = {};
  H.brief = () => ({h: 'خلاصه وضعیت بهار ۱۴۰۵', b: `<ul>${ALERTS.slice(0, 7).map((a) => `<li><b>${esc(a.t)}:</b> ${esc(a.s)}</li>`).join('')}</ul><p>هر بند از داده محاسبه شده و منبع و دامنه‌اش در خودش آمده است. سیگنال‌ها از سه سطح متفاوت‌اند: آمار رسمی فصلنامه (کل کشور)، کاربرگ‌های ارسالی (بخشی از بازار) و داده ناشر یا پژوهشی؛ آن‌ها را با هم جمع یا هم‌سطح نکنید.</p>${src('فصلنامه ۵۷، کاربرگ پایش تابستان ۱۴۰۵، فایل‌های Port/Speed شهریور ۱۴۰۵، گزارش سکوها')}${goBtn('command')}`});
  H.prov = (p) => {
    const rk = (k) => { const r = M.prov.filter((x) => x[k] != null).sort((a, b) => b[k] - a[k]); const i = r.findIndex((x) => x.iso === p.iso); return i < 0 ? 'بدون رتبه' : i + 1; };
    const insight = p.fthU != null && p.fthU < M.provT.fthU ? `نسبت پورت FTTH دایر به منصوبه در این استان ${F.p(p.fthU)} و در کل فایل ${F.p(M.provT.fthU)} است (محاسبه رادار). علت تفاوت از این داده معلوم نیست.` : p.fthU != null ? `نسبت پورت FTTH دایر به منصوبه ${F.p(p.fthU)} و در کل فایل ${F.p(M.provT.fthU)} است (محاسبه رادار).` : 'در این فایل پورت فیبر منصوبه برای استان ثبت نشده است.';
    return {h: `نیم‌رخ ${p.n}`, b: `${tbl(['شاخص', 'مقدار', 'رتبه از ۳۱'], [['پورت FTTH منصوبه', F.i(p.fthI), (typeof rk('fthI') === 'number' ? RK(rk('fthI')) : rk('fthI'))], ['پورت FTTH دایر', F.i(p.fthA), RK(rk('fthA'))], ['نسبت دایر به منصوبه FTTH', F.p(p.fthU), RK(rk('fthU'))], ['XDSL دایر', F.i(p.xA), RK(rk('xA'))], ['TD-LTE دایر', F.i(p.lteA), RK(rk('lteA'))], ['پهن‌باند ثابت دایر', F.i(p.bb), RK(rk('bb'))], ['سهم فیبر از ثابت', F.p(p.fibShare), RK(rk('fibShare'))], ['تلفن ثابت دایر', F.i(p.telA), RK(rk('telA'))]])}<p>${insight}${p.flag && p.flag !== 'بدون فیبر در فایل' ? ` <b>هشدار داده:</b> ${esc(p.flag)}.` : ''}</p>${src('فایل Port شرکت‌های FCP/UNSP، شهریور ۱۴۰۵؛ مخابرات ایران و کل بازار را نمی‌پوشاند؛ آمار ملی یا رسمی استانی نیست')}${goBtn('provinces', 'باز کردن روی نقشه')}`, act: () => { STATE.prov = p.iso; }, ctx: {kind: 'prov', ent: p.iso}};
  };
  H.provCmp = (ps) => ({h: `مقایسه ${ps.map((p) => p.n).join(' و ')}`, b: `${tbl(['شاخص', ...ps.map((p) => esc(p.n))], [['FTTH منصوبه', ...ps.map((p) => F.i(p.fthI))], ['FTTH دایر', ...ps.map((p) => F.i(p.fthA))], ['دایر/منصوبه FTTH', ...ps.map((p) => F.p(p.fthU))], ['XDSL دایر', ...ps.map((p) => F.i(p.xA))], ['TD-LTE دایر', ...ps.map((p) => F.i(p.lteA))], ['پهن‌باند ثابت', ...ps.map((p) => F.i(p.bb))], ['سهم فیبر', ...ps.map((p) => F.p(p.fibShare))]])}${src('فایل Port FCP/UNSP، شهریور ۱۴۰۵')}${goBtn('provinces')}`});
  H.rank = (q) => {
    const k = provMetric(q), m = PROV_METRICS[k] || {n: 'دایر/منصوبه XDSL', f: (v) => F.p(v)};
    const low = has(q, 'کمترین', 'پایین', 'بدترین', 'ضعیف');
    const r = M.prov.filter((p) => p[k] != null && (k !== 'fthU' || p.fthI > 1000)).sort((a, b) => (low ? a[k] - b[k] : b[k] - a[k])).slice(0, 7);
    return {h: `${low ? 'کمترین' : 'بیشترین'} ${m.n} در استان‌ها`, b: `${tbl(['رتبه', 'استان', m.n], r.map((p, i) => [F.i(i + 1), esc(p.n), m.f(p[k])]))}${k === 'fthU' ? '<p>استان‌هایی که کمتر از هزار پورت منصوبه دارند کنار گذاشته شدند تا نسبت‌های ناپایدار رتبه را به هم نریزند.</p>' : ''}${src('فایل Port FCP/UNSP، شهریور ۱۴۰۵')}${goBtn('provinces')}`, act: () => { if (PROV_METRICS[k]) STATE.pvMap = k; }};
  };
  const OPM = [['coverage4g', 'پوشش 4G', F.p, ['پوشش', 'coverage']], ['sites5g', 'سایت 5G', F.i, ['5g', 'نسل پنج']], ['sites4g', 'سایت 4G', F.i, ['سایت']], ['ping4g', 'سرعت دانلود 4G (Mbps)', F.n, ['سرعت', 'دانلود', 'speed']], ['drop4g', 'قطعی داده 4G', (v) => F.p(v, 2), ['قطعی', 'drop']], ['success4g', 'برقراری موفق 4G', F.p, ['موفق', 'برقراری']], ['active', 'خطوط فعال', F.i, ['مشترک', 'خط', 'بازار']], ['villages', 'روستای تحت پوشش', F.i, ['روستا']], ['roadKm', 'جاده تحت پوشش (km)', F.i, ['جاده']], ['m2m', 'اشتراک M2M', F.i, ['m2m', 'iot']], ['roamingCountries', 'کشور رومینگ', F.i, ['رومینگ']]];
  H.ops = (q) => {
    const sel = OPM.filter((m) => m[3].some((w) => q.includes(norm(w))));
    const ms = sel.length ? sel : OPM.slice(0, 8);
    const rows = ms.map(([k, n, f]) => [n, ...M.ops.map((o) => f(o[k]))]);
    rows.unshift(['سهم پهن‌باند سیار', ...M.ops.map((o) => F.p(M.mob.share[o.name]))]);
    const best = ms[0] ? M.ops.reduce((a, b) => ((ms[0][0] === 'drop4g' ? b[ms[0][0]] < a[ms[0][0]] : b[ms[0][0]] > a[ms[0][0]]) ? b : a)) : null;
    return {h: 'مقایسه اپراتورها', b: `${tbl(['شاخص', ...M.ops.map((o) => `<span style="color:${C.op[o.name]}">${o.name}</span>`)], rows)}${best ? `<p>در «${ms[0][1]}» ${best.name} جلوتر است. رایتل ${F.p(M.ops[2].coverage4g)} پوشش جمعیتی 4G و ${F.i(M.ops[2].sites5g)} سایت 5G دارد. این مقادیر را اپراتورها به رگولاتوری گزارش کرده‌اند و تجربه کاربر را مستقیم نمی‌سنجند.</p>` : ''}${src('فصلنامه ۵۷، صفحات ۱۰، ۲۴ تا ۲۷، بهار ۱۴۰۵')}${goBtn('mobile')}`};
  };
  H.plat = (ks) => {
    const ps = ks.length ? M.plat.filter((p) => ks.includes(p.k)) : M.plat;
    return {h: ks.length === 1 ? `نیم‌رخ ${ps[0].n}` : 'مقایسه سکوهای داخلی', b: `${tbl(['شاخص', ...ps.map((p) => `<span style="color:${C.plat[p.k]}">${p.n}</span>`)], [['محتوا (میلیون)', ...ps.map((p) => F.n(p.content))], ['کانال فعال (هزار)', ...ps.map((p) => F.n(p.channels))], ['بازدید (میلیارد)', ...ps.map((p) => (p.views != null ? F.n(p.views) : '—'))], ['سهم محتوا', ...ps.map((p) => F.p(p.cShare))], ['سهم بازدید', ...ps.map((p) => (p.vShare != null ? F.p(p.vShare) : '—'))], ['بازدید هر محتوا', ...ps.map((p) => (p.vpc ? F.i(p.vpc) : '—'))], ['سهم خبر از محتوا', ...ps.map((p) => (p.news != null ? F.p(p.news) : '—'))]])}<p>طبق آمار ناشر، ${ps.map((p) => esc(p.n) + ': سهم محتوا ' + F.p(p.cShare) + (p.vShare != null ? ' و سهم بازدید ' + F.p(p.vShare) : '؛ شاخص بازدید هم‌سنخ ندارد')).join('؛ ')}. تعریف «بازدید» میان سکوها یکسان‌سازی نشده و «ضریب نفوذ» ویراستی با بازدید جمع نمی‌شود.</p>${src('متن گزارش شش‌ماهه مرکز ملی فضای مجازی (ارائه‌شده توسط کاربر، تأیید نشده)')}${goBtn('platforms')}`};
  };
  H.traffic = () => ({h: 'ترافیک داده تابستان ۱۴۰۵', b: `${tbl(['شبکه', 'داخلی (EB)', 'بین‌الملل (EB)', 'سهم بین‌الملل'], [['اینترنت ثابت', M.traffic.fix], ...M.traffic.ops.map((o) => [o.o, o])].map(([n, o]) => [n, F.n(r1(o.domestic / 1e9)), F.n(r1(o.international / 1e9)), F.p(o.international / (o.domestic + o.international) * 100)]))}<p>در کاربرگ پایش، ${F.p(M.traffic.intlShare)} ترافیک به مقصد خارجی ثبت شده است. این سهم به‌تنهایی برای داوری درباره تحقق شبکه ملی اطلاعات کافی نیست؛ هدف مصوب و تعریف سنجه باید جداگانه ثبت شوند. مصرف ماهانه تقریبی: ${F.i(M.traffic.gbFix)} گیگابایت برای هر مشترک ثابت و ${F.i(M.traffic.gbMob)} گیگابایت برای هر مشترک سیار.</p>${src('کاربرگ «Monitoring سه ماهه دوم ۱۴۰۵» (ارسالی، تأیید مستقل نشده)')}${goBtn('quality')}`});
  H.latency = () => ({h: 'تأخیر و کیفیت شبکه', b: `${tbl(['مسیر', 'RTT ثابت', 'RTT سیار', 'Jitter ثابت', 'Jitter سیار'], [['داخلی', F.n(M.lat.fd), F.n(M.lat.md), F.n(M.lat.jfd), F.n(M.lat.jmd)], ['بین‌الملل', F.n(M.lat.fi), F.n(M.lat.mi), F.n(M.lat.jfi), F.n(M.lat.jmi)]])}<p>اختلاف RTT بین‌الملل و داخلی در شبکه ثابت ${F.n(r1(M.lat.fi - M.lat.fd))} و در سیار ${F.n(r1(M.lat.mi - M.lat.md))} میلی‌ثانیه است (هم‌شبکه مقایسه شده؛ سیار بین‌الملل با ثابت داخلی مقایسه نمی‌شود چون اثر مسیر و فناوری از هم جدا نمی‌شود). سرعت دانلود 4G در فصلنامه بهار: همراه اول ${F.n(M.ops[0].ping4g)}، ایرانسل ${F.n(M.ops[1].ping4g)}، رایتل ${F.n(M.ops[2].ping4g)} مگابیت. RTT ستون فقرات TIC در ۹ فصل ${F.sp(M.ticChg)} تغییر کرده (پژوهشی).</p>${src('فصلنامه ۵۷ صفحات ۱۴ و ۲۷؛ داده TIC پژوهشی')}${goBtn('quality')}`});
  H.fixed = () => ({h: 'وضعیت اینترنت ثابت و فیبر', b: `${tbl(['فناوری', 'بهار ۱۴۰۴', 'بهار ۱۴۰۵', 'تغییر'], M.fixed.techs.map((t) => [t.k, F.i(t.from), F.i(t.to), F.sp(t.pct)]).concat([['کل', F.i(M.fixed.first.t), F.i(M.fixed.last.t), F.sp(M.fixed.totalPct)]]))}<p><b>منبع می‌گوید:</b> خانوار تحت پوشش فیبر ${F.big(M.fiber.hh)} و اشتراک FTTx ${F.big(M.fiber.subs)} است (فصلنامه ۵۷، کل کشور). <b>محاسبه رادار:</b> افزایش خالص FTTx ${OFFSET_TXT()} کاهش خالص XDSL بود (نسبت حسابی دو تفاضل، نه سهم مهاجرت) و نسبت توصیفی اشتراک به خانوار تحت پوشش ${F.p(M.fiber.takeup)} است؛ این نسبت نرخ تبدیل نیست، چون صورت و مخرج هم‌جامعه نیستند. در فایل پورت FCP/UNSP (نه کل کشور) ${F.p(M.provT.fthU)} پورت‌های FTTH دایر ثبت شده و در فایل سرعت ارسالی ${F.p(M.speed.xLe10)} سرویس‌های XDSL سرعت اسمی حداکثر ۱۰ مگابیت دارند. این داده‌ها نشان نمی‌دهند مشترکان XDSL به فیبر رفته‌اند؛ برای آن داده جریان مشترک لازم است.</p>${src('فصلنامه ۵۷ صفحات ۳، ۴، ۲۲ و ۲۳؛ فایل‌های Port و Speed شهریور ۱۴۰۵')}${goBtn('fixed')}`});
  H.mobile = () => ({h: 'روند پهن‌باند سیار', b: `${tbl(['اپراتور', 'اشتراک بهار ۱۴۰۵', 'سهم', 'رشد سالانه', 'رشد از ۱۳۹۹'], M.mob.ops.map((o, i) => [o, F.big(M.mob.values[M.mob.values.length - 1][i]), F.p(M.mob.share[o]), F.sp(M.mob.opYoY[o]), F.sp(M.mob.since[o], 0)]))}<p>کل پهن‌باند سیار ${F.big(M.mob.total)} با رشد ${F.sp(M.mob.yoy)} (فصلنامه ۵۷، کل کشور). سهم 5G از اشتراک‌ها ${F.p(M.gen.g5 / M.gen.t * 100)} است.</p>${src('فصلنامه ۵۷ صفحات ۳ و ۲۵')}${goBtn('mobile')}`});
  H.why = () => ({h: 'سازوکارهای احتمالی نارضایتی', b: `<ul>${D.bridge.map((b) => `<li><b>${esc(b.mechanism_id)} · ${esc(b.title)} (${esc(b.priority)}):</b> ${esc(b.proposed_action)}</li>`).join('')}</ul><p>این‌ها فرضیه‌های پژوهشی‌اند و شواهد کاربر و فنی در اغلب‌شان هم‌دوره نیستند؛ پس نمی‌توان رابطه علّی قطعی نتیجه گرفت. شواهد کاربر: ${D.survey.map((s) => `${esc(s.title)} ${F.p(s.value)}`).join('، ')}.</p>${src('S01→S02 decision bridge؛ پیمایش ملت ۲۱۹۲۱؛ بدون پذیرش Q5')}${goBtn('decision')}`});
  const score = (q, text) => { const ws = q.split(' ').filter((w) => w.length > 2 && !STOP.has(w)); const t = norm(text); return ws.reduce((s, w) => s + (t.includes(w) ? (w.length > 3 ? 2 : 1) : 0), 0); };
  H.search = (q) => {
    const r = REC.list.filter((d) => d.coll !== 'src').map((d) => ({d, s: score(q.split(' ').filter((w) => !STOP.has(w) && !ASKW.has(w)).join(' '), [d.t, d.id, d.src, (DOM[d.dom] || {}).n, d.sub].join(' '))})).filter((x) => x.s >= 2).sort((a, b) => b.s - a.s || (a.d.coll === 'off' ? -1 : 1)).slice(0, 8);
    if (!r.length) return {h: 'داده‌ای برای پاسخ این پرسش ندارم', b: `<p>در ${F.i(REC.list.length)} رکورد داشبورد شاهدی برای این پرسش پیدا نشد و عددی برآورد یا ساخته نمی‌شود. اگر نسخه متصل با اجازه جست‌وجوی وب فعال باشد، می‌توانم منابع عمومی را بررسی کنم و پاسخ را با پیوند و تاریخ بدهم. می‌توانید درباره استان‌ها، اپراتورها، فیبر، ترافیک، تأخیر، سکوها، مراکز داده، ابر، IXP، نامزدهای پژوهشی، تعارض‌ها یا هفت حوزه بپرسید.</p>`};
    return {h: 'نزدیک‌ترین رکوردها به پرسش شما', b: `<p class="mut">پاسخ مستقیم نیست؛ این‌ها رکوردهایی‌اند که واژه‌های پرسش در آن‌ها آمده. نوع شاهد و پذیرش هر رکورد را در شناسنامه ببینید.</p>${tbl(['رکورد', 'مقدار', 'مجموعه', 'منبع'], r.map(({d}) => [`<a href="#" data-rk="${esc(d.k)}" style="color:var(--fg)">${esc(String(d.t).slice(0, 70))}</a>`, (d.v == null ? '—' : typeof d.v === 'number' ? F.n(d.v) : esc(String(d.v).slice(0, 30))) + ' ' + esc(d.u || ''), esc((COLL[d.coll] || {}).n), esc(String(d.src).slice(0, 50))]))}<p>روی هر رکورد بزنید تا شناسنامه و محدودیتش باز شود. رکوردهای غیررسمی تأیید Q5 ندارند و نباید با شاخص رسمی جمع شوند.</p>${goBtn('explorer', 'دیدن همه در کاوشگر')}`, act: () => { STATE.tbl.ex = {q: q.split(' ').filter((w) => w.length > 2)[0] || '', p: 1}; }};
  };
  H.infra = (q) => {
    const ix = /ixp|تبادل|peering/.test(q), cl = /ابر|آروان|arvan|cloud|قیمت|همراوش|سرور/.test(q);
    const L = D.infra.filter((r) => (ix ? r.sec === 't06' : cl ? r.sec === 't09' : r.sec === 't08'));
    const pr = D.infra.filter((r) => r.sec === 't09' && typeof r.v === 'number').map((r) => r.v).sort((a, b) => a - b);
    const note = ix ? 'سه شبکه و سه اتصال فهرست‌شده در PeeringDB تعداد اعضای واقعی نیست و «60G» برچسب دایرکتوری است؛ عدد تاریخی ۳۴٬۲۰۰ گیگابیت تا روشن شدن منبع کنار گذاشته شده و این دو نسبت گرفته نمی‌شوند.' : cl ? `${F.i(pr.length)} بسته آروان از ${F.i(pr[0])} تا ${F.i(pr[pr.length - 1])} تومان در ماه (ثبت ۵ آبان ۱۴۰۵). این قیمت صفحه محصول است، نه پیشنهاد فروش؛ منطقه، مالیات و سهمیه ترافیک تثبیت نشده‌اند.` : 'ظرفیت‌های ۲٬۰۰۰، ۴۰۷، ۹۸۲ و ۲۰۰ رک از چهار جنس متفاوت‌اند (اعلامی، افتتاح تاریخی، طراحی دو فاز، گزارش تاریخی) و جمع آن‌ها ظرفیت کشور نیست.';
    return {h: ix ? 'مراکز تبادل ترافیک (IXP)' : cl ? 'خدمات و قیمت ابر' : 'مراکز داده', b: `${tbl(['شناسه', 'سنجه', 'مقدار', 'وضعیت'], L.slice(0, 12).map((r) => [`<span class="mono">${esc(r.id)}</span>`, esc(r.l), (typeof r.v === 'number' ? F.n(r.v) : esc(r.v ?? '—')) + ' ' + esc(r.u || ''), `<small>${CODE(r.st)}</small>`]))}<p>${note}</p>${src('رکوردهای T06، T08 و T09 پژوهش ساختاریافته؛ بازیابی ۵ آبان ۱۴۰۵؛ پذیرش عمومی ندارند')}${goBtn('infra')}`};
  };
  H.registry = (q) => {
    if (/تعارض|conflict|اختلاف منابع/.test(q)) return {h: 'تعارض‌های ثبت‌شده', b: `${tbl(['شناسه', 'موضوع', 'دو منبع', 'وضعیت'], D.reg.conflicts.map((c) => [esc(c.conflict_id), esc(c.topic), esc(c.source_a + ' ↔ ' + c.source_b), CODE(c.resolution_status)]))}<p>مثال: نرخ استفاده VPN در ملت ۶۴٫۷٪ و در ایسپا ۸۳٪ نقل شده؛ احتمالاً مخرج و پرسش متفاوت دارند و تا یکسان‌سازی، نتیجه‌گیری نمی‌شود.</p>${goBtn('registry')}`};
    if (/شکاف|درخواست داده|نداریم|غایب/.test(q)) return {h: 'شکاف‌ها و درخواست‌های داده', b: `<ul>${DOM_ORDER.filter((d) => DOM_GAP[d]).map((d) => `<li><b>${DOM[d].n}:</b> ${esc(DOM_GAP[d].need)}</li>`).join('')}</ul>${tbl(['درخواست', 'داده لازم', 'اولویت'], D.reg.gaps.map((g) => [esc(g.request_id), esc(g.required_dataset), esc(g.priority)]))}${goBtn('domains')}`};
    const sub = /شناختیک|shenakhtic/.test(q) ? /شناختیک/ : /داده.?کاوی|dataak/.test(q) ? /داده‌کاوی/ : /فیلتر.?واچ|filterwatch/.test(q) ? /Filterwatch/ : null;
    const L = REC.list.filter((r) => r.coll === 'cand' && (!sub || sub.test(r.sub)));
    return {h: 'نامزدهای پژوهشی' + (sub ? '' : ' (همه)'), b: `${tbl(['شناسه', 'شرح', 'مقدار', 'محدودیت'], L.slice(0, 10).map((r) => [`<a href="#" data-rk="${esc(r.k)}" class="mono" style="color:var(--fg)">${esc(r.id)}</a>`, esc(String(r.t).slice(0, 60)), esc(String(r.v ?? '—')) + ' ' + esc(r.u || ''), `<small>${esc(String((r.lim || [])[0] || '').slice(0, 80))}</small>`]))}<p>${F.i(L.length)} نامزد؛ هیچ‌کدام مجوز KPI رسمی ندارند. در شناختیک «۶۱» امتیاز شاخص ریسک است، نه درصد افراد؛ پیش‌بینی ۵۲٪ مدل هم مشاهده تاریخی نیست.</p>${goBtn('registry')}`};
  };
  H.domain = (q) => {
    const d = Object.keys(DOM).find((k) => q.includes(norm(DOM[k].n)) || (k === 'security' && q.includes('امنیت')) || (k === 'governance' && q.includes('حکمرانی')) || (k === 'applications' && q.includes('کاربردی')));
    const rows = DOM_ORDER.map((k) => { const L = REC.list.filter((r) => r.dom === k && r.coll !== 'src'); return [DOM[k].n, F.i(L.length), F.i(L.filter((r) => r.coll === 'off').length), esc(DOM_GAP[k].need)]; });
    return {h: d ? `حوزه ${DOM[d].n}` : 'پوشش هفت حوزه', b: `${tbl(['حوزه', 'رکورد', 'رسمی', 'شکاف اصلی'], d ? rows.filter((r) => r[0] === DOM[d].n) : rows)}<p>بیشترین داده رسمی در زیرساخت ارتباطی است. امنیت، حکمرانی و خدمات کاربردی هنوز کارنامه عملیاتی ندارند و داده‌شان عمدتاً پژوهشی است.</p>${src('domain-registry مخزن؛ گزارش داده‌های غایب ۶ آبان ۱۴۰۵')}${goBtn('domains')}`, act: () => { if (d) STATE.exDom = d; }};
  };
  /* «گزارش … بساز»: the request goes to the report studio prefilled, with the plan the studio would read from it */
  const isReportReq = (q) => /گزارش|کارنامه|پاورپوینت|اسلاید|ارائه/.test(q) && /بساز|بسازی|تهیه|بنویس|درست کن|آماده کن|ساخت|خروجی|تولید|(^| )ورد( |$)|word|pptx|pdf|پی ?دی ?اف|پاورپوینت|اسلاید/.test(q) && !/گزارش ?ساز چیه|گزارش ?ساز چیست|چه گزارش/.test(q);
  const REPORTQ = (q, raw) => {
    if (!isReportReq(q) || typeof RPT === 'undefined') return null;
    const p = RPT.parse(String(raw)), t = RPT.autoTitle(p);
    return {h: 'گزارش‌ساز', b: `<p>این درخواست گزارش است و در گزارش‌ساز ساخته می‌شود. برداشت رادار: ${esc(RPT.TPL[p.tpl].n)} برای ${esc(RPT.AUD[p.aud])}، ${esc(RPT.LEN[p.len])}، خروجی ${esc(RPT.FMT[p.fmt])}؛ موضوع‌ها: ${esc(p.topics.map((k) => RPT.TOPICS[k].n).join('، '))}. عنوان پیشنهادی: «${esc(t)}».</p><p>در گزارش‌ساز می‌توانید پیش از ساخت هر کدام را تغییر دهید. همه عددها از داده همین داشبورد و با منبع می‌آیند.</p>${goBtn('report', 'باز کردن در گزارش‌ساز')}`, act: () => { STATE.rptQ = String(raw).trim().slice(0, 1990); }};
  };
  const isFollowAnalysis = (q) => /^(من )?(تحلیل|تحلیلش|توضیح|توضیحش)( ?می ?خواهم| ?می ?خوام| بده| کن| بیشتر| کامل| دقیق| عمیق| حرفه ای| مفصل|ش کن|ش را بده| را بده| لطفا)*$/.test(q) || /^(بیشتر توضیح بده|کامل ?تر بگو|ادامه بده|بیشتر بگو|عمیق ?تر)$/.test(q);
  const route = (raw, ctx) => {
    let q = norm(raw);
    if (!q) return null;
    // follow-up asking for (more) analysis keeps the previous topic instead of searching the word «تحلیل»
    if (isFollowAnalysis(q)) {
      if (ctx && ctx.kind === 'ninTrend') return NIN_TREND();
      if (ctx && ctx.lastQuestion) q = norm(ctx.lastQuestion) + ' تحلیل';
      else return {h: 'موضوع تحلیل را مشخص کنید', b: '<p>موضوع قبلی در این گفت‌وگو نیست. مثلاً بنویسید «روند توسعه شبکه ملی اطلاعات را تحلیل کن» یا «کیفیت اپراتورها را مقایسه کن».</p>'};
    }
    const cq = CHGQ.match(q); if (cq) return cq;
    const rq = REPORTQ(q, raw); if (rq) return rq;
    if (/شبکه ملی|(^| )nin( |$)/.test(q) && /روند|رشد|توسعه|تحلیل|صعود|نزول|مسیر/.test(q) && !/(?<!\d)140[4-9](?!\d)|هدف \d|شاخص \d|متولی|حوزه|افت|کاهش|بهبود|ضعیف|بهترین/.test(q) && (q.match(/(?<!\d)140\d(?!\d)/g) || []).length !== 1) return NIN_TREND();
    const guide = GUIDE.route(q, ctx || {}, {concepts: false}); // sections and panels first; definitions only if no analyst answers
    if (guide) return guide;
    if (/سایبری|هک|هکر|نفوذ|بدافزار|گنجشک|باج ?افزار|ddos|دیداس|حمله به (بانک|جایگاه|صرافی|راه ?آهن)|نوبیتکس|بانک سپه/.test(q)) return CYBERQ(q);
    const v4 = V4Q(q, raw, ctx || {});
    if (v4) return v4;
    const concept = GUIDE.route(q, ctx || {}, {concepts: true});
    if (concept) return concept;
    if (/^(سلام|درود|hi|hello)/.test(q) || has(q, 'چه کار', 'کمک', 'راهنما', 'چی بپرسم')) return {h: 'دستیار تحلیلی رادار', b: `<p>به همه ${F.i(REC.list.length)} رکورد داشبورد دسترسی دارم: شاخص‌های رسمی، شواهد و نامزدهای پژوهشی، سکوها، مراکز داده، ابر و IXP، ۳۱ استان، سه اپراتور، ترافیک، کیفیت و هفت حوزه. می‌توانم مقایسه، رتبه‌بندی، روند و خلاصه بدهم و برای هر عدد منبعش را بگویم.</p><ul><li>«اصفهان و فارس را مقایسه کن»</li><li>«کدام استان کمترین نسبت پورت دایر به منصوبه فیبر را دارد؟»</li><li>«سرعت 4G اپراتورها»</li><li>«چرا مردم ناراضی‌اند؟»</li></ul>`};
    if (/(^| )ابر( |ی|$)/.test(q) || has(q, 'مرکز داده', 'مراکز داده', 'دیتاسنتر', 'آروان', 'arvan', 'cloud', 'ixp', 'تبادل ترافیک', 'همراوش', 'زیرساخت اطلاعاتی')) return H.infra(q);
    if (has(q, 'تعارض', 'نامزد', 'شناختیک', 'داده کاوی', 'داده‌کاوی', 'فیلترواچ', 'filterwatch', 'شکاف', 'درخواست داده', 'غایب', 'کاتالوگ منابع')) return H.registry(q);
    if (has(q, 'هفت حوزه', 'حوزه', 'امنیت', 'حکمرانی', 'خدمات کاربردی', 'خدمات پایه')) return H.domain(q);
    if (has(q, 'خلاصه', 'وضعیت کلی', 'گزارش مدیریتی', 'مهم‌ترین', 'مهمترین', 'برجسته', 'هشدار', 'brief')) return H.brief();
    const ps = findProvs(q);
    if (ps.length >= 2) return H.provCmp(ps.slice(0, 4));
    if (has(q, 'کدام استان', 'استان‌ها', 'استانها', 'رتبه', 'بیشترین', 'کمترین', 'بهترین استان', 'بدترین استان') && !findOps(q).length && !findPlats(q).length && !has(q, '4g', '5g', '3g', '2g', 'سایت', 'پوشش جمعیتی', 'رومینگ', 'm2m', 'اپراتور')) return H.rank(q);
    if (ps.length === 1) return H.prov(ps[0]);
    const pl = findPlats(q);
    if (pl.length || has(q, 'سکو', 'پیام رسان', 'پیامرسان', 'بازدید', 'محتوا')) return H.plat(pl);
    if (findOps(q).length || has(q, 'اپراتور', '5g', '4g', 'سایت', 'پوشش جمعیتی', 'رومینگ', 'm2m')) return H.ops(q);
    if (has(q, 'ترافیک', 'بین الملل', 'بین‌الملل', 'خارجی', 'داخلی سازی', 'مصرف داده', 'گیگ')) return H.traffic();
    if (has(q, 'تاخیر', 'تأخیر', 'پینگ', 'ping', 'rtt', 'jitter', 'کیفیت', 'سرعت', 'tic')) return H.latency();
    if (has(q, 'چرا', 'علت', 'دلیل', 'نارضایتی', 'ناراضی', 'پیشنهاد', 'اقدام', 'راهکار', 'سیاست')) return H.why();
    if (has(q, 'فیبر', 'ثابت', 'xdsl', 'adsl', 'ftth', 'fttx', 'پورت', 'پوشش خانوار')) return H.fixed();
    if (has(q, 'سیار', 'موبایل', 'همراه', 'پهن باند سیار', 'نسل')) return H.mobile();
    return H.search(q);
  };
  return {route, isFollowAnalysis, isReportReq, norm, H, has, findProvs, findOps, findPlats, tbl, src, goBtn, STOP};
})();

/* only http(s) links are ever rendered as hrefs (blocks javascript:, data:, vbscript: …) */
const SAFEURL = (u) => /^https?:\/\/[^\s"'<>]+$/i.test(String(u || ''));
/* ---------- v4 offline analytical handlers (evidence-typed, no invented numbers) ---------- */
const WHYQ = (q) => {
  if (!/(^| )(چرا|علت|دلیل)( |$)/.test(q)) return null;
  const {has, tbl, src, goBtn, H} = AI;
  const lab = (t) => `<b class="lab">${t}:</b> `;
  const frame = (title, says, calc, hyp, need, go) => ({h: title, b: `${says ? `<p>${lab('منبع می‌گوید')}${says}</p>` : ''}${calc ? `<p>${lab('محاسبه رادار')}${calc}</p>` : ''}<p>${lab('استنباط دستیار')}داده‌های رادار علت را مستقیم نشان نمی‌دهند. ${hyp.length ? 'توضیح‌های ممکن، که هیچ‌کدام با این داده‌ها آزموده نشده‌اند: ' + hyp.join('؛ ') + '.' : ''}</p><p><b>برای آزمودن علت لازم است:</b> ${need}</p>${go ? goBtn(go) : ''}`});
  if (has(q, 'ترافیک', 'خارجی', 'بین الملل', 'بین‌الملل')) return frame('چرا سهم ترافیک خارجی بالاست؟', `${F.p(M.traffic.intlShare)} ترافیک داده تابستان ۱۴۰۵ به مقصد خارجی رفته؛ در سیار ${F.p(M.traffic.mobIntl)} و در ثابت ${F.p(M.traffic.fixIntl)} (کاربرگ پایش، تأیید مستقل نشده).`, '', ['ترکیب مصرف (ویدئو، به‌روزرسانی نرم‌افزار و خدمات ابری خارجی پرحجم است)', 'نبود یا کمبود نسخه داخلی یا CDN داخلی برای خدمات پرمصرف', 'ترافیک فیلترشکن که مقصد واقعی را پنهان می‌کند و تفکیکش در داده نیست'], 'تفکیک ترافیک بین‌الملل بر حسب نوع خدمت و مقصد، سهم CDN و کش داخلی، و سهم ترافیک رمزشده تونلی در همان دوره.', 'quality');
  if (has(q, 'قیمت', 'هزینه', 'گران', 'تعرفه')) { const p3 = D.evidence.find((e) => e.id === 'EV-P01-003'), itu = D.evidence.find((e) => e.id === 'ITU-PRICE-5GB'); return frame('چرا قیمت یا هزینه بالا ارزیابی می‌شود؟', `${p3 ? `${F.p(p3.v)} پاسخ‌دهندگان پیمایش ملت از قیمت بسته موبایل رضایت کم یا هیچ رضایتی ندارند (${esc(p3.p)}؛ ${esc(p3.lim)}).` : ''} ${itu ? `هزینه سبد داده همراه ۵ گیگابایت ${F.p(itu.v)} درآمد ناخالص سرانه ماهانه است (ITU، ${esc(itu.p)}؛ ${esc(itu.lim)}).` : ''}`, '', ['فاصله قیمت و قدرت خرید پس از تورم', 'هزینه دور زدن محدودیت‌ها (فیلترشکن) که به هزینه مؤثر اضافه می‌شود', 'نارضایتی از کیفیت که خود را در داوری قیمت نشان می‌دهد'], 'هزینه مؤثر ماهانه خانوار به تفکیک دهک، تعرفه مصوب و تغییر آن، هزینه فیلترشکن و کیفیت تجربه‌شده در همان دوره.', 'research'); }
  if (has(q, 'سرعت', 'کند', 'کیفیت', 'تاخیر', 'تأخیر', 'قطع')) return frame('چرا کیفیت یا سرعت پایین ارزیابی می‌شود؟', `RTT بین‌الملل سیار ${F.n(M.lat.mi)} و ثابت ${F.n(M.lat.fi)} میلی‌ثانیه؛ داخلی سیار ${F.n(M.lat.md)} و ثابت ${F.n(M.lat.fd)} (فصلنامه ۵۷، بهار ۱۴۰۵).`, `اختلاف بین‌الملل و داخلی در ثابت ${F.n(r1(M.lat.fi - M.lat.fd))} و در سیار ${F.n(r1(M.lat.mi - M.lat.md))} میلی‌ثانیه است. در فایل سرعت ارسالی ${F.p(M.speed.xLe10)} سرویس‌های XDSL سرعت اسمی حداکثر ۱۰ مگابیت دارند.`, ['مسیر و ظرفیت بین‌الملل', 'فناوری دسترسی قدیمی (XDSL) در بخشی از شبکه ثابت', 'اختلال و محدودسازی که در این شاخص‌های میانگین دیده نمی‌شود'], 'اندازه‌گیری مستقل و هم‌دوره کاربر (سرعت، تأخیر، اتلاف بسته در ساعت اوج) به تفکیک اپراتور، فناوری و مقصد داخلی و خارجی.', 'quality');
  if (has(q, 'فیبر', 'xdsl', 'adsl', 'ثابت')) return {...V4H.migration(), h: 'چرا پهن‌باند ثابت کوچک شده؟'};
  if (has(q, 'ناراضی', 'نارضایتی', 'رضایت')) return H.why();
  return null;
};
const V4Q = (q, raw, ctx) => {
  if (typeof NINQ === 'function') { const nq = NINQ(q, raw, ctx); if (nq) return nq; }
  { const wq = WHYQ(q); if (wq) return wq; }
  const {has, findProvs, findOps, findPlats, tbl, src, goBtn, H} = AI;
  const rk = (r) => `<a href="#" data-rk="${esc(r.k)}" class="mono" style="color:var(--ice)">${esc(r.k)}</a>`;
  const lab = (t) => `<b class="lab">${t}:</b> `;
  const SAYS = lab('منبع می‌گوید'), CALC = lab('محاسبه رادار'), INFER = lab('استنباط دستیار');
  const kp = (id) => REC.byId['off:' + id];
  const ps = findProvs(q), ops = findOps(q), pls = findPlats(q);

  // follow-up: «همین … برای …»
  if (/^(همین|همان|برای|حالا|و) /.test(q) || has(q, 'همین تحلیل', 'همین را', 'همان را', 'اپراتور دیگر', 'استان دیگر', 'سکوی دیگر')) {
    if (ctx.kind === 'op' || has(q, 'اپراتور')) {
      const prev = ctx.kind === 'op' ? ctx.ent : null;
      const targets = ops.length ? ops : M.ops.map((o) => o.name).filter((n) => n !== prev);
      if (!targets.length) return null;
      const out = targets.map((n) => V4H.op(n));
      return {h: `همان تحلیل برای ${targets.join(' و ')}`, b: (prev ? `<p class="mut">تحلیل قبلی برای ${esc(prev)} بود؛ همان سنجه‌ها با همان دوره و منبع برای ${targets.map(esc).join(' و ')} آمده است.</p>` : '') + out.map((o) => `<h6>${esc(o.h)}</h6>${o.b}`).join(''), ctx: {kind: 'op', ent: targets[0]}};
    }
    if (ctx.kind === 'prov' && ps.length) { const r = H.prov(ps[0]); r.h = 'همان تحلیل برای ' + ps[0].n; return r; }
    if (ctx.kind === 'provHave' && ps.length) return V4H.provHave(ps[0]);
    if (ctx.kind === 'plat' && pls.length) return V4H.platRatio(pls[0]);
    if (ctx.kind && !ps.length && !ops.length && !pls.length && q.split(' ').length <= 4) return {h: 'برای کدام مورد؟', b: '<p>پرسش پیگیری را با نام استان، اپراتور یا سکوی موردنظر بنویسید؛ مثلاً «همین را برای ایرانسل».</p>'};
  }
  if (ps.length === 1 && has(q, 'چه داده', 'داریم', 'نداریم', 'موجود', 'شکاف داده')) return V4H.provHave(ps[0]);
  if (ps.length >= 2 && has(q, 'دوره', 'دامنه', 'یکسان', 'مقایسه')) return V4H.provSame(ps.slice(0, 4));
  if (has(q, 'تفاوت', 'فرق') && has(q, 'پوشش', 'پورت', 'اشتراک')) return V4H.fiberDefs();
  if (has(q, 'xdsl', 'adsl') && has(q, 'مهاجرت', 'ثابت می', 'اثبات', 'جابه', 'رفته')) return V4H.migration();
  if (pls.length === 1 && has(q, 'چرا', 'بالا', 'زیاد', 'نسبت')) return V4H.platRatio(pls[0]);
  if (has(q, 'شناختیک') && (/(^| )61( |$)/.test(q) || has(q, 'درصد'))) return V4H.shn61();
  if (has(q, 'مرکز داده', 'مراکز داده', 'دیتاسنتر') && has(q, 'خالی', 'ظرفیت', 'اشغال')) return V4H.dcCap();
  if (has(q, 'ابر', 'cloud', 'سرور مجازی') && has(q, 'هزینه', 'قیمت', 'هم ارز', 'هم‌ارز', 'نامعلوم')) return V4H.cloudCost();
  if (has(q, 'اختلال', 'قطعی', 'outage', 'خاموشی') && has(q, 'الان', 'اکنون', 'هم اکنون', 'شواهد', 'آخرین', 'دریافت')) return V4H.outageNow();
  if (has(q, 'آروان', 'arvan') && has(q, 'ioda', 'آیودا')) return V4H.conflictMethod();
  if (has(q, 'پیمایش مشترک', 'یک پیمایش', 'نقل کرده', 'بازنشر', 'مستقل') && has(q, 'منابع', 'منبع', 'پیمایش')) return V4H.families();
  if (has(q, 'اقدام', 'راهکار') && has(q, 'مردم', 'تجربه', 'کاربر')) return V4H.actions();
  if (has(q, 'وب', 'اینترنت را جست', 'جستجو کن', 'جست‌وجو کن', 'سرچ')) return V4H.webOffline(raw);
  if (has(q, 'چند', 'چقدر', 'تعداد', 'میزان', 'درصد', 'چه مقدار')) {
    const unk = V4H.unknownTerms(q, ps);
    if (unk.length) return V4H.noData(unk, ps);
  }
  if (ops.length === 1 && !has(q, 'مقایسه')) return V4H.op(ops[0]);
  return null;
};
const V4H = (() => {
  const {tbl, src, goBtn} = AI;
  const rk = (r) => (r ? `<a href="#" data-rk="${esc(r.k)}" class="mono" style="color:var(--ice)">${esc(r.k)}</a>` : '');
  const lab = (t) => `<b class="lab">${t}:</b> `;
  const SAYS = lab('منبع می‌گوید'), CALC = lab('محاسبه رادار'), INFER = lab('استنباط دستیار');
  const FCP = 'فایل پورت و سرعت شرکت‌های FCP/UNSP، شهریور ۱۴۰۵؛ مخابرات ایران و کل بازار را نمی‌پوشاند';
  const o = {};
  o.provHave = (p) => {
    const recs = REC.list.filter((r) => r.coll !== 'src' && (String(r.t).includes(p.n) || String(r.geo || '').includes(p.n)));
    const have = [
      ['پورت منصوبه و دایر FTTH، XDSL، TD-LTE، WiFi و تلفن ثابت', FCP, 'کاربرگ ارسالی؛ تأیید مستقل نشده'],
      ['توزیع سرعت اسمی سرویس به تفکیک فناوری', 'فایل سرعت ارسالی شهریور ۱۴۰۵؛ نه کل کشور', 'سرعت فروخته‌شده، نه اندازه‌گیری‌شده'],
      ...(recs.length ? [[`${F.i(recs.length)} رکورد دیگر که نام استان در آن آمده`, 'مجموعه‌های مختلف', 'نوع شاهد هر رکورد را ببینید']] : []),
    ];
    const lack = ['آمار رسمی استانی رگولاتوری (فصلنامه ۵۷ فقط کل کشور را منتشر می‌کند)', 'پورت و اشتراک مخابرات ایران در استان', 'کیفیت تجربه کاربر (سرعت و تأخیر اندازه‌گیری‌شده) به تفکیک استان', 'هزینه مؤثر و استطاعت خانوار', 'رخدادهای اختلال استانی با زمان و شبکه متأثر', 'شکاف شهر و روستا در استان', 'خدمات کاربردی (دولت، پرداخت، آموزش و سلامت) در استان'];
    return {h: `داده‌های موجود و ناموجود درباره ${p.n}`, b: `<h6>داریم</h6>${tbl(['داده', 'دامنه', 'وضعیت'], have.map((r) => r.map(esc)))}<p>${SAYS}در این فایل برای ${esc(p.n)} ${F.i(p.fthI)} پورت FTTH منصوبه و ${F.i(p.fthA)} پورت دایر ثبت شده است.${p.flag ? ' <b>هشدار داده:</b> ' + esc(p.flag) + '.' : ''}</p><h6>نداریم</h6><ul>${lack.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>${src(FCP)}${goBtn('provinces', 'نمایش استان')}`, act: () => { STATE.prov = p.iso; }, ctx: {kind: 'provHave', ent: p.iso}};
  };
  o.provSame = (ps) => {
    const rows = [['پورت FTTH منصوبه', 'fthI', F.i], ['پورت FTTH دایر', 'fthA', F.i], ['نسبت دایر به منصوبه FTTH', 'fthU', F.p], ['پورت XDSL دایر', 'xA', F.i], ['نسبت دایر به منصوبه XDSL', 'xU', F.p], ['TD-LTE دایر', 'lteA', F.i], ['تلفن ثابت دایر', 'telA', F.i]];
    return {h: `مقایسه ${ps.map((p) => p.n).join(' و ')} در دوره و دامنه یکسان`, b: `<p><span class="scope">دوره: شهریور ۱۴۰۵ · دامنه: ${esc(FCP)} · واحد: پورت؛ نسبت‌ها محاسبه رادار</span></p>${tbl(['سنجه', ...ps.map((p) => esc(p.n))], rows.map(([n, k, f]) => [n, ...ps.map((p) => (p[k] == null ? '<span class="na">ناموجود</span>' : f(p[k])))]))}<p>${INFER}این جدول فقط پورت شرکت‌های این فایل را مقایسه می‌کند. جمعیت، شمار خانوار و سهم مخابرات ایران در دو استان یکسان نیست، پس عدد مطلق را نمی‌توان به معنای «دسترسی بهتر مردم» خواند. برای مقایسه منصفانه، مخرج جمعیت یا خانوار استان و داده کل بازار لازم است.</p>${ps.some((p) => p.flag) ? `<p><b>هشدار داده:</b> ${ps.filter((p) => p.flag).map((p) => esc(p.n + ': ' + p.flag)).join('؛ ')}</p>` : ''}${src(FCP)}${goBtn('provinces')}`, ctx: {kind: 'prov', ent: ps[0].iso}};
  };
  o.fiberDefs = () => {
    const hh = D.fiberCov[D.fiberCov.length - 1];
    return {h: 'پوشش فیبر، پورت دایر و اشتراک: سه سنجه متفاوت', b: `${tbl(['سنجه', 'تعریف', 'مقدار', 'واحد و دوره', 'دامنه و منبع'], [
      ['خانوار تحت پوشش', 'خانوارهایی که شبکه فیبر به محدوده آن‌ها رسیده؛ به معنی آمادگی اتصال هر خانوار نیست', F.big(hh[1]), 'خانوار · ' + esc(hh[0]), 'کل کشور · فصلنامه ۵۷ ص۴'],
      ['پورت FTTH منصوبه', 'ظرفیت نصب‌شده در تجهیزات شرکت‌ها', F.big(M.provT.fthI), 'پورت · شهریور ۱۴۰۵', esc(FCP)],
      ['پورت FTTH دایر', 'پورت‌هایی که سرویس روی آن‌ها فعال است', F.big(M.provT.fthA != null ? M.provT.fthA : M.prov.reduce((a, p) => a + (p.fthA || 0), 0)), 'پورت · شهریور ۱۴۰۵', esc(FCP)],
      ['اشتراک FTTx', 'قرارداد فعال سرویس فیبر (FTTH و سایر FTTx، خانگی و غیرخانگی)', F.big(M.fiber.subs), 'اشتراک · بهار ۱۴۰۵', 'کل کشور · فصلنامه ۵۷ ص۲۲'],
    ])}<p>${CALC}نسبت اشتراک FTTx به خانوار تحت پوشش ${F.p(M.fiber.takeup)} است. این عدد «نرخ تبدیل» نیست، چون اشتراک غیرخانگی در صورت هست و پوشش، آمادگی فنی هر خانوار را نشان نمی‌دهد؛ تفاضل این دو هم شمار خانوار آماده بدون اشتراک نیست. پورت‌ها از فایل دیگری با دامنه محدودتر و دوره متفاوت می‌آیند و با دو سنجه دیگر مستقیم تقسیم نمی‌شوند.</p>${src('فصلنامه ۵۷ صفحات ۴ و ۲۲؛ ' + FCP)}${goBtn('fixed')}`};
  };
  o.migration = () => {
    const f0 = M.fixed.techs.find((t) => t.k === 'FTTx'), x0 = M.fixed.techs.find((t) => t.k === 'XDSL');
    return {h: 'آیا کاهش XDSL مهاجرت به فیبر را ثابت می‌کند؟ خیر', b: `<p>${SAYS}از بهار ۱۴۰۴ تا بهار ۱۴۰۵ اشتراک XDSL از ${F.i(x0.from)} به ${F.i(x0.to)} و FTTx از ${F.i(f0.from)} به ${F.i(f0.to)} رسیده است (فصلنامه ۵۷، کل کشور).</p><p>${CALC}افزایش خالص FTTx ${OFFSET_TXT()} کاهش خالص XDSL است (نسبت حسابی دو تفاضل).</p><p>${INFER}این‌ها موجودی دو زمان‌اند، نه جریان مشترک. هم‌زمانی کاهش یکی و افزایش دیگری با چند سناریو سازگار است: جابه‌جایی مشترک به فیبر، رفتن به پهن‌باند سیار یا TD-LTE، قطع اشتراک، و جذب مشترک تازه فیبر که هرگز XDSL نداشته. برای اثبات مهاجرت، داده جریان (انتقال شماره اشتراک یا پورت از XDSL به FTTH به تفکیک دوره و اپراتور) لازم است که در داده‌های رادار نیست.</p>${src('فصلنامه ۵۷ ص۲۲')}${goBtn('fixed')}`};
  };
  o.platRatio = (k) => {
    const p = M.plat.find((x) => x.k === k), others = M.plat.filter((x) => x.k !== k && x.vpc);
    if (!p) return null;
    if (!p.vpc) return {h: `بازدید به ازای محتوا در ${p.n}`, b: `<p>برای ${esc(p.n)} «بازدید» قابل‌مقایسه گزارش نشده است${k === 'VIRASTY' ? '؛ ویراستی «ضریب نفوذ» گزارش کرده که با بازدید جمع یا مقایسه نمی‌شود' : ''}.</p>${src('گزارش شش‌ماهه مرکز ملی فضای مجازی (متن کاربر)')}`, ctx: {kind: 'plat', ent: k}};
    return {h: `چرا بازدید ${p.n} نسبت به محتوایش بالاست؟`, b: `<p>${SAYS}${esc(p.n)} در شش‌ماهه نخست ۱۴۰۵ حدود ${F.n(p.content)} میلیون محتوا و ${F.n(p.views)} میلیارد بازدید داشته است (آمار ناشر؛ تأیید مستقل نشده).</p>${tbl(['سکو', 'بازدید به ازای هر محتوا (محاسبه رادار)'], [p, ...others].map((x) => [esc(x.n), F.i(x.vpc)]))}<p>${INFER}داده موجود علت را نشان نمی‌دهد. چند توضیح ممکن، که هیچ‌کدام با داده رادار آزموده نشده: تعریف و شیوه شمارش «بازدید» در هر سکو متفاوت است و یکسان‌سازی نشده؛ ترکیب محتوا (سهم کانال‌های پرمخاطب، خبر یا خدمات) فرق دارد؛ و بخشی از بازدید ممکن است از سرویس‌های جانبی یا کانال‌های رسمی پرمخاطب بیاید. برای داوری، تعریف سنجه بازدید هر سکو، توزیع بازدید میان کانال‌ها و داده مستقل اندازه‌گیری لازم است.</p>${src('گزارش شش‌ماهه مرکز ملی فضای مجازی (ارائه‌شده توسط کاربر)')}${goBtn('platforms')}`, ctx: {kind: 'plat', ent: k}};
  };
  o.shn61 = () => {
    const r = REC.list.find((x) => x.coll === 'cand' && /شناختیک/.test(x.sub) && String(x.v) === '61');
    return {h: 'آیا «۶۱» شناختیک درصد افراد است؟ خیر', b: r ? `<p>${SAYS}رکورد ${rk(r)} («${esc(r.t)}») مقدار ${esc(r.v)} با واحد <span class="mono">${esc(r.u)}</span> و دوره ${esc(r.p)} دارد.</p><p>${INFER}واحد این عدد شاخص وزنی لیکرت است، یعنی امتیاز ترکیبی روی یک مقیاس، نه نسبت پاسخ‌دهندگان. محدودیت ثبت‌شده در خود رکورد: «${esc(r.lim[0] || '')}». برای گزارش درصد افراد، توزیع پاسخ هر گزینه و حجم نمونه لازم است که در این رکورد نیست. وضعیت پذیرش: ${esc((ADM[r.adm] || {}).n || r.adm)}.</p>${src(esc(r.src))}` : '<p>رکورد با مقدار ۶۱ در نامزدهای شناختیک پیدا نشد.</p>'};
  };
  o.dcCap = () => {
    const L = D.infra.filter((r) => r.sec === 't08');
    const kind = (r) => /طراحی/.test(r.l) ? 'ظرفیت طراحی' : /افتتاح/.test(r.l) ? 'ظرفیت هنگام افتتاح (تاریخی)' : /اعلام/.test(r.l) ? 'اعلامی ارائه‌دهنده' : /گزارش/.test(r.l) ? 'گزارش‌شده' : 'سایر';
    return {h: 'آیا مراکز داده ظرفیت خالی دارند؟ با داده موجود نمی‌توان گفت', b: `${tbl(['رکورد', 'سنجه', 'مقدار', 'جنس ظرفیت', 'وضعیت'], L.map((r) => [rk(REC.byId['infra:' + r.id]), esc(r.l), (typeof r.v === 'number' ? F.n(r.v) : esc(r.v)) + ' ' + esc(r.u || ''), kind(r), `<small>${CODE(r.st)}</small>`]))}<p>${INFER}برای سنجش ظرفیت خالی باید ظرفیت فعال یا نصب‌شده و ظرفیت اشغال‌شده هم‌دوره در دست باشد. داده موجود فقط ظرفیت اعلامی، طراحی، هنگام افتتاح یا گزارش‌شده است، اغلب از خود ارائه‌دهنده و بدون تأیید مستقل. هیچ رکوردی از اشغال رک، مصرف برق یا نرخ بهره‌برداری نداریم، پس درباره ظرفیت خالی نتیجه‌ای نمی‌گیرم. این ظرفیت‌ها از جنس‌های متفاوت‌اند و جمعشان ظرفیت کشور نیست.</p>${src('رکوردهای T08 پژوهش ساختاریافته؛ بازیابی ۵ آبان ۱۴۰۵')}${goBtn('infra')}`};
  };
  o.cloudCost = () => {
    const L = D.infra.filter((r) => r.sec === 't09' && typeof r.v === 'number');
    const unk = ['ترافیک خروجی و پهنای باند (سهمیه در صفحه تثبیت نشده)', 'مالیات و عوارض (شمول مالیات در منبع مشخص نیست)', 'منطقه و مرکز داده', 'پشتیبانی و SLA', 'پشتیبان‌گیری و ذخیره‌سازی اضافه', 'IP عمومی، مجوز نرم‌افزار و هزینه انتقال', 'تاریخ اعتبار قیمت و تغییرات پس از بازیابی'];
    const r0 = L[0] && L[0].raw;
    return {h: 'هزینه خدمت ابری هم‌ارز و آنچه نامعلوم است', b: `<p>${SAYS}قیمت‌های زیر در صفحه محصول آروان در تاریخ بازیابی درج شده‌اند.</p>${tbl(['بسته', 'پردازنده/حافظه/دیسک', 'قیمت ماهانه', 'تاریخ'], L.slice(0, 8).map((r) => [esc(r.l), esc([r.raw.cpu_as_labelled, r.raw.ram, r.raw.disk].filter((x) => x != null).join(' / ')), F.i(r.v) + ' ' + esc(r.u), esc(r.raw.observed_date || r.p)]))}<p>${INFER}این قیمت فهرست است، نه قیمت قطعی امروز یا هزینه کامل. «هم‌ارز» بودن هم ثابت نشده: ${r0 && r0.physical_vs_virtual_cpu_confirmed === false ? 'نوع پردازنده (فیزیکی یا مجازی) تأیید نشده و ' : ''}مشخصات میان ارائه‌دهندگان یکسان‌سازی نشده است. اقلام نامعلوم:</p><ul>${unk.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>${src('صفحه محصول آروان؛ بازیابی ۵ آبان ۱۴۰۵؛ رکوردهای T09')}${goBtn('infra')}`};
  };
  o.outageNow = () => {
    const fw = REC.list.filter((r) => r.sub === 'Filterwatch');
    const t07 = REC.list.filter((r) => /T07/.test(r.rule) && r.coll !== 'src').slice(0, 6);
    return {h: 'شواهد اختلال و آخرین زمان دریافت هر منبع', b: `<p><b>این فایل آفلاین است و داده زنده ندارد.</b> هیچ منبعی در این فایل «دریافت فعال» نیست؛ در نسخه متصل، وضعیت و زمان آخرین دریافت هر منبع از سرور خوانده می‌شود.</p>${tbl(['منبع', 'وضعیت در این فایل', 'آخرین دریافت'], ONLINE_SOURCES.map((s) => [esc(s.n), esc(OST[s.status][0]), s.id === 'tor' ? 'آرشیو ژوئن–ژوئیه ۲۰۲۵' : 'ثبت نشده']))}<h6>شواهد آرشیوی اختلال در داده رادار</h6>${tbl(['رکورد', 'ادعا', 'دوره'], [...fw, ...t07].map((r) => [rk(r), esc(String(r.t).slice(0, 90)), esc(r.p || '—')]))}<p>${INFER}گزارش‌های Filterwatch «نامزد پژوهشی»‌اند و تا نگاشت به شواهد اولیه، آمار پذیرفته‌شده نیستند. نبود رخداد در این فایل به معنی نبود اختلال نیست.</p>${goBtn('online', 'پایش آنلاین')}`, async: true};
  };
  o.conflictMethod = () => ({h: 'اگر رادار آروان و IODA نتیجه متفاوت بدهند', b: `<p>${INFER}این دو یک چیز را نمی‌سنجند، پس تفاوت به‌خودی‌خود تعارض نیست:</p>${tbl(['', 'IODA', 'رادار آروان'], [['نقطه دید', 'BGP جهانی، پینگ فعال به بلوک‌های /24 و تلسکوپ شبکه', 'آزمون دسترسی از نقاط داخلی (طبق معرفی ارائه‌دهنده)'], ['چه می‌سنجد', 'دیده‌شدن و پاسخ‌گویی فضای نشانی ایران از بیرون', 'دسترسی به مقاصد از داخل'], ['روش دریافت در رادار', 'API مستند', 'روش دریافت مستند و مجاز پیدا نشد'], ['حساسیت', 'قطع گسترده مسیریابی یا اتصال', 'مسدودسازی یا اختلال مقصدهای مشخص']])}<p>روال پیشنهادی: (۱) بازه زمانی را به UTC هم‌تراز کنید؛ (۲) دامنه هر منبع را بنویسید: کشور، ASN، مقصد؛ (۳) بررسی کنید آیا یک سیگنال افت دیده‌شدن مسیر است و دیگری افت دسترسی به مقصد خاص؛ (۴) منبع سوم مستقل (OONI برای مقصد، RIPE Atlas برای مسیر) را ببینید؛ (۵) خطای گردآورنده هر منبع را جدا کنید؛ (۶) تا روشن شدن، هر دو را با دامنه‌شان گزارش کنید و یکی را حذف نکنید.</p>${goBtn('online', 'پایش آنلاین')}`});
  o.families = () => {
    const fam = CHAIN.families();
    const rel = D.reg.relations.filter((r) => /SECONDARY|RESTATEMENT|USES_SURVEY|ALTERNATE_FORMAT|SAME_MONITORING|OVERLAPPING/.test(r.relation_type));
    return {h: 'منابعی که از یک مطالعه یا پیمایش مشترک نقل کرده‌اند', b: `${fam.map(([k, v]) => `<h6 class="mono">${esc(k)}</h6>${tbl(['منبع', 'نقش'], v.map((c) => [esc(c.catalog_id + ' · ' + c.title), `<small>${CODE(c.provenance_role)}</small>`]))}`).join('')}<h6>روابط بازنشر و تحلیل مشتق</h6>${tbl(['از', 'رابطه', 'به'], rel.slice(0, 14).map((r) => [`<span class="mono">${esc(r.from_catalog_id)}</span>`, `<small>${CODE(r.relation_type)}</small>`, `<span class="mono">${esc(r.to_catalog_id)}</span>`]))}<p>${INFER}نسخه رسمی پیمایش ملت (۲۱۹۲۱)، صفحه HTML همان گزارش و بازنشر خبری آن یک شاهد واحدند، نه سه پیمایش مستقل. استفاده ثانویه دیتاک از نتایج ISPA هم شاهد تازه نیست. در شمارش شواهد، هر خانواده یک بار حساب می‌شود.</p>${src('کاتالوگ منبع و رجیستر روابط پژوهشی')}${goBtn('registry')}`};
  };
  o.actions = () => {
    const pick = D.bridge.filter((b) => ['M01', 'M04', 'M05'].includes(b.mechanism_id));
    return {h: 'سه اقدام برای بهبود تجربه مردم، با شاهد و معیار ارزیابی', b: `${pick.map((b, i) => `<div class="cp act"><b>${F.i(i + 1)}. ${esc(b.title)} (${esc(b.mechanism_id)} · ${esc(b.priority)})</b><span>${esc(b.proposed_action)}</span><small>شاهد کاربر: ${esc(b.user_evidence_id || 'ندارد')} · شاهد فنی: ${esc((b.technical_evidence_ids || []).join('، ') || 'ندارد')}</small><small>معیار ارزیابی: ${esc(b.evaluation_indicator_definition)} · مقدار مبنا: ${b.baseline_kpi == null ? 'ندارد' : esc(b.baseline_kpi)} · هدف: ${b.target_kpi == null ? 'تأیید نشده' : esc(b.target_kpi)} · مسئول: ${b.owner === 'NOT_VALIDATED' ? 'تأیید نشده' : esc(b.owner)}</small></div>`).join('')}<p>${INFER}این سه از پیش‌نویس S02 برگزیده شده‌اند چون شاهد کاربر و شاهد فنی هر دو دارند. شواهد کاربر و فنی هم‌دوره نیستند، پس رابطه علّی میان آن‌ها اثبات نشده؛ مقدار مبنا و هدف هم هنوز تعیین یا تأیید نشده‌اند. اقدام‌ها پیشنهادند، نه مصوبه.</p>${src('S01→S02 decision bridge (پیش‌نویس)')}${goBtn('decision')}`};
  };
  o.op = (name) => {
    const op = M.ops.find((x) => x.name === name);
    if (!op) return null;
    return {h: `نیم‌رخ ${name}`, b: `${tbl(['سنجه', 'مقدار', 'واحد'], [['خطوط فعال', F.big(op.active), 'خط'], ['سهم پهن‌باند سیار', F.p(M.mob.share[name]), 'درصد'], ['پوشش جمعیتی 4G', F.p(op.coverage4g), 'درصد جمعیت'], ['سایت 4G', F.i(op.sites4g), 'سایت'], ['سایت 5G', F.i(op.sites5g), 'سایت'], ['سرعت دانلود 4G', F.n(op.ping4g), 'Mbps'], ['برقراری موفق 4G', F.p(op.success4g, 2), 'درصد'], ['قطعی 4G', F.p(op.drop4g, 2), 'درصد']])}<p>${SAYS}مقادیر از فصلنامه ۵۷ (بهار ۱۴۰۵، کل کشور) و بر پایه گزارش اپراتور به رگولاتوری‌اند. ${INFER}پوشش جمعیتی، کیفیت تجربه کاربر را نشان نمی‌دهد و سرعت گزارش‌شده با اندازه‌گیری مستقل هم‌دوره مقایسه نشده است.</p>${src('فصلنامه ۵۷ صفحات ۱۰ و ۲۴ تا ۲۷')}${goBtn('mobile')}`, ctx: {kind: 'op', ent: name}};
  };
  let VOCAB = null;
  const GENERIC = new Set(['داریم', 'دارد', 'دارند', 'دارید', 'داشته', 'هستیم', 'میکنیم', 'میدهیم', 'میکنند', 'میدهند', 'وجود', 'چگونه', 'چطور', 'کدام', 'چرا', 'بوده', 'شدند', 'شدیم', 'باشند', 'باشد', 'بگو', 'بده', 'بگویید', 'لطفا', 'تعداد', 'میزان', 'درصد', 'مقدار', 'کاربران', 'کاربر', 'استان', 'شهر', 'اینترنت', 'ایران', 'کشور', 'نفر', 'سال', 'امسال', 'چقدر', 'چند', 'است', 'هست', 'هستند', 'فعلی', 'الان', 'اکنون', 'کل', 'مجموع', 'تقریبا', 'حدود']);
  o.unknownTerms = (q, ps) => {
    if (!VOCAB) { VOCAB = new Set(); const add = (x) => AI.norm(x).split(' ').forEach((w) => { if (w.length > 2) VOCAB.add(w); }); REC.list.forEach((r) => add([r.t, r.def, r.src, r.sub, r.p, r.pop, (r.lim || []).join(' '), JSON.stringify(r.raw || {}).slice(0, 600)].join(' '))); Object.values(DOM).forEach((d) => add(d.n + ' ' + d.d)); M.prov.forEach((p) => add(p.n)); M.ops.forEach((x) => add(x.name)); Object.values(PLAT).forEach(add); ['فیبر', 'پورت', 'اشتراک', 'سرعت', 'تاخیر', 'تأخیر', 'ترافیک', 'پوشش', 'اپراتور', 'سکو', 'بازدید', 'محتوا', 'ابر', 'مرکز', 'داده', 'قیمت', 'اختلال', 'قطعی', 'پیمایش', 'رضایت', 'فیلترشکن', 'vpn', 'tor', 'روستا', 'خانوار', 'شکایت'].forEach(add); }
    const prov = new Set(ps.flatMap((p) => AI.norm(p.n).split(' ')));
    return q.split(' ').filter((w) => w.length > 3 && !GENERIC.has(w) && !AI.STOP.has(w) && !prov.has(w) && !VOCAB.has(w) && ![...VOCAB].some((v) => v.length > 4 && (v.startsWith(w) || w.startsWith(v))));
  };
  o.noData = (unk, ps) => ({h: 'داده‌ای برای پاسخ این پرسش ندارم', b: `<p>در داده‌های رادار شاهدی درباره «${unk.map(esc).join('، ')}» نیست و عددی برآورد یا ساخته نمی‌شود.${ps.length ? ` برای ${ps.map((p) => esc(p.n)).join(' و ')} فقط داده پورت و سرعت اسمی فایل FCP/UNSP (شهریور ۱۴۰۵، نه کل بازار) موجود است.` : ''}</p><p>برای پاسخ، منبع اولیه با تعریف سنجه، دوره و جامعه آماری لازم است. در نسخه متصل با اجازه وب، دستیار می‌تواند منابع عمومی را جست‌وجو کند و پاسخ را با پیوند و تاریخ بدهد.</p>`});
  o.webOffline = (raw) => ({h: 'جست‌وجوی وب در این فایل ممکن نیست', b: `<p>نسخه آفلاین به اینترنت وصل نمی‌شود و پاسخی از وب نمی‌سازد. برای این پرسش، نسخه متصل را اجرا کنید، در تنظیمات دستیار نشانی سرور را وارد و «اجازه جست‌وجوی وب» را روشن کنید. دستیار متصل منبع اولیه را ترجیح می‌دهد و پیوند و تاریخ را می‌آورد.</p>`});
  return o;
})();

/* ---------- assistant UI ---------- */
const AIUI = (() => {
  const hist = [];
  let ctx = {}, allowWeb = false;
  try { if (!localStorage.getItem('radarApi') && localStorage.getItem('radarAiApi')) localStorage.setItem('radarApi', localStorage.getItem('radarAiApi')); allowWeb = localStorage.getItem('radarWeb') === '1'; } catch (e) {}
  const msgs = () => $('#aiMsgs');
  const push = (cls, html) => { const d = document.createElement('div'); d.className = 'm ' + cls; d.innerHTML = html; msgs().appendChild(d); msgs().scrollTop = 1e9; return d; };
  const bind = (d, act) => { $$('[data-go]', d).forEach((b) => b.onclick = () => { if (act) act(); go(b.dataset.go); if (innerWidth < 1200) close(); }); $$('[data-rk]', d).forEach((a) => a.onclick = (e) => { e.preventDefault(); DETAIL.open(a.dataset.rk); }); };
  const pageState = () => ({view: STATE.view, title: V[STATE.view] && V[STATE.view].title, params: Object.fromEntries(new URLSearchParams((location.hash.split('?')[1] || ''))), record: STATE.rec || undefined, domain: V[STATE.view] && V[STATE.view].domain});
  const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\b((?:off|res|plat|infra|cand|src):[A-Za-z0-9_.\-]+)/g, (m) => (REC.byId[m] ? `<a href="#" data-rk="${m}" class="mono" style="color:var(--ice)">${m}</a>` : m)).replace(/\n/g, '<br>');
  const server = async (text) => {
    // 90 s ceiling: a slow model/tool loop must not leave the typing indicator forever
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 90000);
    let r;
    try { r = await fetch(API.base().replace(/\/$/, '') + '/api/v2/assistant/chat', {method: 'POST', signal: ctl.signal, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question: text, history: hist.slice(-8), page_state: pageState(), allow_web: allowWeb})}); }
    catch (e) { if (e.name === 'AbortError') throw new Error('پاسخ سرور در ۹۰ ثانیه نرسید'); throw e; }
    finally { clearTimeout(tm); }
    if (r.status === 503) { const e = new Error('NO_MODEL'); e.code = 503; throw e; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  };
  const liveSources = async (el) => {
    if (!API.base()) return;
    try { const j = await API.get('/api/v1/online/sources'); el.insertAdjacentHTML('beforeend', `<h6>وضعیت زنده منابع (از سرور)</h6>${AI.tbl(['منبع', 'وضعیت', 'آخرین موفقیت', 'تازگی'], j.sources.map((s) => [esc(s.name), esc(s.status_fa), TEH(s.last_success), esc(s.freshness || '—')]))}`); }
    catch (e) { el.insertAdjacentHTML('beforeend', `<p><span class="er">دریافت وضعیت زنده ناموفق بود</span> (${esc(e.message)}).</p>`); }
  };
  const local = async (t, text, prefix) => {
    await new Promise((r) => setTimeout(r, 200));
    const a = AI.route(text, ctx);
    const html = a ? `<h5>${esc(a.h)}</h5>${a.b}` : '<p>پرسش را کمی دقیق‌تر بنویسید.</p>';
    t.innerHTML = (prefix || '') + html + '<div class="src">موتور داخلی رادار · داده و راهنمای همین فایل · بدون مدل زبانی</div>';
    bind(t, a && a.act);
    if (a && a.async) await liveSources(t);
    if (a && a.liveSelf) await SELF_LIVE(t);
    if (a && a.chg) { await CHGQ.fill(t, a.chg); bind(t, a.act); }
    // keep topic for follow-ups; a bare «تحلیل بده» never becomes the remembered question
    if (a) ctx = {...(a.ctx || ctx || {}), lastQuestion: AI.isFollowAnalysis(AI.norm(text)) ? (ctx && ctx.lastQuestion) : text};
    hist.push({role: 'user', content: text}, {role: 'assistant', content: a ? a.h : ''});
  };
  const ask = async (text) => {
    text = (text || '').trim(); if (!text) return;
    open();
    push('u', esc(window.RADAR_I18N?.lang==='en'?window.RADAR_I18N.toEN(text):text));
    if(window.RADAR_I18N?.lang==='en')text=window.RADAR_I18N.question(text);
    const t = push('a', '<span class="typing"><i></i><i></i><i></i></span>');
    // questions about the dashboard itself are answered from the dashboard, also in connected mode
    if (!API.base() || AI.isReportReq(AI.norm(text)) || CHGQ.match(AI.norm(text)) || GUIDE.route(AI.norm(text), ctx, {concepts: false})) return local(t, text);
    try {
      const j = await server(text);
      const cites = (j.citations || []).filter((c) => c.kind !== 'online');
      t.innerHTML = `<div>${md(j.answer)}</div>${cites.length ? `<h6>ارجاع‌ها</h6><ul class="cites">${cites.map((c) => c.kind === 'record' ? `<li${c.cited_in_answer ? '' : ' class="dim"'}><a href="#" data-rk="${esc(c.key)}" class="mono">${esc(c.key)}</a> ${esc(c.title || '')} <small>· ${esc(c.period || '')} · ${esc(c.evidence_type || '')}</small></li>` : `<li${c.cited_in_answer ? '' : ' class="dim"'}>${SAFEURL(c.url) ? `<a class="lnk" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.title || c.url)}</a>` : `${esc(c.title || '')} <small class="er">(نشانی نامعتبر حذف شد)</small>`}</li>`).join('')}</ul>` : ''}<div class="tools-trace">ابزارها: ${(j.tool_trace || []).map((x) => esc(x.tool) + (x.ok ? '' : ' ✗')).join('، ') || 'بدون ابزار'}${j.used_web ? ' · از وب استفاده شد' : ''}${j.truncated ? ' · ناتمام' : ''}</div><div class="src">مدل زبانی سرور رادار · ${allowWeb ? 'وب مجاز' : 'وب غیرفعال'}</div>`;
      bind(t);
      hist.push({role: 'user', content: text}, {role: 'assistant', content: j.answer});
    } catch (e) {
      const why = e.code === 503 ? 'مدل زبانی روی سرور پیکربندی نشده است (نیازمند کلید).' : 'سرور دستیار در دسترس نبود (' + esc(e.message) + ').';
      await local(t, text, `<div class="src">${why} پاسخ از موتور تحلیلی داخلی:</div>`);
    }
  };
  let opener = null;
  const open = () => { if (!$('#ai').classList.contains('open')) opener = document.activeElement; LAYER.top($('#ai')); const modal = innerWidth < 1200; $('#ai').classList.add('open'); $('#ai').setAttribute('role', 'dialog'); $('#ai').setAttribute('aria-modal', String(modal)); $('#scrim').hidden = !modal; setTimeout(() => $('#aiIn').focus(), 50); };
  const close = () => { if (!$('#ai').classList.contains('open')) return; $('#ai').classList.remove('open'); if (!DETAIL.isOpen()) $('#scrim').hidden = true; if (opener && opener.focus && document.contains(opener)) opener.focus(); opener = null; };
  const modeText = () => (API.base() ? 'نسخه متصل · سرور: ' + API.base() : 'موتور تحلیلی داخلی · آفلاین · داده‌های همین فایل');
  const health = async () => {
    const el = $('#aiHealth'); if (!el) return;
    if (!API.base()) { el.textContent = 'سرور تنظیم نشده'; return; }
    try { const h = await API.get('/api/v2/assistant/health'); el.innerHTML = `مدل: ${h.model_configured ? esc(h.provider + ' · ' + h.model) : '<span class="er">پیکربندی نشده</span>'} · وب: ${h.web_search_configured ? 'آماده' : 'بدون کلید'} · بسته داده: ${esc((h.bundle || {}).snapshot || '—')}`; }
    catch (e) { el.innerHTML = `<span class="er">سرور در دسترس نیست</span> (${esc(e.message)})`; }
  };
  const init = () => {
    $('#aiForm').onsubmit = (e) => { e.preventDefault(); const i = $('#aiIn'); const v = i.value; i.value = ''; ask(v); };
    $('#aiX').onclick = close;
    const sugs = ['پیشرفت کل اهداف شبکه ملی اطلاعات در ۱۴۰۵', 'چرا پیشرفت کل اهداف در ۱۴۰۵ کم شد؟', 'ضعیف‌ترین اهداف شبکه ملی کدام‌اند؟', 'چه داده‌هایی درباره اصفهان داریم و نداریم؟', 'اصفهان و فارس را با دوره و دامنه یکسان مقایسه کن', 'تفاوت پوشش فیبر، پورت دایر و اشتراک چیست؟', 'آیا کاهش XDSL مهاجرت به فیبر را ثابت می‌کند؟', 'چرا بازدید بله نسبت به محتوایش بالاست؟', 'آیا ۶۱ شناختیک درصد افراد است؟', 'آیا مراکز داده ظرفیت خالی دارند؟', 'الان چه شواهدی از اختلال داریم؟', 'کدام منابع از یک پیمایش مشترک نقل کرده‌اند؟', 'سه اقدام برای تجربه مردم'];
    $('#aiSugs').innerHTML = sugs.map((s) => `<button>${esc(s)}</button>`).join('');
    $$('#aiSugs button').forEach((b,i) => b.onclick = () => ask(sugs[i]));
    $('#aiMode').innerHTML = `<span id="aiModeT">${esc(modeText())}</span><button id="aiCfgB" type="button">تنظیمات</button>`;
    $('#aiCfg').innerHTML = `<span>نشانی سرور رادار (FastAPI مخزن). کلیدهای مدل و جست‌وجو فقط روی سرور نگهداری می‌شوند و در این صفحه وارد نمی‌شوند.</span><span><b>حریم داده:</b> در نسخه متصل، پرسش، تاریخچه گفت‌وگو و وضعیت صفحه (بخش، فیلترها، رکورد باز) به سرور رادار و از آن‌جا به ارائه‌دهنده مدل زبانی پیکربندی‌شده فرستاده می‌شود. اگر مدل خارجی است، همین داده از سازمان خارج می‌شود. برای کار کاملاً محلی، نشانی را خالی بگذارید تا موتور داخلی پاسخ دهد.</span><input id="aiApi" placeholder="https://radar-api.example.ir" dir="ltr"><label class="tgl"><input type="checkbox" id="aiWeb" ${allowWeb ? 'checked' : ''}> اجازه جست‌وجو و خواندن وب عمومی (فقط نسخه متصل)</label><div id="aiHealth" class="dim"></div><button class="go" id="aiApiSave" type="button">ذخیره و آزمون اتصال</button>`;
    $('#aiCfgB').onclick = () => { $('#aiCfg').hidden = !$('#aiCfg').hidden; if (!$('#aiCfg').hidden) health(); };
    $('#aiApi').value = API.base();
    $('#aiWeb').onchange = (e) => { allowWeb = e.target.checked; try { localStorage.setItem('radarWeb', allowWeb ? '1' : '0'); } catch (x) {} };
    $('#aiApiSave').onclick = () => { const v = $('#aiApi').value.trim(); if (v && !/^https?:\/\//.test(v)) { TOAST('نشانی باید با http یا https آغاز شود', 'warn'); return; } try { localStorage.setItem('radarApi', v); } catch (e) {} $('#aiModeT').textContent = modeText(); health(); if (STATE.view === 'online') render(true); };
    push('a', `<h5>دستیار تحلیلی رادار</h5><p>پاسخ‌ها از داده‌های همین داشبورد ساخته می‌شوند و برای هر عدد، منبع، دوره، دامنه و نوع شاهد آن آمده است. آنچه منبع می‌گوید، آنچه رادار محاسبه کرده و استنباط دستیار جدا برچسب می‌خورند. اگر داده‌ای نداشته باشم، عدد نمی‌سازم.</p>`);
  };
  return {ask, open, close, init};
})();

/* ---------- assistant: cyber incidents from the curated register (evidence level always explicit) ---------- */
const CYBERQ = (q) => {
  const {tbl, src, goBtn} = AI;
  const L = [...(window.RADAR_CYBER || {incidents: []}).incidents].sort((a, b) => (a.date < b.date ? 1 : -1));
  const EV = (window.RADAR_CYBER || {}).evidence_levels || {};
  const yr = (q.match(/(?<!\d)(13|14)\d\d(?!\d)/) || [])[0];
  const hit = L.filter((i) => (i.keywords || []).some((w) => q.includes(AI.norm(w))) && (!yr || AI.norm(i.date_fa).includes(yr)));
  const rows = (hit.length ? hit : L);
  const live = /ddos|دیداس|الان|اکنون|امروز|زنده/.test(q);
  return {h: hit.length === 1 ? hit[0].title + ' · ' + hit[0].date_fa : 'رخدادهای سایبری گزارش‌شده علیه ایران',
    b: `${tbl(['تاریخ', 'رخداد', 'ادعا', 'سطح شاهد'], rows.map((i) => [esc(i.date_fa), esc(i.title), esc(i.claimed_by), i.evidence.map((e) => esc(EV[e] || e)).join(' + ')]))}
    ${hit.length === 1 ? `<p><b>اثر گزارش‌شده:</b> ${esc(hit[0].effects)}. <b>انتساب:</b> ${esc(hit[0].attribution)}.${hit[0].confirmation ? ' <b>تأیید:</b> ' + esc(hit[0].confirmation) + '.' : ''}</p>` : ''}
    <p>«ادعای مهاجم» تأیید نیست؛ حمله و انتساب آن دو گزاره جدا هستند. این رجیستر فقط رخدادهای عمومیِ دارای منبع را دارد و کامل نیست.${live ? ' سنجش زنده حملات (DDoS مهارشده در Cloudflare با مقصد ایران) فقط در نسخه متصل و با کلید Cloudflare روی سرور در دسترس است؛ این فایل داده زنده ندارد.' : ''}</p>
    ${src(rows.flatMap((i) => i.sources.map((x) => x.publisher)).filter((x, k, a) => a.indexOf(x) === k).join('، '))}${goBtn('online', 'رجیستر و پایش حملات')}`, ctx: {kind: 'cyber'}};
};
