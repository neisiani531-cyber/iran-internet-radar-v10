/* ===== shell, router, boot ===== */
const STATE = new Proxy({view: 'command', cmdMap: 'fthU', pvMap: 'fthU', prov: 'IR-07', mbMode: 'abs', tic: 'rtt', plMo: 'حجم محتوا', evTheme: 'all', exKind: 'all', exDom: 'all', exEt: 'all', rgSub: 'all', plSub: 'all', plPl: 'all', wbSheet: 'port-7', wbMetric: '', dmCross: '', ninYear: NIN.LAST, ninGoal: 0, ninDom: 'all', ninSort: 'value', ninBand: '', onRange: '7d', rptQ: '', chDom: 'all', chType: 'all', chRev: 'new', chId: '', onSrc: 'all', onAsn: '', onVp: '', onDst: '', full: '', rec: '', tbl: {}, pvSort: {k: 'fthI', dir: -1}}, {set(o, k, v) { const ch = o[k] !== v; o[k] = v; if (ch && typeof URLS !== 'undefined' && k !== 'rec' && k !== 'view') URLS.replace(); return true; }});
Object.entries(STATE).forEach(([k, v]) => { if (typeof v !== 'object') DEFAULTS[k] = v; });
const ICON = {
  command: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 12 19 5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  fixed: '<path d="M3 12h4l2-5 3 10 2-5h7"/>',
  mobile: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17h2"/>',
  quality: '<path d="M4 18 9 12l4 3 7-9"/><path d="M15 6h5v5"/>',
  provinces: '<path d="M4 6 9 4l6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>',
  platforms: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
  research: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
  decision: '<path d="M4 20h16"/><path d="M6 16V9M11 16V5M16 16v-5"/>',
  explorer: '<path d="M4 5h16M4 10h16M4 15h10M4 20h7"/>',
  domains: '<rect x="4" y="3" width="11" height="3.5" rx="1"/><rect x="4" y="8.5" width="11" height="3.5" rx="1"/><rect x="4" y="14" width="11" height="3.5" rx="1"/><path d="M18 3v15M21 3v15"/>',
  infra: '<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M8 7h.01M8 17h.01M12 7h5M12 17h5"/>',
  nin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/><path d="M12 3.5V1.5M20.5 12h2"/>',
  changes: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>',
  report: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 17v-3M13 17v-5M16 17v-2"/>',
  online: '<path d="M3 12h3l2-6 4 12 2-6h7"/><circle cx="19" cy="6" r="2"/>',
  registry: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h3"/>',
};
/* navigation: three primary entries + three collapsible groups (adapted from the navigation revision) */
const NAV_PRIMARY = [['command', 'نمای فرماندهی'], ['nin', 'تحقق اهداف شبکه ملی اطلاعات'], ['online', 'پایش آنلاین'], ['report', 'گزارش‌ساز']];
const NAV_GROUPS = [
  ['layers', 'لایه‌های شبکه ملی اطلاعات', DOM_ORDER.map((d) => ['d-' + d, DOM[d].n])],
  ['special', 'تحلیل‌های تخصصی', [['fixed', 'دسترسی ثابت و فیبر'], ['mobile', 'ارتباطات سیار'], ['quality', 'کیفیت شبکه'], ['provinces', 'مقایسه استان‌ها'], ['platforms', 'سکوها و پیام‌رسان‌ها'], ['infra', 'مراکز داده و ابر']]],
  ['evidence', 'شواهد و تصمیم', [['changes', 'تغییرات از آخرین بازدید'], ['explorer', 'کاوش همه داده‌ها'], ['research', 'تحلیل‌های پژوهشی'], ['registry', 'منابع و شواهد'], ['decision', 'پشتیبان تصمیم'], ['domains', 'معماری داده‌ها']]],
];
const NAV = [...NAV_PRIMARY, ...NAV_GROUPS.flatMap((g) => g[2])];
const navBtn = ([k, n]) => { const d = k.startsWith('d-') ? k.slice(2) : null; return `<button type="button" data-v="${k}" aria-current="false">${d ? `<span class="dico" style="--dc:${DOM[d].c}" aria-hidden="true">${DOM[d].i}</span>` : `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ''}</svg>`}<span class="nl">${esc(n)}</span></button>`; };
const NAV_UI = (() => {
  const LS = 'radarNavGroups';
  let saved = null;
  const norm = (s) => String(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[‌\s]+/g, ' ').trim().toLowerCase();
  const isMobile = () => matchMedia('(max-width: 900px)').matches;
  const isOpen = () => document.body.classList.contains('nav-open');
  const close = (focusToggle) => { if (!isOpen()) return; document.body.classList.remove('nav-open'); $('#navToggle').setAttribute('aria-expanded', 'false'); $('#navBackdrop').hidden = true; if (focusToggle) $('#navToggle').focus(); };
  const open = () => { document.body.classList.add('nav-open'); $('#navToggle').setAttribute('aria-expanded', 'true'); $('#navBackdrop').hidden = false; setTimeout(() => $('#navSearch').focus(), 30); };
  const remember = () => { try { localStorage.setItem(LS, JSON.stringify(Object.fromEntries($$('.nav-group').map((d) => [d.dataset.g, d.open])))); } catch (e) {} };
  const sync = () => { $$('.nav-group').forEach((d) => { if (d.querySelector('[aria-current="page"]')) d.open = true; }); };
  const init = () => {
    let st = {}; try { st = JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) {}
    $$('.nav-group').forEach((d) => { if (d.dataset.g in st) d.open = !!st[d.dataset.g]; d.addEventListener('toggle', () => { if (!$('#navSearch').value) remember(); }); });
    const input = $('#navSearch');
    input.addEventListener('input', () => {
      const q = norm(input.value), groups = $$('.nav-group');
      if (q && !saved) saved = groups.map((d) => d.open);
      let n = 0;
      $$('.rail button[data-v]').forEach((b) => { b.hidden = !!q && !norm(b.textContent).includes(q); if (!b.hidden) n++; });
      groups.forEach((d, i) => { d.hidden = ![...d.querySelectorAll('[data-v]')].some((b) => !b.hidden); if (q && !d.hidden) d.open = true; else if (!q && saved) d.open = saved[i]; });
      if (!q) { saved = null; sync(); }
      $('#navEmpty').hidden = n > 0;
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const b = $$('.rail button[data-v]').find((x) => !x.hidden); if (b) { b.click(); input.value = ''; input.dispatchEvent(new Event('input')); } } });
    $('#navToggle').onclick = () => (isOpen() ? close(true) : open());
    $('#navBackdrop').onclick = () => close(true);
    /* keyboard: arrow keys move between nav items; Tab is trapped inside the drawer on mobile */
    $('#commandNavigation').addEventListener('keydown', (e) => {
      const items = $$('#commandNavigation button[data-v], #commandNavigation summary, #navSearch, #railAi').filter((x) => !x.closest('[hidden]') && x.offsetParent !== null);
      const i = items.indexOf(document.activeElement);
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && i >= 0 && document.activeElement !== $('#navSearch')) { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
      if (e.key === 'Tab' && isMobile() && isOpen()) { const f = items[0], l = items[items.length - 1]; if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); } else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); } }
      if (e.key === 'Escape' && isOpen()) { e.stopPropagation(); close(true); }
    });
  };
  return {init, sync, close, isOpen};
})();

