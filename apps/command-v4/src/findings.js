/* ===== analytical findings for the assistant =====
   Every finding is built from the live data objects (D, M, NIN) at answer time, never from typed-in numbers.
   Shape of an answer: claim, evidence table, chart, radar computation, assistant reading, limits, what would settle it.
   Wrapped around AI.route; the existing handlers stay as they are and only gain a chart when they had none. */
const FT = (fa, en) => (window.RADAR_I18N && window.RADAR_I18N.lang === 'en' ? en : fa);

/* ---------- more static SVG visuals (same visual language as AIVIZ.line / AIVIZ.div) ---------- */
const VPAL = ['var(--ice)', 'var(--amber)', 'var(--teal)', 'var(--violet)', 'var(--pink)', 'var(--red)'];
AIVIZ.bars = (rows, o = {}) => {
  rows = rows.filter((r) => Number.isFinite(r.v));
  if (!rows.length) return '';
  const W = 320, rh = 22, H = rows.length * rh + 8, lw = 118, max = o.max ?? Math.max(1e-9, ...rows.map((r) => r.v)), bw = W - lw - 50;
  return `<svg class="aiviz" direction="ltr" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">${rows.map((r, i) => { const y = 4 + i * rh, w = Math.max(1, (r.v / max) * bw); return `<text x="${W - 4}" y="${y + 14}" direction="rtl" text-anchor="start" class="x">${esc(r.t)}</text><rect x="4" y="${y + 3}" width="${w.toFixed(1)}" height="${rh - 8}" rx="3" fill="${r.c || VPAL[0]}" opacity=".85"/><text x="${(6 + w).toFixed(1)}" y="${y + 14}" class="v">${esc((r.fmt || o.fmt || F.n)(r.v))}</text>`; }).join('')}</svg>`;
};
AIVIZ.lines = (series, labels, o = {}) => {
  const W = 320, H = o.h || 150, pl = 36, pr = 10, pt = 26, pb = 20, n = labels.length;
  const vs = series.flatMap((s) => s.pts).filter((v) => v != null);
  if (!vs.length || n < 2) return '';
  let lo = o.min ?? Math.min(...vs), hi = o.max ?? Math.max(...vs);
  if (lo === hi) hi = lo + 1;
  const pad = (hi - lo) * 0.08; if (o.min == null) lo -= pad; if (o.max == null) hi += pad;
  const X = (i) => pl + (i * (W - pl - pr)) / (n - 1), Y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb), fm = o.fmt || ((v) => F.n(Math.round(v * 10) / 10));
  const grid = [0, 0.5, 1].map((t) => { const v = lo + (hi - lo) * t, y = Y(v); return `<line x1="${pl}" x2="${W - pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-dasharray="2 3"/><text x="${pl - 4}" y="${(y + 3).toFixed(1)}" text-anchor="end" class="x">${esc(fm(v))}</text>`; }).join('');
  const paths = series.map((s, k) => { let d = '', pen = false; s.pts.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; }); const li = s.pts.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0).pop(); return `<path d="${d}" fill="none" stroke="${s.c || VPAL[k % 6]}" stroke-width="2.2"/>${li >= 0 ? `<circle cx="${X(li).toFixed(1)}" cy="${Y(s.pts[li]).toFixed(1)}" r="3.2" fill="${s.c || VPAL[k % 6]}"/>` : ''}`; }).join('');
  const leg = series.map((s, k) => `<text x="${pl + k * 92}" y="12" text-anchor="start" class="x"><tspan fill="${s.c || VPAL[k % 6]}">●</tspan> ${esc(s.name)}</text>`).join('');
  const xl = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => `<text x="${X(i).toFixed(1)}" y="${H - 5}" text-anchor="middle" class="x">${esc(labels[i])}</text>`).join('');
  return `<svg class="aiviz" direction="ltr" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">${grid}${paths}${leg}${xl}</svg>`;
};
AIVIZ.stack = (rows, legend, o = {}) => {
  rows = rows.filter((r) => r.parts.some((p) => p.v > 0));
  if (!rows.length) return '';
  const W = 320, rh = 24, lw = 74, H = rows.length * rh + 30, bw = W - lw - 8;
  const body = rows.map((r, i) => { const t = r.parts.reduce((s, p) => s + p.v, 0), y = 22 + i * rh; let x = 4; return `<text x="${W - 4}" y="${y + 14}" direction="rtl" text-anchor="start" class="x">${esc(r.t)}</text>${r.parts.map((p, k) => { const w = (p.v / t) * bw, s = `<rect x="${x.toFixed(1)}" y="${y + 2}" width="${Math.max(0, w).toFixed(1)}" height="${rh - 7}" fill="${p.c || VPAL[k % 6]}" opacity=".88"><title>${esc((legend[k] || {}).n || '')}: ${((p.v / t) * 100).toFixed(1)}%</title></rect>`; x += w; return s; }).join('')}`; }).join('');
  const leg = legend.map((l, k) => `<text x="${4 + k * 62}" y="11" class="x"><tspan fill="${l.c}">■</tspan> ${esc(l.n)}</text>`).join('');
  return `<svg class="aiviz" direction="ltr" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">${leg}${body}</svg>`;
};

