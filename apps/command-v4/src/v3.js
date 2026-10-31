/* ===== v3: seven domains, information infrastructure, research registers, record detail, full explorers ===== */
/* ---------------- INFORMATION INFRASTRUCTURE ---------------- */
V.infra = {
  title: 'زیرساخت اطلاعاتی', code: 'INFORMATION LAYER',
  html: () => {
    const dc = D.infra.filter((r) => r.sec === 't08'), cl = D.infra.filter((r) => r.sec === 't09'), ix = D.infra.filter((r) => r.sec === 't06');
    const pr = cl.filter((r) => typeof r.v === 'number').map((r) => r.v).sort((a, b) => a - b);
    const med = pr.length % 2 ? pr[(pr.length - 1) / 2] : (pr[pr.length / 2 - 1] + pr[pr.length / 2]) / 2;
    const ents = [...new Set(dc.map((r) => r.ent))];
    return `
    <div class="vhead"><div><div class="code">T06 IXP · T08 DATA CENTERS · T09 CLOUD · RETRIEVED 1405-08-05</div><h2>زیرساخت اطلاعاتی: مرکز داده، ابر و تبادل ترافیک</h2>
    <p>۵۲ رکورد که در نسخه قبلی نبود. این‌ها ظرفیت اعلامی، قیمت صفحه محصول و مشخصات رجیستری‌اند، نه ظرفیت فعال یا آمار جامع کشور. ظرفیت‌های ناهم‌دامنه با هم جمع نمی‌شوند و تاریخ بازیابی، تاریخ اعتبار آماری نیست.</p></div></div>
    <div class="strip" data-n="5">
      ${kpiTile({t: 'رکورد مرکز داده', ev: 'calc', k: 'T08', v: F.i(dc.length), d: `${F.i(ents.length)} موجودیت · بدون جمع ظرفیت`, st: C.ice})}
      ${kpiTile({t: 'بسته قیمت ابر', ev: 'calc', k: 'T09', v: F.i(pr.length), d: `آروان · ثبت ۵ آبان ۱۴۰۵`, st: C.violet})}
      ${kpiTile({t: 'دامنه قیمت ماهانه', ev: 'calc', k: 'T09', v: F.n(Math.round(pr[0] / 1e4) / 100) + ' تا ' + F.n(Math.round(pr[pr.length - 1] / 1e4) / 100), u: 'میلیون تومان', d: `میانه ساده ${F.n(Math.round(med / 1e4) / 100)} میلیون؛ شاخص بازار نیست`, st: C.amber})}
      ${kpiTile({t: 'خدمت ابری فهرست‌شده', ev: 'calc', k: 'T09', v: F.i(cl.length - pr.length), d: 'آروان ۱۰ · هم‌روش ۳؛ آزمون عملیاتی نشده', st: C.teal})}
      ${kpiTile({t: 'رکورد IXP', ev: 'calc', k: 'T06', v: F.i(ix.length), d: 'رجیستری PeeringDB و دو مقدار تاریخی معلق', st: C.red})}
    </div>
    <div class="g">
      ${panel('c7', 'DATA CENTERS · T08', 'مراکز داده: ظرفیت اعلامی و تاریخی', 'هر کارت یک موجودیت است. رک‌های ۲٬۰۰۰، ۴۰۷، ۹۸۲ و ۲۰۰ از چهار جنس متفاوت‌اند و نباید جمع شوند. روی هر سنجه بزنید تا شناسنامه و محل استخراج را ببینید.', `<div class="dcg">${ents.map((e) => { const rs = dc.filter((r) => r.ent === e); return `<div class="dcc"><h4>${esc(e.replace(/_/g, ' '))}</h4>${rs.map((r) => `<button class="dcm" data-id="${esc(r.id)}"><span>${esc(r.l)}</span><b class="num">${typeof r.v === 'number' ? F.n(r.v) : esc(r.v)} <small>${CODE(r.u)}</small></b><em class="st">${CODE(r.st)}</em></button>`).join('')}</div>`; }).join('')}</div>`, B.usr)}
      ${panel('c5', 'IXP · T06', 'مراکز تبادل ترافیک', 'سه شبکه و سه اتصال فهرست‌شده در PeeringDB، تعداد اعضای واقعی یا نشست BGP نیست. «60G» برچسب دایرکتوری است و با عدد تاریخی ۳۴٬۲۰۰ گیگابیت نسبت گرفته نمی‌شود.', `<div class="evl">${ix.map((r) => `<button class="ev clkev" data-id="${esc(r.id)}"><div><b>${esc(r.raw.name || r.l)}</b><small class="mono">${esc(r.id)} · ${CODE(r.st)}</small><small style="color:var(--mut)">${esc(r.raw.scope || (r.lim || [])[0] || '')}</small></div><div class="val num">${typeof r.v === 'number' ? F.n(r.v) : esc(r.v)} <small>${CODE(r.u)}</small></div></button>`).join('')}</div>`, B.usr)}
      ${panel('c7', 'CLOUD PRICING · T09', 'قیمت بسته‌های سرور ابری آروان در برابر منابع', 'محور افقی حافظه، محور عمودی قیمت ماهانه، اندازه حباب تعداد CPU. منطقه، مالیات، سهمیه ترافیک و پشتیبانی تثبیت نشده‌اند؛ مقایسه ارزش خرید مجاز نیست.', `<div class="ch" id="ifScatter"></div>${legend([['eco', '#2fd39c'], ['g', '#78bfff'], ['c', '#ffb340'], ['m', '#b48cff'], ['ls/std', '#ff7eb6']])}`, B.usr)}
      ${panel('c5', 'PRICE TABLE', 'جدول بسته‌ها', 'قیمت فهرست صفحه محصول در تاریخ بازیابی؛ هزینه کامل (TCO) نیست و مقایسه ارزش خرید مجاز نیست. فیلتر بر اساس CPU و حافظه.', `<div class="tools"><select class="sel" id="ifCpu"><option value="">همه CPU</option><option>1</option><option>2</option><option>4</option><option>6</option></select><select class="sel" id="ifRam"><option value="">همه RAM</option><option value="1-3">۱ تا ۳ گیگ</option><option value="4-8">۴ تا ۸ گیگ</option><option value="12-24">۱۲ تا ۲۴ گیگ</option></select></div><div class="tbox" id="ifTable" style="max-height:360px"></div>`, B.usr)}
      ${panel('c12', 'SERVICE CATALOG · T09', 'شناسنامه خدمات ابری', 'وجود محصول در صفحه ارائه‌دهنده با عملکرد عملیاتی فرق دارد. CDN، DNS و لبه در حوزه خدمات پایه هم برچسب می‌خورند و لاگ ابری در امنیت؛ هر رکورد یک مالک اصلی دارد تا دوباره شمرده نشود.', `<div class="svc">${cl.filter((r) => typeof r.v !== 'number').map((r) => { const cat = r.raw.service_class_candidate || ''; const x = /cdn|dns|edge/i.test(r.id) ? 'خدمات پایه' : /logs/i.test(r.id) ? 'امنیت' : ''; return `<button class="svcc" data-id="${esc(r.id)}"><b>${esc(r.l)}</b><small class="mono">${esc(r.id)}</small><small>${esc(cat)}</small>${x ? `<span class="badge calc">برچسب متقاطع: ${x}</span>` : ''}</button>`; }).join('')}</div>`, B.usr)}
    </div>
    <div class="g">${panel('c12', 'DATA NEEDED', 'داده لازم برای کارنامه زیرساخت اطلاعاتی', 'تا رسیدن این داده‌ها، نسبت بهره‌برداری و سهم بازار مراکز داده محاسبه نمی‌شود.', `<div class="needs">${['رک نصب‌شده، روشن، اشغال‌شده و قابل فروش', 'توان برق IT و رزرو', 'PUE با دوره سنجش', 'SLA محقق‌شده', 'افزونگی برق و ارتباط', 'گواهی و دامنه اعتبار', 'ظرفیت ذخیره‌سازی و محاسبات', 'IXP: اعضای واقعی، پورت و ظرفیت فعال', 'IXP: ترافیک میانگین، اوج و صدک ۹۵', 'اتصال بین مراکز و زمان آخرین سنجش'].map((n) => `<span class="need">${n}</span>`).join('')}</div>`)}</div>`;
  },
  draw: () => {
    $$('.dcm,.clkev,.svcc').forEach((b) => b.onclick = () => DETAIL.openId(b.dataset.id));
    const pr = D.infra.filter((r) => r.sec === 't09' && typeof r.v === 'number');
    const fam = (s) => (/^eco/.test(s) ? '#2fd39c' : /^g/.test(s) ? '#78bfff' : /^c/.test(s) ? '#ffb340' : /^m/.test(s) ? '#b48cff' : '#ff7eb6');
    const el = $('#ifScatter');
    const h = 320; const {svg, w, tip} = K.svg(el, h);
    const pad = {l: 50, r: 14, t: 12, b: 34};
    const x = d3.scaleLinear([0, 26], [pad.l, w - pad.r]), y = d3.scaleLinear([0, 8.5], [h - pad.b, pad.t]);
    x.ticks(6).forEach((t) => { svg.append('line').attr('class', 'gl').attr('x1', x(t)).attr('x2', x(t)).attr('y1', pad.t).attr('y2', h - pad.b); svg.append('text').attr('x', x(t)).attr('y', h - pad.b + 14).attr('text-anchor', 'middle').text(F.n(t) + 'GB'); });
    y.ticks(5).forEach((t) => { svg.append('line').attr('class', 'gl').attr('x1', pad.l).attr('x2', w - pad.r).attr('y1', y(t)).attr('y2', y(t)); svg.append('text').attr('x', pad.l - 6).attr('y', y(t)).attr('dy', '.35em').attr('text-anchor', 'end').text(F.n(t) + 'M'); });
    pr.forEach((r, ii) => {
      const ram = r.raw.ram, cpu = r.raw.cpu_as_labelled, p = r.v / 1e6;
      svg.append('circle').attr('cx', x(ram) + ((ii % 5) - 2) * 3).attr('cy', y(p)).attr('r', 4 + cpu * 2.4).attr('fill', fam(r.l)).attr('fill-opacity', .3).attr('stroke', fam(r.l)).attr('stroke-width', 1.5).style('cursor', 'pointer')
        .on('mousemove', (ev) => K.show(el, tip, ev, r.l + ' · ' + r.id, [{t: 'CPU: ' + F.n(cpu) + ' · RAM: ' + F.n(ram) + 'GB · دیسک: ' + F.n(r.raw.disk) + 'GB'}, {t: 'قیمت ماهانه: ' + F.i(r.v) + ' تومان'}]))
        .on('mouseleave', () => K.hide(tip)).on('click', () => DETAIL.openId(r.id));
    });
    K.srTable(el, ['بسته', 'CPU', 'RAM (GB)', 'قیمت ماهانه (تومان)'], pr.map((r) => [r.l + ' · ' + r.id, F.n(r.raw.cpu_as_labelled), F.n(r.raw.ram), F.i(r.v)]));
    const drawT = () => {
      const cpu = $('#ifCpu').value, ram = $('#ifRam').value;
      const L = pr.filter((r) => (!cpu || String(r.raw.cpu_as_labelled) === cpu) && (!ram || (r.raw.ram >= +ram.split('-')[0] && r.raw.ram <= +ram.split('-')[1]))).sort((a, b) => a.v - b.v);
      $('#ifTable').innerHTML = `<table class="t clk"><thead><tr><th>بسته</th><th>CPU</th><th>RAM</th><th>دیسک</th><th>ماهانه (تومان)</th></tr></thead><tbody>${L.map((r) => `<tr data-id="${esc(r.id)}"><td><b style="color:${fam(r.l)}">${esc(r.l)}</b><br><small class="mono" style="color:var(--dim)">${esc(r.id)}</small></td><td>${F.n(r.raw.cpu_as_labelled)}</td><td>${F.n(r.raw.ram)}GB</td><td>${F.n(r.raw.disk)}GB</td><td class="num"><b>${F.i(r.v)}</b></td></tr>`).join('')}</tbody></table>`;
      $$('#ifTable tr[data-id]').forEach((tr) => tr.onclick = () => DETAIL.openId(tr.dataset.id));
    };
    $('#ifCpu').onchange = drawT; $('#ifRam').onchange = drawT; drawT();
  },
};