function shell() {
  document.getElementById('root').innerHTML = `
  <a class="skip" href="#views">پرش به محتوای اصلی</a>
  <div class="app">
    <button class="nav-mobile-toggle" id="navToggle" type="button" aria-controls="commandNavigation" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>بخش‌ها</button><div id="navBackdrop" hidden></div>
    <nav class="rail" id="commandNavigation" aria-label="بخش‌های رادار">
      <div class="nav-brand"><svg class="logo" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" fill="none" stroke="#283647"/><circle cx="22" cy="22" r="13" fill="none" stroke="#1d2836"/><circle cx="22" cy="22" r="6" fill="none" stroke="#1d2836"/><g class="sweep"><path d="M22 22 L22 2 A20 20 0 0 1 39 12 Z" fill="url(#sw)"/></g><circle cx="30" cy="14" r="1.8" fill="#ffb340"/><circle cx="13" cy="28" r="1.4" fill="#2fd39c"/><defs><linearGradient id="sw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb340" stop-opacity=".55"/><stop offset="1" stop-color="#ffb340" stop-opacity="0"/></linearGradient></defs></svg><div><b>مرکز فرماندهی</b><small>دسترسی به داده و تحلیل</small></div></div>
      <label class="nav-search"><span class="sr">جست‌وجوی بخش‌ها</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/></svg><input id="navSearch" type="search" placeholder="پیدا کردن بخش…" autocomplete="off"></label>
      <div class="nav-primary" role="group" aria-label="بخش‌های اصلی">${NAV_PRIMARY.map(navBtn).join('')}</div>
      ${NAV_GROUPS.map(([g, n, items], i) => `<details class="nav-group" data-g="${g}" ${i === 0 ? 'open' : ''}><summary><span>${esc(n)}</span><em>${F.i(items.length)}</em></summary><div class="nav-items" role="group" aria-label="${esc(n)}">${items.map(navBtn).join('')}</div></details>`).join('')}
      <p id="navEmpty" hidden role="status">بخشی پیدا نشد</p>
      <span class="sp"></span>
      <button class="ai-btn" id="railAi" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/></svg><span class="nl">دستیار تحلیلی</span><kbd>Ctrl K</kbd></button>
    </nav>
    <div class="main">
      <header class="cmdbar">
        <div class="brand"><h1>رادار فرماندهی شبکه ملی اطلاعات</h1><span class="sub">IRAN INTERNET RADAR · NII COMMAND · آخرین دوره رسمی: بهار ۱۴۰۵</span></div>
        <div class="chips"><span class="chip"><i></i>رسمی <b>فصلنامه ۵۷</b></span><span class="chip amb"><i></i>پایش <b>تابستان ۱۴۰۵</b></span><span class="chip amb"><i></i>استانی <b>شهریور ۱۴۰۵</b></span><span class="chip vio"><i></i>پژوهشی <b>بدون Q5</b></span><span class="chip amb stale" id="staleChip"></span></div>
        <span class="grow"></span>
        <form class="ask" id="askForm"><input id="askIn" placeholder="از رادار بپرسید… مثلاً «ضعیف‌ترین اهداف شبکه ملی کدام‌اند؟»" aria-label="پرسش از دستیار"><kbd>Ctrl K</kbd><button type="submit">بپرس</button></form>
        <div class="clock" id="clock"></div>
      </header>
      <main class="views" id="views" tabindex="-1"></main>
    </div>
  </div>
  <div class="scrim" id="scrim" hidden></div>
  <aside class="ai" id="ai" aria-label="دستیار تحلیلی">
    <header><span class="orb"></span><div><b>دستیار تحلیلی رادار</b><small>پاسخ از داده‌های همین داشبورد، با منبع</small></div><button class="x" id="aiX" aria-label="بستن">×</button></header>
    <div class="msgs" id="aiMsgs" role="log" aria-live="polite" aria-label="گفت‌وگو با دستیار"></div>
    <div class="sugs" id="aiSugs"></div>
    <div class="mode" id="aiMode"></div>
    <div class="cfg" id="aiCfg" hidden><span>نشانی سرور API رادار (FastAPI مخزن، مسیر /api/v1/assistant/chat). کلید مدل فقط روی سرور نگهداری می‌شود.</span><input id="aiApi" placeholder="https://radar-api.example.ir"><button class="go" id="aiApiSave" type="button">ذخیره</button></div>
    <form id="aiForm"><input id="aiIn" aria-label="پرسش خود را بنویسید" placeholder="پرسش خود را بنویسید…" autocomplete="off"><button type="submit">ارسال</button></form>
  </aside>
  <aside class="ai dt" id="detail" aria-label="شناسنامه رکورد"></aside><div id="live" class="sr" aria-live="polite"></div>`;
}

