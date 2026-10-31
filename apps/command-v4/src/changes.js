/* ===== v4.9 «از آخرین بازدید چه تغییر کرده؟» — one shared engine for the panel, the changes page, the assistant and the
   report studio. Policy: docs/v4/CHANGE_DETECTION_POLICY_FA.md (CHANGES_V1). Nothing here moves the baseline except ack().
   Three times are kept apart everywhere: observedAt (data), fetchedAt (radar received it), viewedAt (this browser built it). */
const CHG = (() => {
  const KEY = 'radarChangesBaseline.v1', SCHEMA = 1, POLICY = 'CHANGES_V1', TTL = 60000;
  const JUDGED = ['normal', 'watch', 'alert'];
  const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
  const lat = (s) => String(s == null ? '' : s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(lat(v)) ? +lat(v) : null);
  // display of a time or period: ISO -> Tehran time; «1405-Q1» -> «بهار ۱۴۰۵ (1405-Q1)»; anything else as written
  const timeFa = (x) => (/^\d{4}-\d\d-\d\dT/.test(x || '') ? TEH(x) : /^\d{4}-Q[1-4]$/.test(x || '') ? per(x) + ' (\u202A' + x + '\u202C)' : x || '—');
  const isPct = (u) => /درصد|٪|percent/i.test(String(u || ''));
  const DOMS = ['people', 'applications', 'base', 'information', 'communications', 'security', 'governance'];
  const TYPES = {periodic: 'داده‌های دوره‌ای', online: 'پایش آنلاین', sources: 'وضعیت منابع'};
  const KIND = {
    new_period: 'انتشار دوره تازه', backfill: 'ورود داده دوره گذشته', revision: 'اصلاح آمار', definition: 'تغییر تعریف، واحد، دامنه یا دوره', added: 'رکورد تازه', removed: 'حذف رکورد',
    opened: 'بازشدن رخداد', reactivated: 'بازفعال‌شدن رخداد', recovering: 'بازیابی رخداد (هنوز بسته نشده)', closed: 'بسته‌شدن رخداد', severity: 'تغییر شدت فنی رخداد', signal_state: 'تغییر وضعیت سیگنال',
    fetch_failed: 'قطع دریافت', fetch_restored: 'بازگشت دریافت', stale: 'کهنه‌شدن داده منبع', fresh: 'تازه‌شدن داده منبع', source_status: 'تغییر وضعیت منبع',
    data_gap: 'کمبود یا کهنگی داده سیگنال', data_restored: 'رفع کمبود داده سیگنال', data_state: 'تغییر وضعیت داده سیگنال', series_added: 'سری تازه در پایش', series_missing: 'سری در پاسخ نیامد',
    incident_missing: 'رخداد مبنا در پاسخ نیامد',
  };
  const SIG_FA = {normal: 'عادی (بدون نشانه طبق قاعده)', watch: 'زیر نظر', alert: 'هشدار', gap: 'شکاف داده', stale: 'کهنه', insufficient: 'تاریخچه ناکافی', unknown: 'نامعلوم'};
  const INC_FA = {open: 'باز', recovering: 'در حال بازیابی؛ بسته نشده', closed: 'بسته‌شده'};
  const SRC_FA = {live: 'دریافت فعال', temp_fail: 'موقتاً ناموفق', archive: 'آرشیوی / کهنه', pending: 'هنوز اجرا نشده', needs_key: 'نیازمند کلید', needs_permit: 'نیازمند مجوز', no_method: 'روش دریافت ندارد'};
  const LOGFA = {opened: 'بازشدن', recovery_verified_v2: 'بازیابی با داده تازه و عادی تأیید شد', recovery_paused_v2: 'بازیابی متوقف شد (شاهد تازه کافی نیست)', recovering: 'بازیابی', closed: 'بسته‌شدن', reactivated: 'بازفعال‌شدن', escalated: 'افزایش شدت فنی'};
  const SRC_DOM = {cf_attacks: 'security', shadowserver: 'security', arvan: 'security'};

  /* ---------- periodic data: identities and version ---------- */
  const SEASON = [['بهار', 1], ['تابستان', 2], ['پاییز', 3], ['زمستان', 4]];
  // CHANGES_V1.1 period model. Kind is explicit: Y (year), H (half-year), Q (quarter), X (anything else: a range of days,
  // an undated note). Each parsed period spans quarters [start, end] on one axis (year*4 + quarter-1).
  // cmpPeriod ONLY orders: negative/positive when the spans do not overlap, 0 when identical, null when they overlap
  // or cannot be parsed. Numeric comparability is decided separately by sameKind() (plus definition, unit, scope).
  const periodKey = (p) => {
    const s = lat(p), y = (s.match(/(?<!\d)(1[34]\d\d)(?!\d)/) || [])[1];
    if (!y) return null;
    const Y = +y * 4, q = s.match(/(?:^|[^A-Za-z])Q([1-4])(?![0-9])/i), h = s.match(/(?:^|[^A-Za-z])H([12])(?![0-9])/i), se = SEASON.find(([n]) => s.includes(n));
    const half = /شش/.test(s) ? (/نخست|اول/.test(s) ? 1 : /دوم/.test(s) ? 2 : 0) : 0;
    const days = /\d{1,2}\s+\S+\s+تا\s+\d{1,2}|تا/.test(s.replace(/1[34]\d\d/g, ''));
    let r;
    if (q) r = {kind: 'Q', start: Y + +q[1] - 1, end: Y + +q[1] - 1};
    else if (h || half) { const n = h ? +h[1] : half; r = {kind: 'H', start: Y + (n - 1) * 2, end: Y + (n - 1) * 2 + 1}; }
    else if (se && !days) r = {kind: 'Q', start: Y + se[1] - 1, end: Y + se[1] - 1};
    else if (/^\s*1[34]\d\d\s*$/.test(s)) r = {kind: 'Y', start: Y, end: Y + 3};
    else r = {kind: 'X', start: Y, end: Y + 3};
    return {y: +y, ...r};
  };
  const KIND_FA = {Y: 'سالانه', H: 'شش‌ماهه', Q: 'فصلی', X: 'نامشخص یا بازه آزاد'};
  const cmpPeriod = (a, b) => {
    const A = periodKey(a), B = periodKey(b); if (!A || !B) return null;
    if (A.kind === 'X' || B.kind === 'X') return A.y !== B.y && A.kind === B.kind ? A.y - B.y : null;
    if (A.start === B.start && A.end === B.end) return 0;
    if (A.end < B.start) return -1; if (A.start > B.end) return 1; return null;
  };
  const sameKind = (a, b) => { const A = periodKey(a), B = periodKey(b); return !!(A && B && A.kind === B.kind && A.kind !== 'X'); };
  const seriesKey = (r) => [r.coll, lat(r.t || '').replace(/(?<!\d)1[34]\d\d(?!\d)/g, '').replace(/\s+/g, ' ').trim(), r.u || '', r.geo || ''].join('|');
  const fpOf = (r) => ({v: r.v === undefined ? null : r.v, u: r.u || '', p: r.p || '', geo: r.geo || '', def: fnv(String(r.def || '')), dom: r.dom || '', t: r.t || '', src: r.src || '', adm: r.adm || '', coll: r.coll, s: seriesKey(r), got: r.got || ''});
  let PER = null;
  const periodic = () => {
    if (PER) return PER;
    const recs = {}; REC.list.forEach((r) => { recs[r.k] = fpOf(r); });
    const keys = Object.keys(recs).sort(), date = ((window.RADAR_DATA || {}).auditMeta || {}).date || '';
    return (PER = {ok: true, snapshotDate: date, dataVersion: date + '#' + fnv(keys.map((k) => k + JSON.stringify(recs[k])).join('\n')), recs});
  };

  /* ---------- online: incidents, signals, sources from the API's own ids and times ---------- */
  const maxT = (...xs) => xs.filter(Boolean).sort().pop() || '';
  const fetchOnline = async () => {
    if (!API.base()) return {available: false, parts: {}};
    const part = async (path) => { try { return {ok: true, data: await API.get(path)}; } catch (e) { return {ok: false, error: e.message === 'NO_API' ? 'نشانی سرور تنظیم نشده' : e.message || 'خطای دریافت'}; } };
    const [st, inc, src] = await Promise.all([part('/api/v1/online/status'), part('/api/v1/online/incidents?status=all&limit=200'), part('/api/v1/online/sources')]);
    const out = {available: true, receivedAt: new Date().toISOString(), parts: {signals: {ok: false}, incidents: {ok: false}, sources: {ok: false}}, signals: {}, incidents: {}, sources: {}};
    const validSig = (s) => s && typeof s.series_key === 'string' && typeof s.state === 'string';
    if (st.ok && st.data && Array.isArray(st.data.signals) && st.data.signals.every(validSig)) {
      out.parts.signals = {ok: true, rule: st.data.rule_version};
      st.data.signals.forEach((s) => { out.signals[s.series_key] = {state: s.state, last_observed: s.last_observed || '', last_fetched: s.last_fetched || '', current: s.current ?? null, baseline: s.baseline ?? null, unit: s.unit || '', label: s.label || s.metric_id, scope: s.scope || '', layer: s.layer || '', source_id: s.source_id || '', asOf: s.last_observed || ''}; });
    } else out.parts.signals = {ok: false, error: st.ok ? 'ساختار پاسخ وضعیت ناقص است' : st.error};
    const incOf = (i) => { const log = (i.log || []).map((l) => ({at: l.at, kind: l.kind})); return {status: i.status, severity: i.severity, severity_fa: i.severity_fa || i.severity, title: i.title || ('رخداد ' + i.id), layer: i.layer, scope: i.scope, scope_fa: i.scope_fa || i.scope, started_at: i.started_at || '', last_active_at: i.last_active_at || '', closed_at: i.closed_at || '', log, signals: (i.signals || []).map((s) => (s.label || s.metric_id) + (s.state_fa ? ' · ' + s.state_fa : '')), asOf: maxT(i.last_active_at, i.closed_at, ...log.map((l) => l.at))}; };
    const validInc = (i) => i && i.id != null && typeof i.status === 'string';
    if (inc.ok && inc.data && Array.isArray(inc.data.incidents) && inc.data.incidents.every(validInc)) { out.parts.incidents = {ok: true, all: true}; inc.data.incidents.forEach((i) => { out.incidents[String(i.id)] = incOf(i); }); }
    else if (st.ok && st.data && Array.isArray(st.data.incidents) && st.data.incidents.every(validInc)) { out.parts.incidents = {ok: true, all: false, error: 'فهرست کامل رخدادها دریافت نشد؛ فقط رخدادهای باز از پاسخ وضعیت'}; st.data.incidents.forEach((i) => { out.incidents[String(i.id)] = incOf(i); }); }
    else out.parts.incidents = {ok: false, error: inc.ok ? 'ساختار پاسخ رخدادها ناقص است' : inc.error};
    if (src.ok && src.data && Array.isArray(src.data.sources) && src.data.sources.every((s) => s && s.id && s.status)) {
      out.parts.sources = {ok: true};
      src.data.sources.forEach((s) => { out.sources[s.id] = {status: s.status, status_fa: s.status_fa || SRC_FA[s.status] || s.status, name: s.name || s.id, last_success: s.last_success || '', last_attempt: s.last_attempt || '', stale: !!s.stale, freshness: s.freshness || '', error_kind: s.error_kind || '', asOf: maxT(s.last_attempt, s.last_success)}; });
    } else out.parts.sources = {ok: false, error: src.ok ? 'ساختار پاسخ منابع ناقص است' : src.error};
    return out;
  };

  /* ---------- baseline storage (this browser only) ---------- */
  const storage = () => { try { const k = '__radar_chg_probe'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; } };
  const validBase = (b) => b && b.schema === SCHEMA && typeof b.reviewedAt === 'string' && b.periodic && typeof b.periodic.recs === 'object' && typeof b.periodic.snapshotDate === 'string' && b.online && typeof b.online === 'object' && ['incidents', 'signals', 'sources'].every((p) => b.online[p] == null || typeof b.online[p] === 'object');
  const load = () => {
    if (!storage()) return {state: 'storage_off'};
    let raw; try { raw = localStorage.getItem(KEY); } catch (e) { return {state: 'storage_off'}; }
    if (raw == null) return {state: 'none'};
    try { const b = JSON.parse(raw); return validBase(b) ? {state: 'ok', base: b} : {state: 'corrupt'}; } catch (e) { return {state: 'corrupt'}; }
  };

  /* ---------- formatting helpers ---------- */
  const fmtVal = (v, u) => { if (v == null || v === '') return 'ناموجود'; const n = num(v); return (n == null ? String(v) : F.n(n)) + (u ? ' ' + u : ''); };
  const diffOf = (a, b, u, comparable) => {
    const A = num(a), B = num(b);
    if (!comparable) return {abs: null, absText: 'قابل مقایسه نیست', rel: null, relText: '—'};
    if (A == null || B == null) return {abs: null, absText: A == null && B == null ? 'هر دو مقدار ناموجود' : 'یک طرف ناموجود است؛ اختلاف محاسبه نشد (ناموجود صفر نیست)', rel: null, relText: '—'};
    const d = B - A, pct = isPct(u);
    const absText = (d > 0 ? '+' : d < 0 ? '−' : '') + F.n(Math.abs(Math.round(d * 1000) / 1000)) + ' ' + (pct ? 'واحد درصد' : u || '');
    if (A === 0) return {abs: d, absText, rel: null, relText: 'درصد تغییر نامعتبر (مبنای صفر)'};
    const rel = d / Math.abs(A) * 100;
    return {abs: d, absText, rel, relText: (pct ? 'تغییر نسبی ' : '') + F.sp(rel, 2)};
  };
  const recLink = (k) => ({href: '#explorer?rec=' + encodeURIComponent(k), label: 'شناسنامه رکورد'});

  /* ---------- diff ---------- */
  const diffPeriodic = (B, C, viewedAt) => {
    const items = [], bySeries = {};
    Object.entries(B.recs).forEach(([k, fp]) => { (bySeries[fp.s] = bySeries[fp.s] || []).push([k, fp]); });
    const replaced = new Set();
    // change identity = record + kind + fingerprint of BOTH sides (before and after), so 10→30 and 20→30 differ and a refresh keeps it
    const fpId = (x) => (x ? [x.v, x.u, x.p, x.geo, x.def] : null);
    const base = (k, fp, kind, before, after, extra = {}, beforeFp) => ({
      id: 'per:' + k + ':' + kind + ':' + fnv(JSON.stringify([extra.prevRef || null, fpId(beforeFp), kind === 'removed' ? null : fpId(fp)])), type: 'periodic', kind, kindFa: KIND[kind], ref: {kind: 'record', id: k}, before, after,
      title: fp.t || k, dom: DOMS.includes(fp.dom) ? fp.dom : 'governance', domFallback: !DOMS.includes(fp.dom), source: fp.src || '—',
      observedAt: fp.p || '', fetchedAt: [kind !== 'removed' && fp.got, kind !== 'removed' && C.snapshotDate && 'بسته داده ' + C.snapshotDate, kind === 'removed' && B.snapshotDate && 'آخرین بار در بسته داده ' + B.snapshotDate].filter(Boolean).join(' · '), viewedAt, link: recLink(k), ...extra});
    // display period: «بهار ۱۴۰۵ (1405-Q1)» keeps the raw period id next to the readable one
    const pFa = (p) => (/^\d{4}-Q[1-4]$/.test(p || '') ? per(p) + ' (\u202A' + p + '\u202C)' : p || 'نامشخص'); // LRE…PDF keeps «1405-Q1» in order inside RTL text
    const side = (fp) => (fp ? {value: fp.v, text: fmtVal(fp.v, fp.u), unit: fp.u, scope: fp.geo || 'نامشخص', period: pFa(fp.p), periodId: fp.p || ''} : null);
    Object.entries(C.recs).forEach(([k, fp]) => {
      const old = B.recs[k];
      if (old) {
        const defChange = old.u !== fp.u || old.geo !== fp.geo || old.def !== fp.def || old.p !== fp.p;
        if (defChange) {
          const what = [old.u !== fp.u && 'واحد', old.geo !== fp.geo && 'دامنه', old.def !== fp.def && 'تعریف', old.p !== fp.p && 'دوره'].filter(Boolean).join('، ');
          items.push(base(k, fp, 'definition', side(old), side(fp), {comparable: false, ...diffOf(old.v, fp.v, fp.u, false), why: `${what} این رکورد عوض شده است؛ دو مقدار هم‌سنجه نیستند.`, limit: 'رشد یا افت از این دو عدد نتیجه گرفته نمی‌شود.', importance: fp.adm === 'official' ? 'attention' : 'info', importanceWhy: fp.adm === 'official' ? 'تغییر تعریف، واحد یا دامنه رکورد رسمی' : 'تغییر تعریف رکورد غیررسمی'}, old));
        } else if (JSON.stringify(old.v) !== JSON.stringify(fp.v)) {
          items.push(base(k, fp, 'revision', side(old), side(fp), {comparable: true, ...diffOf(old.v, fp.v, fp.u, true), why: 'عدد همان رکورد و همان دوره در نسخه تازه داده تغییر کرده است.', limit: 'این اصلاح آمار است، نه تغییر عملکرد در طول زمان.', importance: fp.adm === 'official' ? 'attention' : 'info', importanceWhy: fp.adm === 'official' ? 'اصلاح آمار رسمی' : 'اصلاح رکورد غیررسمی'}, old));
        }
        return;
      }
      const sib = bySeries[fp.s] || []; // baseline records of the same series
      const same = sib.find(([kk, o]) => o.p === fp.p && !C.recs[kk]); // same period, old record gone: a re-issue of that period
      if (same) {
        replaced.add(same[0]);
        const o = same[1];
        if (JSON.stringify(o.v) !== JSON.stringify(fp.v) || o.def !== fp.def) {
          const comparable = o.def === fp.def;
          items.push(base(k, fp, comparable ? 'revision' : 'definition', side(o), side(fp), {comparable, ...diffOf(o.v, fp.v, fp.u, comparable), why: `رکورد ${same[0]} برای همان دوره با رکورد ${k} جایگزین شده است.`, limit: comparable ? 'این اصلاح آمار است، نه تغییر عملکرد در طول زمان.' : 'تعریف دو رکورد یکسان نیست؛ رشد یا افت نتیجه گرفته نمی‌شود.', importance: fp.adm === 'official' ? 'attention' : 'info', importanceWhy: fp.adm === 'official' ? 'اصلاح آمار رسمی' : 'اصلاح رکورد غیررسمی', prevRef: same[0]}, o));
        }
        return;
      }
      const older = sib;
      if (older.length) {
        const ord = older.map(([kk, o]) => [kk, o, cmpPeriod(fp.p, o.p)]);
        if (ord.every((x) => x[2] != null && x[2] > 0)) {
          const prev = ord.map(([kk, o]) => [kk, o]).sort((a, b) => (cmpPeriod(a[1].p, b[1].p) ?? 0)).pop();
          const kA = periodKey(prev[1].p), kB = periodKey(fp.p), kindOk = sameKind(prev[1].p, fp.p), defOk = prev[1].def === fp.def && prev[1].u === fp.u;
          const comparable = kindOk && defOk;
          const d = diffOf(prev[1].v, fp.v, fp.u, comparable);
          const kindTxt = `${KIND_FA[kA.kind]} (${prev[1].p}) در برابر ${KIND_FA[kB.kind]} (${fp.p})`;
          items.push(base(k, fp, 'new_period', side(prev[1]), side(fp), {comparable, ...d, prevRef: prev[0], periodKinds: [kA.kind, kB.kind],
            why: comparable ? `دوره تازه سری «${fp.t}» منتشر شده و با آخرین دوره مبنا (${prev[1].p}) از همان نوع (${KIND_FA[kB.kind]}) مقایسه شده است.` : !kindOk ? `دوره تازه سری «${fp.t}» منتشر شده، ولی نوع یا طول دوره با آخرین دوره مبنا یکی نیست: ${kindTxt}.` : `دوره تازه سری «${fp.t}» منتشر شده، ولی تعریف یا واحد دو دوره در منبع یکسان نوشته نشده است.`,
            limit: comparable ? 'مقایسه دو دوره هم‌نوع از یک سری با واحد و دامنه یکسان است؛ علت تغییر از این داده معلوم نیست.' : !kindOk ? 'مقدار دوره‌های ناهم‌طول (مثلاً سالانه و فصلی) هم‌سنجه نیست؛ اختلاف یا درصد تغییر محاسبه نشد و «افزایش» یا «کاهش» نامیده نشد.' : 'تعریف یا واحد دو دوره یکسان نیست؛ «افزایش» یا «کاهش» نامیده نشد.', importance: 'info', importanceWhy: 'انتشار دوره تازه'}, prev[1]));
          return;
        }
        if (ord.some((x) => x[2] != null && x[2] < 0) && ord.every((x) => x[2] != null)) {
          items.push(base(k, fp, 'backfill', null, side(fp), {comparable: false, ...diffOf(null, fp.v, fp.u, false), why: `رکورد دوره ${fp.p} پس از دوره‌های دیرتر وارد شده است (خارج از ترتیب زمانی).`, limit: 'ورود داده دوره گذشته، رشد یا افت نیست.', importance: 'info', importanceWhy: 'تکمیل داده گذشته'}));
          return;
        }
      }
      items.push(base(k, fp, 'added', null, side(fp), {comparable: false, ...diffOf(null, fp.v, fp.u, false), why: older.length ? 'رکورد تازه در سری موجود؛ ترتیب دوره آن با دوره‌های مبنا قابل تعیین نیست.' : 'رکورد تازه‌ای که در مبنا نبود.', limit: 'رکورد تازه به‌تنهایی تغییر عملکرد نیست.', importance: 'info', importanceWhy: 'رکورد تازه'}));
    });
    Object.entries(B.recs).forEach(([k, fp]) => {
      if (C.recs[k] || replaced.has(k)) return;
      items.push({...base(k, fp, 'removed', side(fp), null, {}, fp), link: {href: '#explorer', label: 'کاوش داده‌ها (رکورد در نسخه فعلی نیست)'}, comparable: false, ...diffOf(fp.v, null, fp.u, false), why: 'این رکورد در نسخه فعلی داده نیست.', limit: 'حذف رکورد به معنی صفر شدن یا توقف آن پدیده نیست.', importance: fp.adm === 'official' ? 'attention' : 'info', importanceWhy: fp.adm === 'official' ? 'حذف رکورد رسمی' : 'حذف رکورد'});
    });
    return items;
  };

  const diffOnline = (B, C, viewedAt) => {
    const items = [], unverified = [];
    const has = B.has || {};
    // incidents
    if (C.parts.incidents.ok && has.incidents) {
      Object.entries(C.incidents).forEach(([id, c]) => {
        const b = (B.incidents || {})[id];
        const newLog = c.log.filter((l) => !b || l.at > (b.asOf || ''));
        const mk = (kind, extra) => ({id: 'inc:' + id + ':' + kind + ':' + (b ? b.status + '/' + b.severity + '@' + (b.asOf || '') : 'none') + '>' + c.status + '/' + c.severity + '@' + (c.asOf || c.started_at), type: 'online', kind, kindFa: KIND[kind], ref: {kind: 'incident', id}, title: c.title, dom: c.layer === 'security' ? 'security' : 'communications',
          before: b ? {text: INC_FA[b.status] || b.status, scope: b.scope_fa || b.scope, period: 'از ' + TEH(b.started_at)} : {text: 'در مبنا نبود', scope: c.scope_fa, period: '—'}, after: {text: INC_FA[c.status] || c.status, scope: c.scope_fa, period: 'از ' + TEH(c.started_at) + (c.closed_at ? ' تا ' + TEH(c.closed_at) : '')},
          comparable: false, abs: null, absText: '—', rel: null, relText: '—', severity: c.severity_fa, source: 'سرور رادار، قاعده‌های DETECT_V1', observedAt: c.last_active_at || c.started_at, fetchedAt: newLog.length ? newLog[newLog.length - 1].at : c.asOf, viewedAt,
          evidence: [...newLog.map((l) => `${TEH(l.at)}: ${LOGFA[l.kind] || l.kind}`), ...c.signals.slice(0, 6)], link: {href: '#online', label: 'پرونده رخداد در پایش آنلاین'}, ...extra});
        const hi = ['high', 'critical'].includes(c.severity);
        if (!b) {
          items.push(mk('opened', {why: `رخداد پس از مبنا باز شده${c.status !== 'open' ? ' و اکنون «' + (INC_FA[c.status] || c.status) + '» است' : ''}.`, limit: 'رخداد از قاعده‌های DETECT_V1 روی داده منابع عمومی ساخته شده؛ نشانه است، نه حکم، و علت را تعیین نمی‌کند.', importance: hi ? 'attention' : 'info', importanceWhy: hi ? 'بازشدن رخداد با شدت فنی بالا یا بحرانی' : 'بازشدن رخداد با شدت فنی ' + c.severity_fa}));
          return;
        }
        if (c.asOf && b.asOf && c.asOf < b.asOf) { unverified.push({id: 'inc-old:' + id, type: 'online', kind: 'incident_missing', kindFa: 'شاهد قدیمی‌تر از مبنا', title: c.title, dom: c.layer === 'security' ? 'security' : 'communications', why: 'پاسخ سرور برای این رخداد از مبنای ذخیره‌شده قدیمی‌تر است؛ نادیده گرفته شد.', viewedAt}); return; }
        if (b.status !== c.status) {
          const kind = c.status === 'open' ? 'reactivated' : c.status === 'recovering' ? 'recovering' : c.status === 'closed' ? 'closed' : 'severity';
          const basis = kind === 'closed' ? 'سرور رخداد را پس از بازیابی تأییدشده با داده تازه و عادی از سیگنال‌های ایجادکننده بسته است (RECOVERY_VERIFIED_V2).' : kind === 'recovering' ? 'سیگنال‌های ایجادکننده با داده تازه به حالت عادی برگشته‌اند؛ رخداد تا پایان دوره آرام بسته نمی‌شود.' : kind === 'reactivated' ? 'سیگنال‌های رخداد دوباره از آستانه گذشته‌اند.' : '';
          items.push(mk(kind, {why: basis, limit: kind === 'closed' ? 'بسته‌شدن رخداد یعنی قاعده‌ها نشانه‌ای نمی‌بینند، نه اینکه شبکه سالم است.' : 'نشانه است، نه حکم؛ علت با این داده تعیین نمی‌شود.', importance: kind === 'reactivated' && hi ? 'attention' : 'info', importanceWhy: kind === 'reactivated' && hi ? 'بازفعال‌شدن رخداد با شدت فنی بالا یا بحرانی' : KIND[kind]}));
        } else if (b.severity !== c.severity) {
          items.push(mk('severity', {before: {text: 'شدت فنی ' + (b.severity_fa || b.severity), scope: c.scope_fa, period: '—'}, after: {text: 'شدت فنی ' + c.severity_fa, scope: c.scope_fa, period: '—'}, why: 'شدت فنی رخداد با قاعده DETECT_V1 تغییر کرده است.', limit: 'شدت فنی، اهمیت مدیریتی نیست.', importance: 'info', importanceWhy: 'تغییر شدت فنی'}));
        }
      });
      if (C.parts.incidents.all) Object.keys(B.incidents || {}).forEach((id) => { if (!C.incidents[id] && (B.incidents[id].status !== 'closed')) unverified.push({id: 'inc-miss:' + id, type: 'online', kind: 'incident_missing', kindFa: KIND.incident_missing, title: B.incidents[id].title || 'رخداد ' + id, dom: 'communications', why: 'رخداد مبنا در پاسخ سرور نیامد؛ وضعیت آن نامعلوم است و «بسته‌شده» فرض نشد.', viewedAt}); });
    }
    // signals
    if (C.parts.signals.ok && has.signals) {
      Object.entries(C.signals).forEach(([k, c]) => {
        const b = (B.signals || {})[k];
        const dom = c.layer === 'security' ? 'security' : 'communications';
        if (!b) { items.push({id: 'sig:' + k + ':added', type: 'sources', kind: 'series_added', kindFa: KIND.series_added, ref: {kind: 'signal', id: k}, title: c.label + (c.scope ? ' · ' + c.scope : ''), dom, before: {text: 'در مبنا نبود'}, after: {text: SIG_FA[c.state] || c.state}, comparable: false, abs: null, absText: '—', rel: null, relText: '—', source: c.source_id, observedAt: c.last_observed, fetchedAt: c.last_fetched, viewedAt, why: 'سری تازه‌ای به پایش اضافه شده است.', limit: 'افزوده‌شدن سری، تغییر وضعیت شبکه نیست.', importance: 'info', importanceWhy: 'سری تازه', link: {href: '#online', label: 'نمودار سری در پایش آنلاین'}}); return; }
        if (b.state === c.state) return;
        const jb = JUDGED.includes(b.state), jc = JUDGED.includes(c.state);
        if (jb && jc && !(c.last_observed > b.last_observed)) return; // no fresher observation: not a change of evidence
        if (c.last_observed && b.last_observed && c.last_observed < b.last_observed) return; // older than baseline: ignored
        const kind = jb && jc ? 'signal_state' : jb && !jc ? 'data_gap' : !jb && jc ? 'data_restored' : 'data_state';
        const rate = c.unit === 'rate', val = (v) => (v == null ? null : rate ? v * 100 : v), u = rate ? '٪' : c.unit === '/24' || /slash24/.test(k) ? 'بلوک /24' : c.unit;
        const comparable = kind === 'signal_state' && b.unit === c.unit && num(b.current) != null && num(c.current) != null;
        const d = diffOf(val(b.current), val(c.current), rate ? 'درصد' : u, comparable);
        items.push({id: 'sig:' + k + ':' + b.state + '@' + (b.last_observed || '') + '>' + c.state + '@' + c.last_observed, type: kind === 'signal_state' ? 'online' : 'sources', kind, kindFa: KIND[kind], ref: {kind: 'signal', id: k}, title: c.label + (c.scope ? ' · ' + c.scope : ''), dom,
          before: {text: SIG_FA[b.state] || b.state, value: val(b.current), unit: u, scope: b.scope || c.scope, period: 'مشاهده ' + TEH(b.last_observed)}, after: {text: SIG_FA[c.state] || c.state, value: val(c.current), unit: u, scope: c.scope, period: 'مشاهده ' + TEH(c.last_observed)},
          comparable, ...d, source: c.source_id, observedAt: c.last_observed, fetchedAt: c.last_fetched, viewedAt,
          why: kind === 'signal_state' ? `وضعیت سری با داده تازه از «${SIG_FA[b.state]}» به «${SIG_FA[c.state]}» رسیده است.` : kind === 'data_gap' ? 'سری دیگر داده کافی یا تازه برای داوری ندارد.' : kind === 'data_restored' ? 'سری دوباره داده کافی و تازه برای داوری دارد.' : 'وضعیت داده سری تغییر کرده است.',
          limit: kind === 'signal_state' ? 'مقدار سیگنال (مثلاً تعداد بلوک‌های /24) درصد کاربران یا کیفیت کل نیست؛ نشانه است، نه حکم.' : 'تغییر سلامت داده، تغییر وضعیت شبکه نیست.', importance: 'info', importanceWhy: KIND[kind], link: {href: '#online', label: 'نمودار سری در پایش آنلاین'}});
      });
      Object.keys(B.signals || {}).forEach((k) => { if (!C.signals[k]) unverified.push({id: 'sig-miss:' + k, type: 'sources', kind: 'series_missing', kindFa: KIND.series_missing, title: (B.signals[k].label || k) + (B.signals[k].scope ? ' · ' + B.signals[k].scope : ''), dom: 'communications', why: 'سری مبنا در پاسخ سرور نیامد؛ وضعیت آن نامعلوم است.', viewedAt}); });
    }
    // sources
    if (C.parts.sources.ok && has.sources) {
      Object.entries(C.sources).forEach(([id, c]) => {
        const b = (B.sources || {})[id];
        if (!b || b.status === c.status) return;
        if (c.asOf && b.asOf && c.asOf < b.asOf) return;
        const kind = c.status === 'temp_fail' ? 'fetch_failed' : (b.status === 'temp_fail' || b.status === 'pending') && c.status === 'live' ? 'fetch_restored' : b.status === 'live' && c.status === 'archive' ? 'stale' : b.status === 'archive' && c.status === 'live' ? 'fresh' : 'source_status';
        const att = kind === 'fetch_failed' && b.status === 'live';
        items.push({id: 'src:' + id + ':' + b.status + '@' + (b.asOf || '') + '>' + c.status + '@' + c.asOf, type: 'sources', kind, kindFa: KIND[kind], ref: {kind: 'source', id}, title: c.name, dom: SRC_DOM[id] || 'communications', before: {text: SRC_FA[b.status] || b.status, period: 'آخرین موفقیت ' + TEH(b.last_success)}, after: {text: c.status_fa, period: 'آخرین موفقیت ' + TEH(c.last_success) + (c.freshness ? ' · ' + c.freshness : '')},
          comparable: false, abs: null, absText: '—', rel: null, relText: '—', source: c.name, observedAt: c.last_success, fetchedAt: c.last_attempt, freshness: c.freshness, viewedAt,
          why: kind === 'fetch_failed' ? `آخرین تلاش دریافت ناموفق بوده${c.error_kind ? ' (' + c.error_kind + ')' : ''}.` : kind === 'fetch_restored' ? 'دریافت از منبع دوباره موفق شده است.' : kind === 'stale' ? 'آخرین دریافت موفق از آستانه تازگی گذشته است.' : 'وضعیت دریافت منبع تغییر کرده است.',
          limit: 'خطا یا قطع دریافت منبع، اختلال اینترنت نیست؛ تغییر سلامت منبع تغییر وضعیت شبکه حساب نمی‌شود.', importance: att ? 'attention' : 'info', importanceWhy: att ? 'قطع دریافت منبعی که پیش‌تر فعال بود' : KIND[kind], link: {href: '#online', label: 'جدول منابع در پایش آنلاین'}});
      });
    }
    return {items, unverified};
  };

  const compare = (loaded, snap) => {
    const viewedAt = snap.takenAt;
    const gaps = [];
    if (snap.online.available) ['signals', 'incidents', 'sources'].forEach((p) => { const x = snap.online.parts[p]; if (!x.ok) gaps.push({part: p, reason: x.error}); else if (x.error) gaps.push({part: p, reason: x.error, partial: true}); });
    // CHANGES_V1.1 coverage: receiving data and being able to compare it are separate. A part is «compared» only when it
    // was received AND has a baseline in this browser. «complete» = every part compared; panel, assistant and report all
    // read this one object (coverage + coverageText), never their own logic.
    const Bh = (loaded.base && loaded.base.online && loaded.base.online.has) || {};
    const cov = {periodic: {fetch: 'ok', baseline: loaded.state === 'ok'}};
    ['incidents', 'signals', 'sources'].forEach((p) => { const x = snap.online.available ? snap.online.parts[p] : null; cov[p] = {fetch: !snap.online.available ? 'unavailable' : !x.ok ? 'failed' : x.error ? 'partial' : 'ok', baseline: loaded.state === 'ok' && !!Bh[p], reason: x && (x.error || '')}; });
    Object.values(cov).forEach((c) => { c.compared = (c.fetch === 'ok' || c.fetch === 'partial') && c.baseline; c.full = c.fetch === 'ok' && c.baseline; });
    const part2 = (ps) => (ps.every((p) => cov[p].fetch === 'unavailable') ? 'unavailable' : ps.some((p) => cov[p].fetch === 'failed' || cov[p].fetch === 'partial') ? 'incomplete' : ps.some((p) => !cov[p].baseline) ? 'no_baseline' : 'ok');
    const res = {policy: POLICY, state: loaded.state, viewedAt, snapshot: snap, baseline: loaded.base || null, gaps, items: [], unverified: [], coverage: cov,
      complete: loaded.state === 'ok' && Object.values(cov).every((c) => c.full), baseRev: loaded.base ? loaded.base.rev || null : null,
      parts: {periodic: 'ok', online: part2(['incidents', 'signals']), sources: part2(['sources'])}, noBaselineParts: []};
    if (loaded.state !== 'ok') return res;
    const B = loaded.base;
    res.items.push(...diffPeriodic(B.periodic, snap.periodic, viewedAt));
    if (snap.online.available) {
      const has = (B.online && B.online.has) || {};
      ['incidents', 'signals', 'sources'].forEach((p) => { if (snap.online.parts[p].ok && !has[p]) res.noBaselineParts.push(p); });
      const o = diffOnline(B.online || {}, snap.online, viewedAt);
      res.items.push(...o.items); res.unverified.push(...o.unverified);
    }
    const order = {attention: 0, info: 1}, torder = {online: 0, sources: 1, periodic: 2};
    res.items.sort((a, b) => order[a.importance] - order[b.importance] || torder[a.type] - torder[b.type] || String(b.observedAt).localeCompare(String(a.observedAt)) || a.id.localeCompare(b.id));
    res.items.forEach((i) => { i.review = 'new'; });
    res.unverified.forEach((i) => { i.review = 'unverified'; i.importance = 'info'; i.abs = null; i.absText = '—'; i.relText = '—'; i.comparable = false; });
    res.counts = Object.fromEntries(Object.keys(TYPES).map((t) => [t, res.items.filter((i) => i.type === t).length]));
    res.ack = B.ack || null;
    return res;
  };

  const PART_FA = {periodic: 'داده‌های دوره‌ای', incidents: 'رخدادها', signals: 'سیگنال‌ها', sources: 'منابع'};
  // one wording for the panel, the assistant and the report
  const coverageText = (r) => {
    if (!r || r.state !== 'ok') return {complete: false, label: 'مقایسه انجام نشد', details: []};
    const c = r.coverage, d = [];
    Object.entries(c).forEach(([p, x]) => {
      if (x.full) return;
      if (x.fetch === 'unavailable') d.push(`${PART_FA[p]}: در این فایل آفلاین در دسترس نیست`);
      else if (x.fetch === 'failed') d.push(`${PART_FA[p]}: دریافت ناموفق (${x.reason || 'خطا'})`);
      else if (!x.baseline) d.push(`${PART_FA[p]}: دریافت شد ولی مبنا ندارد؛ مقایسه ممکن نیست`);
      else if (x.fetch === 'partial') d.push(`${PART_FA[p]}: دریافت ناقص (${x.reason || ''})`);
    });
    return {complete: r.complete, label: r.complete ? 'بررسی کامل' : 'بررسی ناقص', details: d};
  };
  /* ---------- public: build current view (cached), acknowledge ---------- */
  let current = null, inflight = null;
  const listeners = new Set();
  const emit = () => listeners.forEach((f) => { try { f(current); } catch (e) { console.error(e); } });
  const ensure = async (opt = {}) => {
    if (current && !opt.force && Date.now() - Date.parse(current.viewedAt) < TTL && current.state === load().state) return current;
    if (inflight) return inflight;
    inflight = (async () => {
      const snap = {takenAt: new Date().toISOString(), periodic: periodic(), online: await fetchOnline()};
      current = compare(load(), snap);
      return current;
    })();
    try { return await inflight; } finally { inflight = null; emit(); }
  };
  // re-evaluate against the stored baseline without refetching (used after another tab acknowledged)
  const recompare = () => { if (current) { const rev = current.baseRev; current = compare(load(), current.snapshot); if (current.baseRev !== rev) current.externalAck = true; current.baseRev = rev; emit(); } return current; };

  const summary = (i) => ({id: i.id, type: i.type, kind: i.kind, kindFa: i.kindFa, title: i.title, dom: i.dom, before: i.before ? i.before.text : '', after: i.after ? i.after.text : '', observedAt: i.observedAt || '', ref: i.ref || null});
  // CHANGES_V1.1 acknowledgement. Refused (nothing written) when:
  //  - the stored baseline changed after this tab built its comparison (another tab/window acknowledged): refresh first;
  //  - the stored data version differs and this tab's data bundle is not newer (same date, different content, or older):
  //    the order of the two versions is unknown, so the newer picture is never overwritten silently. {replace: true}
  //    is the explicit, user-confirmed override for that second case only.
  // Serialised across tabs with the Web Locks API where the browser has it.
  const doAck = (opt = {}) => {
    if (!current) return {saved: false, reason: 'هنوز تصویری از داده ساخته نشده است'};
    if (!storage()) return {saved: false, reason: 'حافظه مرورگر در دسترس نیست؛ مبنا ذخیره نمی‌شود'};
    const snap = current.snapshot, now = new Date().toISOString();
    const L = load(), prev = L.state === 'ok' ? L.base : null; // fresh read inside the lock
    const storedRev = prev ? prev.rev || null : null;
    if (L.state === 'ok' && storedRev !== (current.baseRev ?? null)) return {saved: false, conflict: 'baseline', reason: 'مبنا پس از ساخت این تصویر در زبانه یا پنجره دیگری ثبت شده است. برای جلوگیری از بازنویسی تصویر تازه‌تر، ثبت انجام نشد؛ صفحه را تازه کنید و دوباره بررسی کنید.'};
    if (prev && prev.periodic && prev.periodic.dataVersion !== snap.periodic.dataVersion && !(snap.periodic.snapshotDate > prev.periodic.snapshotDate) && !opt.replace)
      return {saved: false, conflict: 'data', reason: `نسخه داده این صفحه (${snap.periodic.dataVersion}) با نسخه ثبت‌شده در مبنا (${prev.periodic.dataVersion}) فرق دارد و تازه‌تر نیست؛ ترتیب این دو نسخه معلوم نیست و ثبت انجام نشد. صفحه را تازه کنید؛ اگر عمداً این نسخه را مبنا می‌خواهید، «جایگزینی آگاهانه مبنا» را بزنید.`};
    const next = prev ? JSON.parse(JSON.stringify(prev)) : {schema: SCHEMA, policy: POLICY, periodic: null, online: {has: {}, incidents: {}, signals: {}, sources: {}}};
    next.schema = SCHEMA; next.policy = POLICY; next.online = next.online || {}; next.online.has = next.online.has || {};
    next.periodic = {snapshotDate: snap.periodic.snapshotDate, dataVersion: snap.periodic.dataVersion, recs: snap.periodic.recs};
    const recorded = ['periodic'], skipped = [];
    if (snap.online.available) {
      [['incidents', 'incidents'], ['signals', 'signals'], ['sources', 'sources']].forEach(([p, f]) => {
        if (!snap.online.parts[p].ok) { skipped.push(p); return; }
        const dst = next.online[f] = next.online[f] || {};
        Object.entries(snap.online[f]).forEach(([id, v]) => { if (!dst[id] || !(String(v.asOf || '') < String(dst[id].asOf || ''))) dst[id] = v; });
        next.online.has[p] = true; recorded.push(p);
      });
    } else skipped.push('online-unavailable');
    const ackItems = current.state === 'ok' ? current.items.filter((i) => i.type === 'periodic' || recorded.includes(i.ref && i.ref.kind === 'incident' ? 'incidents' : i.ref && i.ref.kind === 'signal' ? 'signals' : 'sources')) : [];
    next.reviewedAt = now; next.viewedSnapshotAt = snap.takenAt;
    next.rev = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    next.ack = {at: now, viewedAt: snap.takenAt, recorded, skipped, replaced: !!opt.replace, items: ackItems.slice(0, 300).map(summary), total: ackItems.length};
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { return {saved: false, reason: 'ذخیره مبنا ناموفق بود: ' + e.message}; }
    current = compare(load(), snap);
    emit();
    return {saved: true, recorded, skipped, at: now};
  };
  const ack = (opt) => (navigator.locks && navigator.locks.request ? navigator.locks.request('radar-changes-ack', () => doAck(opt)) : Promise.resolve(doAck(opt)));
  addEventListener('storage', (e) => { if (e.key === KEY) recompare(); });
  return {ensure, ack, recompare, load, compare, periodic, fetchOnline, onChange: (f) => listeners.add(f), off: (f) => listeners.delete(f), get current() { return current; },
    KEY, POLICY, TYPES, KIND, timeFa, coverageText, PART_FA, DOMS, SIG_FA, INC_FA, periodKey, cmpPeriod, sameKind, KIND_FA, seriesKey, diffOf, _reset: () => { current = null; PER = null; }};
})();

