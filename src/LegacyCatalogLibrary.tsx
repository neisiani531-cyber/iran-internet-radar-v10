import React,{useMemo,useState} from 'react';
import AnalyticsChart,{ChartDataTable,type ChartData,type ChartMode} from './AnalyticsChart';
import {useLegacyBundle} from './LegacyDataBridge';
import {buildLegacyCatalogPanels,type CatalogPanel} from './LegacyCatalogPanels';
import PanelExpandButton from './PanelExpandButton';
import SourcePageViewer from './SourcePageViewer';
const groupNames:Record<string,string>={overview:'نمای ملی',mobile:'شبکه سیار',fixed:'دسترسی ثابت',quality:'کیفیت',services:'خدمات و مصرف',reach:'پوشش و دسترسی',citizen:'شکایات',other:'پست و ماهواره'};
const fmt=(value:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:12}).format(value);
const pinKey='radar-v917-pinned-panels-v1';
function initialPins():string[]{try{const stored=JSON.parse(localStorage.getItem(pinKey)||'null');if(Array.isArray(stored))return stored.filter(x=>typeof x==='string');}catch{}return ['operators-sites5g','share-VOICE','quality-jitter'];}
function CatalogCard({panel,pinned,onPin}:{panel:CatalogPanel;pinned:boolean;onPin:()=>void}){
 const [mode,setMode]=useState<ChartMode>(panel.modes[0]||'bar'),[source,setSource]=useState(false);
 const first=panel.rows[0];
 const data:ChartData=mode==='donut'?{unit:String(first.unit),labels:panel.rows.map(row=>String(row.label)),series:panel.rows.map(row=>[Number(row.value)]),categories:[String(first.period)]}:panel.data.series.length>1?{unit:String(first.unit),labels:['مقدار گزارش‌شده'],series:[panel.rows.map(row=>Number(row.value))],categories:panel.rows.map(row=>String(row.label))}:panel.data;
 return <article className="tc-panel archive-chart" data-legacy-panel={panel.id}>
  <div className="md-header"><div><small>CRA57 · {groupNames[panel.group]} · کنترل تصویری نهایی باقی است</small><h3>{panel.title}</h3></div><div className="archive-card-actions"><PanelExpandButton title={panel.title}/><button type="button" aria-pressed={pinned} aria-label={(pinned?'حذف از فرماندهی ':'افزودن به فرماندهی ')+panel.title} onClick={onPin}>{pinned?'★':'☆'}</button></div></div>
  {panel.modes.length>1&&<label className="archive-chart-mode">فرم نمودار <select value={mode} onChange={event=>setMode(event.target.value as ChartMode)}>{panel.modes.map(value=><option key={value} value={value}>{({line:'خطی',bar:'میله‌ای',area:'سطحی',donut:'حلقه‌ای',heatmap:'حرارتی'} as const)[value]}</option>)}</select></label>}
  {panel.modes.length?<div className="md-size-body" style={{height:190}} onDoubleClick={event=>event.currentTarget.closest('article')?.querySelector<HTMLButtonElement>('.panel-expand')?.click()}><AnalyticsChart title={panel.title} mode={mode} data={data}/></div>:<div className="archive-scalar"><strong>{fmt(Number(first.value))}</strong><span>{String(first.unit)}</span><small>{String(first.period)}</small></div>}
  {panel.modes.length>0&&<ChartDataTable data={data} title={panel.title}/>}
  <details className="archive-provenance"><summary>مشاهدات و شناسنامه منبع ({fmt(panel.rows.length)})</summary>{panel.rows.map(row=><div key={String(row.id)} data-observation-id={String(row.id)}><b>{String(row.label)} · {fmt(Number(row.value))} {String(row.unit)}</b><small>{String(row.period)} · صفحه {fmt(Number(row.page))} · {String(row.id)}</small><p>مخرج: {String(row.denominator||'در داده موجود مشخص نشده است')}</p>{row.note&&<p>{String(row.note)}</p>}</div>)}<button type="button" onClick={()=>setSource(value=>!value)}>اصل صفحه گزارش</button>{source&&<SourcePageViewer page={Number(first.page)} onClose={()=>setSource(false)}/>}</details>
  {panel.id==='citizen-complaints'&&<p className="md-warning">تعداد شکایت، نرخ شکایت یا رتبه کیفیت اپراتور نیست؛ مخرج مشترک در این مجموعه موجود نیست.</p>}
 </article>;
}
export default function LegacyCatalogLibrary({dashboard=false}:{dashboard?:boolean}){
 const {data,error,retry}=useLegacyBundle();const [group,setGroup]=useState('all'),[query,setQuery]=useState(''),[limit,setLimit]=useState(9),[pins,setPins]=useState(initialPins);
 const panels=useMemo(()=>data?buildLegacyCatalogPanels(data.official):[],[data]);
 const shown=panels.filter(panel=>dashboard?pins.includes(panel.id):(group==='all'||panel.group===group)&&(!query||(panel.title+' '+panel.rows.map(row=>row.id+' '+row.label).join(' ')).includes(query)));
 function pin(id:string){setPins(old=>{const next=old.includes(id)?old.filter(value=>value!==id):[...old,id];try{localStorage.setItem(pinKey,JSON.stringify(next));}catch{}return next;});}
 return <section className="archive-catalog" dir="rtl"><div className="archive-section-heading"><h2>{dashboard?'پنل‌های افزوده‌شده از نسخه ۹٫۱۷':'کتابخانه تصویری تمام شاخص‌های رسمی نسخه ۹٫۱۷'}</h2><p>{dashboard?'با ستاره هر پنل، آن را به فرماندهی اضافه یا حذف کنید؛ دوره منبع مستقل است و فیلتر اشتراک سیار بر این پنل‌ها اعمال نمی‌شود.':data?`${fmt(data.official.length)} مشاهده در ${fmt(panels.length)} پنل؛ شمار اشتراک، درصد پوشش و کیفیت با هم خلط نشده‌اند.`:'دریافت کاتالوگ نسخه مرجع…'}</p></div>
 {error&&<p role="alert">{error}<button onClick={retry}>تلاش مجدد</button></p>}
 {!dashboard&&<div className="archive-filters"><label>حوزه <select value={group} onChange={event=>{setGroup(event.target.value);setLimit(9);}}><option value="all">همه حوزه‌ها</option>{Object.entries(groupNames).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>جست‌وجوی پنل یا شناسه <input value={query} onChange={event=>{setQuery(event.target.value);setLimit(9);}}/></label><span>پوشش مشاهدات: {fmt(panels.reduce((sum,panel)=>sum+panel.rows.length,0))} از ۱۳۰</span></div>}
 <div className="archive-chart-grid">{shown.slice(0,dashboard?shown.length:limit).map(panel=><CatalogCard key={panel.id} panel={panel} pinned={pins.includes(panel.id)} onPin={()=>pin(panel.id)}/>)}</div>
 {data&&shown.length===0&&<p>پنلی برای این انتخاب وجود ندارد.</p>}
 {!dashboard&&shown.length>limit&&<button type="button" className="archive-more" onClick={()=>setLimit(value=>value+9)}>نمایش پنل‌های بیشتر ({fmt(shown.length-limit)})</button>}
 </section>;
}