/* ---------------- REGISTRY: candidates, sources, relations, conflicts, gaps ---------------- */
V.registry = {
  title: 'منابع و نامزدها', code: 'REGISTERS',
  html: () => {
    const R = D.reg, cand = REC.list.filter((r) => r.coll === 'cand');
    const rel = d3.rollups(R.relations, (v) => v.length, (r) => r.relation_type).sort((a, b) => b[1] - a[1]);
    const open = R.conflicts.filter((c) => /OPEN|PENDING/i.test(c.resolution_status)).length;
    return `
    <div class="vhead"><div><div class="code">RESEARCH REGISTERS · AUDIT ${esc(D.auditMeta.date)} · ${F.i(D.auditMeta.files)} FILES</div><h2>رجیستر منابع، نامزدهای پژوهشی و تعارض‌ها</h2>
    <p>لایه‌ای که در انتقال پژوهش گم شده بود: ${F.i(cand.length)} نامزد پژوهشی و شاهد بدون نگاشت، ${F.i(R.catalog.length)} منبع در کاتالوگ، ${F.i(R.relations.length)} رابطه منبع، ${F.i(R.conflicts.length)} تعارض و ${F.i(R.gaps.length)} درخواست داده. هیچ‌کدام KPI رسمی نیستند؛ این‌جا نگه داشته می‌شوند تا قابل ردگیری بمانند، نه حذف.</p></div></div>
    <div class="strip" data-n="6">
      ${kpiTile({t: 'نامزد داده‌کاوی', ev: 'calc', k: 'DATAAK', v: F.i(D.cand.dataak.length), d: 'گزارش سالانه و ISP · روش بازتولید نشده', st: C.violet})}
      ${kpiTile({t: 'نامزد شناختیک', ev: 'calc', k: 'SHENAKHTIC', v: F.i(D.cand.shnum.length + D.cand.shclaim.length), d: `${F.i(D.cand.shnum.length)} عددی · ${F.i(D.cand.shclaim.length)} ادعا`, st: C.violet})}
      ${kpiTile({t: 'گزارش اختلال Filterwatch', ev: 'calc', k: 'FW', v: F.i(D.cand.fw.length), d: 'نیازمند نگاشت به شواهد اولیه', st: C.red})}
      ${kpiTile({t: 'کاتالوگ منابع', ev: 'calc', k: 'CATALOG', v: F.i(R.catalog.length), d: `${F.i(R.relations.length)} رابطه · ${F.i(R.sources.length)} منبع ثبت‌شده`, st: C.ice})}
      ${kpiTile({t: 'تعارض ثبت‌شده', ev: 'calc', k: 'CONFLICT', v: F.i(R.conflicts.length), d: `${F.i(open)} باز`, st: C.amber})}
      ${kpiTile({t: 'درخواست داده', ev: 'calc', k: 'DATA GAP', v: F.i(R.gaps.length), d: `${F.i(R.gaps.filter((g) => g.priority === 'P0').length)} با اولویت P0`, st: C.red})}
    </div>
    <div class="g">
      ${panel('c12', 'CANDIDATES · ' + cand.length, 'نامزدهای پژوهشی و شواهد بدون نگاشت', 'برای دیدن شناسنامه کامل، محل صفحه و محدودیت حیاتی روی ردیف بزنید. «۶۱ امتیاز» شاخص است، نه درصد افراد؛ پیش‌بینی مدل هم مشاهده تاریخی نیست.', `<div class="tools"><div class="seg" id="rgSeg"></div></div><div id="rgT"></div>`, B.res)}
      ${panel('c6', 'CONFLICTS', 'تعارض‌های ثبت‌شده میان منابع', 'تا یکسان‌سازی مخرج و دسترسی به سند اصلی، از هیچ‌کدام نتیجه‌گیری نمی‌شود.', `<div class="evl" style="max-height:440px">${R.conflicts.map((c) => `<div class="ev"><div><b>${esc(c.conflict_id)} · ${esc(c.topic)}</b><small style="color:var(--mut)">${esc(c.source_a)} ↔ ${esc(c.source_b)}</small><small>${esc(c.conflict_description)}</small><small style="color:var(--dim)">${esc(c.notes || '')}</small></div><div class="val"><span class="badge ${/OPEN/i.test(c.resolution_status) ? 'usr' : 'off'}">${CODE(c.resolution_status)}</span></div></div>`).join('')}</div>`, B.res)}
      ${panel('c6', 'DATA REQUESTS', 'درخواست‌های داده با اولویت', 'داده‌ای که برای بستن شکاف‌ها باید گردآوری یا دریافت شود.', `<div class="evl" style="max-height:440px">${R.gaps.map((g) => `<div class="ev"><div><b>${esc(g.request_id)} · ${esc(g.required_dataset)}</b><small style="color:var(--mut)">پرونده ${esc(g.dossier)} · دانه‌بندی: ${esc(g.minimum_granularity)}</small><small>دروازه: ${esc(g.verification_gate)}</small></div><div class="val"><span class="prio ${esc(g.priority)}">${esc(g.priority)}</span> <span class="badge">${CODE(g.status)}</span></div></div>`).join('')}</div>`, B.res)}
      ${panel('c5', 'SOURCE RELATIONS', 'روابط منابع: اصل، بازنشر، تحلیل مشتق', 'ملت، مرکز پژوهش‌های مجلس و بازنشر خبری سه پیمایش مستقل نیستند؛ رابطه‌ها جلوی دوباره‌شماری را می‌گیرند.', `<div class="ch" id="rgRel"></div>`, B.res)}
      ${panel('c7', 'SOURCE CATALOG · ' + R.catalog.length, 'کاتالوگ منابع', 'نقش منشأ، وضعیت احراز و مجوز ورود به داشبورد برای هر منبع.', `<div id="rgC"></div>`, B.res)}
      ${panel('c12', 'OUTAGE EVENT SCHEMA', 'قالب ثبت رخداد اختلال (ASN)', 'رخداد باید با بازه زمانی، شبکه‌های متأثر، مبنای مقایسه، تعریف ناهنجاری و تأیید مستقل ثبت شود.', `<div class="tbox"><table class="t">${Object.entries(R.outage[0] || {}).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `<tr><td class="mono" style="color:var(--mut)">${esc(k)}</td><td class="wrap">${CODE(v)}</td></tr>`).join('')}</table></div>`, B.res)}
    </div>`;
  },
  draw: () => {
    const cand = REC.list.filter((r) => r.coll === 'cand');
    const subs = ['all', ...new Set(cand.map((r) => r.sub))];
    $('#rgSeg').innerHTML = subs.map((s) => `<button data-s="${esc(s)}" aria-pressed="${s === STATE.rgSub}">${s === 'all' ? 'همه' : esc(s)} · ${F.i(s === 'all' ? cand.length : cand.filter((r) => r.sub === s).length)}</button>`).join('');
    $$('#rgSeg button').forEach((b) => b.onclick = () => { STATE.rgSub = b.dataset.s; (STATE.tbl.rg = STATE.tbl.rg || {}).p = 1; URLS.replace(true); V.registry.draw(); });
    TBL($('#rgT'), cand.filter((r) => STATE.rgSub === 'all' || r.sub === STATE.rgSub), {id: 'rg', cols: ['t', 'v', 'p', 'et', 'adm', 'src', 'lim'], ph: 'جست‌وجوی نامزد، منبع، محدودیت…'});
    const rel = d3.rollups(D.reg.relations, (v) => v.length, (r) => r.relation_type).sort((a, b) => b[1] - a[1]);
    const top = rel.slice(0, 10), rest = rel.slice(10);
    K.hbar($('#rgRel'), [...top.map(([k, v]) => ({l: CODE_FA.fa(k), v, c: C.violet, t: F.i(v)})), ...(rest.length ? [{l: F.i(rest.length) + ' نوع دیگر', v: d3.sum(rest, (x) => x[1]), c: '#4a5a6e', t: F.i(d3.sum(rest, (x) => x[1]))}] : [])], {bar: 16, gp: 8});
    const srcs = REC.list.filter((r) => r.coll === 'src');
    TBL($('#rgC'), srcs, {id: 'rc', cols: ['t', 'src', 'p', 'adm'], ph: 'جست‌وجوی منبع یا ناشر…'});
  },
};

