import React,{useEffect,useMemo,useRef,useState} from 'react';
import history from '../packages/contracts/cra57-mobile-broadband-history.json';
import fixed from '../packages/contracts/public-fixed-access.snapshot.json';
import survey from '../packages/contracts/p01-survey-research-preview.json';
import './ModularDashboard.css';
type Mode='line'|'bar'|'area'|'donut';
type WidgetId='mobile'|'fixed'|'survey';
type Widget={id:WidgetId;title:string;source:string;available:Mode[]};
const defs:Widget[]=[
 {id:'mobile',title:'روند اشتراک پهن‌باند سیار',source:'CRA57 · صفحه ۲۵ · در انتظار QA تصویری',available:['line','bar','area','donut']},
 {id:'fixed',title:'روند فناوری‌های اینترنت ثابت',source:'CRA57 · صفحه ۲۲ · در انتظار QA تصویری',available:['line','bar','area','donut']},
 {id:'survey',title:'یافته‌های منتخب تجربه کاربران',source:'پیمایش ملت · پژوهشی و فاقد پذیرش Q5',available:['bar']}
];
const fa=(v:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(v);
const colors=['#44dfd0','#64a4fb','#f7ae59','#d78ef8'];
function plot(series:number[][],mode:Mode,labels:string[]){
 const w=440,h=180,l=24,t=15,b=28,r=14;
 const max=Math.max(1,...series.flat());const steps=Math.max(1,...series.map(a=>a.length-1));
 const xy=(n:number,i:number)=>[l+i*(w-l-r)/steps,t+(1-n/max)*(h-t-b)];
 const polyline=(a:number[])=>a.map((n,i)=>xy(n,i).join(',')).join(' ');
 if(mode==='donut'){
  const values=series.map(a=>a[a.length-1]||0),total=values.reduce((a,b)=>a+b,0)||1;
  let offset=0;return <div className="md-donut"><svg viewBox="0 0 180 180" aria-label="نسبت آخرین دوره"><circle cx="90" cy="90" r="59" fill="none" stroke="#284155" strokeWidth="26"/>{values.map((v,i)=>{const pct=v/total;const el=<circle key={i} cx="90" cy="90" r="59" fill="none" stroke={colors[i%colors.length]} strokeWidth="26" strokeDasharray={pct*370.708+' '+370.708} strokeDashoffset={-offset*370.708} transform="rotate(-90 90 90)"/>;offset+=pct;return el})}<text x="90" y="94" textAnchor="middle" fill="#dffafa" fontSize="15">{fa(total)}</text></svg><div>{labels.map((label,i)=><div key={label}><i style={{background:colors[i%colors.length]}}/>{label}: {fa(values[i]/total*100)}٪</div>)}</div></div>;
 }
 return <svg className="md-chart-svg" role="img" aria-label={'نمودار '+mode} viewBox={'0 0 '+w+' '+h} preserveAspectRatio="none">
  {[0,.25,.5,.75,1].map(v=><line key={v} x1={l} x2={w-r} y1={t+(1-v)*(h-t-b)} y2={t+(1-v)*(h-t-b)} stroke="#294459" strokeDasharray="3 5"/>)}
  {series.map((a,j)=>mode==='bar'?a.map((v,i)=>{const [x,y]=xy(v,i);return <rect key={j+'-'+i} x={x-((w-l-r)/(steps+1))*0.29+j*5} y={y} width={Math.max(2,((w-l-r)/(steps+1))*.5/series.length)} height={h-b-y} fill={colors[j%colors.length]} opacity=".85"/>}):<g key={j}>{mode==='area'&&<polygon points={polyline(a)+' '+xy(0,a.length-1).join(',')+' '+xy(0,0).join(',')} fill={colors[j%colors.length]} opacity=".14"/>}<polyline points={polyline(a)} fill="none" stroke={colors[j%colors.length]} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"/></g>)}
  <text x={l} y={h-6} fill="#9ebdce" fontSize="11">{'ابتدا'}</text><text x={w-r} y={h-6} textAnchor="end" fill="#9ebdce" fontSize="11">{'آخرین دوره'}</text>
 </svg>;
}
export default function ModularDashboard(){
 const [order,setOrder]=useState<WidgetId[]>(['mobile','fixed','survey']);
 const [modes,setModes]=useState<Record<WidgetId,Mode>>({mobile:'area',fixed:'line',survey:'bar'});
 const [hidden,setHidden]=useState<WidgetId[]>([]);
 const [wide,setWide]=useState<WidgetId[]>(['mobile']);
 const [edit,setEdit]=useState(false);
 const [heights,setHeights]=useState<Record<WidgetId,number>>({mobile:240,fixed:210,survey:210});
 const dragId=useRef<WidgetId|null>(null);
 const [dragOver,setDragOver]=useState<WidgetId|null>(null);
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{try{const s=localStorage.getItem('radar-widget-layout-v1');if(!s)return;const v=JSON.parse(s);if(Array.isArray(v.order)&&v.order.length===3&&new Set(v.order).size===3&&v.order.every((x:unknown)=>defs.some(d=>d.id===x)))setOrder(v.order);if(v.modes&&typeof v.modes==='object')setModes(old=>({...old,...v.modes}));if(Array.isArray(v.hidden))setHidden(v.hidden.filter((x:WidgetId)=>defs.some(d=>d.id===x)));if(Array.isArray(v.wide))setWide(v.wide.filter((x:WidgetId)=>defs.some(d=>d.id===x)));if(v.heights&&typeof v.heights==='object')setHeights(old=>Object.fromEntries(defs.map(d=>[d.id,Number.isFinite(v.heights[d.id])?Math.max(180,Math.min(480,v.heights[d.id])):old[d.id]])) as Record<WidgetId,number>);}catch{}finally{setHydrated(true)}},[]);
 useEffect(()=>{if(!hydrated)return;try{localStorage.setItem('radar-widget-layout-v1',JSON.stringify({order,modes,hidden,wide,heights}));}catch{}},[order,modes,hidden,wide,heights,hydrated]);
 const data=useMemo(()=>{
  const h=history as {periods:string[];operators:string[];values:number[][]};
  return {mobile:{series:h.operators.map((_,j)=>h.values.map(row=>row[j])),labels:h.operators},
   fixed:{series:['FTTx','XDSL','TDLTE','WiFi'].map(k=>fixed.observations.map(r=>r.technology_values[k as keyof typeof r.technology_values])),labels:['FTTx','XDSL','TDLTE','WiFi']},
   survey:{series:[survey.observations.map(r=>r.value)],labels:['درصد پاسخ به پرسش‌های متفاوت']}};
 },[]);
 function reorder(source:WidgetId,target:WidgetId){
  if(source===target)return;
  setOrder(old=>{const next=old.filter(x=>x!==source);next.splice(next.indexOf(target),0,source);return next});
 }
 function drop(target:WidgetId){const source=dragId.current;dragId.current=null;setDragOver(null);if(source)reorder(source,target)}
 function move(id:WidgetId,delta:number){setOrder(old=>{const i=old.indexOf(id),j=i+delta;if(j<0||j>=old.length)return old;const next=[...old];[next[i],next[j]]=[next[j],next[i]];return next})}
 return <section className="md-root" aria-label="ویجت‌های قابل تنظیم">
  <div className="md-toolbar"><div><span>VISUAL ANALYTICS STUDIO</span><h2>تحلیل‌های تصویری و چیدمان شخصی</h2></div><div className="md-tools"><button onClick={()=>setEdit(x=>!x)} aria-pressed={edit}>{edit?'پایان ویرایش':'ویرایش چیدمان'}</button><button onClick={()=>{setOrder(['mobile','fixed','survey']);setModes({mobile:'area',fixed:'line',survey:'bar'});setHidden([]);setWide(['mobile']);setHeights({mobile:240,fixed:210,survey:210})}}>چیدمان پیش‌فرض</button>{hidden.length>0&&<button onClick={()=>setHidden([])}>نمایش همه ویجت‌ها ({hidden.length})</button>}</div></div>
  <div className="md-grid">{order.filter(id=>!hidden.includes(id)).map(id=>{const d=defs.find(x=>x.id===id)!;const metric=data[id];const mode=d.available.includes(modes[id])?modes[id]:d.available[0];return <article key={id} className={'md-widget '+(wide.includes(id)?'md-wide':'')+(dragOver===id?' md-drop-target':'')} onDragOver={e=>{if(edit&&dragId.current&&dragId.current!==id){e.preventDefault();setDragOver(id)}}} onDrop={e=>{e.preventDefault();const source=dragId.current||e.dataTransfer.getData('text/plain') as WidgetId;if(source&&defs.some(d=>d.id===source))reorder(source,id);dragId.current=null;setDragOver(null)}}>
   <div className="md-header"><div>{edit&&<div className="md-grip" draggable onDragStart={e=>{dragId.current=id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id)}} onDragEnd={()=>{dragId.current=null;setDragOver(null)}} title="برای تغییر ترتیب بکشید" aria-label={'دستگیره جابه‌جایی '+d.title}>⠿ جابه‌جایی</div>}<small>{d.source}</small><h3>{d.title}</h3></div><div className="md-controls"><label>نوع نمودار <select aria-label={'نوع نمودار '+d.title} value={mode} onChange={e=>setModes(v=>({...v,[id]:e.target.value as Mode}))}>{d.available.map(x=><option key={x} value={x}>{({line:'خطی',bar:'میله‌ای',area:'سطحی',donut:'حلقه‌ای'} as const)[x]}</option>)}</select></label></div></div>
   <div className={"md-size-body"+(edit?" md-resizable":"")} style={{height:heights[id]}} onPointerUp={e=>{if(!edit)return;const measured=Math.round(e.currentTarget.getBoundingClientRect().height);const clamped=Math.min(480,Math.max(180,measured));if(Math.abs(clamped-heights[id])>3)setHeights(v=>({...v,[id]:clamped}));}}>{plot(metric.series,mode,metric.labels)}</div>
   {mode!=='donut'&&<div className="md-legend">{metric.labels.map((x,i)=><span key={x}><i style={{background:colors[i%colors.length]}}/>{x}</span>)}</div>}
   {id==='survey'&&<p className="md-warning">درصدهای پرسش‌های متفاوت قابل جمع یا مقایسه مستقیم به‌عنوان یک سهم واحد نیستند؛ نمودار حلقه‌ای فقط در گروه‌های دارای مخرج مشترک مجاز است.</p>}
   {edit&&<div className="md-edit"><label className="md-height-label">ارتفاع نمودار <input aria-label={'ارتفاع نمودار '+d.title} type="range" min="180" max="480" step="30" value={heights[id]} onChange={e=>setHeights(v=>({...v,[id]:Number(e.target.value)}))}/><span>{fa(heights[id])} px</span></label><button onClick={()=>move(id,-1)}>جابه‌جایی به قبل</button><button onClick={()=>move(id,1)}>جابه‌جایی به بعد</button><button onClick={()=>setWide(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])}>{wide.includes(id)?'عرض معمولی':'عریض کردن'}</button><button onClick={()=>setHidden(v=>[...v,id])}>پنهان کردن</button></div>}
  </article>})}</div>
 </section>;
}
