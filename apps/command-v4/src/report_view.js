/* ===== v4.8 report studio: request -> plan (editable) -> A4 preview -> PDF / Word / PowerPoint / HTML ===== */
V.report = {
  title: 'گزارش‌ساز', code: 'REPORT STUDIO',
  html: () => {
    const ex = ['گزارش وضعیت شبکه ملی اطلاعات، خلاصه و در قالب پاورپوینت', 'مقایسه فیبر اصفهان و فارس با تحلیل و توصیه، فایل ورد', 'کارنامه تحقق اهداف شبکه ملی برای جلسه شورا', 'گزارش کارشناسی کیفیت شبکه و ترافیک بین‌الملل، کامل', 'گزارش رخدادهای اختلال و حملات سایبری'];
    return `<div class="vhead"><div><div class="code">REPORT STUDIO · DATA-BOUND ANALYSIS</div><h2>گزارش‌ساز</h2>
    <p>درخواست را همان‌طور که به یک کارشناس می‌گویید بنویسید: موضوع، مخاطب و قالب. رادار برداشتش را نشان می‌دهد، می‌توانید آن را اصلاح کنید و گزارش فقط از داده‌های همین داشبورد، با منبع هر عدد، ساخته می‌شود.</p></div></div>
    <div class="rpt-ui">
      <section class="p rpt-ask" data-pid="rpt-ask"><header><h3>درخواست</h3><span class="k">REQUEST</span></header>
        <textarea id="rptQ" class="rpt-q" rows="2" placeholder="مثلاً: گزارش مقایسه‌ای فیبر اصفهان و فارس، با توصیه، در قالب ورد">${esc(STATE.rptQ || '')}</textarea>
        <div class="rpt-ex">${ex.map((e) => `<button type="button" class="rpt-chip" data-ex="${esc(e)}">${esc(e)}</button>`).join('')}</div>
        <div class="rpt-act"><span class="dim rpt-fhint">خروجی Word و PowerPoint با فونت وزیرمتن است؛ پیش از باز کردن فایل، آن را روی رایانه مقصد نصب کنید.</span><button class="go" id="rptFonts0" type="button">دریافت فونت وزیرمتن</button><button class="go" id="rptPlanBtn" type="button">برداشت از درخواست ←</button></div>
      </section>
      <section class="p rpt-plan" data-pid="rpt-plan" id="rptPlanBox" hidden><header><h3>برداشت رادار از درخواست شما</h3><span class="k">PLAN</span></header><div id="rptPlan"></div></section>
    </div>
    <div class="rpt-wrap" id="rptWrap" hidden><div class="rpt-bar" id="rptBar"></div><div id="rptDoc" class="paper"></div></div>`;
  },
  draw: () => {
    const plan = () => {
      const t = $('#rptQ').value.trim(); STATE.rptQ = t; URLS.replace(true);
      if (!t) { TOAST('درخواست را بنویسید یا یکی از نمونه‌ها را انتخاب کنید', 'warn'); return; }
      RPTV.plan = RPT.parse(t); RPTV.plan.title = RPT.autoTitle(RPTV.plan); RPTV.showPlan();
    };
    $('#rptPlanBtn').onclick = plan; $('#rptFonts0').onclick = () => RPTX.fonts();
    $('#rptQ').onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) plan(); };
    $('#rptQ').oninput = (e) => { STATE.rptQ = e.target.value.slice(0, 1990); }; // a re-render (e.g. window resize) keeps what was typed
    $$('.rpt-chip').forEach((b) => b.onclick = () => { $('#rptQ').value = b.dataset.ex; plan(); });
    if (STATE.rptQ) plan();
  },
};

