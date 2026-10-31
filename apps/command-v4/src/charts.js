/* ===== chart kit (d3) ===== */
const K = {};
K.svg = (el, h) => {
  el.innerHTML = '';
  const w = Math.max(280, Math.floor(el.clientWidth || el.parentNode.clientWidth || 600));
  const pn = el.closest && el.closest('.p'), title = (pn && pn.querySelector('h3') ? pn.querySelector('h3').textContent : '') || el.getAttribute('aria-label') || 'نمودار';
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('width', w).attr('height', h).attr('role', 'img').attr('aria-label', title + ' (جدول داده برای صفحه‌خوان زیر نمودار)');
  const tip = d3.select(el).append('div').attr('class', 'tip').attr('hidden', '');
  return {svg, w, h, tip};
};
K.measure = (svg, texts, cls = '') => {
  const g = svg.append('g').attr('opacity', 0);
  let m = 0;
  texts.forEach((t) => { const n = g.append('text').attr('class', cls).text(t).node(); m = Math.max(m, n.getComputedTextLength()); });
  g.remove();
  return Math.ceil(m);
};
K.show = (el, tip, ev, head, lines) => {
  const t = tip.node();
  t.innerHTML = `<div class="h">${esc(head)}</div>` + lines.map((l) => `<div>${l.c ? `<i class="sw" style="background:${l.c}"></i>` : ''}${esc(l.t)}</div>`).join('');
  t.hidden = false;
  const b = el.getBoundingClientRect();
  let x = ev.clientX - b.left + 14, y = ev.clientY - b.top - t.offsetHeight - 12;
  x = Math.min(Math.max(4, x), b.width - t.offsetWidth - 4);
  if (y < -10) y = ev.clientY - b.top + 18;
  t.style.left = x + 'px'; t.style.top = y + 'px';
};
K.hide = (tip) => { tip.node().hidden = true; };
/* screen-reader data table appended after a chart */
K.srTable = (el, head, rows) => { const wrap = document.createElement('div'); wrap.className = 'sr srwrap'; const t = document.createElement('table'); t.className = 'sr'; const cap = (el.closest && el.closest('.p') && el.closest('.p').querySelector('h3') ? el.closest('.p').querySelector('h3').textContent : '') || el.getAttribute('aria-label') || ''; t.innerHTML = `<caption>داده نمودار${cap ? ': ' + esc(cap) : ''}</caption><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c == null ? 'ناموجود' : c)}</td>`).join('')}</tr>`).join('')}</tbody>`; wrap.appendChild(t); el.appendChild(wrap); };
/* touch: a tap on a chart element replays as mousemove so tooltips work without hover */
document.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch' || !e.target.closest || !e.target.closest('.ch svg')) return; e.target.dispatchEvent(new MouseEvent('mousemove', {bubbles: true, clientX: e.clientX, clientY: e.clientY})); }, {passive: true});
const rtlText = (sel) => sel.attr('direction', 'rtl');

