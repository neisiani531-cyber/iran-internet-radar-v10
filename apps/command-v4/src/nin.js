/* ===== پایش تحقق اهداف عملیاتی شبکه ملی اطلاعات (NIN1400-1404.xlsx تا ۱۴۰۳ · NIN.1405.07.xlsx برای ۱۴۰۴ و ۱۴۰۵) ===== */
const NIN = (() => {
  const S = window.RADAR_NIN || {meta: {}, overall: {}, goals: [], issues: []};
  const YEARS = (S.meta && S.meta.years) || ['1400', '1401', '1402', '1403'];
  const LAST = YEARS[YEARS.length - 1], PY = YEARS.slice(1);
  /* 1404 and 1405 come from the second workbook (ministry self-assessment); S.meta.year_status describes each year */
  const YSTAT = (S.meta && S.meta.year_status) || {};
  const SHORT = {1: 'پوشش و سرعت پهن‌باند', 2: 'مزیت تعرفه‌ای خدمات داخلی', 3: 'مزیت کیفی دسترسی داخلی', 4: 'سهم ترافیک خدمات پایه داخلی', 5: 'اتصال نسل جدید (FTTH و 5G)', 6: 'هزینه پهن‌باند خانگی', 7: 'دسترسی پرسرعت سازمانی', 8: 'کیفیت شبکه هسته و تجمیع', 9: 'زمان شبکه مستقل از GPS', 10: 'مدیریت منابع ملی و بین‌المللی', 11: 'پشتیبانی IPv6', 12: 'زیرشبکه‌های امن مدیریت‌پذیر', 13: 'سه قطب مرکز داده', 14: 'سه فراهم‌کننده ابری داخلی', 15: 'خدمات پایه کاربردی داخلی', 16: 'زبان فارسی پیش‌فرض', 18: 'سیستم‌عامل داخلی همراه', 19: 'سهم بازار گوشی با سیستم‌عامل داخلی', 20: 'مصون‌سازی و تاب‌آوری امنیتی', 21: 'گذرگاه‌های ایمن داخلی', 22: 'گذرگاه‌های ایمن مرزی', 23: 'بومی‌سازی تجهیزات شبکه', 24: 'بومی‌سازی سامانه‌های امنیتی', 25: 'پیشگیری از حوادث و هویت معتبر', 29: 'سالم‌سازی خدمات', 17: 'سیستم‌عامل داخلی در مراکز حساس', 26: 'ادله الکترونیکی', 27: 'حریم خصوصی و حقوق عامه', 28: 'اشراف و رصد حاکمیتی', 30: 'آمادگی امنیتی و دفاعی'};
  /* goal → owner domain (+ cross). Rule NIN_GOAL_MAP_V1, reviewable here. */
  const GDOM = {1: ['communications', ['people']], 2: ['governance', ['base']], 3: ['communications', ['people']], 4: ['base', []], 5: ['communications', []], 6: ['people', ['governance']], 7: ['communications', ['applications']], 8: ['communications', []], 9: ['base', ['security']], 10: ['governance', ['base']], 11: ['base', ['communications']], 12: ['security', ['communications']], 13: ['information', ['security']], 14: ['information', []], 15: ['base', ['applications']], 16: ['applications', []], 18: ['applications', ['security']], 19: ['applications', ['governance']], 20: ['security', []], 21: ['security', []], 22: ['security', ['communications']], 23: ['governance', ['communications']], 24: ['security', ['governance']], 25: ['security', ['people']], 29: ['security', ['people']], 17: ['security', ['applications']], 26: ['security', ['governance']], 27: ['governance', ['people']], 28: ['security', ['governance']], 30: ['security', []]};
  const KEYS = {1: ['پوشش پهن', 'سرعت پهن', 'پهن باند ثابت', 'پهن باند سیار'], 2: ['تعرفه', 'نیم بها', 'مزیت اقتصادی'], 3: ['مزیت کیفی', 'rtt', 'traceroute'], 4: ['خدمات پایه کاربردی داخلی با سهم', 'سهم ترافیک خدمات پایه', 'ترافیک پیام رسان'], 5: ['نسل جدید', 'ftth', '5g'], 6: ['هزینه سالانه', 'هزینه پهن', 'درآمد ناخالص'], 7: ['پرسرعت سازمان', 'سازمانی', 'صد مگابیت'], 8: ['هسته', 'تجمیع'], 9: ['زمان شبکه', 'gps'], 10: ['منابع ملی', 'شماره', 'فرکانس', 'dns'], 11: ['ipv6', 'نسخه شش'], 12: ['زیرشبکه', 'شبکه اختصاصی امن'], 13: ['قطب', 'مرکز داده', 'مراکز داده', 'رک'], 14: ['ابری', 'ابر ', 'cloud', 'hhi'], 15: ['مرورگر', 'جویشگر', 'رایانامه', 'پیام رسان داخلی', 'شبکه اجتماعی داخلی', 'نقشه'], 16: ['زبان فارسی'], 18: ['سیستم عامل داخلی امن', 'سیستم عامل'], 19: ['سهم بازار گوشی', 'گوشی', 'تلفن همراه هوشمند'], 20: ['مصون', 'آسیب پذیری', 'isms', 'تاب آوری'], 21: ['گذرگاه داخلی', 'گذرگاه های ایمن داخلی'], 22: ['گذرگاه مرزی', 'مرزی'], 23: ['بومی سازی تجهیزات', 'تجهیزات شبکه'], 24: ['سامانه های امنیتی', 'سامانه امنیتی'], 25: ['هویت معتبر', 'پیشگیری', 'حوادث'], 29: ['سالم سازی', 'پالایش', 'فیلتر', 'فیلترشکن', 'vpn']};
  const OWN = {'سازمان تنظیم مقررات و ارتباطات رادیویی': 'رگولاتوری', 'سازمان فناوری اطلاعات ایران': 'سازمان فناوری اطلاعات', 'شرکت ارتباطات زیرساخت': 'ارتباطات زیرساخت', 'کمیته راهبری امنیت': 'کمیته راهبری امنیت', 'معاونت فناوری و نوآوری': 'معاونت فناوری و نوآوری', 'شبكه ملي اطلاعات': 'شبکه ملی اطلاعات'};
  const ownerOf = (i) => i.owner || i.owner_sheet2 || null;
  const goals = S.goals.map((g) => ({...g, short: SHORT[g.no] || ('هدف ' + g.no), dom: (GDOM[g.no] || ['unassigned', []])[0], cross: (GDOM[g.no] || [0, []])[1],
    owners: [...new Set(g.indicators.map(ownerOf).filter(Boolean))]}));
  const byNo = Object.fromEntries(goals.map((g) => [g.no, g]));
  const idOf = (i) => 'NIN-I' + (i.code && /^\d+$/.test(i.code) ? i.code : 'R' + i.row);
  const inds = goals.flatMap((g) => g.indicators.map((i) => ({...i, g, own: ownerOf(i), ownS: OWN[ownerOf(i)] || ownerOf(i) || 'نامشخص', id: idOf(i)})));
  const prog = (g, y) => (g.progress[y] == null ? null : g.progress[y]);
  const delta = (g, a, b) => (prog(g, a) == null || prog(g, b) == null ? null : prog(g, b) - prog(g, a));
  const q = (arr, p) => d3.quantile(arr.slice().sort(d3.ascending), p);
  const stats = (y) => { const v = goals.map((g) => prog(g, y)).filter((x) => x != null); return {n: v.length, min: d3.min(v), p25: q(v, 0.25), med: q(v, 0.5), p75: q(v, 0.75), max: d3.max(v), mean: d3.mean(v)}; };
  const issueOf = (no, y) => S.issues.find((x) => x.goal === no && x.year === y && x.kind === 'reported_differs_from_recomputed');
  const prev = (y) => YEARS[YEARS.indexOf(y) - 1];
  const issueOf3 = (y) => S.issues.find((x) => x.kind === 'overall_three_totals' && x.year === y);
  /* gap points inside a goal: w × (100 − performance) */
  const gapRows = (g, y) => g.indicators.filter((i) => i.weight[y]).map((i) => ({i, w: i.weight[y], p: i.perf[y], got: i.perf[y] == null ? null : i.weight[y] * i.perf[y], gap: i.perf[y] == null ? null : i.weight[y] * (100 - i.perf[y])}));
  /* change decomposition between two years: Δ(w·p) per indicator (includes weight changes) */
  const decomp = (g, a, b) => g.indicators.map((i) => { const x0 = i.weight[a] && i.perf[a] != null ? i.weight[a] * i.perf[a] : 0, x1 = i.weight[b] && i.perf[b] != null ? i.weight[b] * i.perf[b] : 0; return {i, d: x1 - x0, wChanged: (i.weight[a] || 0) !== (i.weight[b] || 0)}; }).filter((r) => Math.abs(r.d) > 0.005).sort((a, b) => a.d - b.d);
  const color = d3.scaleLinear([0, 25, 50, 75, 100], ['#5b1f2a', '#ff5a54', '#ffb340', '#9bd96a', '#2fd39c']).clamp(true);
  const band = (v) => (v == null ? 'na' : v < 25 ? 'b0' : v < 50 ? 'b1' : v < 75 ? 'b2' : 'b3');
  const BANDS = {b0: ['کمتر از ۲۵٪', '#ff5a54'], b1: ['۲۵ تا ۵۰٪', '#ff9b3d'], b2: ['۵۰ تا ۷۵٪', '#ffb340'], b3: ['۷۵٪ و بیشتر', '#2fd39c']};
  const yfa = (y) => String(y).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  /* reported vs recomputed, computed (not asserted): n comparable goal-years, bad = listed issues, maxOk = largest |diff| among the rest */
  const consistency = () => { let n = 0, bad = 0, maxOk = 0; goals.forEach((g) => PY.forEach((yr) => { if (g.progress[yr] == null || g.recomputed[yr] == null) return; n++; if (issueOf(g.no, yr)) bad++; else maxOk = Math.max(maxOk, Math.abs(g.progress[yr] - g.recomputed[yr])); })); return {n, bad, maxOk}; };
  return {consistency, idOf, S, YEARS, LAST, PY, YSTAT, issueOf3, goals, byNo, inds, prog, delta, stats, issueOf, prev, gapRows, decomp, color, band, BANDS, yfa, OWN, KEYS, SHORT, GDOM, ownerOf};
})();

/* ---------- radar records: goals + indicators (latest year LAST) ---------- */
ET.evaluation = {n: 'ارزیابی سالانه اهداف (فایل کاربر)', r: 3, c: '#54d7df'};
COLL.nin = {n: 'اهداف شبکه ملی (ارزیابی)', b: 'usr'};
(() => {
  const base = ['فایل‌های NIN1400-1404.xlsx و NIN.1405.07.xlsx ارائه‌شده کاربر؛ اصالت سند و روش تجمیع مستقلاً احراز نشده', 'عملکرد تا ۱۴۰۳ تأییدشده ناظر؛ ۱۴۰۴ و ۱۴۰۵ خودارزیابی وزارت (۱۴۰۵ تا پایان شهریور)'];
  const FL = {definition_changed: 'تعریف شاخص در طول دوره تغییر کرده است', removed_later: 'شاخص در ارزیابی‌های بعد حذف شده است', new_indicator: 'شاخص جدید است', owner_missing_sheet1: 'متولی در کاربرگ اول خالی است؛ از کاربرگ دوم خوانده شد', owner_differs_between_sheets: 'متولی در دو کاربرگ متفاوت ثبت شده', weight_changed: 'وزن شاخص میان سال‌ها تغییر کرده است', not_in_new_file: 'شاخص در فایل ۱۴۰۴ و ۱۴۰۵ نیامده است'};
  const add = (r) => { r.k = r.coll + ':' + r.id; r.cross = r.cross || []; r.lim = (r.lim || []).filter(Boolean); REC.list.push(r); REC.byId[r.k] = r; if (!REC.byId[r.id]) REC.byId[r.id] = r; };
  NIN.goals.forEach((g) => add({coll: 'nin', sub: 'هدف عملیاتی', id: 'NIN-G' + String(g.no).padStart(2, '0'), dom: g.dom, cross: g.cross, rule: 'NIN_GOAL_MAP_V1:G' + g.no, t: 'هدف ' + g.no + ' · ' + g.short, def: g.title, v: g.progress[NIN.LAST], u: 'درصد تحقق هدف', p: NIN.LAST, pop: 'میانگین وزنی عملکرد شاخص‌های همین هدف', geo: 'کل کشور', method: 'Σ وزن × عملکرد شاخص (کاربرگ دوم)', src: NIN.LAST > '1403' ? 'NIN1400-1404.xlsx؛ NIN.1405.07.xlsx' : 'NIN1400-1404.xlsx', loc: g.progress_cell[NIN.LAST].ref || g.progress_cell['1403'].ref, got: 'ارسال کاربر؛ ۷ آبان ۱۴۰۵', et: 'evaluation', adm: 'usertext',
    lim: [...base, ...NIN.PY.map((yr) => (NIN.issueOf(g.no, yr) ? 'درصد گزارش‌شده ' + NIN.yfa(yr) + ' با محاسبه وزنی شاخص‌ها نمی‌خواند' + (NIN.issueOf(g.no, yr).cause === 'text_cells_as_zero' ? ' (با صفر شمرده‌شدن سلول‌های متنی بازتولید می‌شود)' : '') : '')), g.new_goal ? 'هدف فقط در فایل ۱۴۰۵ آمده است' : ''], raw: {goal: g.no, title: g.title, progress: g.progress, recomputed: g.recomputed, weight_sum: g.weight_sum, cells: g.progress_cell}}));
  NIN.inds.forEach((i) => add({coll: 'nin', sub: 'شاخص', id: i.id, dom: i.g.dom, cross: i.g.cross, rule: 'NIN_GOAL_MAP_V1:G' + i.g.no, t: 'شاخص ' + (i.code || '—') + ' · ' + i.title, def: i.title, v: i.perf[NIN.LAST], u: 'درصد عملکرد شاخص', p: NIN.LAST, pop: 'هدف ' + i.g.no + ' · وزن ' + (i.weight[NIN.LAST] == null ? 'ندارد' : F.p(i.weight[NIN.LAST] * 100, 0)), geo: 'کل کشور', method: i.formula[NIN.LAST] || i.formula['1403'] || i.formula['1402'] || '', src: (NIN.LAST > '1403' ? 'NIN1400-1404.xlsx؛ NIN.1405.07.xlsx' : 'NIN1400-1404.xlsx') + ' · متولی: ' + (i.own || 'نامشخص'), loc: i.perf_cell[NIN.LAST].ref || i.perf_cell['1403'].ref, got: 'ارسال کاربر؛ ۷ آبان ۱۴۰۵', et: 'evaluation', adm: 'usertext',
    lim: [...base, 'عملکرد شاخص با درصد تحقق هدف یکی نیست', ...i.flags.map((f) => FL[f])], raw: i}));
})();

