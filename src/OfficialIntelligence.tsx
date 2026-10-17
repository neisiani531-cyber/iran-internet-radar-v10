import React,{useEffect,useMemo,useState} from 'react';

type Metric={
 id:string;group:string;label:string;value:number;
 unit:string;period:string;page:number;status:string
};
type Catalog={
 total:number;admission:string;
 groups:Record<string,number>;
 observations:Metric[]
};

const fa=(v:number)=>new Intl.NumberFormat('fa-IR',{
 maximumFractionDigits:2
}).format(v);

const names:Record<string,string>={
 mobile:'شبکه سیار',fixed:'اینترنت ثابت',
 overview:'شاخص‌های کلان',services:'خدمات ارتباطی',
 quality:'کیفیت شبکه',reach:'دسترسی و پوشش',
 citizen:'خدمات شهروندی',other:'سایر'
};

export default function OfficialIntelligence({
 onNavigate
}:{onNavigate:(area:'catalog')=>void}){
 const [data,setData]=useState<Catalog|null>(null);
 const [error,setError]=useState('');
 const [group,setGroup]=useState('all');

 useEffect(()=>{
  const c=new AbortController();
  fetch(new URL('data/v917-official-catalog.json',document.baseURI),{
   signal:c.signal
  })
  .then(r=>{
   if(!r.ok)throw Error(`HTTP ${r.status}`);
   return r.json();
  })
  .then((d:Catalog)=>{
   if(d.total!==130||d.observations.length!==130||
      new Set(d.observations.map(x=>x.id)).size!==130)
    throw Error('موجودی ۱۳۰ شاخص با قرارداد مطابقت ندارد');
   setData(d);
  })
  .catch(e=>{
   if(e.name!=='AbortError')setError(String(e));
  });
  return()=>c.abort();
 },[]);

 const rows=useMemo(()=>data?.observations.filter(
  x=>group==='all'||x.group===group
 )||[],[data,group]);

 const periods=[...new Set(rows.map(x=>x.period))].sort();

 const fiber=useMemo(()=>(
  data?.observations.filter(x=>
   x.group==='fixed'&&x.id.startsWith('CRA57-FIBER-COV-')
  ).sort((a,b)=>a.period.localeCompare(b.period))||[]
 ),[data]);

 const maxFiber=Math.max(1,...fiber.map(x=>x.value));
 const first=fiber[0],last=fiber[fiber.length-1];
 const change=first&&last&&first.value>0?
  (last.value/first.value-1)*100:null;

 const surface:React.CSSProperties={
  padding:18,borderRadius:15,
  border:'1px solid #35546b',
  background:'#10283a'
 };

 return <section dir="rtl" style={{
  margin:'24px 0',padding:24,
  border:'1px solid #35566d',borderRadius:20,
  background:'linear-gradient(140deg,#0b2030,#112f42)',
  color:'#eaf5fb'
 }}>
  <small style={{color:'#72e6d1'}}>OFFICIAL DATA INTELLIGENCE</small>
  <h2>تصویر ساختاری ۱۳۰ شاخص رگولاتوری</h2>
  <p style={{color:'#b6cfdd'}}>
   تحلیل موجودی داده‌های فصلنامه ۵۷، روند پوشش فیبر
   و دسترسی مستقیم به شناسنامه شاخص‌ها
  </p>

  {error&&<p role="alert">بارگذاری ناموفق: {error}</p>}
  {!data&&!error&&<p>در حال بارگذاری شاخص‌های رسمی...</p>}

  {data&&<>
   <div style={{
    display:'grid',
    gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
    gap:12,margin:'22px 0'
   }}>
    <div style={surface}>
     <small>شاخص‌های موجود</small>
     <strong style={{display:'block',fontSize:26}}>{fa(data.total)}</strong>
    </div>
    <div style={surface}>
     <small>گروه‌های موضوعی</small>
     <strong style={{display:'block',fontSize:26}}>
      {fa(Object.keys(data.groups).length)}
     </strong>
    </div>
    <div style={surface}>
     <small>دوره‌های ثبت‌شده در کاتالوگ</small>
     <strong style={{display:'block',fontSize:26}}>
      {fa(new Set(data.observations.map(x=>x.period)).size)}
     </strong>
    </div>
   </div>


   <div style={{
    display:'grid',
    gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',
    gap:12,margin:'18px 0'
   }}>
    <article style={surface}>
     <strong>موجودی مستند</strong>
     <p>{fa(data.observations.filter(x=>
      Number.isFinite(x.value)&&Boolean(x.unit)&&
      Boolean(x.period)&&Number.isFinite(x.page)
     ).length)} رکورد دارای مقدار، واحد، دوره و صفحه منبع</p>
    </article>
    <article style={surface}>
     <strong>کنترل نهایی منبع</strong>
     <p>تطبیق تصویری ۱۳۰ رکورد با صفحات اصلی گزارش
      هنوز به‌صورت کامل تأیید نشده است.</p>
    </article>
    <article style={surface}>
     <strong>قابلیت تحلیل زمانی</strong>
     <p>سری‌های تاریخی اپراتورها، اینترنت ثابت و پوشش فیبر
      در قراردادهای تخصصی نگهداری می‌شوند؛
      از کاتالوگ مقطعی روند مصنوعی تولید نمی‌شود.</p>
    </article>
   </div>
   <h3>ترکیب شاخص‌ها بر اساس حوزه</h3>
   <div style={{display:'flex',flexWrap:'wrap',gap:9}}>
    <button type="button" onClick={()=>setGroup('all')}
     aria-pressed={group==='all'}>همه حوزه‌ها</button>
    {Object.entries(data.groups).map(([key,count])=>
     <button type="button" key={key}
      aria-pressed={group===key}
      onClick={()=>setGroup(key)}>
      {names[key]||key} · {fa(count)}
     </button>
    )}
   </div>
   <p style={{color:'#b6cfdd'}}>
    حوزه انتخابی: {group==='all'?'تمام حوزه‌ها':names[group]||group}
    {' '} | {fa(rows.length)} رکورد | {fa(periods.length)} دوره متمایز
   </p>
   <p style={{fontSize:12,color:'#b6cfdd'}}>
    تعداد دوره‌های موجود، به معنای وجود سری زمانی
    کامل برای تمام شاخص‌های آن حوزه نیست.
   </p>

   {fiber.length>=2&&<>
    <h3 style={{marginTop:28}}>روند پوشش خانوارهای فیبر نوری</h3>
    <p style={{color:'#b6cfdd'}}>
     {fa(fiber.length)} دوره هم‌تعریف از کاتالوگ موجود.
     پوشش با تعداد اشتراک فعال متفاوت است.
    </p>
    <div style={surface}>
     {fiber.map(x=><div key={x.id} style={{
      display:'grid',
      gridTemplateColumns:'85px 1fr 145px',
      gap:10,alignItems:'center',marginBottom:10
     }}>
      <small>{x.period}</small>
      <div style={{background:'#233b4b',height:12,borderRadius:6}}>
       <div style={{
        height:'100%',borderRadius:6,
        width:(x.value/maxFiber*100)+'%',
        background:'#60dcca'
       }}/>
      </div>
      <strong style={{textAlign:'left'}}>{fa(x.value)}</strong>
     </div>)}
     <p style={{color:'#c5d9e4'}}>
      تغییر بین اولین و آخرین دوره:
      {' '}{change===null?'فاقد مبنای معتبر':
       (change>=0?'+':'')+fa(change)+'٪'}
     </p>
    </div>
   </>}

   <p style={{fontSize:12,color:'#b6cfdd',marginTop:18}}>
    منبع: فصلنامه آماری ۵۷ رگولاتوری و آرشیو V9.17.
    اعتبارسنجی ساختاری با پذیرش نهایی اعداد یکسان نیست.
    تطبیق تصویری صفحات گزارش هنوز لازم است.
   </p>
   <button type="button" onClick={()=>onNavigate('catalog')}>
    ورود به کاوشگر کامل ۱۳۰ شاخص ←
   </button>
  </>}
 </section>;
}