function go(v, opts = {}) {
  if (!V[v]) { TOAST('بخش «' + v + '» وجود ندارد'); v = 'command'; }
  if (DETAIL.isOpen()) { DETAIL.hide(); STATE.rec = ''; }
  if (v === STATE.view && !opts.force) return;
  STATE.view = v; STATE.full = '';
  URLS.push();
  render();
  window.scrollTo(0, 0);
}
function render(keepScroll) {
  const v = STATE.view;
  // keyboard users keep their place: remember the focused control by id or data-* key and refocus its new copy
  const fa = document.activeElement, fsel = fa && fa.closest && fa.closest('#views') ? (fa.id ? '#' + CSS.escape(fa.id) : [...fa.attributes].filter((a) => a.name.startsWith('data-') && a.name !== 'data-in').map((a) => `[${a.name}="${CSS.escape(a.value)}"]`).join('') || null) : null;
  $$('.rail button[data-v]').forEach((b) => b.setAttribute('aria-current', b.dataset.v === v ? 'page' : 'false'));
  NAV_UI.sync();
  const host = $('#views'), y = scrollY;
  try { host.innerHTML = `<section class="view">${V[v].html()}</section>`; }
  catch (e) { console.error(e); host.innerHTML = `<section class="view"><div class="empty-state"><span class="er">خطا در ساخت این بخش</span>: ${esc(e.message)}. <button class="go" data-go="command">بازگشت به فرماندهی</button></div></section>`; return; }
  PANELS.mark();
  try { const p = V[v].draw(); if (p && p.catch) p.catch((e) => console.error(e)); } catch (e) { console.error(e); }
  PANELS.decorate();
  KBD_ALL(); MOTION.run($('#views')); setTimeout(() => { KBD_ALL(); MOTION.run($('#views')); }, 900);
  document.title = V[v].title + ' · رادار فرماندهی شبکه ملی اطلاعات';
  const live = $('#live'); if (live) live.textContent = 'بخش ' + V[v].title;
  if (keepScroll) window.scrollTo(0, y);
  if (fsel) { try { const n = $('#views ' + fsel); if (n) n.focus({preventScroll: true}); } catch (e) { /* selector from attributes; ignore */ } }
}
function restore(hash, y) {
  const notes = URLS.apply(URLS.parse(hash));
  notes.forEach((n) => TOAST(n, 'warn'));
  render();
  if (STATE.rec) { const r = REC.byId[STATE.rec]; if (r) DETAIL.show(r); else { TOAST('رکورد «' + STATE.rec + '» پیدا نشد', 'warn'); STATE.rec = ''; DETAIL.hide(); } }
  else if (DETAIL.isOpen()) DETAIL.hide();
  requestAnimationFrame(() => window.scrollTo(0, y || 0));
  return notes;
}
function clock() {
  const now = new Date();
  const d = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran'}).format(now);
  const t = new Intl.DateTimeFormat('fa-IR', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran'}).format(now);
  $('#clock').innerHTML = `<b>${t}</b>${d}`;
}
let scrollTimer = null;
function boot() {
  shell();
  NAV_UI.init();
  $$('.rail button[data-v]').forEach((b) => b.onclick = () => { go(b.dataset.v); NAV_UI.close(); });
  $('.skip').onclick = (e) => { e.preventDefault(); $('#views').focus(); };
  $('#railAi').onclick = () => AIUI.open();
  $('#askForm').onsubmit = (e) => { e.preventDefault(); const v = $('#askIn').value; $('#askIn').value = ''; AIUI.ask(v); };
  $('#scrim').onclick = () => { if (DETAIL.isOpen()) DETAIL.close(); else AIUI.close(); };
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#askIn').focus(); return; }
    if (e.key === 'Tab') {
      const box = DETAIL.isOpen() && $('#detail').getAttribute('aria-modal') === 'true' ? $('#detail') : $('#ai').classList.contains('open') && !$('#scrim').hidden ? $('#ai') : $('#views .p.full');
      if (box) { const f = $$('a[href],button:not([disabled]),input,select,textarea,summary,[tabindex="0"]', box).filter((x) => x.offsetParent !== null); if (f.length) { const i = f.indexOf(document.activeElement); if (i < 0 || (e.shiftKey && i === 0) || (!e.shiftKey && i === f.length - 1)) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); } } }
      return;
    }
    if (e.key !== 'Escape') return;
    if (DETAIL.isOpen()) DETAIL.close();
    else if ($('#ai').classList.contains('open')) AIUI.close();
    else if (STATE.full) { STATE.full = ''; render(true); URLS.replace(true); }
  });
  AIUI.init();
  clock(); setInterval(clock, 30000);
  /* age of the latest official period: spring 1405 ended 31 Khordad 1405 = 2026-06-21 */
  const ageM = Math.max(0, Math.floor((Date.now() - Date.UTC(2026, 5, 21)) / (30.44 * 864e5)));
  $('#staleChip').innerHTML = `<i></i>آخرین دوره رسمی <b>بهار ۱۴۰۵</b> · ${F.i(ageM)} ماه پس از پایان دوره`;
  $('#staleChip').title = 'شاخص‌های رسمی فصلنامه ۵۷ مربوط به بهار ۱۴۰۵ است؛ وضعیت امروز را نشان نمی‌دهد.';
  // any [data-go] button without its own handler navigates (no dead buttons)
  document.addEventListener('click', (e) => { const g = e.target.closest('#views [data-go]'); if (g && !g.onclick) go(g.dataset.go); });
  document.addEventListener('click', (e) => { const a = e.target.closest('a[data-rk]'); if (a && !a.onclick) { e.preventDefault(); DETAIL.open(a.dataset.rk); } });
  (window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(() => { try { V4H.unknownTerms('', []); } catch (e) {} });
  restore(location.hash, (history.state || {}).y);
  try { history.replaceState({...(history.state || {}), rec: STATE.rec || undefined}, '', URLS.ser()); } catch (e) {}
  addEventListener('popstate', (e) => restore(location.hash, (e.state || {}).y));
  addEventListener('hashchange', () => { if (location.hash !== URLS.ser()) restore(location.hash, 0); });
  addEventListener('scroll', () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(() => { try { history.replaceState({...(history.state || {}), y: scrollY}, ''); } catch (e) {} }, 150); }, {passive: true});
  document.addEventListener('click', (e) => { const k = e.target.closest('.kpi[data-rid]'); if (k) DETAIL.open(k.dataset.rid); });
  let w = innerWidth, t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(innerWidth - w) > 30) { w = innerWidth; if(STATE.view==='report'&&window.RADAR_I18N)window.RADAR_I18N.change(window.RADAR_I18N.lang,window.RADAR_I18N.theme);else render(true); } }, 200); });
}
document.addEventListener('DOMContentLoaded', boot);
