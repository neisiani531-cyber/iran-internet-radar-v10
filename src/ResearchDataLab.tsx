import React,{useEffect,useState} from 'react';
type Tor={date:string;users:number;frac:number};
type Tic={id:string;year:number;quarter:number;rtt:number;plr:number;jitter:number};
type Data={admission:string;tor:{rows:Tor[];expected_missing_date:string};tic:{quarterly:Tic[]};mechanisms:{id:string;name:string;status:string}[]};
const fmt=(n:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}).format(n);
export default function ResearchDataLab(){
const [data,setData]=useState<Data|null>(null),[error,setError]=useState(''),[tab,setTab]=useState<'tor'|'tic'|'mechanisms'>('tor');
useEffect(()=>{const ctrl=new AbortController();fetch(new URL('data/v917-research-exploratory.json',document.baseURI),{signal:ctrl.signal}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then((x:Data)=>{if(x.tor.rows.length!==25||x.tor.rows.some(r=>r.date==='2025-06-27'))throw Error('Research validation failed');setData(x)}).catch(e=>{if(e.name!=='AbortError')setError(String(e))});return()=>ctrl.abort()},[]);
return <section className="panel" dir="rtl"><h2>آزمایشگاه داده‌های پژوهشی V9.17</h2><p style={{border:'1px solid #94753b',padding:12,borderRadius:10}}>داده‌های این بخش پژوهشی و مقدماتی هستند؛ تأیید علمی Q5 ندارند و نباید با شاخص رسمی رگولاتوری یا رابطه علّی قطعی اشتباه گرفته شوند. اطلاعات خصوصی منابع، پیمایش‌ها و دفتر شواهد به این بخش منتقل نشده است.</p>
{error&&<p role="alert">{error}</p>}{!data&&!error&&<p>بارگذاری...</p>}
{data&&<><div className="controls" style={{display:'flex',gap:10,flexWrap:'wrap'}}><button onClick={()=>setTab('tor')}>Tor | ۲۵ مشاهده</button><button onClick={()=>setTab('tic')}>سری فصلی TIC</button><button onClick={()=>setTab('mechanisms')}>۶ سازوکار S01</button></div>
{tab==='tor'&&<><h3>مشاهدات استفاده از Tor در ایران</h3><p>داده ورودی از نسخه V9.17 بازیابی شده است. ستون frac می‌تواند بیشتر از ۱۰۰ باشد و درصدی محدود به ۱۰۰ محسوب نمی‌شود. روز ۲۷ ژوئن ۲۰۲۵ فاقد مشاهده است؛ مقدار مفقود صفر نیست.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>تاریخ</th><th>کاربران گزارش‌شده</th><th>frac</th></tr></thead><tbody>{data.tor.rows.map(x=><tr key={x.date}><td>{x.date}</td><td>{fmt(x.users)}</td><td>{fmt(x.frac)}</td></tr>)}</tbody></table></div></>}
{tab==='tic'&&<><h3>مشاهدات فصلی TIC</h3><p>این سری تا تطبیق با مرجع اصلی TIC، تنها یک پیش‌نمایش پژوهشی است. واحد و روش هر شاخص باید پیش از مقایسه بین گزارش‌ها تأیید شود.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>دوره</th><th>RTT</th><th>PLR</th><th>Jitter</th></tr></thead><tbody>{data.tic.quarterly.map(x=><tr key={x.id}><td>{x.year} / {x.quarter}</td><td>{fmt(x.rtt)}</td><td>{fmt(x.plr)}</td><td>{fmt(x.jitter)}</td></tr>)}</tbody></table></div></>}
{tab==='mechanisms'&&<><h3>سازوکارهای پژوهشی تصمیم‌سازی S01</h3><p>این موارد فرضیه‌های پژوهشی هستند؛ اقدامات مصوب S02 یا استنتاج علّی قطعی نیستند.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12}}>{data.mechanisms.map(x=><article key={x.id} style={{background:'#112d40',borderRadius:12,padding:14}}><strong>{x.id} | {x.name}</strong><p>وضعیت: فرضیه پژوهشی</p></article>)}</div></>}
</>}</section>;

}
