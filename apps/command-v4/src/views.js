/* ===== views ===== */
const V = {};
const panel = (cls, k, title, lead, body, foot) => `<section class="p ${cls}" data-pid="${esc(String(k).split('·')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'panel')}"><header><h3>${title}</h3><span class="k">${k}</span></header>${lead ? `<p class="lead">${lead}</p>` : ''}${body}${foot ? `<div class="foot">${foot}</div>` : ''}</section>`;
const B = {off: '<span class="badge off">رسمی · فصلنامه ۵۷</span>', calc: '<span class="badge calc">محاسبه رادار</span>', res: '<span class="badge res">پژوهشی · بدون Q5</span>', usr: '<span class="badge usr">متن کاربر · تأیید نشده</span>', wb: '<span class="badge usr">کاربرگ ارسالی · تأیید مستقل نشده</span>'};
const EVB = {offc: ['محاسبه از رسمی', 'calc'], off: ['رسمی', 'off'], calc: ['محاسبه رادار', 'calc'], wb: ['کاربرگ · دامنه محدود', 'usr'], res: ['پژوهشی', 'res'], usr: ['ناشر · تأییدنشده', 'usr']};
const kpiKind = (o) => {
  if (o.ev) return o.ev;
  if (o.der) return 'offc'; // sum or ratio of several official KPIs: not itself a published figure
  const r = o.rid && typeof REC !== 'undefined' ? REC.byId[o.rid] || REC.byId['off:' + o.rid] : null;
  if (r) return r.et === 'official' ? 'off' : /survey|measurement|analysis|intl|model/.test(r.et) ? 'res' : 'usr';
  const k = String(o.k || '');
  if (/CALC/.test(k)) return 'calc';
  if (/PORT|SPEED|WB|Q2|MONITOR/.test(k)) return 'wb';
  if (/NCC|H1|MORDAD/.test(k)) return 'usr';
  if (/^P\d|CRA/.test(k)) return 'off';
  return null;
};
const kpiTile = (o) => { const kd = kpiKind(o), eb = kd && EVB[kd]; return `<div class="kpi"${o.rid ? ` data-rid="${o.rid}"` : ''} style="--st:${o.st || C.line}" title="${esc(o.title || '')}"><div class="t"><span>${esc(o.t)}</span><span>${esc(o.k || '')}</span></div>${eb || o.scope ? `<div class="kev">${eb ? `<span class="badge ${eb[1]}">${eb[0]}</span>` : ''}${o.scope ? `<span class="scope">${esc(o.scope)}</span>` : ''}</div>` : ''}<div class="v num"><span>${o.v}</span>${o.u ? `<small>${esc(o.u)}</small>` : ''}${o.spark || ''}${o.viz || ''}</div>${o.band || ''}<div class="d">${o.d || ''}</div></div>`; };
const dlt = (v, goodUp = true, d = 1) => `<b class="${v == null ? 'neu' : (v > 0) === goodUp ? 'up' : 'down'}">${F.sp(v, d)}</b>`;
const bp = (v) => { const [a, b] = F.bigPair(v); return {v: a, u: b}; };
const SEC = (n, t, s) => `<div class="sec-h"><span class="sec-n num">${F.i(n)}</span><div><h3>${t}</h3>${s ? `<p>${s}</p>` : ''}</div></div>`;
const legend = (items) => `<div class="legend">${items.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div>`;
const OPS = ['همراه اول', 'ایرانسل', 'رایتل'];
const opIdx = (o) => M.mob.ops.indexOf(o);
const xlabYear = (p, i) => (p.endsWith('Q1') || i === 0 ? per(p) : '');

/* ---------------- COMMAND ---------------- */
V.command = {
  title: 'نمای فرماندهی', code: 'NII · COMMAND',
  html: () => {
    const mob = bp(kv('CRA57-MOB-1405')), mbb = bp(M.mob.total), fbb = bp(kv('CRA57-FIXBB-1405')), tel = bp(kv('CRA57-FIXEDTEL-1405'));
    const mbbSeries = M.mob.values.map((r) => r.reduce((a, b) => a + b, 0));
    return `
    <div class="vhead"><div><div class="code">NATIONAL INFORMATION NETWORK · SITUATION · 1405-Q1</div><h2>وضعیت شبکه ملی اطلاعات در یک نگاه</h2>
    <p>رشد در سیار ادامه دارد و پایه پهن‌باند ثابت در یک سال کوچک شده است. در فایل پورت ارسالی، بخش بزرگی از پورت‌های FTTH منصوبه دایر نیست؛ علت آن از داده موجود قابل تعیین نیست. بیش از نیمی از ترافیک داده تابستان به مقصد خارجی رفته؛ این سهم به‌تنهایی معیار داوری درباره تحقق شبکه ملی اطلاعات نیست.</p></div>
    <div class="chips"><span class="chip"><i></i><b>${F.i(D.kpi.length)}</b> شاخص رسمی</span><span class="chip vio"><i></i><b>${F.i(D.evidence.length)}</b> شاهد پژوهشی</span><span class="chip amb"><i></i><b>${F.i(D.plat.records.length + D.mordad.records.length + D.platSupp.length)}</b> رکورد سکوها</span><span class="chip"><i></i><b>${F.i(Object.keys(D.prov).length)}</b> استان × ${F.i(D.wbPorts.length + D.wbSpeed.length)} کاربرگ</span></div></div>

    ${SEC(1, 'خلاصه اجرایی', 'سه پیام اصلی از داده‌ها، با نوع شاهد هر پیام')}
    <div class="g" id="cmdBrief"></div>
    ${SEC(2, 'شاخص‌های کلیدی', 'روی هر کارت بزنید تا شناسنامه، منبع و محدودیت آن باز شود')}
    <div class="strip" data-n="8">
      ${kpiTile({rid: 'CRA57-MOB-1405', t: 'خطوط فعال سیار', k: 'P03', v: mob.v, u: mob.u, d: `${dlt(kv('CRA57-MOB-GROWTH'), true, 2)} سالانه · نفوذ ${F.p(kv('CRA57-MOB-PEN'))}`, st: C.teal, band: VZ.meter(kv('CRA57-MOB-PEN'), 200, C.teal, {ref: 100, refLabel: 'یک خط برای هر نفر', label: 'ضریب نفوذ ' + F.p(kv('CRA57-MOB-PEN')), caption: '<span>نفوذ روی مقیاس ۰ تا ۲۰۰٪؛ خط سفید = ۱۰۰٪</span>'})})}
      ${kpiTile({der: 1, t: 'پهن‌باند سیار', k: 'P03 · P25', v: mbb.v, u: mbb.u, d: `${dlt(M.mob.yoy)} سالانه · نفوذ ${F.p(kv('CRA57-MOBB-PEN'))}`, st: C.teal, spark: K.spark(mbbSeries, C.teal)})}
      ${kpiTile({rid: 'CRA57-FIXBB-1405', t: 'پهن‌باند ثابت', k: 'P03 · P22', v: fbb.v, u: fbb.u, d: `${dlt(kv('CRA57-FIXBB-GROWTH'), true, 2)} سالانه · نفوذ ${F.p(kv('CRA57-FIXBB-PEN'))}`, st: C.red, spark: K.spark(D.fixedQ.map((q) => q.t), C.red)})}
      ${kpiTile({t: 'اشتراک FTTx به خانوار تحت پوشش', k: 'CALC · نسبت توصیفی', title: 'صورت و مخرج هم‌جامعه نیستند؛ نرخ تبدیل نیست', v: F.p(M.fiber.takeup), d: `${F.big(M.fiber.subs)} اشتراک · ${F.big(M.fiber.hh)} خانوار · نرخ تبدیل نیست`, st: C.amber, viz: VZ.ring(M.fiber.takeup, C.amber, {center: '', label: 'اشتراک FTTx به ازای هر ۱۰۰ خانوار تحت پوشش'})})}
      ${kpiTile({t: 'دایر به منصوبه FTTH', k: 'PORT 06', scope: 'دامنه محدود: FCP/UNSP', v: F.p(M.provT.fthU), d: `${F.big(M.provT.fthUBase.A)} از ${F.big(M.provT.fthUBase.I)} در ${F.i(M.provT.fthUBase.n)} استان با پایه معتبر`, title: 'فایل پورت شرکت‌های FCP/UNSP؛ کل کشور نیست. استان‌های با پایه کمتر از ۱٬۰۰۰ پورت یا داده ناسازگار از صورت و مخرج کنار گذاشته شده‌اند: ' + M.provT.fthUBase.excluded.map((x) => x.n + ' (' + x.why + ')').join('، '), st: C.red, viz: VZ.waffle(M.provT.fthU, C.red, {label: 'از هر ۱۰۰ پورت FTTH منصوبه، ' + F.n(Math.round(M.provT.fthU)) + ' پورت دایر'})})}
      ${kpiTile({t: 'سهم ترافیک بین‌الملل', k: 'Q2 · WB', v: F.p(M.traffic.intlShare), d: `از ${F.n(r1(M.traffic.tot / 1e9))} اگزابایت در سه ماه`, st: C.amber, band: VZ.split([{n: 'بین‌الملل', v: M.traffic.intlShare, c: C.amber}, {n: 'داخلی', v: 100 - M.traffic.intlShare, c: C.teal}])})}
      ${kpiTile({rid: 'CRA57-RTT-mobile-international', t: 'RTT سیار بین‌الملل', k: 'P14', v: F.n(M.lat.mi), u: 'ms', d: 'کوتاه‌تر بهتر · هم‌مسیر مقایسه شود', st: C.ice, band: VZ.compare([{n: 'سیار', v: M.lat.mi, c: C.ice, t: F.n(M.lat.mi) + 'ms'}, {n: 'ثابت', v: M.lat.fi, c: C.mut, t: F.n(M.lat.fi) + 'ms'}])})}
      ${kpiTile({rid: 'CRA57-FIXEDTEL-1405', t: 'تلفن ثابت', k: 'P03', v: tel.v, u: tel.u, d: `${dlt(kv('CRA57-FIXEDTEL-GROWTH'), true, 2)} سالانه · نفوذ ${F.p(kv('CRA57-FIXEDTEL-PEN'))}`, st: C.dim, viz: VZ.ring(kv('CRA57-FIXEDTEL-PEN'), C.mut, {center: '', label: 'ضریب نفوذ تلفن ثابت'})})}
    </div>
    <!--NIN-->
    ${SEC(4, 'دسترسی و زیرساخت', 'نقشه استانی، سیگنال‌های محاسبه‌شده و نبض اپراتورها')}
    <div class="g">
      ${panel('c6', 'PROVINCIAL ACCESS · 1405.06', 'نقشه دسترسی ثابت استانی', 'رنگ هر استان بر اساس شاخص انتخابی است. روی استان بزنید تا نیم‌رخ آن در بخش «استان‌ها» باز شود.',
        `<div class="tools"><div class="seg" id="cmdMapSeg"></div></div><div class="ch" id="cmdMap"></div><div class="ramp" id="cmdRamp"></div>`, `${B.wb}<span>فقط شرکت‌های فایل Port FCP/UNSP؛ کل بازار نیست</span>`)}
      ${panel('c3', 'SIGNALS · ' + ALERTS.length, 'سیگنال‌های فرماندهی', 'از داده محاسبه شده‌اند ولی آستانه مصوب ندارند؛ شدت، داوری تحلیلی رادار است. برای جزئیات بزنید.', `<div class="alerts" id="alerts"></div>`)}
      ${panel('c3', 'OPERATOR PULSE', 'نبض سه اپراتور', 'سهم پهن‌باند سیار، پوشش 4G، سهم سایت 5G و سرعت 4G در بهار ۱۴۰۵. هر گروه مقیاس خودش را دارد: سهم‌ها و پوشش روی ۰ تا ۱۰۰٪ و سرعت نسبت به سریع‌ترین اپراتور؛ عدد واقعی کنار هر میله آمده است.', `<div class="ch" id="cmdOps"></div>${legend(OPS.map((o) => [o, C.op[o]]))}`, B.off)}
    </div>
    ${SEC(5, 'روندها', 'پهن‌باند سیار، جابه‌جایی فناوری‌های ثابت و ترافیک')}
    <div class="g">
      ${panel('c5', 'MOBILE BROADBAND · 24Q', 'پهن‌باند سیار، ۲۴ فصل', `شکاف اپراتور سوم در شش سال بسته نشده: رایتل ${F.sp(M.mob.since['رایتل'], 0)} و همراه اول ${F.sp(M.mob.since['همراه اول'], 0)} از تابستان ۱۳۹۹.`, `<div class="ch" id="cmdMob"></div>`, B.off)}
      ${panel('c4', 'FIXED SHIFT · YoY', 'جابه‌جایی فناوری‌های ثابت در یک سال', `XDSL <b>${F.big(-M.fixed.techs[1].d)}</b> مشترک از دست داد و FTTx <b>${F.big(M.fixed.techs[0].d)}</b> گرفت.`, `<div class="ch" id="cmdShift"></div>`, B.off)}
      ${panel('c3', 'TRAFFIC · Q2-1405', 'ترافیک داده: داخلی و بین‌الملل', `مجموع ${F.n(r1(M.traffic.tot / 1e9))} اگزابایت در تابستان ۱۴۰۵.`, `<div class="ch" id="cmdTraffic"></div>${legend([['داخلی', C.teal], ['بین‌الملل', C.amber]])}`, B.wb)}
    </div>
    ${SEC(6, 'سکوها، شواهد و تصمیم', 'آمار ناشر، شواهد پژوهشی و سازوکارهای پیشنهادی (مصوب نیستند)')}
    <div class="g">
      ${panel('c4', 'PLATFORMS · H1-1405', 'سکوهای داخلی: محتوا در برابر دیده‌شدن', `ایتا بیشترین محتوا را تولید کرده ولی سهم بازدیدش ${F.p(M.plat[1].vShare)} است.`, `<div class="ch" id="cmdPlat"></div>`, B.usr)}
      ${panel('c4', 'EVIDENCE · ' + D.evidence.length, 'نقشه حرارتی شواهد پژوهشی', 'تعداد شاهد به تفکیک حوزه و سطح اعتبار. بیشترین شواهد در تاب‌آوری و زیرساخت است.', `<div class="ch" id="cmdHeat"></div>`, B.res)}
      ${panel('c4', 'S01 → S02', 'سازوکارهای نارضایتی و اقدام پیشنهادی', 'شش سازوکار، اولویت و دروازه تصمیم. هیچ‌کدام مصوب نیستند.', `<div id="cmdMech" class="alerts" style="max-height:330px"></div>`, B.res)}
    </div>`;
  },
  draw: () => {

    // alerts
    $('#alerts').innerHTML = ALERTS.map((a, i) => `<button type="button" class="al" data-i="${i}" style="--sev:${C.sev[a.sev]}"><i></i><div><b>${esc(a.t)}</b><span>${esc(a.s)}</span><em>${esc(a.code)}</em></div></button>`).join('');
    $$('#alerts .al').forEach((b) => b.onclick = () => go(ALERTS[+b.dataset.i].view));
    // map
    const metrics = [['fthI', 'پورت FTTH منصوبه'], ['fthU', 'دایر/منصوبه FTTH ٪'], ['bb', 'پهن‌باند ثابت دایر'], ['fibShare', 'سهم فیبر ٪'], ['lteShare', 'سهم TD-LTE ٪']];
    const seg = $('#cmdMapSeg');
    seg.innerHTML = metrics.map(([k, n]) => `<button data-k="${k}" aria-pressed="${k === STATE.cmdMap}">${n}</button>`).join('');
    $$('button', seg).forEach((b) => b.onclick = () => { STATE.cmdMap = b.dataset.k; V.command.draw(); });
    drawProvMap($('#cmdMap'), STATE.cmdMap, $('#cmdRamp'), 440, (iso) => { STATE.prov = iso; go('provinces'); });
    // ops radar-ish grouped bars
    const ops = M.ops;
    K.hbar($('#cmdOps'), [
      {l: 'سهم پهن‌باند', items: OPS.map((o) => ({n: o, v: M.mob.share[o], c: C.op[o], t: F.p(M.mob.share[o])}))},
      {l: 'پوشش 4G', items: ops.map((o) => ({n: o.name, v: o.coverage4g, c: C.op[o.name], t: F.p(o.coverage4g)}))},
      {l: 'سهم سایت 5G', items: ops.map((o) => ({n: o.name, v: o.sites5g / d3.sum(ops, (q) => q.sites5g) * 100, c: C.op[o.name], t: F.i(o.sites5g) + ' سایت'}))},
      {l: 'سرعت 4G', items: ops.map((o) => ({n: o.name, v: o.ping4g / d3.max(ops, (q) => q.ping4g) * 100, c: C.op[o.name], t: F.n(o.ping4g) + ' Mbps'}))},
    ], {bar: 11, gap: 2, gp: 14, max: 100});
    // mobile 24Q
    K.line($('#cmdMob'), {xs: M.mob.periods, h: 270, series: OPS.map((o) => ({name: o, c: C.op[o], vals: M.mob.values.map((r) => r[opIdx(o)] / 1e6), w: 2.2})),
      yMin: 0, yfmt: (v) => F.n(v), endfmt: (v) => F.n(r1(v)) + 'M', tfmt: (v) => F.n(Math.round(v * 100) / 100) + ' میلیون', xlab: xlabYear, xtip: per});
    // shift
    drawShift($('#cmdShift'));
    // traffic
    K.hbar($('#cmdTraffic'), [{k: 'اینترنت ثابت', o: M.traffic.fix}, ...M.traffic.ops.map((x) => ({k: x.o, o: x}))].map((r) => ({l: r.k, items: [
      {n: 'داخلی', v: r.o.domestic / 1e9, c: C.teal, t: F.n(r1(r.o.domestic / 1e9)) + ' EB'},
      {n: 'بین‌الملل', v: r.o.international / 1e9, c: C.amber, t: F.n(r1(r.o.international / 1e9)) + ' EB'}]})), {bar: 11, gap: 2, gp: 14});
    // platforms bubble
    K.bubble($('#cmdPlat'), M.plat.filter((p) => p.vShare != null).map((p) => ({n: p.n, x: p.cShare, y: p.vShare, r: p.views, c: C.plat[p.k],
      tip: [{t: 'سهم محتوا: ' + F.p(p.cShare)}, {t: 'سهم بازدید: ' + F.p(p.vShare)}, {t: 'بازدید: ' + F.n(p.views) + ' میلیارد'}, {t: 'بازدید هر محتوا: ' + F.i(p.vpc)}]})),
      {h: 290, xmax: 50, ymax: 95, xfmt: (v) => F.n(v) + '٪', yfmt: (v) => F.n(v) + '٪', xname: 'سهم محتوا ←', yname: 'سهم بازدید', diag: true, rmax: 40});
    // heat
    const lv = ['primary', 'qualified', 'attributed', 'secondary', 'user', 'disputed', 'modeled'];
    const th = Object.keys(THEME_FA).filter((t) => D.evidence.some((e) => e.th === t));
    K.heat($('#cmdHeat'), th.map((t) => ({k: t, n: THEME_FA[t]})), lv.map((l) => ({k: l, n: LEVEL_FA[l]})), (r, c) => D.evidence.filter((e) => e.th === r.k && e.lv === c.k).length, {cell: 26, color: C.violet, click: (r) => { STATE.evTheme = r.k; go('research'); }});
    // mechanisms
    $('#cmdMech').innerHTML = D.bridge.map((b) => `<button type="button" class="al" style="--sev:${b.priority === 'P0' ? C.red : b.priority === 'P1' ? C.amber : C.ice}" data-go="decision"><i></i><div><b>${esc(b.mechanism_id)} · ${esc(b.title)} <span class="prio ${esc(b.priority)}">${esc(b.priority)}</span></b><span>${esc(b.proposed_action)}</span></div></button>`).join('');
  },
};

