import React,{useEffect,useMemo,useState} from 'react';

type Observation={
 id:string;domain:string;study:string;
 source_id:string|null;evidence_id:string|null;
 period:string|null;construct:string|null;
 reported_value:string|null;unit:string|null;
 population:string|null;method:string|null;
 gate:string|null;comparison_rule:string|null;
 warning:string|null;allow_official_kpi:boolean;
};

type Data={
 publication_status:string;
 live_social_stream_connected:boolean;
 observations:Observation[];
};

export default function SocialIntelligence(){
 const [data,setData]=useState<Data|null>(null);
 const [error,setError]=useState('');
 const [domain,setDomain]=useState('all');
 const [study,setStudy]=useState('all');
 const [selected,setSelected]=useState<string|null>(null);

 useEffect(()=>{
  const controller=new AbortController();
  fetch(new URL('data/social-intelligence-baseline.json',document.baseURI),{
   signal:controller.signal
  })
  .then(r=>{
   if(!r.ok)throw Error('HTTP '+r.status);
   return r.json();
  })
  .then((d:Data)=>setData(d))
  .catch(e=>{
   if(e.name!=='AbortError')setError(String(e));
  });
  return()=>controller.abort();
 },[]);

 const studies=useMemo(()=>
  [...new Set(data?.observations.map(x=>x.study)||[])].sort()
 ,[data]);

 const filtered=useMemo(()=>
  data?.observations.filter(x=>
   (domain==='all'||x.domain===domain)&&
   (study==='all'||x.study===study)
  )||[]
 ,[data,domain,study]);

 const current=filtered.find(x=>x.id===selected);

 return <section dir="rtl" style={{padding:24}}>
  <h1>مرکز تحلیل تجربه کاربران و شبکه‌های اجتماعی</h1>
  <p>
   تحلیل پژوهش‌های موجود درباره رضایت، تجربه اینترنت،
   رفتار کاربران و شبکه‌های اجتماعی.
  </p>

  <p style={{color:'#e3b77a'}}>
   اطلاعات این بخش در وضعیت پیش‌نمایش پژوهشی است.
   هیچ رکوردی به‌عنوان شاخص رسمی ملی تأیید نشده است.
  </p>

  {error&&<p role="alert">{error}</p>}
  {!data&&!error&&<p>در حال بارگذاری داده‌ها...</p>}

  {data&&<>
   <div style={{
    display:'grid',
    gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',
    gap:12,margin:'20px 0'
   }}>
    {[
     ['کل مشاهدات',data.observations.length],
     ['تجربه کاربران',data.observations.filter(x=>x.domain==='experience').length],
     ['رفتار اجتماعی',data.observations.filter(x=>x.domain==='social').length],
     ['مطالعات',studies.length]
    ].map(([label,value])=>
     <div key={String(label)} className="panel" style={{padding:16}}>
      <small>{label}</small>
      <strong style={{display:'block',fontSize:25}}>{value}</strong>
     </div>
    )}
   </div>

   <div className="controls" style={{display:'flex',gap:12,flexWrap:'wrap'}}>
    <label>حوزه
     <select value={domain} onChange={e=>setDomain(e.target.value)}>
      <option value="all">تمام حوزه‌ها</option>
      <option value="experience">تجربه و رضایت</option>
      <option value="social">شبکه‌های اجتماعی</option>
     </select>
    </label>
    <label>مطالعه
     <select value={study} onChange={e=>setStudy(e.target.value)}>
      <option value="all">تمام مطالعات</option>
      {studies.map(x=><option key={x} value={x}>{x}</option>)}
     </select>
    </label>
   </div>

   <p>نمایش {filtered.length} رکورد پژوهشی</p>

   <div style={{overflowX:'auto'}}>
    <table style={{width:'100%'}}>
     <thead><tr>
      <th>مطالعه</th><th>شاخص یا موضوع</th>
      <th>مقدار گزارش‌شده</th><th>دوره</th>
      <th>وضعیت</th><th>جزئیات</th>
     </tr></thead>
     <tbody>{filtered.map(x=><tr key={x.id}>
      <td>{x.study}</td>
      <td>{x.construct}</td>
      <td>{x.reported_value??'فاقد مقدار'} {x.unit}</td>
      <td>{x.period??'نامشخص'}</td>
      <td>{x.gate}</td>
      <td><button type="button" onClick={()=>setSelected(x.id)}>
       بررسی
      </button></td>
     </tr>)}</tbody>
    </table>
   </div>

   {current&&<article className="panel" style={{marginTop:20,padding:20}}>
    <button type="button" onClick={()=>setSelected(null)}>بستن ×</button>
    <h2>شناسنامه پژوهشی: {current.id}</h2>
    <p><b>مطالعه:</b> {current.study}</p>
    <p><b>تعریف:</b> {current.construct}</p>
    <p><b>جامعه و مخرج:</b> {current.population||'ثبت نشده'}</p>
    <p><b>روش:</b> {current.method||'ثبت نشده'}</p>
    <p><b>منبع:</b> {current.source_id||'ثبت نشده'}</p>
    <p><b>شاهد:</b> {current.evidence_id||'ثبت نشده'}</p>
    <p><b>مانع پذیرش:</b> {current.gate}</p>
    <p><b>محدودیت مقایسه:</b> {current.comparison_rule}</p>
    <p><b>هشدار تفسیری:</b> {current.warning}</p>
   </article>}
  </>}
 </section>;
}
