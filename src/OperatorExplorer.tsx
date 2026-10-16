import React,{useState} from 'react';
import expanded from '../packages/contracts/cra57-operator-expanded.json';
import existing from '../packages/contracts/public-mobile-operators.snapshot.json';
type Metric={key:string;label:string;unit:string;page:number;values:number[]};
const base:Metric[]=existing.metrics.map(x=>({key:x.id,label:x.id==='active_5g_sites'?'سایت فعال 5G':'پوشش جمعیتی 4G',unit:x.unit==='site'?'سایت':'درصد',page:x.id==='active_5g_sites'?10:10,values:x.values.map(v=>v.value)}));
const available=[...base,...expanded.metrics];
const fmt=(n:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(n);
export default function OperatorExplorer(){
 const [key,setKey]=useState('active_4g_sites');
 const selected=available.find(x=>x.key===key)!;
 const peak=Math.max(...selected.values,1);
 return <section className="panel"><h2>مقایسه تفصیلی سه اپراتور سیار</h2><p>۹ شاخص جداگانه از فصلنامه ۵۷، بهار ۱۴۰۵. هر شاخص با صفحه سند مشخص شده و مقادیر آن فقط میان همان اپراتورها مقایسه می‌شود.</p>
 <div className="controls"><label>شاخص<select value={key} onChange={e=>setKey(e.target.value)}>{available.map(x=><option key={x.key} value={x.key}>{x.label}</option>)}</select></label></div>
 <div className="bars">{expanded.operators.map((name,i)=><div className="bar-row" key={name}><span>{name}</span><div className="track"><div className="fill" style={{width:(selected.values[i]/peak*100)+'%'}}/></div><strong>{fmt(selected.values[i])} {selected.unit}</strong></div>)}</div>
 <div className="info"><span>منبع: فصلنامه آماری شماره ۵۷ رگولاتوری، صفحه {fmt(selected.page)}</span><span>دوره: بهار ۱۴۰۵، صرفاً یک مقطع</span></div>
 <p>برای تحلیل روند تاریخی مشترکان و توسعه شبکه، سری‌های زمانی چندفصلی باید از جدول‌های اصلی گزارش به قرارداد داده منتقل و مستقل کنترل شوند.</p>
 </section>;
}