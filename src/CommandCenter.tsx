import React, {useState} from 'react';
import fixed from '../packages/contracts/public-fixed-access.snapshot.json';
import mobile from '../packages/contracts/public-mobile-operators.snapshot.json';
import qos from '../packages/contracts/qos-metric-catalog.json';
import research from '../packages/contracts/p01-research-registry.json';
import surveyPreview from '../packages/contracts/p01-survey-research-preview.json';
import historicalPreview from '../packages/contracts/historical-research-preview.json';
import './command-center.css';

const nf=(v:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(v);
const metricRows=fixed.observations;
const last=metricRows[metricRows.length-1];
const first=metricRows[0];
const ratio=(a:number,b:number)=>((a/b)-1)*100;
const fixedChange=ratio(last.reported_total,first.reported_total);
const fiberChange=ratio(last.technology_values.FTTx,first.technology_values.FTTx);
const chartColors=['#48e5d0','#508fef','#f2b36f','#ae90e8'];
const technologies=[{key:'FTTx',title:'فیبر نوری',color:chartColors[0]},{key:'XDSL',title:'XDSL',color:chartColors[1]},{key:'TDLTE',title:'TD-LTE',color:chartColors[2]},{key:'WiFi',title:'WiFi',color:chartColors[3]}] as const;
type Tech=typeof technologies[number]['key'];
type Metric='active_5g_sites'|'population_4g_coverage';
const chartNumbers=(key:Tech)=>metricRows.map(r=>r.technology_values[key]);
function Trend({technology}:{technology:Tech}){
 const nums=chartNumbers(technology);const hi=Math.max(...nums)*1.08;const low=Math.min(...nums)*.9;
 const points=nums.map((n,i)=>({x:44+(i*(530/(nums.length-1))),y:176-((n-low)/(hi-low))*140}));
 const line=points.map(p=>p.x+','+p.y).join(' ');
 const stroke=technologies.find(t=>t.key===technology)!.color;
 return <div className="cc-chart" role="img" aria-label={'روند پنج‌فصلی '+technology}>
  <svg viewBox="0 0 620 222" preserveAspectRatio="xMidYMid meet">
   {[36,82,128,174].map(y=><line key={y} x1="35" x2="584" y1={y} y2={y} stroke="#294053" strokeDasharray="3 7"/>)}
   <polygon points={points[0].x+',186 '+line+' '+points[points.length-1].x+',186'} fill={stroke} fillOpacity=".08"/>
   <polyline points={line} fill="none" stroke={stroke} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round"/>
   {points.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r={i===4?6:4} fill="#071826" stroke={stroke} strokeWidth="2.5"/><text x={p.x} y={p.y-15} textAnchor="middle" fill="#d4eaf3" fontSize="12">{nf(nums[i])}</text></g>)}
   {points.map((p,i)=><text key={i} x={p.x} y="211" textAnchor="middle" fill="#8cabc0" fontSize="11">{['بهار ۰۴','تابستان','پاییز','زمستان','بهار ۰۵'][i]}</text>)}
  </svg>
 </div>;
}
function MetricTile({eyebrow,value,note,trend,icon}:{eyebrow:string,value:string,note:string,trend?:number,icon:string}){
 return <article className="cc-metric"><div className="cc-metric-top"><span className="cc-metric-symbol">{icon}</span><span className="cc-muted">{eyebrow}</span></div><strong>{value}</strong><div className="cc-metric-bottom"><span>{note}</span>{trend!==undefined&&<b className={trend>=0?'cc-up':'cc-down'}>{trend>=0?'+':''}{nf(trend)}٪</b>}</div></article>
}
export default function CommandCenter({onNavigate}:{onNavigate:(area:'fixed'|'mobile'|'qos'|'research')=>void}){
 const [tech,setTech]=useState<Tech>('FTTx');
 const [mobileMetric,setMobileMetric]=useState<Metric>('active_5g_sites');
 const [generation,setGeneration]=useState<'3G'|'4G'>('4G');
 const [qualityMetric,setQualityMetric]=useState<'access_success'|'drop_rate'>('access_success');
 const [periodIndex,setPeriodIndex]=useState(metricRows.length-1);
 const [baselineIndex,setBaselineIndex]=useState(0);
 const [comparisonOpen,setComparisonOpen]=useState(true);
 const [showSources,setShowSources]=useState(false);
 const current=metricRows[periodIndex];
 const baseline=metricRows[baselineIndex];
 const changeFromPrevious=periodIndex>0?ratio(current.reported_total,metricRows[periodIndex-1].reported_total):undefined;
 const currentFiberChange=periodIndex>0?ratio(current.technology_values.FTTx,metricRows[periodIndex-1].technology_values.FTTx):undefined;
 const metric=mobile.metrics.find(m=>m.id===mobileMetric)!;
 const max=Math.max(...metric.values.map(v=>v.value));
 const quality=qos.metrics.find(m=>m.id===qualityMetric)!;
 const mobile5g=mobile.metrics.find(m=>m.id==='active_5g_sites')!;
 const sites=mobile5g.values.reduce((sum,item)=>sum+item.value,0);
 const share=current.technology_values.FTTx/current.reported_total*100;
 const printReport=()=>window.print();
 const exportComparison=()=>{const lines=[['metric','baseline_period','comparison_period','baseline_value','comparison_value','absolute_change','percent_change'],...([...technologies.map(t=>({name:t.key,a:baseline.technology_values[t.key],b:current.technology_values[t.key]})),{name:'TOTAL_FIXED',a:baseline.reported_total,b:current.reported_total}].map(v=>[v.name,baseline.period,current.period,v.a,v.b,v.b-v.a,Number(ratio(v.b,v.a).toFixed(4))]))];const csv='\uFEFF'+lines.map(row=>row.join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='radar-period-comparison.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const exportCsv=()=>{const header='period,FTTx,XDSL,TDLTE,WiFi,total,source_id,source_page';const lines=metricRows.map(r=>[r.period,r.technology_values.FTTx,r.technology_values.XDSL,r.technology_values.TDLTE,r.technology_values.WiFi,r.reported_total,fixed.source.source_id,r.source_page].join(','));const csv='\uFEFF'+[header,...lines].join('\n');const file=new Blob([csv],{type:'text/csv;charset=utf-8'});const href=URL.createObjectURL(file);const a=document.createElement('a');a.href=href;a.download='radar-fixed-access-cra57.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(href);};
 return <div className="cc-root">
  <section className="cc-hero">
   <div className="cc-hero-copy"><div className="cc-kicker"><span className="cc-pulse"/> مرکز فرماندهی داده | IRAN INTERNET RADAR</div>
    <h1>نبض اینترنت ایران،<br/><em>در یک نگاه.</em></h1>
    <p>نمای یکپارچه پایش زیرساخت، توسعه فیبر، اپراتورهای سیار و کیفیت شبکه؛ با ردگیری منبع و تفکیک روشن داده رسمی از شواهد در انتظار پذیرش.</p>
    <div className="cc-tags"><span>مبنای داده: گزارش فصلنامه ۵۷</span><span>آخرین دوره: بهار ۱۴۰۵</span><span className="cc-tag-warn">نسخه نمایشی، نه داده زنده</span></div>
   </div>
   <div className="cc-hero-visual" aria-hidden="true"><div className="cc-orbit cc-orbit-a"/><div className="cc-orbit cc-orbit-b"/><div className="cc-orbit cc-orbit-c"/><div className="cc-radar-sweep"/><div className="cc-radar-center"><span>IR</span><small>RADAR</small></div><span className="cc-dot d1"/><span className="cc-dot d2"/><span className="cc-dot d3"/><span className="cc-dot d4"/></div>
  </section>
  <div className="cc-section-name"><span>نمای کلان ملی</span><div className="cc-toolbar"><label>دوره اینترنت ثابت <select value={periodIndex} onChange={e=>setPeriodIndex(Number(e.target.value))}>{metricRows.map((r,i)=><option key={r.period} value={i}>{r.period_label}</option>)}</select></label><button onClick={exportCsv} className="cc-text-button">دریافت CSV پنج‌فصلی ↓</button><button onClick={printReport} className="cc-text-button">چاپ گزارش مدیریتی</button></div></div>
  <section className="cc-metrics">
   <MetricTile icon="◈" eyebrow="اشتراک اینترنت ثابت" value={nf(current.reported_total)} note={periodIndex===0?"دوره مبنا":"تغییر نسبت به فصل قبل"} trend={changeFromPrevious}/>
   <MetricTile icon="◇" eyebrow="اشتراک فیبر نوری FTTx" value={nf(current.technology_values.FTTx)} note={periodIndex===0?"دوره مبنا":"تغییر نسبت به فصل قبل"} trend={currentFiberChange}/>
   <MetricTile icon="◎" eyebrow="سایت فعال 5G · بهار ۱۴۰۵" value={nf(sites)} note="مجموع سه اپراتور گزارش‌شده"/>
   <MetricTile icon="▦" eyebrow="سهم فیبر از اشتراک ثابت" value={nf(share)+'٪'} note="سهم در پایان دوره"/>
  </section>

  <section className="cc-surface cc-comparison">
  <div className="cc-panel-header"><div><span className="cc-overline">PERIOD COMPARISON</span><h2>مقایسه دو دوره گزارش</h2><p>تغییرات مطلق و نسبی بر اساس دو فصل انتخابی</p></div><button className="cc-text-button" onClick={()=>setComparisonOpen(!comparisonOpen)} aria-expanded={comparisonOpen}>{comparisonOpen?'جمع‌کردن':'نمایش مقایسه'}</button></div>
  {comparisonOpen&&<><div className="cc-toolbar"><button className="cc-text-button" onClick={exportComparison} disabled={baselineIndex===periodIndex}>دریافت مقایسه CSV ↓</button><label>دوره مبنا <select value={baselineIndex} onChange={e=>setBaselineIndex(Number(e.target.value))}>{metricRows.map((r,i)=><option value={i} key={r.period}>{r.period_label}</option>)}</select></label><label>دوره مقایسه <select value={periodIndex} onChange={e=>setPeriodIndex(Number(e.target.value))}>{metricRows.map((r,i)=><option value={i} key={r.period}>{r.period_label}</option>)}</select></label></div>{baselineIndex===periodIndex?<p>برای مشاهده تغییر، دو دوره متفاوت انتخاب کنید.</p>:<div className="cc-comparison-table"><table><thead><tr><th>شاخص</th><th>مبنا</th><th>مقایسه</th><th>تغییر مطلق</th><th>تغییر درصدی</th></tr></thead><tbody>{[...technologies.map(t=>({label:t.title,a:baseline.technology_values[t.key],b:current.technology_values[t.key]})),{label:'مجموع اینترنت ثابت',a:baseline.reported_total,b:current.reported_total}].map(row=><tr key={row.label}><td>{row.label}</td><td>{nf(row.a)}</td><td>{nf(row.b)}</td><td className={row.b-row.a>=0?'cc-up':'cc-down'}>{row.b-row.a>=0?'+':''}{nf(row.b-row.a)}</td><td className={row.b-row.a>=0?'cc-up':'cc-down'}>{row.b-row.a>=0?'+':''}{nf(ratio(row.b,row.a))}٪</td></tr>)}</tbody></table></div>}</>}
 </section>
  <section className="cc-surface cc-intelligence" aria-label="تحلیل تجربه کاربران و شواهد تاریخی">
   <div className="cc-panel-header"><div><span className="cc-overline">NATIONAL RESEARCH INTELLIGENCE · S01</span><h2>تصویر مسئله از نگاه کاربران و داده‌های تاریخی</h2><p>چهار یافته پیمایش ملت ۲۱۹۲۱، در کنار ۱۴ مشاهده تاریخی پژوهشی. سنجه‌های ناهم‌تعریف با هم تجمیع نمی‌شوند.</p></div><button className="cc-text-button" onClick={()=>onNavigate('research')}>تحلیل سازوکارهای نارضایتی ←</button></div>
   <div className="cc-intelligence-grid">{surveyPreview.observations.map(x=><article key={x.evidence_id} className="cc-intelligence-item"><span className="cc-intelligence-value">{nf(x.value)}٪</span><h3>{x.title}</h3><p>{x.description}</p><small>پیمایش ملت · {x.evidence_id} · پژوهشی / Q5 تأییدنشده</small></article>)}</div>
   <div className="cc-intelligence-bottom"><div><strong>شواهد تاریخی آماده بررسی</strong><p>{nf(historicalPreview.observations.filter(x=>x.display_status==='RESEARCH_PREVIEW_NOT_Q5').length)} مشاهده از حوزه‌های کیفیت، پوشش، دسترسی و استطاعت پرداخت؛ هر مشاهده فقط با تعریف، دوره و منبع خودش قابل تفسیر است.</p></div><div><strong>کنترل انتشار</strong><p>{nf(historicalPreview.observations.filter(x=>x.display_status==='BLOCKED_FINANCIAL_ORIGINAL_MISSING').length)} رکورد مالی فاقد سند اصلی از نمایش عددی مسدود است. هیچ شاهدی مجوز Q5 ندارد.</p></div></div>
  </section>
  <div className="cc-dashboard-grid">
   <section className="cc-surface cc-trends"><div className="cc-panel-header"><div><span className="cc-overline">TECHNOLOGY TRANSITION</span><h2>روند تحول دسترسی ثابت</h2><p>پنج فصل متوالی، با تفکیک فناوری و امکان مقایسه روند</p></div><button className="cc-text-button" onClick={()=>onNavigate('fixed')}>تحلیل کامل ←</button></div>
   <div className="cc-tech-tabs">{technologies.map(t=><button key={t.key} className={t.key===tech?'on':''} onClick={()=>setTech(t.key)}><span style={{background:t.color}}/>{t.title}</button>)}</div>
   <Trend technology={tech}/>
   <div className="cc-chart-foot"><span>مقدار نخست: <b>{nf(chartNumbers(tech)[0])}</b></span><span>مقدار آخر: <b>{nf(chartNumbers(tech)[4])}</b></span><span>تغییر سالانه: <b>{nf(ratio(chartNumbers(tech)[4],chartNumbers(tech)[0]))}٪</b></span></div>
   </section>
   <section className="cc-surface cc-operator"><div className="cc-panel-header"><div><span className="cc-overline">MOBILE NETWORK</span><h2>نبض اپراتورها</h2><p>مقایسه سه اپراتور در بهار ۱۴۰۵</p></div><button className="cc-text-button" onClick={()=>onNavigate('mobile')}>جزئیات ←</button></div>
    <div className="cc-toggle"><button className={mobileMetric==='active_5g_sites'?'on':''} onClick={()=>setMobileMetric('active_5g_sites')}>سایت 5G</button><button className={mobileMetric==='population_4g_coverage'?'on':''} onClick={()=>setMobileMetric('population_4g_coverage')}>پوشش 4G</button></div>
    <div className="cc-op-list">{metric.values.map((item,i)=><div className="cc-op" key={item.operator}><div className="cc-op-line"><span><i className={'cc-op-dot d'+i}/>{item.operator}</span><b>{nf(item.value)}{metric.unit==='percent'?'٪':''}</b></div><div className="cc-track"><span style={{width:(item.value/max*100)+'%',background:chartColors[i]}}/></div></div>)}</div>
    <div className="cc-panel-notice">مقایسه فقط درون یک شاخص معتبر است؛ تعداد سایت و درصد پوشش هم‌معنا نیستند.</div>
   </section>
   <section className="cc-surface cc-quality"><div className="cc-panel-header"><div><span className="cc-overline">NETWORK EXPERIENCE</span><h2>کیفیت ارتباطات {generation}</h2><p>مقایسه شاخص کیفیت بین نسل‌های شبکه و اپراتورها</p></div><button className="cc-text-button" onClick={()=>onNavigate('qos')}>شاخص‌های بیشتر ←</button></div>
     <div className="cc-toggle"><button className={qualityMetric==='access_success'?'on':''} onClick={()=>setQualityMetric('access_success')}>موفقیت اتصال</button><button className={qualityMetric==='drop_rate'?'on':''} onClick={()=>setQualityMetric('drop_rate')}>نرخ قطع</button></div><div className="cc-toggle"><button className={generation==='4G'?'on':''} onClick={()=>setGeneration('4G')}>4G</button><button className={generation==='3G'?'on':''} onClick={()=>setGeneration('3G')}>3G</button></div><div className="cc-quality-figures">{quality.values.filter(x=>x.generation===generation).map(x=><div key={x.operator_id}><div className="cc-quality-ring" style={{background:qualityMetric==='access_success'?'conic-gradient(#4bdcc9 '+x.value+'%,#263c4d 0)':'conic-gradient(#f0aa7c '+(x.value/Math.max(...quality.values.filter(v=>v.generation===generation).map(v=>v.value))*100)+'%,#263c4d 0)'}}><span>{nf(x.value)}٪</span></div><small>{x.operator}</small></div>)}</div>
     <p className="cc-micro">منبع: CRA57، صفحه ۱۵. در نرخ قطع، طول حلقه نسبت به بیشترین مقدار همان نسل مقیاس‌بندی می‌شود؛ عدد وسط، درصد واقعی است. RTT و Jitter هنوز تکمیل نشده‌اند.</p>
   </section>
   <section className="cc-surface cc-research"><div className="cc-panel-header"><div><span className="cc-overline">EVIDENCE INTELLIGENCE</span><h2>اتاق شواهد پژوهشی</h2><p>اعتبار، قابلیت مقایسه و تعارض منابع</p></div><button className="cc-text-button" onClick={()=>onNavigate('research')}>ورود به پژوهش ←</button></div>
    <div className="cc-evidence-number"><strong>{nf(research.records.length)}</strong><span>ردیف مقایسه شواهد P01</span></div>
    <div className="cc-evidence-status"><span>پذیرش علمی Q5</span><b>۰ از ۲۰ پرونده</b></div><div className="cc-evidence-meter"><span/></div>
    <p className="cc-research-warning">شواهد پیمایش و شنود اجتماعی با جامعه‌ها و تعاریف متفاوت، شاخص قطعی ملی تلقی نمی‌شوند.</p>
   </section>
  </div>
  <section className="cc-source"><div><span className="cc-source-icon">ⓘ</span><div><strong>شفافیت داده، بخشی از طراحی است</strong><p>شاخص‌های نمایش‌داده‌شده بر اساس Snapshotهای عمومی قرارداد داده هستند. این صفحه داده زنده، نقشه پوشش مکانی یا برآورد ملیِ پژوهش‌های تأییدنشده را ادعا نمی‌کند.</p></div></div><button className="cc-source-badge cc-source-button" onClick={()=>setShowSources(!showSources)} aria-expanded={showSources}>{showSources?"بستن شناسنامه":"مشاهده شناسنامه شاخص‌ها"}</button></section>
 {showSources&&<section className="cc-surface cc-provenance"><h2>شناسنامه منابع و محدوده اعتبار</h2><table><thead><tr><th>حوزه</th><th>دوره</th><th>منبع</th><th>وضعیت</th></tr></thead><tbody><tr><td>اینترنت ثابت و فیبر</td><td>پنج فصل ۱۴۰۴ تا بهار ۱۴۰۵</td><td>CRA57 صفحه ۲۲</td><td>تطبیق متن PDF، گیت انتشار مستقل</td></tr><tr><td>اپراتورهای سیار</td><td>بهار ۱۴۰۵</td><td>CRA57</td><td>Snapshot رسمی، محدود به یک فصل</td></tr><tr><td>کیفیت شبکه</td><td>بهار ۱۴۰۵</td><td>CRA57 صفحه ۱۵</td><td>تطبیق متن PDF، گیت انتشار مستقل</td></tr><tr><td>پژوهش کاربران</td><td>دوره‌های ناهمگن</td><td>رجیستری P01</td><td>پیش‌نمایش پژوهشی، پذیرش Q5 صفر</td></tr></tbody></table><p>تأیید یک Build نرم‌افزاری معادل پذیرش علمی داده‌ها نیست.</p></section>}
 </div>;
}
