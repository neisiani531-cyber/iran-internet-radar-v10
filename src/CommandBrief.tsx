import React from 'react';
import fixed from '../packages/contracts/public-fixed-access.snapshot.json';
import latency from '../packages/contracts/cra57-latency-quality.snapshot.json';
import survey from '../packages/contracts/p01-survey-research-preview.json';
const fa=(n:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(n);
export default function CommandBrief({onNavigate}:{onNavigate:(d:'fixed'|'qos'|'research')=>void}){
 const first=fixed.observations[0].technology_values.FTTx,last=fixed.observations[fixed.observations.length-1].technology_values.FTTx;
 const rtt=(route:string)=>latency.observations.find(r=>r.metric==='rtt'&&r.network==='fixed'&&r.route===route)!.value;
 const response=survey.observations.find(r=>r.evidence_id==='EV-P01-002')!;
 const findings=[
  {id:'fiber',label:'دسترسی · توسعهٔ فیبر',value:(last/first-1)*100,unit:'٪ رشد سالانهٔ اشتراک FTTx',detail:'از '+fa(first/1e6)+' به '+fa(last/1e6)+' میلیون اشتراک',period:'بهار ۱۴۰۴ تا بهار ۱۴۰۵',status:'CRA57 · کنترل تصویری باقی است',action:'تحلیل دسترسی',destination:'fixed' as const},
  {id:'latency',label:'کیفیت · فاصلهٔ مسیرها',value:rtt('international')/rtt('domestic'),unit:'برابر · RTT خارجی به داخلیِ ثابت',detail:fa(rtt('international'))+' در برابر '+fa(rtt('domestic'))+' میلی‌ثانیه',period:'بهار ۱۴۰۵ · شاخص تجمیعی',status:'CRA57 · بدون انتساب علت یا هدف SLA',action:'تحلیل کیفیت',destination:'qos' as const},
  {id:'experience',label:'تجربه · پاسخ به پیمایش',value:response.value,unit:'٪ پاسخ‌دهندگان: ارزیابی ضعیف سرعت',detail:'پاسخ ذهنی؛ سنجهٔ سرعت شبکه نیست',period:'دورهٔ پیمایش طبق گزارش ملت ۲۱۹۲۱',status:'پژوهشی · تأیید نهایی Q5 انجام نشده',action:'شناسنامهٔ پیمایش',destination:'research' as const}
 ];
 return <section className="command-brief" aria-label="یافته‌های منتخب برای بررسی"><div className="brief-caption"><h2>نمای تصمیم · دسترسی، کیفیت، تجربه</h2><span>سه سنجهٔ مستقل؛ امتیاز مرکب یا نتیجه‌گیری علّی نیست</span></div><div className="brief-grid">{findings.map((f,i)=><article className={'brief-card brief-'+f.id} key={f.id} data-finding={f.id}><div className="brief-card-top"><span>{fa(i+1)} / {f.label}</span><small>{f.period}</small></div><div className="brief-number"><strong>{fa(f.value)}</strong><span>{f.unit}</span></div><div className="brief-bottom"><span>{f.detail}<small>{f.status}</small></span><button onClick={()=>onNavigate(f.destination)}>{f.action} ←</button></div></article>)}</div></section>;
}