/* operator scorecard metrics: [key, label, direction, formatter] */
const MB_ROWS = () => [['active', 'خطوط فعال', 1, F.i], ['sites4g', 'سایت فعال 4G', 1, F.i], ['sites5g', 'سایت فعال 5G', 1, F.i], ['coverage2g', 'پوشش جمعیتی 2G', 1, F.p], ['coverage3g', 'پوشش جمعیتی 3G', 1, F.p], ['coverage4g', 'پوشش جمعیتی 4G', 1, F.p], ['cities4g', 'شهرهای دارای 4G', 1, F.i], ['villages', 'روستای تحت پوشش', 1, F.i], ['roadKm', 'جاده تحت پوشش (کیلومتر)', 1, F.i],
      ['ping3g', 'سرعت دانلود 3G (Mbps)', 1, F.n], ['ping4g', 'سرعت دانلود 4G (Mbps)', 1, F.n], ['success3g', 'برقراری موفق داده 3G', 1, F.p], ['success4g', 'برقراری موفق داده 4G', 1, F.p], ['drop3g', 'قطعی داده 3G', -1, F.p], ['drop4g', 'قطعی داده 4G', -1, F.p], ['m2m', 'اشتراک M2M', 1, F.i], ['roamingCountries', 'کشور رومینگ', 1, F.i], ['roamingOperators', 'اپراتور رومینگ', 1, F.i]];

function drawShift(el) {
  const rows = [...M.fixed.techs.map((t) => ({n: t.k === 'FTTx' ? 'فیبر FTTx' : t.k === 'TDLTE' ? 'TD-LTE' : t.k, d: t.d, pct: t.pct, from: t.from, to: t.to, c: t.d >= 0 ? C.teal : C.red})),
    {n: 'کل ثابت', d: M.fixed.last.t - M.fixed.first.t, pct: M.fixed.totalPct, from: M.fixed.first.t, to: M.fixed.last.t, c: '#c9d3df'}];
  const h = rows.length * 36 + 18;
  const {svg, w, tip} = K.svg(el, h);
  const lw = K.measure(svg, rows.map((r) => r.n), 'l') + 14;
  const tx = rows.map((r) => (r.d > 0 ? '+' : '−') + F.big(Math.abs(r.d)));
  const vw = K.measure(svg, tx) + 10;
  const x = d3.scaleLinear([d3.min(rows, (r) => r.d), Math.max(0, d3.max(rows, (r) => r.d))], [vw, w - lw - vw]);
  svg.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', 0).attr('y2', h - 10).attr('stroke', C.line);
  rows.forEach((r, i) => {
    const y = i * 36 + 6;
    rtlText(svg.append('text').attr('class', 'l').attr('x', w).attr('y', y + 12).attr('dy', '.35em').attr('text-anchor', 'start').style('font-weight', i === rows.length - 1 ? 700 : 400).text(r.n));
    svg.append('rect').attr('x', Math.min(x(0), x(r.d))).attr('y', y).attr('width', Math.max(2, Math.abs(x(r.d) - x(0)))).attr('height', 24).attr('rx', 4).attr('fill', r.c)
      .on('mousemove', (ev) => K.show(el, tip, ev, r.n, [{t: 'بهار ۱۴۰۴: ' + F.i(r.from)}, {t: 'بهار ۱۴۰۵: ' + F.i(r.to)}, {t: 'تغییر: ' + tx[i] + ' (' + F.sp(r.pct) + ')'}])).on('mouseleave', () => K.hide(tip));
    const neg = r.d < 0;
    rtlText(svg.append('text').attr('class', 'l').attr('x', neg ? x(r.d) - 6 : x(r.d) + 6).attr('y', y + 12).attr('dy', '.35em').attr('text-anchor', neg ? 'start' : 'end').text(tx[i]));
  });
  K.srTable(el, ['فناوری', 'بهار ۱۴۰۴', 'بهار ۱۴۰۵', 'تغییر'], rows.map((r, i) => [r.n, F.i(r.from), F.i(r.to), tx[i] + ' (' + F.sp(r.pct) + ')']));
}