/* sparkline svg string */
K.spark = (vals, color) => {
  const w = 84, h = 30, mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
  const pts = vals.map((v, i) => [i * (w - 4) / (vals.length - 1) + 2, h - 4 - (v - mn) / rg * (h - 8)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}"><path d="${d}L${last[0]},${h}L2,${h}Z" fill="${color}" opacity=".12"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${last[0]}" cy="${last[1]}" r="2.6" fill="${color}"/></svg>`;
};

/* multi-line time series. o: {xs, series:[{name,c,vals,w,dash}], h, yfmt, tfmt, xlab, yMin, ref, area, endfmt} */
K.line = (el, o) => {
  const h = o.h || 280;
  const {svg, w, tip} = K.svg(el, h);
  const all = o.series.flatMap((s) => s.vals.filter((v) => v != null));
  let lo = o.yMin != null ? Math.min(o.yMin, d3.min(all)) : d3.min(all) * 0.9, hi = d3.max(all) * 1.06;
  const y = d3.scaleLinear([lo, hi], [h - 26, 10]).nice(5);
  const ticks = y.ticks(5);
  const yw = K.measure(svg, ticks.map(o.yfmt)) + 10;
  const ends = o.series.map((s) => { const lv = [...s.vals].reverse().find((v) => v != null); return s.name + '  ' + (lv == null ? 'ناموجود' : (o.endfmt || o.yfmt)(lv)); });
  const ew = o.endLabels === false ? 12 : K.measure(svg, ends, 'l') + 18;
  const x = d3.scalePoint(o.xs, [yw + 6, w - ew]);
  el.__xs = o.xs.map((d) => x(d));
  ticks.forEach((t) => {
    svg.append('line').attr('class', 'gl').attr('x1', yw).attr('x2', w - ew + 6).attr('y1', y(t)).attr('y2', y(t));
    svg.append('text').attr('x', yw - 4).attr('y', y(t)).attr('dy', '.35em').attr('text-anchor', 'end').text(o.yfmt(t));
  });
  if (o.ref != null) svg.append('line').attr('x1', yw).attr('x2', w - ew + 6).attr('y1', y(o.ref)).attr('y2', y(o.ref)).attr('stroke', C.dim).attr('stroke-dasharray', '4 4');
  // x labels with collision skip
  const labs = o.xs.map((d, i) => ({d, i, t: o.xlab(d, i)})).filter((l) => l.t);
  const lw = K.measure(svg, labs.map((l) => l.t)) + 14;
  let lastX = -1e9;
  labs.forEach((l, j) => {
    const px = x(l.d);
    if (px - lastX < lw && j !== labs.length - 1) return;
    lastX = px;
    svg.append('text').attr('x', px).attr('y', h - 6).attr('text-anchor', l.i === 0 ? 'start' : l.i === o.xs.length - 1 ? 'end' : 'middle').text(l.t);
  });
  const defs = svg.append('defs');
  o.series.forEach((s, si) => {
    const pts = s.vals.map((v, i) => [o.xs[i], v]);
    const def = (p) => p[1] != null;
    const ln = d3.line().defined(def).x((p) => x(p[0])).y((p) => y(p[1]));
    if (o.area && si === 0 || s.area) {
      const id = 'g' + Math.random().toString(36).slice(2);
      const gr = defs.append('linearGradient').attr('id', id).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
      [[0, .32], [.5, .1], [1, 0]].forEach(([o2, op]) => gr.append('stop').attr('offset', o2).attr('stop-color', s.c).attr('stop-opacity', op));
      svg.append('path').attr('d', d3.area().defined(def).x((p) => x(p[0])).y0(y(y.domain()[0])).y1((p) => y(p[1]))(pts)).attr('fill', `url(#${id})`);
    }
    svg.append('path').attr('d', ln(pts)).attr('fill', 'none').attr('stroke', s.c).attr('stroke-width', s.w || 2).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round').attr('stroke-dasharray', s.dash || null);
    pts.forEach((p, i) => { if (p[1] == null) svg.append('line').attr('x1', x(p[0])).attr('x2', x(p[0])).attr('y1', 10).attr('y2', h - 26).attr('stroke', C.dim).attr('stroke-dasharray', '1 3').append('title').text('بدون داده'); });
    (o.marks || []).forEach((m) => { if (s.vals[m.i] != null && si === 0) svg.append('circle').attr('cx', x(o.xs[m.i])).attr('cy', y(s.vals[m.i])).attr('r', 6).attr('fill', 'none').attr('stroke', C.amber).attr('stroke-width', 1.6).append('title').text(m.t); });
    const lp = [...pts].reverse().find(def);
    svg.append('circle').attr('cx', x(lp[0])).attr('cy', y(lp[1])).attr('r', 3.6).attr('fill', s.c).attr('stroke', C.bg).attr('stroke-width', 1.5);
  });
  if (o.endLabels !== false) {
    const el2 = o.series.map((s, i) => { const lv = [...s.vals].reverse().find((v) => v != null); return {t: ends[i], y: y(lv), c: s.c}; }).sort((a, b) => a.y - b.y);
    for (let i = 1; i < el2.length; i++) if (el2[i].y - el2[i - 1].y < 15) el2[i].y = el2[i - 1].y + 15;
    el2.forEach((e) => rtlText(svg.append('text').attr('class', 'l').attr('x', w - ew + 12).attr('y', e.y).attr('dy', '.35em').attr('text-anchor', 'end').style('fill', e.c).style('font-weight', 600).text(e.t)));
  }
  const rule = svg.append('line').attr('y1', 10).attr('y2', h - 26).attr('stroke', C.mut).attr('stroke-dasharray', '2 3').attr('opacity', 0);
  const dots = svg.append('g');
  svg.append('rect').attr('x', yw).attr('y', 0).attr('width', w - ew - yw + 6).attr('height', h - 20).attr('fill', 'transparent')
    .on('mousemove', (ev) => {
      const [mx] = d3.pointer(ev);
      let bi = 0, bd = 1e9; o.xs.forEach((d, i) => { const dd = Math.abs(x(d) - mx); if (dd < bd) { bd = dd; bi = i; } });
      const d = o.xs[bi];
      rule.attr('x1', x(d)).attr('x2', x(d)).attr('opacity', 1);
      dots.selectAll('*').remove();
      const lines = [];
      o.series.forEach((s) => { const v = s.vals[bi]; if (v == null) { lines.push({c: s.c, t: s.name + ': ناموجود (بدون داده در منبع)'}); return; } dots.append('circle').attr('cx', x(d)).attr('cy', y(v)).attr('r', 4).attr('fill', s.c); lines.push({c: s.c, t: s.name + ': ' + (o.tfmt || o.yfmt)(v)}); });
      (o.marks || []).filter((m) => m.i === bi).forEach((m) => lines.push({t: '⚠ ' + m.t}));
      K.show(el, tip, ev, o.xtip ? o.xtip(d) : o.xlab(d, bi) || d, lines);
    })
    .on('mouseleave', () => { rule.attr('opacity', 0); dots.selectAll('*').remove(); K.hide(tip); });
  K.srTable(el, ['دوره', ...o.series.map((s) => s.name)], o.xs.map((d, i) => [o.xtip ? o.xtip(d) : d, ...o.series.map((s) => (s.vals[i] == null ? null : (o.tfmt || o.yfmt)(s.vals[i])))]));
};

