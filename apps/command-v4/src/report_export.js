/* ===== v4.8 report exports, all in the browser (offline, no library): PDF via print, Word (.docx), PowerPoint (.pptx), HTML =====
   Charts are taken from the preview SVGs, styles inlined, the Vazirmatn font embedded, and rasterised to PNG at 2×. */
const RPTX = (() => {
  /* ---- zip (stored) ---- */
  const CRC = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
  const crc32 = (u) => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const enc = new TextEncoder();
  const zip = (files) => {
    const parts = [], central = []; let off = 0;
    const u16 = (v) => [v & 255, (v >>> 8) & 255], u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
    files.forEach(([name, data]) => {
      const nb = enc.encode(name), d = typeof data === 'string' ? enc.encode(data) : data, c = crc32(d);
      const head = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nb.length), ...u16(0)]);
      parts.push(head, nb, d);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nb);
      off += head.length + nb.length + d.length;
    });
    const cs = central.reduce((a, x) => a + x.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cs), ...u32(off), ...u16(0)]);
    return new Blob([...parts, ...central, end]);
  };
  const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); };
  // ASCII file name: browsers drop a non-Latin download name for pages opened from file:// (the Persian title stays inside the document)
  const fname = (r, ext) => `radar-report-${r.tpl}-${(r.iso || '').slice(0, 10) || 'draft'}.${ext}`;
  const x = (s) => String(typeof window!=='undefined'&&window.RADAR_I18N?.lang==='en'?window.RADAR_I18N.toEN(String(s??'')):(s == null ? '' : s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---- chart SVG -> standalone SVG (inline styles + embedded font) -> PNG ---- */
  let FONT_CSS = null;
  const fontCss = () => {
    if (FONT_CSS != null) return FONT_CSS;
    const out = [];
    [...document.styleSheets].forEach((ss) => { try { [...ss.cssRules].forEach((r) => { if (r.type === CSSRule.FONT_FACE_RULE && /Vazirmatn/.test(r.cssText) && /font-weight:\s*(400|700)/.test(r.cssText)) out.push(r.cssText); }); } catch (e) { /* cross-origin sheet */ } });
    return (FONT_CSS = out.join('\n'));
  };
  const PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-size', 'font-weight', 'font-family', 'stroke-linecap', 'stroke-linejoin'];
  const standalone = (svg, dark = false) => {
    const cl = svg.cloneNode(true), src = [svg, ...svg.querySelectorAll('*')], dst = [cl, ...cl.querySelectorAll('*')];
    src.forEach((el, i) => { const cs = getComputedStyle(el), d = dst[i]; if (!d.setAttribute) return; d.removeAttribute('class'); d.style.cssText = PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';') + ';animation:none'; });
    const vb = svg.viewBox.baseVal, w = vb && vb.width ? vb.width : svg.clientWidth, h = vb && vb.height ? vb.height : svg.clientHeight;
    if (dark) {
      const bright={'rgb(8, 121, 91)':'#29caa6','rgb(18, 96, 156)':'#7bbfff','rgb(146, 83, 0)':'#ffb340','rgb(186, 48, 46)':'#ff6868','rgb(112, 65, 170)':'#b69bff','rgb(165, 45, 115)':'#ff92c5','rgb(8, 116, 156)':'#7bbfff','rgb(134, 96, 0)':'#ffcf6b','rgb(121, 64, 168)':'#b69bff'};
      const light = (color) => /^(?:white|#fff(?:fff)?|rgb\(255,\s*255,\s*255\))$/i.test(color.trim());
      dst.forEach((el,i)=>{
        if(!el.style)return;
        const cs=getComputedStyle(src[i]);
        if(bright[cs.fill])el.style.fill=bright[cs.fill];if(bright[cs.stroke])el.style.stroke=bright[cs.stroke];
        if(/^(text|tspan)$/i.test(el.tagName)){
          el.style.fill='#ECF3FB';el.style.fontFamily='Vazirmatn';
        } else {
          if(light(cs.fill))el.style.fill='#0B1728';
          if(light(cs.stroke))el.style.stroke='#38536F';
          if(/^(line|path)$/i.test(el.tagName) && /^(?:rgb\((?:0|17|34|51),|#(?:000|111|222|333))/i.test(cs.stroke))el.style.stroke='#718CA8';
        }
      });
    }
    cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); cl.setAttribute('width', w); cl.setAttribute('height', h);
    const st = document.createElementNS('http://www.w3.org/2000/svg', 'style'); st.textContent = fontCss(); cl.insertBefore(st, cl.firstChild);
    return {xml: new XMLSerializer().serializeToString(cl), w, h};
  };
  const png = (svg, scale = 2, bg = '#ffffff') => new Promise((res, rej) => {
    const {xml, w, h} = standalone(svg, bg === '#0B1728'), img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = Math.round(w * scale); c.height = Math.round(h * scale); const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); c.toBlob((b) => b.arrayBuffer().then((ab) => res({data: new Uint8Array(ab), w, h})), 'image/png'); };
    img.onerror = () => rej(new Error('rasterise failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
  const figures = async (r, bg) => {
    const out = [];
    for (const s of r.sections) for (const b of s.blocks) if (b.type === 'fig' && b.el && b.el.querySelector('svg')) { try { out.push({b, s, ...(await png(b.el.querySelector('svg'), 2, bg))}); } catch (e) { console.error(e); } }
    return out;
  };

  /* ---- Word ---- */
  const FONT = 'Vazirmatn';
  const run = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>${o.b ? '<w:b/><w:bCs/>' : ''}${o.c ? `<w:color w:val="${o.c}"/>` : ''}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ''}${window.RADAR_PRESENTATION?.lang==='en'?'':'<w:rtl/>'}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  const para = (runs, o = {}) => `<w:p><w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ''}${o.keep ? '<w:keepNext/>' : ''}${o.pb ? '<w:pageBreakBefore/>' : ''}${window.RADAR_PRESENTATION?.lang==='en'?'':'<w:bidi/>'}<w:jc w:val="${o.jc || 'both'}"/>${o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : ''}${o.ind ? `<w:ind w:start="${o.ind}"/>` : ''}<w:spacing w:after="${o.after ?? 120}" w:line="${o.line || 300}" w:lineRule="auto"/></w:pPr>${runs}</w:p>`;
  const LBLC = {says: '1F6F50', calc: '2D5DA8', infer: '8A5A00'};
  const table = (head, rows) => `<w:tbl><w:tblPr>${window.RADAR_PRESENTATION?.lang==='en'?'':'<w:bidiVisual/>'}<w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${['top', 'start', 'bottom', 'end', 'insideH', 'insideV'].map((s) => `<w:${s} w:val="single" w:sz="4" w:color="C9CED6"/>`).join('')}</w:tblBorders><w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:start w:w="90" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:end w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr>
    <w:tr><w:trPr><w:tblHeader/></w:trPr>${head.map((h) => `<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="1F3A5F"/></w:tcPr>${para(run(h, {b: 1, c: 'FFFFFF', sz: 18}), {jc: 'center', after: 0, line: 260})}</w:tc>`).join('')}</w:tr>
    ${rows.map((row, i) => `<w:tr>${row.map((c) => `<w:tc><w:tcPr>${i % 2 ? '<w:shd w:val="clear" w:color="auto" w:fill="F3F5F8"/>' : ''}</w:tcPr>${para(run(c, {sz: 18}), {jc: 'center', after: 0, line: 260})}</w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`;
  const pic = (rid, idn, wpx, hpx, name) => { const W = Math.min(6.3 * 914400, wpx * 9525), H = Math.round(W * hpx / wpx); return `<w:p><w:pPr>${window.RADAR_PRESENTATION?.lang==='en'?'':'<w:bidi/>'}<w:jc w:val="center"/><w:keepNext/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${W}" cy="${H}"/><wp:docPr id="${idn}" name="${x(name)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${idn}" name="${x(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${W}" cy="${H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`; };
  const docx = async (r) => {
    const figs = await figures(r, '#ffffff'), media = [], body = [];
    const H = (t, lvl, o = {}) => para(run(t, {}), {style: 'Heading' + lvl, keep: 1, jc: 'both', ...o});
    body.push(para(run('رادار فرماندهی شبکه ملی اطلاعات', {c: '6B7684', sz: 22}), {jc: 'center', after: 1600}));
    body.push(para(run(r.title, {}), {style: 'Title', jc: 'center'}));
    body.push(para(run(`${RPT.TPL[r.tpl].n} · برای ${RPT.AUD[r.aud]}`, {c: '44505F', sz: 26}), {jc: 'center', after: 200}));
    if (r.recipient) body.push(para(run('به: ' + r.recipient, {b: 1, sz: 26}), {jc: 'center'}));
    body.push(para(run('تاریخ: ' + r.date, {sz: 22}), {jc: 'center', after: 1400}));
    body.push(para(run('داده: فصلنامه ۵۷ رگولاتوری (بهار ۱۴۰۵) · کاربرگ پایش تابستان ۱۴۰۵ · فایل‌های استانی شهریور ۱۴۰۵ · ارزیابی اهداف ۱۴۰۳ · حالت ' + r.mode, {c: '6B7684', sz: 18}), {jc: 'center'}));
    body.push(H('خلاصه مدیریتی', 1, {pb: 1}));
    r.summary.forEach((m, i) => body.push(para(run(`${F.i(i + 1)}. ${m.t}: `, {b: 1}) + run(m.s), {shade: 'EEF3F9', after: 80})));
    let fi = 0;
    r.sections.forEach((s, si) => {
      body.push(H(`${F.i(si + 1)}. ${s.title}`, 1, {pb: si === 0 || r.aud === 'expert'}));
      if (s.lead) body.push(para(run(s.lead, {c: '5A6472'})));
      if (s.key) body.push(para(run(s.key, {b: 1}), {shade: 'FFF6E0'}));
      s.blocks.forEach((b) => {
        if (b.type === 'p') body.push(para((b.label ? run(RPT.LBL[b.label] + ': ', {b: 1, c: LBLC[b.label]}) : '') + run(b.text)));
        else if (b.type === 'kpis') body.push(table(b.items.map((k) => k.t), [b.items.map((k) => k.v), b.items.map((k) => (k.d || '') + (k.ev ? ' · ' + k.ev : ''))]), para('', {after: 60}));
        else if (b.type === 'note') body.push(para(run('محدودیت: ', {b: 1, c: '8A5A00'}) + run(b.text, {c: '5A4A20'}), {shade: 'FBF4E4'}));
        else if (b.type === 'table') body.push(para(run(`جدول ${F.i(b.no)}. ${b.caption}`, {b: 1, sz: 20}), {keep: 1, after: 60}), table(b.head, b.rows), para(run(b.src ? 'منبع: ' + b.src : '', {c: '6B7684', sz: 16}), {after: 160}));
        else if (b.type === 'fig') { const f = figs.find((z) => z.b === b); if (!f) return; fi++; const rid = 'rIdImg' + fi; media.push([`word/media/fig${fi}.png`, f.data, rid]); body.push(pic(rid, fi, f.w, f.h, 'شکل ' + b.no), para(run(`شکل ${F.i(b.no)}. ${b.caption} — منبع: ${b.src}`, {c: '44505F', sz: 18}), {jc: 'center', after: 200})); }
      });
    });
    if (r.recs.length) { body.push(H('اقدام‌های پیشنهادی', 1, {pb: 1})); body.push(para(run('پیش‌نویس‌اند و مصوب نیستند؛ هر کدام پیش از تصمیم باید از دروازه خود بگذرد.', {c: '5A6472'}))); r.recs.slice(0, r.aud === 'exec' ? 4 : 8).forEach((m) => { body.push(H(`${m.p} · ${m.t}`, 2)); body.push(para(run(m.a))); body.push(para(run('دروازه تصمیم: ', {b: 1}) + run(m.g) + run(' · ریسک اصلی: ', {b: 1}) + run(m.r), {after: 160})); }); }
    body.push(H('محدودیت‌ها و روش', 1, {pb: !r.recs.length}));
    r.limits.forEach((l) => body.push(para(run('• ' + l))));
    body.push(H('پیوست: منابع', 1));
    body.push(table(['بخش', 'داده', 'منبع', 'دوره'], r.sources.map((s) => [s.sec, s.t + (s.key ? ' (' + s.key + ')' : ''), s.src + (s.url ? ' · ' + s.url : ''), s.p || '—'])));
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body.join('')}<w:sectPr><w:footerReference w:type="default" r:id="rIdFtr"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1300" w:right="1250" w:bottom="1300" w:left="1250" w:header="600" w:footer="600" w:gutter="0"/>${window.RADAR_PRESENTATION?.lang==='en'?'':'<w:bidi/>'}</w:sectPr></w:body></w:document>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}" w:eastAsia="${FONT}"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="1D2530"/><w:lang w:val="${window.RADAR_PRESENTATION?.lang==='en'?'en-GB':'fa-IR'}" w:bidi="fa-IR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr>${window.RADAR_PRESENTATION?.lang==='en'?'':'<w:bidi/>'}</w:pPr></w:pPrDefault></w:docDefaults>
      <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
      <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="300"/></w:pPr><w:rPr><w:b/><w:bCs/><w:color w:val="1F3A5F"/><w:sz w:val="48"/><w:szCs w:val="48"/></w:rPr></w:style>
      <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="140"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="E2A33B"/></w:pBdr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:bCs/><w:color w:val="1F3A5F"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>
      <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:bCs/><w:color w:val="2D5DA8"/><w:sz w:val="25"/><w:szCs w:val="25"/></w:rPr></w:style></w:styles>`;
    const footer = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${para(run(r.title + ' · رادار فرماندهی شبکه ملی اطلاعات · صفحه ', {c: '8A93A0', sz: 16}) + `<w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`, {jc: 'center', after: 0})}</w:ftr>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFtr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${media.map(([p, , rid]) => `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${p.replace('word/', '')}"/>`).join('')}</Relationships>`;
    const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
    const root = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
    const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(r.title)}</dc:title><dc:creator>رادار فرماندهی شبکه ملی اطلاعات</dc:creator><dc:language>fa-IR</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">${r.iso.slice(0, 19)}Z</dcterms:created></cp:coreProperties>`;
    return zip([['[Content_Types].xml', ct], ['_rels/.rels', root], ['docProps/core.xml', core], ['word/document.xml', doc], ['word/styles.xml', styles], ['word/footer1.xml', footer], ['word/_rels/document.xml.rels', rels], ...media.map(([p, d]) => [p, d])]);
  };

  /* ---- PowerPoint (16:9, dark radar theme) ---- */
  const EMU = 12700, SW = 12192000, SH = 6858000;
  const PFONT = 'Vazirmatn';
  // Mixed Persian/Latin text: Latin and digit runs (4G, M04, NIN1400-1404.xlsx, ms) get their own run tagged en-US so
  // PowerPoint/LibreOffice keep them in order inside right-to-left paragraphs.
  const LAT = /([A-Za-z0-9][A-Za-z0-9.,%/_:+\-]*(?:[ ]+[A-Za-z0-9][A-Za-z0-9.,%/_:+\-]*)*)/;
  const runs = (t, o) => String(typeof window!=='undefined'&&window.RADAR_I18N?.lang==='en'?window.RADAR_I18N.toEN(String(t??'')):(t == null ? '' : t)).split(LAT).filter((s) => s !== '').map((s, i) => { const lat = LAT.test(s) && s.match(LAT)[0] === s; return `<a:r><a:rPr lang="${lat ? 'en-US' : 'fa-IR'}" altLang="fa-IR" sz="${o.sz || 1600}" b="${o.b ? 1 : 0}" dirty="0"><a:solidFill><a:srgbClr val="${o.c || 'E9EEF4'}"/></a:solidFill><a:latin typeface="${PFONT}"/><a:cs typeface="${PFONT}"/></a:rPr><a:t>${x(s)}</a:t></a:r>`; }).join('') || `<a:endParaRPr lang="${window.RADAR_PRESENTATION?.lang==='en'?'en-GB':'fa-IR'}" sz="${o.sz || 1600}"/>`;
  const tx = (t, o = {}) => `<a:p><a:pPr algn="${o.algn || (typeof window!=='undefined'&&window.RADAR_PRESENTATION?.lang==='en'?'l':'r')}" rtl="${typeof window!=='undefined'&&window.RADAR_PRESENTATION?.lang==='en'?0:1}">${o.ln ? `<a:lnSpc><a:spcPct val="${Math.round(o.ln * 1000)}"/></a:lnSpc>` : ''}${o.sp ? `<a:spcBef><a:spcPts val="${o.sp}"/></a:spcBef>` : ''}${o.bullet ? `<a:buClr><a:srgbClr val="${o.buc || '56D8CB'}"/></a:buClr><a:buFont typeface="Arial"/><a:buChar char="•"/>` : '<a:buNone/>'}</a:pPr>${runs(t, o)}</a:p>`;
  let spid = 10;
  const box = (xx, y, w, h, paras, o = {}) => `<p:sp><p:nvSpPr><p:cNvPr id="${++spid}" name="t${spid}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${xx}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="${o.round ? 'roundRect' : 'rect'}"><a:avLst/></a:prstGeom>${o.fill ? `<a:solidFill><a:srgbClr val="${o.fill}"/></a:solidFill>` : '<a:noFill/>'}${o.line ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${o.line}"/></a:solidFill></a:ln>` : ''}</p:spPr><p:txBody><a:bodyPr wrap="square" lIns="91440" rIns="91440" tIns="45720" bIns="45720" anchor="${o.anchor || 't'}"><a:noAutofit/></a:bodyPr><a:lstStyle/>${paras}</p:txBody></p:sp>`;
  const bar = (y, c) => `<p:sp><p:nvSpPr><p:cNvPr id="${++spid}" name="b${spid}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${SW - 640080}" y="${y}"/><a:ext cx="91440" cy="548640"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${c}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr></p:sp>`;
  const picS = (rid, xx, y, w, h) => `<p:pic><p:nvPicPr><p:cNvPr id="${++spid}" name="fig${spid}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${xx}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
  const slideXml = (shapes) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:srgbClr val="132C46"/></a:gs><a:gs pos="100000"><a:srgbClr val="081321"/></a:gs></a:gsLst><a:lin ang="5400000" scaled="1"/></a:gradFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
  const cut = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n) > n * 0.6 ? s.lastIndexOf(' ', n) : n) + '…' : s);
  // RADAR_PPT_COMMAND_V4: fixed slide budget per length; nothing dropped silently — anything not on the canvas
  // (full paragraphs, tables, every caveat, every recommendation, every source) is in that slide's speaker notes,
  // and every caveat also appears on a «حدود تفسیر» slide.
  const pptx = async (r) => {
    const figs = await figures(r, '#0B1728');
    const slides = []; spid = 10;
    const M0 = 600000, W0 = SW - M0 * 2, TOP = 1500000, BOT = SH - 520000;
    const brief = r.plan.len === 'brief', full = r.plan.len === 'full';
    const C = {fg: 'ECF3FB', mut: 'A8BCD1', acc: '56D8CB', amb: 'FFB340', card: '12263D', line: '284A6B'};
    const chunks = (a, n) => Array.from({length: Math.ceil(a.length / n)}, (_, i) => a.slice(i * n, (i + 1) * n));
    // estimated wrapped line count for a Persian string at sz (1/100 pt) in a box w EMU wide (Vazirmatn ≈ .5em average)
    const nLines = (s, w, sz) => Math.max(1, Math.ceil(String(s || '').length * sz / 100 * 12700 * 0.5 / (w - 182880)));
    const hOf = (s, w, sz, ln = 118) => nLines(s, w, sz) * sz / 100 * 12700 * ln / 100;
    // largest size between max and min that fits; below min the text is shortened on the slide (full text stays in notes)
    const fit = (s, w, h, max, min) => { for (let sz = max; sz >= min; sz -= 100) if (hOf(s, w, sz) <= h) return {s, sz}; let t = String(s); while (t.length > 20 && hOf(t + '…', w, min) > h) t = t.slice(0, t.lastIndexOf(' ', t.length - 2) > 0 ? t.lastIndexOf(' ', t.length - 2) : t.length - 10); return {s: t === String(s) ? t : t + '…', sz: min}; };
    const T = (s, w, h, max, min, o = {}) => { const f = fit(s, w, h, max, min); return tx(f.s, {c: C.fg, ln: 118, ...o, sz: f.sz}); };
    const rect = (xx, y, w, h, fill, o = {}) => `<p:sp><p:nvSpPr><p:cNvPr id="${++spid}" name="r${spid}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${xx}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="${o.round ? 'roundRect' : 'rect'}"><a:avLst>${o.round ? '<a:gd name="adj" fmla="val 7000"/>' : ''}</a:avLst></a:prstGeom><a:solidFill><a:srgbClr val="${fill}">${o.alpha ? `<a:alpha val="${o.alpha}"/>` : ''}</a:srgbClr></a:solidFill>${o.line ? `<a:ln w="9525"><a:solidFill><a:srgbClr val="${o.line}"/></a:solidFill></a:ln>` : '<a:ln><a:noFill/></a:ln>'}</p:spPr></p:sp>`;
    const head = (t, sub) => rect(SW - M0 - 60000, 380000, 60000, 520000, C.amb) + box(M0, 300000, W0 - 160000, 640000, T(t, W0 - 160000, 640000, 2800, 2000, {b: 1}), {anchor: 'ctr'}) + (sub ? box(M0, 930000, W0 - 160000, 420000, T(sub, W0 - 160000, 420000, 1400, 1100, {c: C.mut})) : '');
    const foot = (src) => box(M0 + 500000, SH - 440000, W0 - 500000, 300000, tx('رادار فرماندهی شبکه ملی اطلاعات' + (src ? ' · منبع: ' + src : ''), {sz: 950, c: '7F93A8'}));
    const add = (shapes, rels = [], notes = '', src = '') => slides.push({x: shapes + foot(src), rels, notes});
    const callout = (s, y, h, w = W0, xx = M0) => rect(xx, y, w, h, C.card, {round: 1, line: C.line}) + rect(xx + w - 50000, y, 50000, h, C.acc) + box(xx + 120000, y, w - 260000, h, T(s, w - 260000, h - 60000, 1900, 1400, {b: 1, c: C.acc}), {anchor: 'ctr'});
    const bullets = (items, xx, y, w, h, max = 1600, min = 1200) => { const per = h / Math.max(1, items.length); return box(xx, y, w, h, items.map((it) => { const f = fit(it.t, w, per - 80000, max, min); return (it.l ? tx(it.l, {sz: Math.max(1000, f.sz - 300), c: it.lc || C.mut, sp: 600}) : '') + tx(f.s, {sz: f.sz, c: C.fg, ln: 118, bullet: !it.l, sp: it.l ? 100 : 600}); }).join('')); };
    const LBLCOL = {says: '7FD8A8', calc: '8FC1FF', infer: 'FFCB7A'};
    // native PowerPoint table; row heights from the estimated wrap, rows that do not fit stay in the notes
    const ptable = (head2, rows, xx, y, w, h, sz = 1100) => {
      const cw = Math.floor(w / head2.length), cellH = (t) => hOf(String(t).slice(0, 90), cw - 91440, sz, 112) + 70000;
      const all = [head2, ...rows].map((row) => Math.max(330000, ...row.map(cellH)));
      let used = 0, n = 0; for (const rh of all) { if (used + rh > h) break; used += rh; n++; }
      const cell = (t, hd, alt) => `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${tx(String(t).slice(0, 90), {sz, b: hd, c: hd ? '0B1728' : C.fg, algn: 'ctr'})}</a:txBody><a:tcPr marL="45720" marR="45720" marT="22860" marB="22860" anchor="ctr"><a:solidFill><a:srgbClr val="${hd ? '56D8CB' : alt ? '16304D' : '0F2238'}"/></a:solidFill></a:tcPr></a:tc>`;
      return {h: used, shown: Math.max(0, n - 1), x: `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${++spid}" name="tbl${spid}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${xx}" y="${y}"/><a:ext cx="${w}" cy="${used}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>${head2.map(() => `<a:gridCol w="${cw}"/>`).join('')}</a:tblGrid>${[head2, ...rows].slice(0, n).map((row, i) => `<a:tr h="${all[i]}">${(window.RADAR_PRESENTATION?.lang==='en'?[...row]:[...row].reverse()).map((c) => cell(c, i === 0, i % 2)).join('')}</a:tr>`).join('')}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`};
    };
    const tableNotes = (b) => [b.caption, b.head.join(' | '), ...b.rows.map((row) => row.join(' | ')), 'منبع: ' + (b.src || '')].join('\n');
    const withheld = r.sections.filter((s) => s.period === 'withheld');
    const allCaveats = r.sections.filter((s) => s.period !== 'withheld').flatMap((s) => s.blocks.filter((b) => b.type === 'note').map((b) => ({t: b.text, l: s.title})));
    const srcList = [...new Set(r.sources.map((s) => s.src + (s.p ? ' · ' + s.p : '')))];
    const srcNotes = [...new Set(r.sources.map((s) => s.sec + ' · ' + s.t + ': ' + s.src + (s.p ? ' · ' + s.p : '') + (s.url ? '\n' + s.url : '')))].join('\n\n');

    // 1. cover
    add(rect(0, 0, 160000, SH, C.amb) + box(M0, 1100000, W0, 450000, tx('رادار فرماندهی شبکه ملی اطلاعات', {sz: 1700, c: C.acc, b: 1})) +
      box(M0, 1650000, W0, 1900000, T(r.title, W0, 1900000, 4000, 2800, {b: 1}), {anchor: 'ctr'}) +
      rect(SW - M0 - 2400000, 3700000, 2400000, 30000, C.line) +
      box(M0, 3850000, W0, 1300000, tx(`${RPT.TPL[r.tpl].n} · برای ${RPT.AUD[r.aud]} · ${RPT.LEN[r.plan.len]}`, {sz: 1800, c: C.fg}) + (r.recipient ? tx('گیرنده: ' + r.recipient, {sz: 1600, c: C.fg, sp: 400}) : '') + tx(r.date, {sz: 1500, c: C.mut, sp: 400})) +
      box(M0, 5450000, W0, 700000, tx('داده: فصلنامه ۵۷ رگولاتوری (بهار ۱۴۰۵)، کاربرگ پایش تابستان ۱۴۰۵، فایل‌های استانی شهریور ۱۴۰۵، ارزیابی اهداف ۱۴۰۳. هیچ عددی برآورد یا ساخته نشده است.', {sz: 1100, c: C.mut}) + tx('برچسب شاهد در متن: «منبع می‌گوید» نقل منبع · «محاسبه رادار» محاسبه از همان داده · «استنباط» تفسیر', {sz: 1100, c: C.mut, sp: 200})),
    [], [r.title, r.recipient || '', ...r.limits].filter(Boolean).join('\n\n'));

    // 2. executive summary: two-column cards, up to 8 per slide
    chunks(r.summary, 8).forEach((page, pi, all) => {
      const rows = Math.ceil(page.length / 2), gap = 140000, cw = (W0 - gap) / 2, ch = Math.min(1500000, (BOT - TOP - gap * (rows - 1)) / rows);
      let sh = head('خلاصه مدیریتی' + (pi ? ' (ادامه)' : ''), all.length > 1 ? `${F.i(pi * 8 + 1)} تا ${F.i(pi * 8 + page.length)} از ${F.i(r.summary.length)} یافته` : `${F.i(r.summary.length)} یافته اصلی؛ هر کدام در بخش خود با شکل و منبع آمده است`);
      page.forEach((m, j) => {
        const xx = j % 2 === 0 ? M0 + cw + gap : M0, y = TOP + Math.floor(j / 2) * (ch + gap);
        sh += rect(xx, y, cw, ch, C.card, {round: 1, line: C.line}) + box(xx + 80000, y + 50000, cw - 160000, 380000, tx(`${F.i(pi * 8 + j + 1)}. ${m.t}`, {sz: 1500, b: 1, c: C.acc})) + box(xx + 80000, y + 400000, cw - 160000, ch - 430000, T(m.s, cw - 160000, ch - 450000, 1500, 1150));
      });
      add(sh, [], page.map((m) => m.t + ': ' + m.s).join('\n\n'));
    });

    // 3. sections
    if (withheld.length) {
      const items = withheld.map((s) => ({l: `${F.i(r.sections.indexOf(s) + 1)}. ${s.title}`, lc: C.amb, t: (s.blocks[0] || {}).text || ''}));
      add(head('بخش‌های بدون داده برای دوره درخواستی', `${F.i(withheld.length)} بخش از ${F.i(r.sections.length)}؛ عدد دوره دیگری جای آن‌ها نیامده است`) + bullets(items, M0, TOP, W0, BOT - TOP, 1400, 1050), [], items.map((i) => i.l + ': ' + i.t).join('\n\n'));
    }
    r.sections.forEach((s, si) => {
      if (s.period === 'withheld') return; // listed together on the slide above
      if (s.id === 'changes') { // one native table per change type, continued over as many slides as needed; full rows (all columns, ids) in notes
        const title = `${F.i(si + 1)}. ${s.title}`, ps = s.blocks.filter((b) => b.type === 'p' || b.type === 'note'), tbs = s.blocks.filter((b) => b.type === 'table');
        const allNotes = [s.key, ...ps.map((b) => b.text), ...tbs.map(tableNotes)].filter(Boolean).join('\n\n');
        let sh = head(title, s.lead) + (s.key ? callout(s.key, TOP, 680000) : '') + bullets([...ps.slice(0, 4).map((b) => ({t: b.text})), ...(ps.length > 4 ? [{t: `${F.i(ps.length - 4)} نکته و محدودیت دیگر در یادداشت سخنران و اسلاید «حدود تفسیر»`}] : [])], M0, TOP + 820000, W0, BOT - TOP - 820000, 1400, 1050);
        add(sh, [], allNotes, 'رادار؛ سیاست CHANGES_V1');
        const COLS = [1, 2, 3, 4, 0]; // مورد و نوع، قبل، بعد، اختلاف، شناسه تغییر
        tbs.forEach((tb) => { let rest = tb.rows, part = 0;
          while (rest.length) {
            const pt = ptable(COLS.map((c) => tb.head[c]), rest.map((row) => COLS.map((c) => row[c])), M0, TOP, W0, BOT - TOP - 420000, 1000);
            const shown = Math.max(1, pt.shown);
            add(head(tb.caption + (part ? ' (ادامه)' : ''), `ردیف ${F.i(tb.rows.length - rest.length + 1)} تا ${F.i(tb.rows.length - rest.length + shown)} از ${F.i(tb.rows.length)} · زمان مشاهده و اهمیت هر ردیف در یادداشت سخنران و نسخه Word`) + pt.x, [], tableNotes({...tb, rows: rest.slice(0, shown)}), tb.src);
            rest = rest.slice(shown); part++;
          }
        });
        return;
      }
      if (s.id === 'decision' && r.recs.length) return; // the recommendations slide carries it (same number); its table and paragraphs go to that slide's notes
      const sf = figs.filter((f) => f.s === s), ps = s.blocks.filter((b) => b.type === 'p'), caveats = s.blocks.filter((b) => b.type === 'note').map((b) => b.text);
      const tables = s.blocks.filter((b) => b.type === 'table'), kpis = s.blocks.filter((b) => b.type === 'kpis').flatMap((b) => b.items);
      const notes = [s.title, s.lead, s.key, ...ps.map((b) => (b.label ? RPT.LBL[b.label] + ': ' : '') + b.text), ...caveats.map((c) => 'محدودیت: ' + c), ...tables.map(tableNotes), ((s.src || []).map((x2) => x2.src + (x2.p ? ' · ' + x2.p : '') + (x2.url ? ' ' + x2.url : ''))).join('\n')].filter(Boolean).join('\n\n');
      const srcLine = [...new Set((s.src || []).map((x2) => x2.src))].slice(0, 2).join('؛ ');
      const title = `${F.i(si + 1)}. ${s.title}`;
      const ev = ps.slice(0, brief ? 2 : 3).map((b) => ({l: b.label ? RPT.LBL[b.label] : '', lc: LBLCOL[b.label], t: b.text}));
      if (kpis.length) {
        // KPI grid: up to 6 per slide, 3 columns
        chunks(kpis, 6).forEach((page, pi) => {
          const cols = 3, rows = Math.ceil(page.length / cols), gap = 140000, cw = (W0 - gap * 2) / cols, top = TOP + (s.key && !pi ? 820000 : 0), ch = Math.min(1900000, (BOT - top - gap * (rows - 1)) / rows);
          let sh = head(title + (pi ? ' (ادامه)' : ''), s.lead) + (s.key && !pi ? callout(s.key, TOP, 680000) : '');
          page.forEach((k, j) => {
            const xx = SW - M0 - (j % cols + 1) * cw - (j % cols) * gap, y = top + Math.floor(j / cols) * (ch + gap);
            sh += rect(xx, y, cw, ch, C.card, {round: 1, line: C.line}) + box(xx + 60000, y + 60000, cw - 120000, 380000, T(k.t, cw - 120000, 380000, 1400, 1100, {c: C.mut, b: 1})) +
              box(xx + 60000, y + 430000, cw - 120000, 700000, T(k.v, cw - 120000, 700000, 3400, 2200, {b: 1, c: C.acc}), {anchor: 'ctr'}) +
              box(xx + 60000, y + 1150000, cw - 120000, ch - 1180000, T([k.d, k.ev].filter(Boolean).join(' · '), cw - 120000, ch - 1200000, 1150, 950, {c: C.mut}));
          });
          add(sh, [], notes, srcLine);
        });
        if (!brief && ev.length) add(head(title + ' · تحلیل', s.lead) + bullets(ev, M0, TOP, W0, BOT - TOP, 1700, 1300), [], notes, srcLine);
        return;
      }
      if (sf.length) {
        sf.slice(0, brief ? 1 : full ? sf.length : 2).forEach((f, fi) => {
          const rid = `rIdF${si}_${fi}`, top = TOP + 820000, availH = BOT - top - 380000;
          const wide = f.w / f.h > 2.3 || !ev.length || fi > 0;
          const maxW = wide ? W0 : Math.round(W0 * 0.6);
          const ratio = Math.min(maxW / f.w, availH / f.h), fw = Math.round(f.w * ratio), fh = Math.round(f.h * ratio);
          let sh = head(title, fi ? f.b.caption : s.lead) + callout(fi ? (s.key || f.b.caption) : s.key || f.b.caption, TOP, 680000);
          const px = wide ? Math.round((SW - fw) / 2) : M0;
          sh += rect(px - 40000, top - 40000, fw + 80000, fh + 80000, '0B1728', {round: 1, line: C.line}) + picS(rid, px, top, fw, fh);
          sh += box(px, top + fh + 50000, fw, 330000, tx(`شکل ${F.i(f.b.no)}. ${f.b.caption}`, {sz: 1050, c: C.mut, algn: 'ctr'}));
          if (!wide) sh += bullets(ev, M0 + maxW + 200000, top, W0 - maxW - 200000, BOT - top, 1500, 1150);
          add(sh, [[rid, f]], notes, f.b.src);
        });
        return;
      }
      // text-and-table section (e.g. online monitoring, decision support)
      let sh = head(title, s.lead), y = TOP;
      if (s.key) { sh += callout(s.key, y, 680000); y += 820000; }
      const tb = !brief && tables[0];
      if (tb) { const cols = tb.head.slice(0, 5).map((_, i) => i), pt = ptable(cols.map((i) => tb.head[i]), tb.rows.map((row) => cols.map((i) => row[i])), M0, y, W0, BOT - y - 700000); sh += pt.x; y += pt.h + 60000;
        sh += box(M0, y, W0, 300000, tx(`جدول ${F.i(tb.no)}. ${tb.caption}${pt.shown < tb.rows.length || cols.length < tb.head.length ? ` · ${F.i(pt.shown)} ردیف از ${F.i(tb.rows.length)}${cols.length < tb.head.length ? '، ' + F.i(cols.length) + ' ستون از ' + F.i(tb.head.length) : ''}؛ کامل در یادداشت سخنران و نسخه Word` : ''}${tables.length > 1 ? ` · ${F.i(tables.length - 1)} جدول دیگر این بخش در یادداشت سخنران و نسخه Word` : ''}`, {sz: 1000, c: C.mut})); y += 380000; }
      if (BOT - y > 500000) sh += bullets(ev.length ? ev : caveats.map((c) => ({t: c})), M0, y, W0, BOT - y, 1500, 1150);
      add(sh, [], notes, srcLine);
    });

    // 4. recommendations
    if (r.recs.length) {
      const shown = brief ? r.recs.slice(0, 3) : r.recs;
      const allRec = r.recs.map((m) => `${m.p} · ${m.t}\n${m.a}\nدروازه تصمیم: ${m.g}\nریسک اصلی: ${m.r}`).join('\n\n');
      const di = r.sections.findIndex((s) => s.id === 'decision'), dec = r.sections[di], decNotes = dec ? [dec.key, ...dec.blocks.filter((b) => b.type === 'p' || b.type === 'note').map((b) => b.text), ...dec.blocks.filter((b) => b.type === 'table').map(tableNotes)].filter(Boolean).join('\n\n') : '';
      chunks(shown, 3).forEach((page, pi) => {
        const gap = 140000, ch = (BOT - TOP - gap * 2) / 3;
        let sh = head((dec ? `${F.i(di + 1)}. ${dec.title}` : 'اقدام‌های پیشنهادی') + (pi ? ' (ادامه)' : ''), brief && r.recs.length > 3 ? `${F.i(3)} اقدام اول از ${F.i(r.recs.length)}؛ فهرست کامل در یادداشت سخنران و نسخه Word · پیش‌نویس، مصوب نیست` : 'پیش‌نویس، مصوب نیست؛ هر کدام پیش از تصمیم باید از دروازه خود بگذرد');
        page.forEach((m, j) => {
          const y = TOP + j * (ch + gap), col = m.p === 'P0' ? 'E5534B' : m.p === 'P1' ? 'E09B2D' : '3D6E9E';
          sh += rect(M0, y, W0, ch, C.card, {round: 1, line: C.line}) + rect(SW - M0 - 900000, y + 110000, 780000, 400000, col, {round: 1}) + box(SW - M0 - 900000, y + 110000, 780000, 400000, tx(m.p, {sz: 1500, b: 1, c: 'FFFFFF', algn: 'ctr'}), {anchor: 'ctr'}) +
            box(M0 + 100000, y + 70000, W0 - 1100000, 480000, T(m.t, W0 - 1100000, 480000, 1700, 1300, {b: 1}), {anchor: 'ctr'}) +
            box(M0 + 100000, y + 560000, W0 - 200000, ch - 900000, T(m.a, W0 - 200000, ch - 920000, 1450, 1150)) +
            box(M0 + 100000, y + ch - 360000, W0 - 200000, 320000, T('دروازه تصمیم: ' + m.g, W0 - 200000, 320000, 1100, 950, {c: C.mut}));
        });
        add(sh, [], [allRec, decNotes].filter(Boolean).join('\n\n'), 'رجیستر تصمیم رادار (پیش‌نویس)');
      });
    }

    // 5. every caveat, never dropped
    if (allCaveats.length) {
      const per = [];
      let cur = [], h = 0;
      allCaveats.forEach((c) => { const hh = hOf(c.l + ': ' + c.t, W0, 1250) + 230000; if (cur.length && h + hh > BOT - TOP) { per.push(cur); cur = []; h = 0; } cur.push(c); h += hh; });
      if (cur.length) per.push(cur);
      per.forEach((page, pi) => add(head('حدود تفسیر شاخص‌ها' + (pi ? ' (ادامه)' : ''), 'هر عدد این گزارش با همین قیدها خوانده شود') + box(M0, TOP, W0, BOT - TOP, page.map((c) => tx(c.l, {sz: 1150, b: 1, c: C.amb, sp: 700}) + tx(c.t, {sz: 1250, c: C.fg, ln: 115})).join('')), [], page.map((c) => c.l + ': ' + c.t).join('\n\n')));
    }

    // 6. method and sources (one slide; the full list with links is in the notes)
    const half = (W0 - 200000) / 2;
    const srcFit = []; let sh2 = 0; srcList.forEach((s) => { const hh = hOf(s, half, 1050) + 60000; if (sh2 + hh <= BOT - TOP - 500000) { srcFit.push(s); sh2 += hh; } });
    add(head('روش، محدودیت‌ها و منابع') +
      box(M0 + half + 200000, TOP, half, BOT - TOP, tx('روش و محدودیت‌ها', {sz: 1400, b: 1, c: C.acc}) + r.limits.map((l) => T(l, half, (BOT - TOP - 400000) / r.limits.length, 1250, 1000, {bullet: 1, sp: 500})).join('')) +
      box(M0, TOP, half, BOT - TOP, tx('منابع', {sz: 1400, b: 1, c: C.acc}) + srcFit.map((s) => tx(s, {sz: 1050, c: C.fg, bullet: 1, sp: 250})).join('') + (srcFit.length < srcList.length ? tx(`و ${F.i(srcList.length - srcFit.length)} منبع دیگر؛ فهرست کامل با پیوندها در یادداشت سخنران این اسلاید`, {sz: 1050, c: C.mut, sp: 300}) : '')),
    [], [r.limits.join('\n\n'), srcNotes].join('\n\n'));
    // package
    const files = [], media = [];
    slides.forEach((sl, i) => {
      files.push([`ppt/slides/slide${i + 1}.xml`, slideXml(sl.x + box(M0, SH-430000, 450000, 270000, tx(F.i(i+1), {sz:1000,c:"576B80",algn:"l"})))]);
      const noteShape = box(0,0,6858000,9144000, String(sl.notes||'').split('\n').map(t=>tx(t,{sz:1400,c:'ECF3FB'})).join('')).replace('<p:cNvSpPr txBox="1"/>','<p:cNvSpPr/>').replace('<p:nvPr/>','<p:nvPr><p:ph type="body" idx="1"/></p:nvPr>');
      files.push([`ppt/notesSlides/notesSlide${i+1}.xml`, `<?xml version="1.0" encoding="UTF-8"?><p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${noteShape}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`]);
      files.push([`ppt/notesSlides/_rels/notesSlide${i+1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSlide" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${i+1}.xml"/></Relationships>`]);
      const rr = sl.rels.map(([rid, f]) => { const nm = `img${media.length + 1}.png`; media.push([`ppt/media/${nm}`, f.data]); return `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${nm}"/>`; });
      files.push([`ppt/slides/_rels/slide${i + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdL" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rIdNotes" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${i+1}.xml"/>${rr.join('')}</Relationships>`]);
    });
    const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
    const theme = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Radar"><a:themeElements><a:clrScheme name="Radar"><a:dk1><a:srgbClr val="0B111A"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F3A5F"/></a:dk2><a:lt2><a:srgbClr val="E9EEF4"/></a:lt2><a:accent1><a:srgbClr val="FFB340"/></a:accent1><a:accent2><a:srgbClr val="78BFFF"/></a:accent2><a:accent3><a:srgbClr val="2FD39C"/></a:accent3><a:accent4><a:srgbClr val="FF5A54"/></a:accent4><a:accent5><a:srgbClr val="B48CFF"/></a:accent5><a:accent6><a:srgbClr val="93A1B3"/></a:accent6><a:hlink><a:srgbClr val="78BFFF"/></a:hlink><a:folHlink><a:srgbClr val="B48CFF"/></a:folHlink></a:clrScheme><a:fontScheme name="Radar"><a:majorFont><a:latin typeface="${PFONT}"/><a:ea typeface=""/><a:cs typeface="${PFONT}"/></a:majorFont><a:minorFont><a:latin typeface="${PFONT}"/><a:ea typeface=""/><a:cs typeface="${PFONT}"/></a:minorFont></a:fontScheme><a:fmtScheme name="Radar"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
    const master = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr rtl="${window.RADAR_PRESENTATION?.lang==='en'?0:1}"><a:defRPr sz="2800"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr rtl="${window.RADAR_PRESENTATION?.lang==='en'?0:1}"><a:defRPr sz="1600"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr rtl="${window.RADAR_PRESENTATION?.lang==='en'?0:1}"><a:defRPr sz="1600"/></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`;
    const layout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
    const rel = (items) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items.map(([id, t, tg]) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${t}" Target="${tg}"/>`).join('')}</Relationships>`;
    const pres = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${NS} saveSubsetFonts="1" rtl="${window.RADAR_PRESENTATION?.lang==='en'?0:1}"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdM"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rIdS${i + 1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${SW}" cy="${SH}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:lvl1pPr rtl="${window.RADAR_PRESENTATION?.lang==='en'?0:1}"><a:defRPr sz="1600"/></a:lvl1pPr></p:defaultTextStyle></p:presentation>`;
    const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}${slides.map((_, i) => `<Override PartName="/ppt/notesSlides/notesSlide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`).join('')}</Types>`;
    const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(r.title)}</dc:title><dc:creator>رادار فرماندهی شبکه ملی اطلاعات</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${r.iso.slice(0, 19)}Z</dcterms:created></cp:coreProperties>`;
    return zip([['[Content_Types].xml', ct],
      ['_rels/.rels', rel([['rId1', 'officeDocument', 'ppt/presentation.xml']]).replace('</Relationships>', '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>')],
      ['docProps/core.xml', core], ['ppt/presentation.xml', pres],
      ['ppt/_rels/presentation.xml.rels', rel([['rIdM', 'slideMaster', 'slideMasters/slideMaster1.xml'], ['rIdT', 'theme', 'theme/theme1.xml'], ['rIdP', 'presProps', 'presProps.xml'], ['rIdV', 'viewProps', 'viewProps.xml'], ['rIdTS', 'tableStyles', 'tableStyles.xml'], ...slides.map((_, i) => ['rIdS' + (i + 1), 'slide', `slides/slide${i + 1}.xml`])])],
      ['ppt/presProps.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentationPr ${NS}/>`],
      ['ppt/viewProps.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:viewPr ${NS}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`],
      ['ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`],
      ['ppt/slideMasters/slideMaster1.xml', master], ['ppt/slideMasters/_rels/slideMaster1.xml.rels', rel([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId2', 'theme', '../theme/theme1.xml']])],
      ['ppt/slideLayouts/slideLayout1.xml', layout], ['ppt/slideLayouts/_rels/slideLayout1.xml.rels', rel([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']])],
      ['ppt/theme/theme1.xml', theme], ...files, ...media]);
  };

  /* ---- standalone HTML ---- */
  const html = async (r) => {
    const doc = $('#rptDoc').cloneNode(true);
    const live = [...$('#rptDoc').querySelectorAll('.rp-fig svg')], cl = [...doc.querySelectorAll('.rp-fig svg')];
    live.forEach((s, i) => { const {xml} = standalone(s); const t = document.createElement('div'); t.innerHTML = xml; cl[i].replaceWith(t.firstChild); });
    doc.querySelectorAll('.tip,.srwrap').forEach((e) => e.remove());
    const css = [...document.styleSheets].flatMap((ss) => { try { return [...ss.cssRules].filter((x2) => x2.type !== CSSRule.FONT_FACE_RULE && /(\.paper|\.rp-|:root)/.test(x2.cssText)).map((x2) => x2.cssText); } catch (e) { return []; } }).join('\n');
    return new Blob([`<!doctype html><html lang="${window.RADAR_PRESENTATION?.lang==='en'?'en':'fa'}" dir="${window.RADAR_PRESENTATION?.lang==='en'?'ltr':'rtl'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${x(r.title)}</title><style>${fontCss()}\nbody{margin:0;background:#e9ecf0;font-family:Vazirmatn,Tahoma,sans-serif}\n${css}\n.paper{margin:24px auto}</style></head><body>${doc.outerHTML}</body></html>`], {type: 'text/html'});
  };

  const out = async (fmt, r, btn) => {
    const label = btn && btn.textContent; if (btn) { btn.disabled = true; btn.textContent = 'در حال ساخت…'; }
    try {
      if (fmt === 'pdf') { document.body.classList.add('rpt-print'); const done = () => { document.body.classList.remove('rpt-print'); removeEventListener('afterprint', done); }; addEventListener('afterprint', done); setTimeout(() => window.print(), 50); return; }
      const blob = fmt === 'docx' ? await docx(r) : fmt === 'pptx' ? await pptx(r) : await html(r);
      RPTX.last = blob;
      save(blob, fname(r, fmt));
      TOAST(fmt === 'docx' ? 'فایل Word ساخته شد' : fmt === 'pptx' ? 'فایل PowerPoint ساخته شد' : 'فایل HTML ساخته شد');
    } catch (e) { console.error(e); TOAST('ساخت فایل ناموفق بود: ' + e.message, 'bad'); }
    finally { if (btn) { btn.disabled = false; btn.textContent = label; } }
  };
  // full Vazirmatn 33.0.3 TTF (Persian + Latin + digits; vendor/fonts, SIL OFL), inlined by build.py as RADAR_FONT_FILES
  const fonts = () => { const F0 = window.RADAR_FONT_FILES || {}; const decode = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); const files = Object.entries(F0).map(([n, b]) => [n, n.endsWith('.ttf') ? decode(b) : b]); if (!files.length) { TOAST('فایل فونت در این نسخه نیست', 'bad'); return; } save(zip([...files, ['README-fa.txt', 'فونت وزیرمتن (نسخه ۳۳٫۰۰۳، پروانه SIL OFL). هر دو فایل TTF را نصب کنید (در ویندوز: راست‌کلیک ← Install for all users)، سپس فایل PowerPoint یا Word گزارش را دوباره باز کنید. این نسخه کامل است و حروف و ارقام لاتین را هم دارد.\n']]), 'Vazirmatn-33.003-fonts.zip'); };
  return {out, docx, pptx, html, png, zip, crc32, standalone, fonts};
})();
