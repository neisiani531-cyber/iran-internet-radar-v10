import React,{useMemo,useState} from 'react';
import AnalyticsChart,{ChartDataTable,type ChartMode} from './AnalyticsChart';
import {buildLegacyCatalogPanels,type CatalogPanel} from './LegacyCatalogPanels';
import type {LegacyRecord} from './LegacyDataBridge';
import PanelExpandButton from './PanelExpandButton';
import inventory from './command-statistics.json';
import infra from './command-infrastructure.json';
const fa=(v:number)=>v.toLocaleString('fa-IR',{maximumFractionDigits:4});
const excluded=new Set(['EXT-A19-02','EXT-A19-03','EXT-AI-02','EXT-AI-03','EXT-RSF-01','EXT-RSF-03','EXT-RSF-04','EXT-EU-01','EXT-EU-02','EXT-EU-03','EXT-UN-03','EXT-A19-04','EXT-A19-05']);
export function managerialEligible(id:string){return !excluded.has(id)}
export function domainForRecord(r:{section:string;label:string;raw:unknown}){
 const x=r.raw as Record<string,unknown>,theme=String(x.theme||x.group||'');
 if(/^CRA57-(4G-SITES|SAT)-/.test(String(x.id)))return 'communications';
 if(/سایبری|DDoS|API incidents/.test(r.label))return 'security';
 if(/P\/E|EPS|زیان مالی|سرمایه.گذاری|درآمد|ارزش بازار/.test(r.label))return 'governance';
 if(/مرکز داده|مراکز داده|دیتاسنتر|میزبانی|کش.شده|CDN/.test(r.label))return 'information';
 if(r.section.includes('سکوها')||theme==='platforms')return 'base';
 if(r.section.includes('پیمایش')||['experience','access','economy','regional','citizen'].includes(theme))return 'people';
 if(theme==='governance')return 'governance';
 if(theme==='resilience')return 'security';
 if(['mobile','fixed','operators','isps','quality','reach','overview'].includes(theme))return 'communications';
 if(['services','other'].includes(theme))return 'applications';
 if(theme==='infrastructure')return /cloud|CDN|مرکز داده|مراکز داده|کش|میزبانی|ابر/i.test(r.label)?'information':'communications';
 return 'governance';
}
const official=inventory.records.filter(r=>r.section==='رسمی نسخه ۹٫۱۷').map(r=>r.raw as unknown as LegacyRecord);
const panels=buildLegacyCatalogPanels(official);
function Panel({p}:{p:CatalogPanel}){
 const [mode,setMode]=useState<ChartMode>(p.modes[0]||'bar');
 const donut=mode==='donut';const data=donut?{unit:p.data.unit,series:p.rows.map(r=>[Number(r.value)]),labels:p.rows.map(r=>String(r.label)),categories:[String(p.rows[0].period)]}:p.data.series.length>1?{unit:p.data.unit,series:[p.rows.map(r=>Number(r.value))],labels:['مقدار گزارش‌شده'],categories:p.rows.map(r=>String(r.label))}:p.data;
 return <article className={'cw-card '+(!p.modes.length?'cw-scalar':'')} data-command-panel={p.id}><div className="cw-head"><div><small>رگولاتوری · فصلنامه ۵۷</small><h3>{p.title}</h3></div><PanelExpandButton title={p.title}/></div>{p.modes.length?<><div className="cw-visual"><AnalyticsChart compact title={p.title} mode={mode} data={data}/></div>{p.modes.length>1&&<div className="cw-modes">{p.modes.map(m=><button key={m} aria-pressed={m===mode} onClick={()=>setMode(m)}>{({bar:'میله‌ای',line:'خطی',area:'سطحی',donut:'حلقه‌ای',heatmap:'حرارتی'})[m]}</button>)}</div>}<ChartDataTable title={p.title} data={data}/></>:<div className="cw-value">{fa(Number(p.rows[0].value))}<span>{String(p.rows[0].unit)}</span></div>}<details className="cw-source"><summary>دوره و منبع · {p.rows.length} مشاهده</summary>{p.rows.map(r=><div key={String(r.id)} data-command-observation={String(r.id)}><b>{String(r.label)} · {fa(Number(r.value))} {String(r.unit)}</b><p>{String(r.period)} · صفحه {String(r.page)} · {String(r.id)}</p><p>{String(r.note||r.denominator||'تعریف در صفحه منبع')}</p></div>)}<p>استخراج گزارش رسمی؛ کنترل تصویری نهایی باقی است.</p></details></article>
}
const names:Record<string,string>={communications:'زیرساخت ارتباطی',information:'زیرساخت اطلاعاتی',base:'خدمات پایه',applications:'خدمات کاربردی',people:'مردم',security:'امنیت',governance:'حکمرانی'};
export default function CommandDataWall({domain}:{domain:string}){
 const [query,setQuery]=useState(''),[kind,setKind]=useState('all');
 const selectedPanels=useMemo(()=>panels.filter(p=>domainForRecord({section:'رسمی نسخه ۹٫۱۷',label:p.title,raw:p.rows[0]})===domain),[domain]);
 const research=inventory.records.filter(r=>r.section==='شواهد نسخه ۹٫۱۷'&&!r.row_id.startsWith('CRA57-')&&managerialEligible(r.row_id)&&domainForRecord(r)===domain);
 const extra=infra.filter(r=>r.layer===domain);
 const platform=inventory.records.filter(r=>r.section.includes('سکوها')&&domain==='base');
 const cards=[...research,...extra,...platform].filter(r=>typeof r.value==='number');
 const matchedPanels=selectedPanels.filter(p=>!query||JSON.stringify(p).toLowerCase().includes(query.toLowerCase()));
 const matchedCards=cards.filter(r=>!query||JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));
 return <section className="cw-wall" aria-label={'پوشش داده '+names[domain]}><div className="cw-heading"><div><span className="nc-kicker">DOMAIN DATA WALL</span><h2>پایش تفصیلی {names[domain]}</h2><p>{selectedPanels.reduce((n,p)=>n+p.rows.length,0)} مشاهده رسمی در {selectedPanels.length} پنل · {cards.length} مشاهده عددی تکمیلی</p></div><div className="cw-filters"><input aria-label="جست‌وجوی نمودارهای حوزه" placeholder="جست‌وجوی نمودار یا شاخص…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="نوع داده حوزه" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">همه داده‌ها</option><option value="official">گزارش رسمی</option><option value="research">شواهد تکمیلی</option></select></div></div>
 {kind!=='research'&&matchedPanels.length>0&&<div className="cw-grid">{matchedPanels.map(p=><Panel key={p.id} p={p}/>)}</div>}
 {kind!=='official'&&matchedCards.length>0&&<><div className="cw-subhead"><h3>شاخص‌ها و مشاهدات تکمیلی</h3><p>مقادیر با دوره و تعریف متفاوت؛ قابل جمع یا رتبه‌بندی خودکار نیستند. هر عدد با وضعیت منبع خود خوانده شود.</p></div><div className="cw-grid cw-facts">{matchedCards.map((r,i)=>{const raw=r.raw as Record<string,unknown>;return <article className="cw-card cw-fact" key={r.row_id+i} data-command-research={r.row_id}><div className="cw-head"><h3>{r.label||String(raw.sku||raw.metric_id||'شاخص')}</h3><PanelExpandButton title={r.label}/></div><div className="cw-value">{fa(Number(r.value))}<span>{r.unit}</span></div><p className="cw-period">{r.period||String(raw.period_label||'دوره در شناسنامه')}</p><span className="cw-badge">{r.section.includes('سکوها')?'گزارش سکوها · بررسی منبع باقی است':String(raw.status).startsWith('HELD')?'نیازمند راستی‌آزمایی؛ شاخص ملی نیست':r.section.includes('ساختاریافته')?'اعلام ارائه‌دهنده / پژوهشی':'شاهد پژوهشی · تأیید مستقل نیست'}</span><details className="cw-source"><summary>تعریف، منبع و محدودیت</summary><p>شناسه: {r.row_id}</p><p>{String(raw.description||raw.limit||raw.note||raw.scope||'محدودیت‌ها در رکورد منبع آمده است')}</p><p>منبع: {String(raw.source_label||raw.source||raw.source_id||r.source_file)}</p><p>وضعیت: {String(raw.status||raw.verification||raw.quality_gate||'نیازمند بررسی')}</p>{typeof raw.source_url==='string'&&<a href={raw.source_url} target="_blank" rel="noreferrer">منبع اصلی ↗</a>}</details></article>})}</div></>}
 {matchedPanels.length===0&&matchedCards.length===0&&<p className="cw-empty">برای این انتخاب داده عددی قابل نمایش موجود نیست. شاخصی ساخته نشده است.</p>}
 </section>
}
export function commandCoverage(){return {officialObservations:panels.flatMap(p=>p.rows.map(r=>({id:String(r.id),panel:p.id,domain:domainForRecord({section:'رسمی نسخه ۹٫۱۷',label:p.title,raw:r}),unit:String(r.unit),value:r.value}))),panels:panels.map(p=>({id:p.id,title:p.title,domain:domainForRecord({section:'رسمی نسخه ۹٫۱۷',label:p.title,raw:p.rows[0]}),count:p.rows.length,chart:p.modes.length>0})),editorialExcludedIds:[...excluded],note:'Exclusions affect managerial presentation only. Original source records are retained; exclusions do not alter numeric evidence.'}}