/* horizontal bars, RTL (labels right). rows: [{l, v, c, t?, tip?, items?}] ; grouped if items */
K.hbar = (el, rows, o = {}) => {
  const bar = o.bar || 16, gap = o.gap || 3, gp = o.gp || 10;
  const n = rows[0] && rows[0].items ? rows[0].items.length : 1;
  const gh = n * bar + (n - 1) * gap;
  const h = rows.length * (gh + gp) + 4;
  const {svg, w, tip} = K.svg(el, h);
  const lw = Math.min(K.measure(svg, rows.map((r) => r.l), 'l') + 12, w * 0.4);
  const vt = rows.flatMap((r) => (r.items || [r]).map((it) => it.t || (o.fmt || F.n)(it.v)));
  const vw = K.measure(svg, vt) + 10;
  const max = o.max || d3.max(rows, (r) => d3.max(r.items || [r], (it) => it.v)) || 1;
  const right = w - lw - 6;
  const x = d3.scaleLinear([0, max], [0, right - vw]);
  rows.forEach((r, ri) => {
    const y0 = ri * (gh + gp) + 2;
    rtlText(svg.append('text').attr('class', 'l').attr('x', w).attr('y', y0 + gh / 2).attr('dy', '.35em').attr('text-anchor', 'start').text(r.l));
    if (o.track) svg.append('rect').attr('x', right - x(max)).attr('y', y0).attr('width', x(max)).attr('height', gh).attr('rx', 3).attr('fill', 'rgba(255,255,255,.025)');
    (r.items || [r]).forEach((it, ii) => {
      const y = y0 + ii * (bar + gap), bw = Math.max(it.v > 0 ? 2 : 0, x(it.v));
      svg.append('rect').attr('x', right - bw).attr('y', y).attr('width', bw).attr('height', bar).attr('rx', Math.min(4, bar / 2)).attr('fill', it.c || C.amber).attr('opacity', it.o || 1)
        .on('mousemove', (ev) => K.show(el, tip, ev, r.l, it.tip || [{c: it.c, t: (it.n ? it.n + ': ' : '') + (it.t || (o.fmt || F.n)(it.v))}]))
        .on('mouseleave', () => K.hide(tip));
      rtlText(svg.append('text').attr('x', right - bw - 6).attr('y', y + bar / 2).attr('dy', '.35em').attr('text-anchor', 'start').attr('class', 'l').style('font-size', '11.5px').text(it.t || (o.fmt || F.n)(it.v)));
    });
  });
  K.srTable(el, ['ردیف', 'مقدار'], rows.flatMap((r) => (r.items || [r]).map((it) => [r.l + (it.n ? ' · ' + it.n : ''), it.t || (o.fmt || F.n)(it.v)])));
};

