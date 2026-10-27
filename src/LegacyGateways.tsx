import React,{useState} from 'react';
type Result={title:string;items:[string,string][]};
const fmt=(value:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:6}).format(value);
export default function LegacyGateways(){
 const [measurement,setMeasurement]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<Result|null>(null);
 async function load(kind:'ripe'|'stock'){
  setError('');setResult(null);
  if(kind==='ripe'&&!/^[1-9]\d{0,11}$/.test(measurement)){setError('شناسه اندازه‌گیری باید عدد صحیح معتبر باشد.');return;}
  setPending(true);
  try{
   const response=await fetch(kind==='ripe'?'/api/ripe?measurement='+encodeURIComponent(measurement):'/api/stock?symbol='+encodeURIComponent('همراه'),{signal:AbortSignal.timeout(16000)});
   if(!response.ok)throw Error('gateway');const data=await response.json();if(!data.ok)throw Error('gateway');
   if(kind==='ripe'){
    if(![data.median_rtt_ms,data.packet_loss_pct,data.probe_count,data.latest_timestamp].every(value=>typeof value==='number'&&Number.isFinite(value)))throw Error('contract');
    setResult({title:'نتیجه اندازه‌گیری بیرونی RIPE Atlas',items:[['میانه RTT',fmt(data.median_rtt_ms)+' ms'],['اتلاف بسته',fmt(data.packet_loss_pct)+'٪'],['تعداد پروب',fmt(data.probe_count)],['زمان مشاهده UTC',new Date(data.latest_timestamp*1000).toISOString()]]});
   }else{
    if(![data.last_price_irr,data.change_percent].every(value=>typeof value==='number'&&Number.isFinite(value)))throw Error('contract');
    setResult({title:'قیمت دریافت‌شده نماد همراه',items:[['قیمت',fmt(data.last_price_irr)+' ریال'],['تغییر روزانه',fmt(data.change_percent)+'٪'],['تاریخ و ساعت منبع',String(data.date||'نامشخص')+' '+String(data.time||'')]]});
   }
  }catch{setError('درگاه سرور متصل نیست یا پاسخ معتبر نداد؛ داده برخط نمایش داده نمی‌شود.');}finally{setPending(false);}
 }
 return <section className="archive-tools"><p className="archive-admission">این ابزارها همان درگاه‌های سرور نسخه مرجع را فراخوانی می‌کنند. بسته ایستا، داده برخط یا کلید API ندارد. دریافت داده با انتخاب شما آغاز می‌شود.</p><section className="tc-panel"><h2>اندازه‌گیری RIPE Atlas</h2><div className="archive-filters"><label>شناسه اندازه‌گیری <input value={measurement} onChange={event=>setMeasurement(event.target.value)} inputMode="numeric"/></label><button disabled={pending} onClick={()=>load('ripe')}>دریافت اندازه‌گیری</button></div><p>دامنه نتیجه همان پروب‌ها و دوره اندازه‌گیری است؛ امتیاز ملی یا استانی محسوب نمی‌شود.</p></section><section className="tc-panel"><h2>درگاه قیمت نماد همراه</h2><button type="button" disabled={pending} onClick={()=>load('stock')}>دریافت قیمت از درگاه سرور</button><p>اعداد تاریخی یا فرضی جایگزین قیمت جاری نمی‌شوند.</p></section>{pending&&<p role="status">در حال دریافت پاسخ درگاه…</p>}{error&&<p role="alert">{error}</p>}{result&&<section className="tc-panel"><h2>{result.title}</h2><dl className="archive-record-fields">{result.items.map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></section>}</section>;
}
