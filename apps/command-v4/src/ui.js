/* ===== v4 UI kit: URL state, tables, detail, panels, domain scorecards, explorer, online monitoring ===== */
const DOM_GAP = {
  communications: {need: 'ظرفیت و ترافیک هسته و انتقال، IXP، وابستگی مسیر و اختلال', out: 'توپولوژی و روند ظرفیت و مصرف'},
  information: {need: 'ظرفیت فعال مراکز داده، مصرف برق، اشغال، SLA و منابع ابر', out: 'نقشه ظرفیت و کارنامه بهره‌برداری'},
  base: {need: 'پایداری و کارایی DNS، CDN، جست‌وجو و پیام‌رسان؛ کاربران با تعریف یکسان', out: 'کارنامه خدمت و وابستگی زیرساختی'},
  applications: {need: 'دولت، پرداخت، تجارت، آموزش و سلامت؛ تراکنش موفق، دسترس‌پذیری و زمان پاسخ', out: 'نقشه خدمت و اثر اختلال'},
  security: {need: 'رخداد، شدت، زمان کشف، پاسخ و بازیابی، آسیب‌پذیری و پوشش کنترل', out: 'وضعیت امنیت در هر لایه'},
  governance: {need: 'هدف مصوب، مقدار مبنا، مسئول، موعد، پیشرفت و سند تحقق', out: 'ماتریس تکلیف و پیگیری اقدام'},
  people: {need: 'تجربه هم‌دوره، هزینه مؤثر، دهک، شهر و روستا و شکاف دسترسی', out: 'QoE و استطاعت با جامعه آماری روشن'},
};
const COLL = {off: {n: 'رسمی فصلنامه ۵۷', b: 'off'}, res: {n: 'شاهد پژوهشی', b: 'res'}, plat: {n: 'سکوها', b: 'usr'}, infra: {n: 'زیرساخت اطلاعاتی', b: 'usr'}, cand: {n: 'نامزد پژوهشی', b: 'res'}, src: {n: 'کاتالوگ منبع', b: 'calc'}};
const MECH_DOM = {M01: 'people', M02: 'governance', M03: 'communications', M04: 'people', M05: 'communications', M06: 'governance'};
const ALERT_DOM = {fixed: 'communications', provinces: 'communications', mobile: 'communications', quality: 'communications', platforms: 'base', research: 'people', infra: 'information'};
const DOM_TOOLS = {communications: ['fixed', 'mobile', 'quality', 'provinces', 'infra'], information: ['infra'], base: ['platforms', 'infra'], people: ['research', 'fixed'], applications: ['mobile', 'platforms'], security: ['online', 'research'], governance: ['registry', 'decision']};
const DOM_KPI = {communications: ['CRA57-MOB-1405', 'CRA57-MOBB-1405', 'CRA57-FIXBB-1405', 'CRA57-FIXEDTEL-1405', 'CRA57-RTT-fixed-international', 'CRA57-RURAL-CONN'], people: ['CRA57-COMP-FIXBB', 'CRA57-COMP-MOBILEVOICE', 'CRA57-COMP-FIXTEL'], applications: ['CRA57-VOICE-AVG', 'CRA57-SMS-AVG', 'CRA57-VOICE-TOTAL'], base: [], information: [], security: [], governance: []};

/* ---------- URL state (#view?key=value…) ---------- */
const DEFAULTS = {};
/* every URL parameter that selects data is checked against what exists; invalid values fall back to the default */
const VALID = {
  cmdMap: (v) => !!PROV_METRICS[v], pvMap: (v) => !!PROV_METRICS[v], prov: (v) => M.prov.some((p) => p.iso === v),
  mbMode: (v) => ['abs', 'share'].includes(v), tic: (v) => /^[a-z0-9_]{1,20}$/i.test(v),
  ninYear: (v) => NIN.YEARS.includes(v), ninGoal: (v) => v === 0 || !!NIN.byNo[v], ninDom: (v) => v === 'all' || !!DOM[v],
  ninSort: (v) => ['value', 'delta', 'no'].includes(v), ninBand: (v) => v === '' || !!NIN.BANDS[v],
  exKind: (v) => v === 'all' || !!COLL[v], exDom: (v) => v === 'all' || !!DOM[v], exEt: (v) => v === 'all' || !!ET[v],
  onRange: (v) => ['24h', '7d', '30d'].includes(v), onAsn: (v) => v === '' || /^(AS)?\d{1,10}$/i.test(v),
  evTheme: (v) => v === 'all' || !!THEME_FA[v], dmCross: (v) => v === '' || !!DOM[v],
  full: (v) => /^[a-z0-9-]{0,40}$/i.test(v), rec: (v) => String(v).length < 200, rptQ: (v) => String(v).length < 2000, chDom: (v) => v === 'all' || ['people', 'applications', 'base', 'information', 'communications', 'security', 'governance'].includes(v), chType: (v) => ['all', 'periodic', 'online', 'sources'].includes(v), chRev: (v) => ['new', 'unverified', 'reviewed'].includes(v), chId: (v) => String(v).length < 400,
};
const URLS = (() => {
  const SKIP = new Set(['view']);
  let t = null;
  const ser = () => {
    const p = new URLSearchParams();
    Object.entries(STATE).forEach(([k, v]) => {
      if (SKIP.has(k) || k === 'tbl' || v === undefined || v === null || v === '') return;
      if (typeof v === 'object') return;
      if (DEFAULTS[k] === v) return;
      p.set(k, v);
    });
    Object.entries(STATE.tbl || {}).forEach(([id, s]) => Object.entries(s).forEach(([kk, vv]) => { if (vv !== '' && vv !== undefined && vv !== null && !(kk === 'p' && vv === 1) && !(kk === 'd' && vv === -1) && !(kk === 'n' && vv === 50)) p.set(id + '.' + kk, vv); }));
    if (STATE.pvSort && !(STATE.pvSort.k === 'fthI' && STATE.pvSort.dir === -1)) p.set('pvs', STATE.pvSort.k + ':' + STATE.pvSort.dir);
    const q = p.toString();
    return '#' + STATE.view + (q ? '?' + q : '');
  };
  const parse = (hash) => {
    const h = (hash || '').replace(/^#/, '');
    const i = h.indexOf('?');
    const raw = i < 0 ? h : h.slice(0, i), qs = i < 0 ? '' : h.slice(i + 1);
    let view = raw; try { view = decodeURIComponent(raw); } catch (e) {}
    const out = {view: view || 'command', params: {}, tbl: {}};
    new URLSearchParams(qs || '').forEach((v, k) => {
      if (k.includes('.')) { const [id, kk] = k.split('.'); (out.tbl[id] = out.tbl[id] || {})[kk] = /^(p|n|d)$/.test(kk) ? +v || v : v; }
      else out.params[k] = v;
    });
    return out;
  };
  const apply = (st) => {
    const notes = [];
    Object.keys(DEFAULTS).forEach((k) => { if (k !== 'view' && k !== 'tbl') STATE[k] = DEFAULTS[k]; });
    STATE.tbl = st.tbl || {};
    STATE.pvSort = {k: 'fthI', dir: -1}; // object state is not in DEFAULTS; reset so a URL without pvs means the default order
    Object.entries(st.params).forEach(([k, v]) => {
      if (k === 'pvs') { const [kk, d] = v.split(':'); if (PROV_METRICS[kk] || /^(n|fthI|fthA|fthU|xA|lteA|bb|fibShare|telA)$/.test(kk)) STATE.pvSort = {k: kk, dir: +d === 1 ? 1 : -1}; else notes.push('ستون مرتب‌سازی «' + kk + '» معتبر نیست'); return; }
      if (!(k in DEFAULTS)) { notes.push('پارامتر ناشناخته «' + k + '» نادیده گرفته شد'); return; }
      const val = typeof DEFAULTS[k] === 'number' ? +v : v, chk = VALID[k];
      if (chk && !chk(val)) { notes.push('مقدار «' + v + '» برای «' + k + '» معتبر نیست؛ مقدار پیش‌فرض به‌کار رفت'); return; }
      STATE[k] = val;
    });
    if (!V[st.view]) { notes.push('بخش «' + st.view + '» وجود ندارد؛ نمای فرماندهی باز شد'); STATE.view = 'command'; } else STATE.view = st.view;
    return notes;
  };
  const replace = (immediate) => { clearTimeout(t); const f = () => { try { history.replaceState({...(history.state || {}), y: scrollY, url: ser()}, '', ser()); } catch (e) {} }; if (immediate) f(); else t = setTimeout(f, 300); };
  const push = (extra) => { try { history.replaceState({...(history.state || {}), y: scrollY}, '', location.hash); history.pushState({y: 0, ...extra}, '', ser()); } catch (e) {} };
  return {ser, parse, apply, replace, push};
})();

const TOAST = (msg, kind) => { const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.setAttribute('role', 'status'); el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 4200); };

