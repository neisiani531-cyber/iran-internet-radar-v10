import React,{useEffect,useMemo,useRef,useState} from 'react';
import history from '../packages/contracts/cra57-mobile-broadband-history.json';
import fixed from '../packages/contracts/public-fixed-access.snapshot.json';
import survey from '../packages/contracts/p01-survey-research-preview.json';
import qos from '../packages/contracts/qos-metric-catalog.json';
import './ModularDashboard.css';
import AnalyticsChart,{ChartDataTable} from './AnalyticsChart';
import QoSScatter from './QoSScatter';
import WidgetProvenance from './WidgetProvenance';
import PanelExpandButton from './PanelExpandButton';
type Mode='line'|'bar'|'area'|'donut'|'heatmap'|'scatter';
type WidgetId='mobile'|'fixed'|'survey'|'access'|'drop'|'qualityPair'|'fiberCoverage';
type Widget={id:WidgetId;title:string;source:string;available:Mode[];initialHidden?:boolean};
const defs:Widget[]=[
 {id:'mobile',title:'روند اشتراک پهن‌باند سیار',source:'CRA57 · صفحه ۲۵ · در انتظار QA تصویری',available:['line','bar','area','donut']},
 {id:'fixed',title:'روند فناوری‌های اینترنت ثابت',source:'CRA57 · صفحه ۲۲ · در انتظار QA تصویری',available:['line','bar','area','donut']},
 {id:'survey',title:'یافته‌های منتخب تجربه کاربران',source:'پیمایش ملت · پژوهشی و فاقد پذیرش Q5',available:['bar']},
 {id:'access',title:'موفقیت اتصال داده در نسل‌های سیار',source:'CRA57 · صفحه ۱۵ · بهار ۱۴۰۵ · در انتظار QA تصویری',available:['bar','heatmap'],initialHidden:true},
 {id:'drop',title:'نرخ قطع اتصال داده در نسل‌های سیار',source:'CRA57 · صفحه ۱۵ · بهار ۱۴۰۵ · در انتظار QA تصویری',available:['bar','heatmap'],initialHidden:true},
 {id:'qualityPair',title:'رابطه موفقیت و قطع اتصال داده',source:'CRA57 · صفحه ۱۵ · بهار ۱۴۰۵ · در انتظار QA تصویری',available:['scatter'],initialHidden:true},
 {id:'fiberCoverage',title:'روند خانوارهای تحت پوشش فیبر',source:'CRA57 · صفحه ۴ · کاتالوگ V9.17 · در انتظار QA تصویری',available:['line','bar','area'],initialHidden:true}
];
type Profile='analyst'|'manager'|'tv'|'command';
type Layout={order:WidgetId[];modes:Record<WidgetId,Mode>;hidden:WidgetId[];wide:WidgetId[];heights:Record<WidgetId,number>;widths:Record<WidgetId,number>};
type LayoutStore={active:Profile;layouts:Record<Profile,Layout>};
const storageKey='radar-widget-layout-v2';
const profileNames:Record<Profile,string>={analyst:'تحلیلگر',manager:'مدیریتی',tv:'نمایشگر بزرگ',command:'فرماندهی متراکم'};
function defaultLayout(profile:Profile):Layout{
 if(profile==='command')return {order:['mobile','fixed','qualityPair','access','survey','fiberCoverage','drop'],modes:{mobile:'area',fixed:'donut',survey:'bar',access:'heatmap',drop:'bar',qualityPair:'scatter',fiberCoverage:'line'},hidden:['drop'],wide:[],widths:Object.fromEntries(defs.map(d=>[d.id,4])) as Record<WidgetId,number>,heights:Object.fromEntries(defs.map(d=>[d.id,180])) as Record<WidgetId,number>};
 return {order:defs.map(d=>d.id),modes:{mobile:'area',fixed:'line',survey:'bar',access:'bar',drop:'heatmap',qualityPair:'scatter',fiberCoverage:'area'},
  hidden:[...(profile==='manager'?['survey' as WidgetId]:[]),...defs.filter(d=>d.initialHidden).map(d=>d.id)],wide:profile==='tv'?[]:['mobile'],
  widths:Object.fromEntries(defs.map(d=>[d.id,profile!=='tv'&&d.id==='mobile'?12:6])) as Record<WidgetId,number>,
  heights:Object.fromEntries(defs.map(d=>[d.id,profile==='tv'?300:d.id==='mobile'?240:210])) as Record<WidgetId,number>};
}
function defaultStore():LayoutStore{return {active:'analyst',layouts:{analyst:defaultLayout('analyst'),manager:defaultLayout('manager'),tv:defaultLayout('tv'),command:defaultLayout('command')}};}
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
  result.widths[d.id]=typeof width==='number'&&Number.isFinite(width)?Math.max(profile==='command'?4:6,Math.min(12,Math.round(width))):(result.wide.includes(d.id)?12:6);
  const height=v.heights?.[d.id];
  if(typeof height==='number'&&Number.isFinite(height))result.heights[d.id]=Math.max(180,Math.min(480,Math.round(height)));
 }
 result.wide=defs.filter(d=>result.widths[d.id]>6).map(d=>d.id);
 return result;
}
const periodLabel=(period:string)=>period.replace(/^(\d{4})-Q([1-4])$/,(_,year,quarter)=>['بهار','تابستان','پاییز','زمستان'][Number(quarter)-1]+' '+year.replace(/\d/g,(digit:string)=>'۰۱۲۳۴۵۶۷۸۹'[Number(digit)]));
type CatalogRow={id:string;period:string;value:number;unit:string;page:number;source:string;denominator?:string;method?:string};
const canonicalPeriod=(value:string)=>value.replace(/[۰-۹]/g,digit=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/^(\d{4})-([1-4])$/,'$1-Q$2');
const fa=(v:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(v);
export default function ModularDashboard({selectedPeriod=history.periods[history.periods.length-1],selectedOperator='all'}:{selectedPeriod?:string;selectedOperator?:string}){
 const [fiberRows,setFiberRows]=useState<CatalogRow[]>([]);
 const [catalogError,setCatalogError]=useState('');
 const [catalogAttempt,setCatalogAttempt]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setCatalogError('');setFiberRows([]);
  const timeout=window.setTimeout(()=>controller.abort('timeout'),15000);
  fetch(new URL('data/v917-official-catalog.json',document.baseURI),{signal:controller.signal}).then(response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.json();}).then(catalog=>{
   if(catalog.total!==130||!Array.isArray(catalog.observations)||catalog.observations.length!==130||catalog.observations.some((row:CatalogRow)=>!row||typeof row.id!=='string')||new Set(catalog.observations.map((row:CatalogRow)=>row.id)).size!==130)throw Error('Catalog integrity');
   const rows=(catalog.observations as CatalogRow[]).filter(row=>row.id.startsWith('CRA57-FIBER-COV-')).sort((a,b)=>canonicalPeriod(a.period).localeCompare(canonicalPeriod(b.period)));
   const periods=['1402-Q4','1403-Q1','1403-Q2','1403-Q3','1403-Q4','1404-Q1','1404-Q2','1404-Q3','1404-Q4','1405-Q1'];
   if(rows.length!==periods.length||rows.some((row,index)=>typeof row.period!=='string'||canonicalPeriod(row.period)!==periods[index]||canonicalPeriod(row.id.slice('CRA57-FIBER-COV-'.length))!==periods[index]||!Number.isSafeInteger(row.value)||row.value<0||row.unit!=='خانوار'||row.page!==4||row.source!=='CRA57'))throw Error('Fiber coverage contract');
   setFiberRows(rows);
  }).catch(()=>{if(!controller.signal.aborted||controller.signal.reason==='timeout')setCatalogError('بارگذاری یا کنترل کاتالوگ منبع ناموفق بود.');}).finally(()=>window.clearTimeout(timeout));
  return ()=>{window.clearTimeout(timeout);controller.abort();};
 },[catalogAttempt]);
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
  const span=Math.max(session.profile==='command'?4:6,Math.min(12,Math.round((session.width+dx+12)/(session.gridWidth+12)*12)));
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
   if(resizeSession.current||document.fullscreenElement)return;
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
  const end=h.periods.indexOf(selectedPeriod)+1;
  const operatorsInScope=h.operators.map((name,index)=>({name,index})).filter(o=>selectedOperator==='all'||o.name===selectedOperator);
  function qualityData(metricId:string){
   const metric=qos.metrics.find(m=>m.id===metricId);
   const operators=[...new Set(metric?.values.map(v=>v.operator)??[])].filter(name=>selectedOperator==='all'||selectedOperator===name);
   const generations=['3G','4G'];
   const rows=generations.map(g=>operators.map(operator=>metric?.values.find(v=>v.operator===operator&&v.generation===g)?.value));
   if(selectedPeriod!==qos.period||!operators.length||rows.some(row=>row.some(value=>value===undefined)))return {series:[],labels:[],categories:[],unit:'درصد',emptyMessage:'برای فصل و اپراتور انتخاب‌شده داده کیفیت قابل مقایسه موجود نیست؛ منبع فقط بهار ۱۴۰۵ را پوشش می‌دهد.'};
   return {series:rows as number[][],labels:generations,categories:operators,unit:'درصد',categoryLabel:'اپراتور',ceiling:metricId==='access_success'?100:undefined};
  }
  function pairData(){
   const access=qos.metrics.find(metric=>metric.id==='access_success');
   const drop=qos.metrics.find(metric=>metric.id==='drop_rate');
   const rows=access?.values.filter(row=>selectedOperator==='all'||row.operator===selectedOperator)??[];
   const paired=rows.map(row=>({row,drop:drop?.values.find(other=>other.operator===row.operator&&other.generation===row.generation)?.value}));
   if(selectedPeriod!==qos.period||!paired.length||paired.some(pair=>pair.drop===undefined))return {series:[],labels:[],categories:[],unit:'درصد',emptyMessage:'برای انتخاب فعلی، جفت داده هم‌دوره موفقیت و قطع اتصال موجود نیست؛ منبع فقط بهار ۱۴۰۵ را پوشش می‌دهد.'};
   return {series:[paired.map(pair=>pair.row.value),paired.map(pair=>pair.drop as number)],labels:['موفقیت اتصال','نرخ قطع'],categories:paired.map(pair=>pair.row.operator+' · '+pair.row.generation),unit:'درصد',categoryLabel:'اپراتور · نسل'};
  }
  return {mobile:{series:operatorsInScope.map(o=>h.values.slice(0,end).map(row=>row[o.index])),labels:operatorsInScope.map(o=>o.name),categories:h.periods.slice(0,end).map(periodLabel),unit:'اشتراک',emptyMessage:'برای انتخاب فعلی داده تاریخی اشتراک سیار موجود نیست.'},
   fixed:{series:['FTTx','XDSL','TDLTE','WiFi'].map(k=>fixed.observations.map(r=>r.technology_values[k as keyof typeof r.technology_values])),labels:['FTTx','XDSL','TDLTE','WiFi'],categories:fixed.observations.map(r=>r.period_label),unit:'اشتراک'},
   survey:{series:[survey.observations.map(r=>r.value)],labels:['پاسخ به پرسش'],categories:survey.observations.map(r=>r.title),ticks:['سرعت','قیمت بسته','ابزار واسط','رفع محدودیت'],descriptions:survey.observations.map(r=>r.description),unit:'درصد پاسخ'},access:qualityData('access_success'),drop:qualityData('drop_rate'),qualityPair:pairData(),fiberCoverage:{series:[fiberRows.map(row=>row.value)],labels:['خانوار دارای امکان اتصال'],categories:fiberRows.map(row=>periodLabel(canonicalPeriod(row.period))),unit:'خانوار',emptyMessage:catalogError||'در حال بارگذاری کاتالوگ شاخص‌های منبع…'}};
 },[selectedPeriod,selectedOperator,fiberRows,catalogError]);
 function reorder(source:WidgetId,target:WidgetId,after=false){
  if(source===target)return;
  setOrder(old=>{const next=old.filter(x=>x!==source);next.splice(next.indexOf(target)+(after?1:0),0,source);return next});
 }
 function move(id:WidgetId,delta:number){setOrder(old=>{const i=old.indexOf(id),j=i+delta;if(j<0||j>=old.length)return old;const next=[...old];[next[i],next[j]]=[next[j],next[i]];return next})}
 return <section className={'md-root'+(active==='command'?' md-command':'')} aria-label="ویجت‌های قابل تنظیم">
  <div className="md-toolbar"><div><span>VISUAL ANALYTICS STUDIO</span><h2>تحلیل‌های تصویری و چیدمان شخصی</h2></div><div className="md-tools">
   <label className="md-profile">چیدمان <select aria-label="چیدمان شخصی" value={active} onChange={e=>switchProfile(e.target.value as Profile)}>{(Object.keys(profileNames) as Profile[]).map(profile=><option key={profile} value={profile}>{profileNames[profile]}</option>)}</select></label>
   {active!=='command'&&<button className="md-command-preset" onClick={()=>switchProfile('command')}>فرماندهی متراکم</button>}
   <button onClick={()=>setLibraryOpen(v=>!v)} aria-expanded={libraryOpen} aria-controls="md-library">کتابخانه ویجت‌ها</button>
   <button onClick={()=>{dragId.current=null;setDragOver(null);setEdit(x=>!x)}} aria-pressed={edit}>{edit?'پایان ویرایش':'ویرایش چیدمان'}</button>
   <button onClick={resetLayout}>چیدمان پیش‌فرض</button>{hidden.length>0&&<button onClick={()=>setHidden([])}>نمایش همه ویجت‌ها ({fa(hidden.length)})</button>}
  </div></div>
  {storageError&&<p className="md-warning" role="status">ذخیره چیدمان در مرورگر ممکن نیست؛ تغییرات فقط تا پایان این بازدید حفظ می‌شوند.</p>}
  {libraryOpen&&<div id="md-library" className="md-library" aria-label="کتابخانه ویجت‌ها"><p>ویجت‌های متصل به داده موجود · تنظیمات هر چیدمان جداگانه ذخیره می‌شود.</p>{defs.map(d=><div key={d.id}><div><strong>{d.title}</strong><small>{d.source}</small></div><button aria-label={(hidden.includes(d.id)?'افزودن ':'حذف از چیدمان ')+d.title} onClick={()=>setHidden(old=>old.includes(d.id)?old.filter(id=>id!==d.id):[...old,d.id])}>{hidden.includes(d.id)?'افزودن به چیدمان':'حذف از چیدمان'}</button></div>)}</div>}
  {hidden.length===defs.length&&<div className="md-empty" role="status">همه ویجت‌های این چیدمان پنهان شده‌اند.<button onClick={()=>setHidden([])}>بازیابی ویجت‌ها</button></div>}
  <div className="md-grid" ref={gridRef}>{order.filter(id=>!hidden.includes(id)).map(id=>{const d=defs.find(x=>x.id===id)!;const metric=data[id];const mode=d.available.includes(modes[id])?modes[id]:d.available[0];return <article key={id} data-widget={id} style={{gridColumn:'span '+widths[id]}} className={'md-widget '+(wide.includes(id)?'md-wide':'')+(dragOver?.id===id?' md-drop-target':'')+(resizing===id?' md-resizing':'')} onDragOver={e=>{if(edit&&!resizeSession.current&&dragId.current&&dragId.current!==id){e.preventDefault();e.dataTransfer.dropEffect='move';const box=e.currentTarget.getBoundingClientRect();setDragOver({id,after:e.clientY>box.y+box.height/2})}}} onDrop={e=>{e.preventDefault();const source=dragId.current;if(edit&&!resizeSession.current&&source&&source!==id){const box=e.currentTarget.getBoundingClientRect();reorder(source,id,e.clientY>box.y+box.height/2);}dragId.current=null;setDragOver(null)}}>
   {dragOver?.id===id&&<div className={'md-drop-marker '+(dragOver.after?'md-drop-after':'md-drop-before')} aria-hidden="true">{dragOver.after?'قرارگیری پس از این پنل':'قرارگیری پیش از این پنل'}</div>}
   <div className="md-header"><div>{edit&&<button type="button" className="md-grip" draggable onDragStart={e=>{if(resizeSession.current){e.preventDefault();return;}dragId.current=id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id)}} onDragEnd={()=>{dragId.current=null;setDragOver(null)}} title="برای تغییر ترتیب بکشید" aria-label={'دستگیره جابه‌جایی '+d.title}>⠿ جابه‌جایی</button>}<small>{d.source}</small><h3>{d.title}</h3></div><div className="md-controls"><PanelExpandButton title={d.title}/><label>نوع نمودار <select aria-label={'نوع نمودار '+d.title} value={mode} onChange={e=>setModes(v=>({...v,[id]:e.target.value as Mode}))}>{d.available.map(x=><option key={x} value={x}>{({line:'خطی',bar:'میله‌ای',area:'سطحی',donut:'حلقه‌ای',heatmap:'نقشه حرارتی',scatter:'پراکندگی'} as const)[x]}</option>)}</select></label></div></div>
   <p className="md-scope">{id==='mobile'?'بازه تاریخی تا '+periodLabel(selectedPeriod)+' · '+(selectedOperator==='all'?'هر سه اپراتور':selectedOperator):id==='access'||id==='drop'||id==='qualityPair'?'فصل انتخابی: '+periodLabel(selectedPeriod)+' · '+(selectedOperator==='all'?'هر سه اپراتور':selectedOperator):id==='fiberCoverage'?'خانوار دارای امکان اتصال · مستقل از اپراتور سیار؛ معادل اشتراک فعال نیست.':id==='fixed'?'فناوری‌های ثابت · دوره‌های مستقل منبع؛ فیلتر اپراتور سیار اعمال نمی‌شود.':'پیمایش ملت · جامعه پاسخ‌گویان مستقل؛ قابل انتساب به اپراتور انتخابی نیست.'}</p>
   <div className={"md-size-body"+(edit?" md-resizable":"")} style={{height:heights[id]}} data-widget-id={id} title="برای نمای بزرگ، دوبار کلیک کنید" onDoubleClick={event=>{if(!edit)event.currentTarget.closest('article')?.querySelector<HTMLButtonElement>('.panel-expand')?.click();}}>{mode==='scatter'?<QoSScatter key={id+selectedPeriod+selectedOperator} data={metric} title={d.title}/>:<AnalyticsChart key={id+selectedPeriod+selectedOperator} data={metric} mode={mode} title={d.title}/>}</div>
   {id==='fiberCoverage'&&catalogError&&<div className="md-catalog-error" role="alert"><span>{catalogError}</span><button type="button" onClick={()=>setCatalogAttempt(value=>value+1)}>تلاش مجدد برای بارگذاری منبع</button></div>}
   <ChartDataTable data={metric} title={d.title}/>
   <WidgetProvenance title={d.title} metadata={{
    source:id==='survey'?'پیمایش ملت · گزارش ۲۱۹۲۱':'فصلنامه ۵۷ سازمان تنظیم مقررات',
    page:id==='survey'?undefined:id==='mobile'?25:id==='fixed'?22:id==='fiberCoverage'?4:15,
    period:id==='survey'?'زمان پیمایش مطابق گزارش منبع؛ تاریخ بازیابی، زمان مشاهده نیست':id==='fiberCoverage'?fiberRows.length?periodLabel(canonicalPeriod(fiberRows[0].period))+' تا '+periodLabel(canonicalPeriod(fiberRows[fiberRows.length-1].period)):'دوره‌های منبع در انتظار بارگذاری':id==='fixed'?'بهار ۱۴۰۴ تا بهار ۱۴۰۵':id==='mobile'?periodLabel(history.periods[0])+' تا '+periodLabel(selectedPeriod):'بهار ۱۴۰۵؛ انتخاب فعلی: '+periodLabel(selectedPeriod),
    unit:metric.unit,scope:id==='survey'?'جامعه پاسخ‌گویان هر پرسش؛ مخرج پرسش‌ها یکسان فرض نمی‌شود':id==='fixed'||id==='fiberCoverage'?'کشور · تفکیک اپراتور یا استان در این سری موجود نیست':'کشور · '+(selectedOperator==='all'?'هر سه اپراتور':selectedOperator),
    gate:id==='survey'?'داده پژوهشی تأییدنشده · Q5_PENDING':'در انتظار کنترل تصویری منبع · مجاز برای پیش‌نمایش مشروط',
    method:id==='qualityPair'?'جفت‌سازی مقادیر موفقیت و قطع با کلید اپراتور و نسل در یک فصل':id==='fiberCoverage'?'انتخاب ردیف‌های هم‌تعریف پوشش فیبر از کاتالوگ V9.17؛ بدون بازبرآورد':id==='survey'?'پاسخ گزارش‌شده به پرسش‌های مستقل پیمایش':'رونویسی داده گزارش؛ کنترل لایه متنی انجام شده و کنترل تصویری نهایی باقی است',
    denominator:id==='survey'?'جامعه و گزینه‌های همان پرسش؛ توضیح هر مقدار در نمودار آمده است':id==='fiberCoverage'?'خانوار دارای امکان اتصال، بنا بر تعریف صفحه منبع':id==='mobile'||id==='fixed'?'شمار اشتراک طبق تعریف گزارش؛ مخرج درصدی ندارد':'تعریف دقیق رخداد و نمونه سنجش در snapshot حاضر کامل نیست؛ اصل صفحه منبع بررسی شود',
    limitation:id==='fiberCoverage'?'پوشش به معنی اشتراک فعال نیست. تکرار مقدار در چند فصل عین منبع منتقل شده و تأیید نهایی آن منوط به کنترل تصویری است.':id==='survey'?'پاسخ‌های گزارش‌شده پیمایش، پذیرش شاخص رسمی ملی یا انتساب علّی ندارند. تطبیق دسته‌های EV-P01-005 هنوز کامل نشده است.':id==='mobile'?'تعداد اشتراک با تعداد کاربران یکتا یا کل سیم‌کارت فعال یکسان نیست.':id==='fixed'?'تفکیک فناوری، سنجه سرعت یا رضایت کاربر نیست.':'فقط یک فصل موجود است؛ قابل تعمیم به روند زمانی، استان یا امتیاز کلی کیفیت نیست.',
    identifiers:id==='survey'?survey.observations.map(row=>row.evidence_id):id==='fiberCoverage'?fiberRows.map(row=>row.id):id==='qualityPair'?['CRA57','access_success','drop_rate']:id==='access'||id==='drop'?['CRA57',id==='access'?'access_success':'drop_rate']:[id==='mobile'?history.metric:fixed.dataset_id],
    count:metric.series.reduce((total,row)=>total+row.length,0)
   }}/>
   {id==='fiberCoverage'&&<p className="md-warning">خانوار تحت پوشش، تعداد اشتراک فعال فیبر نیست؛ مقادیر کاتالوگ هنوز به تأیید تصویری منبع نیاز دارند.</p>}
   {(id==='access'||id==='drop')&&<p className="md-warning">{id==='access'?'موفقیت اتصال: مقدار بیشتر مطلوب‌تر است.':'قطع اتصال: مقدار کمتر مطلوب‌تر است.'} داده فقط برای بهار ۱۴۰۵ موجود است؛ روند زمانی یا امتیاز کلی اپراتور نیست.{mode==='heatmap'?' شدت رنگ صرفاً مقدار همان شاخص را نشان می‌دهد.':''}</p>}
   {id==='survey'&&<p className="md-warning">درصدهای پرسش‌های متفاوت قابل جمع یا مقایسه مستقیم به‌عنوان یک سهم واحد نیستند؛ نمودار حلقه‌ای فقط در گروه‌های دارای مخرج مشترک مجاز است.</p>}
   {edit&&<button type="button" className="md-resize-handle" aria-label={'تغییر اندازه دوبعدی '+d.title} title="برای تغییر عرض و ارتفاع بکشید؛ با کلیدهای جهت نیز قابل تنظیم است" onPointerDown={e=>startResize(e,id)} onPointerMove={resizeMove} onPointerUp={e=>{resizeMove(e);endResize();}} onPointerCancel={endResize} onLostPointerCapture={endResize} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();setHeights(v=>({...v,[id]:Math.max(180,Math.min(480,v[id]+(e.key==='ArrowUp'?-30:30)))}));}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(!window.matchMedia('(max-width:900px)').matches)setWidth(id,Math.max(active==='command'?4:6,Math.min(12,widths[id]+(e.key==='ArrowLeft'?1:-1))));}}}>⤢</button>}
   {edit&&<div className="md-edit"><label className="md-height-label">ارتفاع نمودار <input aria-label={'ارتفاع نمودار '+d.title} type="range" min="180" max="480" step="30" value={heights[id]} onChange={e=>setHeights(v=>({...v,[id]:Number(e.target.value)}))}/><span>{fa(heights[id])} px</span></label><button onClick={()=>move(id,-1)}>جابه‌جایی به قبل</button><button onClick={()=>move(id,1)}>جابه‌جایی به بعد</button><button onClick={()=>setWidth(id,wide.includes(id)?6:12)}>{wide.includes(id)?'عرض معمولی':'عریض کردن'}</button><button onClick={()=>setHidden(v=>[...v,id])}>پنهان کردن</button></div>}
  </article>})}</div>
 </section>;
}
