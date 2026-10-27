import React, {useEffect, useMemo, useState} from 'react';
import qos from '../packages/contracts/qos-metric-catalog.json';
import latency from '../packages/contracts/cra57-latency-quality.snapshot.json';
import surveys from '../packages/contracts/p01-survey-research-preview.json';
import bridge from '../packages/contracts/s01-s02-decision-bridge.json';

type TicRow={id:string;year:number;quarter:number;rtt:number;plr:number;jitter:number};
type TicData={admission:string;tic:{quarterly:TicRow[];validation?:string}};
type Tab='overview'|'network'|'experience'|'gap'|'actions';
const fmt=(value:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(value);
const networkName:Record<string,string>={fixed:'ثابت',mobile:'سیار',domestic:'داخلی',international:'بین‌المللی'};
const metricName:Record<string,string>={rtt:'RTT',jitter:'Jitter'};
const tabs:{id:Tab;label:string}[]=[
 {id:'overview',label:'تصویر کلی'},
 {id:'network',label:'کیفیت فنی شبکه'},
 {id:'experience',label:'تجربه کاربران'},
 {id:'gap',label:'تحلیل شکاف'},
 {id:'actions',label:'شواهد و اقدامات'}
];
const panel:React.CSSProperties={border:'1px solid #35576b',borderRadius:16,padding:18,background:'#0d2536',marginBottom:16};
const muted:React.CSSProperties={color:'#a9c7d3',fontSize:13,lineHeight:1.9};
const tableWrap:React.CSSProperties={overflowX:'auto',marginTop:12};
const tableStyle:React.CSSProperties={width:'100%',borderCollapse:'collapse',fontSize:14};
const thStyle:React.CSSProperties={padding:'10px',textAlign:'right',borderBottom:'1px solid #416176',whiteSpace:'nowrap'};
const tdStyle:React.CSSProperties={padding:'10px',borderBottom:'1px solid #294759'};
const gateLabels:Record<string,string>={
 NOT_SAME_PERIOD:'دوره‌ها یکسان نیستند',
 NO_MATCHED_TECHNICAL_SERIES:'سری فنی متناظر موجود نیست',
 NO_MATCHED_USER_SURVEY:'پیمایش متناظر موجود نیست',
 DIFFERENT_CONSTRUCT_AND_PERIOD:'مفهوم و دوره متفاوت است',
 EVIDENCE_GAP:'شکاف شواهد'
};
const cardGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))',gap:12,margin:'16px 0'};
function Card({title,value,foot}:{title:string;value:string;foot:string}){
 return <article style={{background:'#123247',border:'1px solid #36596d',padding:15,borderRadius:13}}>
  <div style={muted}>{title}</div><strong style={{display:'block',fontSize:26,margin:'8px 0'}}>{value}</strong><small style={muted}>{foot}</small>
 </article>;
}
export default function QoSQoECenter(){
 const [tab,setTab]=useState<Tab>('overview');
 const [tic,setTic]=useState<TicData|null>(null);
 const [ticError,setTicError]=useState('');
 const [generation,setGeneration]=useState<'3G'|'4G'>('4G');
 const [qosMetric,setQosMetric]=useState<'access_success'|'drop_rate'>('access_success');
 const [mechanism,setMechanism]=useState(bridge.records[0].mechanism_id);
 useEffect(()=>{
  const controller=new AbortController();
  fetch(new URL('data/v917-research-exploratory.json',document.baseURI),{signal:controller.signal})
   .then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
   .then((data:TicData)=>{
    if(!Array.isArray(data.tic?.quarterly)||data.tic.quarterly.length===0||
      data.tic.quarterly.some(x=>!Number.isFinite(x.rtt)||!Number.isFinite(x.plr)||!Number.isFinite(x.jitter)))
      throw new Error('ساختار داده TIC معتبر نیست');
    setTic(data);
   }).catch(e=>{if(e.name!=='AbortError')setTicError(String(e));});
  return ()=>controller.abort();
 },[]);
 const qMetric=qos.metrics.find(m=>m.id===qosMetric);
 const selectedValues=useMemo(()=>qMetric?.values.filter(x=>x.generation===generation)||[],[qMetric,generation]);
 const selectedMechanism=bridge.records.find(m=>m.mechanism_id===mechanism)||bridge.records[0];
 const buttonStyle=(active:boolean):React.CSSProperties=>({padding:'10px 13px',borderRadius:10,cursor:'pointer',border:'1px solid #446b7f',background:active?'#24677e':'#102b3d',color:'#eafaff'});
 const surveyRows=surveys.observations;
 return <div dir="rtl" style={{color:'#e7f5fa',maxWidth:1380,margin:'0 auto',padding:'18px 14px 40px'}}>
  <header style={{marginBottom:24}}>
   <div style={{color:'#63d4cc',fontSize:12,letterSpacing:1}}>IRAN INTERNET RADAR · QUALITY INTELLIGENCE</div>
   <h1 style={{fontSize:'clamp(25px,3vw,37px)',lineHeight:1.4,margin:'8px 0'}}>مرکز تحلیل کیفیت شبکه و تجربه کاربران</h1>
   <p style={muted}>QoS / QoE · تفکیک شبکه دسترسی اپراتورها، شبکه انتقال و زیرساخت، تجربه کاربران و شواهد پژوهشی</p>
   <p style={{...muted,border:'1px solid #937844',padding:12,borderRadius:10,background:'#382f24'}}>
    مقایسه متقاطع فنی و پیمایشی هنوز مجاز نیست: دوره، نمونه، خدمت، روش و نقطه اندازه‌گیری هم‌تراز نشده‌اند. این صفحه شاخص ملی ترکیبی، رتبه قطعی یا رابطه علّی تولید نمی‌کند.
   </p>
  </header>
  <nav aria-label="بخش‌های مرکز کیفیت و تجربه" style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
   {tabs.map(x=><button type="button" key={x.id} style={buttonStyle(tab===x.id)} aria-pressed={tab===x.id} onClick={()=>setTab(x.id)}>{x.label}</button>)}
  </nav>
  {tab==='overview'&&<>
   <div style={cardGrid}>
    <Card title="مشاهدات RTT و Jitter رگولاتوری" value="۸" foot="صفحه ۱۴ · یک فصل · شبکه ثابت و سیار"/>
    <Card title="مشاهدات اتصال و قطعی" value="۱۲" foot="صفحه ۱۵ · سه اپراتور · 3G/4G"/>
    <Card title="دوره‌های پژوهشی TIC" value={tic?fmt(tic.tic.quarterly.length):'…'} foot="RTT، PLR، Jitter · تطبیق منبع لازم"/>
    <Card title="یافته‌های پیمایشی منتخب" value={fmt(surveyRows.length)} foot="پژوهشی · بدون پذیرش نهایی Q5"/>
   </div>
   <section style={panel}><h2>پرسش مرکزی</h2><p>آیا می‌توان هم‌زمان با مقادیر ظاهراً مطلوب بعضی سنجه‌های فنی، تجربه نامطلوب کاربران را مشاهده کرد؟ بله، از نظر مفهومی ممکن است؛ اما اثبات آن در داده‌های ایران نیازمند مشاهدات هم‌دوره، هم‌خدمت و هم‌جامعه است.</p>
    <p style={muted}>از میانگین کشوری QoS نمی‌توان تجربه ساعت اوج یا محله خاص را نتیجه گرفت. همچنین نارضایتی از قیمت یا دسترسی به یک خدمت، معادل کندی یا خرابی فنی شبکه نیست.</p></section>
   <section style={panel}><h2>وضعیت مقایسه</h2><p>مقایسه درون هر منبع: مشروط به تعریف و روش | مقایسه QoS ↔ QoE: <strong>در انتظار هم‌ترازی</strong> | انتساب علت به TIC یا اپراتور: <strong>اثبات‌نشده</strong></p></section>
  </>}
  {tab==='network'&&<>
   <section style={panel}><h2>رگولاتوری: تأخیر و نوسان تأخیر</h2><p style={muted}>صفحه ۱۴ فصلنامه ۵۷، بهار ۱۴۰۵ · هشت مشاهده کل شبکه، نه مقادیر اختصاصی اپراتورها</p>
    <div style={tableWrap}><table style={tableStyle}><thead><tr>{['شاخص','شبکه','مسیر','مقدار'].map(x=><th key={x} style={thStyle}>{x}</th>)}</tr></thead><tbody>{latency.observations.map(x=><tr key={x.metric+x.network+x.route}><td style={tdStyle}>{metricName[x.metric]||x.metric}</td><td style={tdStyle}>{networkName[x.network]||x.network}</td><td style={tdStyle}>{networkName[x.route]||x.route}</td><td style={tdStyle}>{fmt(x.value)} میلی‌ثانیه</td></tr>)}</tbody></table></div>
    <p style={muted}>تطبیق لایه متن انجام شده؛ تطبیق بصری نهایی و روش نمونه‌برداری هنوز نیازمند بررسی است.</p></section>
   <section style={panel}><h2>اپراتورها: موفقیت و قطعی اتصال داده</h2><p style={muted}>صفحه ۱۵ فصلنامه ۵۷ · مقادیر مقطعی · شاخص موفقیت اتصال، معادل کیفیت تمام تجربه‌ها نیست.</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><label>فناوری <select value={generation} onChange={e=>setGeneration(e.target.value as '3G'|'4G')}><option>3G</option><option>4G</option></select></label><label>شاخص <select value={qosMetric} onChange={e=>setQosMetric(e.target.value as 'access_success'|'drop_rate')}><option value="access_success">موفقیت اتصال</option><option value="drop_rate">نرخ قطعی</option></select></label></div>
    <div style={tableWrap}><table style={tableStyle}><thead><tr><th style={thStyle}>اپراتور</th><th style={thStyle}>مقدار</th></tr></thead><tbody>{selectedValues.map(x=><tr key={x.operator_id}><td style={tdStyle}>{x.operator}</td><td style={tdStyle}>{fmt(x.value)}٪</td></tr>)}</tbody></table></div>
   </section>
   <section style={panel}><h2>شرکت ارتباطات زیرساخت (TIC)</h2><p style={muted}>سری پژوهشی ۹ دوره‌ای بازمانده از V9.17؛ پیش از تطبیق منبع و روش، با RTT رگولاتوری ادغام نشود.</p>
    {ticError&&<p role="alert">دریافت داده TIC ناموفق: {ticError}</p>}
    {!tic&&!ticError&&<p>در حال دریافت داده TIC…</p>}
    {tic&&<div style={tableWrap}><table style={tableStyle}><thead><tr>{['دوره','RTT','PLR','Jitter'].map(x=><th key={x} style={thStyle}>{x}</th>)}</tr></thead><tbody>{tic.tic.quarterly.map(x=><tr key={x.id}><td style={tdStyle}>{x.year} / {x.quarter}</td><td style={tdStyle}>{fmt(x.rtt)}</td><td style={tdStyle}>{fmt(x.plr)}</td><td style={tdStyle}>{fmt(x.jitter)}</td></tr>)}</tbody></table></div>}
    <p style={muted}>واحد و شیوه جمع‌بندی مقادیر TIC هنوز با سند مرجع کنترل نشده است؛ از انتساب شبکه‌ای یا قضاوت عملکردی خودداری شود.</p>
   </section>
  </>}
  {tab==='experience'&&<>
   <section style={panel}><h2>تجربه و برداشت کاربران</h2><p style={muted}>چهار یافته منتخب از پیمایش ملت ۲۱۹۲۱؛ هیچ‌کدام KPI ملی مورد تأیید Q5 نیستند. مقدار هر ردیف فقط متعلق به سؤال همان ردیف است.</p>
    <div style={cardGrid}>{surveyRows.map(x=><article key={x.evidence_id} style={{padding:15,border:'1px solid #385c71',borderRadius:12,background:'#112e40'}}><strong style={{fontSize:24}}>{fmt(x.value)}٪</strong><h3 style={{fontSize:15}}>{x.title}</h3><p style={muted}>{x.description}</p><small style={muted}>{x.evidence_id} · {x.quality_gate}</small></article>)}</div>
   </section>
   <section style={panel}><h2>سه مفهوم مستقل</h2><p>کیفیت فنی (QoS)، عملکرد قابل‌مشاهده خدمت از دید کاربر (QoE) و رضایت یا برداشت از اینترنت، سه مفهوم مرتبط ولی غیرهمسان‌اند.</p><p style={muted}>این پیمایش‌ها جای اندازه‌گیری هم‌زمان سرعت، RTT، دسترسی به خدمت و پایداری را نمی‌گیرند.</p></section>
  </>}
  {tab==='gap'&&<>
   <section style={panel}><h2>ماتریس مفهومی QoS / QoE</h2><p style={muted}>این خانه‌ها نتیجه اندازه‌گیری ایران نیستند. برای قرار دادن داده واقعی در هر خانه باید معیار مطلوب‌بودن QoS و QoE و انطباق مشاهده‌ها احراز شود.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
     {[
      ['QoS مطلوب / QoE مطلوب','هم‌راستایی کیفیت فنی و تجربه'],
      ['QoS مطلوب / QoE نامطلوب','شکاف فرضی؛ آزمون دسترسی، خدمت، ساعات اوج و عوامل غیرفنی'],
      ['QoS نامطلوب / QoE نامطلوب','هم‌زمانی مسئله؛ انتساب علت هنوز نیازمند شواهد'],
      ['QoS نامطلوب / QoE مطلوب','تفاوت حساسیت کاربردها و سنجه‌های فنی']
     ].map(([title,description])=><article key={title} style={{background:'#122e40',padding:16,border:'1px solid #355669',borderRadius:12}}><strong>{title}</strong><p style={muted}>{description}</p></article>)}
    </div>
   </section>
   <section style={panel}><h2>دروازه اعتبار مقایسه متقاطع</h2><p><strong>وضعیت فعلی: مسدود تا تکمیل هم‌ترازی</strong></p><p style={muted}>پیش‌شرط‌ها: دوره مشترک، تعریف شاخص، جامعه و مخرج، محدوده جغرافیایی، خدمت یا کاربرد، شبکه و نقطه اندازه‌گیری، روش و وضعیت اعتبارسنجی.</p><p>به‌جای ضریب همبستگی یا امتیاز ساختگی، شواهد کنار هم قرار می‌گیرند و تفاوت‌ها شفاف گزارش می‌شوند.</p></section>
  </>}
  {tab==='actions'&&<>
   <section style={panel}><h2>شش سازوکار S01 و مسیر S02</h2><p style={muted}>گزینه‌ها پیش‌نویس‌اند، اقدامات تصویب‌شده نیستند. منشأ: پرونده پژوهشی S01 و پل تصمیم‌سازی S02 در مخزن پروژه.</p>
    <label>سازوکار <select value={mechanism} onChange={e=>setMechanism(e.target.value)}>{bridge.records.map(x=><option value={x.mechanism_id} key={x.mechanism_id}>{x.mechanism_id} · {x.title}</option>)}</select></label>
    <div style={{marginTop:16}}><h3>{selectedMechanism.title}</h3><p><strong>مانع مقایسه:</strong> {gateLabels[selectedMechanism.comparability_gate]||selectedMechanism.comparability_gate}</p><p style={muted}>{selectedMechanism.limitation}</p><p><strong>اقدام پیشنهادی، نه مصوب:</strong> {selectedMechanism.proposed_action}</p><p style={muted}>شاهد تجربه کاربر: {selectedMechanism.user_evidence_id||'موجود نیست'} | تعداد ارجاع فنی: {selectedMechanism.technical_evidence_ids.length}</p><p style={muted}>وضعیت: {selectedMechanism.action_status}. ارتباط علّی و مسئولیت نهادی احراز نشده است.</p></div>
   </section>
  </>}
  <footer style={{...muted,marginTop:25,borderTop:'1px solid #294b61',paddingTop:14}}>رادار اینترنت ایران · پیش‌نمایش تحلیلی مبتنی بر منابع · داده پژوهشی بدون پذیرش Q5 و بدون مجوز انتساب علّی</footer>
 </div>;
}
