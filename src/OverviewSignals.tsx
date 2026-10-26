import React,{useState} from 'react';
import fixed from '../packages/contracts/public-fixed-access.snapshot.json';
import history from '../packages/contracts/cra57-mobile-broadband-history.json';
const fa=(value:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(value);
const compact=(value:number)=>fa(value/1e6)+' میلیون';
export default function OverviewSignals({period,selectedOperators}:{period:string;selectedOperators:number[]}){
 const [expanded,setExpanded]=useState<string|null>(null);
 const end=history.periods.indexOf(period)+1;
 const signals=[
  {id:'fixed',title:'اشتراک اینترنت ثابت',values:fixed.observations.map(row=>row.reported_total),periods:fixed.observations.map(row=>row.period_label),color:'#72a7ff',source:'CRA57 · صفحه ۲۲'},
  {id:'fiber',title:'اشتراک FTTx',values:fixed.observations.map(row=>row.technology_values.FTTx),periods:fixed.observations.map(row=>row.period_label),color:'#46dfcf',source:'CRA57 · صفحه ۲۲'},
  {id:'mobile',title:'اشتراک پهن‌باند سیار',values:history.values.slice(0,end).map(row=>selectedOperators.reduce((sum,index)=>sum+row[index],0)),periods:history.periods.slice(0,end),color:'#c295ff',source:'CRA57 · صفحه ۲۵؛ اپراتورهای انتخابی'}
 ];
 return <section className="tc-signal-strip" aria-label="مرور تصویری روندهای واقعی">{signals.map(item=>{
  const values=item.values,last=values[values.length-1],maximum=Math.max(...values,1);
  const points=values.map((value,index)=>`${10+index*220/Math.max(1,values.length-1)},${61-value/maximum*49}`).join(' ');
  const change=values.length>1?(last/values[0]-1)*100:undefined;
  return <article key={item.id} className="tc-signal" style={{'--signal-color':item.color} as React.CSSProperties}>
   <div className="tc-signal-copy"><h2>{item.title}</h2><span>{compact(last)} اشتراک</span><small>{change===undefined?'یک دوره موجود':(change>=0?'+':'')+fa(change)+'٪ از نخستین دوره'}</small></div>
   <button type="button" className="tc-signal-chart" aria-label={'مشاهده جزئیات روند '+item.title} aria-expanded={expanded===item.id} onClick={()=>setExpanded(value=>value===item.id?null:item.id)}>
    <svg viewBox="0 0 240 76" role="img" aria-label={item.title+'؛ '+values.length+' دوره؛ مقیاس عمودی از صفر تا '+fa(maximum)+' اشتراک'}>
     {[12,36,61].map(y=><line key={y} x1="10" x2="230" y1={y} y2={y} stroke="#274556" strokeDasharray="2 5"/>)}
     <polygon points={'10,61 '+points+' 230,61'} fill={item.color} opacity=".12"/>
     <polyline points={points} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinejoin="round"/>
     {values.map((value,index)=><circle key={index} cx={10+index*220/Math.max(1,values.length-1)} cy={61-value/maximum*49} r={index===values.length-1?3:1.5} fill={item.color}><title>{item.periods[index]+': '+fa(value)+' اشتراک'}</title></circle>)}
     <text x="10" y="74" fill="#829fae" fontSize="7">۰</text>
    </svg>
   </button>
   {expanded===item.id&&<div className="tc-signal-detail"><b>{fa(last)} اشتراک</b><span>{item.periods[0]} تا {item.periods[item.periods.length-1]} · {item.source}</span><span>در انتظار کنترل تصویری؛ شمار اشتراک، تعداد کاربران یکتا نیست.</span></div>}
  </article>;
 })}</section>;
}
