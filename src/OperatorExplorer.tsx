import React,{useMemo,useState} from 'react';
import expanded from '../packages/contracts/cra57-operator-expanded.json';
import existing from '../packages/contracts/public-mobile-operators.snapshot.json';
import historical from '../packages/contracts/cra57-mobile-broadband-history.json';

type Metric={key:string;label:string;unit:string;page:number;values:number[]};
const base:Metric[]=existing.metrics.map(x=>({key:x.id,label:x.id==='active_5g_sites'?'سایت فعال 5G':'پوشش جمعیتی 4G',unit:x.unit==='site'?'سایت':'درصد',page:10,values:x.values.map(v=>v.value)}));
const metrics:Metric[]=[...base,...expanded.metrics];
const operators=expanded.operators;
const fmt=(n:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(n);
const palette=['#55e3cc','#efa85c','#8aa7ff'];
const historicalIndex=historical.operators.map(name=>operators.indexOf(name));
const fullPeriods=historical.periods;
const latestIndex=fullPeriods.length-1;
const season=(s:string)=>{const m=/^(\d{4})-Q([1-4])$/.exec(s);return m?m[1]+' / '+['','بهار','تابستان','پاییز','زمستان'][Number(m[2])]:s;};
const sourceLink=import.meta.env.BASE_URL+'legacy/v9-17.html';

export default function OperatorExplorer(){
 const [key,setKey]=useState('active_4g_sites');
 const [period,setPeriod]=useState(latestIndex);
 const [shown,setShown]=useState([true,true,true]);
 const [mode,setMode]=useState<'chart'|'table'>('chart');
 const [detail,setDetail]=useState<string|null>(null);
 const selected=metrics.find(x=>x.key===key)!;
 const peak=Math.max(...selected.values,1);
 const values=historical.values[period];
 const visibleSeries=shown.some(Boolean)?shown:[true,true,true];
 const maxValue=useMemo(()=>Math.max(...historical.values.flat(),1),[]);
 const chartMax=Math.ceil(maxValue/10000000)*10000000;
 const y=(v:number)=>210-(v/chartMax)*178;
 const percentChange=(idx:number,months:number)=>{const before=period-months;if(before<0)return null;const a=values[idx],b=historical.values[before][idx];return b===0?null:(a/b-1)*100;};
 const selectAll=()=>setShown([true,true,true]);
 const selectedPoints=historical.operators.map((name,i)=>({name,index:i,value:values[i]}));

 const downloadHistory=()=>{
  const header=['دوره',...historical.operators,'واحد','وضعیت اعتبارسنجی'];
  const rows=historical.periods.map((period,i)=>[
   period,
   ...historical.values[i],
   'اشتراک پهن‌باند سیار',
   historical.validation
  ]);
  const csv=[header,...rows].map(row=>row.join(',')).join('\r\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const link=document.createElement('a');
  const url=URL.createObjectURL(blob);
  link.href=url;
  link.download='radar-mobile-broadband-24-quarters.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 return <section className="panel" dir="rtl">
 <h2>مقایسه مستند اپراتورهای سیار</h2>
 <p>۹ شاخص رسمی مقطعی از فصلنامه آماری ۵۷، بهار ۱۴۰۵، و یک سری مستقل ۲۴ فصلی از اشتراک پهن‌باند سیار. مقایسه تنها بین مقادیر هم‌تعریف و هم‌دوره انجام می‌شود.</p>
 <div className="controls"><label>شاخص مقطعی <select value={key} onChange={e=>{setKey(e.target.value);setDetail(null)}}>{metrics.map(x=><option key={x.key} value={x.key}>{x.label}</option>)}</select></label></div>
 <div className="bars">{operators.map((name,i)=><button type="button" className="bar-row" key={name} onClick={()=>setDetail(name)} aria-label={'شناسنامه '+name}><span>{name}</span><div className="track"><div className="fill" style={{width:(selected.values[i]/peak*100)+'%'}}/></div><strong>{fmt(selected.values[i])} {selected.unit}</strong></button>)}</div>
 <div className="info"><span>مرجع: فصلنامه ۵۷، صفحه {fmt(selected.page)}</span><span>دوره: بهار ۱۴۰۵</span><span>وضعیت: کنترل بصری نهایی لازم است</span></div>
 {detail&&<div className="detail"><button type="button" onClick={()=>setDetail(null)}>بستن ×</button><h3>{detail} | {selected.label}</h3><p>{fmt(selected.values[operators.indexOf(detail)])} {selected.unit}، بهار ۱۴۰۵</p><p>منبع رسمی: سازمان تنظیم مقررات، فصلنامه ۵۷، صفحه {fmt(selected.page)}.</p><a href={sourceLink} target="_blank" rel="noreferrer">بازکردن نسخه مرجع V9.17 و بررسی صفحه سند ↗</a><p>این مشاهده یک مقطع است و روند تاریخی این شاخص را نشان نمی‌دهد.</p></div>}
 <div style={{borderTop:'1px solid #355166',paddingTop:24,marginTop:27}}>
 <h2>روند تاریخی اشتراک پهن‌باند سیار</h2><p>۲۴ دوره از تابستان ۱۳۹۹ تا بهار ۱۴۰۵؛ صفحه ۲۵ فصلنامه ۵۷. این مقادیر مربوط به اشتراک پهن‌باند سیار هستند، نه تعداد کل سیم‌کارت‌های فعال، جمعیت دارای پوشش یا کیفیت شبکه.</p>
 <div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'end',gap:14}}>
 <label>دوره انتخابی <select value={period} onChange={e=>setPeriod(Number(e.target.value))}>{fullPeriods.map((p,i)=><option key={p} value={i}>{season(p)}</option>)}</select></label>
 <label>نمایش <select value={mode} onChange={e=>setMode(e.target.value as 'chart'|'table')}><option value="chart">نمودار</option><option value="table">جدول ۲۴ دوره</option></select></label>
 <button type="button" onClick={downloadHistory}>دریافت CSV تاریخچه ۲۴ فصل</button><button type="button" onClick={()=>setPeriod(latestIndex)}>آخرین دوره</button><button type="button" onClick={selectAll}>نمایش هر سه اپراتور</button>
 </div>

 <div className="panel" style={{marginTop:20}}>
  <h3>مقایسه تحلیلی سه اپراتور</h3>
  <p>دوره منتخب: {season(fullPeriods[period])} |
  منبع: فصلنامه ۵۷ رگولاتوری، صفحه ۲۵</p>
  <div style={{overflowX:'auto'}}>
   <table>
    <thead><tr>
     <th>اپراتور</th>
     <th>اشتراک پهن‌باند</th>
     <th>تغییر فصلی</th>
     <th>تغییر سالانه</th>
    </tr></thead>
    <tbody>
     {historical.operators.map((name,i)=>{
      const q=percentChange(i,1);
      const a=percentChange(i,4);
      return <tr key={name}>
       <td>{name}</td>
       <td>{fmt(values[i])}</td>
       <td>{q===null?'فاقد مبنا':fmt(q)+'٪'}</td>
       <td>{a===null?'فاقد مبنا':fmt(a)+'٪'}</td>
      </tr>;
     })}
    </tbody>
   </table>
  </div>
  <p>تغییرات بر اساس اشتراک پهن‌باند سیار محاسبه شده‌اند،
  نه کل سیم‌کارت‌های فعال. تطبیق تصویری با سند اصلی
  هنوز در انتظار تأیید است.</p>
 </div>

<div style={{display:'flex',flexWrap:'wrap',gap:16,margin:'16px 0'}}>{historical.operators.map((n,i)=><label key={n} style={{color:palette[i],cursor:'pointer'}}><input type="checkbox" checked={shown[i]} onChange={()=>setShown(v=>v.map((x,j)=>j===i?!x:x))}/> {n}</label>)}</div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:18}}>{selectedPoints.map(({name,index,value})=><article key={name} style={{padding:14,background:'#0c2638',borderRadius:12,border:'1px solid #29485c'}}><small>{name} · {season(fullPeriods[period])}</small><strong style={{display:'block',fontSize:21,margin:'8px 0'}}>{fmt(value)}</strong><small>اشتراک پهن‌باند</small><p style={{margin:'8px 0 0'}}>تغییر نسبت به فصل قبل: {percentChange(index,1)===null?'فاقد دوره مبنا':fmt(percentChange(index,1)! )+'٪'}</p><p style={{margin:'4px 0'}}>تغییر سالانه: {percentChange(index,4)===null?'فاقد دوره مبنا':fmt(percentChange(index,4)!)+'٪'}</p></article>)}</div>
 {mode==='chart'?<div style={{overflowX:'auto'}}><svg viewBox="0 0 780 260" role="img" aria-label="روند ۲۴ فصلی اشتراک پهن‌باند سیار با مقیاس متناسب با بیشینه داده" style={{width:'100%',minWidth:560,background:'#081b2b',borderRadius:13}}>
 {[0,1,2,3,4].map(i=><g key={i}><line x1="58" x2="748" y1={32+i*44.5} y2={32+i*44.5} stroke="#345064" strokeDasharray="4 6"/><text x="50" y={36+i*44.5} fill="#abc5d1" fontSize="11" textAnchor="end">{fmt(chartMax*(4-i)/4000000)}م</text></g>)}
 {historical.operators.map((n,i)=>visibleSeries[i]?<polyline key={n} points={historical.values.map((v,j)=>(58+j*690/(historical.values.length-1))+','+y(v[i])).join(' ')} fill="none" stroke={palette[i]} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round"/>:null)}
 <line x1={58+period*690/(fullPeriods.length-1)} x2={58+period*690/(fullPeriods.length-1)} y1="28" y2="215" stroke="#fff" opacity=".55" strokeDasharray="3 4"/>
 <text x="58" y="245" fill="#bcd2dc" fontSize="11">{season(fullPeriods[0])}</text><text x="748" y="245" textAnchor="end" fill="#bcd2dc" fontSize="11">{season(fullPeriods[latestIndex])}</text>
 </svg></div>:<div style={{maxHeight:490,overflow:'auto'}}><table><thead><tr><th>فصل</th>{historical.operators.map(n=><th key={n}>{n}</th>)}</tr></thead><tbody>{historical.values.map((v,i)=><tr key={fullPeriods[i]} style={{background:i===period?'#1d4358':undefined,cursor:'pointer'}} onClick={()=>setPeriod(i)}><td>{season(fullPeriods[i])}</td>{v.map((num,j)=><td key={historical.operators[j]}>{fmt(num)}</td>)}</tr>)}</tbody></table></div>}
 <div style={{marginTop:14}}><strong>جمع سه اپراتور در دوره انتخابی: {fmt(values.reduce((a,b)=>a+b,0))} اشتراک</strong></div>
 <p>اعتبارسنجی تعداد دوره‌ها و داده‌های عددی ساختاری انجام شده است. بازبینی تصویری تک‌تک ردیف‌های صفحه ۲۵ هنوز به پایان نرسیده است؛ از داده‌ها برای برآورد سهم بازار کل سیم‌کارت استفاده نشود.</p>
 <a href={sourceLink} target="_blank" rel="noreferrer">مشاهده نسخه مرجع و صفحات منبع ↗</a>
 </div></section>;
}