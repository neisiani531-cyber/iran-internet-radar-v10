import QoSQoECenter from './QoSQoECenter';
import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import CommandCenter from './CommandCenter';
import TargetCommandCenter from './TargetCommandCenter';
import CommandNavigation from './CommandNavigation';
import ResearchInsights from './ResearchInsights';
import EvidenceRoom from './EvidenceRoom';
import SocialIntelligence from './SocialIntelligence';
import SocialLivePanel from './SocialLivePanel';
import RadarAssistant from './RadarAssistant';
import OperatorExplorer from './OperatorExplorer';
import FixedAnalysis from './FixedAnalysis';
import OperatorComparison from './OperatorComparison';
import LatencyQuality from './LatencyQuality';
import OfficialCatalog from './OfficialCatalog';
import LiveRouting from './LiveRouting';
import ServicesDashboard from './ServicesDashboard';
import OfficialDataStudio from './OfficialDataStudio';
import ResearchDataLab from './ResearchDataLab';
import snapshot from '../packages/contracts/public-fixed-access.snapshot.json';
import mobile from '../packages/contracts/public-mobile-operators.snapshot.json';
import research from '../packages/contracts/research-catalog.json';
import p01 from '../packages/contracts/p01-research-registry.json';
import admission from '../packages/contracts/source-admission-public.json';
import evidence from '../packages/contracts/evidence-metadata-public.json';
import qos from '../packages/contracts/qos-metric-catalog.json';

