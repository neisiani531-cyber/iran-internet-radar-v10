import React, {useEffect,useMemo,useState} from 'react';

type Metric = {id:string;group:string;label:string;en?:string;value:number;unit:string;period:string;page:number;source:string;status:string;denominator?:string;method?:string;note?:string};
type Catalog = {total:number;admission:string;groups:Record<string,number>;observations:Metric[]};
const groupFa:Record<string,string>={mobile:'شبکه سیار',fixed:'اینترنت ثابت',overview:'شاخص‌های کلان',services:'خدمات',other:'سایر',quality:'کیفیت شبکه',reach:'دسترسی و پوشش',citizen:'خدمات شهروندی'};
const number=(x:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}).format(x);
export default function OfficialCatalog(){
  const [data,setData]=useState<Catalog|null>(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[group,setGroup]=useState('all'),[period,setPeriod]=useState('all'),[selected,setSelected]=useState<Metric|null>(null);
  useEffect(()=>{const controller=new AbortController();fetch(new URL('data/v917-official-catalog.json', document.baseURI).toString(),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then((r:Catalog)=>{if(r.total!==130||r.observations.length!==130||new Set(r.observations.map(x=>x.id)).size!==130)throw Error('Catalog integrity failed');setData(r)}).catch(e=>{if(e.name!=='AbortError')setError(String(e))});return()=>controller.abort()},[]);
  const periods=useMemo(()=>[...new Set(data?.observations.map(x=>x.period)||[])].sort(),[data]);
  const rows=useMemo(()=>data?.observations.filter(x=>(group==='all'||x.group===group)&&(period==='all'||x.period===period)&&(!query||[x.label,x.en,x.id,x.unit].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())))||[],[data,query,group,period]);
  return <section className="panel" dir="rtl" style={{marginTop:20}}>
    <h2>کاوشگر شاخص‌های رسمی فصلنامه ۵۷</h2>
    <p>موجودی ۱۳۰ شاخص نسخه V9.17، بدون حذف رکورد و با شناسه، دوره، واحد و صفحه مرجع. اعداد نسخه پیش‌نویس استخراج‌شده‌اند و تأیید نهایی تطبیق بصری با صفحات گزارش هنوز انجام نشده است.</p>
    {error&&<p role="alert">خطا در بارگذاری داده: {error}</p>}
    {!data&&!error&&<p>در حال بارگذاری فهرست...</p>}
    {data&&<><div className="controls" style={{display:'flex',flexWrap:'wrap',gap:12,marginBottom:16}}>
      <label>جست‌وجو <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="عنوان یا شناسه شاخص" aria-label="جست‌وجوی شاخص" /></label>
      <label>گروه <select value={group} onChange={e=>setGroup(e.target.value)}><option value="all">همه گروه‌ها</option>{Object.keys(data.groups).map(g=><option key={g} value={g}>{groupFa[g]||g} ({number(data.groups[g])})</option>)}</select></label>
      <label>دوره <select value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">تمام دوره‌ها</option>{periods.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
    </div><p role="status">{number(rows.length)} شاخص از {number(data.total)} رکورد رسمی</p>
    <div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>شاخص</th><th>مقدار</th><th>واحد</th><th>دوره</th><th>صفحه</th><th>جزئیات</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.label}<small style={{display:'block',opacity:.65}}>{x.id}</small></td><td>{number(x.value)}</td><td>{x.unit}</td><td>{x.period}</td><td>{number(x.page)}</td><td><button type="button" onClick={()=>setSelected(x)}>شناسنامه</button></td></tr>)}</tbody></table></div>
    {selected&&<div className="detail" style={{marginTop:20,padding:16,border:'1px solid #557184',borderRadius:12}}><button onClick={()=>setSelected(null)} style={{float:'left'}}>بستن ×</button><h3>{selected.label}</h3><p>شناسه: {selected.id} | مقدار: {number(selected.value)} {selected.unit}</p><p>دوره: {selected.period} | منبع: فصلنامه ۵۷ رگولاتوری، صفحه {number(selected.page)}</p><p>تعریف مخرج: {selected.denominator||'ثبت نشده'}</p><p>روش: {selected.method||'ثبت نشده'}</p><p>وضعیت منبع: {selected.status} | تطبیق تصویری نهایی: انجام‌نشده</p>{selected.note&&<p>{selected.note}</p>}</div>}
    </>}
  </section>;
}
