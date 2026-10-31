/* ===== v4.5 visual kit: numbers become pictures =====
   VZ.* return static SVG/HTML strings (CSP-safe, no inline handlers) for KPI tiles and cards.
   K.dotrows / K.unitGroups are new d3 charts. MOTION adds entrance animation and count-up.
   Every visual keeps the exact value in text (title/aria/table); nothing is drawn that is not in the data. */
const VZ = (() => {
  const pct = (v) => Math.max(0, Math.min(100, +v || 0));
  const fa = (v, d = 1) => mkNF({maximumFractionDigits: d}, 'fa-IR').format(v);
  /* ring: a share of a whole (0–100). ref = optional earlier value shown as a tick */
  const ring = (v, c, o = {}) => {
    const s = o.size || 62, r = s / 2 - 6, L = 2 * Math.PI * r, p = pct(v);
    const tick = o.ref != null ? (() => { const a = -Math.PI / 2 + 2 * Math.PI * pct(o.ref) / 100; return `<line x1="${s / 2 + Math.cos(a) * (r - 7)}" y1="${s / 2 + Math.sin(a) * (r - 7)}" x2="${s / 2 + Math.cos(a) * (r + 6)}" y2="${s / 2 + Math.sin(a) * (r + 6)}" stroke="var(--fg)" stroke-width="1.6" opacity=".7"/>`; })() : '';
    return `<svg class="vz vz-ring" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" role="img" aria-label="${esc(o.label || fa(v) + '٪ از کل')}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="var(--line2)" stroke-width="7"/><circle class="vz-arc" cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(L * p / 100).toFixed(1)} ${L.toFixed(1)}" style="--L:${L.toFixed(1)}" transform="rotate(-90 ${s / 2} ${s / 2})"/>${tick}<text x="${s / 2}" y="${s / 2}" dy=".35em" text-anchor="middle" class="vz-rt">${o.center != null ? esc(o.center) : fa(p, p < 10 ? 1 : 0) + '٪'}</text></svg>`;
  };
  /* waffle: 100 cells, filled = share. Good for small shares (5٪ of ports in service reads instantly) */
  const waffle = (v, c, o = {}) => {
    const n = Math.round(pct(v)), cs = o.cell || 5.4, g = 1.2, s = 10 * cs + 9 * g;
    let h = '';
    for (let i = 0; i < 100; i++) { const col = i % 10, row = 9 - Math.floor(i / 10); h += `<rect x="${(9 - col) * (cs + g)}" y="${row * (cs + g)}" width="${cs}" height="${cs}" rx="1" fill="${i < n ? c : 'var(--line2)'}"${i < n ? ' class="vz-on"' : ''}/>`; }
    return `<svg class="vz vz-waffle" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" role="img" aria-label="${esc(o.label || fa(v) + ' از هر ۱۰۰')}">${h}</svg>`;
  };
  /* split: one full-width bar cut into parts [{n, v, c}] with a compact legend */
  const split = (parts, o = {}) => {
    const tot = parts.reduce((a, p) => a + (p.v || 0), 0) || 1;
    return `<div class="vz vz-split" role="img" aria-label="${esc(parts.map((p) => p.n + ' ' + fa(p.v / tot * 100) + '٪').join('، '))}"><div class="vz-bar">${parts.map((p) => `<i style="flex:${p.v / tot};background:${p.c}" title="${esc(p.n + ': ' + fa(p.v / tot * 100) + '٪')}"></i>`).join('')}</div><div class="vz-leg">${parts.map((p) => `<span><b style="background:${p.c}"></b>${esc(p.n)} ${fa(p.v / tot * 100, o.d ?? 0)}٪</span>`).join('')}</div></div>`;
  };
  /* meter: value on a scale with an optional reference mark (previous value, target, peer) */
  const meter = (v, max, c, o = {}) => {
    const k = (x) => Math.max(0, Math.min(100, (x / (max || 1)) * 100));
    return `<div class="vz vz-meter" role="img" aria-label="${esc(o.label || '')}"><div class="vz-track"><i class="vz-fill" style="width:${k(v)}%;background:${c}"></i>${o.ref != null ? `<em style="inset-inline-start:${k(o.ref)}%" title="${esc(o.refLabel || '')}"></em>` : ''}</div>${o.caption ? `<div class="vz-cap">${o.caption}</div>` : ''}</div>`;
  };
  /* compare: two or three magnitudes as proportional bars, each with its own label (same unit only) */
  const compare = (items, o = {}) => {
    const mx = Math.max(...items.map((x) => Math.abs(x.v) || 0)) || 1;
    return `<div class="vz vz-cmp" role="img" aria-label="${esc(items.map((x) => x.n + ' ' + x.t).join('، '))}">${items.map((x) => `<div class="vz-row"><span class="vz-n">${esc(x.n)}</span><span class="vz-track"><i style="width:${(Math.abs(x.v) / mx) * 100}%;background:${x.c}"></i></span><span class="vz-t num">${esc(x.t)}</span></div>`).join('')}</div>`;
  };
  /* dots: one dot per item (e.g. 25 NIN goals); "on" items lit in their colour */
  const dots = (items, o = {}) => `<div class="vz vz-dots" role="img" aria-label="${esc(o.label || '')}">${items.map((x) => `<i class="${x.on ? 'on' : ''}" style="--c:${x.c}" title="${esc(x.t || '')}"></i>`).join('')}</div>`;
  /* delta: signed change as a bar growing left/right from zero */
  const delta = (v, max, o = {}) => {
    const w = Math.min(50, (Math.abs(v) / (max || Math.abs(v) || 1)) * 50), up = v >= 0, good = o.goodUp === false ? !up : up;
    return `<span class="vz vz-delta ${good ? 'good' : 'bad'}" role="img" aria-label="${esc(o.label || '')}"><i style="${up ? 'inset-inline-end' : 'inset-inline-start'}:50%;width:${w}%"></i></span>`;
  };
  /* spark with null gaps (never draws a missing year as zero) */
  const spark = (vals, c, o = {}) => {
    const w = o.w || 84, h = o.h || 30, vs = vals.filter((v) => v != null);
    if (!vs.length) return '';
    const mn = o.min ?? Math.min(...vs), mx = o.max ?? Math.max(...vs), rg = mx - mn || 1;
    const X = (i) => (vals.length === 1 ? w / 2 : i * (w - 6) / (vals.length - 1) + 3), Y = (v) => h - 4 - (v - mn) / rg * (h - 8);
    let d = '', pen = false; vals.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); pen = true; });
    const li = vals.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0).pop();
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.label || '')}"><path class="vz-line" d="${d}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>${vals.map((v, i) => (v == null ? `<circle cx="${X(i)}" cy="${h - 3}" r="1.6" fill="var(--dim)"><title>ناموجود</title></circle>` : '')).join('')}<circle cx="${X(li)}" cy="${Y(vals[li])}" r="2.8" fill="${c}"/></svg>`;
  };
  return {ring, waffle, split, meter, compare, dots, delta, spark, fa};
})();

/* ---------- data tables for every chart type (the aria-label promises one) ---------- */
(() => {
  const wrap = (name, after) => { const f = K[name]; K[name] = (el, ...a) => { const r = f(el, ...a); try { if (el && !el.querySelector(':scope > .srwrap')) after(el, ...a); } catch (e) { /* table is an aid; never break the chart */ } return r; }; };
  wrap('vbar', (el, o) => K.srTable(el, ['دسته', ...o.series.map((s) => s.n)], o.cats.map((c, i) => [o.xtip ? o.xtip(c) : c, ...o.series.map((s) => (s.vals[i] == null ? null : (o.tfmt || F.n)(s.vals[i])))])));
  wrap('stack100', (el, rows) => K.srTable(el, ['ردیف', 'بخش', 'سهم'], rows.flatMap((r) => { const t = d3.sum(r.parts, (p) => p.v) || 1; return r.parts.map((p) => [r.l, p.n, F.p(p.v / t * 100)]); })));
  wrap('donut', (el, items) => { const t = d3.sum(items, (d) => d.v) || 1; K.srTable(el, ['بخش', 'مقدار', 'سهم'], items.map((d) => [d.n, F.big(d.v), F.p(d.v / t * 100)])); });
  wrap('bubble', (el, pts, o) => K.srTable(el, ['مورد', o.xname || 'x', o.yname || 'y'], pts.map((p) => [p.n, o.xfmt ? o.xfmt(p.x) : F.n(p.x), o.yfmt ? o.yfmt(p.y) : F.n(p.y)])));
  wrap('radar', (el, axes, series) => K.srTable(el, ['سنجه', ...series.map((s) => s.n)], axes.map((a, i) => [a.n, ...series.map((s) => (a.fmt || F.n)(s.raw ? s.raw[i] : s.vals[i]))])));
  wrap('heat', (el, rows, cols, val, o = {}) => K.srTable(el, ['ردیف', ...cols.map((c) => c.n)], rows.map((r) => [r.n, ...cols.map((c) => F.n(val(r, c) || 0) + (o.unit || ''))])));
})();

/* readable text on any fill: dark ink on light cells, light ink on dark cells (WCAG relative luminance) */
const RGB = (c) => { c = String(c || '').trim(); let m = c.match(/^#([0-9a-f]{6})$/i); if (m) { const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; } m = c.match(/^#([0-9a-f]{3})$/i); if (m) return m[1].split('').map((x) => parseInt(x + x, 16)); m = c.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i); return m ? [+m[1], +m[2], +m[3]] : null; };
const INK = (fill) => { const c = RGB(fill); if (!c) return '#0b0f14'; const L = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * L[0] + 0.7152 * L[1] + 0.0722 * L[2] > 0.2 ? '#0b0f14' : '#eef3f8'; };

/* scorecard as a picture: one row per metric, each operator a dot on that metric's own scale.
   rows: [{n, dir, vals:[...], fmt}] ; ops: [{n, c}] */
K.dotrows = (el, rows, ops, o = {}) => {
  const rh = o.rh || 30, top = 26, h = top + rows.length * rh + 8;
  const {svg, w, tip} = K.svg(el, h);
  const lw = Math.min(K.measure(svg, rows.map((r) => r.n), 'l') + 18, w * 0.34), bw = Math.min(K.measure(svg, ['همراه اول']) + 16, 90);
  const x0 = bw + 8, x1 = w - lw;
  // honest scale: position = share of the best value (higher-better: v/max; lower-better: min/v), so near-equal operators stay together
  const SX = (k) => x0 + 5 + k * (x1 - x0 - 10);
  [0, 0.5, 1].forEach((k) => { svg.append('line').attr('x1', SX(k)).attr('x2', SX(k)).attr('y1', top - 4).attr('y2', h - 6).attr('stroke', 'var(--grid)').attr('stroke-dasharray', k === 1 ? null : '3 4'); svg.append('text').attr('x', SX(k)).attr('y', 12).attr('text-anchor', 'middle').style('font-size', '10px').style('fill', 'var(--dim)').text(k === 1 ? 'بهترین' : F.i(k * 100) + '٪ بهترین'); });
  rtlText(svg.append('text').attr('x', bw).attr('y', 12).attr('text-anchor', 'start').style('font-size', '10.5px').style('fill', 'var(--dim)').text('برتر'));
  const rh2 = rh;
  rows.forEach((r, i) => {
    const y = top + i * rh + rh / 2, vs = r.vals.filter((v) => v != null);
    const mn = Math.min(...vs), mx = Math.max(...vs);
    const sx = (v) => SX(r.dir > 0 ? (mx ? v / mx : 1) : (v ? mn / v : 1));
    if (i % 2 === 0) svg.append('rect').attr('x', 0).attr('y', top + i * rh).attr('width', w).attr('height', rh).attr('fill', 'rgba(255,255,255,.018)');
    rtlText(svg.append('text').attr('class', 'l').attr('x', w).attr('y', y).attr('dy', '.35em').attr('text-anchor', 'start').style('font-size', '11.5px').text(r.n));
    svg.append('line').attr('x1', x0).attr('x2', x1).attr('y1', y).attr('y2', y).attr('stroke', 'var(--line2)').attr('stroke-width', 2).attr('stroke-linecap', 'round');
    const pts = r.vals.map((v, j) => ({v, j})).filter((p) => p.v != null);
    if (pts.length > 1) { const xs = pts.map((p) => sx(p.v)); svg.append('line').attr('x1', Math.min(...xs)).attr('x2', Math.max(...xs)).attr('y1', y).attr('y2', y).attr('stroke', 'var(--mut)').attr('stroke-width', 2).attr('opacity', .45); }
    const bestJ = pts.reduce((b, p) => (b == null || (r.dir > 0 ? p.v > b.v : p.v < b.v) ? p : b), null);
    pts.forEach((p) => {
      svg.append('circle').attr('cx', sx(p.v)).attr('cy', y).attr('r', p === bestJ ? 7 : 5.5).attr('fill', ops[p.j].c).attr('stroke', 'var(--panel)').attr('stroke-width', 2)
        .on('mousemove', (ev) => K.show(el, tip, ev, r.n, r.vals.map((v, j) => ({c: ops[j].c, t: ops[j].n + ': ' + (v == null ? 'ناموجود' : r.fmt(v))})))).on('mouseleave', () => K.hide(tip));
    });
    const na = r.vals.map((v, j) => (v == null ? ops[j].n : null)).filter(Boolean);
    if (na.length) rtlText(svg.append('text').attr('x', x1 - 6).attr('y', y - 9).attr('text-anchor', 'start').style('font-size', '9.5px').style('fill', 'var(--dim)').text(na.join('، ') + ': ناموجود'));
    if (bestJ) { const t = rtlText(svg.append('text').attr('x', bw).attr('y', y).attr('dy', '.35em').attr('text-anchor', 'start').style('font-size', '11px').style('font-weight', 600).style('fill', 'var(--fg)').text(ops[bestJ.j].n)); svg.append('circle').attr('cx', bw + 7 - K.measure(svg, [ops[bestJ.j].n]) - 14).attr('cy', y).attr('r', 3.5).attr('fill', ops[bestJ.j].c); void t; }
  });
  K.srTable(el, ['سنجه', ...ops.map((x) => x.n)], rows.map((r) => [r.n, ...r.vals.map((v) => (v == null ? null : r.fmt(v)))]));
};

/* mixed-unit counts: never on one axis. One mini bar chart per unit, each on its own scale. */
K.unitGroups = (el, items, o = {}) => {
  el.innerHTML = '';
  const groups = [...items.reduce((m, x) => m.set(x.u, [...(m.get(x.u) || []), x]), new Map())];
  groups.forEach(([u, L]) => {
    const box = document.createElement('div'); box.className = 'ug'; box.innerHTML = `<div class="ug-h"><b>${esc(u)}</b><small>مقیاس جداگانه</small></div>`;
    const ch = document.createElement('div'); ch.className = 'ch'; box.appendChild(ch); el.appendChild(box);
    K.hbar(ch, L.map((x) => ({l: x.l, v: x.v, c: x.c, t: (Math.abs(x.v) < 100 && !Number.isInteger(x.v) ? F.n(Math.round(x.v * 100) / 100) : F.i(x.v)) + ' ' + u})), {bar: 13, gp: 7});
  });
};

/* ---------- motion: entrance and count-up (respects reduced motion; off under automation unless asked) ---------- */
const MOTION = (() => {
  const off = () => { try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true; if (navigator.webdriver && localStorage.getItem('radar-motion') !== '1') return true; } catch (e) {} return false; };
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const toLat = (s) => s.replace(/[۰-۹]/g, (d) => FA.indexOf(d));
  const count = (node) => {
    const txt = node.textContent; if (!/[۰-۹]/.test(txt) || txt.length > 14 || node.dataset.cnt) return;
    const m = toLat(txt).match(/^([−+-]?)([\d٬,]*\d)(?:[٫.](\d+))?(.*)$/); if (!m) return;
    const sign = m[1], intS = m[2], dec = m[3] || '', rest = m[4], grouped = /[٬,]/.test(intS);
    const target = parseFloat(intS.replace(/[٬,]/g, '') + (dec ? '.' + dec : '')); if (!isFinite(target) || target === 0) return;
    const nf = mkNF({minimumFractionDigits: dec.length, maximumFractionDigits: dec.length, useGrouping: grouped}, 'fa-IR');
    node.dataset.cnt = '1'; node.setAttribute('aria-label', txt);
    const t0 = performance.now(), D = 900;
    const step = (t) => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); node.textContent = k >= 1 ? txt : sign + nf.format(target * e) + rest; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const enter = (root) => {
    $$('.ch svg:not([data-in]), .vz:not([data-in]), svg.spark:not([data-in])', root).forEach((svg) => {
      svg.setAttribute('data-in', '1');
      let i = 0;
      svg.querySelectorAll('path, rect, circle, polygon, i').forEach((n) => {
        const tag = n.tagName.toLowerCase();
        if (tag === 'path' && (n.getAttribute('fill') === 'none' || n.classList.contains('vz-line')) && !n.getAttribute('stroke-dasharray') && n.getTotalLength) {
          const L = Math.ceil(n.getTotalLength()); if (L > 4 && L < 20000) { n.style.setProperty('--L', L); n.classList.add('vz-draw'); }
        } else if (tag === 'circle' && n.classList.contains('vz-arc')) n.classList.add('vz-sweep');
        else if (tag === 'rect' || tag === 'circle' || tag === 'polygon' || tag === 'i' || (tag === 'path' && n.getAttribute('fill') !== 'none')) {
          if (i < 260) { n.style.animationDelay = Math.min(i * 14, 700) + 'ms'; n.classList.add(n.getAttribute('transform') || n.closest('[transform]') ? 'vz-fade' : 'vz-in'); } i++;
        }
      });
    });
  };
  const run = (root = document) => {
    if (off()) { document.documentElement.classList.add('no-motion'); return; }
    document.documentElement.classList.remove('no-motion');
    enter(root);
    $$('.kpi .v > span:first-child, .nb-n, .vz-big, .bign', root).forEach(count);
  };
  return {run, off};
})();