/* ---------------- extend PLATFORMS with full 192-record explorer ---------------- */
(() => {
  const h0 = V.platforms.html, d0 = V.platforms.draw;
  V.platforms.html = () => h0() + `<div class="g">${panel('c12', 'ALL 192 RECORDS', 'همه رکوردهای سکوها', 'شش‌ماهه، مرداد و نقل تکمیلی. «ضریب نفوذ» ویراستی از «بازدید» جداست و با آن جمع یا مقایسه نمی‌شود.', `<div class="tools"><div class="seg" id="plSub"></div><div class="seg" id="plPl"></div></div><div id="plAll"></div>`, B.usr)}</div>`;
  V.platforms.draw = () => {
    d0();
    const all = REC.list.filter((r) => r.coll === 'plat');
    const subs = ['all', 'شش‌ماهه', 'مرداد', 'تکمیلی'], pls = ['all', ...Object.keys(PLAT)];
    $('#plSub').innerHTML = subs.map((s) => `<button data-s="${s}" aria-pressed="${s === STATE.plSub}">${s === 'all' ? 'همه' : s} · ${F.i(s === 'all' ? all.length : all.filter((r) => r.sub === s).length)}</button>`).join('');
    $('#plPl').innerHTML = pls.map((p) => `<button data-p="${p}" aria-pressed="${p === STATE.plPl}" style="${p !== 'all' ? `color:${C.plat[p]}` : ''}">${p === 'all' ? 'همه سکوها' : PLAT[p]}</button>`).join('');
    $$('#plSub button').forEach((b) => b.onclick = () => { STATE.plSub = b.dataset.s; (STATE.tbl.pl = STATE.tbl.pl || {}).p = 1; URLS.replace(true); V.platforms.draw(); });
    $$('#plPl button').forEach((b) => b.onclick = () => { STATE.plPl = b.dataset.p; (STATE.tbl.pl = STATE.tbl.pl || {}).p = 1; URLS.replace(true); V.platforms.draw(); });
    TBL($('#plAll'), all.filter((r) => (STATE.plSub === 'all' || r.sub === STATE.plSub) && (STATE.plPl === 'all' || r.pl === STATE.plPl)), {id: 'pl', cols: ['t', 'v', 'p', 'et', 'lim'], ph: 'جست‌وجو در رکوردهای سکو…'});
  };
})();