/* ---------- paginated, sortable record table ---------- */
const TCOLS = {
  coll: {h: 'مجموعه', v: (r) => (COLL[r.coll] || {}).n, f: (r) => `<span class="badge ${(COLL[r.coll] || {}).b}">${esc((COLL[r.coll] || {}).n)}</span>${r.sub ? `<br><small class="dim">${CODE(r.sub)}</small>` : ''}`},
  dom: {h: 'حوزه مالک', v: (r) => (DOM[r.dom] || {}).n, f: (r) => `<span style="color:${(DOM[r.dom] || {}).c}">${esc((DOM[r.dom] || {}).n)}</span>${r.cross.length ? `<br><small class="dim">+ ${r.cross.map((c) => esc(DOM[c].n)).join('، ')}</small>` : ''}`},
  t: {h: 'عنوان', v: (r) => r.t, f: (r) => `<span class="wrapc">${esc(r.t)}</span><br><small class="mono dim">${esc(r.id)}</small>`, wrap: 1},
  v: {h: 'مقدار', v: (r) => (typeof r.v === 'number' ? r.v : r.v == null ? -Infinity : String(r.v)), f: (r) => VAL(r.v, r.u)},
  p: {h: 'دوره', v: (r) => r.p, f: (r) => `<small>${r.p ? CODE(r.p) : '—'}</small>`},
  et: {h: 'نوع شاهد', v: (r) => (ET[r.et] || {}).r, f: (r) => `<span class="et" style="--c:${(ET[r.et] || ET.unknown).c}">${esc((ET[r.et] || ET.unknown).n)}</span>`},
  adm: {h: 'پذیرش', v: (r) => r.adm, f: (r) => `<small>${esc((ADM[r.adm] || {}).n || r.adm)}</small>`},
  src: {h: 'منبع', v: (r) => r.src, f: (r) => `<small>${CODE_FA.isCode(r.src) ? CODE(r.src) : esc(LTXT(r.src||'',80))}</small>`, wrap: 1},
  lim: {h: 'محدودیت', v: (r) => r.lim[0] || '', f: (r) => `<small class="mut">${esc(String(r.lim[0] || '').slice(0, 140))}</small>`, wrap: 1},
};
const TBL = (el, rows, opt = {}) => {
  const id = opt.id;
  const st = (STATE.tbl[id] = Object.assign({q: '', p: 1, s: '', d: -1, n: 50}, STATE.tbl[id] || {}));
  const cols = opt.cols || ['coll', 'dom', 't', 'v', 'p', 'et', 'adm'];
  el.innerHTML = `${opt.search === false ? '' : `<div class="tools"><input class="search" type="search" aria-label="جست‌وجو در جدول" placeholder="${esc(opt.ph || 'جست‌وجو: عنوان، شناسه، منبع…')}" value="${esc(st.q)}"><span class="lead tcount"></span></div>`}<div class="tbox"><table class="t clk"><thead><tr>${cols.map((c) => `<th scope="col" data-c="${c}" tabindex="0" aria-sort="${st.s === c ? (st.d > 0 ? 'ascending' : 'descending') : 'none'}">${TCOLS[c].h}</th>`).join('')}</tr></thead><tbody></tbody></table></div><nav class="pager" aria-label="صفحه‌بندی"></nav>`;
  const tb = $('tbody', el), pg = $('.pager', el), cnt = $('.tcount', el), inp = $('input.search', el);
  const draw = () => {
    const q = (st.q || '').trim().toLowerCase();
    let L = q ? rows.filter((r) => [r.id, r.t, r.src, r.p, r.sub, (r.lim || []).join(' '), (ET[r.et] || {}).n, (DOM[r.dom] || {}).n].join(' ').toLowerCase().includes(q)) : rows.slice();
    if (st.s && TCOLS[st.s]) { const g = TCOLS[st.s].v; L.sort((a, b) => { const A = g(a), B = g(b); if (A === B) return 0; if (A == null) return 1; if (B == null) return -1; return (typeof A === 'number' && typeof B === 'number' ? A - B : String(A).localeCompare(String(B), 'fa')) * st.d; }); }
    const pages = Math.max(1, Math.ceil(L.length / st.n));
    if (st.p > pages) st.p = pages; if (st.p < 1) st.p = 1;
    const a = (st.p - 1) * st.n, page = L.slice(a, a + st.n);
    tb.innerHTML = page.map((r) => `<tr data-rk="${esc(r.k)}" tabindex="0">${cols.map((c) => `<td class="${TCOLS[c].wrap ? 'wrap' : ''}">${TCOLS[c].f(r)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${cols.length}" class="empty">رکوردی با این فیلتر پیدا نشد. جست‌وجو یا فیلتر را تغییر دهید.</td></tr>`;
    if (cnt) cnt.textContent = `${F.i(L.length)} رکورد${L.length !== rows.length ? ' از ' + F.i(rows.length) : ''}`;
    pg.innerHTML = L.length <= 10 ? '' : `<button data-p="1" ${st.p === 1 ? 'disabled' : ''} aria-label="نخستین صفحه">«</button><button data-p="${st.p - 1}" ${st.p === 1 ? 'disabled' : ''}>قبلی</button><span>صفحه <b>${F.i(st.p)}</b> از ${F.i(pages)} · ردیف ${F.i(L.length ? a + 1 : 0)} تا ${F.i(Math.min(a + st.n, L.length))}</span><button data-p="${st.p + 1}" ${st.p === pages ? 'disabled' : ''}>بعدی</button><button data-p="${pages}" ${st.p === pages ? 'disabled' : ''} aria-label="آخرین صفحه">»</button><select aria-label="تعداد ردیف در صفحه">${[25, 50, 100, 250].map((n) => `<option ${n === st.n ? 'selected' : ''} value="${n}">${F.i(n)} ردیف</option>`).join('')}</select>`;
    $$('button[data-p]', pg).forEach((b) => b.onclick = () => { st.p = +b.dataset.p; draw(); URLS.replace(true); el.scrollIntoView({block: 'nearest'}); });
    const sel = $('select', pg); if (sel) sel.onchange = () => { st.n = +sel.value; st.p = 1; draw(); URLS.replace(true); };
    $$('tr[data-rk]', tb).forEach((tr) => { tr.onclick = () => DETAIL.open(tr.dataset.rk); tr.onkeydown = (e) => { if (e.key === 'Enter') DETAIL.open(tr.dataset.rk); }; });
    if (opt.after) opt.after(L);
  };
  let tq = null;
  if (inp) inp.oninput = () => { st.q = inp.value; st.p = 1; clearTimeout(tq); tq = setTimeout(draw, 180); URLS.replace(); };
  $$('th[data-c]', el).forEach((th) => { const f = () => { const c = th.dataset.c; st.d = st.s === c ? -st.d : (c === 't' || c === 'src' ? 1 : -1); st.s = c; st.p = 1; $$('th', el).forEach((x) => x.setAttribute('aria-sort', 'none')); th.setAttribute('aria-sort', st.d > 0 ? 'ascending' : 'descending'); draw(); URLS.replace(true); }; th.onclick = f; th.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } }; });
  draw();
};