const RPTV = {
  plan: null, rep: null,
  seg: (id, map, val) => `<div class="seg" id="${id}" role="group">${Object.entries(map).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="${k === val}">${esc(typeof v === 'string' ? v : v.n)}</button>`).join('')}</div>`,
  showPlan(scroll = true) {
    const p = RPTV.plan, box = $('#rptPlan'); $('#rptPlanBox').hidden = false;
    const provOpts = M.prov.map((x) => `<option value="${x.iso}" ${p.provs.includes(x.iso) ? 'selected' : ''}>${esc(x.n)}</option>`).join('');
    box.innerHTML = `<div class="rpt-grid">
      <label class="rpt-f"><span>عنوان</span><input class="search" id="rpTitle" value="${esc(window.RADAR_I18N?.lang==='en'?window.RADAR_I18N.toEN(p.title):p.title)}"></label>
      <label class="rpt-f"><span>گیرنده</span><input class="search" id="rpTo" value="${esc(p.recipient)}" placeholder="نام گیرنده (اختیاری)"></label>
      <div class="rpt-f"><span>نوع گزارش</span>${RPTV.seg('rpTpl', RPT.TPL, p.tpl)}</div>
      <div class="rpt-f"><span>موضوع‌ها</span><div class="rpt-topics">${Object.entries(RPT.TOPICS).map(([k, t]) => `<label class="rpt-tg"><input type="checkbox" value="${k}" ${p.topics.includes(k) ? 'checked' : ''}> ${esc(t.n)}</label>`).join('')}</div></div>
      <div class="rpt-f"><span>مخاطب</span>${RPTV.seg('rpAud', RPT.AUD, p.aud)}</div>
      <div class="rpt-f"><span>حجم</span>${RPTV.seg('rpLen', RPT.LEN, p.len)}</div>
      <div class="rpt-f"><span>قالب خروجی</span>${RPTV.seg('rpFmt', RPT.FMT, p.fmt)}</div>
      <label class="rpt-f"><span>استان‌ها</span><select class="sel" id="rpProv" multiple size="4">${provOpts}</select></label>
      <div class="rpt-f"><span>اپراتورها و سکوها</span><div class="rpt-topics">${OPS.map((o) => `<label class="rpt-tg"><input type="checkbox" data-op="${o}" ${p.ops.includes(o) ? 'checked' : ''}> ${o}</label>`).join('')}${M.plat.map((x) => `<label class="rpt-tg"><input type="checkbox" data-pl="${x.k}" ${p.plats.includes(x.k) ? 'checked' : ''}> ${esc(x.n)}</label>`).join('')}</div></div>
    </div>
    <p class="lead rpt-why">${esc(RPTV.why(p))}</p>
    <div class="rpt-act"><button class="go rpt-main" id="rptBuild" type="button">ساخت گزارش</button></div>`;
    ['rpTpl', 'rpAud', 'rpLen', 'rpFmt'].forEach((id) => $$('#' + id + ' button').forEach((b) => b.onclick = () => { $$('#' + id + ' button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); if (id === 'rpTpl') { const tp = b.dataset.k; if (tp !== 'topic' && tp !== 'compare') $$('.rpt-topics input[value]').forEach((c) => { if (({status: ['overview', 'fixed', 'mobile', 'quality', 'nin', 'people', 'decision'], nin: ['nin', 'decision'], incident: ['online'], changes: ['changes']}[tp] || []).includes(c.value)) c.checked = true; }); } }));
    $('#rptBuild').onclick = () => RPTV.make();
    if(scroll)setTimeout(() => $('#rptPlanBox').scrollIntoView({behavior: 'smooth', block: 'nearest'}), 30);
  },
  why(p) {
    const ent = [...p.provs.map((i) => (M.prov.find((x) => x.iso === i) || {}).n), ...p.ops, ...p.plats.map((k) => PLAT[k])].filter(Boolean);
    if(window.RADAR_I18N?.lang==='en'){
      const en=window.RADAR_I18N.toEN;
      return `Interpretation: ${en(RPT.TPL[p.tpl].n)} for ${en(RPT.AUD[p.aud])}; ${en(RPT.LEN[p.len])}; output: ${en(RPT.FMT[p.fmt])}. Topics: ${p.topics.map(t=>en(RPT.TOPICS[t].n)).join(', ')||'—'}${ent.length?'; selected entities: '+ent.map(en).join(', '):''}${p.recipient?'; recipient: '+en(p.recipient):''}. You can change these choices before building the report.`;
    }
    return `برداشت: ${RPT.TPL[p.tpl].n} برای ${RPT.AUD[p.aud]}، ${RPT.LEN[p.len]}، خروجی ${RPT.FMT[p.fmt]}؛ موضوع‌ها: ${p.topics.map((t) => RPT.TOPICS[t].n).join('، ') || '—'}${ent.length ? '؛ موردها: ' + ent.join('، ') : ''}${p.recipient ? '؛ گیرنده: ' + p.recipient : ''}. هر کدام را می‌توانید پیش از ساخت تغییر دهید.`;
  },
  read() {
    const p = RPTV.plan, pick = (id) => ($('#' + id + ' button[aria-pressed="true"]') || {}).dataset.k;
    return {...p, title: $('#rpTitle').value.trim() || RPT.autoTitle(p), recipient: $('#rpTo').value.trim(), tpl: pick('rpTpl'), aud: pick('rpAud'), len: pick('rpLen'), fmt: pick('rpFmt'),
      topics: $$('.rpt-topics input[value]').filter((c) => c.checked).map((c) => c.value), provs: [...$('#rpProv').selectedOptions].map((o) => o.value),
      ops: $$('.rpt-topics input[data-op]').filter((c) => c.checked).map((c) => c.dataset.op), plats: $$('.rpt-topics input[data-pl]').filter((c) => c.checked).map((c) => c.dataset.pl)};
  },
  async make() {
    const pl = RPTV.read();
    if (!pl.topics.length) { TOAST('دست‌کم یک موضوع انتخاب کنید', 'warn'); return; }
    if (pl.provs.length && !pl.topics.includes('provinces')) pl.topics.push('provinces');
    $('#rptWrap').hidden = false; $('#rptDoc').innerHTML = '<div class="empty-state loading"><span class="spin"></span>در حال ساخت گزارش…</div>';
    RPTV.present(await RPT.build(pl));
  },
  present(r, scroll = true) {
    const pl=r.plan;RPTV.rep=r;$('#rptWrap').hidden=false;
    RPTV.render(RPTV.rep);
    $('#rptBar').innerHTML = `<b>${esc(RPTV.rep.title)}</b><span class="dim">${F.i(RPTV.rep.sections.length)} بخش · ${F.i(RPTV.rep.sections.reduce((a, s) => a + s.blocks.filter((b) => b.type === 'fig').length, 0))} شکل · ${F.i(RPTV.rep.sources.length)} منبع</span>
      <button class="go" id="rptFonts" type="button">دریافت فونت ارائه</button><span class="dim">برای نمایش یکسان PowerPoint، فونت وزیرمتن را روی رایانه مقصد نصب کنید.</span>
      ${['pdf', 'docx', 'pptx', 'html'].map((f) => `<button class="go ${f === pl.fmt ? 'rpt-main' : ''}" data-out="${f}" type="button">${{pdf: 'چاپ / PDF', docx: 'دریافت Word', pptx: 'دریافت PowerPoint', html: 'دریافت HTML'}[f]}</button>`).join('')}`;
    $('#rptFonts').onclick = () => RPTX.fonts();
    $$('#rptBar [data-out]').forEach((b) => b.onclick = () => RPTX.out(b.dataset.out, RPTV.rep, b));
    if(scroll)setTimeout(() => $('#rptWrap').scrollIntoView({behavior: 'smooth', block: 'start'}), 50);
  },
  /* A4 preview. Charts are drawn into the paper (light theme) so the same SVGs feed the exports. */
  render(r) {
    const doc = $('#rptDoc'), L = RPT.LBL;
    const blk = (b, si, bi) => {
      if (b.type === 'p') return `<p class="rp-p">${b.label ? `<b class="rp-l rp-${b.label}">${L[b.label]}:</b> ` : ''}${esc(b.text)}</p>`;
      if (b.type === 'kpis') return `<div class="rp-kpis">${b.items.map((k) => `<div class="rp-k"><small>${esc(k.t)}</small><b>${esc(k.v)}</b><span>${esc(k.d || '')}</span><em>${esc(k.ev || '')}</em></div>`).join('')}</div>`;
      if (b.type === 'fig') return `<figure class="rp-fig"><div class="ch" id="rf-${si}-${bi}" style="min-height:${b.h}px"></div><figcaption><b>شکل ${F.i(b.no)}.</b> ${esc(b.caption)} <span>منبع: ${esc(b.src)}</span></figcaption></figure>`;
      if (b.type === 'table') return `<div class="rp-tw"><table class="rp-t"><caption><b>جدول ${F.i(b.no)}.</b> ${esc(b.caption)}</caption><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>${b.src ? `<div class="rp-src">منبع: ${esc(b.src)}</div>` : ''}</div>`;
      if (b.type === 'note') return `<div class="rp-note">${esc(b.text)}</div>`;
      return '';
    };
    doc.innerHTML = `<section class="rp-cover"><div class="rp-brand">رادار فرماندهی شبکه ملی اطلاعات</div><h1>${esc(r.title)}</h1>
      <div class="rp-meta">${esc(RPT.TPL[r.tpl].n)} · برای ${esc(RPT.AUD[r.aud])}${r.recipient ? `<br>به: ${esc(r.recipient)}` : ''}<br>تاریخ: ${esc(r.date)}</div>
      <div class="rp-ver">داده: فصلنامه ۵۷ رگولاتوری (بهار ۱۴۰۵) · کاربرگ پایش تابستان ۱۴۰۵ · فایل‌های استانی شهریور ۱۴۰۵ · ارزیابی اهداف ۱۴۰۳ · حالت ${esc(r.mode)}</div></section>
      <section class="rp-toc"><h2>فهرست</h2><ol><li>خلاصه مدیریتی</li>${r.sections.map((s) => `<li>${esc(s.title)}</li>`).join('')}${r.recs.length ? '<li>اقدام‌های پیشنهادی</li>' : ''}<li>محدودیت‌ها و روش</li><li>پیوست: منابع</li></ol></section>
      <section class="rp-sum"><h2>خلاصه مدیریتی</h2><ol>${r.summary.map((m) => `<li><b>${esc(m.t)}:</b> ${esc(m.s)}</li>`).join('')}</ol></section>
      ${r.sections.map((s, si) => `<section class="rp-sec"><h2><span class="num">${F.i(si + 1)}</span> ${esc(s.title)}</h2>${s.lead ? `<p class="rp-lead">${esc(s.lead)}</p>` : ''}${s.key ? `<div class="rp-keyline">${esc(s.key)}</div>` : ''}${s.blocks.map((b, bi) => blk(b, si, bi)).join('')}</section>`).join('')}
      ${r.recs.length ? `<section class="rp-sec"><h2>اقدام‌های پیشنهادی</h2><p class="rp-lead">پیش‌نویس‌اند و مصوب نیستند؛ هر کدام پیش از تصمیم باید از دروازه خود بگذرد.</p>${r.recs.slice(0, r.aud === 'exec' ? 4 : 8).map((x) => `<div class="rp-rec"><span class="rp-pr rp-${esc(x.p)}">${esc(x.p)}</span><div><b>${esc(x.t)}</b><p>${esc(x.a)}</p><small>دروازه تصمیم: ${esc(x.g)} · ریسک اصلی: ${esc(x.r)}</small></div></div>`).join('')}</section>` : ''}
      <section class="rp-sec"><h2>محدودیت‌ها و روش</h2><ul>${r.limits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      <section class="rp-sec rp-app"><h2>پیوست: منابع</h2><table class="rp-t"><thead><tr><th>بخش</th><th>داده</th><th>منبع</th><th>دوره</th></tr></thead><tbody>${r.sources.map((x) => `<tr><td>${esc(x.sec)}</td><td>${esc(x.t)}${x.key ? ` <span class="mono">${esc(x.key)}</span>` : ''}</td><td>${esc(x.src + (x.url ? ' · ' + x.url : ''))}</td><td>${esc(x.p || '—')}</td></tr>`).join('')}</tbody></table></section>`;
    r.sections.forEach((s, si) => s.blocks.forEach((b, bi) => { if (b.type !== 'fig') return; const el = $('#rf-' + si + '-' + bi); if (!el) return; try { if(window.RADAR_I18N?.withPaperColors)window.RADAR_I18N.withPaperColors(()=>b.draw(el));else b.draw(el); } catch (e) { el.innerHTML = '<div class="empty-state">شکل ساخته نشد</div>'; } const sv = el.querySelector('svg'); if (sv) sv.setAttribute('data-in', '1'); b.el = el; }));
  },
};