const FIND = (() => {
  const {tbl, src, goBtn, has, norm} = AI;
  const lab = (t) => `<b class="lab">${t}:</b> `;
  const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;
  const nf = (v, d = 1) => F.n(Math.round(v * 10 ** d) / 10 ** d);
  const sg = (v, d = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + F.n(Math.round(Math.abs(v) * 10 ** d) / 10 ** d);
  const mil = (v) => F.n(Math.round(v / 1e4) / 100);
  const fd = (t) => String(t).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const per = (p) => { const r = D.fixedQ.find((x) => x.p === p); return FT(r ? r.l : String(p).replace(/^(\d+)-Q(\d)/, (m, y, q) => ['بهار', 'تابستان', 'پاییز', 'زمستان'][q - 1] + ' ' + fd(y)), String(p).replace('-Q', ' Q')); };
  const yf = (y) => (NIN.yfa ? FT(NIN.yfa(y), String(y)) : y);
  const OPC = {'همراه اول': 'var(--ice)', 'ایرانسل': 'var(--amber)', 'رایتل': 'var(--teal)'};
  const OPE = {'همراه اول': 'MCI', 'ایرانسل': 'Irancell', 'رایتل': 'Rightel'};
  const opn = (n) => FT(n, OPE[n] || n);
  const P = (fa, en) => `<p>${FT(fa, en)}</p>`;
  /* the one layout every finding uses */
  const answer = ({title, claim, viz = [], tables = [], calc, infer, limits, need, source, go, kind, ent}) => ({
    h: title,
    b: `${claim ? `<p>${lab(FT('یافته', 'Finding'))}${claim}</p>` : ''}${viz.join('')}${tables.join('')}${calc ? `<p>${lab(FT('محاسبه رادار', 'Radar calculation'))}${calc}</p>` : ''}${infer ? `<p>${lab(FT('استنباط دستیار', 'Assistant reading'))}<span>${infer}</span></p>` : ''}${limits ? `<p>${lab(FT('مرز نتیجه', 'Limits'))}${limits}</p>` : ''}${need ? `<p>${lab(FT('برای قطعی‌شدن', 'To settle it'))}${need}</p>` : ''}${source ? src(source) : ''}${go ? goBtn(go[0], FT(go[1], go[2])) : ''}`,
    ctx: {kind: 'find', ent: ent || kind},
  });
  const qYears = (q) => [...fa2en(String(q)).matchAll(/(?<!\d)(140\d)(?!\d)/g)].map((m) => m[1]);

  /* ===== 1. NIN: where did the change of the overall figure come from (axis waterfall) ===== */
  const ninAxes = (q) => {
    const ax = NIN.S.axes || [];
    if (!ax.length) return null;
    const ys = qYears(q).filter((y) => ax[0].progress[y] != null);
    let Y = NIN.LAST, Pv = NIN.prev(Y);
    if (ys.length >= 2) { Y = ys.sort().pop(); Pv = ys[0]; } else if (ys.length === 1) { Y = ys[0]; Pv = NIN.prev(Y); }
    if (ax[0].progress[Y] == null || ax[0].progress[Pv] == null) return null;
    const ov = NIN.S.overall, tot = ov[Y].value - ov[Pv].value;
    const rows = ax.map((a) => ({a, d: a.progress[Y] - a.progress[Pv], c: (a.weight / 100) * (a.progress[Y] - a.progress[Pv])})).sort((x, y) => x.c - y.c);
    const sum = rows.reduce((s, r) => s + r.c, 0), res = tot - sum;
    const neg = rows.filter((r) => r.c < 0), pos = rows.filter((r) => r.c > 0).reverse();
    const lead = (tot < 0 ? neg : pos).slice(0, 2), leadSum = lead.reduce((s, r) => s + r.c, 0);
    const gaps = (NIN.S.issues || []).filter((i) => i.kind === 'axis_reported_differs_from_recomputed' && i.year === Y);
    const t3 = NIN.issueOf3 && NIN.issueOf3(Y);
    const ttl = (a) => FT(a.title, `Axis ${a.no}`);
    return answer({
      title: FT(`چرا عدد گزارش‌شده‌ی پیشرفت کل ${yf(Y)}${NIN.YSTAT && NIN.YSTAT[Y] ? ' (خوداظهاری' + (Y === '1405' ? '، تا شهریور' : '') + ')' : ''} نسبت به ${yf(Pv)} ${tot < 0 ? 'کاهش یافته' : 'تغییر کرده'}؟ سهم هر محور`, `Where the change in overall progress ${Pv}→${Y} came from, by axis`),
      claim: FT(`پیشرفت کل از ${nf(ov[Pv].value, 2)}٪ به ${nf(ov[Y].value, 2)}٪ رسیده؛ ${sg(tot)} واحد درصد. ${lead.length === 2 ? `دو محور «${esc(lead[0].a.title)}» و «${esc(lead[1].a.title)}» با هم ${sg(leadSum)} واحد از آن را می‌سازند${Math.abs(leadSum) > Math.abs(tot) ? ' و از خود تغییر خالص بزرگ‌ترند؛ محورهای دیگر بخشی از آن را جبران کرده‌اند' : ''}.` : ''}`,
        `Overall progress moved from ${nf(ov[Pv].value, 2)}% to ${nf(ov[Y].value, 2)}%, ${sg(tot)} points. The two axes ${lead.map((l) => ttl(l.a)).join(' and ')} together account for ${sg(leadSum)} points of it.`),
      viz: [AIVIZ.div(rows.map((r) => ({t: FT(r.a.title, `Axis ${r.a.no}`), v: r2(r.c)})), {label: FT('سهم هر محور در تغییر کل (واحد درصد)', 'Contribution of each axis to the change (points)')})],
      tables: [tbl([FT('محور', 'Axis'), FT('وزن', 'Weight'), yf(Pv), yf(Y), FT('تغییر محور', 'Axis change'), FT('سهم در تغییر کل', 'Share of change')], rows.map((r) => [esc(FT(r.a.title, `${r.a.no}`)), nf(r.a.weight), nf(r.a.progress[Pv]), nf(r.a.progress[Y]), sg(r.d), `<b>${sg(r.c)}</b>`]).concat([[FT('جمع', 'Total'), '۱۰۰', nf(ov[Pv].value, 2), nf(ov[Y].value, 2), '', `<b>${sg(tot)}</b>`]]))],
      calc: FT(`تغییر کل = Σ (وزن محور ÷ ۱۰۰) × تغییر محور. جمع سهم‌ها ${sg(sum)} است و با تغییر گزارش‌شده ${sg(tot)} ${Math.abs(res) < 0.005 ? 'برابر است' : 'به اندازه‌ی ' + nf(Math.abs(res), 2) + ' واحد (گرد کردن) فرق دارد'}.`, `Change = Σ (axis weight ÷ 100) × axis change. The contributions add to ${sg(sum)} against the reported ${sg(tot)} (residual ${nf(Math.abs(res), 2)} from rounding).`),
      infer: FT(`${tot < 0 ? 'افت' : 'تغییر'} را باید به محورهای نام‌برده نسبت داد، نه به کل شبکه. هر محور از اهداف خودش ساخته می‌شود؛ برای رفتن یک سطح پایین‌تر، جدول اهداف و جدول سلول‌های متنی را ببینید.`, `The movement belongs to the named axes, not to the whole network. Each axis is built from its own goals; the goal table and the text-cell table go one level further down.`),
      limits: FT(`${gaps.length ? `برای ${gaps.map((g) => 'محور ' + F.i(g.axis)).join('، ')} در ${yf(Y)}، عدد گزارش‌شده با بازمحاسبه از اهداف نمی‌خواند و علتش در فایل نیست؛ تأیید متولی لازم است. ` : ''}${t3 ? 'جمع وزنی محورها همان عدد کل گزارش‌شده را می‌دهد، ولی جمع وزنی اهداف و بازسازی از شاخص‌ها اعداد دیگری‌اند. ' : ''}${NIN.YSTAT && NIN.YSTAT[Y] ? 'ارزیابی این سال خوداظهاری وزارتخانه است' + (Y === '1405' ? ' و تا شهریور است، نه پایان سال' : '') + '.' : ''}`,
        `${gaps.length ? `For axis ${gaps.map((g) => g.axis).join(', ')} the reported figure disagrees with the recomputation from goals and the file gives no cause; the owner must confirm. ` : ''}${NIN.YSTAT && NIN.YSTAT[Y] ? 'This year is a ministry self-assessment' + (Y === '1405' ? ' running only to Shahrivar, not a year-end figure' : '') + '.' : ''}`),
      need: FT('پاسخ متولی درباره‌ی محورهای ناسازگار و روش تجمیع.', 'The owner’s answer on the inconsistent axes and the aggregation method.'),
      source: FT('NIN.1405.07.xlsx؛ کاربرگ پیشرفت محورها و اهداف. محاسبه از داده‌ی همین فایل.', 'NIN.1405.07.xlsx axis and goal sheets; computed from the file’s own data.'),
      go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'ninAxes'});
  };

  /* ===== 2. NIN: goals whose reported figure is reproduced only when text cells count as zero ===== */
  const ninArtifacts = (q) => {
    const iss = (NIN.S.issues || []).filter((i) => i.kind === 'reported_differs_from_recomputed' && i.cause === 'text_cells_as_zero');
    if (!iss.length) return null;
    const Y = iss[0].year, t3 = NIN.issueOf3 && NIN.issueOf3(Y);
    const nums = [...String(q).replace(/(?<!\d)(140\d)(?!\d)/g, ' ').matchAll(/(?<!\d)(\d{1,2})(?!\d)/g)].map((m) => +m[1]);
    const hit = iss.find((i) => nums.includes(i.goal));
    const rows = iss.map((i) => { const g = NIN.byNo[i.goal], pv = g && NIN.prev(i.year) ? g.progress[NIN.prev(i.year)] : null; return {i, g, pv}; });
    const tot3 = t3 ? [[FT('گزارش‌شده', 'Reported'), t3.reported], [FT('جمع وزنی محورها', 'Weighted axes'), t3.axes_weighted], [FT('بازسازی از شاخص‌ها', 'Rebuilt from indicators'), t3.indicators_rebuild], [FT('جمع وزنی اهداف', 'Weighted goals'), t3.goals_weighted]] : null;
    return answer({
      title: hit ? FT(`هدف ${F.i(hit.goal)} در ${yf(Y)}: افت واقعی یا اثر سلول متنی؟`, `Goal ${hit.goal} in ${Y}: a real drop or a text-cell effect?`) : FT(`اعداد ${yf(Y)} که فقط با «سلول متنی = صفر» بازتولید می‌شوند`, `${Y} figures that reproduce only when text cells count as zero`),
      claim: FT(`در ${yf(Y)} برای ${F.i(iss.length)} هدف (${iss.map((i) => F.i(i.goal)).join('، ')}) عدد گزارش‌شده با بازمحاسبه از شاخص‌ها نمی‌خواند، اما اگر سلول‌های متنی مانند «۱۰۰/۰۰٪» صفر شمرده شوند، هر چهار عدد دقیقاً بازتولید می‌شود. ${hit ? `هدف ${F.i(hit.goal)}: گزارش‌شده ${nf(hit.reported, 2)}٪، با شاخص‌ها ${nf(hit.recomputed, 2)}٪${rows.find((r) => r.i === hit).pv != null ? `، در ${yf(NIN.prev(Y))} ${nf(rows.find((r) => r.i === hit).pv, 2)}٪` : ''}.` : ''}`,
        `In ${Y} the reported figure of ${iss.length} goals (${iss.map((i) => i.goal).join(', ')}) disagrees with the recomputation from indicators, yet all four are reproduced exactly when text cells such as “100/00%” are counted as zero.`),
      viz: [AIVIZ.div(iss.map((i) => ({t: FT('هدف ', 'Goal ') + i.goal, v: r2(i.reported - i.recomputed)})), {label: FT('گزارش‌شده منهای بازمحاسبه (واحد درصد)', 'Reported minus recomputed (points)')})],
      tables: [tbl([FT('هدف', 'Goal'), yf(NIN.prev(Y) || ''), FT('گزارش‌شده', 'Reported'), FT('بازمحاسبه از شاخص‌ها', 'Recomputed'), FT('با «متن = صفر»', 'With text = 0'), FT('شاخص‌های سلول متنی', 'Text-cell indicators')], rows.map((r) => [`<b>${F.i(r.i.goal)}</b> ${esc(r.g ? r.g.short : '')}`, r.pv == null ? '—' : nf(r.pv, 1), nf(r.i.reported, 2), nf(r.i.recomputed, 2), nf(r.i.text_as_zero, 2), esc((r.i.text_codes || []).join('، '))])), ...(tot3 ? [tbl([FT(`چهار عدد کل ${yf(Y)}`, `Four totals ${Y}`), FT('مقدار', 'Value')], tot3.map(([k, v]) => [k, nf(v, 2)]))] : [])],
      calc: FT('بازمحاسبه = Σ وزن شاخص × عملکرد شاخص. سلول متنی در فرمول فایل صفر شمرده می‌شود؛ همین قاعده روی هر چهار هدف عدد گزارش‌شده را تا دو رقم اعشار بازتولید می‌کند.', 'Recomputed = Σ indicator weight × indicator performance. The file’s formula counts a text cell as zero; that single rule reproduces all four reported figures to two decimals.'),
      infer: FT('افت چنین اهدافی را نمی‌توان افت خدمت دانست: یک سلول با وزن بالا که متن است، کل هدف را پایین می‌کشد. پیش از هر تفسیر، متولی باید بگوید مقدار این سلول‌ها واقعاً ۱۰۰٪ است یا صفر.', 'The drop of such goals cannot be read as a drop in service: one heavily weighted cell stored as text pulls the whole goal down. Before any interpretation the owner must say whether those cells are really 100% or zero.'),
      limits: FT('این قاعده برای اهداف ۱، ۲، ۳ و ۵ ثابت شده است. اختلاف محورهای ۴، ۵ و ۶ را توضیح نمی‌دهد و عدد گزارش‌شده دست‌کاری نشده است.', 'The rule is proven for goals 1, 2, 3 and 5. It does not explain the gaps of axes 4, 5 and 6, and no reported figure was altered.'),
      need: FT('تأیید مقدار واقعی سلول‌های متنی توسط متولی هر شاخص.', 'Confirmation of the true value of each text cell by the indicator owner.'),
      source: FT('NIN.1405.07.xlsx؛ سلول‌های ثبت‌شده در جدول. بازمحاسبه از وزن‌ها و عملکرد همان فایل.', 'NIN.1405.07.xlsx; cells listed in the table, recomputed from the same file’s weights and performance.'),
      go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'ninArtifacts'});
  };

  /* ===== 3. fixed access: homes passed -> subscriptions, and substitution ===== */
  const fiber = () => {
    const fq = D.fixedQ, cov = Object.fromEntries(D.fiberCov), a = fq[0], z = fq[fq.length - 1];
    const d = (k) => z[k] - a[k], dF = d('FTTx'), dX = d('XDSL'), dT = d('t'), dH = cov[z.p] - cov[a.p];
    const rows = fq.map((r, i) => ({r, hp: cov[r.p], tu: cov[r.p] ? (r.FTTx / cov[r.p]) * 100 : null, dh: i ? cov[r.p] - cov[fq[i - 1].p] : null, ds: i ? r.FTTx - fq[i - 1].FTTx : null}));
    const peak = rows.reduce((m, r) => (r.tu != null && (!m || r.tu > m.tu) ? r : m), null);
    const jumps = rows.filter((r) => r.dh != null).map((r) => r.dh), med = jumps.slice().sort((x, y) => x - y)[Math.floor(jumps.length / 2)];
    const jump = rows.filter((r) => r.dh != null).reduce((m, r) => (!m || r.dh > m.dh ? r : m), null);
    const big = jump && jump.dh > 2.5 * Math.max(med, 1) && jump.ds < jump.dh * 0.15;
    const tu0 = rows[0].tu, tu1 = rows[rows.length - 1].tu;
    return answer({
      title: FT('فیبر: از پوشش تا اشتراک، و جبران ریزش XDSL', 'Fibre: from coverage to subscriptions, and how much of the XDSL loss it offsets'),
      claim: FT(`از ${per(a.p)} تا ${per(z.p)} اشتراک FTTx ${F.i(dF)} رشد کرده و XDSL ${F.i(-dX)} اشتراک از دست داده؛ فیبر فقط ${nf((dF / -dX) * 100, 0)}٪ ریزش XDSL را جبران کرده و جمع پهن‌باند ثابت ${F.i(-dT)} اشتراک (${nf((-dT / a.t) * 100)}٪) کوچک شده است. نرخ بهره‌برداری فیبر (اشتراک ÷ خانوار گذرداده) از ${nf(tu0)}٪ به ${nf(tu1)}٪ رسیده${peak && peak !== rows[rows.length - 1] ? `؛ اوج آن ${nf(peak.tu)}٪ در ${per(peak.r.p)} بوده` : ''}.`,
        `Between ${per(a.p)} and ${per(z.p)} FTTx subscriptions grew by ${F.i(dF)} while XDSL lost ${F.i(-dX)}; fibre offset only ${nf((dF / -dX) * 100, 0)}% of the XDSL loss and total fixed broadband shrank by ${F.i(-dT)} (${nf((-dT / a.t) * 100)}%). Fibre take-up (subscriptions ÷ homes passed) went from ${nf(tu0)}% to ${nf(tu1)}%.`),
      viz: [AIVIZ.lines([{name: 'FTTx', pts: fq.map((r) => r1(r.FTTx / 1e6 * 100) / 100)}, {name: 'XDSL', pts: fq.map((r) => r1(r.XDSL / 1e6 * 100) / 100)}], fq.map((r) => per(r.p)), {label: FT('اشتراک فعال (میلیون)', 'Active subscriptions (millions)'), fmt: (v) => nf(v, 1)}),
        AIVIZ.lines([{name: FT('نرخ بهره‌برداری فیبر ٪', 'Fibre take-up %'), pts: rows.map((r) => (r.tu == null ? null : r1(r.tu * 10) / 10)), c: 'var(--teal)'}], fq.map((r) => per(r.p)), {label: FT('اشتراک FTTx ÷ خانوار گذرداده', 'FTTx subscriptions ÷ homes passed'), fmt: (v) => nf(v) + '٪'})],
      tables: [tbl([FT('فناوری', 'Technology'), per(a.p), per(z.p), FT('تغییر', 'Change'), FT('٪', '%')], [['FTTx', 'XDSL', 'TDLTE', 'WiFi'].map((k) => [k === 'TDLTE' ? 'TD-LTE' : k, F.i(a[k]), F.i(z[k]), sg(d(k), 0).replace(/[٫.]\d+$/, ''), nf((d(k) / a[k]) * 100)]), [[FT('جمع ثابت', 'Total fixed'), F.i(a.t), F.i(z.t), F.i(dT), nf((dT / a.t) * 100)]]].flat()),
        tbl([FT('فصل', 'Quarter'), FT('خانوار گذرداده', 'Homes passed'), FT('اشتراک FTTx', 'FTTx subs'), FT('بهره‌برداری', 'Take-up'), FT('Δ خانوار', 'Δ homes'), FT('Δ اشتراک', 'Δ subs')], rows.map((r) => [per(r.r.p), F.i(r.hp), F.i(r.r.FTTx), r.tu == null ? '—' : nf(r.tu) + '٪', r.dh == null ? '—' : F.i(r.dh), r.ds == null ? '—' : F.i(r.ds)]))],
      calc: FT(`سهم جبران = ΔFTTx ÷ |ΔXDSL| = ${F.i(dF)} ÷ ${F.i(-dX)} = ${nf((dF / -dX) * 100)}٪. بهره‌برداری نهایی = ΔFTTx ÷ Δخانوار گذرداده = ${nf((dF / dH) * 100)}٪ (${F.i(dH)} خانوار جدید در برابر ${F.i(dF)} اشتراک جدید).`, `Offset = ΔFTTx ÷ |ΔXDSL| = ${nf((dF / -dX) * 100)}%. Marginal take-up = ΔFTTx ÷ Δhomes passed = ${nf((dF / dH) * 100)}% (${F.i(dH)} new homes against ${F.i(dF)} new subscriptions).`),
      infer: FT(`${big ? `در ${per(jump.r.p)} خانوار گذرداده یک‌باره ${F.i(jump.dh)} بالا رفته ولی اشتراک فقط ${F.i(jump.ds)}؛ یا پوشش جدید هنوز به مشترک تبدیل نشده یا تعریف «خانوار گذرداده» در آن فصل عوض شده. داده بین این دو فرق نمی‌گذارد. ` : ''}فیبر هنوز جای ریزش XDSL را نمی‌گیرد، پس هدف توسعه‌ی پهن‌باند ثابت با شمار اشتراک‌ها در حال دور شدن است.`, `${big ? `In ${per(jump.r.p)} homes passed jumped by ${F.i(jump.dh)} while subscriptions rose only ${F.i(jump.ds)}: either the new coverage has not converted yet or the definition of homes passed changed that quarter; the data cannot tell which. ` : ''}Fibre is not yet replacing the XDSL loss.`),
      limits: FT('خانوار و اشتراک یک واحد نیستند؛ نرخ بهره‌برداری شاخص جهت است، نه نرخ نفوذ. سری فقط پنج فصل است. فایل پورت‌های شهریور برای فیبر و ADSL عدد بسیار کوچک‌تری از جدول فصلی می‌دهد و با این جدول جمع یا تقسیم نمی‌شود.', 'Homes and subscriptions are different units, so take-up is a direction indicator, not a penetration rate. The series has only five quarters. The September port file gives far smaller numbers for fibre and ADSL and must not be mixed with this table.'),
      need: FT('تعریف «خانوار گذرداده» و روش شمارش آن در هر فصل از سازمان تنظیم مقررات.', 'The regulator’s definition of homes passed and how it is counted each quarter.'),
      source: FT('فصلنامه آماری ۵۷ سازمان تنظیم مقررات: اشتراک فعال به تفکیک فناوری و خانوار گذرداده.', 'Regulator quarterly statistics no. 57: active subscriptions by technology and homes passed.'),
      go: ['fixed', 'اینترنت ثابت و فیبر', 'Fixed and fibre'], kind: 'fiber'});
  };

  /* ===== 4. ports: utilisation, idle capacity, and whether the file is the same universe as the quarterly table ===== */
  const ports = () => {
    const ok = (p) => p.fthI >= 1000 && !p.flag, L = M.prov.filter(ok), tI = L.reduce((s, p) => s + p.fthI, 0), tA = L.reduce((s, p) => s + p.fthA, 0), idle = tI - tA;
    const rows = L.map((p) => ({p, id: p.fthI - p.fthA})).sort((a, b) => b.id - a.id), top5 = rows.slice(0, 5), s5 = top5.reduce((s, r) => s + r.id, 0);
    const lowU = L.slice().sort((a, b) => a.fthU - b.fthU).slice(0, 4), ex = (M.provT.fthUBase && M.provT.fthUBase.excluded) || [];
    const z = D.fixedQ[D.fixedQ.length - 1];
    const U = [['FTTH', M.provT.fthA, z.FTTx], ['ADSL/VDSL', M.provT.xA, z.XDSL], ['TD-LTE', M.provT.lteA, z.TDLTE]].map(([k, a, b]) => ({k, a, b, r: a / b}));
    const odd = U.filter((u) => u.r < 0.8);
    return answer({
      title: FT('پورت‌های فیبر: بهره‌برداری و ظرفیت بی‌مصرف در استان‌ها', 'Fibre ports: utilisation and idle capacity by province'),
      claim: FT(`از ${F.i(tI)} پورت FTTH منصوبه (${F.i(L.length)} استان با پایه‌ی کافی) فقط ${F.i(tA)} دایر است؛ بهره‌برداری ${nf((tA / tI) * 100)}٪. ${F.i(idle)} پورت بی‌مصرف است و پنج استان ${nf((s5 / idle) * 100)}٪ آن را دارند: ${top5.map((r) => `${esc(r.p.n)} (${F.i(r.id)})`).join('، ')}.`, `Of ${F.i(tI)} installed FTTH ports (${L.length} provinces with a usable base) only ${F.i(tA)} are in service, a ${nf((tA / tI) * 100)}% utilisation. ${F.i(idle)} ports sit idle and five provinces hold ${nf((s5 / idle) * 100)}% of them.`),
      viz: [AIVIZ.bars(top5.map((r) => ({t: FT(r.p.n, r.p.iso), v: Math.round(r.id / 1000), c: 'var(--amber)'})).concat([{t: FT('بقیه‌ی استان‌ها', 'Other provinces'), v: Math.round((idle - s5) / 1000), c: 'var(--ice)'}]), {label: FT('پورت بی‌مصرف (هزار)', 'Idle ports (thousands)'), fmt: (v) => F.i(v)})],
      tables: [tbl([FT('استان', 'Province'), FT('منصوبه', 'Installed'), FT('دایر', 'In service'), FT('بهره‌برداری', 'Utilisation'), FT('بی‌مصرف', 'Idle'), FT('سهم از بی‌مصرف کل', 'Share of idle')], top5.map((r) => [esc(r.p.n), F.i(r.p.fthI), F.i(r.p.fthA), nf(r.p.fthU) + '٪', F.i(r.id), nf((r.id / idle) * 100) + '٪'])),
        tbl([FT('فناوری', 'Technology'), FT('فایل پورت (شهریور)', 'Port file (Sept)'), FT('جدول فصلی CRA', 'CRA quarterly'), FT('نسبت', 'Ratio')], U.map((u) => [u.k, F.i(u.a), F.i(u.b), nf(u.r, 2)]))],
      calc: FT(`بهره‌برداری = پورت دایر ÷ پورت منصوبه؛ استان با کمتر از ۱٬۰۰۰ پورت یا نسبت مشکوک از رتبه‌بندی کنار گذاشته شد${ex.length ? ` (${ex.map((e) => esc(e.n)).join('، ')})` : ''}. کم‌بهره‌ترین‌ها: ${lowU.map((p) => `${esc(p.n)} ${nf(p.fthU)}٪`).join('، ')}.`, `Utilisation = ports in service ÷ installed ports; provinces under 1,000 ports or with a doubtful ratio are left out of the ranking. Lowest: ${lowU.map((p) => `${p.iso} ${nf(p.fthU)}%`).join(', ')}.`),
      infer: FT(`ظرفیت نصب‌شده بسیار از مصرف جلوتر است و بخش بزرگ آن در چند استان بزرگ مانده؛ تمرکز روی تبدیل پورت به اشتراک در همین استان‌ها بیشترین اثر عددی را دارد.`, 'Installed capacity runs far ahead of use and most of the idle part sits in a few large provinces; converting ports to subscriptions there has the largest numeric effect.'),
      limits: FT(`${odd.length ? `هشدار: برای ${odd.map((u) => u.k).join(' و ')} این فایل ${odd.map((u) => nf((1 - u.r) * 100, 0) + '٪').join(' و ')} کمتر از جدول فصلی مشترک دارد، در حالی که برای TD-LTE دو منبع تقریباً برابرند؛ پس فایل پورت زیرمجموعه‌ای از مشترکان یا با تعریفی دیگر است و نتیجه فقط درباره‌ی «پورت دایر» معتبر است. ` : ''}پایه‌ی کوچک (مثل کرمان با ۵۱۲ پورت) رتبه نمی‌گیرد.`, `${odd.length ? `Warning: for ${odd.map((u) => u.k).join(' and ')} this file is far below the quarterly table, while TD-LTE matches; the port file is a subset or uses another definition, so the result holds only for ports in service. ` : ''}Small bases are not ranked.`),
      need: FT('تعریف «پورت دایر» در برابر «اشتراک فعال» و دوره‌ی یکسان از متولی.', 'The definition of a port in service against an active subscription, for the same period.'),
      source: FT('فایل‌های پورت شهریور ۱۴۰۵ (ارسالی کاربر) و فصلنامه آماری ۵۷.', 'September 1405 port files (user-supplied) and regulator quarterly no. 57.'),
      go: ['provinces', 'استان‌ها', 'Provinces'], kind: 'ports'});
  };

  /* ===== 5. traffic-weighted RTT ===== */
  const rtt = () => {
    const tf = (l) => D.traffic.find((x) => x.label === l), lt = (m, n, r) => D.latency.find((x) => x.metric === m && x.network === n && x.route === r).value;
    const rows = [['fixed', 'اینترنت ثابت', FT('ثابت', 'Fixed')], ['mobile', 'جمع سیار', FT('سیار', 'Mobile')]].map(([n, l, nm]) => { const t = tf(l), s = t.domestic + t.international, ds = t.domestic / s, rd = lt('rtt', n, 'domestic'), ri = lt('rtt', n, 'international'); return {nm, ds, rd, ri, w: ds * rd + (1 - ds) * ri, w10: (ds + 0.1) * rd + (1 - ds - 0.1) * ri}; });
    return answer({
      title: FT('تجربه‌ی مؤثر یک بایت متوسط: تأخیر وزن‌دار با ترافیک', 'Effective experience of an average byte: traffic-weighted RTT'),
      claim: FT(rows.map((r) => `در ${r.nm} فقط ${nf(r.ds * 100)}٪ ترافیک داخلی است و تأخیر وزن‌دار ${nf(r.w)} میلی‌ثانیه می‌شود (داخلی ${nf(r.rd)}، بین‌الملل ${nf(r.ri)})`).join('؛ ') + '. بیشتر مصرف مردم روی مسیری است که دو تا چهار برابر کندتر است.', rows.map((r) => `${r.nm}: ${nf(r.ds * 100)}% of traffic is domestic, so the weighted RTT is ${nf(r.w)} ms (domestic ${nf(r.rd)}, international ${nf(r.ri)})`).join('; ') + '. Most of what people use runs on the route that is two to four times slower.'),
      viz: [AIVIZ.bars(rows.flatMap((r, i) => [{t: `${r.nm} · ${FT('داخلی', 'domestic')}`, v: r.rd, c: 'var(--teal)'}, {t: `${r.nm} · ${FT('بین‌الملل', 'intl')}`, v: r.ri, c: 'var(--red)'}, {t: `${r.nm} · ${FT('وزن‌دار', 'weighted')}`, v: r.w, c: 'var(--amber)'}]), {label: 'RTT (ms)', fmt: (v) => nf(v)})],
      tables: [tbl([FT('شبکه', 'Network'), FT('سهم ترافیک داخلی', 'Domestic traffic share'), FT('RTT داخلی', 'Domestic RTT'), FT('RTT بین‌الملل', 'Intl RTT'), FT('RTT وزن‌دار', 'Weighted RTT'), FT('اگر سهم داخلی ۱۰ واحد بالا رود', 'If domestic share +10 pts')], rows.map((r) => [r.nm, nf(r.ds * 100) + '٪', nf(r.rd), nf(r.ri), `<b>${nf(r.w)}</b>`, nf(r.w10) + ` (${sg(r.w10 - r.w, 1)})`]))],
      calc: FT('RTT وزن‌دار = سهم داخلی × RTT داخلی + سهم بین‌الملل × RTT بین‌الملل. سهم‌ها از ترافیک تابستان ۱۴۰۵ است.', 'Weighted RTT = domestic share × domestic RTT + international share × international RTT, with shares from the summer 1405 traffic.'),
      infer: FT('هر ۱۰ واحد جابه‌جایی ترافیک به مسیر داخلی چند میلی‌ثانیه تأخیر مؤثر را کم می‌کند؛ این حساب میانگین وزنی با RTT ثابت هر مسیر است؛ منفعت خدمات داخلی یا کش را نشان نمی‌دهد، چون دوره، خدمت و مسیر اندازه‌گیری تأخیر با ترافیک تطبیق داده نشده و با معیار تحقق هدف هم یکی نیست.', 'Every 10 points of traffic moved onto the domestic route cut the effective delay by the amounts shown; this is a weighted average with each route’s RTT held fixed; it does not show a benefit of domestic services or caching, because the period, service and route of the delay measurement have not been matched with the traffic, and it is not goal achievement either.'),
      limits: FT('دوره‌ی صریح سری تأخیر در رادار مشخص نیست و ترافیک تابستان ۱۴۰۵ است؛ تا تأیید هم‌دوره‌بودن، این عدد نمایشی است نه رسمی. RTT نمونه‌ی مسیر است، نه تجربه‌ی هر خدمت.', 'The period of the latency series is not stated in the radar and the traffic is summer 1405; until they are confirmed to coincide this is an illustrative figure, not an official one. RTT samples routes, not every service.'),
      need: FT('دوره‌ی صریح سری تأخیر و تأخیر به تفکیک خدمت پرمصرف.', 'The explicit period of the latency series and delay by high-volume service.'),
      source: FT('سری تأخیر رادار؛ ترافیک داخلی و بین‌الملل تابستان ۱۴۰۵ (کاربرگ پایش).', 'Radar latency series; domestic and international traffic, summer 1405 (monitoring sheet).'),
      go: ['quality', 'کیفیت و تأخیر', 'Quality and latency'], kind: 'rtt'});
  };

  /* ===== 6. market concentration ===== */
  const hhi = () => {
    const m = M.mob, V = m.values, Pp = m.periods.map(per), hh = (v) => { const s = v.reduce((a, b) => a + b, 0); return v.reduce((a, b) => a + ((100 * b) / s) ** 2, 0); };
    const series = V.map(hh), L = V.length - 1, shares = (v) => { const s = v.reduce((a, b) => a + b, 0); return v.map((x) => (100 * x) / s); };
    const pick = [0, Math.round(L / 2), L - 4, L].filter((v, i, a) => a.indexOf(v) === i);
    const fx = Object.entries(D.providers).map(([k, l]) => { const t = l.reduce((s, r) => s + r[1], 0); return t ? {k, n: l.length, t, top: l[0], h: l.reduce((s, r) => s + ((100 * r[1]) / t) ** 2, 0)} : null; }).filter(Boolean).sort((a, b) => b.h - a.h);
    const lastS = shares(V[L]), firstS = shares(V[0]), yoyRt = (V[L][m.ops.indexOf('رایتل')] / V[L - 4][m.ops.indexOf('رایتل')] - 1) * 100;
    return answer({
      title: FT('تمرکز بازار اینترنت: سیار و ثابت', 'Market concentration: mobile and fixed'),
      claim: FT(`در پهن‌باند سیار شاخص تمرکز (HHI) از ${F.i(series[0])} در ${Pp[0]} به ${F.i(series[L])} در ${Pp[L]} رسیده؛ سهم ${m.ops.map((o, i) => `${o} از ${nf(firstS[i])}٪ به ${nf(lastS[i])}٪`).join('، ')}. در ثابت، تمرکز در TD-LTE بسیار بالاست (${F.i(fx.find((f) => f.k === 'TDLTE') ? fx.find((f) => f.k === 'TDLTE').h : 0)}) و در ADSL پراکنده‌تر است (${F.i(fx.find((f) => f.k === 'ADSL') ? fx.find((f) => f.k === 'ADSL').h : 0)}).`,
        `In mobile broadband the HHI rose from ${F.i(series[0])} in ${Pp[0]} to ${F.i(series[L])} in ${Pp[L]}; ${m.ops.map((o, i) => `${opn(o)} ${nf(firstS[i])}% → ${nf(lastS[i])}%`).join(', ')}. In fixed access TD-LTE is very concentrated and ADSL much less so.`),
      viz: [AIVIZ.lines(m.ops.map((o, i) => ({name: opn(o), c: OPC[o], pts: V.map((v) => r1(shares(v)[i] * 10) / 10)})), Pp, {label: FT('سهم اشتراک پهن‌باند سیار (٪)', 'Share of mobile broadband subscriptions (%)'), fmt: (v) => nf(v, 0)}),
        AIVIZ.bars(fx.map((f) => ({t: f.k === 'TDLTE' ? 'TD-LTE' : f.k, v: Math.round(f.h), c: f.h > 2500 ? 'var(--red)' : 'var(--ice)'})), {label: 'HHI', fmt: (v) => F.i(v)})],
      tables: [tbl([FT('دوره', 'Period'), 'HHI', ...m.ops.map(opn)], pick.map((i) => [Pp[i], F.i(series[i]), ...shares(V[i]).map((s) => nf(s) + '٪')])),
        tbl([FT('فناوری ثابت', 'Fixed technology'), FT('شرکت', 'Firms'), FT('اشتراک', 'Subs'), FT('بزرگ‌ترین', 'Largest'), FT('سهم بزرگ‌ترین', 'Top share'), 'HHI'], fx.map((f) => [f.k === 'TDLTE' ? 'TD-LTE' : f.k, F.i(f.n), F.i(f.t), esc(f.top[0]), nf((100 * f.top[1]) / f.t) + '٪', F.i(f.h)]))],
      calc: FT('HHI = Σ (سهم٪)². در یک سال اخیر رشد اشتراک رایتل ' + sg(yoyRt, 1) + '٪ بوده است.', 'HHI = Σ (share %)². Over the last year Rightel’s subscriptions changed by ' + sg(yoyRt, 1) + '%.'),
      infer: FT('بازار سیار با سه بازیگر ذاتاً متمرکز است و جهت حرکت به سمت بازیگر بزرگ‌تر بوده است. ثابت‌ها یکدست نیستند: ADSL میان شرکت‌های زیاد پخش است، TD-LTE در دست یک شرکت.', 'A three-player mobile market is concentrated by nature and has moved toward the largest player. Fixed access is uneven: ADSL is spread across many firms, TD-LTE sits with one.'),
      limits: FT('HHI بالا به‌تنهایی قیمت یا کیفیت بد را اثبات نمی‌کند؛ ارزیابی اثر قیمتی نیازمند تعرفه است. آستانه‌ی ۲٬۵۰۰ قراردادی است. HHI ثابت‌ها روی اشتراک فایل پورت است که زیرمجموعه‌ی مشترکان است.', 'A high HHI alone does not prove high prices or poor quality; a price effect needs tariff data. The 2,500 threshold is conventional. Fixed-access HHI uses the port file, which is a subset of subscribers.'),
      need: FT('تعرفه‌ی ثبت‌شده‌ی بسته‌ها به تفکیک اپراتور.', 'Registered package tariffs by operator.'),
      source: FT('فصلنامه آماری ۵۷ (۲۴ فصل اشتراک سیار) و فایل پورت‌های ثابت شهریور ۱۴۰۵.', 'Regulator quarterly no. 57 (24 quarters of mobile subscriptions) and the September 1405 fixed port file.'),
      go: ['mobile', 'پهن‌باند سیار', 'Mobile broadband'], kind: 'hhi'});
  };

  /* ===== 7. speed bands by technology ===== */
  const speed = () => {
    const B = D.speed.bands, data = D.speed.data, ks = ['ADSL', 'VDSL', 'WIFI', 'TDLTE', 'FTTH'].filter((k) => (data[k] || []).reduce((a, b) => a + b, 0) > 0);
    const rows = ks.map((k) => { const v = data[k], s = v.reduce((a, b) => a + b, 0); return {k, v, s, hi: ((v[5] + v[6]) / s) * 100, lo: ((v[0] + v[1]) / s) * 100}; });
    const nm = (k) => (k === 'TDLTE' ? 'TD-LTE' : k === 'WIFI' ? 'WiFi' : k);
    const cols = ['var(--red)', 'var(--pink)', 'var(--amber)', 'var(--violet)', 'var(--ice)', 'var(--teal)', 'var(--teal)'];
    return answer({
      title: FT('سرعت اسمی هر فناوری ثابت: توزیع باندها', 'Nominal speed of each fixed technology: band distribution'),
      claim: FT(`${rows.filter((r) => r.k === 'FTTH' || r.k === 'ADSL').map((r) => `${nm(r.k)}: ${nf(r.hi)}٪ اشتراک‌ها در باند ۳۰ مگابیت و بالاتر و ${nf(r.lo)}٪ در دو مگابیت و کمتر`).join('؛ ')}.`, rows.filter((r) => r.k === 'FTTH' || r.k === 'ADSL').map((r) => `${nm(r.k)}: ${nf(r.hi)}% of subscriptions in the 30 Mbps+ bands and ${nf(r.lo)}% at 2 Mbps or less`).join('; ') + '.'),
      viz: [AIVIZ.stack(rows.map((r) => ({t: nm(r.k), parts: r.v.map((x, i) => ({v: x, c: cols[i]}))})), [{n: '≤2M', c: cols[0]}, {n: '2–10M', c: cols[2]}, {n: '10–30M', c: cols[3]}, {n: '≥30M', c: cols[5]}].map((x) => x), {label: FT('سهم هر باند سرعت در فناوری (٪)', 'Share of each speed band within the technology (%)')}).replace(/<svg/, '<svg data-bands="7"')],
      tables: [tbl([FT('فناوری', 'Technology'), FT('اشتراک (فایل)', 'Subscriptions (file)'), ...B.map((b) => b), FT('≥۳۰M ٪', '≥30M %'), FT('≤۲M ٪', '≤2M %')], rows.map((r) => [nm(r.k), F.i(r.s), ...r.v.map((x) => F.i(x)), nf(r.hi), nf(r.lo)]))],
      calc: FT('سهم باند = اشتراک در باند ÷ جمع اشتراک همان فناوری. باندهای ۳۰ تا ۱۰۰ و ۱۰۰ و بالاتر برای «۳۰M+» جمع شده‌اند.', 'Band share = subscriptions in the band ÷ all subscriptions of that technology; 30–100 and 100+ are added for “30M+”.'),
      infer: FT('فیبر عملاً همه در باند بالاست و ADSL در باندهای پایین؛ بنابراین جابه‌جایی مشترک از ADSL به فیبر جهش سرعت اسمی است، حتی اگر شمار اشتراک‌ها بالا نرود.', 'Fibre sits almost entirely in the top bands and ADSL in the low ones, so moving a subscriber from ADSL to fibre is a jump in nominal speed even when the subscription count does not grow.'),
      limits: FT('باند سرعت، سرعت اسمی طرح است، نه سرعت اندازه‌گیری‌شده. مبنا فایل سرعت شهریور ۱۴۰۵ است و با جدول فصلی هم‌جمع نیست.', 'The band is the nominal plan speed, not a measured speed. The base is the September 1405 speed file, which does not add up to the quarterly table.'),
      need: FT('سرعت اندازه‌گیری‌شده به تفکیک شرکت و فناوری.', 'Measured speed by firm and technology.'),
      source: FT('فایل‌های سرعت شهریور ۱۴۰۵ (ارسالی کاربر).', 'September 1405 speed files (user-supplied).'),
      go: ['fixed', 'اینترنت ثابت و فیبر', 'Fixed and fibre'], kind: 'speed'});
  };

  /* ===== 8. operators: growth next to quality (three points: ranks only) ===== */
  const opsGrowth = () => {
    const m = M.mob, V = m.values, L = V.length - 1;
    const rows = m.ops.map((o, i) => ({o, i, yoy: (V[L][i] / V[L - 4][i] - 1) * 100, tot: (V[L][i] / V[0][i] - 1) * 100, subs: V[L][i], op: M.ops.find((x) => x.name === o)}));
    return answer({
      title: FT('رشد اپراتورها در کنار کیفیت', 'Operator growth next to quality'),
      claim: FT(`در یک سال اخیر ${rows.map((r) => `${r.o} ${sg(r.yoy, 1)}٪`).join('، ')} رشد داشته‌اند؛ از ${per(m.periods[0])} تا ${per(m.periods[L])} ${rows.map((r) => `${r.o} ${sg(r.tot, 0)}٪`).join('، ')}.`, `Over the last year ${rows.map((r) => `${opn(r.o)} ${sg(r.yoy, 1)}%`).join(', ')}; since ${per(m.periods[0])} ${rows.map((r) => `${opn(r.o)} ${sg(r.tot, 0)}%`).join(', ')}.`),
      viz: [AIVIZ.div(rows.map((r) => ({t: opn(r.o), v: r2(r.yoy)})), {label: FT('رشد سالانه اشتراک پهن‌باند سیار (٪)', 'Year-on-year growth of mobile broadband subscriptions (%)')})],
      tables: [tbl([FT('اپراتور', 'Operator'), FT('اشتراک', 'Subs'), FT('رشد سالانه', 'YoY'), FT('موفقیت اتصال 4G', '4G access success'), FT('افت تماس 4G', '4G drop'), FT('ping 4G', '4G ping'), FT('سایت 5G', '5G sites'), FT('پوشش 4G', '4G coverage')], rows.map((r) => [opn(r.o), F.big(r.subs), sg(r.yoy, 1) + '٪', r.op ? nf(r.op.success4g, 2) + '٪' : '—', r.op ? nf(r.op.drop4g, 2) + '٪' : '—', r.op ? nf(r.op.ping4g) : '—', r.op ? F.i(r.op.sites5g) : '—', r.op ? nf(r.op.coverage4g, 2) + '٪' : '—']))],
      calc: FT('رشد سالانه = اشتراک این فصل ÷ اشتراک همان فصل سال پیش − ۱.', 'YoY = subscriptions this quarter ÷ the same quarter a year earlier − 1.'),
      infer: FT('رتبه‌ی رشد و رتبه‌ی کیفیت را می‌توان کنار هم گذاشت، ولی با سه اپراتور رابطه‌ی آماری ساخته نمی‌شود.', 'Growth rank and quality rank can be put side by side, but three operators cannot support a statistical relationship.'),
      limits: FT('کیفیت اپراتوری از گزارش خود اپراتورها در فصلنامه است و با تجربه‌ی مردم یکی نیست.', 'The quality figures are the operators’ own reported figures in the quarterly and are not the same as people’s experience.'),
      need: FT('کیفیت به تفکیک اپراتور و منطقه در چند فصل.', 'Quality by operator and region over several quarters.'),
      source: FT('فصلنامه آماری ۵۷.', 'Regulator quarterly no. 57.'),
      go: ['operators', 'اپراتورها', 'Operators'], kind: 'opsGrowth'});
  };

  /* ===== 9. 5G: from sites to subscriptions ===== */
  const fiveG = () => {
    const g = M.gen, sites = M.ops.reduce((s, o) => s + o.sites5g, 0), s4 = M.ops.reduce((s, o) => s + o.sites4g, 0), ind = NIN.inds.find((i) => i.code === '400');
    const ys = ind ? NIN.YEARS.filter((y) => ind.perf[y] != null) : [];
    return answer({
      title: FT('5G: از سایت تا اشتراک و استفاده', '5G: from sites to subscriptions and use'),
      claim: FT(`${F.i(sites)} سایت 5G در برابر ${F.i(s4)} سایت 4G هست (${nf((sites / s4) * 100)}٪). اشتراک 5G ${F.big(g.g5)} است، یعنی ${nf((g.g5 / g.t) * 100)}٪ پهن‌باند سیار و حدود ${F.i(g.g5 / sites)} اشتراک به ازای هر سایت.`, `There are ${F.i(sites)} 5G sites against ${F.i(s4)} 4G sites (${nf((sites / s4) * 100)}%). 5G subscriptions are ${F.big(g.g5)}, ${nf((g.g5 / g.t) * 100)}% of mobile broadband, about ${F.i(g.g5 / sites)} per site.`),
      viz: [AIVIZ.bars(M.ops.map((o) => ({t: opn(o.name), v: o.sites5g, c: OPC[o.name]})), {label: FT('سایت 5G', '5G sites'), fmt: (v) => F.i(v)}), ...(ys.length > 1 ? [AIVIZ.line(ys.map((y) => ({x: yf(y), v: ind.perf[y]})), {label: FT('تحقق شاخص ۴۰۰ (نسبت کاربر 5G)', 'Indicator 400 achievement (5G user ratio)')})] : [])],
      tables: [tbl([FT('اپراتور', 'Operator'), FT('سایت 5G', '5G sites'), FT('سایت 4G', '4G sites'), FT('سهم 5G', '5G share'), FT('پوشش 4G', '4G coverage')], M.ops.map((o) => [opn(o.name), F.i(o.sites5g), F.i(o.sites4g), nf((o.sites5g / o.sites4g) * 100) + '٪', nf(o.coverage4g, 2) + '٪'])),
        tbl([FT('نسل', 'Generation'), FT('اشتراک', 'Subs'), FT('سهم', 'Share')], [['3G', g.g3], ['4G', g.g4], ['5G', g.g5]].map(([k, v]) => [k, F.i(v), nf((v / g.t) * 100) + '٪']))],
      calc: FT('اشتراک به ازای هر سایت = اشتراک 5G ملی ÷ جمع سایت‌های 5G اپراتورها.', 'Subscriptions per site = national 5G subscriptions ÷ total 5G sites of the operators.'),
      infer: FT('اشتراک 5G نشان می‌دهد چه تعداد خط توان استفاده دارند، نه این‌که چقدر واقعاً روی 5G مصرف می‌کنند.', 'A 5G subscription shows how many lines can use 5G, not how much they actually consume on it.'),
      limits: FT('ترافیک و زمان‌حضور روی 5G در داده نیست؛ استفاده‌ی مؤثر قابل برآورد نیست.', 'Traffic and time on 5G are not in the data, so effective use cannot be estimated.'),
      need: FT('ترافیک و سهم زمان‌حضور روی 5G به تفکیک اپراتور.', '5G traffic and share of time on 5G by operator.'),
      source: FT('فصلنامه آماری ۵۷؛ شاخص ۴۰۰ شبکه ملی.', 'Regulator quarterly no. 57; NIN indicator 400.'),
      go: ['operators', 'اپراتورها', 'Operators'], kind: 'fiveG'});
  };

  /* ===== 10. national RTT trend (TIC series) ===== */
  const tic = () => {
    const T0 = D.tic, a = T0[0], z = T0[T0.length - 1], lab = (r) => `${r.year}-Q${r.quarter}`, out = T0.filter((r) => r.outlier);
    return answer({
      title: FT('روند تأخیر ملی در هشت فصل', 'National delay trend over the quarters'),
      claim: FT(`RTT از ${nf(a.rtt)} میلی‌ثانیه در ${lab(a)} به ${nf(z.rtt)} در ${lab(z)} رسیده؛ ${sg(z.rtt - a.rtt)} میلی‌ثانیه (${nf(((z.rtt - a.rtt) / a.rtt) * 100)}٪).${out.length ? ` فصل ${out.map(lab).join('، ')} دادهٔ پرت دارد.` : ''}`, `RTT moved from ${nf(a.rtt)} ms in ${lab(a)} to ${nf(z.rtt)} ms in ${lab(z)}, ${sg(z.rtt - a.rtt)} ms (${nf(((z.rtt - a.rtt) / a.rtt) * 100)}%).`),
      viz: [AIVIZ.lines([{name: 'RTT (ms)', pts: T0.map((r) => r.rtt), c: 'var(--ice)'}], T0.map(lab), {label: FT('RTT ملی (میلی‌ثانیه)', 'National RTT (ms)'), fmt: (v) => nf(v, 0)})],
      tables: [tbl([FT('فصل', 'Quarter'), 'RTT (ms)', FT('اتلاف بسته ٪', 'Packet loss %'), 'Jitter (ms)', FT('نشان', 'Flag')], T0.map((r) => [lab(r), nf(r.rtt, 2), nf(r.plr, 3), nf(r.jitter, 3), r.outlier ? FT('پرت', 'outlier') : '']))],
      calc: FT('تغییر = RTT فصل آخر − RTT فصل اول.', 'Change = last quarter RTT − first quarter RTT.'),
      infer: FT('کاهش هم‌زمان با گسترش تبادل و زیرساخت دیده می‌شود، ولی همین سری نمی‌گوید کدام عامل آن را ساخته.', 'The decline coincides with the expansion of exchange and infrastructure, but this series cannot say which factor produced it.'),
      limits: FT('مسیر داخلی و بین‌الملل در این سری جدا نیست و فقط میانگین ملی است؛ برای اثبات اثر تبادل، RTT به تفکیک مسیر و تاریخ بهره‌برداری لازم است.', 'This series does not split domestic and international routes; proving the effect of exchange needs RTT by route and the date each exchange went live.'),
      need: FT('RTT به تفکیک مسیر و تاریخ بهره‌برداری تبادل.', 'RTT by route and the go-live dates of exchanges.'),
      source: FT('سری فصلی تأخیر مرکز تبادل اطلاعات (۱۴۰۳ تا ۱۴۰۵).', 'Quarterly latency series (1403–1405).'),
      go: ['quality', 'کیفیت و تأخیر', 'Quality and latency'], kind: 'tic'});
  };

  /* ===== 11. how reliable is the evidence base, and what is missing ===== */
  const trust = () => {
    const L = REC.list.filter((r) => r.coll !== 'src'), by = {};
    L.forEach((r) => { by[r.et] = (by[r.et] || 0) + 1; });
    const rows = Object.entries(by).map(([k, n]) => ({k, n, t: (ET[k] || {}).n || k, r: (ET[k] || {}).r || 9})).sort((a, b) => a.r - b.r || b.n - a.n);
    const nin = NIN.S.issues || [], strong = rows.filter((r) => r.r <= 2).reduce((s, r) => s + r.n, 0);
    return answer({
      title: FT('داده‌های رادار چقدر قابل اتکایند؟', 'How reliable is the evidence base?'),
      claim: FT(`از ${F.i(L.length)} رکورد، ${F.i(strong)} رکورد (${nf((strong / L.length) * 100)}٪) از آمار رسمی، بین‌المللی یا اندازه‌گیری شبکه است؛ بقیه پیمایش، ادعای ناشر، رجیستری یا ارزیابی کاربر است. ${F.i(D.reg.conflicts.length)} تعارض میان منابع ثبت شده و در ارزیابی شبکه ملی ${F.i(nin.length)} مورد ناسازگاری ثبت است.`, `Of ${F.i(L.length)} records, ${F.i(strong)} (${nf((strong / L.length) * 100)}%) are official, international or network measurements; the rest are surveys, publisher claims, registries or user-supplied evaluation. ${D.reg.conflicts.length} conflicts between sources and ${nin.length} inconsistencies in the NIN file are registered.`),
      viz: [AIVIZ.bars(rows.slice(0, 8).map((r) => ({t: FT(r.t, r.k), v: r.n, c: r.r <= 2 ? 'var(--teal)' : r.r <= 3 ? 'var(--amber)' : 'var(--red)'})), {label: FT('رکورد به تفکیک نوع شاهد', 'Records by evidence type'), fmt: (v) => F.i(v)})],
      tables: [tbl([FT('نوع شاهد', 'Evidence type'), FT('رکورد', 'Records'), FT('سطح اعتبار (۱ بهترین)', 'Reliability rank (1 best)')], rows.map((r) => [esc(FT(r.t, r.k)), F.i(r.n), F.i(r.r)]))],
      calc: FT('هر رکورد یک نوع شاهد دارد؛ سطح اعتبار از جدول انواع شاهد رادار می‌آید و فهرست منابع (کاتالوگ) شاهد شمرده نمی‌شود.', 'Each record carries one evidence type; the reliability rank comes from the radar’s evidence table and the source catalogue is not counted as evidence.'),
      infer: FT('هسته‌ی عددی رسمی کوچک و محکم است و بخش بزرگ‌تر رادار شواهد درجه‌ی پایین‌تر دارد؛ تحلیل‌ها باید سطح شاهد را همراه نتیجه نشان دهند.', 'The official numeric core is small and firm, while the larger part of the radar rests on lower-grade evidence; analyses must show the evidence grade with the result.'),
      limits: FT('شمار رکورد کیفیت نیست؛ یک رکورد رسمی با تعریف مبهم از چند رکورد دقیق کم‌اعتبارتر است.', 'A record count is not quality; one official record with a vague definition can be less reliable than several precise ones.'),
      need: FT('احراز اصل منابع پیش‌نمایشی و پاسخ متولیان به تعارض‌ها.', 'Verification of the preview sources and the owners’ answers to the conflicts.'),
      source: FT('فهرست رکوردهای رادار؛ ثبت تعارض‌ها و ناسازگاری‌ها.', 'Radar record list; registered conflicts and inconsistencies.'),
      go: ['explorer', 'کاوشگر داده', 'Data explorer'], kind: 'trust'});
  };
  const gaps = () => {
    const rows = DOM_ORDER.map((k) => { const L = REC.list.filter((r) => r.dom === k && r.coll !== 'src'); return {k, n: L.length, off: L.filter((r) => r.coll === 'off').length, need: (DOM_GAP[k] || {}).need || ''}; });
    return answer({
      title: FT('چه داده‌هایی کم داریم؟ شکاف هر حوزه', 'What data is missing? The gap of each domain'),
      claim: FT(`پوشش حوزه‌ها یکدست نیست: ${rows.slice().sort((a, b) => b.n - a.n)[0] ? DOM[rows.slice().sort((a, b) => b.n - a.n)[0].k].n : ''} بیشترین رکورد را دارد و ${DOM[rows.slice().sort((a, b) => a.n - b.n)[0].k].n} کمترین را.`, `Coverage is uneven across domains.`),
      viz: [AIVIZ.bars(rows.map((r) => ({t: DOM[r.k].n, v: r.n, c: 'var(--ice)'})), {label: FT('رکورد به تفکیک حوزه', 'Records by domain'), fmt: (v) => F.i(v)})],
      tables: [tbl([FT('حوزه', 'Domain'), FT('رکورد', 'Records'), FT('رسمی', 'Official'), FT('داده‌ی لازم که نداریم', 'Missing data')], rows.map((r) => [esc(DOM[r.k].n), F.i(r.n), F.i(r.off), esc(r.need)]))],
      calc: FT('شمارش رکوردها بر اساس حوزه‌ی ثبت‌شده؛ شکاف‌ها از ثبت شکاف داده‌ی هر حوزه آمده است.', 'Records counted by their registered domain; gaps come from each domain’s registered data gap.'),
      infer: FT('پرسش‌های بدون داده‌ی مستقیم (قیمت، اتصال مدارس و مراکز درمانی، ساعت اوج) به همین ردیف‌ها برمی‌گردد.', 'Questions without direct data (prices, school and clinic connectivity, peak hours) trace back to these rows.'),
      source: FT('ثبت شکاف داده‌ی رادار.', 'Radar data-gap register.'), go: ['registry', 'ثبت منابع', 'Source registry'], kind: 'gaps'});
  };

  /* ===== generic: any topic in the radar ===== */
  const X = {روستا: 'village rural', قیمت: 'price tariff', هزینه: 'cost price', مدرسه: 'school', درمان: 'health', سرعت: 'speed', جهان: 'global itu world', تلفن: 'telephone', پیامک: 'sms', شکایت: 'complaint', نفوذ: 'penetration', اشتراک: 'subscription', اینترنت: 'internet broadband', ثابت: 'fixed', سیار: 'mobile', همراه: 'mobile', فیبر: 'fiber fttx', پوشش: 'coverage', مصرف: 'usage traffic', قطعی: 'outage', اختلال: 'outage interruption', فیلترشکن: 'vpn tor', واسط: 'tor vpn', ابر: 'cloud', 'مرکز داده': 'data center', رومینگ: 'roaming', جاده: 'road', عمومی: 'public', ipv6: 'ipv6', تبادل: 'ixp exchange', امنیت: 'security', رخداد: 'incident'};
  const EN = {village: 'روستا', rural: 'روستا', price: 'قیمت', cost: 'هزینه', school: 'مدرسه', health: 'درمان', speed: 'سرعت', world: 'جهان', global: 'جهان', telephone: 'تلفن', sms: 'پیامک', complaint: 'شکایت', penetration: 'نفوذ', subscription: 'اشتراک', fixed: 'ثابت', mobile: 'سیار', fibre: 'فیبر', fiber: 'فیبر', coverage: 'پوشش', outage: 'قطعی', roaming: 'رومینگ', road: 'جاده', cloud: 'ابر', security: 'امنیت', incident: 'رخداد', broadband: 'پهن باند', internet: 'اینترنت', tor: 'واسط', vpn: 'واسط'};
  const topicBrief = (q, raw) => {
    const toks = q.split(' ').filter((w) => w.length > 2 && !AI.STOP.has(w));
    const exp = toks.map((w) => (X[w] ? w + ' ' + X[w] : EN[w] ? w + ' ' + EN[w] : w)).join(' ').split(' ');
    const pool = REC.list.filter((r) => r.coll !== 'src');
    const sc = pool.map((r) => { const t = norm([r.t, r.def, r.id, r.src, r.sub, (DOM[r.dom] || {}).n].join(' ')); const s = exp.reduce((a, w) => a + (t.includes(w) ? (w.length > 3 ? 2 : 1) : 0), 0); return {r, s}; }).filter((x) => x.s >= 2).sort((a, b) => b.s - a.s || (a.r.coll === 'off' ? -1 : 1)).slice(0, 8);
    const dom = Object.keys(DOM).filter((k) => sc.slice(0, 5).some((x) => x.r.dom === k)), d0 = dom[0];
    const lev = {};
    sc.forEach((x) => { const k = (ET[x.r.et] || {}).n || x.r.et; lev[k] = (lev[k] || 0) + 1; });
    const ttl = FT('داده‌ای برای پاسخ مستقیم به این پرسش نیست؛ نزدیک‌ترین شواهد', 'No direct metric of that name in the radar; the nearest evidence');
    return answer({
      title: sc.length ? ttl : FT('داده‌ای برای پاسخ مستقیم به این پرسش نیست', 'The radar has no direct data on this topic'),
      claim: sc.length ? FT(`${F.i(sc.length)} رکورد نزدیک پیدا شد${d0 ? `، بیشتر در حوزه‌ی ${DOM[d0].n}` : ''}. هیچ‌کدام تعریف دقیق پرسش شما را ندارند؛ عددها را فقط با دوره و نوع شاهدشان بخوانید.`, `${sc.length} nearby records were found${d0 ? `, mostly in the ${DOM[d0].n} domain` : ''}; none matches the exact definition of the question, so read each figure only with its period and evidence type.`) : FT('برای این پرسش رکوردی با تطابق کافی پیدا نشد و عددی برآورد یا ساخته نمی‌شود.', 'No record matched this question well enough, and no figure will be estimated or invented.'),
      viz: [sc.length ? AIVIZ.bars(Object.entries(lev).map(([k, n]) => ({t: k, v: n, c: 'var(--amber)'})), {label: FT('نوع شاهد در نزدیک‌ترین رکوردها', 'Evidence type of the nearest records'), fmt: (v) => F.i(v)}) : AIVIZ.bars(DOM_ORDER.map((k) => ({t: DOM[k].n, v: REC.list.filter((r) => r.dom === k && r.coll !== 'src').length, c: 'var(--ice)'})), {label: FT('رکورد موجود در هر حوزه', 'Records available per domain'), fmt: (v) => F.i(v)})],
      tables: [sc.length ? tbl([FT('رکورد', 'Record'), FT('مقدار', 'Value'), FT('دوره', 'Period'), FT('نوع شاهد', 'Evidence'), FT('منبع', 'Source')], sc.map((x) => [`<a href="#" data-rk="${esc(x.r.k)}" class="mono" style="color:var(--ice)">${esc(x.r.id)}</a> ${esc(x.r.t)}`, x.r.v == null ? '—' : typeof x.r.v === 'number' ? F.n(x.r.v) + ' ' + esc(x.r.u || '') : esc(String(x.r.v)), esc(String(x.r.p || '—')), esc((ET[x.r.et] || {}).n || x.r.et), esc(String(x.r.src || '—').slice(0, 60))])) : tbl([FT('حوزه', 'Domain'), FT('داده‌ی لازم که نداریم', 'Missing data')], DOM_ORDER.map((k) => [esc(DOM[k].n), esc((DOM_GAP[k] || {}).need || '')]))],
      calc: FT('تطابق واژه‌های پرسش (با معادل‌های فارسی و انگلیسی) با عنوان، تعریف، منبع و حوزه‌ی رکوردها؛ بدون تفسیر عددی.', 'Matching of the question’s words (with Persian and English equivalents) against title, definition, source and domain of each record; no numeric interpretation.'),
      infer: d0 ? FT(`شکاف اصلی حوزه‌ی ${DOM[d0].n}: ${(DOM_GAP[d0] || {}).need || ''}.`, `Main gap of the ${DOM[d0].n} domain: ${(DOM_GAP[d0] || {}).need || ''}.`) : '',
      limits: FT('نزدیکی واژه‌ای دلیل تطابق مفهومی نیست.', 'Wording proximity is not conceptual match.'),
      source: FT('فهرست رکوردهای رادار.', 'Radar record list.'), go: ['explorer', 'کاوشگر داده', 'Data explorer'], kind: 'topic'});
  };


  /* ===== plan (document) against self-assessment against measurement =====
     Thresholds are quoted from the Supreme Council of Cyberspace master plan, article 2-2-1 (goal numbers match the radar's goal numbers). */
  const wOf = (i, y) => (i.weight && i.weight[y] != null ? i.weight[y] : null);
  const pOf = (c, y) => { const i = NIN.inds.find((x) => x.code === c); return i && i.perf ? i.perf[y] : null; };
  const planGap = () => {
    const tf = (l) => D.traffic.find((x) => x.label === l), dom = (l) => { const t = tf(l); return (t.domestic / (t.domestic + t.international)) * 100; };
    const ann = (y) => { const r = D.tic.filter((x) => String(x.year) === String(y)); return r.length ? {n: r.length, rtt: r.reduce((s, x) => s + x.rtt, 0) / r.length, plr: r.reduce((s, x) => s + x.plr, 0) / r.length, jit: r.reduce((s, x) => s + x.jitter, 0) / r.length} : null; };
    const A3 = ann(1403), A4 = ann(1404), A5 = ann(1405), g = M.gen, g5 = (g.g5 / g.t) * 100;
    const fx = dom('اینترنت ثابت'), mb = dom('جمع سیار');
    const i472 = NIN.inds.find((x) => x.code === '472');
    const loss4 = A4.plr / 100;
    const rows = [
      [FT('۴ · سهم ترافیک خدمات داخلی', '4 · domestic traffic share'), FT('۷۰٪ داخلی در برابر ۳۰٪ خارجی', '70% domestic against 30% foreign'), `395: ${nf(pOf('395', '1405'))} · 397: ${nf(pOf('397', '1405'))}`, FT(`سهم ترافیک داخلی ثابت ${nf(fx)}٪ و سیار ${nf(mb)}٪ (تابستان ۱۴۰۵)؛ ${nf((fx / 70) * 100, 0)}٪ و ${nf((mb / 70) * 100, 0)}٪ آستانه`, `Domestic traffic share fixed ${nf(fx)}%, mobile ${nf(mb)}% (summer 1405): ${nf((fx / 70) * 100, 0)}% and ${nf((mb / 70) * 100, 0)}% of the threshold`), FT('هم‌اندازه (تعریف‌ها یکی نیست)', 'Same order of magnitude (definitions differ)')],
      [FT('۸ · تأخیر سالانه‌ی هسته', '8 · annual core delay'), FT('میانگین سالانه زیر ۳۰ میلی‌ثانیه', 'Annual mean under 30 ms'), `564: ${nf(pOf('564', '1403'), 0)} · ${nf(pOf('564', '1404'), 0)} · ${nf(pOf('564', '1405'), 0)}`, FT(`TIC: ${nf(A3.rtt)} (۱۴۰۳)، ${nf(A4.rtt)} (۱۴۰۴)، ${nf(A5.rtt)} فقط فصل اول ۱۴۰۵`, `TIC: ${nf(A3.rtt)} (1403), ${nf(A4.rtt)} (1404), ${nf(A5.rtt)} for 1405 Q1 only`), FT('ناسازگار برای ۱۴۰۳ و ۱۴۰۴', 'Inconsistent for 1403 and 1404')],
      [FT('۸ · اتلاف بسته', '8 · packet loss'), FT('کمتر از یک در میلیون (۰٫۰۰۰۱٪)', 'Below one in a million (0.0001%)'), `563: ${nf(pOf('563', '1403'), 0)} · ${nf(pOf('563', '1404'), 0)} · ${nf(pOf('563', '1405'), 0)}`, FT(`TIC میانگین ۱۴۰۴: ${nf(A4.plr, 4)}٪ یعنی ${F.i(Math.round(loss4 / 1e-6))} برابر آستانه`, `TIC 1404 mean ${nf(A4.plr, 4)}%, ${F.i(Math.round(loss4 / 1e-6))} times the threshold`), FT('ناسازگار (احتمالاً دامنه‌ی اندازه‌گیری فرق دارد)', 'Inconsistent (the measurement scope may differ)')],
      [FT('۸ · تأخیر متغیر', '8 · jitter'), FT('کمتر از ۲ میلی‌ثانیه', 'Under 2 ms'), `565: ${nf(pOf('565', '1404'), 0)} · ${nf(pOf('565', '1405'), 0)}`, FT(`TIC ${nf(Math.min(...D.tic.map((x) => x.jitter)), 2)} تا ${nf(Math.max(...D.tic.map((x) => x.jitter)), 2)}`, `TIC ${nf(Math.min(...D.tic.map((x) => x.jitter)), 2)} to ${nf(Math.max(...D.tic.map((x) => x.jitter)), 2)}`), FT('سازگار', 'Consistent')],
      [FT('۵ · نسل جدید', '5 · new generation'), FT('اتصال دست‌کم ۱۰٪ کاربران', 'At least 10% of users connected'), `400: ${nf(pOf('400', '1405'))} → ${nf(pOf('400', '1405') / 10)}٪`, FT(`اشتراک 5G ${nf(g5)}٪ پهن‌باند سیار (اشتراک، نه کاربر یکتا)`, `5G subscriptions ${nf(g5)}% of mobile broadband (subscriptions, not unique users)`), FT('هم‌اندازه', 'Same order of magnitude')],
      [FT('۱۹ · سیستم‌عامل داخلی', '19 · domestic OS'), FT('دست‌کم ۲۰٪ بازار گوشی هوشمند', 'At least 20% of the smartphone market'), `472: ${nf(i472 ? i472.perf['1405'] : 0)}٪ ${FT('با وزن', 'at weight')} ${F.i(wOf(i472, '1405'))}`, FT('هیچ شاخصی سهم سیستم‌عامل داخلی را مستقیم نمی‌سنجد؛ نزدیک‌ترین عدد سهم گوشی‌های ساخت داخل است', 'No indicator measures the domestic OS share directly; the nearest figure is the share of domestic-made phones'), FT('بدون سنجش مستقیم', 'Not directly measured')],
    ];
    const bad = rows.filter((r) => /ناسازگار|Inconsistent/.test(r[4])).length;
    return answer({
      title: FT('طرح کلان در برابر خوداظهاری در برابر اندازه‌گیری', 'Master plan against self-assessment against measurement'),
      claim: FT(`شماره‌ی هدف‌های رادار همان بندهای ۲-۲-۱-۱ تا ۳۰ طرح کلان شبکه ملی اطلاعات است، پس هر هدف را می‌توان با آستانه‌ی خودش سنجید. در شش مورد قابل‌سنجش، ${F.i(bad)} مورد با اندازه‌گیری مستقل نمی‌خواند: میانگین سالانه‌ی تأخیر TIC در ۱۴۰۳ ${nf(A3.rtt)} و در ۱۴۰۴ ${nf(A4.rtt)} میلی‌ثانیه است، بالای آستانه‌ی ۳۰، ولی شاخص ۵۶۴ در هر دو سال ۱۰۰٪ ثبت شده. اتلاف بسته در ۱۴۰۴ حدود ${F.i(Math.round(loss4 / 1e-6))} برابر آستانه است و شاخص ۵۶۳ از ۲۰ به ۱۰۰ پریده.`, `Radar goal numbers are the clause numbers 2-2-1-1 to 30 of the master plan, so each goal can be tested against its own threshold. Of six testable items, ${bad} disagree with independent measurement: the TIC annual mean delay is ${nf(A3.rtt)} ms in 1403 and ${nf(A4.rtt)} ms in 1404, above the 30 ms threshold, yet indicator 564 is recorded at 100% in both years. 1404 packet loss is about ${F.i(Math.round(loss4 / 1e-6))} times the threshold and indicator 563 jumped from 20 to 100.`),
      viz: [AIVIZ.bars([{t: FT('آستانه‌ی طرح', 'Plan threshold'), v: 30, c: 'var(--teal)'}, {t: '1403', v: A3.rtt, c: 'var(--red)'}, {t: '1404', v: A4.rtt, c: 'var(--red)'}, {t: FT('۱۴۰۵ فصل ۱', '1405 Q1'), v: A5.rtt, c: 'var(--amber)'}], {label: FT('میانگین سالانه‌ی RTT ملی (ms) در برابر آستانه‌ی ۳۰', 'Annual mean national RTT (ms) against the 30 ms threshold'), fmt: (v) => nf(v)})],
      tables: [tbl([FT('هدف', 'Goal'), FT('آستانه در طرح', 'Plan threshold'), FT('خوداظهاری شبکه ملی (کد: ۱۴۰۳·۱۴۰۴·۱۴۰۵)', 'NIN self-assessment (code: 1403·1404·1405)'), FT('اندازه‌گیری رادار', 'Radar measurement'), FT('قضاوت', 'Reading')], rows.map((r) => r.map((c, k) => (k === 4 ? `<b>${c}</b>` : c))))],
      calc: FT('میانگین سالانه‌ی RTT و اتلاف بسته از سری فصلی TIC؛ سهم داخلی از ترافیک تابستان ۱۴۰۵؛ سهم 5G از اشتراک‌های پهن‌باند سیار. ضریب اتلاف = میانگین ٪ ÷ ۱۰۰ ÷ ۰٫۰۰۰۰۰۱.', 'Annual mean RTT and packet loss from the quarterly TIC series; domestic share from summer 1405 traffic; 5G share from mobile broadband subscriptions. Loss multiple = mean % ÷ 100 ÷ 0.000001.'),
      infer: FT('ناسازگاری در تأخیر و اتلاف یا یعنی خوداظهاری خوش‌بینانه است، یا یعنی شاخص دامنه‌ی دیگری (هسته و تجمیع، نه کل مسیر TIC) را می‌سنجد. هر دو حالت با یک سؤال از متولی روشن می‌شود و تا آن زمان عدد ۱۰۰٪ این دو شاخص را نباید مبنای قضاوت کرد.', 'The delay and loss disagreement means either the self-assessment is optimistic or the indicator measures another scope (core and aggregation, not the whole TIC path). One question to the owner settles which; until then the 100% of these two indicators should not support a judgement.'),
      limits: FT('طرح، دامنه‌ی اندازه‌گیری را «بین دو نقطه‌ی داخلی شبکه‌های هسته و تجمیع» می‌گوید و سری TIC میانگین ملی است؛ پس این مقایسه ناسازگاری را نشان می‌دهد، نه خطا را اثبات می‌کند. اتلاف بسته در رادار بر حسب درصد است. افق طرح ۱۴۰۴ است.', 'The plan defines the scope as “between two internal nodes of the core and aggregation networks” while the TIC series is a national mean, so this exposes an inconsistency and does not prove an error. Packet loss in the radar is in percent. The plan horizon is 1404.'),
      need: FT('تعریف و محل اندازه‌گیری شاخص‌های ۵۶۳ تا ۵۶۵ و سری هسته‌ی شبکه از متولی.', 'The definition and probe locations of indicators 563 to 565, and the core-network series, from the owner.'),
      source: FT('طرح کلان و معماری شبکه ملی اطلاعات (مواد ۲ و ۳)؛ NIN.1405.07.xlsx؛ سری TIC و ترافیک رادار.', 'Master plan and architecture of the National Information Network (articles 2 and 3); NIN.1405.07.xlsx; radar TIC and traffic series.'),
      go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'planGap'});
  };

  /* ===== audit of the indicators themselves ===== */
  const ninAudit = () => {
    const I = NIN.inds, ys = ['1401', '1402', '1403', '1404', '1405'].filter((y) => I.some((i) => i.perf && i.perf[y] != null));
    const st = (y) => { const v = I.map((i) => i.perf[y]).filter((x) => x != null); const n = v.length; return {y, n, r5: (v.filter((x) => Math.abs(x / 5 - Math.round(x / 5)) < 1e-9).length / n) * 100, c100: (v.filter((x) => x === 100).length / n) * 100, c100n: v.filter((x) => x === 100).length, mean: v.reduce((a, b) => a + b, 0) / n}; };
    const S = ys.map(st), z = I.filter((i) => wOf(i, '1404') === 0 && wOf(i, '1405') === 0);
    const sw = I.filter((i) => i.perf['1404'] != null && i.perf['1405'] != null && Math.abs(i.perf['1405'] - i.perf['1404']) >= 40);
    const zz = I.filter((i) => { const p = ['1403', '1404', '1405'].map((y) => i.perf[y]); return !p.includes(null) && !p.includes(undefined) && (p[1] - p[0]) * (p[2] - p[1]) < 0 && Math.min(Math.abs(p[1] - p[0]), Math.abs(p[2] - p[1])) >= 25; });
    const s3 = S.find((x) => x.y === '1403'), s4 = S.find((x) => x.y === '1404'), s5 = S.find((x) => x.y === '1405');
    const gt = (i) => (NIN.byNo[i.goal] ? NIN.byNo[i.goal].short : '');
    return answer({
      title: FT('ممیزی خود شاخص‌ها: وزن صفر، سقف ۱۰۰ و جهش‌های بی‌توضیح', 'Audit of the indicators themselves: zero weights, the 100 ceiling and unexplained jumps'),
      claim: FT(`${F.i(z.length)} شاخص در ۱۴۰۴ و ۱۴۰۵ وزن صفر دارند و سه تایشان خودِ نتیجه‌ی هدف را می‌سنجند: سهم گوشی ساخت داخل (۴۷۲، هدف ۱۹) ${nf(pOf('472', '1405'))}٪، سهم تجهیزات بومی‌شده (۴۹۰، هدف ۲۳) ${nf(pOf('490', '1405'))}٪ و سهم سامانه‌های امنیتی بومی (۴۹۲، هدف ۲۴) ${nf(pOf('492', '1405'))}٪. با این حال هدف ۱۹ ${nf(NIN.byNo[19].progress['1405'])}٪ و هدف ۲۴ ${nf(NIN.byNo[24].progress['1405'])}٪ پیشرفت نشان می‌دهند؛ هدف ۲۳ با ${nf(NIN.byNo[23].progress['1405'])}٪ پایین است و به این ناسازگاری دچار نیست. سهم شاخص‌های دقیقاً ۱۰۰٪ از ${nf(s3.c100, 0)}٪ در ۱۴۰۳ به ${nf(s5.c100, 0)}٪ در ۱۴۰۵ رسیده (${F.i(s5.c100n)} از ${F.i(s5.n)}).`, `${z.length} indicators carry zero weight in 1404 and 1405 and three of them measure the outcome of their goal: the share of domestic-made phones (472, goal 19) ${nf(pOf('472', '1405'))}%, localised equipment (490, goal 23) ${nf(pOf('490', '1405'))}% and localised security systems (492, goal 24) ${nf(pOf('492', '1405'))}%. Even so goal 19 shows ${nf(NIN.byNo[19].progress['1405'])}% and goal 24 ${nf(NIN.byNo[24].progress['1405'])}% progress; goal 23 is low at ${nf(NIN.byNo[23].progress['1405'])}% and does not have that inconsistency. The share of indicators at exactly 100% rose from ${nf(s3.c100, 0)}% in 1403 to ${nf(s5.c100, 0)}% in 1405 (${s5.c100n} of ${s5.n}).`),
      viz: [AIVIZ.lines([{name: FT('دقیقاً ۱۰۰٪', 'Exactly 100%'), pts: S.map((x) => r1(x.c100)), c: 'var(--amber)'}, {name: FT('مضرب ۵', 'Multiple of 5'), pts: S.map((x) => r1(x.r5)), c: 'var(--ice)'}], ys.map((y) => yf(y)), {label: FT('سهم شاخص‌های سقف‌دار و گرد (٪)', 'Share of ceiling and round-number indicators (%)'), fmt: (v) => nf(v, 0)})],
      tables: [tbl([FT('سال', 'Year'), FT('شاخص', 'Indicators'), FT('میانگین', 'Mean'), FT('دقیقاً ۱۰۰', 'At 100'), FT('مضرب ۵', 'Multiple of 5'), FT('وضعیت ارزیابی', 'Basis')], S.map((x) => [yf(x.y), F.i(x.n), nf(x.mean), nf(x.c100) + '٪', nf(x.r5, 0) + '٪', NIN.YSTAT && NIN.YSTAT[x.y] ? FT('خوداظهاری', 'self-assessment') : FT('تأیید ناظر', 'supervisor-approved')])),
        tbl([FT('شاخص با وزن صفر', 'Zero-weight indicator'), FT('هدف', 'Goal'), FT('۱۴۰۵', '1405')], z.map((i) => [`${F.i(i.code)} ${esc(String(i.title).slice(0, 70))}`, `${F.i(i.goal)} ${esc(gt(i))}`, i.perf['1405'] == null ? '—' : nf(i.perf['1405'])])),
        tbl([FT('شاخص با جهش ≥۴۰ واحد (۱۴۰۴ ← ۱۴۰۵)', 'Indicator with jump ≥40 points (1404 → 1405)'), FT('هدف', 'Goal'), '۱۴۰۴', '۱۴۰۵'], sw.map((i) => [F.i(i.code), `${F.i(i.goal)} ${esc(gt(i))}`, nf(i.perf['1404']), nf(i.perf['1405'])]))],
      calc: FT(`میانگین شاخص‌ها در ۱۴۰۴ ${nf(s4.mean)} و در ۱۴۰۳ ${nf(s3.mean)} است (${sg(s4.mean - s3.mean, 1)} واحد در یک سال)، و ${nf(s4.r5, 0)}٪ مقدارهای ۱۴۰۴ مضرب ۵ است در برابر ${nf(s3.r5, 0)}٪ در سال تأییدشده. ${F.i(zz.length)} شاخص مسیر زیگزاگی دارند (بالا رفتن و برگشتن ≥۲۵ واحد در هر پا).`, `The mean of indicators is ${nf(s4.mean)} in 1404 against ${nf(s3.mean)} in 1403 (${sg(s4.mean - s3.mean, 1)} points in a year), and ${nf(s4.r5, 0)}% of 1404 values are multiples of 5 against ${nf(s3.r5, 0)}% in the approved year. ${zz.length} indicators zigzag (up and back by 25 points or more on each leg).`),
      infer: FT('وزن صفر یعنی بخش بزرگی از پیشرفت این اهداف از شاخص‌های فرایندی (تعداد مدل، نسبت تولید CKD) می‌آید و نه از سهم واقعی بازار یا بومی‌سازی. گرد بودن و جهش میانگین ۱۴۰۴ با الگوی تخمین ذهنی می‌خواند، و برگشت ۱۴۰۵ نشان می‌دهد مبنای دو سال یکی نیست.', 'A zero weight means a large part of these goals’ progress comes from process indicators (model counts, CKD production ratio) rather than real market or localisation share. The round values and the jump of the 1404 mean fit a pattern of judgemental estimates, and the 1405 reversal shows the two years do not share one basis.'),
      limits: FT('این ممیزی روی الگوی اعداد است و هیچ‌کدام را «اشتباه» اعلام نمی‌کند. برخی وزن‌های صفر ممکن است عمداً به‌خاطر نبودن داده باشند و ۱۴۰۵ ناتمام است (تا شهریور).', 'The audit looks at the pattern of numbers and does not declare any figure wrong. Some zero weights may be deliberate for lack of data, and 1405 is incomplete (to Shahrivar).'),
      need: FT('دلیل صفر بودن وزن این شش شاخص و روش تعیین مقدار ۱۴۰۴ از متولی.', 'The owner’s reason for the zero weights and the method used to set the 1404 values.'),
      source: FT('NIN.1405.07.xlsx؛ وزن و عملکرد شاخص‌ها در هر سال.', 'NIN.1405.07.xlsx; indicator weights and performance by year.'),
      go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'ninAudit'});
  };

  /* ===== what is still unfinished at the plan's horizon ===== */
  const deadline = () => {
    const Y = '1404', G = NIN.S.goals.filter((g) => g.progress[Y] != null), tw = G.reduce((s, g) => s + g.gweight, 0);
    const rows = G.map((g) => ({g, loss: (g.gweight * (100 - g.progress[Y])) / tw})).sort((a, b) => b.loss - a.loss), top = rows.slice(0, 8), tl = rows.reduce((s, r) => s + r.loss, 0), t8 = top.reduce((s, r) => s + r.loss, 0);
    const ax = (NIN.S.axes || []).map((a) => ({a, loss: rows.filter((r) => r.g.axis === a.no).reduce((s, r) => s + r.loss, 0)})).sort((x, y) => y.loss - x.loss);
    return answer({
      title: FT('هنوز چه چیزی تا افق ۱۴۰۴ طرح تمام نشده است؟', 'What is still unfinished at the plan’s 1404 horizon?'),
      claim: FT(`طرح کلان اهداف را در افق ۱۴۰۴ تعریف کرده و کل فاصله از ۱۰۰ در خوداظهاری ۱۴۰۴ ${nf(tl)} واحد است. هشت هدف ${nf((t8 / tl) * 100, 0)}٪ این فاصله را می‌سازند و بزرگ‌ترینش هدف ${F.i(top[0].g.no)} با ${nf(top[0].loss)} واحد است. محور «${esc(ax[0].a.title)}» ${nf(ax[0].loss)} واحد از آن را دارد.`, `The plan defines its goals at the 1404 horizon and the total distance from 100 in the 1404 self-assessment is ${nf(tl)} points. Eight goals make up ${nf((t8 / tl) * 100, 0)}% of that distance and the largest is goal ${top[0].g.no} with ${nf(top[0].loss)} points. Axis ${ax[0].a.no} holds ${nf(ax[0].loss)} points of it.`),
      viz: [AIVIZ.bars(top.map((r) => ({t: FT('هدف ', 'Goal ') + r.g.no, v: r2(r.loss), c: 'var(--amber)'})), {label: FT('واحد فاصله از ۱۰۰ در کل شاخص', 'Points of the total index lost against 100'), fmt: (v) => nf(v, 2)})],
      tables: [tbl([FT('هدف', 'Goal'), FT('وزن', 'Weight'), '۱۴۰۴', '۱۴۰۵', FT('فاصله‌ی وزنی', 'Weighted gap'), FT('سهم از کل فاصله', 'Share of total gap')], top.map((r) => [`<b>${F.i(r.g.no)}</b> ${esc(r.g.short)}`, nf(r.g.gweight), nf(r.g.progress[Y]), r.g.progress['1405'] == null ? '—' : nf(r.g.progress['1405']), nf(r.loss, 2), nf((r.loss / tl) * 100) + '٪'])),
        tbl([FT('محور', 'Axis'), FT('وزن', 'Weight'), FT('فاصله‌ی وزنی', 'Weighted gap')], ax.map((x) => [esc(FT(x.a.title, 'Axis ' + x.a.no)), nf(x.a.weight), nf(x.loss, 2)]))],
      calc: FT('فاصله‌ی وزنی هدف = وزن هدف ÷ جمع وزن‌ها × (۱۰۰ − پیشرفت ۱۴۰۴). جمع فاصله‌ها با ۱۰۰ منهای جمع وزنی اهداف برابر است.', 'Weighted gap of a goal = goal weight ÷ sum of weights × (100 − 1404 progress). The gaps add up to 100 minus the goal-weighted total.'),
      infer: FT('برای کاهش فاصله، کار روی چند هدف سنگین‌وزن بیشترین اثر را دارد؛ اما چون ۱۴۰۴ خوداظهاری است و ممیزی شاخص‌ها نشان می‌دهد برخی مقدارها گرد و بدون پشتوانه‌اند، ترتیب باید با اندازه‌گیری مستقل تأیید شود.', 'To shrink the gap, work on a few heavy goals has the largest effect; but since 1404 is self-assessed and the indicator audit shows some values are round and unsupported, the ranking must be confirmed by independent measurement.'),
      limits: FT('وزن هدف جمع وزنی اهداف است که با عدد کل گزارش‌شده (جمع وزنی محورها) یکی نیست. ۱۴۰۵ تا شهریور است و برای رتبه‌بندی افق از ۱۴۰۴ استفاده شد.', 'Goal weights give the goal-weighted total, which differs from the reported overall figure (weighted axes). 1405 runs to Shahrivar, so 1404 was used for the horizon ranking.'),
      source: FT('طرح کلان شبکه ملی اطلاعات (افق ۱۴۰۴)؛ NIN.1405.07.xlsx.', 'Master plan (1404 horizon); NIN.1405.07.xlsx.'),
      go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'deadline'});
  };


  /* ===== questions for the indicator owners, generated from the radar's own findings ===== */
  const ownerQuestions = () => {
    const I = NIN.inds, Q = [], by = (c) => I.find((i) => i.code === String(c)), t = (i) => String(i.title).slice(0, 80);
    const push = (i, kind, fa, en, settle) => Q.push({i, kind, fa, en, settle});
    (NIN.S.issues || []).filter((x) => x.cause === 'text_cells_as_zero').forEach((x) => (x.text_codes || []).forEach((c) => { const i = by(c); if (i) push(i, FT('سلول متنی', 'Text cell'), `مقدار ${x.year} این شاخص به‌صورت متن ثبت شده و در فرمول فایل صفر شمرده می‌شود (هدف ${F.i(x.goal)}: گزارش‌شده ${nf(x.reported, 2)} در برابر ${nf(x.recomputed, 2)}). مقدار واقعی چقدر است؟`, `The ${x.year} value is stored as text and counted as zero by the file’s formula (goal ${x.goal}: reported ${nf(x.reported, 2)} against ${nf(x.recomputed, 2)}). What is the real value?`, FT('مقدار عددی تأییدشده', 'A confirmed numeric value')); }));
    ['563', '564'].forEach((c) => { const i = by(c); if (i) push(i, FT('ناسازگاری با اندازه‌گیری', 'Conflict with measurement'), 'ارزیابی ۱۰۰٪ است ولی سری TIC (میانگین ملی) آستانه‌ی طرح را رعایت نمی‌کند. شاخص در کدام نقاط و با چه پروبی اندازه‌گیری می‌شود؟', 'The assessment is 100% while the TIC series (national mean) misses the plan threshold. At which points and with which probe is the indicator measured?', FT('محل اندازه‌گیری و سری خام', 'Measurement points and the raw series')); });
    I.filter((i) => wOf(i, '1404') === 0 && wOf(i, '1405') === 0).forEach((i) => push(i, FT('وزن صفر', 'Zero weight'), 'وزن این شاخص در ۱۴۰۴ و ۱۴۰۵ صفر است. دلیلش چیست و چرا در پیشرفت هدف نمی‌آید؟', 'This indicator has zero weight in 1404 and 1405. Why, and why is it left out of the goal’s progress?', FT('دلیل مکتوب یا اصلاح وزن', 'A written reason or a corrected weight')));
    I.filter((i) => i.perf['1404'] != null && i.perf['1405'] != null && Math.abs(i.perf['1405'] - i.perf['1404']) >= 40).forEach((i) => push(i, FT('جهش بزرگ', 'Large jump'), `مقدار از ${nf(i.perf['1404'])} در ۱۴۰۴ به ${nf(i.perf['1405'])} در ۱۴۰۵ رسیده. تغییر مبنای محاسبه بوده یا تغییر واقعی؟`, `The value moved from ${nf(i.perf['1404'])} in 1404 to ${nf(i.perf['1405'])} in 1405. Did the basis change or is it a real change?`, FT('روش محاسبه‌ی هر دو سال', 'The method used in both years')));
    const seen = new Set(), U = Q.filter((q) => { const k = q.i.code + q.kind; if (seen.has(k)) return false; seen.add(k); return true; });
    const owners = {}; U.forEach((q) => { (owners[q.i.own || q.i.owner] = owners[q.i.own || q.i.owner] || []).push(q); });
    const rows = Object.entries(owners).sort((a, b) => b[1].length - a[1].length);
    const csv = '﻿' + ['owner,code,goal,type,question,what_settles_it'].concat(U.map((q) => [q.i.own || q.i.owner, q.i.code, q.i.goal, q.kind, FT(q.fa, q.en), q.settle].map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(','))).join('\n');
    const href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const A = answer({
      title: FT('برگه‌ی پرسش برای متولیان شاخص‌ها', 'Question sheet for the indicator owners'),
      claim: FT(`از یافته‌های خود رادار ${F.i(U.length)} پرسش مشخص برای ${F.i(rows.length)} متولی ساخته شد. هر پرسش به یک شاخص با کدش، یک عدد و آنچه جواب را قطعی می‌کند وصل است؛ بیشترین پرسش‌ها برای «${esc(rows[0][0])}» است (${F.i(rows[0][1].length)}).`, `${U.length} specific questions for ${rows.length} owners were generated from the radar’s own findings. Each ties to an indicator code, a number and what would settle it; the most questions go to ${esc(rows[0][0])} (${rows[0][1].length}).`),
      viz: [AIVIZ.bars(rows.map(([o, l]) => ({t: String(o).slice(0, 26), v: l.length, c: 'var(--amber)'})), {label: FT('پرسش به تفکیک متولی', 'Questions by owner'), fmt: (v) => F.i(v)})],
      tables: [tbl([FT('متولی', 'Owner'), FT('شاخص', 'Indicator'), FT('نوع', 'Type'), FT('پرسش', 'Question'), FT('قطعی‌شدن با', 'Settled by')], rows.flatMap(([o, l]) => l.map((q) => [esc(o), `<b>${F.i(q.i.code)}</b> ${esc(t(q.i))}`, q.kind, FT(q.fa, q.en), q.settle])))],
      calc: FT('هر پرسش از یکی از چهار قاعده می‌آید: سلول متنی، ناسازگاری با اندازه‌گیری مستقل، وزن صفر در هر دو سال، جهش ≥۴۰ واحد بین ۱۴۰۴ و ۱۴۰۵. هیچ پرسشی ادعا نمی‌کند عددی اشتباه است.', 'Each question comes from one of four rules: a text cell, a conflict with independent measurement, zero weight in both years, or a jump of 40 points or more between 1404 and 1405. No question claims a figure is wrong.'),
      infer: FT('پاسخ هر متولی باید با تاریخ و منبع در رادار ثبت شود تا اختلاف‌ها بسته یا باز علامت بخورد.', 'Each owner’s answer should be recorded in the radar with a date and source so that every discrepancy can be marked closed or open.'),
      limits: FT('فهرست فقط ناسازگاری‌هایی را می‌گیرد که قاعده‌های بالا می‌بینند؛ نبودنِ پرسش برای یک شاخص گواه درستی آن نیست.', 'The list captures only what the rules above can see; no question for an indicator is not proof that it is right.'),
      source: FT('NIN.1405.07.xlsx؛ سری TIC رادار؛ یافته‌های ممیزی.', 'NIN.1405.07.xlsx; radar TIC series; audit findings.'),
      go: null, kind: 'ownerQs'});
    A.b += `<p><a download="owner_questions.csv" href="${href}" class="mono" style="color:var(--ice)">${FT('دریافت برگه (CSV)', 'Download the sheet (CSV)')}</a></p>`;
    return A;
  };

  /* ===== living dictionary of the indicators ===== */
  const indDict = (q) => {
    const I = NIN.inds, code = (fa2en(q).match(/(?<!\d)(\d{3})(?!\d)/g) || []).find((c) => I.some((i) => i.code === c)), ys = ['1401', '1402', '1403', '1404', '1405'];
    const flags = (i) => { const f = [], w4 = wOf(i, '1404'), w5 = wOf(i, '1405'), p = ys.map((y) => i.perf[y]); if (w4 === 0 && w5 === 0) f.push(FT('وزن صفر', 'zero weight')); if (p.filter((x) => x === 100).length >= 3) f.push(FT('سقف ۱۰۰ سه سال', '100 for three years')); if (i.perf['1404'] != null && i.perf['1405'] != null && Math.abs(i.perf['1405'] - i.perf['1404']) >= 40) f.push(FT('جهش ≥۴۰', 'jump ≥40')); if ((NIN.S.issues || []).some((x) => (x.text_codes || []).includes(i.code))) f.push(FT('سلول متنی', 'text cell')); return f; };
    if (code) {
      const i = I.find((x) => x.code === code), g = NIN.byNo[i.goal], f = flags(i);
      return answer({
        title: FT(`شاخص ${F.i(code)}: تعریف، وزن و سابقه`, `Indicator ${code}: definition, weight and history`),
        claim: FT(`${esc(i.title)} — هدف ${F.i(i.goal)} (${esc(g ? g.short : '')})، متولی: ${esc(i.own || i.owner)}. ${f.length ? 'نشانه‌ها: ' + f.join('، ') + '.' : 'نشانه‌ی ناسازگاری ندارد.'}`, `${esc(i.title)} — goal ${i.goal} (${esc(g ? g.short : '')}), owner: ${esc(i.own || i.owner)}. ${f.length ? 'Flags: ' + f.join(', ') + '.' : 'No inconsistency flags.'}`),
        viz: [AIVIZ.line(ys.filter((y) => i.perf[y] != null).map((y) => ({x: yf(y), v: i.perf[y]})), {label: FT('عملکرد شاخص (٪ تحقق)', 'Indicator achievement (%)')})],
        tables: [tbl([FT('سال', 'Year'), FT('عملکرد', 'Performance'), FT('وزن در هدف', 'Weight in goal'), FT('ارزیابی', 'Basis')], ys.map((y) => [yf(y), i.perf[y] == null ? '—' : nf(i.perf[y]), wOf(i, y) == null ? '—' : nf(wOf(i, y), 2), NIN.YSTAT && NIN.YSTAT[y] ? FT('خوداظهاری', 'self-assessment') : FT('تأیید ناظر', 'supervisor-approved')]))],
        calc: FT('وزن شاخص در هدف از فایل ارزیابی؛ نشانه‌ها با همان قاعده‌های ممیزی (وزن صفر، سقف ۱۰۰، جهش، سلول متنی) محاسبه شده‌اند.', 'Indicator weight in the goal from the assessment file; flags use the same audit rules (zero weight, 100 ceiling, jump, text cell).'),
        limits: FT('تعریف دقیق صورت و مخرج و دامنه‌ی اندازه‌گیری در فایل نیست و باید از متولی گرفته شود؛ فقط عنوان شاخص موجود است.', 'The exact numerator, denominator and measurement scope are not in the file and must come from the owner; only the indicator title is available.'),
        source: FT('NIN.1405.07.xlsx.', 'NIN.1405.07.xlsx.'), go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'indDict'});
    }
    const F2 = I.filter((i) => i.perf[NIN.LAST] != null).map((i) => ({i, f: flags(i)})), fl = F2.filter((x) => x.f.length), kinds = {};
    fl.forEach((x) => x.f.forEach((k) => { kinds[k] = (kinds[k] || 0) + 1; }));
    return answer({
      title: FT('فرهنگ شاخص‌ها: کدام شاخص نشانه‌ی ناسازگاری دارد', 'Indicator dictionary: which indicators carry a flag'),
      claim: FT(`از ${F.i(I.filter((i) => i.perf[NIN.LAST] != null).length)} شاخص دارای عملکرد جاری (${F.i(I.length - I.filter((i) => i.perf[NIN.LAST] != null).length)} شاخص تاریخیِ کنارگذاشته‌شده جدا شد)، ${F.i(fl.filter((x) => x.i.perf[NIN.LAST] != null).length)} شاخص دست‌کم یک نشانه دارند. برای دیدن کارت یک شاخص کدش را بپرسید (مثلاً «شاخص ۵۶۴»).`, `Of ${I.filter((i) => i.perf[NIN.LAST] != null).length} indicators with current performance (${I.length - I.filter((i) => i.perf[NIN.LAST] != null).length} retired historical ones set aside), ${fl.filter((x) => x.i.perf[NIN.LAST] != null).length} carry at least one flag. Ask for an indicator by code (for example “indicator 564”) to see its card.`),
      viz: [AIVIZ.bars(Object.entries(kinds).map(([k, n]) => ({t: k, v: n, c: 'var(--amber)'})), {label: FT('شاخص‌ها به تفکیک نشانه', 'Indicators by flag'), fmt: (v) => F.i(v)})],
      tables: [tbl([FT('شاخص', 'Indicator'), FT('هدف', 'Goal'), FT('متولی', 'Owner'), FT('نشانه‌ها', 'Flags')], fl.map((x) => [`<b>${F.i(x.i.code)}</b> ${esc(String(x.i.title).slice(0, 70))}`, F.i(x.i.goal), esc(x.i.own || x.i.owner), x.f.join('، ')]))],
      calc: FT('نشانه‌ها: وزن صفر در ۱۴۰۴ و ۱۴۰۵؛ ۱۰۰٪ در دست‌کم سه سال؛ جهش ≥۴۰ واحد بین ۱۴۰۴ و ۱۴۰۵؛ سلول متنی.', 'Flags: zero weight in 1404 and 1405; 100% in at least three years; a jump of 40 points or more between 1404 and 1405; text cell.'),
      limits: FT('نشانه به معنی خطا نیست؛ فقط می‌گوید پیش از تفسیر باید از متولی پرسید.', 'A flag does not mean an error; it says the owner must be asked before interpretation.'),
      source: FT('NIN.1405.07.xlsx.', 'NIN.1405.07.xlsx.'), go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'indDict'});
  };


  /* ===== what if domestic traffic share rises by N points ===== */
  const whatIf = (q) => {
    const m = fa2en(String(q)).match(/(?<!\d)(\d{1,2})(?!\d)\s*(واحد|درصد|point|%|pts?)?/), N = m && +m[1] > 0 && +m[1] <= 60 ? +m[1] : 10;
    const tf = (l) => D.traffic.find((x) => x.label === l), lt = (mt, n, r) => D.latency.find((x) => x.metric === mt && x.network === n && x.route === r).value;
    const rows = [['fixed', 'اینترنت ثابت', FT('ثابت', 'Fixed')], ['mobile', 'جمع سیار', FT('سیار', 'Mobile')]].map(([n, l, nm]) => { const t = tf(l), ds = (t.domestic / (t.domestic + t.international)) * 100, rd = lt('rtt', n, 'domestic'), ri = lt('rtt', n, 'international'), w = (d) => (d / 100) * rd + (1 - d / 100) * ri; return {nm, ds, rd, ri, w, base: w(ds), after: w(Math.min(100, ds + N)), need: 70 - ds, atT: w(70)}; });
    const steps = [5, 10, 20, 30];
    return answer({
      title: FT(`اگر سهم ترافیک داخلی ${F.i(N)} واحد بالا برود`, `If the domestic traffic share rises by ${N} points`),
      claim: FT(rows.map((r) => `${r.nm}: سهم داخلی ${nf(r.ds)}٪ ← ${nf(r.ds + N)}٪ و تأخیر مؤثر از ${nf(r.base)} به ${nf(r.after)} میلی‌ثانیه (${sg(r.after - r.base, 1)})`).join('؛ ') + '. این یک حساسیت حسابی است و تحقق هدف ۴ را نشان نمی‌دهد: هدف ۴ درباره‌ی ترافیک «خدمات پایه‌ی کاربردی» است و سهم ۷۰٪ آن، صورت و مخرجی دیگر از سهم کل ترافیک داخلی دارد.', rows.map((r) => `${r.nm}: domestic share ${nf(r.ds)}% → ${nf(r.ds + N)}% and effective delay ${nf(r.base)} → ${nf(r.after)} ms (${sg(r.after - r.base, 1)})`).join('; ') + '. This is an arithmetic sensitivity and does not show goal 4 achievement: goal 4 concerns the traffic of “basic applied services”, and its 70% share has a different numerator and denominator from the share of all domestic traffic.'),
      viz: [AIVIZ.lines(rows.map((r, k) => ({name: r.nm, c: k ? 'var(--amber)' : 'var(--ice)', pts: [0, ...steps].map((d) => r1(r.w(Math.min(100, r.ds + d)) * 10) / 10)})), ['0', ...steps.map((d) => '+' + d)], {label: FT('تأخیر مؤثر (ms) برحسب افزایش سهم داخلی (واحد)', 'Effective delay (ms) by rise in domestic share (points)'), fmt: (v) => nf(v, 0)})],
      tables: [tbl([FT('شبکه', 'Network'), FT('سهم داخلی الان', 'Domestic share now'), FT('RTT الان', 'RTT now'), FT(`RTT با +${N}`, `RTT at +${N}`), FT('واحد تا ۷۰٪ (مرجع فرضی)', 'Points to 70% (hypothetical reference)'), FT('RTT در ۷۰٪', 'RTT at 70%')], rows.map((r) => [r.nm, nf(r.ds) + '٪', nf(r.base), nf(r.after), nf(r.need), nf(r.atT)]))],
      calc: FT('تأخیر مؤثر = سهم داخلی × RTT داخلی + (۱ − سهم داخلی) × RTT بین‌الملل، با RTT هر مسیر ثابت. سهم‌ها از ترافیک تابستان ۱۴۰۵ است.', 'Effective delay = domestic share × domestic RTT + (1 − domestic share) × international RTT, with each route’s RTT held fixed. Shares are from the summer 1405 traffic.'),
      infer: FT('نتیجه فقط حساب میانگین وزنی با RTT ثابت هر مسیر است؛ اینکه جابه‌جایی ترافیک واقعاً چنین تأخیری را برای کاربر می‌دهد اثبات نشده. این سناریو برآورد حساسیت است، نه پیش‌بینی و نه سنجش اثر.', 'The result is only a weighted average with each route’s RTT held fixed; that moving traffic would really give users this delay is not shown. The scenario is a sensitivity estimate, neither a forecast nor a measured effect.'),
      limits: FT('فرض می‌کند RTT هر مسیر با جابه‌جایی ترافیک عوض نشود. سهم کل ترافیک داخلی با «ترافیک خدمات پایه‌ی کاربردی» هدف ۴ (صورت و مخرج متفاوت) یکی نیست. دوره‌ی سری تأخیر و دوره‌ی ترافیک (تابستان ۱۴۰۵) و خدمت و مسیر اندازه‌گیری تطبیق داده نشده‌اند.', 'It assumes each route’s RTT does not change as traffic moves. The share of all domestic traffic is not the “basic applied services traffic” of goal 4 (different numerator and denominator). The period of the latency series, the traffic period (summer 1405), the service and the measured route have not been matched.'),
      source: FT('ترافیک تابستان ۱۴۰۵ و سری تأخیر رادار؛ برای مقایسه با تعریف هدف: طرح کلان شبکه ملی (بند ۲-۲-۱-۴).', 'Summer 1405 traffic and the radar latency series; master plan clause 2-2-1-4.'),
      go: ['quality', 'کیفیت و تأخیر', 'Quality and latency'], kind: 'whatIf'});
  };


  /* ===== «how was it calculated»: formula, inputs with their source rows, substitution, checks ===== */
  const kvv = (id) => { const k = D.kpi.find((x) => x.id === id); return k ? k.v : null; };
  const calcCard = ({title, formula, inputs, steps, result, checks, limits, source, go, kind}) => answer({
    title, claim: FT(`<b>فرمول:</b> ${formula}`, `<b>Formula:</b> ${formula}`),
    tables: [tbl([FT('ورودی', 'Input'), FT('مقدار', 'Value'), FT('منبع', 'Source')], inputs.map((r) => [r[0], r[1], r[2]])), ...(checks && checks.length ? [tbl([FT('بازبینی', 'Check'), FT('نتیجه', 'Result')], checks)] : [])],
    calc: steps.join('<br>') + (result ? `<br><b>${result}</b>` : ''), limits, source, go, kind});
  const trafficCalc = () => {
    const T = D.traffic, g = (l) => T.find((x) => x.label === l), fx = g('اینترنت ثابت'), mb = g('جمع سیار'), tot = g('جمع کل دیتای مصرفی'), o3 = ['همراه اول', 'ایرانسل', 'رایتل'].map(g);
    const sh = (r) => (r.international / (r.domestic + r.international)) * 100, eb = (v) => nf(v / 1e9, 2), od = o3.reduce((a, r) => a + r.domestic, 0), oi = o3.reduce((a, r) => a + r.international, 0);
    const ok = (a, b) => (Math.abs(a - b) / b < 1e-6 ? FT('برقرار ✓', 'holds ✓') : FT('برقرار نیست', 'does not hold'));
    return calcCard({
      title: FT('سهم ترافیک بین‌الملل چطور محاسبه شده؟', 'How is the international traffic share calculated?'),
      formula: FT('سهم بین‌الملل = ترافیک بین‌الملل ÷ (ترافیک داخلی + ترافیک بین‌الملل) × ۱۰۰. رادار فقط همین تقسیم را انجام می‌دهد؛ خودِ دو حجم را از کاربرگ پایش می‌خواند.', 'International share = international traffic ÷ (domestic + international) × 100. The radar only performs this division; the two volumes themselves are read from the monitoring sheet.'),
      inputs: T.map((r) => [esc(r.label), `${FT('داخلی', 'domestic')} ${F.i(Math.round(r.domestic))} · ${FT('بین‌الملل', 'intl')} ${F.i(Math.round(r.international))} GB`, FT(`ردیف ${F.i(r.row)} کاربرگ «Monitoring سه‌ماهه دوم ۱۴۰۵»`, `row ${r.row} of the “Monitoring Q2 1405” sheet`)]),
      steps: [FT(`اینترنت ثابت: ${F.i(Math.round(fx.international))} ÷ (${F.i(Math.round(fx.domestic))} + ${F.i(Math.round(fx.international))}) = ${nf(sh(fx), 2)}٪ (${eb(fx.international)} از ${eb(fx.domestic + fx.international)} اگزابایت)`, `Fixed: ${F.i(Math.round(fx.international))} ÷ (${F.i(Math.round(fx.domestic))} + ${F.i(Math.round(fx.international))}) = ${nf(sh(fx), 2)}%`),
        FT(`جمع سیار: ${nf(sh(mb), 2)}٪؛ جمع کل: ${nf(sh(tot), 2)}٪ (همان ۶۱٫۹٪ کاربرگ)`, `Mobile total: ${nf(sh(mb), 2)}%; grand total: ${nf(sh(tot), 2)}% (the sheet’s 61.9%)`),
        FT('واحد کاربرگ گیگابایت است؛ هر ۱ اگزابایت = ۱٬۰۰۰٬۰۰۰٬۰۰۰ گیگابایت و جدول با همین تبدیل به EB نمایش داده می‌شود.', 'The sheet’s unit is GB; 1 EB = 1,000,000,000 GB and the table converts with that factor.')],
      result: '',
      checks: [[FT('مجموع داخلی سه اپراتور = ردیف «جمع سیار»', 'Sum of the three operators’ domestic = the mobile total row'), ok(od, mb.domestic)], [FT('مجموع بین‌الملل سه اپراتور = ردیف «جمع سیار»', 'Sum of the three operators’ international = the mobile total row'), ok(oi, mb.international)], [FT('ثابت + جمع سیار = جمع کل (داخلی)', 'Fixed + mobile = grand total (domestic)'), ok(fx.domestic + mb.domestic, tot.domestic)], [FT('ثابت + جمع سیار = جمع کل (بین‌الملل)', 'Fixed + mobile = grand total (international)'), ok(fx.international + mb.international, tot.international)]],
      limits: FT('درستی خود حجم‌ها را رادار نمی‌تواند بسنجد: فقط جمع‌ها بازبینی می‌شوند. تعریف «بین‌الملل» (مقصد خارجی یا مبدأ خارجی) و روش شمارش در کاربرگ نیست. کاربرگ ارسالی است و تأیید مستقل نشده.', 'The radar cannot test the volumes themselves; only the sums are checked. The definition of “international” (foreign destination or origin) and the counting method are not in the sheet. The sheet is user-supplied and not independently confirmed.'),
      source: FT('کاربرگ «Monitoring سه ماهه دوم ۱۴۰۵»، ردیف‌های ۵ تا ۱۰.', 'Sheet “Monitoring Q2 1405”, rows 5 to 10.'), go: ['traffic', 'ترافیک', 'Traffic'], kind: 'calcTraffic'});
  };
  const perSubCalc = () => {
    const g = (l) => D.traffic.find((x) => x.label === l), fx = g('اینترنت ثابت'), mb = g('جمع سیار'), sf = kvv('CRA57-FIXBB-1405'), sm = kvv('CRA57-MOBB-1405');
    const vf = (fx.domestic + fx.international) / sf / 3, vm = (mb.domestic + mb.international) / sm / 3;
    return calcCard({
      title: FT('مصرف ماهانه‌ی هر مشترک چطور محاسبه شده؟', 'How is the monthly use per subscriber calculated?'),
      formula: FT('مصرف ماهانه = ترافیک کل فصل (گیگابایت) ÷ تعداد مشترک ÷ ۳.', 'Monthly use = total quarter traffic (GB) ÷ number of subscriptions ÷ 3.'),
      inputs: [[FT('ترافیک ثابت (داخلی + بین‌الملل)', 'Fixed traffic (domestic + international)'), F.i(Math.round(fx.domestic + fx.international)) + ' GB', FT('کاربرگ پایش، ردیف ۵', 'monitoring sheet, row 5')], [FT('مشترک ثابت', 'Fixed subscriptions'), F.i(sf), 'CRA57-FIXBB-1405'], [FT('ترافیک سیار', 'Mobile traffic'), F.i(Math.round(mb.domestic + mb.international)) + ' GB', FT('کاربرگ پایش، ردیف ۹', 'monitoring sheet, row 9')], [FT('مشترک پهن‌باند سیار', 'Mobile broadband subscriptions'), F.i(sm), 'CRA57-MOBB-1405']],
      steps: [FT(`ثابت: ${F.i(Math.round(fx.domestic + fx.international))} ÷ ${F.i(sf)} ÷ 3 = ${nf(vf)} گیگابایت`, `Fixed: ${F.i(Math.round(fx.domestic + fx.international))} ÷ ${F.i(sf)} ÷ 3 = ${nf(vf)} GB`), FT(`سیار: ${F.i(Math.round(mb.domestic + mb.international))} ÷ ${F.i(sm)} ÷ 3 = ${nf(vm)} گیگابایت`, `Mobile: ${F.i(Math.round(mb.domestic + mb.international))} ÷ ${F.i(sm)} ÷ 3 = ${nf(vm)} GB`)],
      limits: FT('ناهم‌دوره: ترافیک تابستان ۱۴۰۵ (فصل ۲) است ولی تعداد مشترک بهار ۱۴۰۵ (فصل ۱)؛ پس عدد تقریبی است. مخرج «مشترک» است نه کاربر یکتا، و سیم‌کارت‌های چندگانه مصرف هر کاربر را کم‌نما می‌کنند.', 'The periods differ: traffic is summer 1405 (Q2) while subscriptions are spring 1405 (Q1), so the figure is approximate. The denominator is subscriptions, not unique users, and multiple SIMs understate per-user use.'),
      source: FT('کاربرگ پایش؛ فصلنامه آماری ۵۷.', 'Monitoring sheet; regulator quarterly no. 57.'), go: ['traffic', 'ترافیک', 'Traffic'], kind: 'calcPerSub'});
  };
  const ninIndicatorCalc = (code) => {
    const i = NIN.inds.find((x) => x.code === code), ys = ['1402', '1403', '1404', '1405'], fm = (y) => (i.formula && i.formula[y]) || null, pr = (y) => (i.params && i.params[y]) || null;
    const uf = [...new Set(ys.map(fm).filter(Boolean))], y0 = ys.slice().reverse().find((y) => fm(y)), pu = [...new Set(ys.map(pr).filter(Boolean))];
    return calcCard({
      title: FT(`شاخص ${F.i(code)}: فرمول در خود فایل`, `Indicator ${code}: the formula in the file itself`),
      formula: uf.length ? uf.map((f) => `<span class="mono">${esc(f)}</span>`).join(FT(' ← (در سال دیگر) ', ' ← (another year) ')) : FT('فرمول در فایل برای این شاخص ثبت نشده', 'no formula is recorded in the file for this indicator'),
      inputs: [[FT('عنوان', 'Title'), esc(i.title), `${FT('هدف', 'goal')} ${F.i(i.goal)}`], [FT('تعریف متغیرها', 'Variable definitions'), esc(pu.length ? pu[pu.length - 1] : '—'), FT(`سال ${y0 || ''}`, `year ${y0 || ''}`)], ...ys.map((y) => [yf(y), `${i.perf[y] == null ? '—' : nf(i.perf[y], 2)} · ${FT('وزن', 'weight')} ${wOf(i, y) == null ? '—' : nf(wOf(i, y), 2)}`, esc((i.perf_cell && i.perf_cell[y] && i.perf_cell[y].ref) || '')])],
      steps: [FT('نتیجه‌ی فرمول، «درصد تحقق» شاخص است و وزن آن در هدف می‌نشیند: پیشرفت هدف = Σ (وزن شاخص × تحقق شاخص).', 'The result of the formula is the indicator’s achievement percentage, which enters the goal with its weight: goal progress = Σ (indicator weight × indicator achievement).')],
      limits: FT('خودِ فایل مقدار متغیرها (A، B، C …) را نمی‌دهد؛ فقط تعریف و فرمول را دارد. پس رادار می‌تواند فرمول و ساختار را توضیح دهد، نه اینکه ورودی‌ها را دوباره محاسبه کند. اگر تعریف سال‌ها فرق کند (مثلاً تغییر مخرج)، مقایسه‌ی سال‌ها مجاز نیست.', 'The file does not give the variable values (A, B, C …), only definitions and formula, so the radar can explain the formula and structure but cannot recompute the inputs. If the definition changes between years (for example the denominator), year-to-year comparison is not permitted.'),
      source: FT('NIN.1405.07.xlsx؛ ستون فرمول و تعریف متغیر.', 'NIN.1405.07.xlsx; formula and variable-definition columns.'), go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'calcInd'});
  };
  const ninGoalCalc = (no) => {
    const g = NIN.byNo[no], Y = NIN.LAST, L = NIN.inds.filter((i) => i.goal === no), rows = L.map((i) => ({i, w: wOf(i, Y), p: i.perf[Y]})), sw = rows.reduce((a, r) => a + (r.w || 0), 0), rec = rows.reduce((a, r) => a + (r.w || 0) * (r.p == null ? 0 : r.p), 0) / (sw || 1);
    return calcCard({
      title: FT(`پیشرفت هدف ${F.i(no)} چطور محاسبه می‌شود؟`, `How is the progress of goal ${no} calculated?`),
      formula: FT('پیشرفت هدف = Σ (وزن شاخص × تحقق شاخص) ÷ Σ وزن‌ها. وزن‌های یک هدف باید جمعشان ۱ باشد.', 'Goal progress = Σ (indicator weight × indicator achievement) ÷ Σ weights. The weights of a goal should add up to 1.'),
      inputs: rows.map((r) => [`<b>${F.i(r.i.code)}</b> ${esc(String(r.i.title).slice(0, 60))}`, `${FT('وزن', 'weight')} ${r.w == null ? '—' : nf(r.w, 2)} × ${FT('تحقق', 'achievement')} ${r.p == null ? '—' : nf(r.p, 2)} = ${nf((r.w || 0) * (r.p || 0), 2)}`, esc((r.i.perf_cell && r.i.perf_cell[Y] && r.i.perf_cell[Y].ref) || '')]),
      steps: [FT(`جمع وزن‌ها = ${nf(sw, 2)}؛ بازمحاسبه = ${nf(rec, 2)}٪؛ گزارش‌شده در فایل = ${nf(g.progress[Y], 2)}٪.`, `Sum of weights = ${nf(sw, 2)}; recomputed = ${nf(rec, 2)}%; reported in the file = ${nf(g.progress[Y], 2)}%.`)],
      result: Math.abs(rec - g.progress[Y]) < 0.05 ? FT('بازمحاسبه با عدد گزارش‌شده می‌خواند.', 'The recomputation matches the reported figure.') : FT(`اختلاف ${nf(Math.abs(rec - g.progress[Y]), 2)} واحد با عدد گزارش‌شده؛ علت‌های شناخته‌شده: سلول متنی که صفر شمرده می‌شود (تحلیل «سلول متنی»).`, `${nf(Math.abs(rec - g.progress[Y]), 2)} points apart from the reported figure; known cause: text cells counted as zero (see the text-cell analysis).`),
      limits: FT('خانه‌ی خالی در این بازمحاسبه صفر نیست بلکه صفر شمرده شده تا با رفتار فایل برابر باشد؛ برای شاخص بدون مقدار این فرض لازم است.', 'An empty cell is treated as zero here to match the file’s behaviour; that assumption is needed for an indicator without a value.'),
      source: FT('NIN.1405.07.xlsx؛ وزن و عملکرد شاخص‌ها.', 'NIN.1405.07.xlsx; indicator weights and performance.'), go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'calcGoal'});
  };
  const ninOverallCalc = () => {
    const Y = NIN.LAST, t3 = NIN.issueOf3 && NIN.issueOf3(Y), ax = NIN.S.axes, G = NIN.S.goals.filter((g) => g.progress[Y] != null);
    const axw = ax.reduce((a, x) => a + (x.weight / 100) * x.progress[Y], 0), tw = G.reduce((a, g) => a + g.gweight, 0), gw = G.reduce((a, g) => a + g.gweight * g.progress[Y], 0) / tw, ir = G.reduce((a, g) => a + g.gweight * (g.recomputed ? g.recomputed[Y] : g.progress[Y]), 0) / tw;
    const tick = (v, t) => (t != null && Math.abs(v - t) < 0.02 ? FT('✓ با فایل برابر', '✓ equals the file') : FT('با فایل برابر نیست', 'does not equal the file'));
    return calcCard({
      title: FT(`عدد کل ${yf(Y)} چطور محاسبه می‌شود؟ سه روش، سه عدد`, `How is the ${Y} overall figure calculated? Three methods, three numbers`),
      formula: FT('(۱) جمع وزنی محورها = Σ (وزن محور ÷ ۱۰۰ × پیشرفت محور)؛ (۲) جمع وزنی اهداف = Σ (وزن هدف × پیشرفت هدف) ÷ Σ وزن اهداف؛ (۳) بازسازی از شاخص‌ها = همان (۲) ولی با پیشرفت هدفِ بازمحاسبه‌شده از شاخص‌ها.', '(1) weighted axes = Σ (axis weight ÷ 100 × axis progress); (2) weighted goals = Σ (goal weight × goal progress) ÷ Σ goal weights; (3) rebuild from indicators = (2) with goal progress recomputed from the indicators.'),
      inputs: [[FT('گزارش‌شده در فایل', 'Reported in the file'), nf(NIN.S.overall[Y].value, 2), esc(NIN.S.overall[Y].cell || '')], ...ax.map((x) => [esc(FT(x.title, 'Axis ' + x.no)), `${FT('وزن', 'weight')} ${nf(x.weight)} × ${nf(x.progress[Y], 2)}`, esc(x.cell && x.cell[Y] ? x.cell[Y] : '')])],
      steps: [FT(`(۱) ${nf(axw, 2)}  (۲) ${nf(gw, 2)}  (۳) ${nf(ir, 2)}`, `(1) ${nf(axw, 2)}  (2) ${nf(gw, 2)}  (3) ${nf(ir, 2)}`)],
      checks: [[FT('(۱) در برابر گزارش‌شده', '(1) against reported'), tick(axw, NIN.S.overall[Y].value)], [FT('(۲) در برابر «جمع وزنی اهداف» فایل', '(2) against the file’s weighted goals'), tick(gw, t3 && t3.goals_weighted)], [FT('(۳) در برابر «بازسازی از شاخص‌ها»', '(3) against the rebuild'), tick(ir, t3 && t3.indicators_rebuild)]],
      limits: FT('فایل روش تجمیع را نمی‌گوید؛ این‌که عدد گزارش‌شده با روش (۱) برابر است یافته‌ی رادار است و گواه آن را برابر بودن عددی است، نه یک سند. تا متولی روش را تأیید نکند، مقایسه‌ی عدد کل با سال‌های پیش بدون این توضیح مجاز نیست.', 'The file does not state the aggregation method; that the reported figure equals method (1) is the radar’s finding, evidenced by numerical equality and not by a document. Until the owner confirms the method, comparing the overall figure with earlier years without this note is not permitted.'),
      source: FT('NIN.1405.07.xlsx؛ کاربرگ پیشرفت محورها و اهداف.', 'NIN.1405.07.xlsx; axis and goal progress sheets.'), go: ['nin', 'پایش اهداف شبکه ملی', 'NIN goals monitor'], kind: 'calcOverall'});
  };
  const CALCW = /(چطور|چگونه|محاسبه|حساب|فرمول|منطق|روش|how|calculat|formula|computed|derive)/;
  const calcRoute = (q) => {
    if (!CALCW.test(q) || /(استان|province)/.test(q)) return null;
    const code = (fa2en(q).match(/(?<!\d)(\d{3})(?!\d)/g) || []).find((c) => NIN.inds.some((i) => i.code === c));
    if (code) return ninIndicatorCalc(code);
    const gn = (fa2en(q).match(/(?:هدف|goal)\s*(\d{1,2})/) || [])[1];
    if (gn && NIN.byNo[+gn]) return ninGoalCalc(+gn);
    if (/(پیشرفت کل|عدد کل|overall)/.test(q) && /(نین|شبکه ملی|nin|پیشرفت)/.test(q)) return ninOverallCalc();
    if (/(مصرف ماهانه|هر مشترک|per sub|monthly (use|consumption))/.test(q)) return perSubCalc();
    if (/(ترافیک|traffic)/.test(q) && /(خارجی|بین ?الملل|international|external|foreign|داخلی|domestic)/.test(q)) return trafficCalc();
    return null;
  };

  /* ===== routing ===== */
  const RX = [
    ['whatIf', /((ترافیک|traffic).*(داخلی|domestic)|(داخلی|domestic).*(ترافیک|traffic))/, /(اگر|چه می ?شود|what if|\bif\b|سناریو)/, /(استان|province)/],
    ['ownerQs', /(برگه .*پرسش|پرسش(ها)?ی? .*متولی|سوال(ها)?ی? .*متولی|متولی .*(بپرس|پرسش|سوال)|owner questions?|questions? (for|to) (the )?owners?|(ask|question).*owners?)/],
    ['indDict', /(فرهنگ .*شاخص|شاخص .*(نشانه|پرچم)|indicator (dictionary|glossary|flags?))/, null, /(استان|province)/],
    ['planGap', /(طرح کلان|سند طرح|خود ?اظهاری|self.?assess|master plan|triangulat|آستانه .*(طرح|هدف)|plan threshold)/, /(اندازه|مقایسه|در برابر|سازگار|تطبیق|measure|compare|against|consisten|contradict|فاصله)/, /(استان|province)/],
    ['ninAudit', /(ممیزی|audit|وزن صفر|zero.?weight|بی ?وزن|اعداد گرد|round number|heaping|سقف ۱۰۰|سقف 100|ceiling|نوسان .*شاخص|جهش .*شاخص|شاخص .*(جهش|نوسان))/, null, /(استان|province)/],
    ['deadline', /(افق ۱۴۰۴|افق 1404|1404 horizon|horizon|تمام نشده|ناتمام|unfinished|عقب ?ماند|بیشترین فاصله|اولویت .*اهداف|کدام اهداف .*(مانده|عقب))/, null, /(استان|province)/],
    ['ninAxes', /(شبکه ملی|nin|اهداف|پیشرفت کل|overall progress)/, /(محور|axis|axes|waterfall|آبشار)/, /(هدف \d|شاخص \d{3}|goal \d)/],
    ['ninArtifacts', /(سلول متنی|text cell|سه عدد کل|three totals|100\/00|هدف \d{1,2} .*(چرا|افت|کم شد|از \d+ به)|شاخص \d{3} .*(مشکل|چرا|خطا|صفر)|goal \d+ .*(why|drop|fall))/],
    ['fiber', /(فیبر|fiber|fibre|fttx|ftth|xdsl|adsl)/, /(جبران|جایگزین|ریزش|تبدیل|بهره برداری|take up|take-up|takeup|conversion|offset|substitut|گذرداده|homes passed|پوشش .*(اشتراک|اتصال)|اشتراک .*پوشش|بالا رفته ولی)/, /(پورت|port|استان|province)/],
    ['ports', /(پورت|port)/, /(بی مصرف|بیکار|خالی|idle|بهره برداری|utili[sz]ation|عقب|متمرکز|concentrat|ظرفیت)/],
    ['hhi', /(اپراتور|موبایل|همراه|سیار|mobile|operator|mci|irancell|rightel|رایتل|ایرانسل|ثابت|adsl|شرکت|بازار اینترنت|market)/, /(تمرکز|hhi|concentrat|انحصار|سهم بازار|market share|رقابت|competition|کوچک می)/, /(گوشی|سیستم عامل|os |سکو|پیام ?رسان)/],
    ['rtt', /(تاخیر|rtt|latency|delay)/, /(وزن|weighted|تجربه واقعی|تجربه موثر|effective|ترافیک)/],
    ['speed', /(توزیع .*(باند|سرعت)|باند .*سرعت|سرعت واقعی .*(فیبر|adsl)|فیبر .*adsl|speed (band|distribution)|nominal speed)/],
    ['opsGrowth', /(کدام اپراتور .*رشد|رشد .*اپراتور|operator growth|growth .*operator)/],
    ['fiveG', /(5g|نسل پنج)/, /(استفاده|موثر|اشتراک|رسیده|adoption|usage|take up|subscri)/],
    ['tic', /(روند .*(تاخیر|rtt)|tic |تبادل منطقه|regional exchange|ملی .*تاخیر|national (rtt|latency|delay))/],
    ['trust', /(قابل اعتماد|اعتماد .*داده|data quality|reliab|اعتبار داده)/, null, /(اهداف|شبکه ملی|nin|فایل)/],
    ['gaps', /(چه داده.*(کم|نداریم|نیاز|غایب)|what data .*missing|data gaps?|کمبود داده)/],
  ];
  const HANDLER = {whatIf, ownerQs: ownerQuestions, indDict, planGap, ninAudit, deadline, ninAxes, ninArtifacts, fiber, ports, hhi, rtt, speed, opsGrowth, fiveG, tic, trust, gaps};
  const hits = (q, raw) => {
    const t = q + ' ' + String(raw || '').toLowerCase();
    return RX.find(([, a, b, no]) => a.test(t) && (!b || b.test(t)) && !(no && no.test(t)));
  };
  const route = (q, raw, ctx) => {
    { const c = calcRoute(q + ' ' + String(raw || '').toLowerCase()); if (c) return c; }
    const h = AI.findProvs(q).length && /gaps/.test((hits(q, raw) || [])[0] || '') ? null : hits(q, raw);
    if (h) { const r = HANDLER[h[0]](q, raw); if (r) return r; }
    return null;
  };
  /* a handler that returned a table but no chart gets one built from the table's first numeric column */
  const num = (s) => { const t = fa2en(String(s)).replace(/[٫]/g, '.').replace(/[٬,]/g, '').replace(/[−–]/g, '-'); const m = t.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*[٪%]?\s*$/); return m ? +m[1] : null; };
  const autoViz = (html) => {
    if (/<svg class="aiviz"/.test(html) || typeof DOMParser === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html'), t = doc.querySelector('table');
    if (!t) return html;
    const rows = [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim()));
    if (rows.length < 2 || !rows[0] || rows[0].length < 2) return html;
    for (let c = rows[0].length - 1; c >= 1; c--) {
      const vals = rows.map((r) => num(r[c]));
      if (vals.filter((v) => v != null).length >= Math.max(2, Math.ceil(rows.length * 0.6)) && vals.some((v) => v > 0)) {
        const head = [...t.querySelectorAll('thead th')][c], items = rows.map((r, i) => ({t: (r.slice(0, c).find((x) => x && num(x) == null) || r[0]).slice(0, 30), v: vals[i], fmt: (v) => (/٪|%/.test(r[c]) ? nf(v) + '٪' : F.n(v))})).filter((x) => x.v != null && x.v >= 0);
        if (items.length >= 2) { const svg = AIVIZ.bars(items.slice(0, 10), {label: head ? head.textContent : ''}); const at = html.indexOf('<table'); return html.slice(0, at) + `<p class="mut">${esc(head ? head.textContent : '')}</p>` + svg + html.slice(at); }
        break;
      }
    }
    return html;
  };
  const wrap = () => {
    const r0 = AI.route;
    AI.route = (raw, ctx) => {
      const q = norm(raw);
      let r = null;
      if (q && !AI.isFollowAnalysis(q)) { try { r = route(q, raw, ctx); } catch (e) { r = null; } }
      if (!r) r = r0(raw, ctx);
      if (r && /[a-z]{3}/i.test(raw) && !/[آ-ی]/.test(raw) && /داده‌ای برای پاسخ|نزدیک‌ترین رکوردها|را ندارم/.test((r.h || '') + String(r.b || '').slice(0, 200))) {
        const tr = {tehran: 'تهران', fars: 'فارس', isfahan: 'اصفهان', khorasan: 'خراسان رضوی', international: 'بین الملل', domestic: 'داخلی', traffic: 'ترافیک', share: 'سهم', centre: 'مرکز', center: 'مرکز', data: 'داده', capacity: 'ظرفیت', compare: 'مقایسه', weak: 'ضعیف', indicators: 'شاخص', coverage: 'پوشش', speed: 'سرعت', subscribers: 'مشترک', latency: 'تاخیر', outage: 'قطعی', incidents: 'رخداد', ipv6: 'ipv6', cloud: 'ابر', and: ' '};
        const fa = q.split(' ').map((w) => tr[w] || '').filter(Boolean).join(' ');
        if (fa) { try { const r2 = r0(fa, ctx); if (r2 && !/داده‌ای برای پاسخ|نزدیک‌ترین رکوردها|را ندارم/.test(r2.h || '')) r = r2; } catch (e) {} }
      }
      if (q && r && !/موضوع تحلیل را/.test(r.h || '') && /نزدیک‌ترین رکوردها|داده‌ای برای پاسخ|را ندارم|موضوع تحلیل را|nearest records|no data/i.test((r.h || '') + String(r.b || '').slice(0, 200))) { try { let g = null; if (typeof NINQ === 'function' && Object.values(NIN.KEYS).some((ks) => ks.some((k) => k.length > 3 && q.includes(norm(k))))) g = NINQ(q + ' هدف', raw + ' هدف', ctx || {}); r = g || topicBrief(q, raw) || r; } catch (e) {} }
      if (r && r.b) r.b = autoViz(r.b);
      return r;
    };
  };
  wrap();
  return {route, hits, HANDLER, autoViz, topicBrief};
})();