/* ---------------- extend PROVINCES with workbook explorer (file → sheet → provider → cell) ---------------- */
D.wbPorts.forEach((p) => p.cols.forEach((c) => { c[3] = c[3].replace(/ي/g, 'ی').replace(/\s+/g, ' ').trim(); c[2] = c[2].replace(/ي/g, 'ی').replace(/\s+/g, ' ').trim(); }));
(() => {
  const h0 = V.provinces.html, d0 = V.provinces.draw;
  V.provinces.html = () => h0() + `<div class="g">${panel('c12', 'WORKBOOK EXPLORER · ' + D.wbPorts.length + ' PORT + ' + D.wbSpeed.length + ' SPEED', 'کاوش کاربرگ‌های اصلی', 'فایل و برگه را انتخاب کنید. هر خانه، مختصات سلول اکسل را در راهنمای خود دارد و جمع ستون‌ها با سطر جمع فایل تطبیق داده می‌شود.', `<div class="tools"><select class="sel" id="wbSheet"></select><select class="sel" id="wbMetric"></select><input class="search" id="wbQ" placeholder="فیلتر شرکت یا استان…"></div><div id="wbCheck" class="lead"></div><div class="tbox" id="wbT" style="max-height:560px"></div>`, B.wb + '<span>فایل‌ها خودشان اعلام کرده‌اند که مجموع‌ها و شرکت‌ها هم‌پوشانی دارند</span>')}</div>`;
  V.provinces.draw = () => {
    d0();
    const sheets = [...D.wbPorts.map((p) => ({k: p.id, n: 'پورت · ' + p.f.replace('.xlsx', '') + ' · ' + p.s})), ...D.wbSpeed.map((s) => ({k: s.id, n: 'سرعت · ' + s.f.replace('.xlsx', '') + ' · ' + s.s}))];
    const ss = $('#wbSheet');
    ss.innerHTML = sheets.map((s) => `<option value="${s.k}" ${s.k === STATE.wbSheet ? 'selected' : ''}>${esc(s.n)}</option>`).join('');
    const drawWB = () => {
      STATE.wbSheet = ss.value;
      const q = ($('#wbQ').value || '').trim();
      const port = D.wbPorts.find((p) => p.id === ss.value), sp = D.wbSpeed.find((s) => s.id === ss.value);
      if (port) {
        const mets = [...new Set(port.cols.map((c) => c[3]))];
        const ms = $('#wbMetric'); ms.hidden = false;
        if (!mets.includes(STATE.wbMetric)) STATE.wbMetric = mets.find((m) => /دا[يی]ری/.test(m)) || mets[0];
        ms.innerHTML = mets.map((m) => `<option ${m === STATE.wbMetric ? 'selected' : ''}>${esc(m)}</option>`).join('');
        ms.onchange = () => { STATE.wbMetric = ms.value; drawWB(); };
        const cols = port.cols.filter((c) => c[3] === STATE.wbMetric && (!q || c[2].includes(q) || port.rows.some((r) => r[1].includes(q))));
        const prov = cols.filter((c) => !c[4]), agg = cols.filter((c) => c[4]);
        const rows = port.rows.filter((r) => !q || r[1].includes(q) || cols.some((c) => c[2].includes(q)));
        const val = (r, c) => r[3][c[0] - 2];
        const nz = prov.filter((c) => port.rows.some((r) => val(r, c)));
        const sum = (c) => port.rows.reduce((s, r) => s + (val(r, c) || 0), 0);
        const chk = agg.map((c) => { const tv = port.total ? port.total[1][c[0] - 2] : null; const sv = sum(c); return `${esc(c[2])}: جمع سطرها ${F.i(sv)}${tv != null ? ` · سطر جمع فایل ${F.i(tv)} ${Math.abs(sv - tv) < 1 ? '<b class="up">✓ تطبیق دارد</b>' : '<b class="down">✗ اختلاف ' + F.i(sv - tv) + '</b>'}` : ''}`; });
        $('#wbCheck').innerHTML = `${esc(port.f)} · برگه ${esc(port.s)} · ${esc(port.per)} · ${F.i(nz.length)} شرکت با مقدار غیرصفر<br>${chk.join('<br>')}`;
        $('#wbT').innerHTML = `<table class="t"><thead><tr><th>استان</th>${agg.map((c) => `<th style="color:var(--amber)">${esc(c[2])}<br><small class="mono">${c[1]}</small></th>`).join('')}${nz.map((c) => `<th>${esc(c[2])}<br><small class="mono">${c[1]}</small></th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><td><b>${esc(r[1])}</b></td>${[...agg, ...nz].map((c) => { const v = val(r, c); return `<td title="سلول ${c[1]}${r[2]}" class="num">${v == null ? '<span style="color:var(--dim)">·</span>' : F.i(v)}</td>`; }).join('')}</tr>`).join('')}<tr style="background:#111a25"><td><b>جمع سطرها</b></td>${[...agg, ...nz].map((c) => `<td class="num"><b>${F.i(sum(c))}</b></td>`).join('')}</tr></tbody></table>`;
      } else if (sp) {
        $('#wbMetric').hidden = true;
        const rows = sp.rows.filter((r) => !q || r[0].includes(q));
        const tot = sp.bands.map((_, i) => sp.rows.reduce((s, r) => s + (r[2][i] || 0), 0));
        $('#wbCheck').innerHTML = `${esc(sp.f)} · برگه ${esc(sp.s)} · ${F.i(sp.rows.length)} شرکت · جمع کل ${F.i(d3.sum(tot))} اشتراک`;
        $('#wbT').innerHTML = `<table class="t"><thead><tr><th>شرکت</th>${sp.bands.map((b) => `<th>${esc(b)}</th>`).join('')}<th>جمع</th><th>حقیقی / حقوقی</th></tr></thead><tbody>${rows.map((r) => `<tr><td><b>${esc(r[0])}</b><br><small class="mono" style="color:var(--dim)">ردیف ${r[1]}</small></td>${r[2].map((v) => `<td class="num">${v ? F.i(v) : '<span style="color:var(--dim)">·</span>'}</td>`).join('')}<td class="num"><b>${F.i(d3.sum(r[2]))}</b></td><td class="num" style="color:var(--mut)">${F.i(d3.sum(r[3]))} / ${F.i(d3.sum(r[4]))}</td></tr>`).join('')}<tr style="background:#111a25"><td><b>جمع</b></td>${tot.map((v) => `<td class="num"><b>${F.i(v)}</b></td>`).join('')}<td class="num"><b>${F.i(d3.sum(tot))}</b></td><td></td></tr></tbody></table>`;
      }
    };
    ss.onchange = drawWB; $('#wbQ').oninput = drawWB; drawWB();
  };
})();