/* ---------- chart helpers (same visual language as charts.js) ---------- */
const NK = {};
NK.trajectory = (el, o) => {
  const h = o.h || 330, {svg, w, tip} = K.svg(el, h), Y = NIN.YEARS;
  const L = 40, R = 150, T = 14, Bm = 30;
  const x = d3.scalePoint(Y, [L + 10, w - R]), y = d3.scaleLinear([0, 100], [h - Bm, T]);
  el.__xs = Y.map((yr) => x(yr));
  [0, 25, 50, 75, 100].forEach((t) => { svg.append('line').attr('class', 'gl').attr('x1', L).attr('x2', w - R + 10).attr('y1', y(t)).attr('y2', y(t)); svg.append('text').attr('x', L - 6).attr('y', y(t)).attr('dy', '.35em').attr('text-anchor', 'end').text(F.i(t) + '٪'); });
  Y.forEach((yr) => svg.append('text').attr('x', x(yr)).attr('y', h - 8).attr('text-anchor', 'middle').style('font-weight', yr === o.sel ? 700 : 400).style('fill', yr === o.sel ? C.amber : null).text(NIN.yfa(yr)));
  const st = Y.map((yr) => ({yr, ...NIN.stats(yr)}));
  svg.append('path').attr('d', d3.area().x((d) => x(d.yr)).y0((d) => y(d.min)).y1((d) => y(d.max)).curve(d3.curveMonotoneX)(st)).attr('fill', 'rgba(148,163,184,0.035)').attr('opacity', 1);
  svg.append('path').attr('d', d3.area().x((d) => x(d.yr)).y0((d) => y(d.p25)).y1((d) => y(d.p75)).curve(d3.curveMonotoneX)(st)).attr('fill', 'rgba(148,163,184,0.10)').attr('opacity', 1);
  const gl = svg.append('g');
  const line = d3.line().defined((d) => d[1] != null).x((d) => x(d[0])).y((d) => y(d[1])).curve(d3.curveMonotoneX);
  const paths = NIN.goals.map((g) => ({g, p: gl.append('path').attr('d', line(Y.map((yr) => [yr, NIN.prog(g, yr)]))).attr('fill', 'none').attr('stroke', g.no === o.goal ? C.amber : '#7c8a9e').attr('stroke-width', g.no === o.goal ? 2.6 : 1).attr('opacity', g.no === o.goal ? 1 : 0.28).style('cursor', 'pointer')}));
  const hi = (g) => paths.forEach((p) => p.p.attr('opacity', !g ? (p.g.no === o.goal ? 1 : 0.28) : p.g === g ? 1 : 0.08).attr('stroke', p.g === g || p.g.no === o.goal ? C.amber : '#7c8a9e').attr('stroke-width', p.g === g || p.g.no === o.goal ? 2.6 : 1));
  paths.forEach(({g, p}) => p.on('mousemove', (ev) => { hi(g); K.show(el, tip, ev, 'هدف ' + g.no + ' · ' + g.short, NIN.YEARS.map((yr) => ({t: NIN.yfa(yr) + ': ' + (NIN.prog(g, yr) == null ? 'ناموجود' : F.p(NIN.prog(g, yr)))}))); }).on('mouseleave', () => { hi(null); K.hide(tip); }).on('click', () => o.click && o.click(g)));
  svg.append('path').attr('d', d3.line().x((d) => x(d.yr)).y((d) => y(d.med)).curve(d3.curveMonotoneX)(st)).attr('fill', 'none').attr('stroke', C.ice).attr('stroke-width', 1.6).attr('stroke-dasharray', '5 4');
  const ov = Y.map((yr) => [yr, NIN.S.overall[yr].value]);
  svg.append('path').attr('d', line(ov)).attr('fill', 'none').attr('stroke', C.amber).attr('stroke-width', 3.2).style('filter', 'drop-shadow(0 0 6px rgba(255,179,64,.45))');
  ov.forEach(([yr, v]) => { svg.append('circle').attr('cx', x(yr)).attr('cy', y(v)).attr('r', yr === o.sel ? 6.5 : 4.5).attr('fill', C.amber).attr('stroke', C.bg).attr('stroke-width', 2); svg.append('text').attr('x', x(yr)).attr('y', y(v) - 12).attr('text-anchor', 'middle').style('fill', C.amber).style('font-weight', 700).style('font-size', '12.5px').text(F.n(v)); });
  const lastSt = st[st.length - 1];
  [[NIN.S.overall[NIN.LAST].value, 'پیشرفت کل گزارش‌شده', C.amber], [lastSt.med, 'میانه اهداف', C.ice], [lastSt.p75, 'چارک سوم اهداف', '#5d8fbf'], [lastSt.p25, 'چارک اول اهداف', '#5d8fbf']].map(([v, t, c]) => ({v, t, c, yy: y(v)})).sort((a, b) => a.yy - b.yy).reduce((acc, d) => { d.yy = Math.max(d.yy, (acc.length ? acc[acc.length - 1].yy : -1e9) + 15); acc.push(d); return acc; }, [])
    .forEach((d) => rtlText(svg.append('text').attr('class', 'l').attr('x', w - 4).attr('y', d.yy).attr('dy', '.35em').attr('text-anchor', 'start').style('fill', d.c).style('font-size', '11.5px').text(d.t + ' ' + NIN.yfa(NIN.YEARS[NIN.YEARS.length - 1]) + ': ' + F.n(d.v))));
  const rule = svg.append('rect').attr('x', L).attr('y', 0).attr('width', w - R - L + 10).attr('height', h - Bm).attr('fill', 'transparent');
  rule.lower();
  rule.on('mousemove', (ev) => { const [mx] = d3.pointer(ev); const yr = Y.reduce((b, c) => (Math.abs(x(c) - mx) < Math.abs(x(b) - mx) ? c : b)); const s = st.find((d) => d.yr === yr); K.show(el, tip, ev, 'سال ' + NIN.yfa(yr), [{c: C.amber, t: 'پیشرفت کل (گزارش‌شده): ' + F.n(NIN.S.overall[yr].value)}, {c: C.ice, t: 'میانه اهداف: ' + F.n(s.med) + ' · میانگین ساده: ' + F.n(s.mean)}, {t: 'چارک‌ها: ' + F.n(s.p25) + ' تا ' + F.n(s.p75) + ' · بازه: ' + F.n(s.min) + ' تا ' + F.n(s.max)}, {t: F.i(s.n) + ' هدف دارای مقدار'}]); }).on('mouseleave', () => K.hide(tip)).on('click', (ev) => { const [mx] = d3.pointer(ev); const yr = Y.reduce((b, c) => (Math.abs(x(c) - mx) < Math.abs(x(b) - mx) ? c : b)); o.year && o.year(yr); });
  K.srTable(el, ['سال', 'پیشرفت کل گزارش‌شده', 'میانه اهداف', 'میانگین ساده اهداف'], st.map((s) => [s.yr, F.n(NIN.S.overall[s.yr].value), F.n(s.med), F.n(s.mean)]));
};
NK.heat = (el, o) => {
  const rows = o.rows, Y = NIN.YEARS, ch = 30, head = 26, h = head + rows.length * ch + 6;
  const {svg, w, tip} = K.svg(el, h);
  const lw = Math.min(K.measure(svg, rows.map((g) => g.no + ' · ' + g.short), 'l') + 18, w * 0.42), dw = 120;
  const cw = (w - lw - dw - 10) / Y.length;
  const defs = svg.append('defs'), hid = 'ninHatch-' + (NK.uid = (NK.uid || 0) + 1), pat = defs.append('pattern').attr('id', hid).attr('width', 6).attr('height', 6).attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(45)');
  pat.append('rect').attr('width', 6).attr('height', 6).attr('fill', '#0e151e'); pat.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6).attr('stroke', '#2a3747').attr('stroke-width', 2);
  Y.forEach((yr, j) => rtlText(svg.append('text').attr('x', w - lw - j * cw - cw / 2).attr('y', 16).attr('text-anchor', 'middle').style('font-weight', yr === o.sel ? 700 : 500).style('fill', yr === o.sel ? C.amber : null).text(NIN.yfa(yr))));
  rtlText(svg.append('text').attr('x', dw / 2 + 4).attr('y', 16).attr('text-anchor', 'middle').text('تغییر ' + NIN.yfa(NIN.prev(o.sel) || '1402') + '←' + NIN.yfa(o.sel)));
  const dmax = d3.max(rows, (g) => Math.abs(NIN.delta(g, NIN.prev(o.sel), o.sel) || 0)) || 1;
  const dx = d3.scaleLinear([-dmax, dmax], [34, dw - 34]);
  rows.forEach((g, i) => {
    const y0 = head + i * ch, gsel = g.no === o.goal;
    const row = svg.append('g').style('cursor', 'pointer').on('click', () => o.click && o.click(g));
    row.append('rect').attr('x', 0).attr('y', y0).attr('width', w).attr('height', ch).attr('fill', gsel ? 'rgba(255,179,64,.07)' : 'transparent').attr('rx', 6);
    rtlText(row.append('text').attr('class', 'l').attr('x', w).attr('y', y0 + ch / 2).attr('dy', '.35em').attr('text-anchor', 'start').style('font-size', '12px').style('fill', gsel ? C.amber : null).style('font-weight', gsel ? 700 : 400).text(g.no + ' · ' + g.short));
    row.append('circle').attr('cx', w - lw + 6).attr('cy', y0 + ch / 2).attr('r', 3.5).attr('fill', (DOM[g.dom] || DOM.unassigned).c).append('title').text(DOM[g.dom].n);
    Y.forEach((yr, j) => {
      const v = NIN.prog(g, yr), x0 = w - lw - (j + 1) * cw, iss = NIN.issueOf(g.no, yr);
      row.append('rect').attr('x', x0 + 2).attr('y', y0 + 2).attr('width', cw - 4).attr('height', ch - 4).attr('rx', 5).attr('fill', v == null ? 'url(#' + hid + ')' : NIN.color(v)).attr('opacity', yr === o.sel || v == null ? 1 : 0.72)
        .attr('stroke', yr === o.sel ? 'rgba(255,255,255,.35)' : 'none')
        .on('mousemove', (ev) => K.show(el, tip, ev, 'هدف ' + g.no + ' · سال ' + NIN.yfa(yr), [{t: v == null ? 'ناموجود (در فایل «__» یا خالی)' : 'درصد تحقق: ' + F.p(v)}, ...(g.recomputed[yr] != null ? [{t: 'محاسبه وزنی رادار: ' + F.p(g.recomputed[yr])}] : []), ...(iss ? [{t: '⚠ با محاسبه وزنی شاخص‌ها نمی‌خواند · ' + iss.cell}] : [])])).on('mouseleave', () => K.hide(tip));
      if (v != null) row.append('text').attr('x', x0 + cw / 2).attr('y', y0 + ch / 2).attr('dy', '.35em').attr('text-anchor', 'middle').style('fill', INK(NIN.color(v))).style('font-size', '11.5px').style('font-weight', 600).style('pointer-events', 'none').text(F.n(Math.round(v * 10) / 10));
      if (iss) row.append('path').attr('d', `M${x0 + cw - 2},${y0 + 2} l-9,0 l9,9 z`).attr('fill', '#fff').attr('opacity', 0.85).style('pointer-events', 'none');
    });
    const d = NIN.delta(g, NIN.prev(o.sel), o.sel);
    if (d != null) { row.append('rect').attr('x', Math.min(dx(0), dx(d))).attr('y', y0 + 9).attr('width', Math.max(2, Math.abs(dx(d) - dx(0)))).attr('height', ch - 18).attr('rx', 3).attr('fill', d >= 0 ? C.teal : C.red).attr('opacity', 0.85); row.append('text').attr('x', d >= 0 ? dx(d) + 4 : dx(d) - 4).attr('y', y0 + ch / 2).attr('dy', '.35em').attr('direction', 'ltr').attr('text-anchor', d >= 0 ? 'start' : 'end').style('font-size', '10.5px').style('fill', d >= 0 ? C.teal : C.red).text((d > 0 ? '+' : '') + F.n(Math.round(d * 10) / 10)); }
    else row.append('text').attr('x', dw / 2).attr('y', y0 + ch / 2).attr('dy', '.35em').attr('text-anchor', 'middle').style('font-size', '10.5px').style('fill', C.dim).text('ناموجود');
  });
  svg.append('line').attr('x1', dx(0)).attr('x2', dx(0)).attr('y1', head).attr('y2', h).attr('stroke', C.dim).attr('stroke-dasharray', '2 3');
  K.srTable(el, ['هدف', ...Y], rows.map((g) => ['هدف ' + g.no + ' · ' + g.short, ...Y.map((yr) => (NIN.prog(g, yr) == null ? null : F.p(NIN.prog(g, yr))))]));
};
NK.dumbbell = (el, o) => {
  const a = o.a, b = o.b, rows = NIN.goals.filter((g) => NIN.delta(g, a, b) != null).sort((p, q2) => NIN.delta(q2, a, b) - NIN.delta(p, a, b));
  const ch = 24, h = rows.length * ch + 30, {svg, w, tip} = K.svg(el, h);
  const lw = Math.min(K.measure(svg, rows.map((g) => g.short), 'l') + 14, w * 0.4);
  const x = d3.scaleLinear([0, 100], [8, w - lw - 50]);
  [0, 25, 50, 75, 100].forEach((t) => { svg.append('line').attr('class', 'gl').attr('x1', x(t)).attr('x2', x(t)).attr('y1', 18).attr('y2', h); svg.append('text').attr('x', x(t)).attr('y', 11).attr('text-anchor', 'middle').text(F.i(t) + '٪'); });
  rows.forEach((g, i) => {
    const y0 = 26 + i * ch, v0 = NIN.prog(g, a), v1 = NIN.prog(g, b), d = v1 - v0, c = d >= 0 ? C.teal : C.red;
    const gr = svg.append('g').style('cursor', 'pointer').on('click', () => o.click && o.click(g)).on('mousemove', (ev) => K.show(el, tip, ev, 'هدف ' + g.no + ' · ' + g.short, [{t: NIN.yfa(a) + ': ' + F.p(v0)}, {t: NIN.yfa(b) + ': ' + F.p(v1)}, {c, t: 'تغییر: ' + (d > 0 ? '+' : '') + F.n(Math.round(d * 10) / 10) + ' واحد درصد'}])).on('mouseleave', () => K.hide(tip));
    gr.append('rect').attr('x', 0).attr('y', y0 - ch / 2).attr('width', w).attr('height', ch).attr('fill', g.no === o.goal ? 'rgba(255,179,64,.07)' : 'transparent');
    rtlText(gr.append('text').attr('class', 'l').attr('x', w).attr('y', y0).attr('dy', '.35em').attr('text-anchor', 'start').style('font-size', '11.5px').text(g.short));
    gr.append('line').attr('x1', x(v0)).attr('x2', x(v1)).attr('y1', y0).attr('y2', y0).attr('stroke', c).attr('stroke-width', 3).attr('opacity', 0.7);
    gr.append('circle').attr('cx', x(v0)).attr('cy', y0).attr('r', 4.5).attr('fill', C.bg).attr('stroke', '#7c8a9e').attr('stroke-width', 2);
    gr.append('circle').attr('cx', x(v1)).attr('cy', y0).attr('r', 5.5).attr('fill', c);
    gr.append('text').attr('x', x(Math.max(v0, v1)) + 10).attr('y', y0).attr('dy', '.35em').attr('direction', 'ltr').attr('text-anchor', 'start').style('font-size', '10.5px').style('fill', c).text((d > 0 ? '+' : '') + F.n(Math.round(d * 10) / 10));
  });
  K.srTable(el, ['هدف', NIN.yfa(a), NIN.yfa(b), 'تغییر'], rows.map((g) => [g.short, F.p(NIN.prog(g, a)), F.p(NIN.prog(g, b)), F.n(NIN.delta(g, a, b))]));
};
NK.contrib = (el, g, y) => {
  const rows = NIN.gapRows(g, y).sort((p, q2) => (q2.gap ?? -1) - (p.gap ?? -1));
  const ch = 26, h = rows.length * ch + 40, {svg, w, tip} = K.svg(el, h);
  const lw = Math.min(K.measure(svg, rows.map((r) => (r.i.code || '—') + ' · ' + LTXT(r.i.title,46)), 'l') + 14, w * 0.5);
  const x = d3.scaleLinear([0, d3.max(rows, (r) => r.w * 100) || 1], [0, w - lw - 70]);
  rtlText(svg.append('text').attr('x', w - lw - 4).attr('y', 12).attr('text-anchor', 'start').style('font-size', '10.5px').text('طول کل = وزن شاخص · سبز = سهم کسب‌شده · قرمز = سهم از شکاف تا ۱۰۰'));
  rows.forEach((r, i) => {
    const y0 = 24 + i * ch, right = w - lw - 6, full = x(r.w * 100);
    rtlText(svg.append('text').attr('class', 'l').attr('x', w).attr('y', y0 + 9).attr('dy', '.35em').attr('text-anchor', 'start').style('font-size', '11.5px').text((r.i.code || '—') + ' · ' + (r.i.title.length > 46 ? LTXT(r.i.title,46) + '…' : r.i.title)));
    const tipf = (ev) => K.show(el, tip, ev, 'شاخص ' + (r.i.code || '—'), [{t: r.i.title}, {t: 'وزن در هدف: ' + F.p(r.w * 100, 0)}, {t: 'عملکرد ' + NIN.yfa(y) + ': ' + (r.p == null ? 'ناموجود' : F.p(r.p))}, {c: C.teal, t: 'سهم کسب‌شده: ' + (r.got == null ? '—' : F.n(Math.round(r.got * 10) / 10)) + ' واحد'}, {c: C.red, t: 'سهم از شکاف: ' + (r.gap == null ? '—' : F.n(Math.round(r.gap * 10) / 10)) + ' واحد'}]);
    if (r.p == null) { svg.append('rect').attr('x', right - full).attr('y', y0).attr('width', full).attr('height', 18).attr('rx', 4).attr('fill', 'url(#' + hid2 + ')').attr('stroke', '#3a4a5c').on('mousemove', tipf).on('mouseleave', () => K.hide(tip)); return; }
    const gw = x(r.got), rw = full - gw;
    svg.append('rect').attr('x', right - gw).attr('y', y0).attr('width', Math.max(0, gw)).attr('height', 18).attr('rx', 4).attr('fill', C.teal).attr('opacity', 0.9).on('mousemove', tipf).on('mouseleave', () => K.hide(tip)).style('cursor', 'pointer').on('click', () => DETAIL.open('nin:' + NIN.idOf(r.i)));
    svg.append('rect').attr('x', right - full).attr('y', y0).attr('width', Math.max(0, rw)).attr('height', 18).attr('rx', 4).attr('fill', C.red).attr('opacity', 0.55).on('mousemove', tipf).on('mouseleave', () => K.hide(tip)).style('cursor', 'pointer').on('click', () => DETAIL.open('nin:' + NIN.idOf(r.i)));
    svg.append('text').attr('x', right - full - 6).attr('y', y0 + 9).attr('dy', '.35em').attr('direction', 'ltr').attr('text-anchor', 'end').style('font-size', '10.5px').style('fill', C.red).text('−' + F.n(Math.round(r.gap * 10) / 10));
  });
  const defs = svg.append('defs'), hid2 = 'ninHatch2-' + (NK.uid = (NK.uid || 0) + 1), pat = defs.append('pattern').attr('id', hid2).attr('width', 6).attr('height', 6).attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(45)');
  pat.append('rect').attr('width', 6).attr('height', 6).attr('fill', '#0e151e'); pat.append('line').attr('x2', 0).attr('y2', 6).attr('stroke', '#2a3747').attr('stroke-width', 2);
  K.srTable(el, ['شاخص', 'وزن', 'عملکرد', 'سهم کسب‌شده', 'سهم از شکاف'], rows.map((r) => [r.i.code + ' ' + r.i.title, F.p(r.w * 100, 0), r.p == null ? null : F.p(r.p), r.got == null ? null : F.n(r.got), r.gap == null ? null : F.n(r.gap)]));
};
NK.gauge = (el, v, prevV) => {
  const h = 170, {svg, w} = K.svg(el, h), cx = w / 2, cy = 120, R = Math.min(110, w / 2 - 10);
  const arc = d3.arc().innerRadius(R - 16).outerRadius(R).cornerRadius(8);
  const a = (p) => -Math.PI / 2 + Math.PI * p / 100;
  svg.append('path').attr('transform', `translate(${cx},${cy})`).attr('d', arc({startAngle: a(0), endAngle: a(100)})).attr('fill', C.line);
  const g = svg.append('defs').append('linearGradient').attr('id', 'ninG').attr('x1', 0).attr('x2', 1);
  [[0, '#ff5a54'], [0.5, '#ffb340'], [1, '#2fd39c']].forEach(([o2, c]) => g.append('stop').attr('offset', o2).attr('stop-color', c));
  svg.append('path').attr('transform', `translate(${cx},${cy})`).attr('d', arc({startAngle: a(0), endAngle: a(v)})).attr('fill', 'url(#ninG)');
  if (prevV != null) { const t = a(prevV); svg.append('line').attr('x1', cx + Math.sin(t) * (R - 22)).attr('y1', cy - Math.cos(t) * (R - 22)).attr('x2', cx + Math.sin(t) * (R + 6)).attr('y2', cy - Math.cos(t) * (R + 6)).attr('stroke', C.fg).attr('stroke-width', 2).append('title').text('سال قبل: ' + F.n(prevV)); }
  svg.append('text').attr('x', cx).attr('y', cy - 14).attr('text-anchor', 'middle').style('font-size', '34px').style('font-weight', 600).style('fill', C.fg).text(F.n(v));
  svg.append('text').attr('x', cx).attr('y', cy + 8).attr('text-anchor', 'middle').style('font-size', '11.5px').text('درصد پیشرفت کل (گزارش‌شده)');
  [0, 50, 100].forEach((p) => { const t = a(p); svg.append('text').attr('x', cx + Math.sin(t) * (R + 14)).attr('y', cy - Math.cos(t) * (R + 14) + 4).attr('text-anchor', 'middle').style('font-size', '10px').text(F.i(p)); });
};

