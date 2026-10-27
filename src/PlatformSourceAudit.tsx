import React from 'react';
import supplement from './platform-report-supplement.json';
import report from './platform-report-complete.json';
import PanelExpandButton from './PanelExpandButton';
const names:Record<string,string>={RUBIKA:'روبیکا',EITAA:'ایتا',BALE:'بله',SOROUSH:'سروش‌پلاس',VIRASTY:'ویراستی'};
const fa=(n:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(n);
export function conditionalAudit(){
 return ['BALE','VIRASTY','SOROUSH'].flatMap(platform=>{
  const format=report.records.filter(r=>r.platform===platform&&r.section==='formats');
  return report.records.filter(r=>r.platform===platform&&r.section==='conditional').map(r=>{
   const audience=r.metric.includes('بازدید')||r.metric.includes('ضریب نفوذ'),analysis=r.metric.startsWith('تحلیل');
   const part=format.slice(audience?3:0,audience?6:3),denominator=part[0].value+part[1].value;
   const derived=100*part[analysis?1:0].value/denominator;
   // Published inputs rounded to 0.1 percentage point; include their rounding intervals.
   const x=part[analysis?1:0].value,y=part[analysis?0:1].value;
   const low=100*(x-.05)/(x-.05+y+.05),high=100*(x+.05)/(x+.05+y-.05);
   return {id:r.id,platform,metric:r.metric,published:r.value,derived,denominator,low,high,consistent:r.value+.05>=low&&r.value-.05<=high};
  });
 });
}
export default function PlatformSourceAudit({selected}:{selected:string}){
 const rows=supplement.records.filter(r=>selected==='all'||r.platform===selected);
 const audit=conditionalAudit().filter(r=>selected==='all'||r.platform===selected);
 return <section aria-label="جزئیات تکمیلی و ممیزی منابع"><h3>۱۷ رقم تکمیلی از گزارش نشست · منبع مستقل از متن برنا</h3><p>این اعداد از گزارش آنا درباره همان نشست آمده‌اند؛ به ۱۰۸ رکورد متن برنا افزوده یا با آن‌ها ادغام نشده‌اند. جامعه و دورهٔ دقیق هر زیرشاخص در خبر کامل نیست. مقایسه با کل محتوای سکو یا دادهٔ کاربر فعال مجاز نیست.</p>
 <div className="messaging-services">{Object.keys(names).filter(p=>(selected==='all'||selected===p)&&rows.some(r=>r.platform===p)).map(p=>{const topics=[...new Set(rows.filter(r=>r.platform===p).map(r=>r.topic))];return <article className="tc-panel messaging-card" key={p}><div className="messaging-card-head"><h3>{names[p]} · جزئیات موضوعی</h3><PanelExpandButton title={names[p]+' · جزئیات موضوعی'}/></div><div className="report-table-scroll"><table><thead><tr><th>موضوع</th><th>محتوا</th><th>{p==='VIRASTY'?'ضریب نفوذ':'بازدید'}</th></tr></thead><tbody>{topics.map(topic=><tr key={topic}><th>{topic}</th>{['سهم محتوا',p==='VIRASTY'?'سهم ضریب نفوذ':'سهم بازدید'].map(metric=>{const r=rows.find(r=>r.platform===p&&r.topic===topic&&r.metric===metric);return <td key={metric} data-supplement-record={r?.id}>{r?(r.approx?'حدود ':'')+fa(r.value)+'٪':'گزارش نشده'}</td>;})}</tr>)}</tbody></table></div><p>منبع: آنا ۱۰۹۲۴۳۲ · گزارش نشست، در انتظار تطبیق با اصل</p></article>;})}</div>
 <details><summary>جدول محاسبه و کنترل مخرج خبر / تحلیل</summary><p>محاسبه از درصدهای گرد‌شده است. بازهٔ پذیرش با فرض گرد کردن ورودی‌ها به یک رقم اعشار محاسبه می‌شود؛ فاصلهٔ اطمینان آماری نیست.</p><div className="report-table-scroll"><table><thead><tr><th>سکو / شاخص</th><th>منتشرشده</th><th>محاسبه از پایه‌ها</th><th>مجموع پایه‌ها</th><th>کنترل گرد کردن</th></tr></thead><tbody>{audit.map(r=><tr key={r.id} data-ratio-audit={r.id}><th>{names[r.platform]} · {r.metric}</th><td>{fa(r.published)}٪</td><td>{fa(r.derived)}٪</td><td>{fa(r.denominator)}٪</td><td>{r.consistent?'سازگار با گرد کردن':'ناسازگار؛ بررسی منبع لازم است'}</td></tr>)}</tbody></table></div></details>
 <h3>اختلاف نقل منابع</h3><div className="messaging-services">{supplement.discrepancies.filter(r=>selected==='all'||r.id.startsWith(selected)).map(r=><article className="tc-panel messaging-card" key={r.id}><h4>{r.label}</h4>{r.claims.map(c=><p key={c.source}>{c.source}: {fa(c.value)} {c.unit}</p>)}<p>{r.resolution}</p></article>)}</div>
 <details><summary>شناسنامهٔ ۱۷ رکورد تکمیلی</summary>{rows.map(r=><p key={r.id}>{r.id} · {names[r.platform]} · {r.topic} · {r.metric}: {fa(r.value)}٪ · {r.period} · {r.status}</p>)}</details>
 <p>{supplement.sources.map(s=><React.Fragment key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a> · </React.Fragment>)}</p>
 <button className="report-export" onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({supplement,conditionalAudit:conditionalAudit()},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='platform-source-audit.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>دریافت رکوردهای تکمیلی و ممیزی محاسبات</button>
 </section>;
}
