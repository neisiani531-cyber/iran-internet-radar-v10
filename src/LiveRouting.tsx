import React,{useEffect,useState} from 'react';
type Event={kind:string;prefix:string;origin_asn:number|null;peer_asn:number|null;observed_at:string;source:string};
type Status={mode:string;enabled:boolean;connected:boolean;last_message_at:string|null;event_count:number;source:string;limitations:string};
type Payload={data:Event[];mode:string;connected:boolean};
const configured=(import.meta as unknown as {env:{VITE_RADAR_LIVE_API_URL?:string}}).env.VITE_RADAR_LIVE_API_URL?.trim();
const url=configured?.replace(/\/$/,'');
export default function LiveRouting(){
const [status,setStatus]=useState<Status|null>(null),[records,setRecords]=useState<Event[]>([]),[error,setError]=useState(''),[updated,setUpdated]=useState('');
useEffect(()=>{
 if(!url)return;
 const controller=new AbortController();
 const update=async()=>{try{
 const [s,e]=await Promise.all([fetch(url+'/api/v1/live/status',{signal:controller.signal}),fetch(url+'/api/v1/live/events?limit=35',{signal:controller.signal})]);
 if(!s.ok||!e.ok)throw Error('HTTP '+s.status+'/'+e.status);
 const info=await s.json() as Status;const data=await e.json() as Payload;
 if(!controller.signal.aborted){setStatus(info);setRecords(data.data);setUpdated(new Date().toLocaleTimeString('fa-IR'));setError('');}
 }catch(e){if(!controller.signal.aborted){setError(String(e));setStatus(null);setRecords([])}}};
 void update();const timer=setInterval(()=>void update(),30000);return()=>{controller.abort();clearInterval(timer)};
},[]);
return <section className="panel" dir="rtl"><h1>رصد زنده تغییرات مسیریابی اینترنت ایران</h1>
<p>این بخش صرفاً رویدادهای واقعی BGP از RIPE RIS Live را نمایش می‌دهد. از این داده‌ها به‌تنهایی نمی‌توان کیفیت استان‌ها، اختلال DNS، تأخیر کاربران یا سلامت ملی شبکه را نتیجه گرفت.</p>
<div style={{padding:16,borderRadius:12,background:'#102c3e',border:'1px solid #356078',margin:'18px 0'}}>
<strong>وضعیت دریافت:</strong> {!url?'سرویس زنده برای سایت تنظیم نشده است':error?'عدم دسترسی به سرور':!status?'در حال بررسی':!status.enabled?'دریافت RIS غیرفعال است':status.connected?'متصل به RIS':'قطع / در انتظار اتصال'}
<p>منبع: RIPE RIS Live | آخرین رویداد دریافت‌شده: {status?.last_message_at??'موجود نیست'} | آخرین بازخوانی رابط: {updated||'انجام نشده'}</p>
{error&&<p role="alert">خطا: {error}</p>}
</div>
{!url&&<p>این سایت در GitHub Pages به‌صورت ایستا منتشر شده است. برای فعال‌سازی پایش واقعی، Backend باید جداگانه مستقر شود و نشانی آن در VITE_RADAR_LIVE_API_URL تنظیم شود. در این وضعیت عدد ساختگی نمایش داده نمی‌شود.</p>}
{status?.enabled&&!status.connected&&<p>اتصال فعال نیست؛ رویدادهای ذخیره‌شده، در صورت وجود، نباید رویداد زنده جاری تلقی شوند.</p>}
<h2>آخرین رویدادهای مشاهده‌شده ({records.length})</h2>
{records.length?<div style={{maxHeight:540,overflow:'auto'}}><table><thead><tr><th>زمان دریافت</th><th>نوع</th><th>پیشوند IP</th><th>ASN مبدأ</th><th>جمع‌آورنده / Peer</th></tr></thead><tbody>{records.map((x,i)=><tr key={i}><td>{x.observed_at}</td><td>{x.kind==='withdrawal'?'Withdrawal':'Announcement'}</td><td dir="ltr">{x.prefix}</td><td>{x.origin_asn??'نامشخص'}</td><td>{x.peer_asn??'نامشخص'}</td></tr>)}</tbody></table></div>:<p>رویداد تأییدشده برای نمایش موجود نیست. مقدار صفر به معنی پایداری شبکه نیست.</p>}
</section>;