{ const g0 = NK.gauge; NK.gauge = (el, v, prevV) => { g0(el, v, prevV); K.srTable(el, ['سنجه', 'مقدار'], [['پیشرفت کل گزارش‌شده', F.n(v) + '٪'], ['سال قبل', prevV == null ? null : F.n(prevV) + '٪']]); }; }

/* ---------- the view ---------- */
V.nin = {
  title: 'پایش اهداف شبکه ملی', code: 'NIN GOALS',
  html: () => {
    const y = NIN.YEARS.includes(STATE.ninYear) ? STATE.ninYear : NIN.LAST, p = NIN.prev(y), ov = NIN.S.overall;
    const st = NIN.stats(y), gs = NIN.goals.filter((g) => NIN.prog(g, y) != null);
    const up = p ? NIN.goals.filter((g) => (NIN.delta(g, p, y) || 0) > 0.05).length : 0, dn = p ? NIN.goals.filter((g) => (NIN.delta(g, p, y) || 0) < -0.05).length : 0;
    const best = p ? NIN.goals.filter((g) => NIN.delta(g, p, y) != null).sort((a, b) => NIN.delta(b, p, y) - NIN.delta(a, p, y)) : [];
    const nWeighted = NIN.inds.filter((i) => i.weight[y] > 0).length || NIN.inds.length;
    const iss = NIN.S.issues.filter((x) => x.kind === 'reported_differs_from_recomputed').length;
    const dOv = p ? ov[y].value - ov[p].value : null;
    const goal = NIN.byNo[STATE.ninGoal] || null;
    const gdots = (on, col, key) => VZ.dots([...NIN.goals].sort((a, b) => (key || ((g) => NIN.prog(g, y) ?? -1))(b) - (key || ((g) => NIN.prog(g, y) ?? -1))(a)).map((g) => ({on: on(g), c: col ? col(g) : NIN.color(NIN.prog(g, y)), t: 'هدف ' + F.i(g.no) + ' · ' + g.short + ': ' + (NIN.prog(g, y) == null ? 'ناموجود' : F.p(NIN.prog(g, y)))})), {label: 'هر نقطه یک هدف'});
    const C2 = NIN.consistency();
    return `
    <div class="vhead"><div><div class="code">NIN OPERATIONAL GOALS · ANNUAL EVALUATION · ${NIN.YEARS.join(' · ')}</div><h2>پایش تحقق اهداف عملیاتی شبکه ملی اطلاعات</h2>
    <p>${F.i(NIN.goals.length)} هدف عملیاتی و ${F.i(NIN.inds.length)} شاخص، ارزیابی سالانه ${NIN.yfa('1400')} تا ${NIN.yfa(NIN.LAST)}. درصد هر هدف میانگین وزنی عملکرد شاخص‌های آن است و رادار آن را از وزن‌ها و عملکردهای همان فایل بازمحاسبه کرده است.${NIN.LAST > '1403' ? ' ' + NIN.yfa('1400') + ' تا ' + NIN.yfa('1403') + ' تأییدشده در جایگاه ناظر است؛ ' + NIN.yfa('1404') + ' (پایان اسفند) و ' + NIN.yfa(NIN.LAST) + ' (تا پایان شهریور، نه پایان سال) خودارزیابی وزارت است و ساختار اهداف و وزن شاخص‌ها در آن فرق دارد.' : ''} <span class="scope">منبع: فایل‌های NIN1400-1404.xlsx و NIN.1405.07.xlsx ارسالی کاربر؛ اصالت سند احراز نشده</span></p></div>
    <div class="tools"><span class="lead" style="margin:0">سال ارزیابی</span><div class="seg" id="ninYear" role="group" aria-label="سال ارزیابی">${NIN.YEARS.map((yr) => `<button data-y="${yr}" aria-pressed="${yr === y}"${NIN.YSTAT[yr] ? ` title="${NIN.YSTAT[yr]}"` : ''}>${NIN.yfa(yr)}${NIN.YSTAT[yr] ? ' *' : ''}</button>`).join('')}</div></div></div>
    <div class="nin-hero">
      <section class="p nin-gauge"><header><h3>پیشرفت کل شبکه ملی اطلاعات · ${NIN.yfa(y)}</h3><span class="k">OVERALL</span></header><div class="ch" id="ninGauge"></div>
        <p class="lead">${p ? `نسبت به ${NIN.yfa(p)}: <b style="color:${dOv >= 0 ? C.teal : C.red}">${dOv > 0 ? '+' : ''}${F.n(Math.round(dOv * 100) / 100)}</b> واحد درصد. ` : ''}میانگین ساده ${F.i(st.n)} هدف ${F.n(Math.round(st.mean * 100) / 100)} است و با عدد کل نمی‌خواند؛ ${NIN.issueOf3(y) ? '<span>عدد کل این سال برابر جمع وزنی محورهای فایل است، نه جمع وزنی اهداف؛ جزئیات در پنل کیفیت داده.</span>' : 'روش تجمیع کل در فایل نیامده.'}</p></section>
      <div class="strip nin-strip" data-n="4">
        ${kpiTile({t: 'اهداف با تحقق ۷۵٪ و بیشتر', k: NIN.yfa(y), ev: 'usr', v: F.i(gs.filter((g) => NIN.prog(g, y) >= 75).length), u: 'از ' + F.i(gs.length), d: 'میانه اهداف ' + F.p(st.med), st: C.teal, band: gdots((g) => NIN.prog(g, y) >= 75)})}
        ${kpiTile({t: 'اهداف زیر ۴۰٪', k: NIN.yfa(y), ev: 'usr', v: F.i(gs.filter((g) => NIN.prog(g, y) < 40).length), u: 'هدف', d: gs.filter((g) => NIN.prog(g, y) < 40).sort((a, b) => NIN.prog(a, y) - NIN.prog(b, y)).slice(0, 2).map((g) => g.short + ' ' + F.p(NIN.prog(g, y), 0)).join(' · ') || '—', st: C.red, band: gdots((g) => NIN.prog(g, y) != null && NIN.prog(g, y) < 40)})}
        ${kpiTile({t: 'بهبود / افت نسبت به سال قبل', k: p ? NIN.yfa(p) + '←' + NIN.yfa(y) : '—', ev: 'calc', v: p ? F.i(up) + '↑ ' + F.i(dn) + '↓' : '—', u: 'هدف بهبود / افت', d: best.length ? 'بیشترین بهبود: ' + best[0].short + ' (' + (NIN.delta(best[0], p, y) > 0 ? '+' : '') + F.n(Math.round(NIN.delta(best[0], p, y))) + ')' : 'برای ۱۴۰۰ سال قبل نداریم', st: C.ice, band: p ? gdots((g) => Math.abs(NIN.delta(g, p, y) || 0) > 0.05, (g) => (NIN.delta(g, p, y) > 0 ? C.teal : C.red), (g) => NIN.delta(g, p, y) ?? 0) : ''})}
        ${kpiTile({t: 'ناسازگاری بازمحاسبه', k: 'CHECK', ev: 'calc', v: F.i(iss), u: 'هدف‌سال', d: 'درصد گزارش‌شده ≠ Σ وزن × عملکرد · ' + F.i(nWeighted) + ' شاخص وزن‌دار در ' + NIN.yfa(y), st: C.amber, band: VZ.meter(C2.n - C2.bad, C2.n, C.teal, {label: 'سازگار ' + (C2.n - C2.bad) + ' از ' + C2.n + ' هدف‌سال', caption: `<span>${F.i(C2.n - C2.bad)} از ${F.i(C2.n)} هدف‌سال سازگار</span><span>بیشترین اختلاف بقیه: ${F.n(Math.round(C2.maxOk * 100) / 100)}</span>`})})}
      </div>
    </div>
    <div class="g">
      ${panel('c8', 'TRAJECTORY · ' + NIN.YEARS.length + 'Y', NIN.YEARS.length === 4 ? 'مسیر چهارساله: پیشرفت کل و پراکندگی اهداف' : 'مسیر شش‌ساله: پیشرفت کل و پراکندگی اهداف', 'خط نارنجی عدد کل گزارش‌شده است. نوار خاکستری چارک اول تا سوم اهداف، نوار کم‌رنگ کمینه تا بیشینه و خط‌چین میانه است. روی هر خط خاکستری بروید تا هدف آن مشخص شود؛ کلیک، جزئیات هدف را باز می‌کند و کلیک روی ستون سال، سال ارزیابی را عوض می‌کند.', `<div class="ch" id="ninTraj"></div>${legend([['پیشرفت کل گزارش‌شده', C.amber], ['میانه اهداف', C.ice], ['چارک اول تا سوم', '#2e4a66'], ['هر هدف', '#7c8a9e']])}`, '<span class="badge usr">فایل کاربر · احراز نشده</span>' + B.calc)}
      ${panel('c4', 'DISTRIBUTION · ' + NIN.yfa(y), 'توزیع اهداف بر حسب درصد تحقق', 'روی هر دسته بزنید تا هدف‌های آن در نقشه حرارتی برجسته شوند.', `<div id="ninBands"></div>`)}
      ${panel('c7', 'HEATMAP · GOALS × YEARS', 'نقشه حرارتی اهداف در سال‌های ارزیابی', `مرتب بر اساس ${NIN.yfa(y)}. خانه هاشورخورده یعنی مقدار در فایل نیست (صفر نیست). مثلث سفید گوشه یعنی درصد گزارش‌شده با Σ وزن × عملکرد شاخص‌ها نمی‌خواند. ستون آخر تغییر نسبت به سال قبل است. روی هر ردیف بزنید.`, `<div class="tools"><div class="seg" id="ninSort" role="group" aria-label="مرتب‌سازی"><button data-s="value" aria-pressed="${STATE.ninSort !== 'no' && STATE.ninSort !== 'delta'}">بر اساس مقدار</button><button data-s="delta" aria-pressed="${STATE.ninSort === 'delta'}">بر اساس تغییر</button><button data-s="no" aria-pressed="${STATE.ninSort === 'no'}">شماره هدف</button></div><select class="sel" id="ninDom" aria-label="حوزه"><option value="all">همه حوزه‌ها</option>${DOM_ORDER.map((d) => `<option value="${d}" ${STATE.ninDom === d ? 'selected' : ''}>${DOM[d].n} · ${F.i(NIN.goals.filter((g) => g.dom === d).length)}</option>`).join('')}</select></div><div class="ch" id="ninHeat"></div>`)}
      ${panel('c5', 'CHANGE · ' + (p ? NIN.yfa(p) + '→' + NIN.yfa(y) : '—'), p ? `کدام اهداف جلو رفتند و کدام عقب ماندند` : 'تغییر سالانه', p ? 'دایره توخالی سال قبل و دایره پر سال انتخابی است؛ مرتب از بیشترین بهبود تا بیشترین افت.' + (+p < 1404 && +y >= 1404 ? ' عبور از مرز ۱۴۰۳ به ۱۴۰۴: ارزیابی ناظر جای خود را به خوداظهاری وزارتخانه داده و دامنه اهداف و شاخص‌ها هم گسترده شده است؛ جهش را بهبود واقعی نخوانید.' : (+y === 1405 ? ' سال ۱۴۰۵ تا شهریور است و پایان سال نیست.' : '')) : 'برای ۱۴۰۰ سال قبلی در فایل نیست.', `<div class="ch" id="ninDumb"></div>`, B.calc)}
      ${panel('c12', 'GOAL DRILL-DOWN', goal ? `هدف ${F.i(goal.no)} · ${esc(goal.short)}` : 'جزئیات هدف', goal ? esc(goal.title) : 'یک هدف را از نمودار مسیر، نقشه حرارتی یا نمودار تغییر انتخاب کنید.', `<div class="tools"><select class="sel" id="ninGoalSel" aria-label="انتخاب هدف"><option value="0">انتخاب هدف…</option>${NIN.goals.map((g) => `<option value="${g.no}" ${g.no === (goal && goal.no) ? 'selected' : ''}>${F.i(g.no)} · ${esc(g.short)}</option>`).join('')}</select>${goal ? `<button class="go" id="ninAsk" type="button">تحلیل این هدف با دستیار</button><a href="#" class="go" data-rk="nin:NIN-G${String(goal.no).padStart(2, '0')}">شناسنامه هدف</a>` : ''}</div><div id="ninDrill"></div>`)}
      ${panel('c6', 'BY DOMAIN', 'اهداف در هفت حوزه', 'میانگین ساده درصد تحقق اهداف هر حوزه (محاسبه رادار؛ وزن اهداف در فایل نیست). روی کارت بزنید تا نقشه حرارتی به همان حوزه محدود شود.', `<div class="nin-doms" id="ninDoms"></div>`, B.calc)}
      ${panel('c6', 'BY OWNER · ' + NIN.yfa(y), 'متولیان: عملکرد شاخص‌ها', 'میانگین ساده عملکرد شاخص‌های وزن‌دار هر متولی در سال انتخابی و سال قبل. عملکرد شاخص با درصد تحقق هدف یکی نیست.', `<div class="ch" id="ninOwn"></div>${legend([[NIN.yfa(y), C.amber], [p ? NIN.yfa(p) : '—', '#5d8fbf']])}`, B.calc)}
      ${panel('c6', 'GAP DRIVERS · ' + NIN.yfa(y), 'شاخص‌هایی که بیشترین فاصله را می‌سازند', 'سهم هر شاخص از فاصله هدفش تا ۱۰۰٪ = وزن × (۱۰۰ − عملکرد). اعداد در مقیاس همان هدف‌اند و میان اهداف فقط وقتی قابل مقایسه‌اند که وزن اهداف برابر فرض شود.', `<div class="ch" id="ninGap"></div>`, B.calc)}
      ${panel('c6', 'DATA QUALITY', 'بازمحاسبه و ناسازگاری‌های فایل', 'آنچه رادار هنگام بازسازی درصدها از وزن و عملکرد شاخص‌ها پیدا کرد.', `<div id="ninQual"></div>`, B.calc)}
      ${panel('c12', 'INDICATORS · ' + NIN.inds.length, 'کاوش شاخص‌ها', 'همه شاخص‌ها با عملکرد آخرین سال، وزن و هشدارها. روی هر ردیف بزنید تا شناسنامه کامل با فرمول و سلول منبع باز شود.', `<div id="ninT"></div>`)}
    </div>`;
  },
  draw: () => {
    const y = NIN.YEARS.includes(STATE.ninYear) ? STATE.ninYear : NIN.LAST, p = NIN.prev(y);
    const pick = (g) => { STATE.ninGoal = g.no; URLS.replace(true); render(true); setTimeout(() => { const e = $('#ninDrill'); if (e) e.closest('.p').scrollIntoView({behavior: 'smooth', block: 'start'}); }, 50); };
    $$('#ninYear button[data-y]').forEach((b) => b.onclick = () => { STATE.ninYear = b.dataset.y; URLS.replace(true); render(true); });
    $$('#ninSort button').forEach((b) => b.onclick = () => { STATE.ninSort = b.dataset.s; URLS.replace(true); render(true); });
    $('#ninDom').onchange = (e) => { STATE.ninDom = e.target.value; URLS.replace(true); render(true); };
    $('#ninGoalSel').onchange = (e) => { STATE.ninGoal = +e.target.value; URLS.replace(true); render(true); };
    if ($('#ninAsk')) $('#ninAsk').onclick = () => AIUI.ask('وضعیت هدف ' + STATE.ninGoal + ' شبکه ملی اطلاعات را تحلیل کن');
    NK.gauge($('#ninGauge'), NIN.S.overall[y].value, p ? NIN.S.overall[p].value : null);
    NK.trajectory($('#ninTraj'), {sel: y, goal: STATE.ninGoal, click: pick, year: (yr) => { STATE.ninYear = yr; URLS.replace(true); render(true); }});
    /* bands */
    const gs = NIN.goals.filter((g) => NIN.prog(g, y) != null), nNa = NIN.goals.length - gs.length;
    $('#ninBands').innerHTML = `<div class="nin-bands">${Object.entries(NIN.BANDS).reverse().map(([k, [n, c]]) => { const L = gs.filter((g) => NIN.band(NIN.prog(g, y)) === k); return `<button class="nin-band" data-b="${k}" aria-pressed="${STATE.ninBand === k}" style="--c:${c}"><span class="nb-n num">${F.i(L.length)}</span><span class="nb-t">${n}</span><span class="nb-bar"><i style="width:${L.length / NIN.goals.length * 100}%"></i></span><span class="nb-g">${L.map((g) => F.i(g.no)).join('، ') || '—'}</span></button>`; }).join('')}${nNa ? `<div class="nin-band na"><span class="nb-n num">${F.i(nNa)}</span><span class="nb-t">ناموجود در ${NIN.yfa(y)}</span><span class="nb-g">${NIN.goals.filter((g) => NIN.prog(g, y) == null).map((g) => F.i(g.no)).join('، ')}</span></div>` : ''}</div>`;
    $$('.nin-band[data-b]').forEach((b) => b.onclick = () => { STATE.ninBand = STATE.ninBand === b.dataset.b ? '' : b.dataset.b; URLS.replace(true); render(true); });
    /* heat */
    let rows = NIN.goals.filter((g) => (STATE.ninDom === 'all' || g.dom === STATE.ninDom) && (!STATE.ninBand || NIN.band(NIN.prog(g, y)) === STATE.ninBand));
    const sv = (g) => (NIN.prog(g, y) == null ? -1 : NIN.prog(g, y)), sd = (g) => (NIN.delta(g, p, y) == null ? -1e9 : NIN.delta(g, p, y));
    rows = rows.sort((a, b) => (STATE.ninSort === 'no' ? a.no - b.no : STATE.ninSort === 'delta' ? sd(b) - sd(a) : sv(b) - sv(a)));
    if (rows.length) NK.heat($('#ninHeat'), {rows, sel: y, goal: STATE.ninGoal, click: pick}); else $('#ninHeat').innerHTML = '<div class="empty-state">هدفی با این فیلتر نیست.</div>';
    if (p) NK.dumbbell($('#ninDumb'), {a: p, b: y, goal: STATE.ninGoal, click: pick}); else $('#ninDumb').innerHTML = '<div class="empty-state">سال ۱۴۰۰ نخستین سال فایل است و تغییر سالانه ندارد.</div>';
    /* drill */
    const g = NIN.byNo[STATE.ninGoal];
    if (!g) $('#ninDrill').innerHTML = `<div class="empty-state">هدفی انتخاب نشده است. پیشنهاد: <button class="go" data-pick="${[...NIN.goals].filter((x) => NIN.prog(x, y) != null).sort((a, b) => NIN.prog(a, y) - NIN.prog(b, y))[0].no}">ضعیف‌ترین هدف ${NIN.yfa(y)}</button> <button class="go" data-pick="${[...NIN.goals].filter((x) => NIN.delta(x, p || '1402', y) != null).sort((a, b) => NIN.delta(a, p || '1402', y) - NIN.delta(b, p || '1402', y))[0].no}">بیشترین افت</button></div>`;
    else {
      const yy = g.indicators.some((i) => i.weight[y]) ? y : '1403';
      const dc = p ? NIN.decomp(g, p, y) : [];
      $('#ninDrill').innerHTML = `<div class="nin-drill">
        <div class="nd-side"><div class="nd-meta"><span style="color:${DOM[g.dom].c}">● ${DOM[g.dom].n}</span>${g.cross.map((c) => `<span class="dim">+ ${DOM[c].n}</span>`).join('')}<span>متولی: ${g.owners.map((o) => esc(NIN.OWN[o] || o)).join('، ') || 'نامشخص'}</span><span>${F.i(g.indicators.length)} شاخص</span></div>
          <div class="ch" id="ninGoalLine"></div>
          <table class="t nd-y"><thead><tr><th>سال</th><th>گزارش‌شده</th><th>بازمحاسبه رادار</th><th>جمع وزن‌ها</th></tr></thead><tbody>${NIN.YEARS.map((yr) => `<tr${yr === y ? ' class="sel"' : ''}><td>${NIN.yfa(yr)}</td><td>${VAL(g.progress[yr], '٪')}</td><td>${g.recomputed[yr] == null ? '<span class="na">ندارد</span>' : F.p(g.recomputed[yr])}${NIN.issueOf(g.no, yr) ? ' <span class="er">⚠ ناسازگار</span>' : ''}</td><td>${g.weight_sum[yr] == null ? '—' : F.p(g.weight_sum[yr] * 100, 0)}</td></tr>`).join('')}</tbody></table>
          ${dc.length ? `<h5 class="nd-h">چه چیزی تغییر ${NIN.yfa(p)}→${NIN.yfa(y)} را ساخت؟</h5><div class="nd-dc">${dc.slice(0, 3).concat(dc.slice(-3).filter((r) => r.d > 0 && !dc.slice(0, 3).includes(r))).map((r) => `<div><b style="color:${r.d >= 0 ? C.teal : C.red}">${r.d > 0 ? '+' : ''}${F.n(Math.round(r.d * 10) / 10)}</b> <span class="mono">${esc(r.i.code || '—')}</span> ${esc(LTXT(r.i.title,60))}${r.wChanged ? ' <small class="dim">(وزن تغییر کرده)</small>' : ''}</div>`).join('')}<small class="dim">Δ(وزن × عملکرد) هر شاخص؛ جمع این‌ها برابر تغییر بازمحاسبه هدف است.</small></div>` : ''}
        </div>
        <div class="nd-main"><h5 class="nd-h">سهم شاخص‌ها در ${NIN.yfa(yy)}: کسب‌شده و فاصله تا ۱۰۰</h5><div class="ch" id="ninContrib"></div>
          <details class="dt-sec"><summary>وزن، عملکرد و فرمول همه شاخص‌ها در سال‌های ارزیابی</summary><div class="tbox"><table class="t"><thead><tr><th>کد</th><th>شاخص</th><th>متولی</th>${NIN.PY.map((yr) => `<th>وزن ${NIN.yfa(yr)}</th><th>عملکرد ${NIN.yfa(yr)}</th>`).join('')}<th>هشدار</th></tr></thead><tbody>${g.indicators.map((i) => `<tr data-rk="nin:${'NIN-I' + (i.code && /^\d+$/.test(i.code) ? i.code : 'R' + i.row)}" tabindex="0"><td class="mono">${esc(i.code || '—')}</td><td class="wrap"><small>${esc(i.title)}</small></td><td><small>${esc(NIN.OWN[NIN.ownerOf(i)] || NIN.ownerOf(i) || '—')}</small></td>${NIN.PY.map((yr) => `<td class="num">${i.weight[yr] == null ? '<span class="na">—</span>' : F.p(i.weight[yr] * 100, 0)}</td><td>${VAL(i.perf[yr], '٪')}</td>`).join('')}<td><small class="mut">${i.flags.filter((f) => f !== 'weight_changed').length ? '⚠' : ''}</small></td></tr>`).join('')}</tbody></table></div></details>
        </div></div>`;
      const gl = $('#ninGoalLine');
      K.line(gl, {xs: NIN.YEARS, h: 150, yMin: 0, series: [{name: 'گزارش‌شده', c: C.amber, vals: NIN.YEARS.map((yr) => g.progress[yr]), w: 2.6, area: true}, {name: 'بازمحاسبه', c: C.ice, vals: NIN.YEARS.map((yr) => g.recomputed[yr] == null ? null : g.recomputed[yr]), w: 1.6, dash: '4 3'}], yfmt: (v) => F.i(Math.round(v)), tfmt: (v) => F.p(v), endfmt: (v) => F.p(v, 0), xlab: (d) => NIN.yfa(d), xtip: (d) => 'سال ' + NIN.yfa(d)});
      NK.contrib($('#ninContrib'), g, yy);
      bindRows($('#ninDrill'));
    }
    $$('[data-pick]', $('#views')).forEach((b) => b.onclick = () => pick(NIN.byNo[+b.dataset.pick]));
    /* domains */
    $('#ninDoms').innerHTML = DOM_ORDER.map((d) => { const L = NIN.goals.filter((g) => g.dom === d); const m = (yr) => { const v = L.map((g) => NIN.prog(g, yr)).filter((x) => x != null); return v.length ? d3.mean(v) : null; }; const cur = m(y), pv = p ? m(p) : null; return `<button class="nin-dom" data-d="${d}" aria-pressed="${STATE.ninDom === d}" style="--dc:${DOM[d].c}" ${L.length ? '' : 'disabled'}><span class="nd-i mono">${DOM[d].i}</span><b>${DOM[d].n}</b><span class="nd-v num">${cur == null ? '<span class="na">—</span>' : F.n(Math.round(cur))}<small>٪</small></span><span class="nd-s">${L.length ? F.i(L.length) + ' هدف' + (pv != null && cur != null ? ` · <i style="color:${cur - pv >= 0 ? C.teal : C.red}">${cur - pv > 0 ? '+' : ''}${F.n(Math.round((cur - pv) * 10) / 10)}</i>` : '') : 'هدفی در این حوزه نیست'}</span>${L.length ? VZ.spark(NIN.YEARS.map((yr) => m(yr)), DOM[d].c, {min: 0, max: 100, label: 'میانگین اهداف حوزه در سال‌های ارزیابی؛ نقطه خاکستری یعنی ناموجود'}) : ''}</button>`; }).join('');
    $$('.nin-dom').forEach((b) => b.onclick = () => { STATE.ninDom = STATE.ninDom === b.dataset.d ? 'all' : b.dataset.d; URLS.replace(true); render(true); });
    /* owners */
    const owners = [...new Set(NIN.inds.map((i) => i.ownS))];
    const om = (o, yr) => { const v = NIN.inds.filter((i) => i.ownS === o && i.weight[yr] > 0 && i.perf[yr] != null).map((i) => i.perf[yr]); return v.length ? {m: d3.mean(v), n: v.length} : null; };
    K.hbar($('#ninOwn'), owners.filter((o) => om(o, y)).sort((a, b) => om(b, y).m - om(a, y).m).map((o) => ({l: o, items: [{n: NIN.yfa(y), v: om(o, y).m, c: C.amber, t: F.p(om(o, y).m, 0) + ' · ' + F.i(om(o, y).n) + ' شاخص'}, ...(p && om(o, p) ? [{n: NIN.yfa(p), v: om(o, p).m, c: '#5d8fbf', t: F.p(om(o, p).m, 0)}] : [])]})), {bar: 12, gap: 3, gp: 12, max: 100});
    /* gap drivers */
    const gd = NIN.goals.flatMap((g2) => NIN.gapRows(g2, y).filter((r) => r.gap != null).map((r) => ({...r, g: g2}))).sort((a, b) => b.gap - a.gap).slice(0, 12);
    K.hbar($('#ninGap'), gd.map((r) => ({l: (r.i.code || '—') + ' · ' + (r.i.title.length > 38 ? LTXT(r.i.title,38) + '…' : r.i.title), v: r.gap, c: C.red, t: '−' + F.n(Math.round(r.gap * 10) / 10) + ' در هدف ' + F.i(r.g.no), tip: [{t: r.i.title}, {t: 'هدف ' + r.g.no + ' · ' + r.g.short}, {t: 'وزن ' + F.p(r.w * 100, 0) + ' · عملکرد ' + F.p(r.p)}]})), {bar: 13, gp: 7});
    /* quality */
    const Q = NIN.S.issues, rq = Q.filter((x) => x.kind === 'reported_differs_from_recomputed'), oq = Q.filter((x) => x.kind === 'overall_not_simple_mean');
    const fl = (f) => NIN.inds.filter((i) => i.flags.includes(f)).length;
    $('#ninQual').innerHTML = `<div class="evl">
      ${rq.map((x) => `<div class="ev"><div><b>هدف ${F.i(x.goal)} · ${NIN.yfa(x.year)}: گزارش ${F.p(x.reported)} ولی بازمحاسبه ${F.p(x.recomputed)}</b><small class="mut">سلول ${esc(x.cell)}. وزن‌ها و عملکرد شاخص‌های همین هدف عدد دیگری می‌دهند؛ ${x.cause === 'text_cells_as_zero' ? 'اگر سلول‌های متنی مانند «۱۰۰/۰۰٪» (شاخص ' + x.text_codes.join('، ') + ') صفر حساب شوند عدد هدف دقیقاً ' + F.p(x.text_as_zero, 2) + ' می‌شود؛ یعنی فرمول فایل آن‌ها را نخوانده است' : x.goal === 19 ? 'اختلاف ده‌برابری محتمل است خطای واحد باشد' : 'علت در فایل توضیح داده نشده'}. عدد گزارش‌شده تغییر داده نشده است.</small></div><div class="val"><span class="badge ${x.cause === 'text_cells_as_zero' ? 'calc' : 'usr'}">${x.cause === 'text_cells_as_zero' ? 'اثر سلول متنی' : 'ناسازگار'}</span></div></div>`).join('')}
      ${Q.filter((x) => x.kind === 'overall_three_totals').map((x) => `<div class="ev"><div><b>${NIN.yfa(x.year)}: سه عدد کل از یک فایل</b><small class="mut">گزارش‌شده ${F.p(x.reported, 2)} برابر جمع وزنی محورهای فایل (${F.p(x.axes_weighted, 2)}) است؛ جمع وزنی اهداف فایل ${F.p(x.goals_weighted, 2)} و بازسازی از شاخص‌ها ${F.p(x.indicators_rebuild, 2)}. سلول ${esc(x.cell)}. هیچ‌کدام جایگزین دیگری نشده است.</small></div><div class="val"><span class="badge calc">محاسبه رادار</span></div></div>`).join('')}
      ${Q.filter((x) => x.kind === 'axis_reported_differs_from_recomputed').map((x) => `<div class="ev"><div><b>محور ${F.i(x.axis)} · ${NIN.yfa(x.year)}: گزارش ${F.p(x.reported, 2)} ولی بازمحاسبه ${F.p(x.recomputed, 2)}</b><small class="mut">وزن محور ${F.n(x.weight)}؛ سلول ${esc(x.cell)}. علت در فایل نیست و باید متولی تأیید کند${x.axis === 6 ? '؛ بیشترین سهم از شکاف عدد کل از همین محور است' : ''}.</small></div><div class="val"><span class="badge usr">ناسازگار</span></div></div>`).join('')}
      <div class="ev"><div><b>عدد کل با میانگین ساده اهداف نمی‌خواند</b><small class="mut">${oq.map((x) => NIN.yfa(x.year) + ': کل ' + F.n(x.reported) + ' در برابر میانگین ' + F.n(x.mean_of_goals)).join(' · ')}. وزن اهداف یا روش تجمیع در فایل نیست، پس تغییر عدد کل را نمی‌توان به اهداف مشخص نسبت داد.</small></div><div class="val"><span class="badge usr">روش نامعلوم</span></div></div>
      ${NIN.S.meta.notes.slice(7).map((t) => `<div class="ev"><div><small class="mut">${esc(t)}</small></div><div class="val"><span class="badge usr">یادداشت داده</span></div></div>`).join('')}
      <div class="ev"><div><b>برچسب ستون وزن</b><small class="mut">${esc(NIN.S.meta.notes[2])}</small></div><div class="val"><span class="badge calc">اصلاح خوانش</span></div></div>
      <div class="ev"><div><b>تغییر وزن و تعریف شاخص‌ها</b><small class="mut">${F.i(fl('weight_changed'))} شاخص وزنشان میان سال‌ها تغییر کرده، ${F.i(fl('definition_changed'))} شاخص تعریفشان عوض شده، ${F.i(fl('removed_later'))} شاخص بعداً حذف شده و ${F.i(fl('new_indicator'))} شاخص جدید است؛ مقایسه سال‌به‌سال درصد هدف‌ها تحت تأثیر همین تغییرهاست.</small></div><div class="val"><span class="badge usr">مقایسه‌پذیری</span></div></div>
      <div class="ev"><div><b>داده ۱۴۰۴</b><small class="mut">نام فایل «۱۴۰۰-۱۴۰۴» است ولی ستون یا مقداری برای ۱۴۰۴ ندارد.</small></div><div class="val"><span class="badge res">ناموجود</span></div></div>
    </div><p class="lead">شناسه فایل (sha256): <span class="mono">${esc(String(NIN.S.meta.sha256).slice(0, 16))}…</span></p>`;
    TBL($('#ninT'), REC.list.filter((r) => r.coll === 'nin' && r.sub === 'شاخص' && (STATE.ninDom === 'all' || r.dom === STATE.ninDom)), {id: 'nin', cols: ['dom', 't', 'v', 'src', 'lim'], ph: 'جست‌وجو: نام شاخص، کد، متولی…'});
  },
};