const PROV_METRICS = {
  fthI: {n: 'پورت FTTH منصوبه', f: F.big, c1: C.amber}, fthA: {n: 'پورت FTTH دایر', f: F.big, c1: C.teal}, fthU: {n: 'دایر/منصوبه FTTH', f: (v) => F.p(v), c1: C.teal, max: 20},
  bb: {n: 'پهن‌باند ثابت دایر', f: F.big, c1: C.ice, log: true}, xA: {n: 'XDSL دایر', f: F.big, c1: '#ff8a5c', log: true}, lteA: {n: 'TD-LTE دایر', f: F.big, c1: C.ice, log: true},
  fibShare: {n: 'سهم فیبر از ثابت', f: (v) => F.p(v), c1: C.teal}, lteShare: {n: 'سهم TD-LTE از ثابت', f: (v) => F.p(v), c1: C.ice}, telA: {n: 'تلفن ثابت دایر', f: F.big, c1: C.mut, log: true},
};
function drawProvMap(el, key, rampEl, h, click, sel) {
  const m = PROV_METRICS[key];
  const P = Object.fromEntries(M.prov.map((p) => [p.iso, p]));
  const res = K.map(el, {h, sel, val: (iso) => (P[iso] ? (RATIO_KEYS[key] && !ratioOk(P[iso], key) ? null : P[iso][key]) : null), name: (iso) => (P[iso] ? P[iso].n : iso), c1: m.c1, log: m.log, max: m.max,
    tip: (iso) => { const p = P[iso]; if (!p) return [{t: 'بدون داده'}]; return [{c: m.c1, t: m.n + ': ' + (RATIO_KEYS[key] && !ratioOk(p, key) ? 'معنادار نیست (پایه کمتر از ۱٬۰۰۰ پورت یا داده ناسازگار)' : m.f(p[key]))}, {t: 'FTTH: ' + F.i(p.fthA) + ' از ' + F.i(p.fthI)}, {t: 'XDSL دایر: ' + F.i(p.xA)}, {t: 'TD-LTE دایر: ' + F.i(p.lteA)}].concat(p.flag && p.flag !== 'بدون فیبر در فایل' ? [{t: '⚠ ' + p.flag}] : []); },
    click, labels: 0, lab: m.f});
  if (rampEl) rampEl.innerHTML = `<span>${m.log ? 'مقیاس لگاریتمی · ' : ''}${esc(m.n)}</span><span>${m.f(m.log ? Math.max(1, res.mn) : res.mn)}</span><div class="bar" style="background:linear-gradient(270deg,#1a2533,${m.c1})"></div><span>${m.f(res.mx)}</span>`;
}

/* ---------------- FIXED ---------------- */
V.fixed = {
  title: 'ثابت و فیبر', code: 'FIXED · FIBER',
  html: () => {
    const fbb = bp(kv('CRA57-FIXBB-1405')), hh = bp(M.fiber.hh);
    return `
    <div class="vhead"><div><div class="code">FIXED ACCESS · CRA57 P3 · P4 · P22 · P23 · P28</div><h2>دسترسی ثابت و فیبر نوری</h2>
    <p>پایه ثابت در یک سال ${F.sp(M.fixed.totalPct)} کوچک شده. اشتراک FTTx ${F.sp(M.fiber.subsYoY)} رشد کرده و افزایش خالص آن کمتر از کاهش خالص XDSL بوده است. داده تجمیعی فصلنامه نشان نمی‌دهد مشترکان XDSL به فیبر رفته‌اند یا از شبکه ثابت خارج شده‌اند؛ برای این داوری داده جریان مشترک (churn) لازم است.</p></div></div>
    <div class="strip">
      ${kpiTile({rid: 'CRA57-FIXBB-1405', t: 'اشتراک پهن‌باند ثابت', k: 'P03', v: fbb.v, u: fbb.u, d: `${dlt(kv('CRA57-FIXBB-GROWTH'), true, 2)} · نفوذ ${F.p(kv('CRA57-FIXBB-PEN'))}`, st: C.red, spark: VZ.spark(D.fixedQ.map((q) => q.t), C.red, {label: 'اشتراک پهن‌باند ثابت در پنج فصل'})})}
      ${kpiTile({t: 'خانوار زیر پوشش فیبر', k: 'P04', v: hh.v, u: hh.u, d: `${dlt(M.fiber.covYoY)} در یک سال`, st: C.teal, spark: K.spark(D.fiberCov.map((c) => c[1]), C.teal)})}
      ${kpiTile({t: 'اشتراک FTTx', k: 'P22', v: F.big(M.fiber.subs).split(' ')[0], u: F.big(M.fiber.subs).split(' ')[1], d: `${dlt(M.fiber.subsYoY)} · سهم ${F.p(kv('CRA57-FIXSHARE-FTTX'))}`, st: C.teal, spark: K.spark(D.fixedQ.map((q) => q.FTTx), C.teal)})}
      ${kpiTile({t: 'اشتراک FTTx به خانوار تحت پوشش', k: 'CALC · نسبت توصیفی', title: 'صورت و مخرج هم‌جامعه نیستند؛ نرخ تبدیل نیست', v: F.p(M.fiber.takeup), d: 'نسبت توصیفی؛ نرخ تبدیل یا شمار خانوار بدون اشتراک نیست', st: C.amber, viz: VZ.ring(M.fiber.takeup, C.amber, {center: '', label: 'اشتراک FTTx به ازای هر ۱۰۰ خانوار تحت پوشش'})})}
      ${kpiTile({rid: 'CRA57-FIXSHARE-XDSL', t: 'سهم XDSL', k: 'P23', v: F.p(kv('CRA57-FIXSHARE-XDSL')), d: `از ${F.p(M.fixed.techs[1].share0)} در بهار ۱۴۰۴ (خط سفید روی حلقه)`, st: '#ff8a5c', viz: VZ.ring(kv('CRA57-FIXSHARE-XDSL'), '#ff8a5c', {center: '', ref: M.fixed.techs[1].share0, label: 'سهم XDSL از ثابت؛ خط سفید سهم یک سال قبل'})})}
      ${kpiTile({t: 'شکایت به ازای هر هزار مشترک', k: 'P28 · CALC', v: F.n(r1(M.comp.fixbb)), d: 'پهن‌باند ثابت؛ در برابر تلفن ثابت و همراه', st: C.red, band: VZ.compare([{n: 'پهن‌باند ثابت', v: M.comp.fixbb, c: C.red, t: F.n(Math.round(M.comp.fixbb * 100) / 100)}, {n: 'تلفن ثابت', v: M.comp.fixtel, c: C.amber, t: F.n(Math.round(M.comp.fixtel * 100) / 100)}, {n: 'تلفن همراه', v: M.comp.mob, c: C.teal, t: F.n(Math.round(M.comp.mob * 1000) / 1000)}])})}
    </div>
    <div class="g">
      ${panel('c7', 'FIXED TECH · 5Q', 'ترکیب اشتراک ثابت در پنج فصل', 'ستون‌ها روی هم جمع شده‌اند. افت XDSL از زمستان ۱۴۰۴ شتاب گرفته است.', `<div class="ch" id="fxStack"></div>${legend([['FTTx', C.tech.FTTx], ['XDSL', C.tech.XDSL], ['TD-LTE', C.tech.TDLTE], ['WiFi', C.tech.WiFi]])}`, B.off)}
      ${panel('c5', 'INDEX · 1404-Q1=100', 'شاخص رشد هر فناوری', 'بالای خط ۱۰۰ یعنی رشد نسبت به بهار ۱۴۰۴.', `<div class="ch" id="fxIndex"></div>`, B.calc)}
      ${panel('c6', 'COVERAGE GAP · 10Q', 'خانوار تحت پوشش و اشتراک FTTx', 'دو سری با واحد شمارش متفاوت (خانوار و اشتراک) روی یک محورند. فاصله دو خط شمار خانوار آماده بدون اشتراک نیست، چون اشتراک FTTx غیرخانگی را هم دربر می‌گیرد و پوشش به معنای آمادگی فنی هر خانوار نیست. مقادیر ۱۴۰۳ در منبع تکراری‌اند.', `<div class="ch" id="fxGap"></div>${legend([['خانوار زیر پوشش', C.mut], ['اشتراک FTTx', C.teal]])}`, B.off)}
      ${panel('c6', 'SPEED PROFILE · 1405.06', 'توزیع سرعت سرویس به تفکیک فناوری', `${F.p(M.speed.xLe10)} سرویس‌های XDSL حداکثر ۱۰ مگابیت‌اند. ${F.p(M.speed.lte30)} TD-LTE در بازه ۳۰ تا ۱۰۰ مگ است. این‌ها سرعت سرویس فروخته‌شده است، نه سرعت اندازه‌گیری‌شده.`, `<div class="ch" id="fxSpeed"></div><div id="fxSpeedLeg"></div>`, B.wb)}
      ${panel('c6', 'PROVIDERS · FTTH', 'سهم شرکت‌ها از پورت دایر FTTH', 'در فایل Port شرکت‌های FCP/UNSP شهریور ۱۴۰۵؛ مخابرات ایران در این فایل نیست.', `<div class="ch" id="fxProvF"></div>`, B.wb)}
      ${panel('c6', 'PROVIDERS · ADSL', 'سهم شرکت‌ها از پورت دایر ADSL', 'همان فایل؛ ده شرکت اول.', `<div class="ch" id="fxProvA"></div>`, B.wb)}
      ${panel('c6', 'FIXED VOICE · CITIZEN', 'تلفن ثابت و شکایات', `تلفن ثابت ${F.sp(kv('CRA57-FIXEDTEL-GROWTH'), 2)} در یک سال. شکایت پهن‌باند ثابت ${F.i(kv('CRA57-COMP-FIXBB'))} مورد است؛ ${F.n(r1(kv('CRA57-COMP-FIXBB') / kv('CRA57-COMP-MOBILEVOICE')))} برابر شمار شکایت تلفن همراه. به ازای هر هزار مشترک این فاصله ${F.i(M.comp.fixbb / M.comp.mob)} برابر است، چون پایه مشترک ثابت بسیار کوچک‌تر است.`, `<div class="ch" id="fxComp"></div>`, B.off)}
      ${panel('c6', 'RURAL REACH', 'دسترسی روستایی و عمومی', 'روستاهای دارای ارتباط و تلفن خانگی، و زیرساخت عمومی.', `<div class="ch" id="fxRural"></div>`, B.off)}
    </div>`;
  },
  draw: () => {
    const q = D.fixedQ;
    K.vbar($('#fxStack'), {cats: q.map((x) => x.p), stacked: true, h: 280, series: [['FTTx', 'FTTx'], ['XDSL', 'XDSL'], ['TDLTE', 'TD-LTE'], ['WiFi', 'WiFi']].map(([k, n]) => ({n, c: C.tech[k], vals: q.map((x) => x[k])})),
      xlab: (c) => per(c), yfmt: F.ax, tfmt: F.i, labels: (v) => F.big(v), pad: 0.35});
    K.line($('#fxIndex'), {xs: q.map((x) => x.p), h: 280, yMin: 80, ref: 100, series: [['FTTx', 'فیبر'], ['XDSL', 'XDSL'], ['TDLTE', 'TD-LTE'], ['WiFi', 'WiFi']].map(([k, n]) => ({name: n, c: C.tech[k], vals: q.map((x) => r1(x[k] / q[0][k] * 100)), w: k === 'FTTx' || k === 'XDSL' ? 2.6 : 1.6})),
      yfmt: F.n, xlab: (p) => per(p), xtip: per});
    const cov = D.fiberCov, xs = cov.map((c) => c[0]);
    K.line($('#fxGap'), {xs, h: 280, yMin: 0, series: [{name: 'پوشش', c: C.mut, vals: cov.map((c) => c[1] / 1e6), w: 2.4, area: true}, {name: 'FTTx', c: C.teal, vals: xs.map((p) => { const r = q.find((x) => x.p === p); return r ? r.FTTx / 1e6 : null; }), w: 2.6}],
      yfmt: (v) => F.n(v), endfmt: (v) => F.n(Math.round(v * 100) / 100) + 'M', tfmt: (v) => F.n(Math.round(v * 100) / 100) + ' میلیون', xlab: xlabYear, xtip: per});
    const tk = ['XDSL', 'FTTH', 'TDLTE', 'WIFI', 'VDSL'].filter((k) => M.speed[k]);
    const bc = ['#5b2b2b', '#a8452f', '#ff8a5c', '#ffb340', '#ffe08a', '#7fd6b8', '#2fd39c'];
    K.stack100($('#fxSpeed'), tk.map((k) => ({l: TECHN[k] + ' · ' + F.big(M.speed[k].tot), parts: M.speed[k].raw.map((v, i) => ({n: D.speed.bands[i], v, c: bc[i]}))})), {bar: 22, raw: true});
    $('#fxSpeedLeg').innerHTML = legend(D.speed.bands.map((b, i) => [b, bc[i]]));
    const pv = (t) => { const L = D.providers[t] || [], tot = d3.sum(L, (x) => x[1]); return L.slice(0, 10).map((x, i) => ({l: x[0], v: x[1] / tot * 100, c: i === 0 ? C.amber : '#4a5a6e', t: F.p(x[1] / tot * 100) + ' · ' + F.big(x[1])})); };
    K.hbar($('#fxProvF'), pv('FTTH'), {bar: 15, gp: 7});
    K.hbar($('#fxProvA'), pv('ADSL'), {bar: 15, gp: 7});
    K.hbar($('#fxComp'), [
      {l: 'پهن‌باند ثابت', v: M.comp.fixbb, c: C.red, t: F.n(Math.round(M.comp.fixbb * 100) / 100) + ' در هزار · ' + F.i(kv('CRA57-COMP-FIXBB'))},
      {l: 'تلفن ثابت', v: M.comp.fixtel, c: C.amber, t: F.n(Math.round(M.comp.fixtel * 100) / 100) + ' در هزار · ' + F.i(kv('CRA57-COMP-FIXTEL'))},
      {l: 'تلفن همراه', v: M.comp.mob, c: C.teal, t: F.n(Math.round(M.comp.mob * 1000) / 1000) + ' در هزار · ' + F.i(kv('CRA57-COMP-MOBILEVOICE'))}], {bar: 20, gp: 12});
    K.unitGroups($('#fxRural'), [['CRA57-RURAL-CONN', 'روستای دارای ارتباط'], ['CRA57-RURAL-TELE', 'روستای دارای تلفن خانگی'], ['CRA57-PUBLIC-PHONE', 'تلفن همگانی'], ['CRA57-POSTAL-OFFICE', 'دفاتر پیشخوان'], ['CRA57-SAT-VSAT', 'پایانه VSAT'], ['CRA57-ICT-RURAL', 'دفاتر ICT روستایی'], ['CRA57-ROAD-GSM', 'تلفن همگانی جاده‌ای']].map(([id, n], i) => ({l: n, v: kv(id), u: KPI[id].u, c: i < 2 ? C.ice : '#6a7d93'})));
  },
};

