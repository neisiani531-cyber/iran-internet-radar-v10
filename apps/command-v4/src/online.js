/* ===== v4.6 online monitoring: what changed, since when, who confirms =====
   Server side: DETECT_V1 (apps/api/app/online/detect.py) judges every series against its own baseline and builds incidents.
   This page shows that judgement. It never says "healthy": "no signal" means the rules saw no change in the sources that were fresh enough.
   Offline (no server), nothing live is shown or simulated; the cyber register is curated documentation and is shown in both modes. */
const CYBER = window.RADAR_CYBER || {incidents: [], evidence_levels: {}};
const ON = {
  STATE: {alert: ['هشدار', C.red], watch: ['زیر نظر', C.amber], normal: ['بدون نشانه', C.teal], insufficient: ['داده ناکافی', C.dim], stale: ['کهنه', C.dim], gap: ['شکاف داده', C.dim]},
  LAYER: {alert: ['اختلال محتمل', C.red], watch: ['زیر نظر', C.amber], quiet: ['نشانه‌ای دیده نشد', C.teal], unknown: ['داده کافی نیست', C.dim]},
  SEV: {critical: ['بحرانی', C.red], high: ['بالا', '#ff8a3d'], medium: ['متوسط', C.amber], low: ['پایین', C.ice]},
  EVL: {claimed: ['ادعای مهاجم', C.amber], victim_confirmed: ['تأیید قربانی/مقام رسمی', C.ice], independent: ['تحلیل فنی مستقل', C.teal]},
  SCOPES: ['IR', 'AS12880', 'AS58224', 'AS197207', 'AS44244', 'AS57218'],
  SCOPE_FA: {IR: 'کل کشور', AS12880: 'زیرساخت · AS12880', AS58224: 'مخابرات · AS58224', AS197207: 'همراه اول · AS197207', AS44244: 'ایرانسل · AS44244', AS57218: 'رایتل · AS57218'},
  COLS: [['ioda', 'bgp.visible_slash24', 'BGP'], ['ioda', 'ping-slash24.up_slash24', 'پینگ /24'], ['ioda', 'merit-nt.unique_source_ips', 'تلسکوپ'],
    ['ooni', 'web_connectivity.anomaly_rate', 'OONI وب'], ['ooni', 'telegram.anomaly_rate', 'تلگرام'], ['ooni', 'whatsapp.anomaly_rate', 'واتس‌اپ'],
    ['tor', 'relay_users', 'Tor مستقیم'], ['tor', 'bridge_users', 'Tor پل'], ['ripestat', 'routed_asns', 'ASN مسیریابی‌شده'], ['atlas', 'connected_probes', 'پروب Atlas']],
  SEC: [['cf_attacks', 'l3.target_ir', 'DDoS لایه ۳ با مقصد ایران', C.red], ['cf_attacks', 'l3.origin_ir', 'DDoS لایه ۳ با مبدأ IP ایرانی', C.amber], ['cf_attacks', 'l7.origin_ir', 'حمله لایه ۷ با مبدأ IP ایرانی', C.violet]],
  pct: (c) => (c == null ? '—' : Math.abs(c) < 0.005 ? '۰٪' : (c > 0 ? '+' : '−') + F.i(Math.abs(c) * 100) + '٪'),
  fa: (s) => String(s == null ? '' : s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]),
  srcName: (id) => (ONLINE_SOURCES.find((s) => s.id === id) || {n: id}).n,
  ago: (iso) => { if (!iso) return '—'; const s = (Date.now() - new Date(iso)) / 1000; return s < 3600 ? F.i(Math.max(1, s / 60)) + ' دقیقه پیش' : s < 172800 ? F.i(s / 3600) + ' ساعت پیش' : F.i(s / 86400) + ' روز پیش'; },
  dur: (a, b) => { const s = ((b ? new Date(b) : Date.now()) - new Date(a)) / 1000; return s < 3600 ? F.i(s / 60) + ' دقیقه' : s < 172800 ? F.i(s / 3600) + ' ساعت' : F.i(s / 86400) + ' روز'; },
};
ONLINE_SOURCES.forEach((s) => { if (s.id === 'arvan') Object.assign(s, {status: 'needs_permit', what: 'آزمون دسترسی از درون ایران به تفکیک ISP و سرویس (تنها نقطه دید داخلی)', note: 'API عمومی مستند ندارد و endpoint داخلی سایت پشت محافظ ربات است؛ دور زده نمی‌شود. راه درست: درخواست دسترسی رسمی از آروان'}); });
if (!ONLINE_SOURCES.some((s) => s.id === 'cf_attacks')) {
  ONLINE_SOURCES.splice(5, 0, {id: 'cf_attacks', n: 'Cloudflare Radar · حملات', what: 'حملات DDoS لایه ۳ با مقصد و مبدأ ایران، حملات لایه ۷ با مبدأ ایران، سهم ایران میان مقصدهای لایه ۷', ep: 'api.cloudflare.com/client/v4/radar/attacks/layer3|layer7/…', auth: 'توکن API (همان توکن Radar)', freq: '۱ ساعت', status: 'needs_key', note: 'مسیرها و ساختار پاسخ از OpenAPI منتشرشده Cloudflare احراز شد. مقدارها نرمال‌شده‌اند و فقط درون یک پاسخ مقایسه‌پذیرند'});
  ONLINE_SOURCES.splice(9, 0, {id: 'shadowserver', n: 'Shadowserver', what: 'هانی‌پات، DDoS تقویتی علیه اهداف کشور، دستگاه آلوده و آسیب‌پذیر', ep: '—', auth: 'استعلام', freq: '—', status: 'needs_permit', note: 'API و شرایط استفاده مجدد داده داشبورد باید از Shadowserver استعلام شود'});
}

