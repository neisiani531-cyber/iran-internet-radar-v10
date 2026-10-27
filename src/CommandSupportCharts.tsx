import React from 'react';
import fixed from '../packages/contracts/public-fixed-access.snapshot.json';
import survey from '../packages/contracts/p01-survey-research-preview.json';
import AnalyticsChart,{ChartData} from './AnalyticsChart';
import PanelExpandButton from './PanelExpandButton';
const fa=(n:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(n);
export default function CommandSupportCharts({onNavigate}:{onNavigate:(d:'fixed'|'research')=>void}){
 const techs=['XDSL','FTTx','TDLTE','WiFi'] as const,rows=fixed.observations,current=rows[rows.length-1];
 const data:ChartData={series:techs.map(t=>rows.map(r=>r.technology_values[t])),labels:[...techs],categories:rows.map(r=>r.period_label),unit:'اشتراک'};
 return <div className="exec-support-grid">
 <section className="tc-panel exec-support-card"><div className="tc-heading"><div><span className="tc-eyebrow">FIXED ACCESS · TREND</span><h2>مسیر فناوری‌های اینترنت ثابت</h2></div><div className="tc-panel-actions"><button className="tc-link" onClick={()=>onNavigate('fixed')}>جزئیات ←</button><PanelExpandButton title="مسیر فناوری‌های اینترنت ثابت"/></div></div><div className="exec-support-chart"><AnalyticsChart compact data={data} mode="area" title="مسیر فناوری‌های اینترنت ثابت"/></div><p className="exec-source">بهار ۱۴۰۴ تا بهار ۱۴۰۵ · CRA57، صفحهٔ ۲۲ · کنترل تصویری باقی است</p></section>
 <section className="tc-panel exec-support-card exec-experience"><div className="tc-heading"><div><span className="tc-eyebrow">USER EXPERIENCE · RESEARCH</span><h2>کاربر چه تجربه‌ای گزارش می‌کند؟</h2></div><div className="tc-panel-actions"><button className="tc-link" onClick={()=>onNavigate('research')}>پیمایش ←</button><PanelExpandButton title="تجربهٔ گزارش‌شده کاربران"/></div></div><div className="exec-survey-bars">{survey.observations.slice(0,2).map(r=><div className="exec-survey-item" key={r.evidence_id}><div><span>{r.title}</span><strong>{fa(r.value)}٪</strong></div><div className="exec-survey-track" role="img" aria-label={r.title+'؛ '+fa(r.value)+' درصد؛ مقیاس صفر تا صد'}><i style={{width:r.value+'%'}}/></div><small>{r.evidence_id==='EV-P01-002'?'پاسخ به پرسش سرعت؛ ارزیابی ذهنی':'پاسخ به پرسش قیمت بسته؛ دو گزینهٔ رضایت پایین'}</small></div>)}</div><p className="exec-source exec-research-status">ملت ۲۱۹۲۱ · پرسش‌های مستقل · تأیید Q5 انجام نشده؛ شاخص رسمی ملی نیست</p></section>
 <section className="tc-panel exec-support-card"><div className="tc-heading"><div><span className="tc-eyebrow">FIXED ACCESS · COMPOSITION</span><h2>ترکیب فناوری‌های اینترنت ثابت</h2></div><PanelExpandButton title="ترکیب فعلی فناوری‌های ثابت"/></div><div className="exec-support-chart"><AnalyticsChart data={{...data,series:techs.map(t=>[current.technology_values[t]]),categories:['بهار ۱۴۰۵']}} mode="donut" title="ترکیب فناوری‌های اینترنت ثابت در بهار ۱۴۰۵"/></div><p className="exec-source">بهار ۱۴۰۵ · سهم از اشتراک چهار فناوری؛ نه سهم از جمعیت یا رضایت</p></section>
 </div>;
}