/* ---------------- extend FIXED with claim-vs-official panel ---------------- */
(() => {
  const h0 = V.fixed.html, d0 = V.fixed.draw;
  V.fixed.html = () => {
    const e1 = REC.byId['EV-T04-1405-001'], e2 = REC.byId['EV-T04-1405-002'];
    return h0() + `<div class="g">${panel('c12', 'CLAIM vs OFFICIAL · T04', 'ادعای رسانه‌ای در برابر آمار رسمی فیبر', `مقام مسئول در مهر ۱۴۰۵ از «بیش از دو میلیون اتصال فیبر» گفته؛ فصلنامه ۵۷ برای بهار ۱۴۰۵، ${F.big(M.fiber.subs)} اشتراک FTTx و فایل پورت شهریور ${F.big(M.provT.fthA)} پورت FTTH دایر (فقط FCP/UNSP) ثبت کرده‌اند. تعریف «اتصال» روشن نیست و دوره‌ها یکی نیستند؛ پس این اختلاف تا روشن شدن تعریف حل‌نشده می‌ماند، نه خطای یکی از دو طرف.`,
      `<div class="evl" style="max-height:none">${[e1, e2].filter(Boolean).map((r) => `<button class="ev clkev" data-rk="${esc(r.k)}"><div><b>${esc(r.t)}</b><small class="mono">${esc(r.id)} · ${CODE(r.st)}</small><small style="color:var(--mut)">${esc((r.lim || []).join(' · '))}</small></div><div class="val">${esc(r.v)} <small>${CODE(r.u)}</small></div></button>`).join('')}</div>`, B.res + B.off)}</div>`;
  };
  V.fixed.draw = () => { d0(); bindRows($('#views')); };
})();