/* ===== UI: command-view panel and the full «تغییرات» page ===== */
const CHGUI = (() => {
  const DOMN = (d) => (DOM[d] ? DOM[d].n : d);
  const IMP = {attention: 'نیازمند توجه', info: 'برای اطلاع'};
  const REV = {new: 'بررسی‌نشده', unverified: 'قابل مقایسه نیست', reviewed: 'بررسی‌شده در آخرین مرور'};
  const partFa = {signals: 'سیگنال‌ها', incidents: 'رخدادها', sources: 'منابع'};
  const baseLine = (r) => {
    if (!r) return 'در حال ساخت تصویر داده…';
    if (r.state === 'storage_off') return 'حافظه این مرورگر در دسترس نیست؛ مبنای مقایسه ذخیره نمی‌شود و مقایسه ممکن نیست.';
    if (r.state === 'none') return 'هنوز مبنای مقایسه ثبت نشده است. هیچ تغییری ساخته نمی‌شود تا «تا این لحظه بررسی شد» را بزنید.';
    if (r.state === 'corrupt') return 'مبنای ذخیره‌شده در این مرورگر خوانا نیست؛ مقایسه انجام نشد. با «تا این لحظه بررسی شد» مبنای تازه ثبت می‌شود.';
    return `مبنای مقایسه: بررسی‌شده در ${TEH(r.baseline.reviewedAt)} · نسخه داده مبنا ${esc(r.baseline.periodic.snapshotDate)}`;
  };
  const fetchLine = (r) => {
    if (!r) return '';
    const s = r.snapshot, on = s.online;
    const per = `داده دوره‌ای: نسخه ${esc(s.periodic.snapshotDate)} (${esc(s.periodic.dataVersion.split('#')[1])})`;
    if (!on.available) return per + ' · پایش آنلاین و منابع: در این فایل آفلاین در دسترس نیست (تغییر یا نقص به حساب نمی‌آید)';
    const ok = ['signals', 'incidents', 'sources'].filter((p) => on.parts[p].ok);
    return per + ` · آخرین دریافت موفق از سرور: ${ok.length ? TEH(on.receivedAt) + ' (' + ok.map((p) => partFa[p]).join('، ') + ')' : 'ناموفق'}`;
  };
  const completeLine = (r) => {
    if (!r || r.state !== 'ok') return '';
    const t = CHG.coverageText(r);
    return t.complete ? '<span class="chg-ok">بررسی کامل</span>' : `<span class="chg-part">بررسی ناقص</span>: ${t.details.map(esc).join('؛ ')}. بخش‌هایی که مقایسه نشدند تغییر حساب نمی‌شوند و با «بررسی شد» فقط بخش‌های دریافت‌شده ثبت می‌شوند.`;
  };
  const valText = (side) => (side ? [side.text, side.scope && side.scope !== 'نامشخص' ? 'دامنه: ' + side.scope : '', side.period ? 'دوره: ' + side.period : ''].filter(Boolean).join(' · ') : '—');
  const row = (i, href = true) => `<a class="chg-row" href="#changes?chId=${encodeURIComponent(i.id)}" data-chid="${esc(i.id)}"><span class="chg-imp chg-${i.importance}">${IMP[i.importance]}</span><span class="chg-main"><b>${esc(i.title)}</b><small>${esc(i.kindFa)} · ${esc(DOMN(i.dom))} · ${esc(CHG.TYPES[i.type])}</small><small class="chg-ba">${i.before ? 'قبل: ' + esc(i.before.text) + ' ← ' : ''}${i.after ? 'بعد: ' + esc(i.after.text) : 'بعد: در نسخه فعلی نیست'}${i.absText && i.absText !== '—' ? ' · ' + esc(i.absText) : ''}</small></span></a>`;
  const counts = (r) => Object.entries(CHG.TYPES).map(([t, n]) => `<div class="chg-c"><b class="num">${r && r.state === 'ok' && r.parts[t] !== 'unavailable' && r.parts[t] !== 'no_baseline' ? F.i(r.counts[t]) : '—'}</b><span>${n}</span><small>${r && r.state === 'ok' ? (t === 'periodic' ? 'نسبت به نسخه مبنا' : {unavailable: 'در این فایل نیست', incomplete: 'دریافت ناقص', no_baseline: 'مبنا ندارد'}[r.parts[t]] || '') : ''}</small></div>`).join('');

  const panel = () => `<section class="p c12 chg-panel" data-pid="changes" id="cmdChanges" aria-labelledby="chgH"><header><h3 id="chgH">از آخرین بازدید چه تغییر کرده؟</h3><span class="k">CHANGES · SINCE LAST VISIT</span></header><div id="chgBody" aria-live="polite"><div class="empty-state loading"><span class="spin"></span>در حال ساخت تصویر داده…</div></div></section>`;
  const ackBtn = (r) => `<button type="button" class="go chg-ack" ${!r || r.state === 'storage_off' ? 'disabled' : ''}>تا این لحظه بررسی شد</button>`;
  const ackNote = '<small class="chg-note">مبنا فقط در همین مرورگر و همین نشانی نگهداری می‌شود. بارگذاری یا تازه‌سازی صفحه آن را جلو نمی‌برد؛ فقط این دکمه، و فقط برای بخش‌هایی که واقعاً دریافت شده‌اند.</small>';
  const panelBody = (r) => {
    const top = r && r.state === 'ok' ? r.items.slice(0, 5) : [];
    const n = r && r.state === 'ok' ? r.items.length : null;
    return `${conflictBox(r)}<p class="lead chg-base">${baseLine(r)}</p><p class="chg-fetch">${fetchLine(r)}</p>${r && r.state === 'ok' ? `<p class="chg-comp">${completeLine(r)}</p>` : ''}
      <div class="chg-counts">${counts(r)}</div>
      ${r && r.state === 'ok' ? (n ? `<div class="chg-list">${top.map((i) => row(i)).join('')}</div>` : `<p class="chg-none">${r.complete ? 'نسبت به مبنا تغییری دیده نشد.' : 'در بخش‌هایی که مقایسه شدند تغییری دیده نشد؛ بخش‌های مقایسه‌نشده بالا آمده‌اند.'}</p>`) + (r.unverified.length ? `<p class="chg-note">${F.i(r.unverified.length)} مورد قابل مقایسه نیست (مثلاً در پاسخ سرور نیامده)؛ در صفحه تغییرات با فیلتر «قابل مقایسه نیست» دیده می‌شود.</p>` : '') : ''}
      <div class="chg-act">${ackNote}<button type="button" class="go" data-go="changes">دیدن همه تغییرات${n ? ' (' + F.i(n) + ')' : ''} ←</button>${ackBtn(r)}</div>`;
  };
  let conflict = null; // last refused acknowledgement, shown in the panel until resolved
  const doAck = async (btn, opt) => {
    if (btn) btn.disabled = true;
    const r = await CHG.ack(opt);
    if (btn) btn.disabled = false;
    if (!r.saved) { conflict = r.conflict ? r : null; TOAST(r.reason, 'bad'); listener(CHG.current); return; }
    conflict = null;
    TOAST('مبنا ثبت شد: ' + r.recorded.map((p) => (p === 'periodic' ? 'داده دوره‌ای' : partFa[p])).join('، ') + (r.skipped.filter((x) => x !== 'online-unavailable').length ? ' · ثبت‌نشده (دریافت ناموفق): ' + r.skipped.filter((x) => x !== 'online-unavailable').map((p) => partFa[p]).join('، ') : ''));
  };
  const conflictBox = (r) => {
    const ext = r && r.externalAck;
    if (!conflict && !ext) return '';
    const msg = conflict ? conflict.reason : 'مبنا در زبانه یا پنجره دیگری ثبت شد. مقایسه بالا با مبنای تازه است ولی تصویر داده این صفحه قدیمی‌تر است؛ برای ثبت دوباره، صفحه را تازه کنید.';
    return `<div class="chg-conflict" role="alert"><p>${esc(msg)}</p><button type="button" class="go chg-reload">تازه‌سازی صفحه</button>${conflict && conflict.conflict === 'data' ? '<button type="button" class="go chg-replace">جایگزینی آگاهانه مبنا با نسخه این صفحه</button>' : ''}</div>`;
  };
  const bind = (root) => {
    $$('.chg-ack', root).forEach((b) => b.onclick = () => doAck(b));
    $$('.chg-reload', root).forEach((b) => b.onclick = () => location.reload());
    $$('.chg-replace', root).forEach((b) => b.onclick = () => doAck(b, {replace: true}));
    $$('[data-go]', root).forEach((b) => b.onclick = () => go(b.dataset.go));
    $$('.chg-row', root).forEach((a) => a.onclick = (e) => { e.preventDefault(); open(a.dataset.chid); });
  };
  const open = (id) => { if (STATE.view !== 'changes') { STATE.view = 'changes'; STATE.full = ''; } STATE.chId = id; URLS.push(); render(); window.scrollTo(0, 0); };
  // a background refresh redraws in place: the reader's scroll position and focus are kept
  const listener = (r) => { const y = scrollY, fid = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.chid : null; const b = $('#chgBody'); if (b) { b.innerHTML = panelBody(r); bind(b); } if (STATE.view === 'changes' && $('#chgView')) drawView(); if (scrollY !== y) window.scrollTo(0, y); if (fid) { const n = document.querySelector(`.chg-row[data-chid="${CSS.escape(fid)}"]`); if (n) n.focus({preventScroll: true}); } };
  CHG.onChange(listener);
  const mount = () => { const b = $('#chgBody'); if (!b) return; if (CHG.current) { b.innerHTML = panelBody(CHG.current); bind(b); } CHG.ensure().catch((e) => { b.innerHTML = '<div class="empty-state">ساخت تصویر داده ناموفق بود: ' + esc(e.message) + '</div>'; }); };

  /* full page */
  const filtered = (r) => {
    if (!r || r.state !== 'ok') return [];
    const src = STATE.chRev === 'unverified' ? r.unverified : STATE.chRev === 'reviewed' ? ((r.ack && r.ack.items) || []).map((x) => ({...x, review: 'reviewed', importance: 'info', before: {text: x.before}, after: x.after ? {text: x.after} : null, absText: '—'})) : r.items;
    return src.filter((i) => (STATE.chDom === 'all' || i.dom === STATE.chDom) && (STATE.chType === 'all' || i.type === STATE.chType));
  };
  const detail = (r, i) => {
    const tr = (k, v) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`;
    return `<div class="chg-detail" id="chgDetail" tabindex="-1"><div class="chg-dh"><button type="button" class="go" id="chgBack">→ بازگشت به فهرست</button><span class="chg-imp chg-${i.importance}">${IMP[i.importance]}</span></div>
      <h3>${esc(i.title)}</h3><p class="lead">${esc(i.kindFa)} · ${esc(DOMN(i.dom))}${i.domFallback ? ' (حوزه این رکورد ثبت نشده؛ حکمرانی به‌طور پیش‌فرض)' : ''} · ${esc(CHG.TYPES[i.type])}</p>
      <table class="chg-t"><tbody>
      ${tr('شناسه تغییر', `<span class="mono">${esc(i.id)}</span>`)}${i.ref ? tr('رکورد یا رخداد مرتبط', `<span class="mono">${esc(i.ref.kind + ':' + i.ref.id)}</span>`) : ''}
      ${tr('قبل', esc(valText(i.before)))}${tr('بعد', esc(valText(i.after)))}
      ${tr('اختلاف مطلق', esc(i.absText || '—'))}${tr('درصد تغییر', esc(i.relText || '—'))}${tr('قابل مقایسه', i.comparable ? 'بله: واحد، دامنه، تعریف و نوع دوره یکسان است' : 'خیر')}
      ${i.severity ? tr('شدت فنی (DETECT_V1)', esc(i.severity)) : ''}${tr('اهمیت مدیریتی', esc(IMP[i.importance] + (i.importanceWhy ? ' — ' + i.importanceWhy : '')))}
      ${tr('منبع', esc(i.source || '—'))}${tr('زمان مشاهده داده', esc(CHG.timeFa(i.observedAt)))}${tr('زمان دریافت', esc(CHG.timeFa(i.fetchedAt)))}${tr('زمان مشاهده کاربر', esc(TEH(i.viewedAt || r.viewedAt)))}${i.freshness ? tr('تازگی', esc(i.freshness)) : ''}
      ${tr('توضیح تغییر', esc(i.why || '—'))}${tr('محدودیت تفسیر', esc(i.limit || '—'))}
      ${i.evidence && i.evidence.length ? tr('شاهد', i.evidence.map((e) => esc(e)).join('<br>')) : ''}
      ${tr('مبنای مقایسه', esc(r.baseline ? 'بررسی‌شده در ' + TEH(r.baseline.reviewedAt) : '—'))}
      </tbody></table>
      ${i.link ? `<p><a class="go" href="${esc(i.link.href)}">${esc(i.link.label)} ←</a></p>` : ''}</div>`;
  };
  const drawView = () => {
    const r = CHG.current, host = $('#chgView'); if (!host) return;
    const segs = (id, map, val) => `<div class="seg" id="${id}" role="group" aria-label="${id === 'chgType' ? 'نوع تغییر' : 'وضعیت بررسی'}">${Object.entries(map).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="${k === val}">${esc(v)}</button>`).join('')}</div>`;
    if (STATE.chId && r && r.state === 'ok') {
      const i = [...r.items, ...r.unverified].find((x) => x.id === STATE.chId);
      if (i) { host.innerHTML = detail(r, i); $('#chgBack').onclick = () => { if (history.state && history.length > 1 && (history.state.fromList)) history.back(); else { STATE.chId = ''; URLS.push(); render(); } }; setTimeout(() => { const d = $('#chgDetail'); if (d) d.focus({preventScroll: true}); }, 0); return; }
      host.innerHTML = `<div class="empty-state">این تغییر در تصویر فعلی نیست (ممکن است پس از ثبت مبنا دیگر تغییر محسوب نشود). <button type="button" class="go" id="chgBack">بازگشت به فهرست</button></div>`; $('#chgBack').onclick = () => { STATE.chId = ''; URLS.push(); render(); }; return;
    }
    const list = filtered(r);
    host.innerHTML = `<div class="p c12"><div class="chg-counts">${counts(r)}</div>${conflictBox(r)}<p class="lead chg-base">${baseLine(r)}</p><p class="chg-fetch">${fetchLine(r)}</p>${r && r.state === 'ok' ? `<p class="chg-comp">${completeLine(r)}</p>` : ''}
      <div class="chg-filters"><label>حوزه <select class="sel" id="chgDom"><option value="all">همه حوزه‌ها</option>${CHG.DOMS.map((d) => `<option value="${d}" ${STATE.chDom === d ? 'selected' : ''}>${esc(DOMN(d))}</option>`).join('')}</select></label>
      ${segs('chgType', {all: 'همه انواع', ...CHG.TYPES}, STATE.chType)}${segs('chgRev', REV, STATE.chRev)}</div>
      <p class="chg-note" aria-live="polite">${F.i(list.length)} مورد${STATE.chRev === 'reviewed' ? (r && r.ack ? ' · آخرین مرور ' + TEH(r.ack.at) + (r.ack.total > r.ack.items.length ? ` (${F.i(r.ack.items.length)} از ${F.i(r.ack.total)} نگه داشته شده)` : '') : ' · هنوز مروری ثبت نشده') : ''}</p>
      <div class="chg-list chg-full">${list.length ? list.map((i) => (STATE.chRev === 'reviewed' ? `<div class="chg-row chg-static"><span class="chg-imp chg-info">بررسی‌شده</span><span class="chg-main"><b>${esc(i.title)}</b><small>${esc(i.kindFa)} · ${esc(DOMN(i.dom))}</small><small class="chg-ba">قبل: ${esc(i.before.text || '—')} ← بعد: ${esc((i.after || {}).text || '—')}</small></span></div>` : row(i))).join('') : `<p class="chg-none">${r && r.state !== 'ok' ? 'مقایسه انجام نشد.' : (r.items.length?'موردی با این فیلترها نیست.':'نسبت به مبنا تغییری دیده نشد.')}</p>`}</div>
      <div class="chg-act">${ackNote}<button type="button" class="go" data-out-report="1">ساخت گزارش تغییرات</button>${ackBtn(r)}</div></div>`;
    $('#chgDom').onchange = (e) => { STATE.chDom = e.target.value; URLS.replace(true); drawView(); };
    ['chgType', 'chgRev'].forEach((id) => $$('#' + id + ' button').forEach((b) => b.onclick = () => { STATE[id === 'chgType' ? 'chType' : 'chRev'] = b.dataset.k; URLS.replace(true); drawView(); }));
    bind(host);
    $$('.chg-row[data-chid]', host).forEach((a) => a.onclick = (e) => { e.preventDefault(); try { history.replaceState({...(history.state || {}), y: scrollY}, ''); } catch (er) {} STATE.chId = a.dataset.chid; URLS.push({fromList: 1}); render(); window.scrollTo(0, 0); });
    const rb = $('[data-out-report]', host); if (rb) rb.onclick = () => { STATE.rptQ = 'گزارش تغییرات از آخرین بازدید'; go('report', {force: true}); };
  };
  V.changes = {
    title: 'تغییرات از آخرین بازدید', code: 'CHANGES',
    html: () => `<div class="vhead"><div><div class="code">CHANGES · SINCE LAST VISIT · ${CHG.POLICY}</div><h2>از آخرین بازدید چه تغییر کرده؟</h2><p>سه نوع تغییر جدا آمده است: داده‌های دوره‌ای، پایش آنلاین و وضعیت منابع. تغییر سلامت منبع، تغییر وضعیت شبکه نیست و عددی که تعریف، واحد، دامنه یا دوره‌اش هم‌سنجه نباشد، رشد یا افت نام نمی‌گیرد.</p></div></div><div id="chgView"><div class="empty-state loading"><span class="spin"></span>در حال ساخت تصویر داده…</div></div>`,
    // with data cached the list renders synchronously and restore() handles the scroll; after a cold load the scroll
    // position saved in history is applied once the data arrives
    draw: () => { if (CHG.current) drawView(); const y = CHG.current ? 0 : (history.state || {}).y; CHG.ensure().then(() => { if (y) requestAnimationFrame(() => window.scrollTo(0, y)); }).catch((e) => { const h = $('#chgView'); if (h) h.innerHTML = '<div class="empty-state">ساخت تصویر داده ناموفق بود: ' + esc(e.message) + '</div>'; }); },
  };
  return {panel, mount, open, drawView, IMP, REV};
})();

/* ===== assistant: answers from CHG.current (same object as the panel and the report); no language model, no web ===== */
const CHGQ = (() => {
  const match = (q) => {
    let kind = null;
    if (/(از )?(آخرین|اخرین) (بازدید|مرور)|از (بازدید|دفعه|مرور) (قبل|پیش)|(چه|چی|چیزی) (چیزی )?تغییر کرده|تغییرات (جدید|تازه)/.test(q)) kind = 'since';
    else if (/منبع|منابع/.test(q) && /(داده تازه نمی|دیگر داده|قطع|کهنه|دریافت نمی|نمی ?دهند|ناموفق)/.test(q)) kind = 'sources';
    else if (/رخداد/.test(q) && /(باز|بسته) (شده|شد|یا)|بر چه اساس|بسته شدن|بازشدن|باز شدن/.test(q)) kind = 'incidents';
    else if (/اصلاح آمار|عملکرد است یا|عملکرد یا اصلاح/.test(q)) kind = 'nature';
    return kind ? {h: {since: 'از آخرین بازدید چه تغییر کرده؟', sources: 'منابعی که داده تازه نمی‌دهند', incidents: 'رخدادهای باز و بسته‌شده', nature: 'عملکرد یا اصلاح آمار؟'}[kind], b: '<div class="chgq"><span class="spin"></span> در حال مقایسه با مبنای همین مرورگر…</div>', chg: kind} : null;
  };
  const tbl = (head, rows) => AI.tbl(head, rows);
  const base = (r) => (r.state !== 'ok' ? '' : `<p class="src">مبنای مقایسه: بررسی‌شده در ${TEH(r.baseline.reviewedAt)} (در همین مرورگر) · تصویر فعلی: ${TEH(r.viewedAt)} · ${(() => { const t = CHG.coverageText(r); return esc(t.label + (t.details.length ? ': ' + t.details.join('؛ ') : '')); })()}</p>`);
  const ev = (i) => `${esc(i.kindFa)} · <span class="mono">${esc(i.id)}</span>`;
  const row = (i) => [esc(i.title), ev(i), esc(i.before ? i.before.text : '—'), esc(i.after ? i.after.text : '—'), esc(i.absText || '—'), esc(CHG.timeFa(i.observedAt))];
  const H6 = ['مورد', 'نوع و شناسه', 'قبل', 'بعد', 'اختلاف', 'زمان مشاهده داده'];
  const answer = (r, kind) => {
    if (r.state === 'none') return '<p>هنوز مبنای مقایسه در این مرورگر ثبت نشده است، پس نمی‌توانم بگویم از آخرین بازدید چه تغییر کرده؛ تغییری هم ساخته نمی‌شود. در پنل «از آخرین بازدید چه تغییر کرده؟» با «تا این لحظه بررسی شد» مبنا ثبت می‌شود.</p>';
    if (r.state === 'corrupt') return '<p>مبنای ذخیره‌شده در این مرورگر خوانا نیست؛ مقایسه انجام نشد و چیزی حدس زده نمی‌شود.</p>';
    if (r.state === 'storage_off') return '<p>حافظه این مرورگر در دسترس نیست؛ مبنای مقایسه وجود ندارد و مقایسه ممکن نیست.</p>';
    const on = r.snapshot.online;
    if (kind === 'since') {
      const it = r.items;
      const by = Object.entries(CHG.TYPES).map(([t, n]) => `${n}: ${r.parts[t] === 'unavailable' ? 'در این فایل نیست' : r.parts[t] === 'no_baseline' ? 'مبنا ندارد' : F.i(r.counts[t])}`).join('، ');
      return `<p>${it.length ? `${F.i(it.length)} تغییر نسبت به مبنا: ${by}.` : r.complete ? 'نسبت به مبنا تغییری دیده نشد.' : 'در بخش‌هایی که مقایسه شدند تغییری دیده نشد.'}${r.unverified.length ? ` ${F.i(r.unverified.length)} مورد قابل مقایسه نیست.` : ''}</p>${it.length ? tbl(H6, it.slice(0, 12).map(row)) : ''}${it.length > 12 ? `<p>${F.i(it.length - 12)} مورد دیگر در صفحه تغییرات.</p>` : ''}${base(r)}<p class="src">تغییر سلامت منبع، تغییر وضعیت شبکه نیست؛ اصلاح آمار، تغییر عملکرد نیست.</p><p><button class="go" data-go="changes">صفحه تغییرات ←</button></p>`;
    }
    if (kind === 'sources') {
      if (!on.available) return '<p>این فایل آفلاین است و به سرور پایش وصل نیست؛ وضعیت دریافت منابع را نمی‌دانم. داده دوره‌ای فایل منبع زنده ندارد.</p>' + base(r);
      if (!on.parts.sources.ok) return `<p>فهرست منابع از سرور دریافت نشد (${esc(on.parts.sources.error || '')})؛ وضعیت منابع نامعلوم است و قطع دریافت فرض نشد.</p>` + base(r);
      const bad = Object.entries(on.sources).filter(([, s]) => s.status !== 'live');
      const ch = r.items.filter((i) => i.ref && i.ref.kind === 'source');
      return `<p>${bad.length ? F.i(bad.length) + ' منبع اکنون «دریافت فعال» نیست:' : 'همه منابع فهرست‌شده اکنون «دریافت فعال»‌اند.'}</p>${bad.length ? tbl(['منبع', 'وضعیت', 'آخرین دریافت موفق', 'آخرین تلاش', 'تازگی'], bad.map(([id, s]) => [esc(s.name), esc(s.status_fa), TEH(s.last_success), TEH(s.last_attempt), esc(s.freshness || '—')])) : ''}${ch.length ? '<h6>تغییر نسبت به مبنا</h6>' + tbl(H6, ch.map(row)) : '<p>نسبت به مبنا تغییر وضعیتی در منابع ثبت نشده است.</p>'}${base(r)}<p class="src">قطع یا کهنگی دریافت منبع، اختلال اینترنت نیست.</p>`;
    }
    if (kind === 'incidents') {
      if (!on.available) return '<p>این فایل آفلاین است و رخدادهای پایش آنلاین را ندارد؛ چیزی درباره باز یا بسته‌شدن رخداد نمی‌توانم بگویم.</p>' + base(r);
      if (!on.parts.incidents.ok) return `<p>فهرست رخدادها دریافت نشد (${esc(on.parts.incidents.error || '')})؛ وضعیت رخدادها نامعلوم است.</p>` + base(r);
      const ch = r.items.filter((i) => i.ref && i.ref.kind === 'incident');
      return `${ch.length ? tbl(['رخداد', 'نوع و شناسه', 'قبل', 'بعد', 'شدت فنی', 'شاهد'], ch.map((i) => [esc(i.title), ev(i), esc(i.before.text), esc(i.after.text), esc(i.severity || '—'), (i.evidence || []).slice(0, 4).map(esc).join('<br>')])) + ch.map((i) => `<p><b>${esc(i.title)}:</b> ${esc(i.why)} ${esc(i.limit)}</p>`).join('') : '<p>نسبت به مبنا رخدادی باز، بازیابی یا بسته نشده است.</p>'}${on.parts.incidents.all ? '' : '<p>فقط رخدادهای باز دریافت شد؛ بسته‌شدن‌ها قابل تشخیص نبود.</p>'}${base(r)}`;
    }
    const per = r.items.filter((i) => i.type === 'periodic');
    const g = (k) => per.filter((i) => i.kind === k);
    return `<p>از ${F.i(per.length)} تغییر داده دوره‌ای: انتشار دوره تازه ${F.i(g('new_period').length)}، اصلاح آمار همان دوره ${F.i(g('revision').length)}، تغییر تعریف یا واحد ${F.i(g('definition').length)}، داده دوره گذشته ${F.i(g('backfill').length)}، رکورد تازه ${F.i(g('added').length)} و حذف ${F.i(g('removed').length)}.</p><p>فقط «انتشار دوره تازه» با تعریف و واحد یکسان، تغییر در طول زمان است. «اصلاح آمار» عدد همان دوره را عوض کرده و تغییر عملکرد نیست؛ تغییر تعریف یا واحد هم‌سنجه نیست.</p>${per.length ? tbl(H6, per.slice(0, 12).map(row)) : ''}${base(r)}`;
  };
  const fill = async (t, kind) => {
    const box = t.querySelector('.chgq'); if (!box) return;
    try { const r = await CHG.ensure(); box.outerHTML = answer(r, kind); } catch (e) { box.outerHTML = '<p>مقایسه ناموفق بود: ' + esc(e.message) + '</p>'; }
  };
  return {match, fill, answer};
})();
