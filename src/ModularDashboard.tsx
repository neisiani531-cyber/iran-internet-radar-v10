import React,{useEffect,useMemo,useRef,useState} from 'react';
import history from '../packages/contracts/cra57-mobile-broadband-history.json';
import fixed from '../packages/contracts/public-fixed-access.snapshot.json';
import survey from '../packages/contracts/p01-survey-research-preview.json';
import qos from '../packages/contracts/qos-metric-catalog.json';
import './ModularDashboard.css';
import AnalyticsChart,{ChartDataTable} from './AnalyticsChart';
type Mode='line'|'bar'|'area'|'donut'|'heatmap';
type WidgetId='mobile'|'fixed'|'survey'|'access'|'drop';
type Widget={id:WidgetId;title:string;source:string;available:Mode[];initialHidden?:boolean};
const defs:Widget[]=[
 {id:'mobile',title:'روند اشتراک پهن‌باند سیار',source:'CRA57 · صفحه ۲۵ · در انتظار QA تصویری',available:['line','bar','area','donut']},
 {id:'fixed',title:'روند فناوری‌های اینترنت ثابت',source:'CRA57 · صفحه ۲۲ · در انتظار QA تصویری',available:['line','bar','area','donut']},
 {id:'survey',title:'یافته‌های منتخب تجربه کاربران',source:'پیمایش ملت · پژوهشی و فاقد پذیرش Q5',available:['bar']},
 {id:'access',title:'موفقیت اتصال داده در نسل‌های سیار',source:'CRA57 · صفحه ۱۵ · بهار ۱۴۰۵ · در انتظار QA تصویری',available:['bar','heatmap'],initialHidden:true},
 {id:'drop',title:'نرخ قطع اتصال داده در نسل‌های سیار',source:'CRA57 · صفحه ۱۵ · بهار ۱۴۰۵ · در انتظار QA تصویری',available:['bar','heatmap'],initialHidden:true}
];
type Profile='analyst'|'manager'|'tv';
type Layout={order:WidgetId[];modes:Record<WidgetId,Mode>;hidden:WidgetId[];wide:WidgetId[];heights:Record<WidgetId,number>;widths:Record<WidgetId,number>};
type LayoutStore={active:Profile;layouts:Record<Profile,Layout>};
const storageKey='radar-widget-layout-v2';
const profileNames:Record<Profile,string>={analyst:'تحلیلگر',manager:'مدیریتی',tv:'نمایشگر بزرگ'};
function defaultLayout(profile:Profile):Layout{
 return {order:defs.map(d=>d.id),modes:{mobile:'area',fixed:'line',survey:'bar',access:'bar',drop:'heatmap'},
  hidden:[...(profile==='manager'?['survey' as WidgetId]:[]),...defs.filter(d=>d.initialHidden).map(d=>d.id)],wide:profile==='tv'?[]:['mobile'],
  widths:Object.fromEntries(defs.map(d=>[d.id,profile!=='tv'&&d.id==='mobile'?12:6])) as Record<WidgetId,number>,
  heights:Object.fromEntries(defs.map(d=>[d.id,profile==='tv'?300:d.id==='mobile'?240:210])) as Record<WidgetId,number>};
}
function defaultStore():LayoutStore{return {active:'analyst',layouts:{analyst:defaultLayout('analyst'),manager:defaultLayout('manager'),tv:defaultLayout('tv')}};}
function validId(value:unknown):value is WidgetId{return defs.some(d=>d.id===value);}
function readLayout(value:unknown,profile:Profile):Layout{
 const result=defaultLayout(profile);
 if(!value||typeof value!=='object')return result;
 const v=value as Partial<Layout>;
 if(Array.isArray(v.order))result.order=[...new Set(v.order.filter(validId)),...result.order.filter(id=>!v.order!.includes(id))];
 for(const key of ['hidden','wide'] as const)if(Array.isArray(v[key]))result[key]=[...new Set(v[key]!.filter(validId))];
 // Newly registered optional widgets stay hidden when migrating an older layout.
 result.hidden=[...new Set([...result.hidden,...defs.filter(d=>d.initialHidden&&(!Array.isArray(v.order)||!v.order.includes(d.id))).map(d=>d.id)])];
 for(const d of defs){
  if(v.modes&&d.available.includes(v.modes[d.id]))result.modes[d.id]=v.modes[d.id];
  const width=v.widths?.[d.id];
  result.widths[d.id]=typeof width==='number'&&Number.isFinite(width)?Math.max(6,Math.min(12,Math.round(width))):(result.wide.includes(d.id)?12:6);
  const height=v.heights?.[d.id];
  if(typeof height==='number'&&Number.isFinite(height))result.heights[d.id]=Math.max(180,Math.min(480,Math.round(height)));
 }
 result.wide=defs.filter(d=>result.widths[d.id]>6).map(d=>d.id);
 return result;
}
const periodLabel=(period:string)=>period.replace(/^(\d{4})-Q([1-4])$/,(_,year,quarter)=>['بهار','تابستان','پاییز','زمستان'][Number(quarter)-1]+' '+year.replace(/\d/g,(digit:string)=>'۰۱۲۳۴۵۶۷۸۹'[Number(digit)]));
const fa=(v:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(v);
export default function ModularDashboard(){
 const [saved,setSaved]=useState<LayoutStore>(defaultStore);
 const {active,layouts}=saved;
 const {order,modes,hidden,wide,heights,widths}=layouts[active];
 function update<K extends keyof Layout>(key:K,value:React.SetStateAction<Layout[K]>){
  setSaved(old=>{const layout=old.layouts[old.active];return {...old,layouts:{...old.layouts,[old.active]:{...layout,[key]:typeof value==='function'?(value as (old:Layout[K])=>Layout[K])(layout[key]):value}}};});
 }
 const setOrder=(value:React.SetStateAction<WidgetId[]>)=>update('order',value);
 const setModes=(value:React.SetStateAction<Record<WidgetId,Mode>>)=>update('modes',value);
 const setHidden=(value:React.SetStateAction<WidgetId[]>)=>update('hidden',value);
 function setWidth(id:WidgetId,width:number){
  setSaved(old=>{const layout=old.layouts[old.active];const nextWidths={...layout.widths,[id]:width};return {...old,layouts:{...old.layouts,[old.active]:{...layout,widths:nextWidths,wide:defs.filter(d=>nextWidths[d.id]>6).map(d=>d.id)}}};});
 }
 const setHeights=(value:React.SetStateAction<Record<WidgetId,number>>)=>update('heights',value);
 const [edit,setEdit]=useState(false);
 const [libraryOpen,setLibraryOpen]=useState(false);
 const [storageError,setStorageError]=useState(false);
 const gridRef=useRef<HTMLDivElement>(null);
 const dragId=useRef<WidgetId|null>(null);
 const [dragOver,setDragOver]=useState<{id:WidgetId;after:boolean}|null>(null);
 const [resizing,setResizing]=useState<WidgetId|null>(null);
 const resizeSession=useRef<{id:WidgetId;profile:Profile;x:number;y:number;width:number;height:number;gridWidth:number;rtl:boolean;pointerId:number}|null>(null);
 function startResize(e:React.PointerEvent<HTMLButtonElement>,id:WidgetId){
  if(!edit||e.button!==0||!gridRef.current)return;
  e.preventDefault();e.stopPropagation();dragId.current=null;setDragOver(null);
  const article=e.currentTarget.closest('article')!;
  resizeSession.current={id,profile:active,x:e.clientX,y:e.clientY,width:article.getBoundingClientRect().width,height:heights[id],gridWidth:gridRef.current.getBoundingClientRect().width,rtl:getComputedStyle(gridRef.current).direction==='rtl',pointerId:e.pointerId};
  e.currentTarget.setPointerCapture(e.pointerId);setResizing(id);
 }
 function resizeMove(e:React.PointerEvent<HTMLButtonElement>){
  const session=resizeSession.current;
  if(!session||session.pointerId!==e.pointerId)return;
  const dx=(e.clientX-session.x)*(session.rtl?-1:1);
  const span=Math.max(6,Math.min(12,Math.round((session.width+dx+12)/(session.gridWidth+12)*12)));
  const height=Math.max(180,Math.min(480,Math.round(session.height+e.clientY-session.y)));
  const singleColumn=window.matchMedia('(max-width:900px)').matches;
  setSaved(old=>{const layout=old.layouts[session.profile];const nextWidths={...layout.widths,[session.id]:singleColumn?layout.widths[session.id]:span};return {...old,layouts:{...old.layouts,[session.profile]:{...layout,widths:nextWidths,wide:defs.filter(d=>nextWidths[d.id]>6).map(d=>d.id),heights:{...layout.heights,[session.id]:height}}}};});
 }
 function endResize(){resizeSession.current=null;setResizing(null);}

 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{
  try{
   const raw=localStorage.getItem(storageKey);
   if(raw){
    const v=JSON.parse(raw),next=defaultStore();
    if(typeof v?.active==='string'&&Object.prototype.hasOwnProperty.call(profileNames,v.active))next.active=v.active;
    for(const profile of Object.keys(profileNames) as Profile[])next.layouts[profile]=readLayout(v?.layouts?.[profile],profile);
    setSaved(next);
   }else{
    const legacy=localStorage.getItem('radar-widget-layout-v1');
    if(legacy)setSaved(old=>({...old,layouts:{...old.layouts,analyst:readLayout(JSON.parse(legacy),'analyst')}}));
   }
  }catch{setStorageError(true);}finally{setHydrated(true);}
 },[]);
 useEffect(()=>{if(!hydrated)return;try{localStorage.setItem(storageKey,JSON.stringify(saved));setStorageError(false);}catch{setStorageError(true);}},[saved,hydrated]);
 function switchProfile(profile:Profile){endResize();dragId.current=null;setDragOver(null);setEdit(false);setSaved(old=>({...old,active:profile}));}
 function resetLayout(){endResize();dragId.current=null;setDragOver(null);setSaved(old=>({...old,layouts:{...old.layouts,[old.active]:defaultLayout(old.active)}}));}
 // Native resize can end outside the panel: observe its border box instead of
 // relying on a pointerup event bubbling from Chromium's resize control.
 useEffect(()=>{
  if(!edit||!hydrated||!gridRef.current)return;
  const observer=new ResizeObserver(entries=>{
   if(resizeSession.current)return;
   for(const entry of entries){
    const id=(entry.target as HTMLElement).dataset.widgetId as WidgetId;
    const height=Math.max(180,Math.min(480,Math.round(entry.borderBoxSize[0]?.blockSize??entry.target.getBoundingClientRect().height)));
    setHeights(old=>Math.abs(old[id]-height)>1?{...old,[id]:height}:old);
   }
  });
  gridRef.current.querySelectorAll('.md-size-body').forEach(node=>observer.observe(node));
  return ()=>observer.disconnect();
 },[edit,hydrated,hidden,order,active]);
 const data=useMemo(()=>{
  const h=history as {periods:string[];operators:string[];values:number[][]};
  function qualityData(metricId:string){
   const metric=qos.metrics.find(m=>m.id===metricId);
   const operators=[...new Set(metric?.values.map(v=>v.operator)??[])];
   const generations=['3G','4G'];
   const rows=generations.map(g=>operators.map(operator=>metric?.values.find(v=>v.operator===operator&&v.generation===g)?.value));
   if(!operators.length||rows.some(row=>row.some(value=>value===undefined)))return {series:[],labels:[],categories:[],unit:'درصد'};
   return {series:rows as number[][],labels:generations,categories:operators,unit:'درصد',categoryLabel:'اپراتور',ceiling:metricId==='access_success'?100:undefined};
  }
  return {mobile:{series:h.operators.map((_,j)=>h.values.map(row=>row[j])),labels:h.operators,categories:h.periods.map(periodLabel),unit:'اشتراک'},
   fixed:{series:['FTTx','XDSL','TDLTE','WiFi'].map(k=>fixed.observations.map(r=>r.technology_values[k as keyof typeof r.technology_values])),labels:['FTTx','XDSL','TDLTE','WiFi'],categories:fixed.observations.map(r=>r.period_label),unit:'اشتراک'},
   survey:{series:[survey.observations.map(r=>r.value)],labels:['پاسخ به پرسش'],categories:survey.observations.map(r=>r.title),ticks:['سرعت','قیمت بسته','ابزار واسط','رفع محدودیت'],descriptions:survey.observations.map(r=>r.description),unit:'درصد پاسخ'},access:qualityData('access_success'),drop:qualityData('drop_rate')};
 },[]);
 function reorder(source:WidgetId,target:WidgetId,after=false){
  if(source===target)return;
  setOrder(old=>{const next=old.filter(x=>x!==source);next.splice(next.indexOf(target)+(after?1:0),0,source);return next});
 }
 function move(id:WidgetId,delta:number){setOrder(old=>{const i=old.indexOf(id),j=i+delta;if(j<0||j>=old.length)return old;const next=[...old];[next[i],next[j]]=[next[j],next[i]];return next})}
 return <section className="md-root" aria-label="ویجت‌های قابل تنظیم">
  <div className="md-toolbar"><div><span>VISUAL ANALYTICS STUDIO</span><h2>تحلیل‌های تصویری و چیدمان شخصی</h2></div><div className="md-tools">
   <label className="md-profile">چیدمان <select aria-label="چیدمان شخصی" value={active} onChange={e=>switchProfile(e.target.value as Profile)}>{(Object.keys(profileNames) as Profile[]).map(profile=><option key={profile} value={profile}>{profileNames[profile]}</option>)}</select></label>
   <button onClick={()=>setLibraryOpen(v=>!v)} aria-expanded={libraryOpen} aria-controls="md-library">کتابخانه ویجت‌ها</button>
   <button onClick={()=>{dragId.current=null;setDragOver(null);setEdit(x=>!x)}} aria-pressed={edit}>{edit?'پایان ویرایش':'ویرایش چیدمان'}</button>
   <button onClick={resetLayout}>چیدمان پیش‌فرض</button>{hidden.length>0&&<button onClick={()=>setHidden([])}>نمایش همه ویجت‌ها ({fa(hidden.length)})</button>}
  </div></div>
  {storageError&&<p className="md-warning" role="status">ذخیره چیدمان در مرورگر ممکن نیست؛ تغییرات فقط تا پایان این بازدید حفظ می‌شوند.</p>}
  {libraryOpen&&<div id="md-library" className="md-library" aria-label="کتابخانه ویجت‌ها"><p>ویجت‌های متصل به داده موجود · تنظیمات هر چیدمان جداگانه ذخیره می‌شود.</p>{defs.map(d=><div key={d.id}><div><strong>{d.title}</strong><small>{d.source}</small></div><button aria-label={(hidden.includes(d.id)?'افزودن ':'حذف از چیدمان ')+d.title} onClick={()=>setHidden(old=>old.includes(d.id)?old.filter(id=>id!==d.id):[...old,d.id])}>{hidden.includes(d.id)?'افزودن به چیدمان':'حذف از چیدمان'}</button></div>)}</div>}
  {hidden.length===defs.length&&<div className="md-empty" role="status">همه ویجت‌های این چیدمان پنهان شده‌اند.<button onClick={()=>setHidden([])}>بازیابی ویجت‌ها</button></div>}
  <div className="md-grid" ref={gridRef}>{order.filter(id=>!hidden.includes(id)).map(id=>{const d=defs.find(x=>x.id===id)!;const metric=data[id];const mode=d.available.includes(modes[id])?modes[id]:d.available[0];return <article key={id} data-widget={id} style={{gridColumn:'span '+widths[id]}} className={'md-widget '+(wide.includes(id)?'md-wide':'')+(dragOver?.id===id?' md-drop-target':'')+(resizing===id?' md-resizing':'')} onDragOver={e=>{if(edit&&!resizeSession.current&&dragId.current&&dragId.current!==id){e.preventDefault();e.dataTransfer.dropEffect='move';const box=e.currentTarget.getBoundingClientRect();setDragOver({id,after:e.clientY>box.y+box.height/2})}}} onDrop={e=>{e.preventDefault();const source=dragId.current;if(edit&&!resizeSession.current&&source&&source!==id){const box=e.currentTarget.getBoundingClientRect();reorder(source,id,e.clientY>box.y+box.height/2);}dragId.current=null;setDragOver(null)}}>
   {dragOver?.id===id&&<div className={'md-drop-marker '+(dragOver.after?'md-drop-after':'md-drop-before')} aria-hidden="true">{dragOver.after?'قرارگیری پس از این پنل':'قرارگیری پیش از این پنل'}</div>}
   <div className="md-header"><div>{edit&&<button type="button" className="md-grip" draggable onDragStart={e=>{if(resizeSession.current){e.preventDefault();return;}dragId.current=id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id)}} onDragEnd={()=>{dragId.current=null;setDragOver(null)}} title="برای تغییر ترتیب بکشید" aria-label={'دستگیره جابه‌جایی '+d.title}>⠿ جابه‌جایی</button>}<small>{d.source}</small><h3>{d.title}</h3></div><div className="md-controls"><label>نوع نمودار <select aria-label={'نوع نمودار '+d.title} value={mode} onChange={e=>setModes(v=>({...v,[id]:e.target.value as Mode}))}>{d.available.map(x=><option key={x} value={x}>{({line:'خطی',bar:'میله‌ای',area:'سطحی',donut:'حلقه‌ای',heatmap:'نقشه حرارتی'} as const)[x]}</option>)}</select></label></div></div>
   <div className={"md-size-body"+(edit?" md-resizable":"")} style={{height:heights[id]}} data-widget-id={id}>{<AnalyticsChart data={metric} mode={mode} title={d.title}/>}</div>
   <ChartDataTable data={metric} title={d.title}/>
   {(id==='access'||id==='drop')&&<p className="md-warning">{id==='access'?'موفقیت اتصال: مقدار بیشتر مطلوب‌تر است.':'قطع اتصال: مقدار کمتر مطلوب‌تر است.'} داده فقط برای بهار ۱۴۰۵ موجود است؛ روند زمانی یا امتیاز کلی اپراتور نیست.{mode==='heatmap'?' شدت رنگ صرفاً مقدار همان شاخص را نشان می‌دهد.':''}</p>}
   {id==='survey'&&<p className="md-warning">درصدهای پرسش‌های متفاوت قابل جمع یا مقایسه مستقیم به‌عنوان یک سهم واحد نیستند؛ نمودار حلقه‌ای فقط در گروه‌های دارای مخرج مشترک مجاز است.</p>}
   {edit&&<button type="button" className="md-resize-handle" aria-label={'تغییر اندازه دوبعدی '+d.title} title="برای تغییر عرض و ارتفاع بکشید؛ با کلیدهای جهت نیز قابل تنظیم است" onPointerDown={e=>startResize(e,id)} onPointerMove={resizeMove} onPointerUp={e=>{resizeMove(e);endResize();}} onPointerCancel={endResize} onLostPointerCapture={endResize} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();setHeights(v=>({...v,[id]:Math.max(180,Math.min(480,v[id]+(e.key==='ArrowUp'?-30:30)))}));}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(!window.matchMedia('(max-width:900px)').matches)setWidth(id,Math.max(6,Math.min(12,widths[id]+(e.key==='ArrowLeft'?1:-1))));}}}>⤢</button>}
   {edit&&<div className="md-edit"><label className="md-height-label">ارتفاع نمودار <input aria-label={'ارتفاع نمودار '+d.title} type="range" min="180" max="480" step="30" value={heights[id]} onChange={e=>setHeights(v=>({...v,[id]:Number(e.target.value)}))}/><span>{fa(heights[id])} px</span></label><button onClick={()=>move(id,-1)}>جابه‌جایی به قبل</button><button onClick={()=>move(id,1)}>جابه‌جایی به بعد</button><button onClick={()=>setWidth(id,wide.includes(id)?6:12)}>{wide.includes(id)?'عرض معمولی':'عریض کردن'}</button><button onClick={()=>setHidden(v=>[...v,id])}>پنهان کردن</button></div>}
  </article>})}</div>
 </section>;
}