V.online = {
  title: 'پایش آنلاین', code: 'ONLINE',
  html: () => {
    const on = !!API.base();
    const card = (k, n, sub) => `<div class="on-tr"><div class="on-tr-h"><b>${n}</b><small>${sub}</small></div><div class="ch" id="onTrend-${k}">${on ? '<div class="empty-state loading"><span class="spin"></span>در حال دریافت…</div>' : '<div class="empty-state">داده زنده در این فایل نیست</div>'}</div></div>`;
    return `<div class="on-hero"><div><div class="code">ONLINE · DETECT_V1</div><h2>پایش آنلاین</h2><p>اتصال، اختلال و حملات؛ هر سنجه با گذشته خودش سنجیده می‌شود.</p></div>
    <div class="on-bar"><span class="chip ${on ? '' : 'amb'}"><i></i>${on ? 'سرور: ' + esc(API.base()) : 'فایل آفلاین · بدون داده زنده'}</span>${on ? `<span id="onUpdated" class="on-upd" role="status">در حال دریافت…</span><button class="go" id="onRefresh" type="button">↻ تازه‌سازی</button><label class="on-auto"><input type="checkbox" id="onAuto" ${ON.autoOn() ? 'checked' : ''}> هر ۶۰ ثانیه</label>` : '<button class="go" id="onSetServer" type="button">تنظیم نشانی سرور</button>'}</div></div>
    <div class="on-strip" data-pid="now"><div id="onNow" class="on-now"></div><div class="on-cell"><b>گردآوری</b><div id="onColl"></div></div></div>
    <div class="g on-g">
      <section class="p c12 on-trends" data-pid="trends"><header><h3>روندهای اصلی دسترسی · کل کشور</h3><span class="k">TRENDS</span></header><div class="on-trs">${card('bgp', 'BGP', 'بلوک‌های /24 قابل‌مشاهده')}${card('ping', 'پینگ فعال', 'بلوک‌های /24 پاسخ‌دهنده')}${card('ooni', 'OONI وب', 'نرخ ناهنجاری روزانه')}</div><p class="lead on-note">خط‌چین خط مبنای همان سنجه است. نقطه خالی یعنی داده نرسیده، نه صفر.</p></section>
      <section class="p c7 on-incp" data-pid="incidents"><header><h3>رخدادهای باز</h3><span class="k">INCIDENTS</span></header><div id="onInc" class="on-scroll"></div></section>
      ${panel('c5 on-mapp', 'CHANGE MAP', 'نقشه تغییر: دامنه × سیگنال', 'تغییر آخرین مقدار نسبت به خط مبنا؛ رنگ، وضعیت قاعده است. روی خانه بزنید.', `<div class="ch" id="onMap"></div><div class="legend">${Object.entries(ON.STATE).filter(([k]) => k !== 'stale' && k !== 'gap').map(([, [n, c]]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}<span><i style="background:var(--line2)"></i>کهنه یا شکاف</span></div><div id="onSeries"></div>`)}
      ${panel('c7 on-secp', 'SECURITY · ATTACKS', 'امنیت و حملات (Cloudflare Radar)', 'فقط ترافیک شبکه Cloudflare؛ هر سری در مقیاس نرمال‌شده همان پاسخ. مقصد یعنی محل صورتحساب سایت هدف و مبدأ یعنی محل IP مهاجم.', `<div id="onSec" class="on-scroll"></div>`)}
      ${panel('c5 on-regp', 'CYBER REGISTER · ' + CYBER.incidents.length, 'رجیستر رخدادهای سایبری گزارش‌شده', 'رخدادهای عمومی با سطح شاهد جدا؛ ادعای مهاجم تأیید نیست. فهرست کامل نیست.', `<div class="ch" id="onRegT"></div><div id="onReg" class="on-scroll"></div>`, '<span class="badge calc">مستندسازی دستی · نه پایش زنده</span>')}
      <details class="p c12 on-more" data-pid="more" id="onMore"><summary><h3>روش داوری، منابع و داده خام</h3><span class="k">METHOD · SOURCES · RAW</span></summary>
        <div class="on-method"><p>هر سری با خط مبنای خودش مقایسه می‌شود: IODA با همان ساعت در هفت روز قبل، OONI با نرخ ناهنجاری ۱۴ روز اخیر، Tor با میانه ۲۸ روز و حملات Cloudflare درون همان پاسخ. «بدون نشانه» یعنی قاعده‌ها تغییری ندیدند، نه اینکه شبکه سالم است. خطای گردآورنده اختلال اینترنت نیست و نقطه خالی صفر نیست. رخداد از هم‌زمانی سیگنال‌ها در یک دامنه ساخته می‌شود و شدتش از عمق تغییر، گستره و شمار نقاط دید مستقل می‌آید؛ رخداد نشانه است، نه حکم.</p></div>
        <h5 class="nd-h">منابع و گردآورنده‌ها</h5><div class="tbox on-scroll" id="onHealth"></div>
        <h5 class="nd-h">داده خام</h5><div class="tools">
        <label>بازه <select class="sel" id="onRange">${[['24h', '۲۴ ساعت'], ['7d', '۷ روز'], ['30d', '۳۰ روز']].map(([k, n]) => `<option value="${k}" ${STATE.onRange === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>منبع <select class="sel" id="onSrc"><option value="all">همه</option>${ONLINE_SOURCES.map((s) => `<option value="${s.id}" ${STATE.onSrc === s.id ? 'selected' : ''}>${esc(s.n)}</option>`).join('')}</select></label>
        <label>شبکه <select class="sel" id="onAsn"><option value="">کل کشور (IR)</option>${ON.SCOPES.slice(1).map((a) => `<option value="${a.slice(2)}" ${String(STATE.onAsn) === a.slice(2) ? 'selected' : ''}>${ON.SCOPE_FA[a]}</option>`).join('')}</select></label>
        <label>نقطه دید <select class="sel" id="onVp"><option value="">همه</option>${[['bgp', 'BGP'], ['ping-slash24', 'پینگ فعال'], ['merit-nt', 'تلسکوپ'], ['ooni-probe', 'پروب OONI'], ['cloudflare', 'Cloudflare']].map(([k, n]) => `<option value="${k}" ${STATE.onVp === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>مقصد <input class="search" id="onDst" placeholder="دامنه، مثلاً example.com" value="${esc(STATE.onDst)}" style="min-width:180px"></label></div>
        <h5 class="nd-h">رخدادهای اعلام‌شده منابع</h5><div class="ch" id="onTimeline"></div><h5 class="nd-h">سری‌ها</h5><div id="onSignals" class="on-sig"></div>
        <h5 class="nd-h">آرشیو Tor Metrics (ژوئن تا ژوئیه ۲۰۲۵) · آرشیوی، نه زنده</h5><p class="lead">کاربران تخمینی پل Tor از ایران؛ با کاربران مستقیم جمع نمی‌شود و شمار افراد یکتا نیست. بازپخش آشکارساز روی همین سری، جهش میانه خرداد و فروپاشی ۲۹ خرداد ۱۴۰۴ را «هشدار» می‌گیرد.</p><div class="ch" id="onTor"></div>
      </details>
    </div>`;
  },
  draw: async () => {
    if (STATE.onAsn && !/^\d{1,10}$/.test(String(STATE.onAsn))) { TOAST('شماره ASN نامعتبر در نشانی نادیده گرفته شد', 'warn'); STATE.onAsn = ''; $('#onAsn').value = ''; }
    const sync = () => { STATE.onRange = $('#onRange').value; STATE.onSrc = $('#onSrc').value; STATE.onAsn = $('#onAsn').value; STATE.onVp = $('#onVp').value; URLS.replace(true); V.online.draw(); };
    ['#onRange', '#onSrc', '#onAsn', '#onVp'].forEach((s) => $(s).onchange = sync);
    $('#onDst').oninput = (e) => { STATE.onDst = e.target.value; URLS.replace(); };
    $('#onDst').onchange = sync;
    ON.register();
    ON.wire();
    if ($('#onMore').open) ON.tor();
    const run = (V.online.run = (V.online.run || 0) + 1);
    const alive = () => STATE.view === 'online' && V.online.run === run && document.body.contains($('#onHealth'));
    let health = null, status = null, err = '', alerts = null;
    if (API.base()) {
      const t0 = Date.now(), tick = setInterval(() => { if (!alive()) return clearInterval(tick); const e = $('#onNow .loading b'); if (e) e.textContent = F.i(Math.round((Date.now() - t0) / 1000)); }, 1000);
      if (!ON.refreshQuiet) $('#onNow').innerHTML = '<div class="empty-state loading"><span class="spin"></span>در حال دریافت داوری از سرور… <b>۰</b> ثانیه (حداکثر ۱۵)</div>';
      if (!ON.refreshQuiet) ['#onHealth', '#onInc', '#onMap', '#onSec', '#onColl'].forEach((s) => { $(s).innerHTML = '<div class="empty-state loading"><span class="spin"></span>در حال دریافت…</div>'; });
      if (!ON.refreshQuiet) $('#onTimeline').innerHTML = $('#onSignals').innerHTML = '<div class="empty-state loading"><span class="spin"></span>در حال دریافت…</div>';
      try { health = await API.get('/api/v1/online/sources'); } catch (e) { err = String(e.message || e); }
      if (!err) { try { status = await API.get('/api/v1/online/status'); } catch (e) { status = {error: String(e.message || e)}; } }
      if (!err) { try { alerts = await API.get('/api/v1/online/alerts?limit=8'); } catch (e) { alerts = null; } }
      clearInterval(tick);
      if (!alive()) return;
    }
    ON.health(health, err);
    ON.coll(health, err);
    ON.now(status, err);
    ON.incidents(status, alerts, err);
    ON.map(status, err);
    await Promise.all([ON.trends(status, err, alive), ON.security(status, err, alive)]);
    if (!alive()) return;
    if ($('#onUpdated')) $('#onUpdated').textContent = err || !status || status.error ? 'دریافت کامل نشد؛ وضعیت نامشخص است' : 'به‌روزرسانی: ' + new Intl.DateTimeFormat('fa-IR', {hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Tehran'}).format(new Date());
    if ($('#onMore').open) await ON.raw(err, alive);
    else if (!ON.refreshQuiet) ['#onTimeline', '#onSignals'].forEach((x) => ON.empty($(x), 'برای رسم داده خام، این بخش را باز کنید.'));
  },
};

ON.empty = (el, m) => { el.innerHTML = `<div class="empty-state">${m}</div>`; };
ON.offline = 'این فایل به سرور رادار وصل نیست؛ داده زنده‌ای نمایش داده یا شبیه‌سازی نمی‌شود. نشانی سرور را در تنظیمات دستیار وارد کنید.';

ON.now = (status, err) => {
  const el = $('#onNow');
  if (!API.base()) {
    el.innerHTML = ['access', 'security'].map((l) => `<div class="on-layer" style="--c:${C.dim}"><div class="ol-h"><b>${l === 'access' ? 'دسترسی و اختلال' : 'امنیت و حملات'}</b><span class="ol-st">داوری ممکن نیست</span></div><p>سرور تنظیم نشده؛ داده زنده نمایش داده یا شبیه‌سازی نمی‌شود.</p></div>`).join('');
    return;
  }
  if (err || !status || status.error) { el.innerHTML = `<div class="empty-state"><span class="er">داوری آشکارساز دریافت نشد</span> (${esc(err || (status && status.error) || '')}). این وضعیت «اختلال اینترنت» تفسیر نمی‌شود.</div>`; return; }
  const sig = status.signals || [];
  el.innerHTML = ['access', 'security'].map((l) => {
    const o = status.overall[l], [n, c] = ON.LAYER[o.state] || ON.LAYER.unknown, S = sig.filter((s) => s.layer === l);
    const cnt = (st) => S.filter((s) => s.state === st).length;
    const bar = ['alert', 'watch', 'normal', 'insufficient', 'stale', 'gap'].map((st) => ({st, n: cnt(st)})).filter((x) => x.n);
    return `<div class="on-layer" style="--c:${c}"><div class="ol-h"><b>${l === 'access' ? 'دسترسی و اختلال' : 'امنیت و حملات'}</b><span class="ol-st">${n}</span></div>
      <p>${esc(o.text)}${o.sources_judged.length ? ` · منابع داوری‌شده: ${o.sources_judged.map((x) => esc(ON.srcName(x))).join('، ')}` : ''}</p>
      ${S.length ? `<div class="ol-bar" role="img" aria-label="${esc(bar.map((x) => ON.STATE[x.st][0] + ' ' + x.n).join('، '))}">${bar.map((x) => `<i style="flex:${x.n};background:${ON.STATE[x.st][1]}${['insufficient', 'stale', 'gap'].includes(x.st) ? ';opacity:.45' : ''}" title="${ON.STATE[x.st][0]}: ${x.n}"></i>`).join('')}</div>
      <div class="ol-leg">${bar.map((x) => `<span><b style="background:${ON.STATE[x.st][1]}"></b>${ON.STATE[x.st][0]} <span class="num">${F.i(x.n)}</span></span>`).join('')}</div>` : '<p class="dim">هیچ سری‌ای برای این لایه ذخیره نشده است.</p>'}
      <div class="ol-f"><span>رخداد باز: <b class="num">${F.i(o.open_incidents)}</b></span><span>داوری‌شده: <b class="num">${F.i(o.n_judged)}</b> از ${F.i(o.n_series)} سری</span></div></div>`;
  }).join('');
  el.title = status.note + ' · داوری ' + status.generated_at + ' · ' + status.rule_version;
};

ON.coll = (health, err) => {
  const el = $('#onColl');
  const L = ONLINE_SOURCES.map((s) => { const h = health && (health.sources || []).find((x) => x.id === s.id); return {s, h, st: h ? h.status : (API.base() && !err ? 'pending' : s.status)}; });
  const col = (st) => ({live: C.teal, archive: C.ice, temp_fail: C.red, needs_key: C.amber, needs_permit: C.amber, pending: C.dim, no_method: C.dim}[st] || C.dim);
  const order = ['live', 'temp_fail', 'archive', 'pending', 'needs_key', 'needs_permit', 'no_method'];
  const groups = order.map((st) => [st, L.filter((x) => x.st === st)]).filter(([, g]) => g.length);
  el.innerHTML = `<div class="on-coll">${groups.map(([st, g]) => `<div class="oc" title="${esc(g.map(({s, h}) => s.n + (h && h.freshness ? ' · ' + h.freshness : '') + (h && h.last_error ? ' · ' + h.last_error : '')).join('\n'))}"><i style="background:${col(st)}"></i><b>${esc((OST[st] || [st])[0])}</b> <span class="num">${F.i(g.length)}</span><small>${g.map(({s}) => esc(s.n.split(' (')[0])).join('، ')}</small></div>`).join('')}</div>${API.base() && err ? '<p class="er">اتصال به سرور ناموفق بود؛ وضعیت‌های تعبیه‌شده.</p>' : ''}`;
};

ON.incidents = (status, alerts, err) => {
  const el = $('#onInc');
  if (!API.base()) return ON.empty(el, ON.offline);
  if (err || !status || status.error) return ON.empty(el, '<span class="er">رخدادها دریافت نشد</span>؛ نبود این داده به معنی نبود رخداد نیست.');
  const inc = status.incidents || [];
  const al = (alerts && alerts.alerts) || [];
  if (!inc.length) { el.innerHTML = `<div class="empty-state">رخداد بازی نیست. معنایش این است که در ${F.i(((status.overall.access || {}).n_judged || 0) + ((status.overall.security || {}).n_judged || 0))} سری داوری‌شده تغییری به آستانه نرسیده؛ سری‌های داوری‌نشده را در «وضعیت اکنون» ببینید.</div>${al.length ? ON.alertFeed(al) : ''}`; return; }
  el.innerHTML = `<div class="on-incs">${inc.map((i) => {
    const [sn, sc] = ON.SEV[i.severity] || ON.SEV.low, peak = i.signals.filter((s) => s.peak_state === 'alert' || s.peak_state === 'watch');
    const mx = d3.max(peak, (s) => Math.abs(s.change || 0)) || 1;
    return `<article class="oi" style="--c:${sc}"><div class="oi-h"><span class="oi-sev">${sn}</span><b>${esc(i.title)}</b><span class="oi-st">${{open: 'باز', recovering: 'در حال بازیابی', closed: 'بسته'}[i.status] || esc(i.status)}</span></div>
      <div class="oi-m"><span title="نخستین نقطه از دنباله کنونیِ زیر یا بالای آستانه">شروع تخمینی: ${TEH(i.started_at)}</span><span>مدت: ${ON.dur(i.started_at, i.closed_at)}</span><span>آخرین فعالیت: ${ON.ago(i.last_active_at)}</span><span>نقاط دید مستقل: <b class="num">${F.i(i.independent_vantages.length)}</b></span>${i.acked_at ? `<span>دیده‌شده: ${TEH(i.acked_at)}</span>` : ''}</div>
      <div class="oi-sig">${peak.map((s) => `<div class="oi-r"><span>${esc(s.label)}${s.asn ? '' : ''}</span><span class="vz-delta ${s.peak_state === 'alert' ? 'bad' : 'warn'}"><i style="${(s.change || 0) >= 0 ? 'inset-inline-end' : 'inset-inline-start'}:50%;width:${Math.min(50, Math.abs(s.change || 0) / mx * 50)}%"></i></span><b class="num">${ON.pct(s.change)}</b><small>${ON.STATE[s.peak_state][0]}</small></div>`).join('')}</div>
      <div class="oi-c">${i.corroborating_events.length ? `<b>تأیید از رخدادهای اعلام‌شده:</b> ${[...new Set(i.corroborating_events.map((e) => e.source_id))].map((x) => esc(ON.srcName(x))).join('، ')}` : (i.layer === 'access' ? '<span class="dim">رخداد اعلام‌شده هم‌زمانی از IODA یا Cloudflare ثبت نشده است.</span>' : '<span class="dim">برای حملات، منبع رخداد اعلام‌شده مستقلی گردآوری نمی‌شود؛ رجیستر رخدادهای گزارش‌شده را کنار همین بخش ببینید.</span>')}</div>
      <p class="oi-l">${esc(i.limitation)}</p>
      <details><summary>تاریخچه رخداد · ${F.i(i.log.length)}</summary><ul>${i.log.map((g) => `<li>${TEH(g.at)} · ${esc({opened: 'باز شد', escalated: 'تشدید شد', recovering: 'شروع بازیابی', reactivated: 'دوباره فعال شد', closed: 'بسته شد', acknowledged: 'دیده شد'}[g.kind] || g.kind)}</li>`).join('')}</ul></details>
      <button class="go" data-ask-inc="${i.id}" type="button">تحلیل این رخداد با دستیار</button></article>`;
  }).join('')}</div>${al.length ? ON.alertFeed(al) : ''}`;
  $$('[data-ask-inc]', el).forEach((b) => b.onclick = () => AIUI.ask('رخداد شماره ' + b.dataset.askInc + ' پایش آنلاین را تحلیل کن: چه تغییر کرده، از کی، کدام منابع تأیید می‌کنند و بررسی بعدی چیست؟'));
};
ON.alertFeed = (al) => `<h5 class="nd-h">هشدارهای صادرشده</h5><ul class="on-al">${al.map((a) => `<li><span class="badge ${a.ok ? 'off' : 'usr'}">${esc({dashboard: 'داشبورد', webhook: 'وب‌هوک', bot: 'ربات'}[a.channel] || a.channel)}${a.ok ? '' : ' · ناموفق'}</span> رخداد #${F.i(a.incident_id)} · ${esc({opened: 'تازه', escalated: 'تشدید', closed: 'بسته'}[a.kind] || a.kind)} · ${TEH(a.at)}</li>`).join('')}</ul>`;

ON.map = (status, err) => {
  const el = $('#onMap');
  if (!API.base()) return ON.empty(el, ON.offline);
  if (err || !status || status.error) return ON.empty(el, '<span class="er">داوری دریافت نشد</span>.');
  const sig = (status.signals || []).filter((s) => s.layer === 'access');
  if (!sig.length) return ON.empty(el, 'هنوز سری‌ای برای لایه دسترسی ذخیره نشده است.');
  const cols = ON.COLS.filter(([src, met]) => sig.some((s) => s.source_id === src && s.metric_id === met));
  const rows = ON.SCOPES.filter((sc) => sig.some((s) => s.scope === sc));
  const get = (sc, [src, met]) => sig.find((s) => s.scope === sc && s.source_id === src && s.metric_id === met);
  const ch = 34, top = 34, h = top + rows.length * ch + 4;
  const {svg, w, tip} = K.svg(el, h);
  const lw = K.measure(svg, rows.map((r) => ON.SCOPE_FA[r] || r), 'l') + 16, cw = (w - lw - 4) / cols.length;
  cols.forEach((c, j) => rtlText(svg.append('text').attr('x', w - lw - j * cw - cw / 2).attr('y', 18).attr('text-anchor', 'middle').style('font-size', '10.5px').text(c[2])));
  rows.forEach((sc, i) => {
    const y = top + i * ch;
    rtlText(svg.append('text').attr('class', 'l').attr('x', w).attr('y', y + ch / 2).attr('dy', '.35em').attr('text-anchor', 'start').style('font-size', '11.5px').text(ON.SCOPE_FA[sc] || sc));
    cols.forEach((c, j) => {
      const s = get(sc, c), x = w - lw - (j + 1) * cw;
      const judged = s && ['normal', 'watch', 'alert'].includes(s.state);
      const fill = !s ? 'transparent' : judged ? ON.STATE[s.state][1] : 'var(--line2)';
      const r = svg.append('rect').attr('x', x + 2).attr('y', y + 2).attr('width', cw - 4).attr('height', ch - 4).attr('rx', 6).attr('fill', fill)
        .attr('fill-opacity', !s ? 0 : s.state === 'normal' ? 0.28 : judged ? 0.85 : 0.35).attr('stroke', s ? fill : 'var(--line)').attr('stroke-dasharray', s ? null : '3 3');
      if (!s) return;
      r.style('cursor', 'pointer').on('mousemove', (ev) => K.show(el, tip, ev, (ON.SCOPE_FA[sc] || sc) + ' · ' + s.label, [{c: fill, t: ON.STATE[s.state][0]}, {t: s.reason || ''}, {t: 'آخرین مشاهده: ' + TEH(s.last_observed)}])).on('mouseleave', () => K.hide(tip)).on('click', () => ON.series(s));
      svg.append('text').attr('x', x + cw / 2).attr('y', y + ch / 2).attr('dy', '.35em').attr('text-anchor', 'middle').style('font-size', '11px').style('font-weight', 600).style('pointer-events', 'none')
        .style('fill', judged && s.state !== 'normal' ? INK(fill) : 'var(--fg)').text(judged ? ON.pct(s.change) : ON.STATE[s.state][0]);
    });
  });
  K.srTable(el, ['دامنه', ...cols.map((c) => c[2])], rows.map((sc) => [ON.SCOPE_FA[sc] || sc, ...cols.map((c) => { const s = get(sc, c); return s ? ON.STATE[s.state][0] + (s.change != null ? ' ' + ON.pct(s.change) : '') : null; })]));
  const first = sig.find((s) => s.state === 'alert') || sig.find((s) => s.state === 'watch');
  if (first) ON.series(first); else $('#onSeries').innerHTML = '';
};

ON.series = async (s, target, compact) => {
  const box = target || $('#onSeries'); if (!box) return;
  const [sn, sc] = ON.STATE[s.state] || ON.STATE.insufficient;
  box.innerHTML = compact
    ? `<div class="on-ser c"><div class="on-sh"><span class="badge" style="border-color:${sc};color:${sc}">${sn}</span><b class="num">${['normal', 'watch', 'alert'].includes(s.state) ? ON.pct(s.change) : ''}</b><small title="${esc(s.reason || '')}">${esc(GUIDE.short ? GUIDE.short(s.reason || '', 90) : s.reason || '')}</small></div><div class="ch on-ser-chart"><div class="empty-state loading"><span class="spin"></span>در حال دریافت…</div></div></div>`
    : `<div class="on-ser"><h5 class="nd-h">${esc(s.label)} · ${esc(ON.SCOPE_FA[s.scope] || s.scope)} · ${sn}</h5><p class="lead">${esc(s.reason || '')}. خط‌چین خط مبنای همین قاعده است${s.baseline != null ? ' (' + F.n(Math.round(s.baseline * 1000) / 1000) + ')' : ''}. ${esc(s.limitation || '')}</p><div class="ch on-ser-chart" id="onSerCh"><div class="empty-state loading"><span class="spin"></span>در حال دریافت سری…</div></div></div>`;
  const chart = () => box.querySelector('.on-ser-chart');
  try {
    const q = new URLSearchParams({range: s.source_id === 'ioda' || s.source_id === 'cf_attacks' ? '7d' : '30d', source: s.source_id, asn: s.asn || ''});
    const o = await API.get('/api/v1/online/observations?' + q);
    const base = s.metric_id.replace(/\.anomaly_rate$/, '');
    let pts;
    if (s.source_id === 'ooni') {
      const g = (m) => ((o.series || []).find((x) => x.metric_id === base + '.' + m) || {points: []}).points;
      const n = Object.fromEntries(g('measurement_count')); pts = g('anomaly_count').map(([t, v]) => [t, v != null && n[t] ? v / n[t] : null]);
    } else pts = ((o.series || []).find((x) => x.metric_id === s.metric_id && x.vantage === s.vantage) || {points: []}).points;
    const el = chart(); if (!el || !box.isConnected) return;
    if (!pts.length) return ON.empty(el, 'نقطه‌ای در این بازه نیست.');
    K.line(el, {xs: pts.map((p) => p[0]), h: compact ? 150 : 220, ref: s.baseline, series: [{name: s.label, c: sc === C.dim ? C.ice : sc, vals: pts.map((p) => p[1]), w: compact ? 1.8 : 2, area: compact}],
      yfmt: s.source_id === 'ooni' ? (v) => F.i(v * 100) + '٪' : s.source_id === 'cf_attacks' ? (v) => F.n(Math.round(v * 100) / 100) : (v) => (Math.abs(v) >= 1e5 ? F.ax(v) : F.i(v)), tfmt: s.source_id === 'ooni' ? (v) => F.p(v * 100) : F.n, xlab: (t, j) => (j === 0 || j === pts.length - 1 ? TEH(t).split(' ').slice(0, 2).join(' ') : ''), xtip: TEH, endLabels: false});
  } catch (e) { const el = chart(); if (el) ON.empty(el, `<span class="er">سری دریافت نشد</span> (${esc(e.message)}).`); }
};

ON.security = async (status, err, alive) => {
  const el = $('#onSec');
  if (!API.base()) return ON.empty(el, ON.offline + ' رجیستر رخدادهای گزارش‌شده در کنار همین بخش، مستقل از سرور، در دسترس است.');
  if (err) return ON.empty(el, '<span class="er">اتصال به سرور ناموفق بود</span>.');
  const sig = ((status && status.signals) || []).filter((s) => s.layer === 'security');
  let o = null;
  try { o = await API.get('/api/v1/online/observations?range=30d&source=cf_attacks'); } catch (e) { o = null; }
  if (!alive()) return;
  const ser = (o && o.series) || [];
  if (!ser.length) {
    const st = ((await API.get('/api/v1/online/sources').catch(() => ({sources: []}))).sources || []).find((x) => x.id === 'cf_attacks');
    if (!alive() || !el.isConnected) return;
    return ON.empty(el, st && st.status === 'needs_key' ? 'گردآورنده حملات Cloudflare کلید ندارد (<span class="mono">CLOUDFLARE_API_TOKEN</span> روی سرور). تا آن زمان این بخش داده‌ای ندارد و چیزی برآورد نمی‌شود.' : 'هنوز سری حملات ذخیره نشده است.');
  }
  el.innerHTML = '';
  ON.SEC.forEach(([src, met, name, c]) => {
    const s = ser.find((x) => x.metric_id === met); if (!s) return;
    const lf = s.fetched_at, sg = sig.find((x) => x.metric_id === met);
    const pts = s.points.slice(-336);
    const box = document.createElement('div'); box.className = 'on-secs';
    box.innerHTML = `<div class="ug-h"><b>${esc(name)}</b>${sg ? `<span class="badge" style="border-color:${ON.STATE[sg.state][1]};color:${ON.STATE[sg.state][1]}">${ON.STATE[sg.state][0]}</span>` : ''}<small>${esc(sg ? sg.reason : '')} · دریافت ${TEH(lf)}</small></div><div class="ch"></div>`;
    el.appendChild(box);
    K.line($('.ch', box), {xs: pts.map((p) => p[0]), h: 130, yMin: 0, series: [{name, c, vals: pts.map((p) => p[1]), w: 1.6, area: true}], yfmt: (v) => F.n(Math.round(v * 100) / 100), tfmt: (v) => F.n(Math.round(v * 1000) / 1000) + ' (نرمال‌شده)', xlab: (t, j) => (j === 0 || j === pts.length - 1 ? TEH(t).split(' ').slice(0, 2).join(' ') : ''), xtip: TEH, endLabels: false});
  });
  const share = ser.find((x) => x.metric_id === 'l7.target_share_ir');
  if (share) { const last = share.points[share.points.length - 1]; el.insertAdjacentHTML('beforeend', `<div class="on-share"><b>سهم ایران از مقصد حملات لایه ۷ (۷ روز):</b> ${last && last[1] != null ? F.p(last[1], 2) + ' از کل حملات لایه ۷ مهارشده در Cloudflare' : 'ایران میان ۱۰۰ مقصد نخست نیست'} · ${TEH(last && last[0])}</div>`); }
};

ON.register = () => {
  const L = [...CYBER.incidents].sort((a, b) => (a.date < b.date ? 1 : -1));
  const el = $('#onReg'), t = $('#onRegT');
  if (!L.length) { ON.empty(el, 'رجیستر در این فایل نیست.'); return; }
  const lvl = (i) => (i.evidence.includes('independent') ? 'independent' : i.evidence.includes('victim_confirmed') ? 'victim_confirmed' : 'claimed');
  // timeline
  const h = 86, {svg, w, tip} = K.svg(t, h), ys = L.map((i) => new Date(i.date));
  const x = d3.scaleUtc([new Date(Math.min(...ys) - 120 * 864e5), new Date(Date.now())], [w - 14, 14]);
  svg.append('line').attr('x1', 10).attr('x2', w - 10).attr('y1', 46).attr('y2', 46).attr('stroke', 'var(--line2)').attr('stroke-width', 2);
  for (let yr = new Date(Math.min(...ys)).getUTCFullYear(); yr <= new Date().getUTCFullYear(); yr++) { const d = new Date(Date.UTC(yr, 2, 21)); if (x(d) > 10 && x(d) < w - 10) { svg.append('line').attr('x1', x(d)).attr('x2', x(d)).attr('y1', 40).attr('y2', 52).attr('stroke', 'var(--dim)'); svg.append('text').attr('x', x(d)).attr('y', 70).attr('text-anchor', 'middle').style('font-size', '10px').text(F.i(yr - 621)); } }
  L.forEach((i, k) => { const c = ON.EVL[lvl(i)][1]; svg.append('circle').attr('cx', x(new Date(i.date))).attr('cy', 46 - (k % 2) * 16).attr('r', 7).attr('fill', c).attr('stroke', 'var(--panel)').attr('stroke-width', 2).style('cursor', 'pointer')
    .on('mousemove', (ev) => K.show(t, tip, ev, i.title, [{t: i.date_fa + ' · ' + i.target}, {c, t: i.evidence.map((e) => ON.EVL[e][0]).join(' + ')}])).on('mouseleave', () => K.hide(tip))
    .on('click', () => { const c2 = $('#reg-' + i.id); if (c2) { c2.open = true; c2.scrollIntoView({behavior: 'smooth', block: 'nearest'}); } }); });
  K.srTable(t, ['تاریخ', 'رخداد', 'سطح شاهد'], L.map((i) => [i.date_fa, i.title, i.evidence.map((e) => ON.EVL[e][0]).join(' + ')]));
  el.innerHTML = `<div class="legend">${Object.values(ON.EVL).map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div><div class="on-reg">${L.map((i) => `<details class="or" id="reg-${esc(i.id)}"><summary><span class="or-d">${esc(i.date_fa)}</span><b>${esc(i.title)}</b><span class="or-ev">${i.evidence.map((e) => `<i style="background:${ON.EVL[e][1]}" title="${ON.EVL[e][0]}"></i>`).join('')}</span></summary>
    <dl><div><dt>هدف</dt><dd>${esc(i.target)}</dd></div><div><dt>اثر گزارش‌شده</dt><dd>${esc(i.effects)}</dd></div><div><dt>ادعا</dt><dd>${esc(i.claimed_by)}</dd></div><div><dt>انتساب</dt><dd>${esc(i.attribution)}</dd></div>${i.confirmation ? `<div><dt>تأیید</dt><dd>${esc(i.confirmation)}</dd></div>` : ''}${i.malware ? `<div><dt>بدافزار</dt><dd>${esc(i.malware)}</dd></div>` : ''}<div><dt>سطح شاهد</dt><dd>${i.evidence.map((e) => `<span class="badge" style="border-color:${ON.EVL[e][1]};color:${ON.EVL[e][1]}">${ON.EVL[e][0]}</span>`).join(' ')}</dd></div>
    <div><dt>منبع</dt><dd>${i.sources.map((s) => `<a class="lnk" href="${esc(SAFEURL(s.url) ? s.url : "#")}" target="_blank" rel="noopener noreferrer">${esc(s.publisher)} · ${esc(s.title)}</a>`).join('<br>')}</dd></div></dl></details>`).join('')}</div><p class="lead">${esc(CYBER.method || '')}</p>`;
};

ON.health = (health, err) => {
  const rows = ONLINE_SOURCES.filter((s) => STATE.onSrc === 'all' || s.id === STATE.onSrc).map((s) => {
    const h = health && (health.sources || []).find((x) => x.id === s.id);
    const st = h ? h.status : s.status;
    return `<tr><td><b>${esc(s.n)}</b><br><small class="dim">${esc(s.what)}</small></td><td><span class="badge ${OST[st] ? OST[st][1] : ''}">${esc(OST[st] ? OST[st][0] : st)}</span></td><td class="mono" style="direction:ltr;text-align:left"><small>${esc(s.ep)}</small></td><td><small>${esc(s.auth)}</small></td><td><small>${esc(s.freq)}</small></td><td><small>${h ? TEH(h.last_attempt) : 'در این فایل ثبت نشده'}</small></td><td><small>${h ? TEH(h.last_success) : '—'}</small></td><td><small>${h && h.freshness ? esc(h.freshness) : '—'}</small></td><td class="wrap"><small class="mut">${esc(h && h.last_error ? 'خطای گردآورنده: ' + h.last_error : s.note)}</small></td></tr>`;
  }).join('');
  $('#onHealth').innerHTML = `${err ? `<p class="lead"><span class="er">اتصال به سرور ناموفق بود (${esc(err)})</span>؛ وضعیت‌های تعبیه‌شده نمایش داده می‌شوند.</p>` : ''}<table class="t"><thead><tr><th>منبع</th><th>وضعیت</th><th>endpoint</th><th>احراز</th><th>تناوب مجاز</th><th>آخرین تلاش</th><th>آخرین موفقیت</th><th>تازگی</th><th>توضیح</th></tr></thead><tbody>${rows}</tbody></table>`;
};

ON.raw = async (err, alive) => {
  let obs = null;
  if (API.base() && !err) { try { const q = new URLSearchParams({range: STATE.onRange, source: STATE.onSrc, asn: STATE.onAsn || '', vantage: STATE.onVp || '', destination: STATE.onDst || ''}); obs = await API.get('/api/v1/online/observations?' + q); if (!alive()) return; } catch (e) { err = String(e.message || e); } }
  if (!obs) {
    ON.empty($('#onTimeline'), API.base() ? (err ? '<span class="er">خطای دریافت از سرور</span>؛ داده‌ای نمایش داده نمی‌شود و این وضعیت «اختلال اینترنت» تفسیر نمی‌شود.' : 'در حال دریافت…') : 'داده زنده‌ای در این فایل نیست. هیچ مقدار ساختگی یا شبیه‌سازی نمایش داده نمی‌شود.');
    ON.empty($('#onSignals'), API.base() ? 'سری‌ای دریافت نشد.' : 'برای نشانه‌های اتصال، نسخه متصل لازم است.');
    return;
  }
  const ev = obs.events || [];
  if (!ev.length) ON.empty($('#onTimeline'), 'در بازه انتخابی رخدادی از منابع فعال دریافت نشده است. نبود رخداد اعلام‌شده به معنی سلامت قطعی شبکه نیست.');
  else {
    const h = 40 + ev.length * 22; const {svg, w, tip} = K.svg($('#onTimeline'), h);
    const t0 = d3.min(ev, (e) => new Date(e.start)), t1 = d3.max(ev, (e) => new Date(e.end || e.start));
    const x = d3.scaleUtc([t0, t1], [120, w - 10]);
    ev.forEach((e, i) => { const y = 20 + i * 22; svg.append('text').attr('x', 112).attr('y', y + 8).attr('text-anchor', 'end').text(e.source_id); svg.append('rect').attr('x', x(new Date(e.start))).attr('y', y).attr('width', Math.max(3, x(new Date(e.end || e.start)) - x(new Date(e.start)))).attr('height', 14).attr('rx', 3).attr('fill', C.amber).on('mousemove', (m) => K.show($('#onTimeline'), tip, m, e.source_id + ' · ' + (e.label || ''), [{t: TEH(e.start) + ' تا ' + TEH(e.end)}, {t: 'دریافت: ' + TEH(e.fetched_at)}])).on('mouseleave', () => K.hide(tip)); });
    K.srTable($('#onTimeline'), ['منبع', 'شروع', 'پایان'], ev.map((e) => [e.source_id, e.start, e.end || null]));
  }
  const ser = obs.series || [];
  const box = $('#onSignals'); box.innerHTML = ser.length ? '' : '<div class="empty-state">سری‌ای دریافت نشد.</div>';
  ser.forEach((s) => { const d = document.createElement('div'); d.className = 'ch'; box.appendChild(d); const cap = document.createElement('p'); cap.className = 'lead'; cap.textContent = s.source_id + ' · ' + s.metric_id + ' (' + s.unit + ') · دریافت ' + s.fetched_at + (s.stale ? ' · کهنه' : ''); box.insertBefore(cap, d); K.line(d, {xs: s.points.map((p) => p[0]), h: 150, series: [{name: s.metric_id, c: C.ice, vals: s.points.map((p) => p[1])}], yfmt: F.ax, xlab: (t, j) => (j === 0 || j === s.points.length - 1 ? TEH(t).split(' ').slice(0, 2).join(' ') : ''), endLabels: false}); });
};

ON.tor = () => {
  const tor = TOR_DAILY;
  K.line($('#onTor'), {xs: tor.map((t) => t.date), h: 230, yMin: 0, series: [{name: 'کاربران تخمینی پل', c: C.violet, vals: tor.map((t) => t.users), w: 2.2, area: true}], yfmt: F.ax, tfmt: F.i, endfmt: F.i, xlab: (d, i) => (i % 5 === 0 || i === tor.length - 1 ? fa2en(d).slice(5).replace('-', '/') : ''), xtip: (d) => d + ' (UTC)'});
};

/* async errors in the online view never leave a spinner behind or a half-built page */
{ const d0 = V.online.draw; V.online.draw = async () => { try { await d0(); } catch (e) { console.error(e); $$('#views .empty-state.loading').forEach((x) => { x.classList.remove('loading'); x.innerHTML = `<span class="er">خطا در پردازش پاسخ</span>: ${esc(e.message)}. هیچ داده‌ای جایگزین نشد.`; }); } }; }

/* ---------- v4.7: chart-first layout, refresh, compact strip ---------- */
ON.autoOn = () => { try { return localStorage.getItem('radarOnAuto') !== '0'; } catch (e) { return true; } };
ON.wire = () => {
  const more = $('#onMore');
  if (more && !more.__w) { more.__w = 1; more.addEventListener('toggle', () => { if (more.open) { ON.tor(); if (API.base()) ON.raw('', () => STATE.view === 'online'); } }); }
  if ($('#onSetServer')) $('#onSetServer').onclick = () => { AIUI.open(); const c = $('#aiCfgB'); if (c && $('#aiCfg').hidden) c.click(); };
  if ($('#onRefresh')) $('#onRefresh').onclick = () => ON.refresh(false);
  if ($('#onAuto')) $('#onAuto').onchange = (e) => { try { localStorage.setItem('radarOnAuto', e.target.checked ? '1' : '0'); } catch (x) { /* per-viewer convenience only */ } };
  if (!ON.timer) ON.timer = setInterval(() => { if (STATE.view === 'online' && API.base() && !document.hidden && ON.autoOn() && $('#onAuto') && $('#onAuto').checked) ON.refresh(true); }, 60000);
};
ON.refresh = async (quiet) => { if (ON.busy) return; ON.busy = true; ON.refreshQuiet = quiet; const y = scrollY; try { await V.online.draw(); } finally { ON.busy = false; ON.refreshQuiet = false; if (quiet) window.scrollTo(0, y); } };
ON.trends = async (status, err, alive) => {
  const picks = [['bgp', (s) => s.source_id === 'ioda' && s.metric_id === 'bgp.visible_slash24'], ['ping', (s) => s.source_id === 'ioda' && s.metric_id === 'ping-slash24.up_slash24'], ['ooni', (s) => s.source_id === 'ooni' && s.metric_id === 'web_connectivity.anomaly_rate']];
  if (!API.base()) return;
  const sig = (status && status.signals) || [];
  await Promise.all(picks.map(async ([k, f]) => {
    const box = $('#onTrend-' + k); if (!box) return;
    if (err || !status || status.error) return ON.empty(box, '<span class="er">دریافت نشد</span>؛ وضعیت نامشخص');
    const s = sig.find((x) => x.scope === 'IR' && f(x));
    if (!s) return ON.empty(box, 'این سری هنوز روی سرور ذخیره نشده است');
    await ON.series(s, box, true);
    if (!alive()) return;
  }));
};
