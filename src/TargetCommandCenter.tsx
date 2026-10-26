import React,{useState} from 'react';
import fixed from '../packages/contracts/public-fixed-access.snapshot.json';
import mobile from '../packages/contracts/public-mobile-operators.snapshot.json';
import history from '../packages/contracts/cra57-mobile-broadband-history.json';
import qos from '../packages/contracts/qos-metric-catalog.json';
import latency from '../packages/contracts/cra57-latency-quality.snapshot.json';
import survey from '../packages/contracts/p01-survey-research-preview.json';
import admission from '../packages/contracts/source-admission-public.json';
import evidence from '../packages/contracts/evidence-metadata-public.json';
import './TargetCommandCenter.css';
import IranProvinceMap from './IranProvinceMap';
import ModularDashboard from './ModularDashboard';
import AnalyticsChart from './AnalyticsChart';
import OverviewSignals from './OverviewSignals';

type Destination='fixed'|'mobile'|'qos'|'research'|'evidence'|'catalog'|'live';
type Focus='national'|'operator'|'experience';
const fa=(n:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(n);
const current=fixed.observations[fixed.observations.length-1];
const operatorPeriod=history.periods[history.periods.length-1];
const statuses:Record<string,string>={pending:'در انتظار تأیید تصویری',research:'پیش‌نمایش پژوهشی',missing:'فاقد داده معتبر',official:'استخراج رسمی'};
function Tile({title,value,unit,note,status='pending'}:{title:string;value:string;unit?:string;note:string;status?:keyof typeof statuses}){
 return <article className="tc-tile"><small>{title}</small><div><strong>{value}</strong><span>{unit}</span></div><p>{note}</p><em className={'tc-status '+status}>{statuses[status]}</em></article>;
}
function LatencyChart(){
 const rows=latency.observations.filter(x=>x.metric==='rtt');
 const max=Math.ceil(Math.max(...rows.map(x=>x.value))/25)*25;
 return <div className="tc-latency-chart"><svg viewBox="0 0 360 230" role="img" aria-label="مقایسه RTT شبکه ثابت و سیار در مسیر داخلی و بین‌الملل؛ بهار ۱۴۰۵، میلی‌ثانیه">
  {[0,.25,.5,.75,1].map(v=><g key={v}><line x1={112+v*190} x2={112+v*190} y1="18" y2="196" stroke="#234052" strokeDasharray="3 5"/><text x={112+v*190} y="218" textAnchor="middle" fill="#8cabbf" fontSize="11">{fa(v*max)}</text></g>)}
  {rows.map((row,i)=>{const y=32+i*44;return <g key={row.network+row.route}><text x="104" y={y+5} textAnchor="end" fill="#c5dce8" fontSize="12">{(row.network==='fixed'?'ثابت':'سیار')+' · '+(row.route==='domestic'?'داخلی':'خارجی')}</text><rect x="112" y={y-8} width={190} height="13" rx="4" fill="#102b3e"/><rect x="112" y={y-8} width={190*row.value/max} height="13" rx="4" fill={row.network==='fixed'?'#41d9c6':'#72a7ff'}/><text x={118+190*row.value/max} y={y+4} fill="#e6faff" fontSize="11">{fa(row.value)}</text></g>})}
 </svg><span className="tc-axis-caption">RTT · ms · بهار ۱۴۰۵</span></div>;
}
export default function TargetCommandCenter({onNavigate}:{onNavigate:(d:Destination)=>void}){
 const [period,setPeriod]=useState(operatorPeriod);
 const [operator,setOperator]=useState('all');
 const [focus,setFocus]=useState<Focus>('national');
 const [mapLayer,setMapLayer]=useState<'quality'|'outage'|'coverage'>('quality');
 const [presentation,setPresentation]=useState(false);
 const [operatorView,setOperatorView]=useState<'donut'|'area'>('donut');
 const historyIdx=history.periods.indexOf(period);
 const record=history.values[historyIdx];
 const selectedOperators=history.operators.map((name,i)=>({name,index:i,count:record[i]})).filter(x=>operator==='all'||operator===x.name);
 const qos4g=qos.metrics.find(x=>x.id==='access_success')?.values.filter(x=>x.generation==='4G')||[];
 const fixedY=fixed.observations[0];
 const fiberChange=(current.technology_values.FTTx/fixedY.technology_values.FTTx-1)*100;
 const q=(metric:string,network:string,route:string)=>latency.observations.find(x=>x.metric===metric&&x.network===network&&x.route===route)?.value;
 const sectionLink=(d:Destination,label:string)=><button type="button" className="tc-link" onClick={()=>onNavigate(d)}>{label} ←</button>;
 return <div className={"tc-root"+(presentation?" tc-tv":"")} dir="rtl">
  <div className="tc-top">
   <div><div className="tc-eyebrow">IRAN INTERNET RADAR · TARGET COMMAND CENTER</div><h1>مرکز فرماندهی اینترنت ایران</h1><p>رصد، شواهد و تصمیم‌سازی | پیش‌نمایش معماری هدف با داده‌های واقعی موجود</p></div>
   <div className="tc-top-right"><div className="tc-label">آخرین دوره رسمی موجود در این نما <strong>بهار ۱۴۰۵</strong></div><span className="tc-pill">داده زنده ملی تأیید نشده</span><button type="button" className="tc-presentation-toggle" aria-pressed={presentation} onClick={()=>setPresentation(v=>!v)}>{presentation?"خروج از حالت نمایش":"حالت نمایش مدیریتی"}</button></div>
  </div>
  <div className="tc-filters">
   <label>فصل اشتراک سیار <select value={period} onChange={e=>setPeriod(e.target.value)}>{history.periods.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <label>اپراتور <select value={operator} onChange={e=>setOperator(e.target.value)}><option value="all">هر سه اپراتور</option>{history.operators.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <label>موضوع تصمیم <select value={focus} onChange={e=>setFocus(e.target.value as Focus)}><option value="national">تصویر ملی</option><option value="operator">اپراتورها</option><option value="experience">تجربه کاربران</option></select></label>
   <button type="button" onClick={()=>{setPeriod(operatorPeriod);setOperator('all');setFocus('national');setMapLayer('quality')}}>بازنشانی فیلترها</button>
  </div>
  <OverviewSignals period={period} selectedOperators={selectedOperators.map(x=>x.index)}/>
  <div className="tc-source-strip" aria-label="وضعیت منابع و پوشش داده">
   <button onClick={()=>onNavigate('evidence')}><i className="tc-dot amber"/><span>ماتریس پذیرش منابع<strong>{fa(admission.entries.length)} خانواده منبع</strong></span><small>پذیرش هر منبع مستقل است</small></button>
   <button onClick={()=>onNavigate('evidence')}><i className="tc-dot violet"/><span>دفتر شواهد پژوهشی<strong>{fa(evidence.observations.length)} شناسنامه</strong></span><small>پذیرش رسمی: {fa(evidence.officially_approved)}</small></button>
   <button onClick={()=>onNavigate('mobile')}><i className="tc-dot cyan"/><span>سری تاریخی اشتراک سیار<strong>{fa(history.periods.length)} فصل</strong></span><small>در انتظار QA تصویری</small></button>
   <div><i className="tc-dot muted"/><span>پوشش شاخص استانی<strong>داده متصل نیست</strong></span><small>مرزبندی ۳۱ استان فعال است</small></div>
  </div>
  <div className="tc-hero-grid">
   <section className="tc-panel tc-map-panel"><div className="tc-heading"><div><span className="tc-eyebrow">GEO INTELLIGENCE</span><h2>نقشه پایش استانی ایران</h2></div><span className="tc-pill">پوشش داده استانی: ناموجود</span></div>
    <div className="tc-layer">{([['quality','کیفیت'],['outage','اختلالات'],['coverage','پوشش']] as const).map(([id,label])=><button key={id} className={mapLayer===id?'selected':''} onClick={()=>{setMapLayer(id);}}>{label}</button>)}</div>
    <IranProvinceMap layer={mapLayer==='quality'?'کیفیت':mapLayer==='outage'?'اختلالات':'پوشش'}/>
    <div className="tc-panel-foot">نقشه مرزی ۳۱ استان فعال است؛ داده‌های استانی معتبر برای رنگ‌بندی شاخص‌ها هنوز لازم است.</div>
   </section>
   <section className="tc-panel tc-op-panel"><div className="tc-heading"><div><span className="tc-eyebrow">OPERATOR INTELLIGENCE</span><h2>مقایسه تاریخی اپراتورها</h2></div>{sectionLink('mobile','جزئیات')}</div>
    <div className="tc-chart-switch" role="group" aria-label="نمای مقایسه اپراتورها"><button type="button" aria-pressed={operatorView==='donut'} onClick={()=>setOperatorView('donut')}>سهم اپراتورها</button><button type="button" aria-pressed={operatorView==='area'} onClick={()=>setOperatorView('area')}>روند تاریخی</button></div>
    <div className="tc-operator-visual"><AnalyticsChart key={period+operator+operatorView} title="اشتراک سیار اپراتورها" mode={operatorView} data={{series:selectedOperators.map(x=>history.values.slice(0,historyIdx+1).map(row=>row[x.index])),labels:selectedOperators.map(x=>x.name),categories:history.periods.slice(0,historyIdx+1),unit:'اشتراک'}}/></div>
    <p className="tc-note">داده ۲۴ فصل از صفحه ۲۵ فصلنامه ۵۷؛ مقادیر در انتظار کنترل تصویری منبع‌اند. این تعداد با کل سیم‌کارت‌های فعال متفاوت است.</p>
    <div className="tc-subheading">کیفیت اتصال 4G <span>{period===qos.period?'بهار ۱۴۰۵':'دوره نامنطبق'}</span></div>
    {period===qos.period?<div className="tc-mini-list tc-connection-bars">{qos4g.filter(x=>operator==='all'||x.operator===operator).map(x=><div key={x.operator}><span>{x.operator}</span><div className="tc-connection-track" role="img" aria-label={x.operator+'، موفقیت اتصال '+fa(x.value)+' درصد؛ مقیاس صفر تا صد'}><i style={{width:x.value+'%'}}/></div><b>{fa(x.value)}٪</b></div>)}</div>:<div className="tc-empty">برای فصل انتخاب‌شده داده قابل مقایسه کیفیت اتصال موجود نیست.</div>}
   </section>
   <section className="tc-panel tc-quality-panel"><div className="tc-heading"><div><span className="tc-eyebrow">QUALITY & RESILIENCE</span><h2>کیفیت و تاب‌آوری</h2></div>{sectionLink('qos','تحلیل کامل')}</div>
    <LatencyChart/>
    <div className="tc-jitter-summary"><span>Jitter · ms</span>{['fixed','mobile'].map(network=><div key={network}><b>{network==='fixed'?'ثابت':'سیار'}</b><span>داخلی {q('jitter',network,'domestic')===undefined?'فاقد داده':fa(q('jitter',network,'domestic')!)}</span><span>بین‌الملل {q('jitter',network,'international')===undefined?'فاقد داده':fa(q('jitter',network,'international')!)}</span></div>)}</div>
    <p className="tc-note">CRA57 · صفحه ۱۴ · بهار ۱۴۰۵ · در انتظار کنترل تصویری. مقادیر تجمیعی‌اند؛ به اپراتور خاص نسبت داده نمی‌شوند.</p>
   </section>
  </div>
  <ModularDashboard selectedPeriod={period} selectedOperator={operator}/>
  <details className="tc-insight-details"><summary>تفسیر، شواهد و خلأهای داده</summary>
  <div className="tc-main-grid">
   <section className="tc-panel"><div className="tc-heading"><div><span className="tc-eyebrow">PUBLIC EXPERIENCE</span><h2>تجربه کاربران</h2></div>{sectionLink('research','پژوهش‌ها')}</div>
    <div className="tc-surveys">{survey.observations.map(x=><article key={x.evidence_id}><strong>{fa(x.value)}٪</strong><span>{x.title}</span><small>{x.evidence_id} · Q5 تأیید نشده</small></article>)}</div>
    <p className="tc-note">اعداد پیمایشی به سؤال و جامعه پاسخ‌گویان مربوط‌اند؛ امتیاز ملی یا علت قطعی نارضایتی نیستند.</p>
   </section>
   <section className="tc-panel"><div className="tc-heading"><div><span className="tc-eyebrow">INCIDENT & ROUTING</span><h2>رخدادها و مسیرهای ارتباطی</h2></div>{sectionLink('live','پایش BGP')}</div><div className="tc-empty">فید تأییدشده رخدادهای لحظه‌ای به این نما متصل نیست. هیچ رخداد فرضی نمایش داده نمی‌شود.</div></section>
   <section className="tc-panel"><div className="tc-heading"><div><span className="tc-eyebrow">DECISION SUPPORT</span><h2>اتاق تصمیم و شواهد</h2></div>{sectionLink('evidence','دفتر شواهد')}</div>
    <div className="tc-decision"><b>{focus==='experience'?'سؤال تصمیم: عوامل تجربه نامطلوب چیست؟':focus==='operator'?'سؤال تصمیم: آیا توسعه اپراتور با کیفیت همسو بوده؟':'سؤال تصمیم: وضعیت قابل دفاع اینترنت ایران چیست؟'}</b><p>برای استنتاج معتبر باید دوره، منطقه، جامعه، خدمت و روش سنجش هم‌تراز شوند. ارتباط هم‌زمان دو شاخص، به‌تنهایی اثبات علت نیست.</p></div>
    <div className="tc-actions">{sectionLink('catalog','۱۳۰ شاخص رسمی')}{sectionLink('qos','تحلیل شکاف QoS/QoE')}{sectionLink('fixed','توسعه فیبر')}</div>
   </section>
  </div>
  </details>
  <details className="tc-insight-details tc-numeric-details"><summary>مقادیر دقیق و شاخص‌های مرجع</summary>
  <div className="tc-tiles">
   <Tile title="کل اشتراک اینترنت ثابت" value={fa(current.reported_total)} unit="اشتراک" note="CRA57، صفحه ۲۲"/>
   <Tile title="اشتراک FTTx" value={fa(current.technology_values.FTTx)} unit="اشتراک" note={'تغییر نسبت به بهار ۱۴۰۴: '+fa(fiberChange)+'٪'}/>
   <Tile title="اشتراک پهن‌باند سیار" value={fa(selectedOperators.reduce((a,x)=>a+x.count,0))} unit="اشتراک" note={period+' · مجموع اپراتورهای انتخابی · صفحه ۲۵'}/>
   <Tile title="RTT داخلی شبکه ثابت" value={q('rtt','fixed','domestic')===undefined?'—':fa(q('rtt','fixed','domestic')!)} unit="ms" note="تجمیعی، نه اپراتوری · صفحه ۱۴"/>
   <Tile title="RTT بین‌الملل شبکه سیار" value={q('rtt','mobile','international')===undefined?'—':fa(q('rtt','mobile','international')!)} unit="ms" note="تجمیعی، نه اپراتوری · صفحه ۱۴"/>
   <Tile title="شاخص ملی اختلال لحظه‌ای" value="—" note="داده ملی معتبر و لحظه‌ای متصل نیست" status="missing"/>
  </div>
  </details>
  <footer className="tc-footer">مرکز فرماندهی هدف · نسخه توسعه · ارقام موجود برگرفته از قراردادهای داده و مشروط به گیت‌های اعتبار منبع · داده ساختگی وارد نشده است.</footer>
 </div>;
}