/* ---------- placement: command view summary + domain scorecards ---------- */
(() => {
  const h0 = V.command.html, d0 = V.command.draw;
  V.command.html = () => {
    const s = h0(), ov = NIN.S.overall, y = NIN.LAST;
    const low = [...NIN.goals].filter((g) => NIN.prog(g, y) != null).sort((a, b) => NIN.prog(a, y) - NIN.prog(b, y)).slice(0, 3);
    const strip = `<section class="p c12 nin-cmd"><header><h3>پایش اهداف عملیاتی شبکه ملی اطلاعات · ارزیابی ${NIN.yfa('1400')} تا ${NIN.yfa(NIN.LAST)}</h3><span class="k">NIN GOALS</span></header>
      <div class="nin-cmd-g"><div class="ch" id="cmdNin"></div><div class="nin-cmd-s">
        <div><span class="dim">پیشرفت کل ${NIN.yfa(y)}</span><b class="num" style="color:${C.amber}">${F.n(ov[y].value)}<small>٪</small></b><small>${NIN.yfa(NIN.prev(y))}: ${F.n(ov[NIN.prev(y)].value)} · ${NIN.yfa('1400')}: ${F.n(ov['1400'].value)}${NIN.YSTAT[y] ? ' · ' + NIN.YSTAT[y] : ''}</small></div>
        <div><span class="dim">ضعیف‌ترین اهداف ${NIN.yfa(y)}</span>${low.map((g) => `<a href="#nin?ninGoal=${g.no}" class="nin-chip" style="--c:${NIN.color(NIN.prog(g, y))}">${F.i(g.no)} · ${esc(g.short)} <b>${F.p(NIN.prog(g, y), 0)}</b></a>`).join('')}</div>
        <div><button class="go" data-go="nin">ورود به پایش کامل اهداف ←</button><small class="dim">فایل کاربر؛ اصالت و روش تجمیع کل احراز نشده</small></div>
      </div></div></section>`;
    return s.replace('<!--NIN-->', SEC(3, 'تحقق اهداف شبکه ملی اطلاعات', 'ارزیابی سالانه ' + NIN.yfa('1400') + ' تا ' + NIN.yfa(NIN.LAST) + '؛ فایل‌های ارسالی کاربر') + '<div class="g">' + strip + '</div>');
  };
  V.command.draw = () => {
    d0();
    BRIEF();
    const el = $('#cmdNin'); if (!el) return;
    const y = NIN.YEARS;
    K.line(el, {xs: y, h: 150, yMin: 0, series: [{name: 'پیشرفت کل', c: C.amber, vals: y.map((yr) => NIN.S.overall[yr].value), w: 2.8, area: true}, {name: 'میانه اهداف', c: C.ice, vals: y.map((yr) => NIN.stats(yr).med), w: 1.4, dash: '4 3'}], yfmt: (v) => F.i(Math.round(v)), tfmt: (v) => F.n(v), endfmt: (v) => F.n(Math.round(v * 10) / 10), xlab: (d) => NIN.yfa(d), xtip: (d) => 'سال ' + NIN.yfa(d)});
    $$('.nin-cmd [data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
  };
  DOM_ORDER.forEach((d) => {
    const v = V['d-' + d]; if (!v) return;
    const h0d = v.html, d0d = v.draw;
    v.html = () => { const L = NIN.goals.filter((g) => g.dom === d || g.cross.includes(d)); if (!L.length) return h0d(); const s = h0d(); return s.replace(/<\/div>\s*$/, '') + `${panel('c12', 'NIN GOALS · ' + L.length, 'اهداف عملیاتی شبکه ملی اطلاعات مرتبط با این حوزه', 'درصد تحقق هر هدف در سال‌های ارزیابی (فایل ارزیابی کاربر). اهداف با نشان «+» ارتباط متقاطع دارند. روی هر هدف بزنید تا در صفحه پایش اهداف باز شود.', `<div class="nin-mini"><div class="nm-row nm-h"><span class="nm-t"></span>${NIN.YEARS.map((yr) => `<span class="nm-c">${NIN.yfa(yr)}</span>`).join('')}</div>${L.map((g) => `<a href="#nin?ninGoal=${g.no}" class="nm-row"><span class="nm-t">${F.i(g.no)} · ${esc(g.short)}${g.dom !== d ? ' <small class="dim">+</small>' : ''}</span>${NIN.YEARS.map((yr) => { const x = NIN.prog(g, yr); return `<span class="nm-c" style="background:${x == null ? '#0e151e' : NIN.color(x)}" title="${NIN.yfa(yr)}: ${x == null ? 'ناموجود' : F.p(x)}">${x == null ? '—' : F.i(Math.round(x))}</span>`; }).join('')}</a>`).join('')}</div>`, '<span class="badge usr">فایل کاربر · احراز نشده</span>')}</div>`; };
    v.draw = () => d0d();
  });
})();

/* ---------- small static SVG visuals for assistant answers (no d3, CSP-safe) ---------- */
const AIVIZ = {
  line(pts, o = {}) {
    // pts: [{x:label, v:number|null}] ; draws defined segments only
    const W = 320, H = o.h || 110, pl = 14, pr = 14, pt = 22, pb = 22, n = pts.length;
    const vs = pts.map((p) => p.v).filter((v) => v != null), lo = o.min ?? 0, hi = o.max ?? Math.max(100, ...vs);
    const X = (i) => pl + (i * (W - pl - pr)) / Math.max(1, n - 1), Y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
    let d = '', pen = false;
    pts.forEach((p, i) => { if (p.v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1); pen = true; });
    const area = pts.every((p) => p.v != null) ? `<path d="${d}L${X(n - 1)} ${H - pb}L${X(0)} ${H - pb}Z" fill="var(--ice)" opacity=".12"/>` : '';
    return `<svg class="aiviz" direction="ltr" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}"><line x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}" stroke="var(--line)"/>${area}<path d="${d}" fill="none" stroke="var(--ice)" stroke-width="2.4"/>${pts.map((p, i) => p.v == null ? `<text x="${X(i)}" y="${H - pb - 6}" text-anchor="middle" class="na">ناموجود</text>` : `<circle cx="${X(i)}" cy="${Y(p.v)}" r="4" fill="var(--bg)" stroke="var(--ice)" stroke-width="2"/><text x="${X(i)}" y="${Y(p.v) - 9}" text-anchor="middle" class="v">${F.n(Math.round(p.v * 100) / 100)}${o.unit || ''}</text>`).join('')}${pts.map((p, i) => `<text x="${X(i)}" y="${H - 6}" text-anchor="middle" class="x">${esc(p.x)}</text>`).join('')}</svg>`;
  },
  div(rows, o = {}) {
    // rows: [{t, v}] diverging bars around zero
    const W = 320, rh = 20, H = rows.length * rh + 8, mid = 100, half = 66;
    rows = rows.filter((r) => Number.isFinite(r.v));
    if (!rows.length) return '';
    const m = Math.max(1e-9, ...rows.map((r) => Math.abs(r.v)));
    return `<svg class="aiviz" direction="ltr" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">${rows.map((r, i) => { const y = 4 + i * rh, w = (Math.abs(r.v) / m) * half, pos = r.v >= 0; return `<text x="${W - 4}" y="${y + 13}" direction="rtl" text-anchor="start" class="x">${esc(r.t)}</text><rect x="${pos ? mid : mid - w}" y="${y + 3}" width="${Math.max(1, w)}" height="${rh - 8}" rx="3" fill="${pos ? 'var(--ok)' : 'var(--bad, #ff5a54)'}" opacity=".85"/><text x="${pos ? mid + w + 4 : mid - w - 4}" y="${y + 13}" text-anchor="${pos ? 'start' : 'end'}" class="v">${pos ? '+' : '−'}${F.n(Math.round(Math.abs(r.v) * 10) / 10)}</text>`; }).join('')}<line x1="${mid}" x2="${mid}" y1="0" y2="${H}" stroke="var(--dim)"/></svg>`;
  },
};

/* Evidence-based trend analysis of the NIN file (ported from the user-supplied v4.4 assistant fix; no causal inference from scores alone). */
const NIN_TREND = () => {
  const {tbl, src, goBtn} = AI;
  const ys = NIN.YEARS, ov = NIN.S.overall, a = ys[0], z = ys[ys.length - 1], prev = NIN.prev(z);
  const total = ov[z].value - ov[a].value, last = ov[z].value - ov[prev].value;
  const dl = (g) => NIN.delta(g, prev, z);
  const comparable = NIN.goals.filter((g) => dl(g) != null);
  const up = comparable.filter((g) => dl(g) > 0.05), down = comparable.filter((g) => dl(g) < -0.05);
  const leaders = [...comparable].sort((x, y) => dl(y) - dl(x)), lag = [...comparable].sort((x, y) => dl(x) - dl(y));
  const low = NIN.goals.filter((g) => NIN.prog(g, z) != null).sort((x, y) => NIN.prog(x, z) - NIN.prog(y, z)).slice(0, 3);
  const fmt = (n) => F.n(Math.round(n * 100) / 100), title = (g) => 'هدف ' + F.i(g.no) + ' · ' + esc(g.short);
  const changes = (L) => L.slice(0, 3).map((g) => title(g) + ' (' + (dl(g) > 0 ? '+' : '') + fmt(dl(g)) + ' واحد درصد)').join('؛ ');
  const movers = [...leaders.filter((g) => dl(g) > 0.05).slice(0, 3), ...lag.filter((g) => dl(g) < -0.05).slice(0, 3).reverse()];
  return {h: 'تحلیل روند توسعه شبکه ملی اطلاعات',
    b: `<p><b>جمع‌بندی تحلیلی:</b> پیشرفت کل درج‌شده در فایل‌ها از ${fmt(ov[a].value)}٪ در ${NIN.yfa(a)} به ${fmt(ov[z].value)}٪ در ${NIN.yfa(z)} رسیده؛ ${fmt(total)} واحد درصد ${total < 0 ? 'کاهش' : 'افزایش'}. ${NIN.yfa(z)} نسبت به ${NIN.yfa(prev)} ${fmt(Math.abs(last))} واحد درصد ${last < 0 ? 'کاهش' : 'افزایش'} دارد. ${z > '1403' ? 'تا ' + NIN.yfa('1403') + ' عملکرد تأییدشده ناظر است و ' + NIN.yfa('1404') + ' و ' + NIN.yfa('1405') + ' خودارزیابی وزارت با ساختار اهداف و وزن‌های متفاوت؛ مقایسه مستقیم این دو بخش با احتیاط معتبر است و ' + NIN.yfa('1405') + ' تا پایان شهریور است، نه پایان سال. ' + (NIN.issueOf3 && NIN.issueOf3(z) ? 'عدد ' + NIN.yfa(z) + ' برابر جمع وزنی محورهای فایل است؛ بازسازی همان ماه از شاخص‌ها ' + fmt(NIN.issueOf3(z).indicators_rebuild) + '٪ می‌دهد، پس افت گزارش‌شده را بدون تأیید متولی نمی‌توان افت واقعی خواند.' : '') : 'مسیر پیوسته صعودی نیست.'}</p>
    ${AIVIZ.line(ys.map((y) => ({x: NIN.yfa(y), v: ov[y].value})), {unit: '٪', label: 'پیشرفت کل شبکه ملی اطلاعات در سال‌های ارزیابی'})}
    <h6>۱. داده چه می‌گوید؟</h6>${tbl(['سال', 'پیشرفت کل درج‌شده', 'تغییر نسبت به سال قبل'], ys.map((y, i) => [NIN.yfa(y), fmt(ov[y].value) + '٪', i ? fmt(ov[y].value - ov[ys[i - 1]].value) + ' واحد درصد' : 'مبنا']))}
    <h6>۲. رشد در همه اهداف یکسان نبوده</h6><p>در ${NIN.yfa(z)} نسبت به ${NIN.yfa(prev)}، ${F.i(up.length)} هدف بهبود و ${F.i(down.length)} هدف افت بیش از ۰٫۰۵ واحد درصد داشته‌اند. این آستانه فقط برای توصیف است و معیار مصوب نیست؛ اهداف بی‌مقدار در یکی از دو سال کنار گذاشته شده‌اند.</p>
    ${movers.length ? AIVIZ.div(movers.map((g) => ({t: 'هدف ' + F.i(g.no) + ' · ' + g.short.slice(0, 22), v: dl(g)})), {label: 'بیشترین بهبود و افت اهداف'}) : ''}
    <p><b>بیشترین بهبودها:</b> ${changes(leaders.filter((g) => dl(g) > 0.05)) || 'وجود ندارد'}.</p><p><b>بیشترین افت‌ها:</b> ${changes(lag.filter((g) => dl(g) < -0.05)) || 'وجود ندارد'}.</p>
    <h6>۳. گلوگاه‌های قابل پیگیری</h6><p>کمترین درصد تحقق در آخرین سال: ${low.map((g) => title(g) + '، ' + fmt(NIN.prog(g, z)) + '٪').join('؛ ')}. این‌ها اولویت بررسی شاخص‌های زیرمجموعه‌اند؛ رتبه پایین به‌تنهایی علت اجرایی یا اثر بر تجربه مردم را نشان نمی‌دهد.</p>
    <h6>۴. چه نتیجه‌ای نمی‌توان گرفت؟</h6><p>این درصدها ارزیابی تحقق اهداف‌اند و سرعت، پوشش، رضایت یا کیفیت تجربه مردم را مستقیم اندازه نمی‌گیرند. تعریف و وزن بعضی شاخص‌ها عوض شده و برای بعضی اهداف عدد گزارش‌شده با بازمحاسبه نمی‌خواند. وزن اهداف تا ۱۴۰۳ در فایل نیست و در ۱۴۰۵ جمع وزنی آن‌ها با عدد کل نمی‌خواند؛ پس نسبت دادن تغییر کل به یک متولی یا هدف خاص اثبات‌پذیر نیست. اصالت سند هم مستقل احراز نشده است.</p>
    <h6>۵. اقدام مدیریتی پیشنهادی</h6><p>اول روش تجمیع شاخص کل و منطق تغییر وزن‌ها روشن شود. بعد برای اهداف کم‌تحقق، شاخص‌های سازنده شکاف، مسئول اجرا و زمان‌بندی پیگیری تعیین شود. اثر واقعی توسعه را باید کنار داده هم‌دوره پوشش، اشتراک فعال، کیفیت و تجربه مردم سنجید؛ پایش آنلاین جای کارنامه سالانه را نمی‌گیرد.</p>
    ${src('NIN1400-1404.xlsx؛ کاربرگ‌های ارزیابی و روش‌شناسی، دوره‌های ۱۴۰۰ تا ۱۴۰۳ تأییدشده و ۱۴۰۴ و ۱۴۰۵ خودارزیابی وزارت (NIN.1405.07.xlsx)؛ اختلاف و رتبه از داده همین فایل‌ها محاسبه شده')}${goBtn('nin', 'مشاهده اهداف و جزئیات شاخص‌ها')}`,
    ctx: {kind: 'ninTrend', ent: 'overall'}};
};

/* ---------- assistant: offline analysis of the NIN goals file ---------- */
const NINQ = (q, raw, ctx) => {
  const {has, tbl, src, goBtn} = AI;
  const lab = (t) => `<b class="lab">${t}:</b> `, SAYS = lab('منبع می‌گوید'), CALC = lab('محاسبه رادار'), INFER = lab('استنباط دستیار');
  const SRC = src('فایل‌های NIN1400-1404.xlsx و NIN.1405.07.xlsx ارسالی کاربر؛ اصالت سند و روش تجمیع کل احراز نشده');
  const fp = (v) => (v == null ? 'ناموجود' : F.p(v));
  const warn = (g, a, b) => (NIN.issueOf(g.no, a) || NIN.issueOf(g.no, b) ? ' ⚠' : '');
  const r1 = (v) => Math.round(v * 10) / 10;
  const isNin = /(^| )(هدف|اهداف|متولی|متولیان|nin)( |$)|اهداف عملیاتی|پیشرفت شبکه ملی|تحقق اهداف|کد شاخص|شاخص \d{3}|ارزیابی سالانه/.test(q) || (/شبکه ملی/.test(q) && /پیشرفت|تحقق|ارزیابی|درصد/.test(q));
  const otherEnt = AI.findProvs(q).length || AI.findOps(q).length || AI.findPlats(q).length;
  const follow = ctx && String(ctx.kind || '').startsWith('nin') && !otherEnt && (/^(همین|همان|برای|حالا|و) /.test(q) || /هدف \d/.test(q));
  if (!isNin && !follow) return null;
  const years = [...q.matchAll(/(?<!\d)(140\d)(?!\d)/g)].map((m) => m[1]);
  const Y = years.find((y) => NIN.YEARS.includes(y)) || NIN.LAST, P = NIN.prev(Y);
  const stripped = q.replace(/(?<!\d)(140\d)(?!\d)/g, ' ');
  let gnos = /هدف|اهداف|همین|همان/.test(q) ? [...stripped.matchAll(/(?<!\d)(\d{1,2})(?!\d)/g)].map((m) => +m[1]).filter((n) => NIN.byNo[n]) : [];
  if (!gnos.length) Object.entries(NIN.KEYS).forEach(([n, ks]) => { if (ks.some((k) => { const nk = AI.norm(k); return nk.length <= 3 && /[آ-ی]/.test(nk) ? (' ' + q).includes(' ' + nk) : q.includes(nk); })) gnos.push(+n); });
  gnos = [...new Set(gnos)];
  const codes = [...stripped.matchAll(/(?<!\d)(\d{3})(?!\d)/g)].map((m) => m[1]).filter((c) => NIN.inds.some((i) => i.code === c));
  const owner = Object.entries({'رگولاتوری': ['رگولاتوری', 'تنظیم مقررات'], 'سازمان فناوری اطلاعات': ['سازمان فناوری اطلاعات', 'فناوری اطلاعات ایران'], 'ارتباطات زیرساخت': ['ارتباطات زیرساخت', 'شرکت زیرساخت'], 'کمیته راهبری امنیت': ['کمیته راهبری امنیت', 'کمیته امنیت'], 'معاونت فناوری و نوآوری': ['معاونت فناوری', 'نوآوری']}).find(([, ks]) => ks.some((k) => q.includes(AI.norm(k))));
  const dom = DOM_ORDER.find((d) => q.includes(AI.norm(DOM[d].n)) || (d === 'security' && /امنیت/.test(q) && !owner) || (d === 'governance' && /حکمرانی/.test(q)));
  const goalPara = (g) => {
    const v = NIN.prog(g, Y), pv = P ? NIN.prog(g, P) : null, rk = [...NIN.goals].filter((x) => NIN.prog(x, Y) != null).sort((a, b) => NIN.prog(b, Y) - NIN.prog(a, Y)).findIndex((x) => x === g) + 1;
    const gaps = NIN.gapRows(g, Y).filter((r) => r.gap != null).sort((a, b) => b.gap - a.gap);
    const dc = P ? NIN.decomp(g, P, Y) : [];
    const iss = NIN.YEARS.map((yr) => NIN.issueOf(g.no, yr)).filter(Boolean);
    return `<p>${SAYS}هدف ${F.i(g.no)} («${esc(g.title)}») در ${NIN.yfa(Y)} درصد تحقق ${fp(v)} ثبت کرده${pv != null ? `؛ در ${NIN.yfa(P)} ${fp(pv)} بود` : ''}. مسیر سال‌های ارزیابی: ${NIN.YEARS.map((yr) => NIN.yfa(yr) + ' ' + fp(NIN.prog(g, yr))).join('، ')}. متولی: ${g.owners.map((o) => esc(NIN.OWN[o] || o)).join('، ') || 'نامشخص'}.</p>
      <p>${CALC}${v != null ? `رتبه ${F.i(rk)} از ${F.i(NIN.goals.filter((x) => NIN.prog(x, Y) != null).length)} هدف در ${NIN.yfa(Y)}. ` : ''}${g.recomputed[Y] != null ? `بازمحاسبه از وزن × عملکرد شاخص‌ها ${fp(g.recomputed[Y])} می‌دهد${iss.find((x) => x.year === Y) ? ' و با عدد گزارش‌شده نمی‌خواند' : ' و با عدد گزارش‌شده سازگار است'}.` : ''}</p>
      ${gaps.length ? `<h6>کدام شاخص‌ها فاصله تا ۱۰۰٪ را ساخته‌اند (${NIN.yfa(Y)})</h6>${tbl(['کد', 'شاخص', 'وزن', 'عملکرد', 'سهم از شکاف'], gaps.slice(0, 5).map((r) => [`<a href="#" data-rk="nin:${NIN.idOf(r.i)}" class="mono" style="color:var(--ice)">${esc(r.i.code || '—')}</a>`, esc(LTXT(r.i.title,70)), F.p(r.w * 100, 0), fp(r.p), F.n(r1(r.gap))]))}` : ''}
      ${dc.length ? `<p>${CALC}تغییر ${NIN.yfa(P)}→${NIN.yfa(Y)} به تفکیک شاخص (Δ وزن × عملکرد): ${dc.slice(0, 2).concat(dc.slice(-2).filter((r) => r.d > 0)).map((r) => `${esc(r.i.code || '—')} ${r.d > 0 ? '+' : ''}${F.n(r1(r.d))}${r.wChanged ? ' (وزن عوض شده)' : ''}`).join('، ')}.</p>` : ''}
      ${iss.length ? `<p>${INFER}در ${iss.map((x) => NIN.yfa(x.year)).join(' و ')} درصد گزارش‌شده این هدف با محاسبه وزنی شاخص‌ها نمی‌خواند (${iss.map((x) => x.cell).join('، ')}); تا روشن شدن علت، روند این سال‌ها را با احتیاط بخوانید.</p>` : ''}`;
  };
  // compare two goals
  if (gnos.length >= 2) return {h: `مقایسه اهداف ${gnos.slice(0, 4).map(F.i).join('، ')}`, b: `${tbl(['سال', ...gnos.slice(0, 4).map((n) => F.i(n) + ' · ' + esc(NIN.byNo[n].short))], NIN.YEARS.map((yr) => [NIN.yfa(yr), ...gnos.slice(0, 4).map((n) => fp(NIN.prog(NIN.byNo[n], yr)))]))}<p>${INFER}درصد تحقق هر هدف میانگین وزنی شاخص‌های همان هدف است؛ شاخص‌ها و وزن‌های دو هدف متفاوت‌اند، پس برابری عدد به معنی هم‌سطحی تحقق در عمل نیست.</p>${SRC}${goBtn('nin', 'نمایش در پایش اهداف')}`, act: () => { STATE.ninGoal = gnos[0]; }, ctx: {kind: 'ninGoal', ent: gnos[0]}};
  if (gnos.length === 1) { const g = NIN.byNo[gnos[0]]; return {h: `هدف ${F.i(g.no)} · ${g.short} (${NIN.yfa(Y)})`, b: goalPara(g) + SRC + goBtn('nin', 'باز کردن جزئیات هدف'), act: () => { STATE.ninGoal = g.no; STATE.ninYear = Y; }, ctx: {kind: 'ninGoal', ent: g.no}}; }
  if (codes.length) {
    const i = NIN.inds.find((x) => x.code === codes[0]);
    return {h: `شاخص ${i.code} · هدف ${F.i(i.g.no)}`, b: `<p>${SAYS}«${esc(i.title)}»؛ متولی: ${esc(i.own || 'نامشخص')}.</p>${tbl(['سال', 'وزن در هدف', 'عملکرد'], NIN.PY.map((yr) => [NIN.yfa(yr), i.weight[yr] == null ? '—' : F.p(i.weight[yr] * 100, 0), fp(i.perf[yr])]))}${(() => { const fy = [...NIN.PY].reverse().find((yr) => i.formula[yr]); const py = [...NIN.PY].reverse().find((yr) => i.params[yr]); return (fy ? `<p><b>فرمول (${NIN.yfa(fy)}):</b> <span class="mono" dir="ltr">${esc(i.formula[fy])}</span></p>` : '') + (py ? `<p><b>تعریف پارامترها:</b> ${esc(LTXT(i.params[py], 400))}</p>` : ''); })()}<p>${INFER}عملکرد شاخص با درصد تحقق هدف یکی نیست؛ سهم این شاخص در هدف ${F.i(i.g.no)} = وزن × عملکرد${i.weight[Y] ? ` = ${F.n(r1(i.weight[Y] * (i.perf[Y] || 0)))} واحد در ${NIN.yfa(Y)}` : ''}.${i.flags.length ? ' هشدار: ' + i.flags.map((f) => ({definition_changed: 'تعریف تغییر کرده', removed_later: 'بعداً حذف شده', new_indicator: 'شاخص جدید', owner_missing_sheet1: 'متولی در کاربرگ اول خالی', owner_differs_between_sheets: 'متولی دو کاربرگ متفاوت', weight_changed: 'وزن میان سال‌ها تغییر کرده'}[f])).join('، ') + '.' : ''}</p>${SRC}<a href="#" data-rk="nin:${NIN.idOf(i)}" class="go">شناسنامه شاخص</a>`, ctx: {kind: 'ninInd', ent: i.code}};
  }
  if (/(^| )(همین|همان)( |$)/.test(q) && ctx && ctx.kind === 'ninGoal') return {h: 'برای کدام هدف؟', b: '<p>شماره هدف را بنویسید؛ مثلاً «همین را برای هدف ۱۴».</p>'};
  if (owner) {
    const [os] = owner, L = NIN.inds.filter((i) => i.ownS === os);
    const gs = [...new Set(L.map((i) => i.g))];
    const m = (yr) => { const v = L.filter((i) => i.weight[yr] > 0 && i.perf[yr] != null).map((i) => i.perf[yr]); return v.length ? d3.mean(v) : null; };
    const weak = L.filter((i) => i.weight[Y] > 0 && i.perf[Y] != null).sort((a, b) => a.perf[Y] - b.perf[Y]).slice(0, 5);
    return {h: `${os} در اهداف شبکه ملی (${NIN.yfa(Y)})`, b: `<p>${SAYS}${F.i(L.length)} شاخص در ${F.i(gs.length)} هدف به این متولی سپرده شده: ${gs.map((g) => F.i(g.no) + ' ' + esc(g.short)).join('، ')}.</p><p>${CALC}میانگین ساده عملکرد شاخص‌های وزن‌دار: ${NIN.PY.map((yr) => NIN.yfa(yr) + ' ' + fp(m(yr))).join('، ')}.</p><h6>ضعیف‌ترین شاخص‌ها در ${NIN.yfa(Y)}</h6>${tbl(['کد', 'شاخص', 'هدف', 'عملکرد'], weak.map((i) => [`<a href="#" data-rk="nin:${i.id}" class="mono" style="color:var(--ice)">${esc(i.code)}</a>`, esc(LTXT(i.title,70)), F.i(i.g.no), fp(i.perf[Y])]))}<p>${INFER}میانگین عملکرد شاخص‌ها کارنامه متولی نیست؛ دشواری و وزن شاخص‌ها و منابع اختصاص‌یافته متفاوت است و فایل درباره علت عقب‌ماندگی توضیحی ندارد.</p>${SRC}${goBtn('nin')}`, ctx: {kind: 'ninOwner', ent: os}};
  }
  if (dom) {
    const L = NIN.goals.filter((g) => g.dom === dom || g.cross.includes(dom));
    return {h: `اهداف شبکه ملی در حوزه ${DOM[dom].n}`, b: `${tbl(['هدف', ...NIN.YEARS.map(NIN.yfa)], L.map((g) => [F.i(g.no) + ' · ' + esc(g.short) + (g.dom !== dom ? ' <small>(متقاطع)</small>' : ''), ...NIN.YEARS.map((yr) => fp(NIN.prog(g, yr)))]))}<p>${CALC}میانگین ساده اهداف مالک این حوزه در ${NIN.yfa(Y)}: ${fp(d3.mean(L.filter((g) => g.dom === dom).map((g) => NIN.prog(g, Y)).filter((v) => v != null)))}. نگاشت هدف به حوزه قاعده NIN_GOAL_MAP_V1 رادار است، نه بخشی از فایل.</p>${SRC}${goBtn('nin')}`, act: () => { STATE.ninDom = dom; }, ctx: {kind: 'ninDom', ent: dom}};
  }
  if (/ناسازگار|اعتماد|اعتبار|کیفیت داده|ایراد|خطا|بازتولید|بازمحاسبه|درست است/.test(q)) {
    const I = NIN.S.issues;
    return {h: 'اعتبار و سازگاری فایل اهداف شبکه ملی', b: `<ul>${I.filter((x) => x.kind === 'reported_differs_from_recomputed').map((x) => `<li>هدف ${F.i(x.goal)} در ${NIN.yfa(x.year)}: گزارش ${F.p(x.reported)} ولی Σ وزن × عملکرد شاخص‌ها ${F.p(x.recomputed)} (${esc(x.cell)}).</li>`).join('')}<li>عدد کل در هیچ سالی با میانگین ساده اهداف نمی‌خواند (${I.filter((x) => x.kind === 'overall_not_simple_mean').map((x) => NIN.yfa(x.year) + ': ' + F.n(x.reported) + ' در برابر ' + F.n(x.mean_of_goals)).join('، ')})؛ وزن اهداف در فایل نیست.</li>${NIN.S.meta.notes.slice(2, 7).map((n) => `<li>${esc(n)}</li>`).join('')}</ul><p>${INFER}${(() => { const C2 = NIN.consistency(); return `از ${F.i(C2.n)} مقدار هدف‌سال که بازمحاسبه‌پذیر است، ${F.i(C2.bad)} مورد ناسازگار است و در بقیه بیشترین اختلاف گزارش با بازمحاسبه ${F.n(Math.round(C2.maxOk * 100) / 100)} واحد درصد است (محاسبه رادار در همین لحظه)`; })()}؛ پس منطق درونی فایل در مجموع منسجم است، ولی اصالت سند و نهاد صادرکننده با این آزمون احراز نمی‌شود.</p>${SRC}${goBtn('nin')}`, ctx: {kind: 'ninAll'}};
  }
  const ranked = [...NIN.goals].filter((g) => NIN.prog(g, Y) != null).sort((a, b) => NIN.prog(a, Y) - NIN.prog(b, Y));
  if (/افت|کاهش|عقب|بدتر|بهبود|افزایش|رشد|پیشرفت کرد|تغییر/.test(q) && P && !/چرا/.test(q)) {
    const ch = NIN.goals.filter((g) => NIN.delta(g, P, Y) != null).sort((a, b) => NIN.delta(a, P, Y) - NIN.delta(b, P, Y));
    const down = /افت|کاهش|عقب|بدتر/.test(q), L = down ? ch.slice(0, 6) : ch.slice(-6).reverse();
    return {h: `${down ? 'بیشترین افت' : 'بیشترین بهبود'} اهداف · ${NIN.yfa(P)}→${NIN.yfa(Y)}`, b: `${tbl(['هدف', NIN.yfa(P), NIN.yfa(Y), 'تغییر'], L.map((g) => [F.i(g.no) + ' · ' + esc(g.short) + warn(g, P, Y), fp(NIN.prog(g, P)), fp(NIN.prog(g, Y)), (NIN.delta(g, P, Y) > 0 ? '+' : '') + F.n(r1(NIN.delta(g, P, Y)))]))}<p>${CALC}${F.i(ch.filter((g) => NIN.delta(g, P, Y) > 0.05).length)} هدف بهبود و ${F.i(ch.filter((g) => NIN.delta(g, P, Y) < -0.05).length)} هدف افت داشته‌اند. ${L[0] ? `بزرگ‌ترین مورد، هدف ${F.i(L[0].no)}: ` + NIN.decomp(L[0], P, Y).filter((r) => (down ? r.d < 0 : r.d > 0)).sort((a, b) => (down ? a.d - b.d : b.d - a.d)).slice(0, 2).map((r) => `شاخص ${esc(r.i.code || '—')} (${r.d > 0 ? '+' : ''}${F.n(r1(r.d))}${r.wChanged ? '، وزن عوض شده' : ''})`).join(' و ') + '.' : ''}</p><p>${INFER}بخشی از تغییرها از تغییر وزن یا تعریف شاخص‌ها می‌آید، نه فقط تغییر عملکرد؛ ستون «وزن عوض شده» را ببینید.</p>${SRC}${goBtn('nin')}`, act: () => { STATE.ninSort = 'delta'; STATE.ninYear = Y; }, ctx: {kind: 'ninAll'}};
  }
  if (/ضعیف|کمترین|پایین|بدترین|بهترین|بیشترین|قوی|بالاترین|رتبه/.test(q)) {
    const low = !/بهترین|بیشترین|قوی|بالاترین/.test(q), L = low ? ranked.slice(0, 6) : ranked.slice(-6).reverse();
    return {h: `${low ? 'ضعیف‌ترین' : 'قوی‌ترین'} اهداف شبکه ملی در ${NIN.yfa(Y)}`, b: `${tbl(['هدف', 'درصد تحقق', 'متولی', 'شاخص با بیشترین شکاف'], L.map((g) => { const gp = NIN.gapRows(g, Y).filter((r) => r.gap != null).sort((a, b) => b.gap - a.gap)[0]; return [F.i(g.no) + ' · ' + esc(g.short), fp(NIN.prog(g, Y)), esc(g.owners.map((o) => NIN.OWN[o] || o).join('، ')), gp ? esc((gp.i.code || '') + ' ' + LTXT(gp.i.title,50)) : '—']; }))}<p>${INFER}درصد پایین یک هدف ممکن است از یک شاخص پروزن با عملکرد صفر بیاید؛ ستون آخر همان شاخص را نشان می‌دهد. ${ranked.length < NIN.goals.length ? F.i(NIN.goals.length - ranked.length) + ' هدف در این سال مقدار ندارند و در رتبه‌بندی نیستند.' : ''}</p>${SRC}${goBtn('nin')}`, ctx: {kind: 'ninAll'}};
  }
  // overall (default)
  const st = NIN.stats(Y), ov = NIN.S.overall, d = P ? ov[Y].value - ov[P].value : null;
  const ch = P ? NIN.goals.filter((g) => NIN.delta(g, P, Y) != null) : [];
  const why = /چرا|علت|دلیل/.test(q), t3 = NIN.issueOf3(Y), cross = P && +P < 1404 && +Y >= 1404;
  return {h: why ? `چرا پیشرفت کل در ${NIN.yfa(Y)} ${d != null && d < 0 ? 'کم شد' : 'این‌طور تغییر کرد'}؟` : `پیشرفت کل شبکه ملی اطلاعات · ${NIN.yfa(Y)}`, b: `<p>${SAYS}درصد پیشرفت کل: ${NIN.YEARS.map((yr) => NIN.yfa(yr) + ' ' + F.n(ov[yr].value)).join('، ')} (${esc(ov[Y].cell)}).</p>
    <p>${CALC}در ${NIN.yfa(Y)} میانه ${F.i(st.n)} هدف ${F.p(st.med)} و میانگین ساده ${F.p(st.mean)} است؛ ${F.i(ranked.filter((g) => NIN.prog(g, Y) >= 75).length)} هدف ۷۵٪ و بیشتر و ${F.i(ranked.filter((g) => NIN.prog(g, Y) < 40).length)} هدف زیر ۴۰٪.${P ? ` نسبت به ${NIN.yfa(P)}، ${F.i(ch.filter((g) => NIN.delta(g, P, Y) > 0.05).length)} هدف بهبود و ${F.i(ch.filter((g) => NIN.delta(g, P, Y) < -0.05).length)} هدف افت داشته‌اند و میانگین ساده اهداف ${F.n(r1(d3.mean(ch, (g) => NIN.delta(g, P, Y))))} واحد تغییر کرده، در حالی که عدد کل ${d > 0 ? '+' : ''}${F.n(Math.round(d * 100) / 100)} واحد تغییر کرده است.` : ''}</p>
    ${cross ? `<p>${INFER}<span>این مقایسه از مرز ۱۴۰۳ به ۱۴۰۴ می‌گذرد: تا ۱۴۰۳ عملکرد را ناظر تأیید کرده و از ۱۴۰۴ خوداظهاری وزارتخانه است و دامنه اهداف و شاخص‌ها هم گسترده‌تر شده است؛ جهش را نباید بهبود واقعی عملکرد خواند.</span></p>` : ''}
    ${why && P ? `<p>${INFER}${t3 ? `<span>در فایل ${NIN.yfa(Y)} سه عدد کل وجود دارد: گزارش‌شده ${F.n(t3.reported)}، جمع وزنی اهداف ${F.n(t3.goals_weighted)} و بازسازی از شاخص‌ها ${F.n(t3.indicators_rebuild)}. اختلاف اهداف ۱، ۲، ۳ و ۵ با صفر شمرده‌شدن سلول‌های متنی مانند «۱۰۰/۰۰٪» دقیقاً بازتولید می‌شود، اما اختلاف محورها (به‌ویژه محور ۶) علت مستند ندارد و باید متولی تأیید کند؛ </span>` : 'فایل وزن اهداف یا روش تجمیع عدد کل را ندارد و عدد کل با میانگین اهداف بازتولید نمی‌شود؛ '}پس تغییر ${F.n(Math.round(d * 100) / 100)} واحدی را نمی‌توان با قطعیت به اهداف مشخص نسبت داد. آنچه داده نشان می‌دهد: بیشترین افت‌ها در ${ch.sort((a, b) => NIN.delta(a, P, Y) - NIN.delta(b, P, Y)).slice(0, 3).map((g) => 'هدف ' + F.i(g.no) + ' (' + F.n(r1(NIN.delta(g, P, Y))) + warn(g, P, Y) + ')').join('، ')} (⚠ یعنی عدد گزارش‌شده یکی از دو سال با بازمحاسبه نمی‌خواند) و بیشترین بهبودها در ${ch.slice(-3).reverse().map((g) => 'هدف ' + F.i(g.no) + ' (+' + F.n(r1(NIN.delta(g, P, Y))) + ')').join('، ')} بوده است. اگر اهداف امنیتی و خدمات پایه وزن بیشتری در عدد کل داشته باشند، افت آن‌ها می‌تواند بهبود اهداف دیگر را خنثی کند؛ این فرضیه است و با فایل آزمودنی نیست. افزون بر این، ${F.i(NIN.inds.filter((i) => i.flags.includes('weight_changed')).length)} شاخص وزنشان میان سال‌ها تغییر کرده است.</p>` : `<p>${INFER}عدد کل با میانگین ساده اهداف نمی‌خواند و روش تجمیع آن در فایل نیامده است؛ برای داوری، کنار عدد کل به توزیع اهداف هم نگاه کنید.</p>`}
    ${SRC}${goBtn('nin', 'پایش کامل اهداف')}`, act: () => { STATE.ninYear = Y; }, ctx: {kind: 'ninAll'}};
};
