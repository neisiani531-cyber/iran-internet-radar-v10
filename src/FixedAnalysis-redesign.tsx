import React, { useEffect, useState } from 'react';
import fixedSnapshot from '../packages/contracts/public-fixed-access.snapshot.json';

type Point = { period: string; households: number; source_id: string; page: number };
type Data = { admission: string; fiber_coverage_history: Point[]; coverage_to_subscription_ratio: { value_percent: number; status: string }; flags: string[] };
const fmt = (n: number, digits = 0) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits }).format(n);
const short = (n: number) => `${fmt(n / 1_000_000, 2)} میلیون`;
const periodName = (p: string) => p.replace(/\-/g,' / ');
const colors = { cyan: '#46d6cb', blue: '#68a8f7', muted: '#9fb8c8' };

export default function FixedAnalysis() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(9);
  const [tab, setTab] = useState<'coverage' | 'insights'>('coverage');
  useEffect(() => {
    const controller = new AbortController();
    fetch(new URL('data/cra57-fixed-analysis.json', document.baseURI).toString(), { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((d: Data) => {
        if (!Array.isArray(d.fiber_coverage_history) || d.fiber_coverage_history.length !== 10 ||
            d.fiber_coverage_history.some(p => !Number.isFinite(p.households) || !p.period || !p.source_id || !Number.isInteger(p.page)) ||
            !Number.isFinite(d.coverage_to_subscription_ratio?.value_percent)) throw new Error('Invalid coverage dataset');
        setData(d);
      }).catch(e => { if (e.name !== 'AbortError') setError(String(e)); });
    return () => controller.abort();
  }, []);
  if (error) return <section className="panel" role="alert">بارگذاری تحلیل فیبر ناموفق بود: {error}</section>;
  if (!data) return <section className="panel">در حال آماده‌سازی نمای تحلیلی فیبر...</section>;

  const points = data.fiber_coverage_history;
  const first = points[0], last = points[points.length - 1];
  const current = points[selected];
  const preceding = selected > 0 ? points[selected - 1] : null;
  const change = preceding ? current.households - preceding.households : null;
  const annualGrowth = (last.households / first.households - 1) * 100;
  const techRows = fixedSnapshot.observations;
  const techFirst = techRows[0], techLast = techRows[techRows.length - 1];
  const fttxStart = techFirst.technology_values.FTTx, fttxNow = techLast.technology_values.FTTx;
  const fttxGrowth = (fttxNow / fttxStart - 1) * 100;
  const totalGrowth = (techLast.reported_total / techFirst.reported_total - 1) * 100;
  const min = Math.min(...points.map(p => p.households)) * .93;
  const max = Math.max(...points.map(p => p.households)) * 1.04;
  const x = (i: number) => 42 + i * 664 / (points.length - 1);
  const y = (v: number) => 205 - ((v - min) / (max - min)) * 172;
  const line = points.map((p, i) => `${x(i)},${y(p.households)}`).join(' ');
  const duplicates = points.slice(1).filter((p, i) => p.households === points[i].households).length;
  const tiles = [
    { label: 'خانوار تحت پوشش فیبر', value: short(last.households), sub: 'آخرین دوره · ' + periodName(last.period) },
    { label: 'اشتراک FTTx گزارش‌شده', value: short(fttxNow), sub: 'بهار ۱۴۰۵ · صفحه ۲۲' },
    { label: 'رشد پوشش از دوره آغازین', value: fmt(annualGrowth, 1) + '٪', sub: `افزایش ${fmt(last.households - first.households)} خانوار` },
    { label: 'رشد سالانه اشتراک FTTx', value: fmt(fttxGrowth, 1) + '٪', sub: 'بهار ۱۴۰۴ تا بهار ۱۴۰۵' },
  ];
  return <section className="panel" dir="rtl" style={{ marginBottom: 20 }}>
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div><h2 style={{marginBottom:5}}>تصویر ملی اینترنت ثابت و فیبر نوری</h2>
        <p style={{marginTop:4}}>پوشش، اشتراک و تغییرات دوره‌ای با تفکیک تعریف شاخص‌ها · فصلنامه ۵۷</p></div>
      <span style={{border:'1px solid #866c39',color:'#f2d48e',borderRadius:20,padding:'6px 12px',fontSize:12}}>در انتظار تطبیق تصویری منبع</span>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,margin:'20px 0'}}>
      {tiles.map(tile=><article key={tile.label} style={{border:'1px solid #2b5165',background:'#0d2738',borderRadius:13,padding:16,minWidth:0}}>
        <span style={{fontSize:13,color:'#bad0de',display:'block'}}>{tile.label}</span>
        <strong style={{display:'block',fontSize:23,margin:'10px 0 5px',fontVariantNumeric:'tabular-nums'}}>{tile.value}</strong>
        <small style={{color:'#b0c7d3'}}>{tile.sub}</small>
      </article>)}
    </div>
    <div role="tablist" aria-label="نماهای تحلیلی فیبر" style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
      <button type="button" role="tab" aria-selected={tab==='coverage'} onClick={()=>setTab('coverage')}>روند پوشش ۱۰ دوره‌ای</button>
      <button type="button" role="tab" aria-selected={tab==='insights'} onClick={()=>setTab('insights')}>یافته‌ها و محدودیت‌ها</button>
    </div>
    {tab==='coverage' ? <>
      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:12}}>
        <div><h3 style={{margin:'0 0 5px'}}>تغییر پوشش خانوارهای فیبر نوری</h3><small>یک نقطه را انتخاب کنید تا مقدار دقیق و تغییر فصلی را ببینید.</small></div>
        <div style={{textAlign:'left'}}><strong style={{fontSize:19}}>{fmt(current.households)} خانوار</strong><small style={{display:'block'}}>دوره {periodName(current.period)} · تغییر فصلی: {change===null?'دوره مبنا':(change>0?'+':'')+fmt(change)}</small></div>
      </div>
      <div style={{overflowX:'auto',background:'#091c2c',border:'1px solid #24465c',borderRadius:12,padding:'12px 8px'}}>
        <svg viewBox="0 0 750 265" role="img" aria-label="نمودار تاریخی پوشش خانوارهای فیبر نوری در ده دوره" style={{width:'100%',minWidth:560}}>
          {[0,1,2,3,4].map(i=><g key={i}><line x1="42" x2="707" y1={33+i*43} y2={33+i*43} stroke="#345267" strokeDasharray="4 5"/><text x="35" y={37+i*43} textAnchor="end" fontSize="10" fill="#a6bdc9">{fmt((max-(max-min)*(i/4))/1e6,1)}م</text></g>)}
          <polyline fill="none" stroke={colors.cyan} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" points={line}/>
          <line x1={x(selected)} x2={x(selected)} y1="25" y2="213" stroke="#d8faff" strokeDasharray="4 4" opacity=".65"/>
          {points.map((p,i)=><g key={p.source_id}>
            <circle cx={x(i)} cy={y(p.households)} r={selected===i?7:5} fill={selected===i?'#ffffff':colors.cyan} stroke="#103344" strokeWidth="2"/>
            <circle cx={x(i)} cy={y(p.households)} r="14" fill="transparent"/>
          </g>)}
          <text x="42" y="240" fill="#b2cfdb" fontSize="12">{periodName(first.period)}</text>
          <text x="708" y="240" textAnchor="end" fill="#b2cfdb" fontSize="12">{periodName(last.period)}</text>
        </svg>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10,justifyContent:'center'}}>
          {points.map((p,i)=><button key={p.source_id} type="button" onClick={()=>setSelected(i)} aria-pressed={selected===i}
            style={{background:selected===i?'#217b8a':'#112e40',color:'#fff',border:'1px solid #467087',borderRadius:7,padding:'6px 8px',fontSize:11}}>{periodName(p.period)}</button>)}
        </div>
      </div>
      <p style={{fontSize:13,marginTop:12}}>منبع مشاهده انتخابی: فصلنامه ۵۷، صفحه {fmt(current.page)} · شناسه: <code>{current.source_id}</code></p>
    </> : <div style={{display:'grid',gap:12}}>
      <article style={{padding:16,background:'#102d3e',borderRadius:12}}><h3>گسترش پوشش در برابر اشتراک فعال</h3><p>در آخرین دوره، {fmt(last.households)} خانوار تحت پوشش گزارش شده‌اند و {fmt(fttxNow)} اشتراک FTTx ثبت شده است. نسبت عددی این دو مقدار {fmt(data.coverage_to_subscription_ratio.value_percent,2)}٪ است؛ این عدد «نرخ نفوذ» یا «نرخ بهره‌برداری قطعی» نیست، زیرا تعاریف و مخرج‌ها باید بررسی شوند.</p></article>
      <article style={{padding:16,background:'#102d3e',borderRadius:12}}><h3>تغییر ترکیب اشتراک ثابت</h3><p>اشتراک FTTx در پنج فصل از {fmt(fttxStart)} به {fmt(fttxNow)} رسیده ({fmt(fttxGrowth,1)}٪ رشد). در همین بازه مجموع اشتراک چهار فناوری {fmt(Math.abs(totalGrowth),1)}٪ {totalGrowth<0?'کاهش':'افزایش'} یافته است. این هم‌زمانی به‌تنهایی علت تغییرات را اثبات نمی‌کند.</p></article>
      <article style={{padding:16,background:'#382d20',borderRadius:12}}><h3>هشدار کیفیت داده</h3><p>{fmt(duplicates)} تغییر فصلی بدون افزایش در سری پوشش ثبت شده است. تکرار مقادیر سال ۱۴۰۳ نیازمند بررسی منبع است و نباید به توقف واقعی عملیات توسعه تعبیر شود.</p></article>
    </div>}
    <p style={{fontSize:12,color:'#b5c7d0',marginTop:18}}>مرجع: فصلنامه آماری ۵۷ رگولاتوری، صفحات ۴ و ۲۲. وضعیت: {data.admission}. این نما داده استخراج‌شده است؛ کنترل نهایی تصویری و یکسانی تعاریف هنوز تکمیل نشده است.</p>
  </section>;
}
