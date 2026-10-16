import React,{useState} from 'react';
import survey from '../packages/contracts/p01-survey-research-preview.json';
import fixed from '../packages/contracts/public-fixed-access.snapshot.json';
import evidence from '../packages/contracts/evidence-metadata-public.json';
import './radar-assistant.css';

type Message={role:'user'|'assistant';content:string};
const titles:Record<string,string>={command:'مرکز فرماندهی',fixed:'اینترنت ثابت و فیبر',mobile:'شبکه سیار و اپراتورها',qos:'کیفیت شبکه',research:'تجربه کاربران',evidence:'اتاق شواهد'};
const endpoint=(import.meta.env.VITE_RADAR_ASSISTANT_API_URL as string|undefined)?.replace(/\/$/,'');
function localSourceAnswer(q:string,page:string){
 const normalized=q.toLocaleLowerCase('fa');
 const selected=survey.observations.find(x=>normalized.includes(x.evidence_id.toLowerCase())||normalized.includes(x.title.slice(0,7)));
 if(selected)return selected.title+': '+new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(selected.value)+' درصد. '+selected.description+' منبع: '+selected.source_label+'، شاهد '+selected.evidence_id+'. این یافته هنوز Q5 ندارد و نباید به نتیجه قطعی کشوری یا رابطه علّی تبدیل شود.';
 if(/فیبر|fttx|xdsl|ثابت/.test(normalized)){
 const last=fixed.observations[fixed.observations.length-1];
 return 'این بخش آمار اشتراک‌های اینترنت ثابت را بر پایه '+fixed.source.publication+' نشان می‌دهد. آخرین دوره ثبت‌شده در این مجموعه '+last.period_label+' است. منظور از اشتراک، تعداد خانوار تحت پوشش یا کیفیت تجربه کاربران نیست. برای عدد مشخص باید شاخص و دوره آن را تعیین کنیم.';
 }
 if(/منبع|سند|از کجا|اعتبار|شاهد/.test(normalized))return 'اطلاعات این صفحه از قراردادهای منبع‌دار رادار استخراج شده‌اند. دفتر عمومی فعلاً '+evidence.observations.length+' شاهد دارد؛ پذیرش علمی نهایی پژوهش‌ها Q5 هنوز صفر است. در اتاق شواهد می‌توان شناسه منبع و وضعیت بررسی هر شاهد را دید. برای پاسخ مستند درباره یک عدد، عنوان همان شاخص را بنویسید.';
 return 'شما در بخش «'+page+'» هستید. می‌توانم در حالت محدود، منشأ برخی شاخص‌های ثبت‌شده را توضیح بدهم؛ اما این حالت یک مدل زبانی عمومی نیست و پاسخ آزاد و استدلالی قابل اتکا ارائه نمی‌کند. برای گفت‌وگوی طبیعی باید سرور امن مدل زبانی پیکربندی شود. سؤال مشخص درباره یک شاخص یا منبع بپرسید.';
}
export default function RadarAssistant({area}:{area:string}){
 const [open,setOpen]=useState(false);
 const [question,setQuestion]=useState('');
 const [busy,setBusy]=useState(false);
 const [messages,setMessages]=useState<Message[]>([{role:'assistant',content:'سلام. من دستیار رادار هستم. می‌توانید درباره شاخص‌های همین صفحه، منشأ اطلاعات و محدودیت تفسیرشان سؤال کنید. پاسخ‌های مبتنی بر مدل زبانی فقط پس از اتصال امن سرور فعال می‌شوند.'}]);
 const send=async()=>{
  const q=question.trim();if(!q||busy)return;
  const history=messages.slice(-8);setQuestion('');setMessages(old=>[...old,{role:'user',content:q}]);setBusy(true);
  let answer='';
  if(endpoint){
   try{
    const response=await fetch(endpoint+'/api/v1/assistant/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,page:area,history})});
    if(!response.ok)throw Error('Assistant service unavailable');
    const payload=await response.json();
    answer=typeof payload.answer==='string'?payload.answer:'پاسخی از سرور دریافت نشد.';
   }catch{answer='ارتباط با سرور دستیار برقرار نشد. '+localSourceAnswer(q,titles[area]||area)}
  }else answer=localSourceAnswer(q,titles[area]||area);
  setMessages(old=>[...old,{role:'assistant',content:answer}]);setBusy(false);
 };
 return <><button id="radar-assistant-toggle" className="ra-fab" onClick={()=>setOpen(x=>!x)} aria-expanded={open} aria-label="گشودن دستیار رادار">✦ دستیار هوشمند</button>
 {open&&<section className="ra-window" dir="rtl" aria-label="دستیار رادار"><div className="ra-header"><div><strong>دستیار رادار</strong><small>زمینه فعلی: {titles[area]||area} · {endpoint?'سرور قابل پیکربندی':'راهنمای محدود، بدون مدل زبانی'}</small></div><button onClick={()=>setOpen(false)} aria-label="بستن">×</button></div>
 <div className="ra-messages" role="log" aria-live="polite">{messages.map((m,i)=><div className={'ra-message '+m.role} key={i}>{m.content}</div>)}{busy&&<p>در حال بررسی پرسش…</p>}</div>
 <form className="ra-form" onSubmit={e=>{e.preventDefault();void send()}}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="این شاخص چیست؟ منبعش کجاست؟" aria-label="پرسش از دستیار"/><button type="submit" disabled={!question.trim()||busy}>ارسال</button></form></section>}</>;
}