type Tech = 'FTTx' | 'XDSL' | 'TDLTE' | 'WiFi';
type Point = { period:string; XDSL:number; FTTx:number; TDLTE:number; WiFi:number };
type SourceRow = {period:string;period_label:string;technology_values:Record<Tech,number>;reported_total:number};
const source = snapshot.source.organization+'، '+snapshot.source.publication;
const rows:Point[]=(snapshot.observations as SourceRow[]).map(r=>({
  period:r.period_label,
  ...r.technology_values
}));
const latest = snapshot.observations[snapshot.observations.length-1];
const fttxDelta=(latest.technology_values.FTTx/snapshot.observations[0].technology_values.FTTx-1)*100;
const number=(v:number)=>new Intl.NumberFormat('fa-IR').format(v);
function App(){
 const [qosMetric,setQosMetric]=useState<'access_success'|'drop_rate'>('access_success');const [generation,setGeneration]=useState<'3G'|'4G'>('4G');const [admissionQuery,setAdmissionQuery]=useState('');const [admissionRule,setAdmissionRule]=useState('all');const [query,setQuery]=useState('');const [study,setStudy]=useState('all');const [domain,setDomain]=useState('all');const [detail,setDetail]=useState<string|null>(null);const [area,setArea]=useState<'command'|'target'|'fixed'|'mobile'|'research'|'qos'|'social'|'evidence'|'legacy'|'catalog'|'reach'|'services'|'studio'|'researchlab'|'live'>('target');const [mobileMetric,setMobileMetric]=useState<'active_5g_sites'|'population_4g_coverage'>('active_5g_sites');const [tech,setTech]=useState<Tech>('FTTx');const [view,setView]=useState<'bars'|'table'>('bars');const [selected,setSelected]=useState<number|null>(null);
 const [evidenceFocus,setEvidenceFocus]=useState<string|undefined>();
 const navigate=(destination: Parameters<typeof setArea>[0],
                 evidenceId?:string)=>{
  setEvidenceFocus(destination==='evidence'?evidenceId:undefined);
  setArea(destination);
 };
 const max=useMemo(()=>Math.max(...rows.map(r=>r[tech]),1),[tech]);
 const delta=(rows[rows.length-1][tech]/rows[0][tech]-1)*100;
 const filtered=p01.records.filter(r=>(study==='all'||r.study_family===study)&&(domain==='all'||r.domain===domain)&&(!query||(r.crosswalk_id+' '+r.study_family+' '+r.exact_construct).toLowerCase().includes(query.toLowerCase())));
 const active=p01.records.find(r=>r.crosswalk_id===detail);
 return <div className={"shell"+(area==='target'?" command-room":"")}><CommandNavigation area={area} onNavigate={navigate}/><main>{area==='target'?<TargetCommandCenter onNavigate={navigate}/>:area==='command'?<CommandCenter onNavigate={navigate}/>:area==='social'?<><SocialLivePanel/><SocialIntelligence/></>:area==='evidence'?<EvidenceRoom key={evidenceFocus||"all"} initialEvidenceId={evidenceFocus}/>:area==='live'?<LiveRouting/>:area==='researchlab'?<ResearchDataLab/>:area==='studio'?<OfficialDataStudio/>:area==='catalog'?<OfficialCatalog key="all"/>:area==='reach'?<ServicesDashboard kind="reach"/>:area==='services'?<ServicesDashboard kind="services"/>:area==='legacy'?<div style={{height:'calc(100vh - 40px)',minHeight:700}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 6px'}}><strong>آزمایشگاه کامل V9.17 · نسخه اصلی محفوظ</strong><a href={import.meta.env.BASE_URL + "legacy/v9-17.html"} target="_blank" rel="noreferrer">نمای تمام صفحه ↗</a></div><iframe title="رادار اینترنت ایران نسخه ۹٫۱۷" src={import.meta.env.BASE_URL + "legacy/v9-17.html"} style={{height:'95%',width:'100%',border:'1px solid #31546a',borderRadius:14}} /></div>:<><header><div><span className="eyebrow">رصد تحولات زیرساخت کشور</span><h1>{area==='mobile'?'مقایسه اپراتورهای سیار':area==='research'?'تجربه کاربران و تحلیل نارضایتی':area==='qos'?'کیفیت و شاخص‌های فنی شبکه':'دسترسی ثابت و توسعه فیبر نوری'}</h1><p>رابط React با داده‌های دوره‌ای مستند، قرارداد مشترک و مقایسه شاخص‌های هم‌تعریف.</p></div><span className="tag">نسخه آزمایشی رادار</span></header>{area==='qos'? <QoSQoECenter/> : area==='research'? <ResearchInsights/> : area==='mobile'? <>
<OperatorComparison/>
<details style={{marginTop:20}}>
  <summary style={{cursor:'pointer',padding:18}}>
    تحلیل تاریخی و جزئیات تکمیلی اپراتورها
  </summary>
  <OperatorExplorer/>
</details>
<details style={{marginTop:20}}>
  <summary style={{cursor:'pointer',padding:18}}>
    مشاهده تمام ۵۴ شاخص رسمی شبکه سیار و شناسنامه منابع
  </summary>
  <OfficialCatalog initialGroup='mobile'/>
</details>
</> : <><FixedAnalysis/><section className="stats"><article><span>اشتراک FTTx · بهار ۱۴۰۵</span><strong>{number(latest.technology_values.FTTx)}</strong><small>اتصالات گزارش‌شده</small></article><article><span>تغییر سالانه FTTx</span><strong>{fttxDelta>0?'+':''}{number(Number(fttxDelta.toFixed(1)))}٪</strong><small>در قیاس با بهار ۱۴۰۴</small></article><article><span>کل مشترکان ثابت · بهار ۱۴۰۵</span><strong>{number(latest.reported_total)}</strong><small>مجموع چهار فناوری</small></article></section><section className="panel"><div className="panel-head"><div><h2>مقایسه فناوری‌های اینترنت ثابت</h2><p>مقادیر پنج فصل به تفکیک فناوری از جدول صفحه ۲۲ گزارش ۵۷ رگولاتوری منتقل شده‌اند؛ تطبیق نهایی با PDF اصلی، شرط انتشار رسمی است.</p></div><div className="controls"><label>فناوری <select value={tech} onChange={e=>{setTech(e.target.value as Tech);setSelected(null)}}><option value="FTTx">فیبر نوری FTTx</option><option value="XDSL">X-DSL</option><option value="TDLTE">TD-LTE</option><option value="WiFi">WiFi</option></select></label><label>نمایش <select value={view} onChange={e=>setView(e.target.value as 'bars'|'table')}><option value="bars">نمودار</option><option value="table">جدول</option></select></label></div></div>{view==='bars'? <div className="bars">{rows.map((r,i)=><button className={'bar-row '+(selected===i?'chosen':'')} key={r.period} onClick={()=>setSelected(i)}><span>{r.period}</span><div className="track"><div className="fill" style={{width:(r[tech]/max*100)+'%'}}/></div><strong>{number(r[tech])}</strong></button>)}</div>:<table><thead><tr><th>دوره</th><th>تعداد مشترکان</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i} onClick={()=>setSelected(i)}><td>{r.period}</td><td>{number(r[tech])}</td></tr>)}</tbody></table>}<div className="info"><span>تغییر سالانه فناوری انتخاب‌شده</span><b>{delta>0?'+':''}{number(Number(delta.toFixed(1)))}٪</b><span>مرجع: گزارش رسمی رگولاتوری</span></div>{selected!==null&&<div className="detail"><button onClick={()=>setSelected(null)} aria-label="بستن">×</button><h3>شناسنامه مشاهده</h3><p>دوره: {rows[selected].period} · فناوری: {tech} · مقدار: {number(rows[selected][tech])} اشتراک</p><p>{source}</p></div>}</section></>}<footer>رادار اینترنت ایران · پیش‌نمایش طراحی و داده · داده‌های پژوهشی فاقد پذیرش نهایی در این نما منتشر نمی‌شوند.</footer></>}</main><RadarAssistant area={area} focus={area==='fixed'?'فناوری انتخابی: '+tech:area==='mobile'?'شاخص منتخب: '+mobileMetric:area==='qos'?'نسل شبکه: '+generation+'، شاخص: '+qosMetric:area==='research'?'دامنه مطالعه: '+domain+'، مطالعه: '+study:area==='command'?'نمای مدیریتی با مقایسه شواهد و برنامه اقدامات S02':'دفتر شواهد؛ فقط فراداده عمومی'}/></div>
}
const el=document.getElementById('root');if(!el)throw Error('Root missing');createRoot(el).render(<React.StrictMode><App/></React.StrictMode>);