/* vertical bars: cats, series [{n,c,vals}], stacked? */
K.vbar = (el, o) => {
  const h = o.h || 260;
  const {svg, w, tip} = K.svg(el, h);
  const st = !!o.stacked;
  const totals = o.cats.map((_, i) => (st ? d3.sum(o.series, (s) => s.vals[i] || 0) : d3.max(o.series, (s) => s.vals[i] || 0)));
  const y = d3.scaleLinear([0, o.max || d3.max(totals) * 1.08], [h - 28, 10]).nice(4);
  const ticks = y.ticks(4);
  const yw = K.measure(svg, ticks.map(o.yfmt || F.ax)) + 10;
  const x = d3.scaleBand(o.cats, [yw + 4, w - 4]).padding(o.pad ?? 0.28);
  ticks.forEach((t) => { svg.append('line').attr('class', 'gl').attr('x1', yw).attr('x2', w).attr('y1', y(t)).attr('y2', y(t)); svg.append('text').attr('x', yw - 4).attr('y', y(t)).attr('dy', '.35em').attr('text-anchor', 'end').text((o.yfmt || F.ax)(t)); });
  const xl = o.cats.map((c, i) => (o.xlab ? o.xlab(c, i) : c));
  const maxw = x.bandwidth() + x.step() * x.paddingInner();
  const lw = K.measure(svg, xl);
  const skip = Math.max(1, Math.ceil((lw + 10) / maxw));
  o.cats.forEach((c, i) => {
    if (i % skip === 0 || i === o.cats.length - 1) rtlText(svg.append('text').attr('x', x(c) + x.bandwidth() / 2).attr('y', h - 8).attr('text-anchor', 'middle').text(xl[i]));
    let acc = 0;
    const bw = st ? x.bandwidth() : x.bandwidth() / o.series.length;
    o.series.forEach((s, si) => {
      const missing = s.vals[i] == null, v = s.vals[i] || 0;
      const x0 = st ? x(c) : x(c) + si * bw;
      if (missing && !st) { svg.append('rect').attr('x', x0 + 1).attr('width', Math.max(1, bw - 2)).attr('y', y(0) - 3).attr('height', 3).attr('fill', 'none').attr('stroke', s.c).attr('stroke-dasharray', '2 2').attr('opacity', 0.7).append('title').text(s.n + ': ناموجود'); acc += 0; return; }
      const y1 = st ? y(acc + v) : y(v), y0 = st ? y(acc) : y(0);
      svg.append('rect').attr('x', x0 + (st ? 0 : 1)).attr('width', Math.max(1, bw - (st ? 0 : 2))).attr('y', y1).attr('height', Math.max(0, y0 - y1)).attr('rx', st ? 0 : 3).attr('fill', s.c)
        .on('mousemove', (ev) => K.show(el, tip, ev, o.xtip ? o.xtip(c) : xl[i], o.series.map((q) => ({c: q.c, t: q.n + ': ' + (q.vals[i] == null ? 'ناموجود' : (o.tfmt || F.n)(q.vals[i]))}))))
        .on('mouseleave', () => K.hide(tip));
      acc += v;
    });
    if (o.labels) rtlText(svg.append('text').attr('class', 'l').attr('x', x(c) + x.bandwidth() / 2).attr('y', y(totals[i]) - 6).attr('text-anchor', 'middle').style('font-size', '11px').text(o.labels(totals[i], i)));
  });
};

