import React,{useEffect,useState} from 'react';

const groups=[
 ['subscribers','مشترکان'],
 ['infrastructure','زیرساخت'],
 ['coverage','پوشش'],
 ['quality','کیفیت'],
 ['services','خدمات تکمیلی']
];

const names:Record<string,string>={
 MCI:'همراه اول',MTN:'ایرانسل',RIGHTEL:'رایتل'
};

const labels:Record<string,string>={
 active:'اشتراک فعال',
 sites4g:'سایت‌های 4G',sites5g:'سایت‌های 5G',
 coverage3g:'پوشش جمعیتی 3G',
 coverage4g:'پوشش جمعیتی 4G',
 roadKm:'پوشش جاده‌ای',villages:'پوشش روستاها',
 cities4g:'شهرهای 4G',
 ping3g:'سرعت دانلود 3G',ping4g:'سرعت دانلود 4G',
 success3g:'موفقیت سرویس 3G',success4g:'موفقیت سرویس 4G',
 drop3g:'قطعی سرویس 3G',drop4g:'قطعی سرویس 4G',
 m2m:'اشتراک M2M',
 roamingCountries:'کشورهای رومینگ',
 roamingOperators:'اپراتورهای رومینگ'
};

type Obs={value:number;page:number;source_id:string};
type Metric={
 key:string;category:string;unit:string;period:string;
 operators:Record<string,Obs>
};
type Data={admission:string;operators:string[];metrics:Metric[]};

export default function OperatorComparison(){
 const [data,setData]=useState<Data|null>(null);
 const [error,setError]=useState('');
 const [group,setGroup]=useState('subscribers');
 const [key,setKey]=useState('active');

 useEffect(()=>{
  fetch(new URL('data/cra57-operator-comparison.json',document.baseURI))
   .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
   .then(d=>{
    if(d.metrics?.length!==17)throw Error('Invalid data');
    setData(d);
   })
   .catch(e=>setError(String(e)));
 },[]);

 const available=data?.metrics.filter(m=>m.category===group)||[];
 const metric=available.find(m=>m.key===key)||available[0];
 const maximum=metric?Math.max(
  1,...data!.operators.map(c=>metric.operators[c].value)
 ):1;
 const fmt=(v:number)=>new Intl.NumberFormat('fa-IR',{
  maximumFractionDigits:2
 }).format(v);

 return <section className="panel" dir="rtl">
  <h2>مرکز مقایسه عملکرد اپراتورها</h2>
  <p>مقایسه ۱۷ شاخص رسمی سه اپراتور در بهار ۱۴۰۵</p>
  {error&&<p role="alert">{error}</p>}
  {!data&&!error&&<p>در حال بارگذاری...</p>}
  {data&&<>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'16px 0'}}>
    {groups.map(([id,title])=>
     <button key={id} type="button"
      aria-pressed={group===id}
      onClick={()=>{setGroup(id);setKey('');}}
      style={{
       background:group===id?'#246780':'#10293a',
       color:'white',padding:'10px 16px',borderRadius:9
      }}>{title}</button>
    )}
   </div>
   <label>شاخص
    <select value={metric?.key||''}
     onChange={e=>setKey(e.target.value)}>
     {available.map(m=><option key={m.key} value={m.key}>
      {labels[m.key]||m.key}
     </option>)}
    </select>
   </label>
   {metric&&<>
    <h3>{labels[metric.key]||metric.key}</h3>
    <p>دوره: {metric.period} | واحد: {metric.unit}</p>
    <div className="bars">
     {data.operators.map(c=>{
      const o=metric.operators[c];
      return <div className="bar-row" key={c}>
       <span>{names[c]}</span>
       <div className="track"><div className="fill"
        style={{width:(o.value/maximum*100)+'%'}}/></div>
       <strong>{fmt(o.value)} {metric.unit}</strong>
      </div>;
     })}
    </div>
    <p>منبع: فصلنامه ۵۷ رگولاتوری |
     صفحات: {data.operators.map(c=>metric.operators[c].page).join('، ')}</p>
    <p>وضعیت: {data.admission} |
     تطبیق تصویری نهایی هنوز انجام نشده است.</p>
   </>}
  </>}
 </section>;
}