/* ---------- record detail: every field, provenance chain, JSON download, back ---------- */
const tree = (v, depth = 0) => {
  if (v === null || v === undefined) return '<span class="na">null</span>';
  if (Array.isArray(v)) return v.length ? `<ol class="tree">${v.map((x) => `<li>${tree(x, depth + 1)}</li>`).join('')}</ol>` : '<span class="dim">[]</span>';
  if (typeof v === 'object') return `<dl class="tree">${Object.entries(v).map(([k, x]) => `<dt>${esc(k)}</dt><dd>${tree(x, depth + 1)}</dd>`).join('')}</dl>`;
  if (typeof v === 'string' && /^https?:\/\//.test(v)) return `<a href="${esc(v)}" target="_blank" rel="noopener noreferrer" class="lnk">${esc(v)}</a>`;
  return CODE_FA.isCode(v) ? `<span>${esc(v)}</span> <small class="codefa">(${esc(CODE_FA.fa(v))})</small>` : `<span>${esc(v)}</span>`;
};
/* the most recently opened overlay (record detail or assistant) is always on top, also over a full-screen panel */
const LAYER = {z: 86, top(el) { if (el) el.style.zIndex = String(++LAYER.z); }};
const DETAIL = (() => {
  let cur = null, lastFocus = null, pushed = null; // pushed: record key this page itself pushed onto history
  const row = (k, v) => `<div><span>${k}</span><b>${v || '—'}</b></div>`;
  const html = (r) => {
    const ch = CHAIN.forRec(r);
    const link = (u) => (u && /^https?:\/\//.test(u) ? `<a class="lnk" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a>` : '');
    const sec = (title, arr, f) => (arr.length ? `<div class="dt-sec"><h5>${title} · ${F.i(arr.length)}</h5><ul>${arr.map(f).join('')}</ul></div>` : '');
    return `<header><span class="orb" style="background:${(DOM[r.dom] || DOM.unassigned).c};box-shadow:none"></span><div><b id="dtTitle">${esc(r.t)}</b><small class="mono">${esc(r.k)}</small></div><button class="x" id="dtX" aria-label="بستن و بازگشت">×</button></header>
    <div class="msgs" tabindex="-1">
      <div class="dt-val">${VAL(r.v, r.u)}</div>
      <div class="dt-grid">
        ${row('شناسه', `<span class="mono">${esc(r.id)}</span>`)}${row('مجموعه', esc((COLL[r.coll] || {}).n) + (r.sub ? ' · ' + CODE(r.sub) : ''))}
        ${row('حوزه مالک', `<span style="color:${(DOM[r.dom] || {}).c}">${esc((DOM[r.dom] || {}).n)}</span>`)}${row('ارتباط متقاطع', r.cross.map((c) => esc(DOM[c].n)).join('، ') || 'ندارد')}
        ${row('نوع شاهد', esc((ET[r.et] || ET.unknown).n))}${row('وضعیت پذیرش', esc(ch.admission))}
        ${row('تعریف سنجه', esc(r.def || r.t))}${row('مقدار و واحد', r.v == null ? 'ناموجود' : esc(String(r.v)) + ' ' + esc(r.u || ''))}
        ${row('دوره', esc(r.p))}${row('جامعه و مخرج', esc(r.pop))}
        ${row('محدوده جغرافیایی', esc(r.geo || (r.coll === 'off' ? 'کل کشور' : 'در منبع تصریح نشده')))}${row('روش', esc(r.method))}
        ${row('منبع', esc(r.src))}${row('محل استخراج', esc(r.loc))}
        ${row('تاریخ دریافت', esc(r.got || 'ثبت نشده'))}${row('قاعده نگاشت حوزه', `<span class="mono">${esc(r.rule)}</span>`)}
      </div>
      ${r.url ? `<div class="dt-sec"><h5>پیوند منبع</h5><p>${link(r.url)}</p></div>` : ''}
      ${r.lim.length ? `<div class="dt-sec"><h5>محدودیت و هشدار تفسیر</h5><ul>${r.lim.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
      <div class="dt-sec chain"><h5>زنجیره منشأ: ادعا ← شاهد ← منبع ← رابطه ← تعارض ← پذیرش</h5>
        ${ch.dossiers.length ? `<p class="mut">پرونده: ${ch.dossiers.map(esc).join('، ')}</p>` : ''}
        ${sec('ادعاهای متکی به این شاهد', ch.claims, (c) => `<li><b>${esc(c.claim_id)}</b> ${esc(c.claim_text)} <small class="dim">(${esc(c.confidence)} · ${CODE(c.status)})</small></li>`)}
        ${sec('ردیف رجیستر شواهد', ch.evidence, (e) => `<li><b>${esc(e.evidence_id)}</b> ${esc(e.claim_or_observation)} · ${esc(e.figure)} ${esc(e.unit)} <small class="dim">${CODE(e.verification_status)}</small></li>`)}
        ${sec('منبع اولیه ثبت‌شده', ch.sources, (s) => `<li><b>${esc(s.source_id)}</b> ${esc(s.title)} — ${esc(s.publisher)} <small class="dim">${CODE(s.retrieval_status)}</small> ${link(s.url)}</li>`)}
        ${sec('کاتالوگ منبع', ch.catalog, (c) => `<li><b>${esc(c.catalog_id)}</b> ${esc(c.title)} <small class="dim">نقش: ${CODE(c.provenance_role)} · ${CODE(c.verification_status)}</small></li>`)}
        ${sec('روابط (اصل، بازنشر، تحلیل مشتق)', ch.relations, (x) => `<li><span class="mono">${esc(x.from_catalog_id)}</span> <b>${CODE(x.relation_type)}</b> <span class="mono">${esc(x.to_catalog_id)}</span> <small class="dim">${esc(x.explanation)}</small></li>`)}
        ${sec('خانواده همان مطالعه (شاهد مستقل جداگانه نیستند)', ch.study, (c) => `<li><b>${esc(c.catalog_id)}</b> ${esc(c.title)} <small class="dim">${CODE(c.provenance_role)}</small></li>`)}
        ${sec('تعارض‌های مرتبط', ch.conflicts, (c) => `<li><b>${esc(c.conflict_id)}</b> ${esc(c.topic)}: ${esc(c.conflict_description)} <small class="dim">${CODE(c.resolution_status)}</small></li>`)}
        <p><b>وضعیت پذیرش:</b> ${esc(ch.admission)}</p>
        ${!ch.claims.length && !ch.sources.length && !ch.catalog.length && !ch.relations.length ? '<p class="dim">برای این رکورد پیوند صریحی در رجیسترهای ادعا، منبع یا رابطه ثبت نشده است.</p>' : ''}
      </div>
      <details class="dt-sec"><summary>اصل کامل رکورد (همه فیلدها، تودرتو)</summary><p class="dim">متن اصلی منبع به زبان فارسی؛ توضیحات ترجمه‌شده در بالا آمده است.</p><div data-no-translate lang="fa" dir="rtl">${tree(r.raw)}</div></details>
      <div class="dt-act"><button class="go" id="dtBack">← بازگشت</button><button class="go" id="dtJson">دریافت JSON رکورد</button><button class="go" id="dtLink">رونوشت پیوند مستقیم</button><button class="go" id="dtAsk">پرسش از دستیار درباره این رکورد</button></div>
    </div>`;
  };
  const show = (r) => {
    cur = r; lastFocus = document.activeElement;
    const el = $('#detail'); LAYER.top(el); el.innerHTML = html(r); const modal = innerWidth < 1200; el.classList.add('open'); el.setAttribute('aria-modal', String(modal)); el.setAttribute('role', 'dialog'); el.setAttribute('aria-labelledby', 'dtTitle');
    $('#scrim').hidden = !modal;
    $('#dtX').onclick = close; $('#dtBack').onclick = close;
    $('#dtJson').onclick = () => { const b = new Blob([JSON.stringify({record_key: r.k, owner_domain: r.dom, cross_domains: r.cross, evidence_type: r.et, admission: r.adm, mapping_rule: r.rule, provenance: CHAIN.forRec(r), raw: r.raw}, null, 2)], {type: 'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = r.id.replace(/[^\w.-]+/g, '_') + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
    $('#dtLink').onclick = () => { const u = location.href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => TOAST('پیوند رونوشت شد')).catch(() => TOAST(u)); };
    $('#dtAsk').onclick = () => { AIUI.ask('درباره رکورد ' + r.id + ' («' + r.t + '») توضیح بده: معنای عدد، منبع، محدودیت و اینکه با چه چیزی قابل مقایسه است.'); };
    setTimeout(() => $('#dtX').focus(), 30);
  };
  const hide = () => { $('#detail').classList.remove('open'); if (!$('#ai').classList.contains('open')) $('#scrim').hidden = true; cur = null; if (lastFocus && lastFocus.focus) lastFocus.focus(); };
  const open = (k) => { const r = REC.byId[k]; if (!r) { TOAST('رکورد «' + k + '» پیدا نشد', 'bad'); return; } STATE.rec = r.k; URLS.push({rec: r.k}); pushed = r.k; show(r); };
  const close = () => { if (cur && pushed === cur.k && history.state && history.state.rec === cur.k) { pushed = null; history.back(); } else { pushed = null; STATE.rec = ''; hide(); URLS.replace(true); } };
  return {open, openId: open, openRec: (r) => r && open(r.k), show, hide, close, isOpen: () => !!cur};
})();
const bindRows = (root) => $$('[data-rk]', root).forEach((x) => { x.onclick = (e) => { e.preventDefault(); DETAIL.open(x.dataset.rk); }; });

/* ---------- expandable panels ---------- */
const PANELS = {
  /* panels are addressed by a stable key (data-pid from the panel code, + occurrence), not by position.
     mark() runs BEFORE draw(), so a full-screen panel is measured and drawn at its full width. */
  mark: () => {
    const seen = {};
    $$('#views .p').forEach((p) => {
      const base = p.dataset.pid || 'panel'; seen[base] = (seen[base] || 0) + 1;
      p.dataset.key = seen[base] > 1 ? base + '-' + seen[base] : base;
      if (STATE.full && STATE.full === p.dataset.key) p.classList.add('full');
    });
  },
  decorate: () => {
    PANELS.mark();
    $$('#views .p').forEach((p) => {
      const h = $('header', p); if (!h || $('.pfull', h)) return;
      const key = p.dataset.key;
      const b = document.createElement('button'); b.className = 'pfull'; b.type = 'button'; b.setAttribute('aria-label', 'بزرگ‌نمایی پنل'); b.title = 'بزرگ‌نمایی (Esc برای خروج)'; b.textContent = '⤢';
      b.onclick = () => { STATE.full = STATE.full === key ? '' : key; render(true); URLS.replace(true); if (STATE.full) setTimeout(() => { const f = $('#views .p.full .pfull'); if (f) f.focus(); }, 30); };
      h.appendChild(b);
      const h3 = $('h3', h), k = $('.k', h); if (h3 && k) h3.dataset.print = k.textContent;
      if (STATE.full === key) { p.classList.add('full'); p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); b.textContent = '⤡'; b.setAttribute('aria-label', 'خروج از بزرگ‌نمایی'); }
    });
    if (STATE.full && !$('#views .p.full')) STATE.full = '';
    document.body.classList.toggle('has-full', !!STATE.full);
  },
};

/* ---------- domain scorecards (primary navigation) ---------- */
const domRecs = (d, withCross) => REC.list.filter((r) => r.coll !== 'src' && (r.dom === d || (withCross && r.cross.includes(d))));
DOM_ORDER.forEach((d) => {
  V['d-' + d] = {
    title: DOM[d].n, code: 'DOMAIN · ' + d.toUpperCase(), domain: d,
    html: () => {
      const own = domRecs(d), cross = REC.list.filter((r) => r.coll !== 'src' && r.cross.includes(d));
      const ets = d3.rollups(own, (v) => v.length, (r) => r.et).sort((a, b) => (ET[a[0]] || ET.unknown).r - (ET[b[0]] || ET.unknown).r);
      const offN = own.filter((r) => r.et === 'official').length;
      const mechs = D.bridge.filter((b) => MECH_DOM[b.mechanism_id] === d);
      const signals = ALERTS.filter((a) => ALERT_DOM[a.view] === d);
      const dossiers = Object.entries(DOSSIER).filter(([, v]) => v[0] === d).map(([k]) => k);
      const gaps = D.reg.gaps.filter((g) => dossiers.includes(g.dossier));
      const confl = D.reg.conflicts.filter((c) => dossiers.some((x) => String(c.dossier_ids).includes(x)));
      const kp = (DOM_KPI[d] || []).filter((id) => KPI[id]);
      const status = offN > 20 ? ['داده رسمی دارد', 'off'] : own.length > 30 ? ['داریم، تأیید نشده', 'usr'] : own.length ? ['داده اندک', 'usr'] : ['نداریم', 'res'];
      return `
      <div class="vhead"><div><div class="code">DOMAIN SCORECARD · ${esc(DOM[d].i)} · ${esc(d.toUpperCase())}</div><h2 style="color:${DOM[d].c}">کارنامه حوزه ${DOM[d].n}</h2>
      <p>${DOM[d].d}. ${F.i(own.length)} رکورد مالک و ${F.i(cross.length)} رکورد با ارتباط متقاطع. پرونده‌های پژوهشی این حوزه: ${dossiers.map((x) => x + ' (' + DOSSIER[x][1] + ')').join('، ') || '—'}. شمار رکورد برابر شمار شاخص مستقل یا داده تأییدشده نیست.</p></div>
      <div class="chips"><span class="badge ${status[1]}">${status[0]}</span></div></div>
      ${kp.length ? `<div class="strip" data-n="${Math.min(6, kp.length)}">${kp.map((id) => { const k = KPI[id]; return kpiTile({rid: 'off:' + id, t: k.l, k: 'P' + k.pg, v: F.big(k.v).split(' ')[0], u: (F.big(k.v).split(' ')[1] || '') + ' ' + (k.u || ''), d: esc(k.p) + ' · فصلنامه ۵۷', st: DOM[d].c}); }).join('')}</div>` : `<p class="take">برای این حوزه شاخص رسمی منتشرشده‌ای در داده‌های رادار نیست؛ آنچه هست پژوهشی، نامزد یا گزارش ناشر است و جای KPI مدیریتی را نمی‌گیرد.</p>`}
      <div class="g">
        ${panel('c7', 'COMMAND PATH', 'مسیر فرماندهی: مسئله ← شاهد ← منبع ← مسئول ← اقدام ← نتیجه', 'هر سطر از داده محاسبه یا از رجیستر خوانده شده؛ مسئول، مقدار مبنا و هدف تا تأیید رسمی «تأییدنشده» می‌مانند.', `<div class="cpath">${(signals.length ? signals : [{t: 'سیگنال محاسبه‌شده‌ای برای این حوزه نیست', s: 'شکاف داده: ' + DOM_GAP[d].need, code: '—'}]).slice(0, 4).map((a) => `<div class="cp"><b>مسئله</b><span>${esc(a.t)}</span><small>${esc(a.s)}</small><em class="mono">${esc(a.code)}</em></div>`).join('')}
          ${mechs.map((m) => `<div class="cp act"><b>اقدام پیشنهادی ${esc(m.mechanism_id)} <span class="prio ${esc(m.priority)}">${esc(m.priority)}</span></b><span>${esc(m.proposed_action)}</span><small>شاهد: ${esc([m.user_evidence_id, ...(m.technical_evidence_ids || [])].filter(Boolean).join('، '))} · مسئول: ${m.owner === 'NOT_VALIDATED' ? 'تأیید نشده' : esc(m.owner)} · دروازه: ${CODE(m.decision_gate)}</small><small>نتیجه: سنجه ارزیابی «${esc(m.evaluation_indicator_definition)}»؛ مقدار مبنا ${m.baseline_kpi == null ? 'ندارد' : esc(m.baseline_kpi)} و هدف ${m.target_kpi == null ? 'تأیید نشده' : esc(m.target_kpi)}.</small></div>`).join('') || '<div class="cp"><b>اقدام</b><span>برای این حوزه سازوکار و اقدام پیشنهادی ثبت نشده است.</span></div>'}</div>`, B.calc)}
        ${panel('c5', 'EVIDENCE MIX', 'ترکیب نوع شاهد در این حوزه', 'آمار رسمی، اندازه‌گیری، پیمایش، ادعای ناشر، خبر و مدل در یک سطح اعتبار قرار نمی‌گیرند.', `<div class="ch" id="dmEt"></div><div class="tools">${DOM_TOOLS[d].map((v) => `<button class="go" data-go="${v}">${esc(V[v] ? V[v].title : v)} ←</button>`).join('')}</div>`)}
        ${panel('c12', 'RECORDS', 'رکوردهای حوزه', 'حوزه مالک؛ با گزینه زیر رکوردهای دارای ارتباط متقاطع هم نمایش داده می‌شوند. روی هر ردیف بزنید تا شناسنامه کامل باز شود.', `<div class="tools"><label class="chk"><input type="checkbox" id="dmCross" ${STATE.dmCross === 'on' ? 'checked' : ''}> شامل ارتباط متقاطع</label></div><div id="dmT"></div>`)}
        ${panel('c6', 'GAPS', 'شکاف داده و درخواست‌ها', '', `<div class="evl"><div class="ev"><div><b>نیاز آماری حوزه</b><small class="mut">${esc(DOM_GAP[d].need)}</small><small>خروجی مناسب: ${esc(DOM_GAP[d].out)}</small></div></div>${gaps.map((g) => `<div class="ev"><div><b>${esc(g.request_id)} · ${esc(g.required_dataset)}</b><small class="mut">${esc(g.dossier)} · ${esc(g.minimum_granularity)} · ${esc(g.verification_gate)}</small></div><div class="val"><span class="prio ${esc(g.priority)}">${esc(g.priority)}</span></div></div>`).join('')}</div>`, '<span class="badge calc">گزارش ممیزی و رجیستر درخواست داده</span>')}
        ${panel('c6', 'CONFLICTS', 'تعارض‌های منابع در پرونده‌های این حوزه', '', confl.length ? `<div class="evl">${confl.map((c) => `<div class="ev"><div><b>${esc(c.conflict_id)} · ${esc(c.topic)}</b><small class="mut">${esc(c.source_a)} ↔ ${esc(c.source_b)}</small><small>${esc(c.conflict_description)}</small></div><div class="val"><span class="badge usr">${CODE(c.resolution_status)}</span></div></div>`).join('')}</div>` : '<p class="lead">تعارضی برای پرونده‌های این حوزه ثبت نشده است.</p>', B.res)}
      </div>`;
    },
    draw: () => {
      const own = domRecs(d);
      const ets = d3.rollups(own, (v) => v.length, (r) => r.et).sort((a, b) => (ET[a[0]] || ET.unknown).r - (ET[b[0]] || ET.unknown).r);
      K.hbar($('#dmEt'), ets.map(([k, n]) => ({l: (ET[k] || ET.unknown).n, v: n, c: (ET[k] || ET.unknown).c, t: F.i(n) + ' رکورد'})), {bar: 14, gp: 8});
      const drawT = () => TBL($('#dmT'), domRecs(d, STATE.dmCross === 'on'), {id: 'dm', cols: ['coll', 't', 'v', 'p', 'et', 'adm', 'src']});
      $('#dmCross').onchange = (e) => { STATE.dmCross = e.target.checked ? 'on' : ''; STATE.tbl.dm = {...(STATE.tbl.dm || {}), p: 1}; drawT(); URLS.replace(true); };
      drawT();
      $$('[data-go]', $('#views')).forEach((b) => b.onclick = () => go(b.dataset.go));
    },
  };
});

/* ---------- architecture overview (replaces v3 'domains' page) ---------- */
V.domains = {
  title: 'معماری هفت حوزه', code: 'ARCHITECTURE',
  html: () => {
    const card = (d) => { const o = domRecs(d), off = o.filter((r) => r.et === 'official').length; return `<button class="dl" data-go="d-${d}" style="--dc:${DOM[d].c}"><span class="dl-i mono">${DOM[d].i}</span><div class="dl-b"><b>${DOM[d].n}</b><small>${DOM[d].d}</small><div class="dl-n"><span class="num">${F.i(o.length)}</span> رکورد مالک · رسمی ${F.i(off)} · متقاطع ${F.i(REC.list.filter((r) => r.cross.includes(d)).length)}</div>${o.length ? VZ.split(d3.rollups(o, (v) => v.length, (r) => r.et).sort((a, b) => (ET[a[0]] || ET.unknown).r - (ET[b[0]] || ET.unknown).r).map(([k, n]) => ({n: ET_SHORT[k] || (ET[k] || ET.unknown).n.split(' ')[0], v: n, c: (ET[k] || ET.unknown).c || C.dim}))) : ''}<p><b>شکاف:</b> ${DOM_GAP[d].need}</p></div></button>`; };
    const un = REC.list.filter((r) => r.dom === 'unassigned');
    return `<div class="vhead"><div><div class="code">ARCHITECTURE · 5 LAYERS + 2 CROSS-CUTTING</div><h2>معماری پایش شبکه ملی اطلاعات</h2><p>هر رکورد یک حوزه مالک و در صورت لزوم ارتباط متقاطع دارد. نگاشت با قاعده صریح انجام شده (رجیستر حوزه مخزن یا جدول پرونده ← حوزه) و رکورد بدون نگاشت «تعیین‌نشده» می‌ماند. روی هر حوزه بزنید تا کارنامه آن باز شود.</p></div></div>
    <div class="dstack"><div class="dlayers">${['people', 'applications', 'base', 'information', 'communications'].map(card).join('')}</div><div class="dcross">${['security', 'governance'].map(card).join('')}</div></div>
    <div class="g">${panel('c7', 'COVERAGE MATRIX', 'پوشش داده: حوزه × نوع شاهد', 'شمار رکورد مالک در هر خانه؛ روی خانه بزنید تا رکوردها در کاوشگر باز شوند.', `<div class="ch" id="dmHeat"></div>`, B.calc)}
    ${panel('c5', 'UNASSIGNED · ' + un.length, 'رکوردهای تعیین‌نشده', 'این رکوردها نگاشت صریح ندارند و به‌جای حدس، این‌جا نگه داشته می‌شوند.', `<div id="unT"></div>`)}
    ${panel('c12', 'MAPPING RULES', 'جدول نگاشت پرونده ← حوزه (DOSSIER_MAP_V1)', 'خوشه‌ها و پرونده‌ها از taxonomy_v3 مخزن پژوهشی؛ برای رکوردهای چندپرونده‌ای، پرونده نخست مالک و بقیه ارتباط متقاطع‌اند.', `<div class="tbox"><table class="t"><thead><tr><th>پرونده</th><th>عنوان</th><th>حوزه مالک</th><th>رکورد</th></tr></thead><tbody>${Object.entries(DOSSIER).map(([k, [dm, n]]) => `<tr><td class="mono">${k}</td><td>${esc(n)}</td><td style="color:${DOM[dm].c}">${DOM[dm].n}</td><td class="num">${F.i(REC.list.filter((r) => String(r.rule).split(':')[1] && String(r.rule).split(':')[1].split(',')[0] === k).length)}</td></tr>`).join('')}</tbody></table></div>`)}</div>`;
  },
  draw: () => {
    $$('[data-go]', $('#views')).forEach((b) => b.onclick = () => go(b.dataset.go));
    const ets = Object.keys(ET).filter((e) => REC.list.some((r) => r.et === e && r.coll !== 'src'));
    K.heat($('#dmHeat'), DOM_ORDER.map((d) => ({k: d, n: DOM[d].n})), ets.map((e) => ({k: e, n: ET[e].n.split(' ')[0]})), (r, c) => REC.list.filter((x) => x.coll !== 'src' && x.dom === r.k && x.et === c.k).length, {cell: 30, color: C.ice, click: (r, c) => { STATE.exDom = r.k; STATE.exEt = c.k; STATE.exKind = 'all'; go('explorer'); }});
    TBL($('#unT'), REC.list.filter((r) => r.dom === 'unassigned'), {id: 'un', cols: ['coll', 't', 'src'], ph: 'جست‌وجو در تعیین‌نشده‌ها…'});
  },
};

/* ---------- explorer ---------- */
V.explorer = {
  title: 'کاوشگر', code: 'EXPLORER',
  html: () => `<div class="vhead"><div><div class="code">ALL COLLECTIONS · ${F.i(REC.list.length)} RECORDS · ${F.i(new Set(REC.list.map((r) => r.id)).size)} IDS</div><h2>کاوشگر همه رکوردها</h2>
    <p>همه رکوردها بدون سقف نمایش، با صفحه‌بندی و مرتب‌سازی. فیلترها، جست‌وجو، مرتب‌سازی و صفحه در نشانی صفحه ثبت می‌شوند؛ بازخوانی یا پیوند مستقیم همین وضعیت را بازمی‌سازد.</p></div></div>
    <section class="p" data-pid="explorer"><header><h3>همه رکوردها</h3><span class="k">EXPLORER</span></header><div class="tools"><div class="seg" id="exSeg" role="group" aria-label="مجموعه"></div><button class="go" id="exClear" type="button" hidden>پاک‌کردن همه فیلترها ×</button></div><div class="tools"><div class="seg" id="exDom" role="group" aria-label="حوزه"></div></div><div class="tools"><div class="seg" id="exEt" role="group" aria-label="نوع شاهد"></div></div><div id="exT"></div></section>`,
  draw: () => {
    const kinds = [['all', 'همه'], ...Object.entries(COLL).map(([k, v]) => [k, v.n])];
    const base = () => REC.list.filter((r) => (STATE.exKind === 'all' || r.coll === STATE.exKind) && (STATE.exDom === 'all' || r.dom === STATE.exDom || (STATE.exDom !== 'unassigned' && r.cross.includes(STATE.exDom))) && (STATE.exEt === 'all' || r.et === STATE.exEt));
    const seg = (el, items, key) => { el.innerHTML = items.map(([k, n, c]) => `<button data-k="${k}" aria-pressed="${k === STATE[key]}" ${c ? `style="color:${c}"` : ''}>${n}</button>`).join(''); $$('button', el).forEach((b) => b.onclick = () => { STATE[key] = b.dataset.k; STATE.tbl.ex = {...(STATE.tbl.ex || {}), p: 1}; V.explorer.draw(); URLS.replace(true); }); };
    seg($('#exSeg'), kinds.map(([k, n]) => [k, n + ' · ' + F.i(k === 'all' ? REC.list.length : REC.list.filter((r) => r.coll === k).length)]), 'exKind');
    seg($('#exDom'), [['all', 'همه حوزه‌ها'], ...[...DOM_ORDER, 'unassigned'].map((k) => [k, DOM[k].n, DOM[k].c])], 'exDom');
    seg($('#exEt'), [['all', 'همه انواع شاهد'], ...Object.entries(ET).map(([k, v]) => [k, v.n])], 'exEt');
    const busy = STATE.exKind !== 'all' || STATE.exDom !== 'all' || STATE.exEt !== 'all' || ((STATE.tbl.ex || {}).q || '') !== '';
    $('#exClear').hidden = !busy;
    $('#exClear').onclick = () => { STATE.exKind = STATE.exDom = STATE.exEt = 'all'; STATE.tbl.ex = {p: 1}; URLS.replace(true); V.explorer.draw(); };
    TBL($('#exT'), base(), {id: 'ex', cols: ['coll', 'dom', 't', 'v', 'p', 'et', 'adm', 'src']});
  },
};

/* ---------- online monitoring ---------- */
/* Registry mirrors apps/api/app/online/registry.py. Verified = endpoint documented by provider docs or provider-maintained code (see docs/V4_SOURCES.md). */
const ONLINE_SOURCES = [
  {id: 'ioda', n: 'IODA (Georgia Tech)', what: 'نشانه‌های اتصال کشور/ASN: BGP، پینگ فعال /24، تلسکوپ؛ رخداد و هشدار', ep: 'api.ioda.inetintel.cc.gatech.edu/v2/signals/raw · /outages/events · /outages/alerts', auth: 'ندارد', freq: '۱۵ دقیقه', status: 'temp_fail', note: 'روش دریافت از مستندات و کد مرجع احراز شد؛ از محیط توسعه به میزبان دسترسی شبکه نبود'},
  {id: 'ooni', n: 'OONI', what: 'نتایج آزمون دسترسی: ناهنجاری، تأییدشده، شکست آزمون و موفق به تفکیک روز و ASN', ep: 'api.ooni.io/api/v1/aggregation', auth: 'ندارد (سهمیه بر پایه IP)', freq: 'روزانه', status: 'temp_fail', note: 'پارامترها از کد backend رسمی OONI احراز شد؛ دسترسی شبکه از محیط توسعه نبود'},
  {id: 'ripestat', n: 'RIPEstat', what: 'شمار ASN ثبت‌شده و مسیریابی‌شده کشور', ep: 'stat.ripe.net/data/country-asns/data.json', auth: 'ندارد (استفاده غیرتجاری)', freq: '۸ ساعت', status: 'temp_fail', note: 'مستند رسمی خوانده شد؛ ساختار پاسخ در صفحه مستند خالی است و مبدل آن را سخت‌گیرانه اعتبارسنجی می‌کند'},
  {id: 'atlas', n: 'RIPE Atlas', what: 'شمار پروب‌های متصل در کشور (پوشش نقطه دید)', ep: 'atlas.ripe.net/api/v2/probes/', auth: 'برای خواندن عمومی لازم نیست', freq: '۶ ساعت', status: 'temp_fail', note: 'نبود پروب یا نمونه، سلامت شبکه نیست'},
  {id: 'cloudflare', n: 'Cloudflare Radar', what: 'رخدادهای اختلال و ناهنجاری اعلام‌شده', ep: 'api.cloudflare.com/client/v4/radar/annotations/outages', auth: 'توکن API', freq: '۱ ساعت', status: 'needs_key', note: 'پارامترها از SDK رسمی Cloudflare احراز شد'},
  {id: 'tor', n: 'Tor Metrics', what: 'برآورد روزانه کاربران مستقیم و پل Tor با کران انتظار', ep: 'metrics.torproject.org/userstats-relay-country.csv', auth: 'ندارد', freq: 'روزانه', status: 'archive', note: 'داده تعبیه‌شده ژوئن–ژوئیه ۲۰۲۵ (کاربران تخمینی پل) آرشیوی است؛ دریافت تازه از محیط توسعه ممکن نبود'},
  {id: 'mlab', n: 'M-Lab (NDT)', what: 'سنجش عملکرد کاربران داوطلب', ep: 'BigQuery: measurement-lab', auth: 'حساب و پروژه Google Cloud', freq: '—', status: 'needs_key', note: 'دسترسی از طریق BigQuery؛ نمونه داوطلبانه و دارای سوگیری'},
  {id: 'arvan', n: 'رادار آروان', what: 'آزمون دسترسی از نقاط داخلی (طبق معرفی ارائه‌دهنده)', ep: '—', auth: '—', freq: '—', status: 'no_method', note: 'API یا روش دریافت مستند و مجاز پیدا نشد؛ داده از صفحه وب استخراج (scrape) نمی‌شود'},
  {id: 'domestic_official', n: 'رگولاتوری، شرکت ارتباطات زیرساخت، مرکز ملی فضای مجازی', what: 'آمار رسمی و وضعیت خدمات', ep: '—', auth: '—', freq: '—', status: 'no_method', note: 'خروجی ماشین‌خوان و قابل دریافت خودکار شناسایی نشد؛ آمار رسمی از فصلنامه وارد می‌شود'},
];
const OST = {live: ['دریافت فعال', 'off'], archive: ['آرشیوی', 'calc'], needs_key: ['نیازمند کلید', 'usr'], needs_permit: ['نیازمند مجوز', 'usr'], no_method: ['فاقد روش دریافت احرازشده', 'res'], temp_fail: ['موقتاً ناموفق', 'usr'], pending: ['در انتظار نخستین دریافت', 'calc']};
const TEH = (iso) => { if (!iso) return '—'; const d = new Date(iso); if (isNaN(d)) return esc(iso); return new Intl.DateTimeFormat(window.RADAR_PRESENTATION?.lang==='en'?'en-GB-u-ca-persian':'fa-IR-u-ca-persian', {timeZone: 'Asia/Tehran', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'}).format(d) + (window.RADAR_PRESENTATION?.lang==='en'?' (Tehran)':' (تهران)'); };
const API = {
  base: () => { try { return localStorage.getItem('radarApi') || ''; } catch (e) { return ''; } },
  get: async (path) => { const b = API.base(); if (!b) throw new Error('NO_API'); const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000); try { const r = await fetch(b.replace(/\/$/, '') + path, {signal: ctl.signal}); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } finally { clearTimeout(t); } },
};
/* ---------- executive brief (command view, section 1) ---------- */
const ET_SHORT = {official: 'رسمی', intl: 'بین‌المللی', measurement: 'اندازه‌گیری', survey: 'پیمایش', publisher: 'ناشر', analysis: 'تحلیل', model: 'برآورد مدل', news: 'خبر', price: 'قیمت', registry: 'رجیستری', catalog: 'کاتالوگ', evaluation: 'ارزیابی', unknown: 'نامشخص'};

/* data freshness as a timeline (Jalali months since the start of 1403), so age is seen, not read */
const FRESH = () => {
  const now = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {year: 'numeric', month: 'numeric', timeZone: 'Asia/Tehran'}).formatToParts(new Date());
  const ny = +now.find((p) => p.type === 'year').value, nm = +now.find((p) => p.type === 'month').value;
  const idx = (y, m) => (y - 1403) * 12 + m, end = Math.max(idx(ny, nm), 31);
  const pts = [{n: 'ارزیابی اهداف شبکه ملی', p: 'شهریور ۱۴۰۵', i: idx(1405, 6), c: C.violet}, {n: 'آمار رسمی فصلنامه ۵۷', p: 'بهار ۱۴۰۵', i: idx(1405, 3), c: C.teal}, {n: 'کاربرگ استانی و ترافیک', p: 'شهریور ۱۴۰۵', i: idx(1405, 6), c: C.amber}];
  const X = (i) => (i / end) * 100, age = (i) => idx(ny, nm) - i;
  return `<div class="fresh-tl" role="img" aria-label="${esc(pts.map((p) => p.n + ': ' + p.p + '، ' + F.i(age(p.i)) + ' ماه پیش').join('؛ '))}">
    <div class="ftl-axis"><span style="inset-inline-start:0">۱۴۰۳</span><span style="inset-inline-start:${X(12)}%">۱۴۰۴</span><span style="inset-inline-start:${X(24)}%">۱۴۰۵</span><span class="now" style="inset-inline-start:${X(idx(ny, nm))}%">امروز</span></div>
    <div class="ftl-track">${pts.map((p) => `<i style="inset-inline-start:${X(p.i)}%;--c:${p.c}" title="${esc(p.n + ' · ' + p.p)}"></i><b style="inset-inline-start:${X(p.i)}%;width:${X(age(p.i))}%;--c:${p.c}"></b>`).join('')}<em style="inset-inline-start:${X(idx(ny, nm))}%"></em></div>
    <ul class="ftl-l">${pts.map((p) => `<li><i style="background:${p.c}"></i><span>${p.n}</span><small>${p.p} · <b class="num">${F.i(age(p.i))}</b> ماه پیش</small></li>`).join('')}<li><i style="background:var(--dim)"></i><span>پایش آنلاین</span><small>${API.base() ? 'نسخه متصل؛ وضعیت در صفحه پایش' : 'در این فایل داده زنده نیست'}</small></li></ul></div>`;
};
const BRIEF = () => {
  const el = $('#cmdBrief'); if (!el) return;
  const ov = NIN.S.overall, LY = NIN.LAST, PYR = NIN.prev(LY), lowL = NIN.goals.filter((g) => NIN.prog(g, LY) != null).sort((a, b) => NIN.prog(a, LY) - NIN.prog(b, LY)), low = lowL.filter((g) => NIN.prog(g, LY) < 40).length, t3 = NIN.issueOf3(LY);
  const ageM = Math.max(0, Math.floor((Date.now() - Date.UTC(2026, 5, 21)) / (30.44 * 864e5)));
  const msgs = [
    {ev: 'off', t: 'رشد سیار، کوچک شدن ثابت', s: `پهن‌باند سیار ${F.big(M.mob.total)} اشتراک و ${F.sp(M.mob.yoy)} در یک سال؛ پهن‌باند ثابت ${F.sp(kv('CRA57-FIXBB-GROWTH'), 2)}. افزایش خالص FTTx ${OFFSET_TXT()} کاهش خالص XDSL بود.`, go: 'fixed', rk: 'off:CRA57-FIXBB-1405', viz: () => AIVIZ.div([{t: 'پهن‌باند سیار (٪)', v: M.mob.yoy}, {t: 'پهن‌باند ثابت (٪)', v: kv('CRA57-FIXBB-GROWTH')}], {label: 'رشد سالانه سیار و ثابت'}) + AIVIZ.div(M.fixed.techs.filter((t) => /FTTx|XDSL/.test(t.k)).map((t) => ({t: (t.k === 'FTTx' ? 'FTTx' : 'XDSL') + ' (هزار مشترک)', v: t.d / 1000})), {label: 'تغییر خالص مشترک فیبر و XDSL'})},
    {ev: 'usr', t: 'تحقق اهداف شبکه ملی', s: `پیشرفت کل ${NIN.yfa(LY)}: ${F.n(ov[LY].value)}٪ (${NIN.yfa(PYR)}: ${F.n(ov[PYR].value)}). ${F.i(low)} هدف زیر ۴۰٪ است؛ ضعیف‌ترین: ${lowL.slice(0, 2).map((g) => g.short).join(' و ')}.${t3 ? ` بازسازی ${NIN.yfa(LY)} از شاخص‌ها ${F.n(t3.indicators_rebuild)}٪ می‌شود و افت گزارش‌شده بدون تأیید متولی قطعی نیست.` : ''}`, go: 'nin', viz: () => AIVIZ.line(NIN.YEARS.map((y) => ({x: NIN.yfa(y), v: ov[y].value})), {unit: '٪', h: 100, label: 'پیشرفت کل شبکه ملی ' + NIN.yfa('1400') + ' تا ' + NIN.yfa(LY)})},
    {ev: 'wb', t: 'بیشتر ترافیک به مقصد خارجی', s: `${F.p(M.traffic.intlShare)} ترافیک داده تابستان ۱۴۰۵ به مقصد خارجی رفته (کاربرگ پایش). این سهم به‌تنهایی معیار موفقیت شبکه ملی نیست.`, go: 'quality', viz: () => VZ.split([{n: 'بین‌الملل', v: M.traffic.intlShare, c: C.amber}, {n: 'داخلی', v: 100 - M.traffic.intlShare, c: C.teal}]) + `<div class="brief-cap">${F.n(r1(M.traffic.tot / 1e9))} اگزابایت در سه ماه</div>`},
  ];
  const EVB2 = {off: ['رسمی', 'off'], usr: ['فایل کاربر · احراز نشده', 'usr'], wb: ['کاربرگ ارسالی', 'usr']};
  const crit = ALERTS.filter((a) => a.sev === 'crit' || a.sev === 'warn').slice(0, 3);
  el.innerHTML = `<section class="p c8 brief" data-pid="brief"><header><h3>سه پیام اصلی</h3><span class="k">EXECUTIVE BRIEF</span></header>
    <ol class="brief-l">${msgs.map((m, i) => `<li><span class="bn num">${F.i(i + 1)}</span><div><b>${m.t}</b> <span class="badge ${EVB2[m.ev][1]}">${EVB2[m.ev][0]}</span><p>${m.s}</p><button class="lnkbtn" data-go="${m.go}" type="button">جزئیات ←</button></div><div class="brief-viz">${m.viz ? m.viz() : ''}</div></li>`).join('')}</ol></section>
    <section class="p c4 brief" data-pid="brief-side"><header><h3>سیگنال‌ها و تازگی داده</h3><span class="k">STATUS</span></header>
    <div class="brief-s">${crit.map((a) => `<button class="al" style="--sev:${C.sev[a.sev]}" data-go="${a.view}" type="button"><i></i><div><b>${esc(a.t)}</b></div></button>`).join('')}</div>
    ${FRESH()}
    <button class="go tour-btn" id="tourBtn" type="button">راهنمای چهارمرحله‌ای داشبورد</button></section>`;
  $$('[data-go]', el).forEach((b) => b.onclick = () => go(b.dataset.go));
  $('#tourBtn').onclick = () => TOUR.start();
};

/* ---------- 4-step guided tour ---------- */
const TOUR = (() => {
  const STEPS = [
    {sel: '#commandNavigation', t: 'ناوبری', s: 'سه بخش اصلی بالای فهرست‌اند: نمای فرماندهی، تحقق اهداف شبکه ملی و پایش آنلاین. بقیه در سه گروه تاشونده‌اند و با جست‌وجو هم پیدا می‌شوند.', m: '#navToggle'},
    {sel: '.strip', t: 'کارت‌های شاخص', s: 'هر کارت نوع شاهدش را نشان می‌دهد: رسمی، محاسبه رادار، کاربرگ با دامنه محدود یا ناشر. روی کارت بزنید تا منبع، دوره، مخرج و محدودیت باز شود.'},
    {sel: '.nin-cmd', t: 'تحقق اهداف شبکه ملی', s: 'خلاصه ارزیابی ۱۴۰۰ تا شهریور ۱۴۰۵. صفحه کامل آن نقشه حرارتی، جزئیات هر هدف و ناسازگاری‌های فایل را نشان می‌دهد.'},
    {sel: '#askForm', t: 'دستیار تحلیلی', s: 'پرسش را به فارسی بنویسید؛ پاسخ «آنچه منبع می‌گوید»، «محاسبه رادار» و «استنباط دستیار» را جدا برچسب می‌زند و عدد نمی‌سازد. میان‌بر: Ctrl K.'},
  ];
  let i = 0, last = null;
  const box = () => $('#tour');
  const show = () => {
    const st = STEPS[i]; let t = $(st.sel);
    if ((!t || t.offsetParent === null) && st.m) t = $(st.m);
    if (!t) { i++; return i < STEPS.length ? show() : end(); }
    t.scrollIntoView({block: 'center', behavior: 'instant' in window ? 'instant' : 'auto'});
    const r = t.getBoundingClientRect(), pad = 6;
    const hl = $('#tourHl'); Object.assign(hl.style, {top: r.top - pad + 'px', left: r.left - pad + 'px', width: r.width + pad * 2 + 'px', height: Math.min(r.height + pad * 2, innerHeight - 20) + 'px'});
    const c = $('#tourCard');
    c.innerHTML = `<div class="tc-h"><span class="num">${F.i(i + 1)} از ${F.i(STEPS.length)}</span><b id="tourT">${st.t}</b></div><p>${st.s}</p><div class="tc-a"><button class="go" id="tourPrev" ${i ? '' : 'disabled'} type="button">قبلی</button><button class="go" id="tourNext" type="button">${i === STEPS.length - 1 ? 'پایان' : 'بعدی'}</button><button class="lnkbtn" id="tourX" type="button">بستن</button></div>`;
    const below = r.bottom + 220 < innerHeight;
    Object.assign(c.style, {top: (below ? Math.min(r.bottom + 14, innerHeight - 200) : Math.max(12, r.top - 200)) + 'px', left: Math.max(12, Math.min(innerWidth - 352, r.left + r.width / 2 - 170)) + 'px'});
    $('#tourPrev').onclick = () => { i--; show(); }; $('#tourNext').onclick = () => { if (i === STEPS.length - 1) end(); else { i++; show(); } }; $('#tourX').onclick = end;
    $('#tourNext').focus();
  };
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); end(); } else if (e.key === 'ArrowLeft') { if (i < STEPS.length - 1) { i++; show(); } } else if (e.key === 'ArrowRight') { if (i) { i--; show(); } } else if (e.key === 'Tab') { const f = $$('#tourCard button:not([disabled])'); const k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); } };
  const start = () => { last = document.activeElement; i = 0; if (!box()) { const d = document.createElement('div'); d.id = 'tour'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'tourT'); d.innerHTML = '<div id="tourHl"></div><div id="tourCard"></div>'; document.body.appendChild(d); } box().hidden = false; document.addEventListener('keydown', key, true); show(); try { localStorage.setItem('radarTour', '1'); } catch (e) {} };
  const end = () => { if (box()) box().hidden = true; document.removeEventListener('keydown', key, true); if (last && last.focus) last.focus(); };
  return {start, end};
})();

/* ---------- keyboard exploration for charts: arrow keys walk the marks, Enter activates ---------- */
const KBD = (el, getPts, onEnter) => {
  if (!el) return;
  el.tabIndex = 0; el.classList.add('kbd');
  if (!el.getAttribute('aria-label')) { const s = $('svg', el); el.setAttribute('aria-label', ((s && s.getAttribute('aria-label')) || 'نمودار').replace(/ \(.*\)$/, '') + '؛ با کلیدهای جهت مرور کنید'); }
  el.setAttribute('role', 'group');
  let i = -1;
  const fire = () => {
    const pts = getPts(); if (!pts.length) return; i = (i + pts.length) % pts.length;
    const p = pts[i], svg = $('svg', el), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, sx = r.width / (vb.width || r.width), sy = r.height / (vb.height || r.height);
    const cx = r.left + p.x * sx, cy = r.top + p.y * sy;
    p.node.dispatchEvent(new MouseEvent('mousemove', {bubbles: true, clientX: cx, clientY: cy}));
    const tip = $('.tip', el); if (tip && !tip.hidden) $('#live').textContent = tip.textContent;
  };
  el.addEventListener('keydown', (e) => {
    if (e.target !== el) return;
    if (['ArrowLeft', 'ArrowDown'].includes(e.key)) { e.preventDefault(); i++; fire(); }
    else if (['ArrowRight', 'ArrowUp'].includes(e.key)) { e.preventDefault(); i = i < 0 ? 0 : i - 1; fire(); }
    else if (e.key === 'Home') { e.preventDefault(); i = 0; fire(); }
    else if (e.key === 'End') { e.preventDefault(); i = getPts().length - 1; fire(); }
    else if (e.key === 'Enter' && onEnter && i >= 0) { e.preventDefault(); onEnter(i); }
  });
  el.addEventListener('blur', () => { const tip = $('.tip', el); if (tip) tip.hidden = true; });
};
/* attach keyboard exploration to every rendered chart after each render */
const KBD_ALL = () => {
  $$('#views .ch').forEach((el) => {
    if (el.classList.contains('kbd') || !$('svg', el)) return;
    const marks = () => {
      const svg = $('svg', el); if (!svg) return [];
      const base = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, kx = (vb.width || base.width) / base.width, ky = (vb.height || base.height) / base.height;
      const nodes = $$('rect,path.pv,circle', svg).filter((n) => { const ev = n.__on; return ev && ev.some((h) => h.type === 'mousemove'); });
      const overlay = nodes.find((n) => n.tagName === 'rect' && n.getAttribute('fill') === 'transparent' && +n.getAttribute('width') > 100);
      if (overlay && el.__xs) return el.__xs.map((x) => ({node: overlay, x, y: 30}));
      return nodes.filter((n) => n !== overlay).map((n) => { const b = n.getBoundingClientRect(); return {node: n, x: (b.left - base.left + b.width / 2) * kx, y: (b.top - base.top + b.height / 2) * ky}; }).sort((a, b) => a.y - b.y || b.x - a.x);
    };
    KBD(el, marks, (i) => { const m = marks()[i]; if (m && m.node) m.node.dispatchEvent(new MouseEvent('click', {bubbles: true})); });
  });
};