/* 100% stacked horizontal rows: rows [{l, parts:[{n,v,c}]}] */
K.stack100 = (el, rows, o = {}) => {
  const bh = o.bar || 20, gp = o.gp || 12;
  const h = rows.length * (bh + gp) + 4;
  const {svg, w, tip} = K.svg(el, h);
  const lw = Math.min(K.measure(svg, rows.map((r) => r.l), 'l') + 14, w * 0.35);
  const W = w - lw;
  rows.forEach((r, ri) => {
    const y = ri * (bh + gp) + 2, tot = d3.sum(r.parts, (p) => p.v) || 1;
    rtlText(svg.append('text').attr('class', 'l').attr('x', w).attr('y', y + bh / 2).attr('dy', '.35em').attr('text-anchor', 'start').text(r.l));
    let acc = 0;
    r.parts.forEach((p) => {
      const pw = p.v / tot * (W - 4);
      const x0 = W - 4 - acc - pw;
      svg.append('rect').attr('x', x0).attr('y', y).attr('width', Math.max(0, pw - 1)).attr('height', bh).attr('fill', p.c)
        .on('mousemove', (ev) => K.show(el, tip, ev, r.l, r.parts.map((q) => ({c: q.c, t: q.n + ': ' + F.p(q.v / tot * 100) + (o.raw ? ' · ' + F.i(q.v) : '')}))))
        .on('mouseleave', () => K.hide(tip));
      if (pw > 34) svg.append('text').attr('x', x0 + pw / 2).attr('y', y + bh / 2).attr('dy', '.35em').attr('text-anchor', 'middle').style('fill', INK(p.c)).style('font-size', '10.5px').style('font-weight', 600).text(F.p(p.v / tot * 100, 0));
      acc += pw;
    });
  });
};

/* donut */
K.donut = (el, items, o = {}) => {
  const h = o.h || 220;
  const {svg, w, tip} = K.svg(el, h);
  const r = Math.min(h / 2 - 6, w / 2 - 6), cx = w / 2, cy = h / 2;
  const pie = d3.pie().value((d) => d.v).sort(null).padAngle(0.012);
  const arc = d3.arc().innerRadius(r * 0.66).outerRadius(r).cornerRadius(3);
  const tot = d3.sum(items, (d) => d.v);
  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
  g.selectAll('path').data(pie(items)).join('path').attr('d', arc).attr('fill', (d) => d.data.c)
    .on('mousemove', (ev, d) => K.show(el, tip, ev, d.data.n, [{c: d.data.c, t: F.big(d.data.v) + ' · ' + F.p(d.data.v / tot * 100)}]))
    .on('mouseleave', () => K.hide(tip));
  if (o.center) { g.append('text').attr('text-anchor', 'middle').attr('dy', '-.1em').attr('class', 'l').style('font-size', '20px').style('font-weight', 300).text(o.center[0]); g.append('text').attr('text-anchor', 'middle').attr('dy', '1.4em').style('font-size', '11px').text(o.center[1]); }
};

/* bubble scatter: pts [{n,x,y,r,c}] */
K.bubble = (el, pts, o) => {
  const h = o.h || 300;
  const {svg, w, tip} = K.svg(el, h);
  const pad = {l: 44, r: 16, t: 14, b: 34};
  const x = d3.scaleLinear([0, o.xmax || d3.max(pts, (p) => p.x) * 1.15], [pad.l, w - pad.r]);
  const y = d3.scaleLinear([0, o.ymax || d3.max(pts, (p) => p.y) * 1.15], [h - pad.b, pad.t]);
  const rr = d3.scaleSqrt([0, d3.max(pts, (p) => p.r)], [4, o.rmax || 34]);
  x.ticks(5).forEach((t) => { svg.append('line').attr('class', 'gl').attr('x1', x(t)).attr('x2', x(t)).attr('y1', pad.t).attr('y2', h - pad.b); svg.append('text').attr('x', x(t)).attr('y', h - pad.b + 14).attr('text-anchor', 'middle').text(o.xfmt(t)); });
  y.ticks(5).forEach((t) => { svg.append('line').attr('class', 'gl').attr('x1', pad.l).attr('x2', w - pad.r).attr('y1', y(t)).attr('y2', y(t)); svg.append('text').attr('x', pad.l - 6).attr('y', y(t)).attr('dy', '.35em').attr('text-anchor', 'end').text(o.yfmt(t)); });
  if (o.diag) svg.append('line').attr('x1', x(0)).attr('y1', y(0)).attr('x2', x(Math.min(x.domain()[1], y.domain()[1]))).attr('y2', y(Math.min(x.domain()[1], y.domain()[1]))).attr('stroke', C.dim).attr('stroke-dasharray', '4 4');
  rtlText(svg.append('text').attr('x', w - pad.r).attr('y', h - 2).attr('text-anchor', 'start').style('font-size', '10.5px').text(o.xname));
  rtlText(svg.append('text').attr('x', pad.l + 4).attr('y', pad.t + 2).attr('text-anchor', 'end').style('font-size', '10.5px').text(o.yname));
  pts.forEach((p) => {
    svg.append('circle').attr('cx', x(p.x)).attr('cy', y(p.y)).attr('r', rr(p.r)).attr('fill', p.c).attr('fill-opacity', .28).attr('stroke', p.c).attr('stroke-width', 1.6)
      .on('mousemove', (ev) => K.show(el, tip, ev, p.n, p.tip)).on('mouseleave', () => K.hide(tip));
    rtlText(svg.append('text').attr('class', 'b').attr('x', x(p.x)).attr('y', y(p.y) - rr(p.r) - 5).attr('text-anchor', 'middle').text(p.n));
  });
};

