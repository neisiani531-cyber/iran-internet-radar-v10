import React,{useEffect,useRef,useState} from 'react';
import type {ChartData} from './AnalyticsChart';
const fa=(value:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(value);
const palette=['#44dfd0','#64a4fb','#f7ae59'];
const operatorColors:Record<string,string>={'همراه اول':palette[0],'ایرانسل':palette[1],'رایتل':palette[2]};
export default function QoSScatter({data,title}:{data:ChartData;title:string}){
 const ref=useRef<HTMLDivElement>(null);
 const [size,setSize]=useState({width:500,height:210});
 const [active,setActive]=useState<number|null>(null);
 const complete=data.series.length===2&&data.categories.length>0&&data.series.every(row=>row.length===data.categories.length&&row.every(value=>Number.isFinite(value)&&value>=0&&value<=100));
 useEffect(()=>{if(!ref.current)return;const observer=new ResizeObserver(entries=>{const box=entries[0]?.contentRect;if(box)setSize({width:Math.max(280,Math.round(box.width)),height:Math.max(150,Math.round(box.height))});});observer.observe(ref.current);return ()=>observer.disconnect();},[complete]);
 if(!complete)return <div className="md-chart-empty" role="status">{data.emptyMessage??'جفت داده هم‌دوره و هم‌تعریف برای رسم موجود نیست.'}</div>;
 const [success,drop]=data.series;
 const operators=[...new Set(data.categories.map(category=>category.split(' · ')[0]))];
 const xMin=Math.min(99.5,Math.max(0,Math.floor(Math.min(...success)*2)/2)),xMax=100;
 const yMax=Math.max(.1,Math.ceil(Math.max(...drop)*10)/10);
 const {width:w,height:h}=size,l=55,r=20,t=27,b=44;
 const px=(value:number)=>l+(value-xMin)/Math.max(.1,xMax-xMin)*(w-l-r);
 const py=(value:number)=>h-b-value/yMax*(h-t-b);
 function keyboard(event:React.KeyboardEvent<SVGSVGElement>){if(event.key==='Escape'){setActive(null);return;}if(['Home','End','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();setActive(event.key==='Home'?0:event.key==='End'?success.length-1:Math.max(0,Math.min(success.length-1,(active??0)+(event.key==='ArrowRight'?1:-1))));}}
 return <div className="qsc-root"><div className="qsc-canvas" ref={ref}><svg viewBox={`0 0 ${w} ${h}`} role="img" tabIndex={0} aria-label={title+'؛ محور افقی موفقیت اتصال و محور عمودی نرخ قطع؛ درصد، بهار ۱۴۰۵'} onFocus={event=>{if(event.target===event.currentTarget)setActive(0);}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setActive(null);}} onKeyDown={keyboard}>
  {[0,.25,.5,.75,1].map(fraction=><g key={fraction}><line x1={l} x2={w-r} y1={py(fraction*yMax)} y2={py(fraction*yMax)} stroke="#294459" strokeDasharray="3 5"/><text x={l-7} y={py(fraction*yMax)+4} textAnchor="end" fill="#a6c4d5" fontSize="10">{fa(fraction*yMax)}</text><line x1={l+fraction*(w-l-r)} x2={l+fraction*(w-l-r)} y1={t} y2={h-b} stroke="#294459" strokeDasharray="3 5"/><text x={l+fraction*(w-l-r)} y={h-b+17} textAnchor="middle" fill="#a6c4d5" fontSize="10">{fa(xMin+fraction*(xMax-xMin))}</text></g>)}
  <text x={l} y="13" fill="#aacbd8" fontSize="10">نرخ قطع (%)</text><text x={(w+l-r)/2} y={h-4} textAnchor="middle" fill="#aacbd8" fontSize="10">موفقیت اتصال (%)</text>
  {data.categories.map((category,i)=>{const [operator,generation]=category.split(' · '),x=px(success[i]),y=py(drop[i]),color=operatorColors[operator]??palette[0];return <g key={category} className="qsc-point" data-point={category} tabIndex={0} role="button" aria-label={category+'؛ موفقیت '+fa(success[i])+' درصد؛ قطع '+fa(drop[i])+' درصد'} onFocus={()=>setActive(i)} onPointerEnter={()=>setActive(i)} onClick={()=>setActive(i)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setActive(i);}}}>{active===i&&<circle cx={x} cy={y} r="11" fill="none" stroke={color} opacity=".7"/>}{generation==='4G'?<polygon points={`${x},${y-6} ${x+6},${y} ${x},${y+6} ${x-6},${y}`} fill={color} stroke="#d8f7ff" strokeWidth=".8"/>:<circle cx={x} cy={y} r="5" fill={color} stroke="#d8f7ff" strokeWidth=".8"/>}</g>;})}
 </svg>{active!==null&&<div className="md-chart-readout qsc-readout" role="status"><strong>{data.categories[active]}</strong><div><span>موفقیت اتصال</span><b>{fa(success[active])}٪</b></div><div><span>نرخ قطع</span><b>{fa(drop[active])}٪</b></div></div>}</div><div className="qsc-legend">{operators.map((operator,i)=><span key={operator}><i style={{background:operatorColors[operator]??palette[i%palette.length]}}/>{operator}</span>)}<small>● 3G · ◆ 4G</small></div><small className="qsc-domain">مبدأ محور افقی {fa(xMin)}٪ است؛ تعداد مشاهدات: {fa(data.categories.length)}. خط روند یا رابطه علّی نمایش داده نمی‌شود.</small></div>;
}