/* ---------------- MOBILE ---------------- */
V.mobile = {
  title: 'شبکه سیار', code: 'MOBILE',
  html: () => {
    const mob = bp(kv('CRA57-MOB-1405')), g5 = bp(M.gen.g5), m2m = bp(d3.sum(M.ops, (o) => o.m2m)), s4 = d3.sum(M.ops, (o) => o.sites4g), vo = bp(kv('CRA57-VOICE-TOTAL'));
    return `
    <div class="vhead"><div><div class="code">MOBILE · CRA57 P3 · P5 · P10–P13 · P24–P27</div><h2>شبکه سیار و اپراتورها</h2>
    <p>همراه اول و ایرانسل ${F.p(M.mob.share['همراه اول'] + M.mob.share['ایرانسل'])} پهن‌باند سیار را دارند. 5G با ${F.p(M.gen.g5 / M.gen.t * 100)} اشتراک‌ها هنوز حاشیه‌ای است و ${F.p((M.ops[0].sites5g + M.ops[1].sites5g) / d3.sum(M.ops, (o) => o.sites5g) * 100)} سایت‌هایش در اختیار دو اپراتور اول.</p></div></div>
    <div class="strip">
      ${kpiTile({rid: 'CRA57-MOB-1405', t: 'خطوط فعال', k: 'P03', v: mob.v, u: mob.u, d: `${dlt(kv('CRA57-MOB-GROWTH'), true, 2)} · نفوذ ${F.p(kv('CRA57-MOB-PEN'))}`, st: C.teal, band: VZ.meter(kv('CRA57-MOB-PEN'), 200, C.teal, {ref: 100, refLabel: 'یک خط برای هر نفر', label: 'ضریب نفوذ ' + F.p(kv('CRA57-MOB-PEN')), caption: '<span>نفوذ روی ۰ تا ۲۰۰٪؛ خط سفید = ۱۰۰٪</span>'})})}
      ${kpiTile({der: 1, t: 'پهن‌باند سیار', k: 'P25', v: bp(M.mob.total).v, u: bp(M.mob.total).u, d: `${dlt(M.mob.yoy)} سالانه`, st: C.teal, spark: K.spark(M.mob.values.map((r) => r.reduce((a, b) => a + b, 0)), C.teal)})}
      ${kpiTile({rid: 'CRA57-MOBBB-5G', t: 'اشتراک 5G', k: 'P25', v: g5.v, u: g5.u, d: `${F.p(M.gen.g5 / M.gen.t * 100)} از پهن‌باند سیار`, st: C.violet, viz: VZ.ring(M.gen.g5 / M.gen.t * 100, C.violet, {label: 'سهم 5G از پهن‌باند سیار'})})}
      ${kpiTile({der: 1, t: 'سایت فعال 4G', k: 'P26', v: F.i(s4), d: `5G: ${F.i(d3.sum(M.ops, (o) => o.sites5g))} سایت`, st: C.ice, band: VZ.split(M.ops.map((o) => ({n: o.name, v: o.sites4g, c: C.op[o.name]})))})}
      ${kpiTile({der: 1, t: 'اشتراک M2M', k: 'P26', v: m2m.v, u: m2m.u, d: 'سهم اپراتورها از اشتراک M2M', st: C.amber, band: VZ.split(M.ops.map((o) => ({n: o.name, v: o.m2m || 0, c: C.op[o.name]})))})}
      ${kpiTile({t: 'مکالمه ماهانه هر کاربر', k: 'P05', v: F.n(kv('CRA57-VOICE-AVG')), u: 'دقیقه', d: `پیامک: ${F.n(kv('CRA57-SMS-AVG'))} در ماه`, st: C.dim})}
    </div>
    <div class="g">
      ${panel('c8', 'MOBILE BROADBAND · 24Q', 'اشتراک پهن‌باند سیار به تفکیک اپراتور', 'از تابستان ۱۳۹۹ تا بهار ۱۴۰۵. روی نمودار حرکت کنید تا مقدار هر فصل را ببینید.', `<div class="seg" id="mbMode"><button data-m="abs" aria-pressed="${STATE.mbMode === 'abs'}">تعداد</button><button data-m="share" aria-pressed="${STATE.mbMode === 'share'}">سهم بازار</button></div><div class="ch" id="mbLine"></div>`, B.off)}
      ${panel('c4', 'GENERATIONS', 'ترکیب نسل‌ها در پهن‌باند سیار', '4G ستون اصلی شبکه است.', `<div class="ch" id="mbGen"></div>${legend([['3G', C.mut], ['4G', C.ice], ['5G', C.violet]])}`, B.off)}
      ${panel('c5', 'OPERATOR PROFILE', 'نیم‌رخ مقایسه‌ای اپراتورها', 'هر محور نسبت به بهترین اپراتور در همان شاخص نرمال شده. برای قطعی، مقدار کمتر بهتر است و معکوس شده.', `<div class="ch" id="mbRadar"></div>${legend(OPS.map((o) => [o, C.op[o]]))}`, B.calc)}
      ${panel('c7', 'MARKET SHARES · P11–P13', 'سهم بازار در خدمات مختلف', 'مکالمه، پیامک، M2M، سایت 4G و پهن‌باند در بهار ۱۴۰۵.', `<div class="ch" id="mbShares"></div>${legend(OPS.map((o) => [o, C.op[o]]))}`, B.off)}
      ${panel('c12', 'SCORECARD · ' + MB_ROWS().length + ' METRICS', 'کارنامه کامل سه اپراتور', 'هر ردیف یک سنجه است و جای هر نقطه درصدی از مقدار بهترین اپراتور در همان سنجه (برای قطعی، که کمتر بهتر است، نسبت بهترین به مقدار اپراتور). نقطه‌های نزدیک یعنی تفاوت واقعی کوچک است؛ عدد دقیق با نگه‌داشتن نشانگر یا در نمای جدول دیده می‌شود.', `<div class="tools"><div class="seg" id="mbView" role="group" aria-label="نمایش کارنامه"><button data-m="dots" aria-pressed="true">نمای تصویری</button><button data-m="table" aria-pressed="false">جدول</button></div>${legend(OPS.map((o) => [o, C.op[o]]))}</div><div class="ch" id="mbDots"></div><div class="tbox" id="mbTable" hidden></div>`, B.off + `<span>«خطوط فعال» در این جدول تعریف فصلنامه ۵۷ رگولاتوری است. اپراتور در گزارش سالانه خود تعریف دیگری دارد؛ برای نمونه همراه اول در گزارش مجمع ۱۴۰۴، ${F.n(75.9)} میلیون «مشترک فعال» اعلام کرده (<a href="#" data-rk="res:OP-MCI-SUBS">res:OP-MCI-SUBS</a>). این دو عدد با هم مقایسه یا جایگزین نمی‌شوند.</span>`)}
    </div>`;
  },
  draw: () => {
    const share = STATE.mbMode === 'share';
    K.line($('#mbLine'), {xs: M.mob.periods, h: 320, series: OPS.map((o) => ({name: o, c: C.op[o], w: 2.4, area: o === 'همراه اول',
      vals: M.mob.values.map((r) => (share ? r[opIdx(o)] / r.reduce((a, b) => a + b, 0) * 100 : r[opIdx(o)] / 1e6))})),
      yMin: 0, yfmt: (v) => (share ? F.n(v) + '٪' : F.n(v)), endfmt: (v) => (share ? F.p(v) : F.n(r1(v)) + 'M'), tfmt: (v) => (share ? F.p(v, 2) : F.n(Math.round(v * 100) / 100) + ' میلیون'), xlab: xlabYear, xtip: per});
    $$('#mbMode button').forEach((b) => b.onclick = () => { STATE.mbMode = b.dataset.m; $$('#mbMode button').forEach((x) => x.setAttribute('aria-pressed', x === b)); V.mobile.draw(); });
    K.donut($('#mbGen'), [{n: '3G', v: M.gen.g3, c: C.mut}, {n: '4G', v: M.gen.g4, c: C.ice}, {n: '5G', v: M.gen.g5, c: C.violet}], {h: 230, center: [F.p(M.gen.g4 / M.gen.t * 100), 'سهم 4G']});
    const ax = [['coverage4g', 'پوشش 4G', 1], ['coverage3g', 'پوشش 3G', 1], ['sites4g', 'سایت 4G', 1], ['sites5g', 'سایت 5G', 1], ['villages', 'روستا', 1], ['roadKm', 'جاده', 1], ['ping4g', 'سرعت 4G', 1], ['success4g', 'موفقیت 4G', 1], ['drop4g', 'قطعی 4G', -1], ['roamingCountries', 'رومینگ', 1]];
    K.radar($('#mbRadar'), ax.map(([k, n]) => ({n, max: 1, fmt: F.n})), M.ops.map((o) => ({n: o.name, c: C.op[o.name], raw: ax.map(([k]) => o[k]),
      vals: ax.map(([k, , d]) => { const vs = M.ops.map((q) => q[k]); return d > 0 ? o[k] / Math.max(...vs) : Math.min(...vs) / o[k]; })})), {h: 330});
    const sh = [['VOICE', 'مکالمه'], ['SMS', 'پیامک'], ['M2M', 'M2M'], ['4G-SITES', 'سایت 4G']];
    const ids = {'همراه اول': 'MCI', 'ایرانسل': 'MTN', 'رایتل': 'RIGHTEL'};
    K.stack100($('#mbShares'), [{l: 'پهن‌باند سیار', parts: OPS.map((o) => ({n: o, v: M.mob.share[o], c: C.op[o]}))}, {l: 'خطوط فعال', parts: M.ops.map((o) => ({n: o.name, v: o.active, c: C.op[o.name]}))},
      ...sh.map(([k, n]) => ({l: n, parts: OPS.map((o) => ({n: o, v: kv(`CRA57-${k}-${ids[o]}`), c: C.op[o]}))}))], {bar: 22, gp: 12});
    const rows = MB_ROWS();
    K.dotrows($('#mbDots'), rows.map(([k, n, dir, f]) => ({n, dir, fmt: f, vals: M.ops.map((o) => (o[k] == null ? null : o[k]))})), M.ops.map((o) => ({n: o.name, c: C.op[o.name]})));
    $$('#mbView button').forEach((b) => b.onclick = () => { const t = b.dataset.m === 'table'; $$('#mbView button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $('#mbTable').hidden = !t; $('#mbDots').hidden = t; });
    const cell = (v, best, worst, dir, f) => { if (v == null) return '<td>—</td>'; const k = best === worst ? 1 : dir > 0 ? (v - worst) / (best - worst) : (worst - v) / (worst - best); const col = d3.interpolateRgb('#3a1f22', '#12372c')(k); return `<td><span class="hm" style="background:${col}">${f(v)}</span></td>`; };
    $('#mbTable').innerHTML = `<table class="t"><thead><tr><th>شاخص</th>${M.ops.map((o) => `<th style="color:${C.op[o.name]}">${o.name}</th>`).join('')}<th>برتر</th></tr></thead><tbody>${rows.map(([k, n, d, f]) => { const vs = M.ops.map((o) => o[k]).filter((v) => v != null); const best = d > 0 ? Math.max(...vs) : Math.min(...vs), worst = d > 0 ? Math.min(...vs) : Math.max(...vs); const w = M.ops.find((o) => o[k] === best); return `<tr><td>${n}</td>${M.ops.map((o) => cell(o[k], best, worst, d, f)).join('')}<td style="color:${C.op[w.name]}">${w.name}</td></tr>`; }).join('')}</tbody></table>`;
  },
};

/* ---------------- QUALITY & TRAFFIC ---------------- */
V.quality = {
  title: 'کیفیت و ترافیک', code: 'QoS · TRAFFIC',
  html: () => `
    <div class="vhead"><div><div class="code">QUALITY · CRA57 P14 · P15 · P27 · MONITORING Q2-1405 · TIC</div><h2>کیفیت شبکه، تأخیر و ترافیک</h2>
    <p>${F.p(M.traffic.intlShare)} ترافیک داده تابستان ۱۴۰۵ به مقصد خارجی رفته و مسیر بین‌الملل ${F.n(r1(M.lat.fi - M.lat.fd))} میلی‌ثانیه به تأخیر ثابت اضافه می‌کند. مصرف هر مشترک ثابت حدود ${F.n(Math.round(M.traffic.gbFix))} گیگابایت در ماه است، در برابر ${F.n(Math.round(M.traffic.gbMob))} گیگابایت برای هر مشترک پهن‌باند سیار.</p></div></div>
    <div class="strip">
      ${kpiTile({t: 'کل ترافیک سه‌ماهه', k: 'Q2 · WB', v: F.n(r1(M.traffic.tot / 1e9)), u: 'اگزابایت', d: `داخلی ${F.n(r1(M.traffic.dom / 1e9))} · بین‌الملل ${F.n(r1(M.traffic.intl / 1e9))} اگزابایت`, st: C.amber, band: VZ.split([{n: 'بین‌الملل', v: M.traffic.intl, c: C.amber}, {n: 'داخلی', v: M.traffic.dom, c: C.teal}])})}
      ${kpiTile({t: 'سهم بین‌الملل', k: 'Q2 · WB', v: F.p(M.traffic.intlShare), d: 'سهم بین‌الملل در هر شبکه', st: C.amber, band: VZ.compare([{n: 'سیار', v: M.traffic.mobIntl, c: C.amber, t: F.p(M.traffic.mobIntl)}, {n: 'ثابت', v: M.traffic.fixIntl, c: '#c98a2e', t: F.p(M.traffic.fixIntl)}])})}
      ${kpiTile({t: 'مصرف ماهانه هر مشترک ثابت', k: 'CALC', v: F.i(M.traffic.gbFix), u: 'GB', d: 'ترافیک تابستان بر مشترک بهار؛ تقریبی', st: C.ice, band: VZ.compare([{n: 'ثابت', v: M.traffic.gbFix, c: C.ice, t: F.i(M.traffic.gbFix) + 'GB'}, {n: 'سیار', v: M.traffic.gbMob, c: C.mut, t: F.i(M.traffic.gbMob) + 'GB'}])})}
      ${kpiTile({t: 'مصرف ماهانه هر مشترک سیار', k: 'CALC', v: F.i(M.traffic.gbMob), u: 'GB', d: 'ترافیک تابستان بر مشترک بهار؛ تقریبی', st: C.ice, band: VZ.compare([{n: 'سیار', v: M.traffic.gbMob, c: C.ice, t: F.i(M.traffic.gbMob) + 'GB'}, {n: 'ثابت', v: M.traffic.gbFix, c: C.mut, t: F.i(M.traffic.gbFix) + 'GB'}])})}
      ${kpiTile({rid: 'CRA57-RTT-fixed-domestic', t: 'RTT ثابت داخلی', k: 'P14', v: F.n(M.lat.fd), u: 'ms', d: 'کوتاه‌تر بهتر', st: C.teal, band: VZ.compare([{n: 'داخلی', v: M.lat.fd, c: C.teal, t: F.n(M.lat.fd) + 'ms'}, {n: 'بین‌الملل', v: M.lat.fi, c: C.mut, t: F.n(M.lat.fi) + 'ms'}])})}
      ${kpiTile({t: 'RTT سیار بین‌الملل', k: 'P14', v: F.n(M.lat.mi), u: 'ms', d: `jitter ${F.n(M.lat.jmi)}ms · کوتاه‌تر بهتر`, st: C.red, band: VZ.compare([{n: 'بین‌الملل', v: M.lat.mi, c: C.red, t: F.n(M.lat.mi) + 'ms'}, {n: 'داخلی', v: M.lat.md, c: C.mut, t: F.n(M.lat.md) + 'ms'}])})}
    </div>
    <div class="g">
      ${panel('c6', 'TRAFFIC MIX · Q2-1405', 'ترافیک داخلی و بین‌الملل به تفکیک شبکه', 'اگزابایت در سه ماه. در هر چهار شبکه، بخش بین‌الملل بزرگ‌تر است.', `<div class="ch" id="qTraffic"></div>${legend([['داخلی', C.teal], ['بین‌الملل', C.amber]])}`, B.wb)}
      ${panel('c6', 'LATENCY MATRIX · P14', 'ماتریس تأخیر و نوسان تأخیر', 'میلی‌ثانیه. RTT و jitter هر دو برای سیار بیشترند؛ jitter سیار داخلی ' + F.n(r1(M.lat.jmd / M.lat.jfd)) + ' برابر ثابت است.', `<div class="ch" id="qLat"></div>${legend([['ثابت', C.teal], ['سیار', C.ice]])}`, B.off)}
      ${panel('c6', 'DATA QoS · Q1 vs Q2', 'سرعت دانلود 4G: فصلنامه بهار و پایش تابستان', 'دو منبع با روش متفاوت؛ مقایسه مستقیم آن‌ها فقط جهت را نشان می‌دهد.', `<div class="ch" id="qSpeed"></div>${legend([['فصلنامه ۵۷ · بهار', '#4a5a6e'], ['پایش · تابستان', C.amber]])}`, B.off + B.wb)}
      ${panel('c6', 'RELIABILITY', 'برقراری موفق و قطعی سرویس داده', 'فصلنامه ۵۷، بهار ۱۴۰۵. همه اپراتورها بالای ۹۷٪ برقراری موفق دارند؛ تفاوت اصلی در 3G ایرانسل است.', `<div class="ch" id="qRel"></div>`, B.off)}
      ${panel('c7', 'BACKBONE · TIC · 9Q', 'کیفیت ستون فقرات شبکه (TIC)', `RTT شبکه مادر در ۹ فصل ${F.sp(M.ticChg)} تغییر کرده. اتلاف بسته در پاییز ۱۴۰۴ جهش داشته که در منبع داده پرت علامت خورده.`, `<div class="seg" id="ticSeg"><button data-k="rtt" aria-pressed="${STATE.tic === 'rtt'}">RTT</button><button data-k="plr" aria-pressed="${STATE.tic === 'plr'}">اتلاف بسته</button><button data-k="jitter" aria-pressed="${STATE.tic === 'jitter'}">Jitter</button></div><div class="ch" id="qTic"></div>`, B.res)}
      ${panel('c5', 'VOICE QoS · Q2', 'کیفیت مکالمه در پایش تابستان', 'برقراری موفق و قطعی مکالمه به تفکیک نسل.', `<div class="ch" id="qVoice"></div>`, B.wb)}
    </div>`,
  draw: () => {
    const rows = [{k: 'اینترنت ثابت', o: M.traffic.fix}, ...M.traffic.ops.map((x) => ({k: x.o, o: x}))];
    K.vbar($('#qTraffic'), {cats: rows.map((r) => r.k), h: 270, series: [{n: 'داخلی', c: C.teal, vals: rows.map((r) => r.o.domestic / 1e9)}, {n: 'بین‌الملل', c: C.amber, vals: rows.map((r) => r.o.international / 1e9)}],
      yfmt: (v) => F.n(v), tfmt: (v) => F.n(Math.round(v * 100) / 100) + ' EB', pad: 0.3});
    K.hbar($('#qLat'), [['RTT داخلی', 'rtt', 'domestic'], ['RTT بین‌الملل', 'rtt', 'international'], ['Jitter داخلی', 'jitter', 'domestic'], ['Jitter بین‌الملل', 'jitter', 'international']].map(([l, mt, r]) => ({l, items: ['fixed', 'mobile'].map((n) => { const v = D.latency.find((x) => x.metric === mt && x.network === n && x.route === r).value; return {n: n === 'fixed' ? 'ثابت' : 'سیار', v, c: n === 'fixed' ? C.teal : C.ice, t: F.n(v) + ' ms'}; })})), {bar: 14, gap: 3, gp: 14});
    const q2 = (op, met) => { const r = D.qualityQ2.find((x) => x.metric.includes(met) && x.operator.replace('ي', 'ی') === op.replace('ي', 'ی')); return r ? r.value : null; };
    K.hbar($('#qSpeed'), M.ops.map((o) => ({l: o.name, items: [{n: 'بهار · فصلنامه', v: o.ping4g, c: '#4a5a6e', t: F.n(o.ping4g) + ' Mbps'}, {n: 'تابستان · پایش', v: q2(o.name, 'نسل چهارم'), c: C.amber, t: F.n(q2(o.name, 'نسل چهارم')) + ' Mbps'}]})), {bar: 15, gap: 3, gp: 16});
    K.hbar($('#qRel'), M.ops.flatMap((o) => [{l: o.name + ' · 3G', items: [{n: 'قطعی', v: o.drop3g, c: C.red, t: F.p(o.drop3g, 2) + ' قطعی'}, {n: 'عدم برقراری', v: 100 - o.success3g, c: C.amber, t: F.p(100 - o.success3g, 2) + ' ناموفق'}]}, {l: o.name + ' · 4G', items: [{n: 'قطعی', v: o.drop4g, c: C.red, t: F.p(o.drop4g, 2) + ' قطعی'}, {n: 'عدم برقراری', v: 100 - o.success4g, c: C.amber, t: F.p(100 - o.success4g, 2) + ' ناموفق'}]}]), {bar: 10, gap: 2, gp: 10});
    const k = STATE.tic;
    K.line($('#qTic'), {xs: M.tic.map((t) => `${t.year}-Q${t.quarter}`), h: 250, yMin: 0, series: [{name: k === 'rtt' ? 'RTT' : k === 'plr' ? 'اتلاف بسته' : 'Jitter', c: k === 'plr' ? C.red : C.violet, vals: M.tic.map((t) => t[k]), w: 2.6, area: true}], marks: M.tic.map((t, i) => (t.outlier ? {i, t: 'منبع این فصل را «داده پرت» علامت زده؛ نمایش داده می‌شود ولی در روند به آن تکیه نکنید'} : null)).filter(Boolean),
      yfmt: (v) => F.n(k === 'plr' ? +v.toFixed(3) : +v.toFixed(2)), xlab: (p) => per(p), xtip: per, endfmt: (v) => F.n(+v.toFixed(3)) + (k === 'plr' ? '٪' : 'ms')});
    $$('#ticSeg button').forEach((b) => b.onclick = () => { STATE.tic = b.dataset.k; render(); });
    const vq = D.qualityQ2.filter((x) => x.metric.includes('صوت'));
    const ops = [...new Set(vq.map((x) => x.operator + ' · ' + x.dimension))];
    K.hbar($('#qVoice'), ops.map((od) => { const [op, dim] = od.split(' · '); const s = vq.find((x) => x.operator === op && x.dimension === dim && x.metric.includes('موفقیت')); const d = vq.find((x) => x.operator === op && x.dimension === dim && x.metric.includes('قطعی')); return {l: od.replace('ايرانسل', 'ایرانسل'), items: [{n: 'ناموفق', v: s ? 100 - s.value : 0, c: C.amber, t: s ? F.p(100 - s.value, 2) + ' ناموفق' : 'ناموجود'}, {n: 'قطعی', v: d ? d.value : 0, c: C.red, t: d ? F.p(d.value, 2) + ' قطعی' : 'ناموجود'}]}; }), {bar: 11, gap: 2, gp: 10});
  },
};

/* ratio metrics need a usable base; same rule as M.provT.fthUBase */
const RATIO_KEYS = {fthU: 'fthI', xU: 'xI'};
const ratioOk = (p, key) => p[RATIO_KEYS[key]] >= 1000 && !(key === 'fthU' && p.flag && p.flag !== 'بدون فیبر در فایل');
/* ---------------- PROVINCES ---------------- */
V.provinces = {
  title: 'استان‌ها', code: 'PROVINCES',
  html: () => `
    <div class="vhead"><div><div class="code">PROVINCIAL · PORT & SPEED · FCP/UNSP · 1405.06</div><h2>نقشه استانی دسترسی ثابت</h2>
    <p><span class="scope">دامنه: فایل پورت و سرعت شرکت‌های FCP/UNSP، شهریور ۱۴۰۵؛ مخابرات ایران و کل بازار را نمی‌پوشاند و آمار ملی نیست.</span> در این فایل از ${F.big(M.provT.fthI)} پورت FTTH منصوبه ${F.p(M.provT.fthU)} دایر ثبت شده و نسبت دایر به منصوبه در XDSL ${F.p(M.provT.xU)} است. تهران ${F.p(M.provT.tehShareI)} پورت‌های فیبر را دارد. ${F.i(M.provT.flags)} استان داده ناسازگار دارند.</p></div></div>
    <div class="g">
      ${panel('c8', 'CHOROPLETH', 'نقشه شاخص استانی', 'شاخص را انتخاب کنید و روی استان بزنید.', `<div class="tools"><div class="seg" id="pvSeg"></div></div><div class="mapwrap"><div><div class="ch" id="pvMap"></div><div class="ramp" id="pvRamp"></div></div><div id="pvCard"></div></div>`, B.wb + '<span>فقط شرکت‌های فایل Port FCP/UNSP؛ مخابرات ایران و کل بازار را نمی‌پوشاند</span>')}
      ${panel('c4', 'RANKING', 'رتبه‌بندی استان‌ها', 'بر اساس شاخص انتخاب‌شده روی نقشه.', `<div class="ch" id="pvRank" style="max-height:640px;overflow:auto"></div>`)}
      ${panel('c12', 'ALL PROVINCES', 'جدول کامل ۳۱ استان', 'برای مرتب‌سازی روی عنوان ستون بزنید. خانه‌های رنگی نسبت به بیشینه همان ستون‌اند.', `<div class="tools"><input class="search" id="pvQ" placeholder="جست‌وجوی استان…"></div><div class="tbox" id="pvTable"></div>`, B.wb)}
    </div>`,
  draw: () => {
    const seg = $('#pvSeg');
    seg.innerHTML = Object.entries(PROV_METRICS).map(([k, m]) => `<button data-k="${k}" aria-pressed="${k === STATE.pvMap}">${m.n}</button>`).join('');
    $$('button', seg).forEach((b) => b.onclick = () => { STATE.pvMap = b.dataset.k; V.provinces.draw(); });
    const sel = STATE.prov || 'IR-07';
    drawProvMap($('#pvMap'), STATE.pvMap, $('#pvRamp'), 520, (iso) => { STATE.prov = iso; V.provinces.draw(); }, sel);
    const m = PROV_METRICS[STATE.pvMap];
    const ranked = M.prov.filter((p) => p[STATE.pvMap] != null && (!RATIO_KEYS[STATE.pvMap] || ratioOk(p, STATE.pvMap))).sort((a, b) => b[STATE.pvMap] - a[STATE.pvMap]);
    K.hbar($('#pvRank'), ranked.map((p) => ({l: p.n, v: p[STATE.pvMap], c: p.iso === sel ? C.amber : m.c1, o: p.iso === sel ? 1 : 0.55, t: m.f(p[STATE.pvMap])})), {bar: 12, gp: 7});
    const p = M.prov.find((x) => x.iso === sel);
    const rk = (k) => { const r = M.prov.filter((x) => x[k] != null).sort((a, b) => b[k] - a[k]); return r.findIndex((x) => x.iso === sel) + 1; };
    $('#pvCard').innerHTML = `<div class="pcard"><h4>${esc(p.n)}</h4>${p.flag ? `<span class="badge usr">${esc(p.flag)}</span>` : ''}
      ${[['پورت FTTH منصوبه', F.i(p.fthI), 'fthI'], ['پورت FTTH دایر', F.i(p.fthA), 'fthA'], ['دایر/منصوبه FTTH', F.p(p.fthU), 'fthU'], ['XDSL دایر', F.i(p.xA), 'xA'], ['دایر/منصوبه XDSL', F.p(p.xU), 'xU'], ['TD-LTE دایر', F.i(p.lteA), 'lteA'], ['WiFi دایر', F.i(p.wA), 'wA'], ['پهن‌باند ثابت دایر', F.i(p.bb), 'bb'], ['سهم فیبر', F.p(p.fibShare), 'fibShare'], ['تلفن ثابت دایر', F.i(p.telA), 'telA']]
        .map(([n, v, k]) => `<div class="row"><span>${n}</span><b class="num">${v} <span class="rank">#${F.i(rk(k))}</span></b></div>`).join('')}
      <div class="ch" id="pvMix"></div><div class="foot">سهم استان از کل پهن‌باند ثابت فایل: ${F.p(p.bb / M.provT.bb * 100)}</div></div>`;
    K.stack100($('#pvMix'), [{l: 'ترکیب', parts: [{n: 'FTTH', v: p.fthA, c: C.tech.FTTH}, {n: 'XDSL', v: p.xA, c: C.tech.XDSL}, {n: 'TD-LTE', v: p.lteA, c: C.tech.TDLTE}, {n: 'WiFi', v: p.wA, c: C.tech.WiFi}]}], {bar: 18, raw: true});
    // table
    const cols = [['n', 'استان'], ['fthI', 'FTTH منصوبه'], ['fthA', 'FTTH دایر'], ['fthU', 'دایر/منصوبه FTTH'], ['xA', 'XDSL دایر'], ['xU', 'دایر/منصوبه XDSL'], ['lteA', 'TD-LTE دایر'], ['wA', 'WiFi دایر'], ['bb', 'پهن‌باند ثابت'], ['fibShare', 'سهم فیبر'], ['telA', 'تلفن ثابت'], ['flag', 'وضعیت داده']];
    const mx = Object.fromEntries(cols.map(([k]) => [k, d3.max(M.prov, (r) => (typeof r[k] === 'number' ? r[k] : 0))]));
    const drawT = () => {
      const q = ($('#pvQ').value || '').trim();
      const {k, dir} = STATE.pvSort;
      const rows = M.prov.filter((r) => !q || r.n.includes(q)).sort((a, b) => { const A = a[k], B2 = b[k]; if (A == null) return 1; if (B2 == null) return -1; return typeof A === 'string' ? dir * A.localeCompare(B2, 'fa') : dir * (A - B2); });
      $('#pvTable').innerHTML = `<table class="t"><thead><tr>${cols.map(([c, n]) => `<th scope="col" data-k="${c}" tabindex="0" aria-sort="${c === k ? (dir > 0 ? 'ascending' : 'descending') : 'none'}">${n}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr style="${r.iso === sel ? 'outline:1px solid var(--amber)' : ''}">${cols.map(([c]) => {
        const v = r[c];
        if (c === 'n') return `<td><b>${esc(v)}</b></td>`;
        if (c === 'flag') return `<td style="color:${v && v !== 'بدون فیبر در فایل' ? 'var(--red)' : 'var(--dim)'}">${esc(v || 'عادی')}</td>`;
        const isP = c.endsWith('U') || c.endsWith('Share');
        return `<td>${v == null ? '—' : isP ? F.p(v) : F.i(v)}<div class="cbar"><i style="width:${v ? Math.max(2, v / mx[c] * 100) : 0}%"></i></div></td>`;
      }).join('')}</tr>`).join('')}</tbody></table>`;
      $$('#pvTable th').forEach((th) => { const go = () => { const kk = th.dataset.k; STATE.pvSort = {k: kk, dir: STATE.pvSort.k === kk ? -STATE.pvSort.dir : kk === 'n' ? 1 : -1}; drawT(); }; th.onclick = go; th.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const kk = th.dataset.k; go(); const again = $(`#pvTable th[data-k="${kk}"]`); if (again) again.focus(); } }; });
    };
    $('#pvQ').oninput = drawT;
    drawT();
  },
};

/* ---------------- PLATFORMS ---------------- */
V.platforms = {
  title: 'سکوهای داخلی', code: 'PLATFORMS',
  html: () => {
    const tc = D.plat.records.find((r) => r.metric === 'کل محتوای پنج سکو');
    return `
    <div class="vhead"><div><div class="code">DOMESTIC PLATFORMS · NCC H1-1405 · MORDAD REPORT · ANA/YJC</div><h2>سکوها و پیام‌رسان‌های داخلی</h2>
    <p>${F.n(tc.value)} میلیون محتوا در شش‌ماهه نخست ۱۴۰۵ تولید شده. طبق آمار ناشر، سهم روبیکا از محتوا ${F.p(M.plat[0].cShare)} و از بازدید ${F.p(M.plat[0].vShare)} است و بازدید به ازای هر محتوایش ${F.n(r1(M.platX))} برابر ایتاست. تعریف «بازدید» میان سکوها یکسان‌سازی نشده و «ضریب نفوذ» ویراستی با بازدید جمع نمی‌شود. در تابستان، فعالیت ایتا، بله و ویراستی ماه‌به‌ماه کم شده است.</p></div></div>
    <div class="strip" data-n="5">${M.plat.map((p) => kpiTile({t: p.n, k: p.k, ev: 'usr', title: 'آمار ناشر (مرکز ملی فضای مجازی، متن ارائه‌شده کاربر). تعریف «بازدید» میان سکوها یکسان‌سازی نشده و «ضریب نفوذ» ویراستی بازدید نیست.', v: F.n(p.content), u: 'میلیون محتوا', d: `${p.views != null ? F.n(p.views) + ' میلیارد بازدید' : 'بازدید قابل‌مقایسه ندارد'} · ${F.n(p.channels)} هزار کانال`, st: C.plat[p.k], viz: VZ.ring(p.cShare, C.plat[p.k], {ref: p.vShare, label: 'سهم محتوا ' + F.p(p.cShare) + (p.vShare != null ? '؛ خط سفید سهم بازدید ' + F.p(p.vShare) : '')})})).join('')}</div>
    <div class="g">
      ${panel('c6', 'CONTENT vs ATTENTION', 'سهم محتوا در برابر سهم بازدید', 'اندازه حباب = بازدید کل. بالای خط چین یعنی بیش از سهم محتوا دیده شده.', `<div class="ch" id="plBubble"></div>`, B.usr)}
      ${panel('c6', 'EFFICIENCY', 'بازدید هر محتوا و محتوای هر کانال', 'دو معیار کارایی که در گزارش منتشر شده‌اند.', `<div class="ch" id="plEff"></div>${legend([['بازدید / محتوا', C.amber], ['محتوا / کانال', C.ice]])}`, B.usr)}
      ${panel('c6', 'FORMATS', 'ترکیب قالب محتوا: خبر، تحلیل، غیرخبری', 'سهم از محتوای هر سکو.', `<div class="ch" id="plFmt"></div>${legend([['خبر', C.ice], ['تحلیل و اظهارنظر', C.amber], ['غیرخبری', C.violet]])}`, B.usr)}
      ${panel('c6', 'SUMMER TREND', 'روند ماهانه خرداد تا مرداد ۱۴۰۵', 'حجم محتوا (میلیون) در گزارش مرداد.', `<div class="seg" id="plMoSeg"><button data-k="حجم محتوا" aria-pressed="${STATE.plMo === 'حجم محتوا'}">محتوا</button><button data-k="کانال / صفحه فعال" aria-pressed="${STATE.plMo === 'کانال / صفحه فعال'}">کانال فعال</button><button data-k="بازدید" aria-pressed="${STATE.plMo === 'بازدید'}">بازدید</button></div><div class="ch" id="plMo"></div>`, B.usr)}
      ${panel('c6', 'THEMES · MORDAD', 'محورهای موضوعی مرداد', 'سهم محورهای چهارگانه در ایتا، بله و ویراستی.', `<div class="ch" id="plTheme"></div>`, B.usr)}
      ${panel('c6', 'QUALITATIVE', 'جهت‌گیری محتوایی هر سکو', 'خلاصه کیفی گزارش شش‌ماهه.', `<div class="evl" id="plQual" style="max-height:340px"></div>`, B.usr)}
    </div>`;
  },
  draw: () => {
    K.bubble($('#plBubble'), M.plat.filter((p) => p.vShare != null).map((p) => ({n: p.n, x: p.cShare, y: p.vShare, r: p.views, c: C.plat[p.k], tip: [{t: 'سهم محتوا: ' + F.p(p.cShare)}, {t: 'سهم بازدید: ' + F.p(p.vShare)}, {t: 'بازدید: ' + F.n(p.views) + ' میلیارد'}]})),
      {h: 320, xmax: 50, ymax: 95, xfmt: (v) => F.n(v) + '٪', yfmt: (v) => F.n(v) + '٪', xname: 'سهم محتوا ←', yname: 'سهم بازدید', diag: true, rmax: 46});
    K.hbar($('#plEff'), M.plat.map((p) => ({l: p.n, items: [{n: 'بازدید/محتوا', v: p.vpc || 0, c: C.amber, t: p.vpc ? F.i(p.vpc) : '—'}, {n: 'محتوا/کانال', v: p.cpc || 0, c: C.ice, t: p.cpc ? F.i(p.cpc) : '—'}]})), {bar: 13, gap: 3, gp: 14});
    K.stack100($('#plFmt'), M.plat.filter((p) => p.news != null).map((p) => ({l: p.n, parts: [{n: 'خبر', v: p.news, c: C.ice}, {n: 'تحلیل', v: p.analysis, c: C.amber}, {n: 'غیرخبری', v: p.nonnews, c: C.violet}]})), {bar: 22});
    const mo = D.mordad.records.filter((r) => r.group === 'monthly' && r.metric === STATE.plMo);
    const months = ['خرداد ۱۴۰۵', 'تیر ۱۴۰۵', 'مرداد ۱۴۰۵'];
    const pls = [...new Set(mo.map((r) => r.platform))];
    const scale = (r) => (r.unit.startsWith('هزار') && STATE.plMo === 'حجم محتوا' ? r.value / 1000 : r.value);
    K.vbar($('#plMo'), {cats: months, h: 260, series: pls.map((pl) => ({n: PLAT[pl], c: C.plat[pl], vals: months.map((mm) => { const r = mo.find((x) => x.platform === pl && x.period === mm); return r ? scale(r) : null; })})), yfmt: F.n, tfmt: (v) => F.n(v) + (STATE.plMo === 'بازدید' ? ' میلیارد' : STATE.plMo === 'حجم محتوا' ? ' میلیون' : ' هزار'), pad: 0.25});
    $('#plMo').insertAdjacentHTML('beforeend', legend(pls.map((pl) => [PLAT[pl], C.plat[pl]])));
    $$('#plMoSeg button').forEach((b) => b.onclick = () => { STATE.plMo = b.dataset.k; render(); });
    const th = D.mordad.records.filter((r) => r.group === 'themes' && ['فرهنگی–اجتماعی', 'نظامی–امنیتی', 'اقتصادی', 'سیاسی–دیپلماتیک'].includes(r.metric));
    const tc = {'فرهنگی–اجتماعی': C.teal, 'نظامی–امنیتی': C.red, 'اقتصادی': C.amber, 'سیاسی–دیپلماتیک': C.ice};
    K.stack100($('#plTheme'), [...new Set(th.map((r) => r.platform))].map((pl) => ({l: PLAT[pl], parts: Object.keys(tc).map((t) => ({n: t, v: (th.find((r) => r.platform === pl && r.metric === t) || {}).value || 0, c: tc[t]}))})), {bar: 24});
    $('#plTheme').insertAdjacentHTML('beforeend', legend(Object.entries(tc)));
    $('#plQual').innerHTML = D.plat.qual.map((q) => `<div class="ev"><div><b style="color:${C.plat[q.platform]}">${esc(PLAT[q.platform])} · ${esc(q.axes)}</b><small>${esc(q.subtopics)}</small><small style="color:var(--mut)">${esc(q.trend)}</small></div></div>`).join('');
  },
};

/* ---------------- RESEARCH & RESILIENCE ---------------- */
V.research = {
  title: 'تاب‌آوری و پژوهش', code: 'RESEARCH',
  html: () => `
    <div class="vhead"><div><div class="code">RESILIENCE · EVIDENCE · ${D.evidence.length} ITEMS · NOT Q5</div><h2>تاب‌آوری، دسترسی و شواهد پژوهشی</h2>
    <p>این بخش داده رسمی نیست؛ شواهد پژوهشی، بین‌المللی و پیمایشی است که هیچ‌کدام پذیرش Q5 ندارند. سطح اعتبار هر شاهد کنار آن آمده و نباید با شاخص‌های رسمی جمع یا مقایسه مستقیم شوند.</p></div></div>
    <div class="g">
      ${panel('c7', 'TOR · JUN–JUL 2025', 'کاربران تخمینی پل Tor در اختلال خرداد ۱۴۰۴', 'سری روزانه کاربران تخمینی پل (نه کاربران مستقیم). افت ۱۹ و ۲۰ ژوئن هم‌زمان با اختلال گزارش‌شده در منابع دیگر است؛ این سری به‌تنهایی اختلال را اثبات نمی‌کند و ۲۷ ژوئن داده ندارد.', `<div class="ch" id="rsTor"></div>`, B.res)}
      ${panel('c5', 'SURVEY · MELLAT 21921', 'تجربه کاربر در پیمایش ملت', 'هر عدد مخرج و پرسش خودش را دارد.', `<div class="ch" id="rsSurvey"></div>`, B.res)}
      ${panel('c5', 'INTERNATIONAL', 'مقایسه‌های بین‌المللی (ITU و منابع دیگر)', 'سال ۲۰۲۴ و ۲۰۲۵؛ برای سنجش جایگاه، نه داده فصلی.', `<div class="ch" id="rsHist"></div>`, B.res)}
      ${panel('c7', 'EVIDENCE BROWSER', 'مرورگر ' + F.i(D.evidence.length) + ' شاهد پژوهشی', 'حوزه را انتخاب کنید یا جست‌وجو کنید.', `<div class="tools"><div class="seg" id="rsSeg"></div><input class="search" id="rsQ" placeholder="جست‌وجو در عنوان، منبع، جامعه…"></div><div class="evl" id="rsList"></div>`, B.res)}
    </div>`,
  draw: () => {
    const tor = TOR_DAILY;
    K.line($('#rsTor'), {xs: tor.map((t) => t.date), h: 290, yMin: 0, series: [{name: 'کاربران تخمینی پل Tor', c: C.violet, vals: tor.map((t) => t.users), w: 2.4, area: true}], yfmt: F.ax, tfmt: F.i, endfmt: F.i,
      xlab: (d, i) => (i % 5 === 0 || i === tor.length - 1 ? fa2en(d).slice(5).replace('-', '/') : ''), xtip: (d) => d});
    K.hbar($('#rsSurvey'), D.survey.map((s) => ({l: s.title, v: s.value, c: C.violet, t: F.p(s.value)})), {max: 100, bar: 16, gp: 12});
    const hs = D.hist.filter((h) => h.numeric_value != null && h.dossier_id !== 'T02');
    const hn = {'4g_population_coverage': 'پوشش جمعیتی 4G', '5g_population_coverage': 'پوشش جمعیتی 5G', internet_users: 'کاربران اینترنت', mobile_broadband_subscriptions_per_100: 'پهن‌باند سیار در هر ۱۰۰ نفر', data_only_5gb_affordability: 'هزینه ۵GB داده ٪ درآمد'};
    K.unitGroups($('#rsHist'), hs.map((h) => ({l: (hn[h.metric_id] || h.metric_id) + ' · ' + h.period_label, v: h.numeric_value, c: C.ice, u: h.unit === 'percent' ? 'درصد' : h.unit === 'per_100' ? 'در هر ۱۰۰ نفر' : 'درصد درآمد ناخالص ملی (GNI)'})));
    const th = ['all', ...Object.keys(THEME_FA).filter((t) => D.evidence.some((e) => e.th === t))];
    $('#rsSeg').innerHTML = th.map((t) => `<button data-t="${t}" aria-pressed="${t === STATE.evTheme}">${t === 'all' ? 'همه' : THEME_FA[t]} · ${F.i(t === 'all' ? D.evidence.length : D.evidence.filter((e) => e.th === t).length)}</button>`).join('');
    $$('#rsSeg button').forEach((b) => b.onclick = () => { STATE.evTheme = b.dataset.t; V.research.draw(); });
    const drawL = () => {
      const q = ($('#rsQ').value || '').trim();
      const L = D.evidence.filter((e) => (STATE.evTheme === 'all' || e.th === STATE.evTheme) && (!q || [e.t, e.s, e.pop, e.p].join(' ').includes(q)));
      const pctU = (e) => typeof e.v === 'number' && /٪|درصد|percent/.test(String(e.u || '')) && e.v >= 0 && e.v <= 100;
      $('#rsList').innerHTML = L.map((e) => `<div class="ev evlink" role="button" tabindex="0" data-rk="res:${esc(e.id)}" title="شناسنامه شاهد"><div><b>${esc(e.t)}</b><small>${esc(THEME_FA[e.th] || e.th)} · ${esc(e.s)} · ${esc(e.p)} · ${esc(LEVEL_FA[e.lv] || e.lv)}</small><small>${esc(e.pop)}</small></div><div class="val num">${e.v == null ? '—' : esc(typeof e.v === 'number' ? F.n(e.v) : e.v)} <small>${esc(e.u || '')}</small>${pctU(e) ? VZ.meter(e.v, 100, C.violet, {label: F.p(e.v)}) : ''}</div></div>`).join('') || '<p class="lead">موردی پیدا نشد.</p>';
    };
    $('#rsQ').oninput = drawL; drawL();
    $('#rsList').onclick = (ev) => { const r = ev.target.closest('[data-rk]'); if (r) DETAIL.open(r.dataset.rk); };
    $('#rsList').onkeydown = (ev) => { const r = ev.target.closest('[data-rk]'); if (r && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); DETAIL.open(r.dataset.rk); } };
  },
};

/* ---------------- DECISION ROOM ---------------- */
V.decision = {
  title: 'اتاق تصمیم', code: 'DECISION',
  html: () => `
    <div class="vhead"><div><div class="code">S01 MECHANISMS → S02 ACTIONS · DRAFT · NOT APPROVED</div><h2>اتاق تصمیم: از سازوکار نارضایتی تا اقدام</h2>
    <p>شش سازوکار پیشنهادی که شواهد کاربر را به شواهد فنی وصل می‌کنند. اقدام‌ها پیش‌نویس‌اند؛ مالک قانونی، بودجه و KPI هدف هنوز تأیید نشده‌اند.</p></div></div>
    <div class="g">
      ${panel('c7', 'ROADMAP · 365 DAYS', 'نقشه راه پیشنهادی شش سازوکار', 'هر ردیف یک سازوکار و هر بلوک یک مرحله در افق ۳۰، ۹۰، ۱۸۰ و ۳۶۵ روز. نشانگر را روی بلوک نگه دارید تا شرح مرحله دیده شود؛ روی ردیف بزنید تا کارت آن سازوکار باز شود. هیچ مرحله‌ای مصوب نیست.', `<div class="ch" id="dcRoad"></div>`, B.res)}
      ${panel('c5', 'READINESS', 'آمادگی تصمیم: چه چیزی هنوز نیست؟', 'هر خانه از فیلدهای همان سازوکار خوانده شده است: سبز یعنی موجود، کهربایی یعنی در انتظار تأیید و قرمز یعنی ثبت نشده.', `<div class="ch" id="dcReady"></div><div class="legend"><span><i style="background:${C.teal}"></i>موجود</span><span><i style="background:${C.amber}"></i>در انتظار</span><span><i style="background:${C.red}"></i>ثبت نشده</span></div>`, B.calc)}
    </div>
    <div class="mech">${D.bridge.map((b) => `<article class="mc" id="mc-${esc(b.mechanism_id)}"><div class="top"><span class="id">${esc(b.mechanism_id)}</span><span class="prio ${esc(b.priority)}">${esc(b.priority)}</span></div><h4>${esc(b.title)}</h4>
      <p><b style="color:var(--fg)">اقدام پیشنهادی:</b> ${esc(b.proposed_action)}</p>
      <p><b style="color:var(--fg)">محدودیت:</b> ${esc(b.limitation)}</p>
      <p><b style="color:var(--fg)">دروازه تصمیم:</b> ${CODE(b.decision_gate)}</p>
      <p><b style="color:var(--fg)">ریسک اصلی:</b> ${esc(b.principal_risk)}</p>
      <div class="tl"><div><b>۳۰ روز</b>${esc(b.timeline_30_days)}</div><div><b>۹۰ روز</b>${esc(b.timeline_90_days)}</div><div><b>۱۸۰ روز</b>${esc(b.timeline_180_days)}</div><div><b>۳۶۵ روز</b>${esc(b.timeline_365_days)}</div></div>
      <div class="foot"><span class="badge res">${CODE(b.comparability_gate)}</span>${b.user_evidence_id ? `<span class="badge">${esc(b.user_evidence_id)}</span>` : ''}${(b.technical_evidence_ids || []).map((x) => `<span class="badge">${esc(x)}</span>`).join('')}</div></article>`).join('')}</div>
    <div class="g">${panel('c12', 'DATA AUDIT', 'یافته‌های ممیزی داده', 'مواردی که پیش از استفاده رسمی باید رفع شوند.', `<div class="evl">${D.audit.map((a) => `<div class="ev"><div><b>${esc(a.id)} · ${esc(a.severity)}</b><small style="color:var(--mut)">${esc(a.finding)}</small></div></div>`).join('')}</div>`)}</div>`,
  draw: () => {
    const B2 = D.bridge, pc = (b) => (b.priority === 'P0' ? C.red : b.priority === 'P1' ? C.amber : C.ice);
    const openMc = (b) => { const c = $('#mc-' + b.mechanism_id); if (c) { c.scrollIntoView({behavior: 'smooth', block: 'center'}); c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 1600); } };
    /* roadmap: time runs right→left (RTL), log-like spacing so the 30-day step stays readable */
    (() => {
      const el = $('#dcRoad'), rh = 38, top = 28, h = top + B2.length * rh + 8, {svg, w, tip} = K.svg(el, h);
      const lw = Math.min(K.measure(svg, B2.map((b) => b.mechanism_id + ' · ' + b.title), 'l') + 16, w * 0.32), X0 = w - lw - 6, X1 = 6;
      const ph = [['timeline_30_days', 0, 30], ['timeline_90_days', 30, 90], ['timeline_180_days', 90, 180], ['timeline_365_days', 180, 365]];
      const T = (d) => X0 - (Math.sqrt(d) / Math.sqrt(365)) * (X0 - X1);
      [0, 30, 90, 180, 365].forEach((d) => { svg.append('line').attr('class', 'gl').attr('x1', T(d)).attr('x2', T(d)).attr('y1', top - 6).attr('y2', h - 4); svg.append('text').attr('x', T(d)).attr('y', 14).attr('text-anchor', 'middle').style('font-size', '10.5px').text(d ? F.i(d) + ' روز' : 'امروز'); });
      B2.forEach((b, i) => {
        const y = top + i * rh;
        const row = svg.append('g').style('cursor', 'pointer').on('click', () => openMc(b));
        row.append('rect').attr('x', 0).attr('y', y).attr('width', w).attr('height', rh).attr('fill', i % 2 ? 'transparent' : 'rgba(255,255,255,.02)');
        rtlText(row.append('text').attr('class', 'l').attr('x', w - 4).attr('y', y + rh / 2).attr('dy', '.35em').attr('text-anchor', 'start').style('font-size', '11.5px').text(b.mechanism_id + ' · ' + b.title));
        ph.forEach(([k, a, z], j) => {
          const x = T(z), wd = T(a) - T(z) - 3;
          row.append('rect').attr('x', x + 1.5).attr('y', y + 8).attr('width', Math.max(4, wd)).attr('height', rh - 16).attr('rx', 5).attr('fill', pc(b)).attr('opacity', 0.9 - j * 0.17)
            .on('mousemove', (ev) => K.show(el, tip, ev, b.mechanism_id + ' · ' + (a ? F.i(a) + ' تا ' : 'تا ') + F.i(z) + ' روز', [{t: b[k]}, {t: 'اولویت ' + b.priority + ' · پیش‌نویس، مصوب نیست'}])).on('mouseleave', () => K.hide(tip));
          if (wd > 46) rtlText(row.append('text').attr('x', x + wd / 2).attr('y', y + rh / 2).attr('dy', '.35em').attr('text-anchor', 'middle').style('font-size', '10px').style('fill', j < 2 ? INK(pc(b)) : '#eef3f8').style('pointer-events', 'none').text(['تعریف', 'پایلوت', 'ارزیابی', 'تداوم'][j]));
        });
      });
      K.srTable(el, ['سازوکار', '۳۰ روز', '۹۰ روز', '۱۸۰ روز', '۳۶۵ روز'], B2.map((b) => [b.mechanism_id + ' · ' + b.title, b.timeline_30_days, b.timeline_90_days, b.timeline_180_days, b.timeline_365_days]));
    })();
    /* readiness matrix */
    (() => {
      const cols = [
        ['شاهد کاربر', (b) => (b.user_evidence_id ? ['ok', b.user_evidence_id] : ['no', 'ثبت نشده'])],
        ['شاهد فنی', (b) => ((b.technical_evidence_ids || []).length ? ['ok', F.i(b.technical_evidence_ids.length) + ' شاهد'] : ['no', 'ثبت نشده'])],
        ['هم‌دوره', (b) => (/^SAME/.test(b.comparability_gate || '') ? ['ok', CODE_FA.fa(b.comparability_gate)] : ['wait', CODE_FA.fa(b.comparability_gate || '—')])],
        ['مالک', (b) => (b.owner && !/NOT_VALIDATED|PENDING/.test(b.owner) ? ['ok', b.owner] : ['wait', CODE_FA.fa(b.owner || 'ثبت نشده')])],
        ['خط پایه', (b) => (b.baseline_kpi != null ? ['ok', String(b.baseline_kpi)] : ['no', 'ثبت نشده'])],
        ['هدف KPI', (b) => (b.target_kpi != null ? ['ok', String(b.target_kpi)] : ['no', 'ثبت نشده'])],
        ['بودجه', (b) => (b.budget != null ? ['ok', String(b.budget)] : ['no', 'ثبت نشده'])],
        ['ریسک', (b) => (/VALIDATED$/.test(b.risk_assessment_status || '') && !/NOT/.test(b.risk_assessment_status) ? ['ok', ''] : ['wait', CODE_FA.fa(b.risk_assessment_status || '—')])],
        ['تصویب', (b) => (/APPROVED$/.test(b.action_status || '') && !/NOT/.test(b.action_status) ? ['ok', ''] : ['wait', CODE_FA.fa(b.action_status || '—')])],
      ];
      const el = $('#dcReady'), ch = 30, top = 40, h = top + B2.length * ch + 6, {svg, w, tip} = K.svg(el, h);
      const lw = K.measure(svg, B2.map((b) => b.mechanism_id), 'l') + 14, cw = (w - lw - 4) / cols.length;
      const col = {ok: C.teal, wait: C.amber, no: C.red}, sym = {ok: '✓', wait: '…', no: '✕'};
      cols.forEach(([n], j) => { const x = w - lw - j * cw - cw / 2, t = rtlText(svg.append('text').attr('text-anchor', 'middle').style('font-size', '10px')), ws = n.split(' '); ws.forEach((wd, k) => t.append('tspan').attr('x', x).attr('y', top - 8 - (ws.length - 1 - k) * 12).text(wd)); });
      B2.forEach((b, i) => {
        const y = top + i * ch;
        rtlText(svg.append('text').attr('class', 'l').attr('x', w).attr('y', y + ch / 2).attr('dy', '.35em').attr('text-anchor', 'start').style('font-size', '11.5px').style('cursor', 'pointer').text(b.mechanism_id).on('click', () => openMc(b)));
        cols.forEach(([n, f], j) => {
          const [st, why] = f(b), x = w - lw - (j + 1) * cw;
          svg.append('rect').attr('x', x + 2).attr('y', y + 3).attr('width', cw - 4).attr('height', ch - 6).attr('rx', 5).attr('fill', col[st]).attr('fill-opacity', st === 'ok' ? 0.85 : 0.22).attr('stroke', col[st]).attr('stroke-opacity', .7)
            .on('mousemove', (ev) => K.show(el, tip, ev, b.mechanism_id + ' · ' + n, [{c: col[st], t: {ok: 'موجود', wait: 'در انتظار', no: 'ثبت نشده'}[st] + (why ? ' · ' + why : '')}])).on('mouseleave', () => K.hide(tip)).on('click', () => openMc(b));
          svg.append('text').attr('x', x + cw / 2).attr('y', y + ch / 2).attr('dy', '.35em').attr('text-anchor', 'middle').style('font-size', '12px').style('font-weight', 700).style('fill', st === 'ok' ? INK(col[st]) : col[st]).style('pointer-events', 'none').text(sym[st]);
        });
      });
      K.srTable(el, ['سازوکار', ...cols.map((c) => c[0])], B2.map((b) => [b.mechanism_id, ...cols.map(([, f]) => { const [st, why] = f(b); return {ok: 'موجود', wait: 'در انتظار', no: 'ثبت نشده'}[st] + (why ? ' · ' + why : ''); })]));
    })();
  },
};