/* radar chart: axes [{n, max}], series [{n,c,vals}] */
K.radar = (el, axes, series, o = {}) => {
  const h = o.h || 300;
  const {svg, w, tip} = K.svg(el, h);
  const cx = w / 2, cy = h / 2 + 4, R = Math.min(w / 2 - 70, h / 2 - 28);
  const ang = (i) => -Math.PI / 2 + i * 2 * Math.PI / axes.length;
  [0.25, 0.5, 0.75, 1].forEach((k) => svg.append('polygon').attr('points', axes.map((_, i) => [cx + Math.cos(ang(i)) * R * k, cy + Math.sin(ang(i)) * R * k].join(',')).join(' ')).attr('fill', 'none').attr('stroke', C.grid));
  axes.forEach((a, i) => {
    svg.append('line').attr('x1', cx).attr('y1', cy).attr('x2', cx + Math.cos(ang(i)) * R).attr('y2', cy + Math.sin(ang(i)) * R).attr('stroke', C.grid);
    const tx = cx + Math.cos(ang(i)) * (R + 14), ty = cy + Math.sin(ang(i)) * (R + 14);
    rtlText(svg.append('text').attr('x', tx).attr('y', ty).attr('dy', '.35em').attr('text-anchor', Math.abs(Math.cos(ang(i))) < 0.2 ? 'middle' : Math.cos(ang(i)) > 0 ? 'end' : 'start').style('font-size', '10.5px').text(a.n));
  });
  series.forEach((s) => {
    const pts = s.vals.map((v, i) => { const k = Math.max(0, Math.min(1, v / axes[i].max)); return [cx + Math.cos(ang(i)) * R * k, cy + Math.sin(ang(i)) * R * k]; });
    svg.append('polygon').attr('points', pts.map((p) => p.join(',')).join(' ')).attr('fill', s.c).attr('fill-opacity', .12).attr('stroke', s.c).attr('stroke-width', 2)
      .on('mousemove', (ev) => K.show(el, tip, ev, s.n, axes.map((a, i) => ({t: a.n + ': ' + (a.fmt || F.n)(s.raw ? s.raw[i] : s.vals[i])}))))
      .on('mouseleave', () => K.hide(tip));
    pts.forEach((p) => svg.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 2.6).attr('fill', s.c));
  });
};

/* heat matrix: rows, cols, val(r,c) -> number, color scale */
K.heat = (el, rows, cols, val, o = {}) => {
  const ch = o.cell || 26;
  const h = rows.length * ch + 30;
  const {svg, w, tip} = K.svg(el, h);
  const lw = K.measure(svg, rows.map((r) => r.n), 'l') + 14;
  const cw = (w - lw) / cols.length;
  const mx = d3.max(rows.flatMap((r) => cols.map((c) => val(r, c) || 0))) || 1;
  const col = d3.scaleSequential([0, mx], d3.interpolateRgb('#121b26', o.color || C.amber));
  cols.forEach((c, j) => rtlText(svg.append('text').attr('x', w - lw - j * cw - cw / 2).attr('y', 12).attr('text-anchor', 'middle').style('font-size', '10.5px').text(c.n)));
  rows.forEach((r, i) => {
    rtlText(svg.append('text').attr('class', 'l').attr('x', w).attr('y', 22 + i * ch + ch / 2).attr('dy', '.35em').attr('text-anchor', 'start').style('font-size', '11.5px').text(r.n));
    cols.forEach((c, j) => {
      const v = val(r, c) || 0, x0 = w - lw - (j + 1) * cw;
      svg.append('rect').attr('x', x0 + 1).attr('y', 22 + i * ch + 1).attr('width', cw - 2).attr('height', ch - 2).attr('rx', 4).attr('fill', v ? col(v) : '#0e151e')
        .on('mousemove', (ev) => K.show(el, tip, ev, r.n + ' · ' + c.n, [{t: F.n(v) + (o.unit || '')}])).on('mouseleave', () => K.hide(tip))
        .on('click', () => o.click && o.click(r, c));
      if (v) svg.append('text').attr('x', x0 + cw / 2).attr('y', 22 + i * ch + ch / 2).attr('dy', '.35em').attr('text-anchor', 'middle').style('fill', INK(col(v))).style('font-size', '11px').style('pointer-events', 'none').text(F.n(v));
    });
  });
};

