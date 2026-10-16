import React,{useState} from 'react';
import expanded from '../packages/contracts/cra57-operator-expanded.json';
import existing from '../packages/contracts/public-mobile-operators.snapshot.json';
import historical from '../packages/contracts/cra57-mobile-broadband-history.json';
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
 <div style={{borderTop:'1px solid #355166',paddingTop:24,marginTop:27}}><h2>روند ۲۴ فصل اشتراک پهن‌باند سیار، به تفکیک اپراتور</h2><p>از تابستان ۱۳۹۹ تا بهار ۱۴۰۵؛ منبع: فصلنامه ۵۷، صفحه ۲۵. این سری مشترکان پهن‌باند سیار است، نه کل خطوط فعال.</p>
 <div style={{display:'flex',gap:18,flexWrap:'wrap',marginBottom:16}}>{historical.operators.map((n,i)=><span key={n} style={{color:['#55e3cc','#efa85c','#8aa7ff'][i]}}>● {n}</span>)}</div>
 <div style={{overflowX:'auto'}}><svg viewBox="0 0 760 250" role="img" aria-label="نمودار تاریخی اشتراک پهن باند سیار سه اپراتور در ۲۴ فصل" style={{width:'100%',minWidth:520,background:'#081b2b',borderRadius:13}}>
 {[0,1,2,3,4].map(i=><g key={i}><line x1="50" x2="730" y1={20+i*49} y2={20+i*49} stroke="#345064" strokeDasharray="4 6"/><text x="42" y={24+i*49} fill="#abc5d1" fontSize="11" textAnchor="end">{fmt((80-i*20)*1000000/1000000)}م</text></g>)}
 {historical.operators.map((n,i)=><polyline key={n} points={historical.values.map((values,j)=>(50+j*680/(historical.values.length-1))+','+(216-values[i]/80000000*196)).join(' ')} fill="none" stroke={['#55e3cc','#efa85c','#8aa7ff'][i]} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>)}
 <text x="50" y="242" fill="#bcd2dc" fontSize="11">۱۳۹۹/۲</text><text x="730" y="242" textAnchor="end" fill="#bcd2dc" fontSize="11">۱۴۰۵/۱</text></svg></div>
 <div style={{display:'flex',flexWrap:'wrap',gap:15,marginTop:12}}>{historical.operators.map((n,i)=><span key={n}>{n}: <strong>{fmt(historical.values[historical.values.length-1][i])}</strong> اشتراک</span>)}</div>
 <p>کنترل تصویری همه ردیف‌های جدول هنوز شرط نهایی انتشار است. از این روند برای نتیجه‌گیری درباره کیفیت، رضایت یا جمعیت استفاده نکنید.</p></div>
 </section>;
}