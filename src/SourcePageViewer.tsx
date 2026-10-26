import React,{useEffect,useState} from 'react';
import OriginalReportImage from './OriginalReportImage';
type Page={number:number;title:string;en:string;text:string};
export default function SourcePageViewer({page,onClose}:{page:number;onClose:()=>void}){
const [showImage,setShowImage]=useState(false);
const [pages,setPages]=useState<Page[]>([]),[error,setError]=useState(''),[current,setCurrent]=useState(page);
useEffect(()=>{const controller=new AbortController();fetch(new URL('data/v917-source-pages.json',document.baseURI),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(r=>setPages(r.pages)).catch(e=>{if(e.name!=='AbortError')setError(String(e))});return()=>controller.abort()},[]);
useEffect(()=>setCurrent(page),[page]);
const item=pages.find(x=>x.number===current);
return <div style={{border:'1px solid #42647c',background:'#10283b',borderRadius:12,padding:16,marginTop:16}} dir="rtl">
<div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center'}}><h3>متن استخراج‌شده صفحه {current} از فصلنامه ۵۷</h3><button onClick={onClose}>بستن</button></div>
<p>این متن حاصل استخراج از گزارش است؛ احتمال خطا در ترتیب سطرها و نویسه‌های فارسی وجود دارد. برای استناد نهایی، تصویر صفحه اصلی در V9.17 را کنترل کنید.</p>
<div className="controls"><label>انتخاب صفحه <select value={current} onChange={e=>setCurrent(Number(e.target.value))}>{pages.map(p=><option key={p.number} value={p.number}>{p.number} | {p.title}</option>)}</select></label></div>
{error&&<p role="alert">{error}</p>}{item&&<><p>{item.title}</p><div style={{whiteSpace:'pre-wrap',maxHeight:440,overflow:'auto',background:'#081925',padding:14,borderRadius:8,lineHeight:1.9}}>{item.text||'متن قابل استخراج برای این صفحه موجود نیست.'}</div></>}
<button type="button" onClick={()=>setShowImage(value=>!value)} aria-expanded={showImage}>{showImage?'بستن تصویر اصلی':'مشاهده تصویر اصلی همین صفحه'}</button>
{showImage&&<OriginalReportImage page={current}/>}
<a href={import.meta.env.BASE_URL + "legacy/v9-17.html"} target="_blank" rel="noreferrer">بازکردن نسخه اصلی دارای تصاویر گزارش ↗</a>
</div>;
}