/* choropleth map of Iran */
K.map = (el, o) => {
  const h = o.h || 460;
  const {svg, w, tip} = K.svg(el, h);
  svg.classed('map', true);
  const root = svg, gz = svg.append('g');
  const proj = d3.geoMercator().fitExtent([[8, 8], [w - 8, h - 8]], GEO);
  const path = d3.geoPath(proj);
  const vals = GEO.features.map((f) => o.val(f.properties.iso)).filter((v) => v != null && !isNaN(v));
  const mx = o.max || d3.max(vals) || 1, mn = o.min ?? 0;
  const sc = d3.scaleSequential([mn, mx], d3.interpolateRgb(o.c0 || '#1a2533', o.c1 || C.amber));
  if (o.log) sc.domain([Math.max(1, mn), mx]);
  const color = (v) => (v == null || isNaN(v) ? '#121a24' : o.log ? d3.scaleSequentialLog([Math.max(1, mn), mx], d3.interpolateRgb(o.c0 || '#1a2533', o.c1 || C.amber))(Math.max(1, v)) : sc(v));
  gz.append('g').selectAll('path').data(GEO.features).join('path').attr('class', (f) => 'pv' + (o.sel === f.properties.iso ? ' sel' : '')).attr('d', path)
    .attr('fill', (f) => color(o.val(f.properties.iso)))
    .on('mousemove', (ev, f) => K.show(el, tip, ev, o.name(f.properties.iso), o.tip(f.properties.iso)))
    .on('mouseleave', () => K.hide(tip))
    .on('click', (ev, f) => o.click && o.click(f.properties.iso));
  // selected outline on top
  if (o.sel) { const f = GEO.features.find((q) => q.properties.iso === o.sel); if (f) gz.append('path').attr('d', path(f)).attr('fill', 'none').attr('stroke', C.amber).attr('stroke-width', 2.2).style('pointer-events', 'none'); }
  // province value labels for top N
  if (o.labels) {
    const top = GEO.features.map((f) => ({f, v: o.val(f.properties.iso)})).filter((d) => d.v != null).sort((a, b) => b.v - a.v).slice(0, o.labels);
    top.forEach(({f, v}) => { const [cx, cy] = path.centroid(f); gz.append('text').attr('x', cx).attr('y', cy).attr('text-anchor', 'middle').attr('dy', '.35em').style('fill', v > mx * 0.55 ? '#0b0f14' : '#e9eef4').style('font-size', '10px').style('font-weight', 600).style('pointer-events', 'none').text(o.lab(v)); });
  }
  const z = d3.zoom().scaleExtent([1, 5]).translateExtent([[0, 0], [w, h]]).on('zoom', (e) => gz.attr('transform', e.transform));
  root.call(z).on('dblclick.zoom', null);
  const zb = d3.select(el).append('div').attr('class', 'zoombtns');
  [['+', 1.6, 'بزرگ‌نمایی نقشه'], ['−', 1 / 1.6, 'کوچک‌نمایی نقشه'], ['⟲', 0, 'بازنشانی نقشه']].forEach(([t, k, l]) => zb.append('button').attr('type', 'button').attr('aria-label', l).text(t).on('click', () => (k ? root.transition().duration(250).call(z.scaleBy, k) : root.transition().duration(250).call(z.transform, d3.zoomIdentity))));
  K.srTable(el, ['استان', 'مقدار'], GEO.features.map((f) => [o.name(f.properties.iso), (o.tip(f.properties.iso)[0] || {}).t || null]));
  d3.select(el).append('p').attr('class', 'mapnote').text('مرزهای استانی از داده مرزی عمومی ساده‌سازی شده‌اند و فقط برای نمایش شاخص به کار می‌روند؛ برای تحلیل جغرافیایی یا داوری درباره مرز رسمی معتبر نیستند.');
  return {color, mx, mn};
};
