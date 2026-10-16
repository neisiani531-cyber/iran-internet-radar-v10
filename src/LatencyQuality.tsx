import React from 'react';
import data from '../packages/contracts/cra57-latency-quality.snapshot.json';
const fa=(x:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(x);
const names:Record<string,string>={rtt:'زمان رفت‌وبرگشت بسته (RTT)',jitter:'تغییرپذیری تأخیر (Jitter)',fixed:'اینترنت ثابت',mobile:'اینترنت سیار',domestic:'مسیر داخلی',international:'مسیر بین‌الملل'};
export default function LatencyQuality(){
 return <section className="panel"><h2>تأخیر و نوسان شبکه، ثابت و سیار</h2><p>۸ شاخص از صفحه ۱۴ فصلنامه ۵۷، بهار ۱۴۰۵؛ واحد میلی‌ثانیه. این ارقام میانگین شبکه‌اند و به اپراتور مشخص نسبت داده نمی‌شوند.</p>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
 {data.observations.map(x=><article key={x.metric+x.network+x.route} style={{padding:15,border:'1px solid #35566c',borderRadius:12,background:'#0e2839'}}>
 <small>{names[x.metric]} · {names[x.network]} · {names[x.route]}</small><strong style={{display:'block',fontSize:26,marginTop:10,color:'#6be1cc'}}>{fa(x.value)} <small>ms</small></strong></article>)}</div>
 <p>منبع: گزارش آماری ۵۷، صفحه ۱۴. تطبیق لایه متن PDF انجام شده؛ بررسی تصویری کامل و سری زمانی شاخص‌ها هنوز موجود نیست.</p></section>
}