import React,{useEffect,useRef,useState} from 'react';
export type ChartMode='line'|'bar'|'area'|'donut'|'heatmap';
export type ChartData={series:number[][];labels:string[];categories:string[];ticks?:string[];unit:string;descriptions?:string[];ceiling?:number;categoryLabel?:string;emptyMessage?:string};
const colors=['#44dfd0','#64a4fb','#f7ae59','#d78ef8'];
const fa=(v:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(v);
const compact=(v:number)=>v>=1e6?fa(v/1e6)+'م':v>=1e3?fa(v/1e3)+'ه':fa(v);
function valid(data:ChartData){return data.categories.length>0&&data.series.length>0&&data.series.length===data.labels.length&&data.series.every(row=>row.length===data.categories.length&&row.every(v=>Number.isFinite(v)&&v>=0));}
export function ChartDataTable({data,title}:{data:ChartData;title:string}){
 if(!valid(data))return null;
 return <details className="md-data-table"><summary>جدول مقادیر · {title}</summary><div tabIndex={0} aria-label={'جدول قابل پیمایش '+title}><table><caption>{title} · {data.unit} · مقادیر منبع بدون گرد کردن</caption><thead><tr><th scope="col">{data.categoryLabel??'دوره / پرسش'}</th>{data.labels.map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{data.categories.map((category,i)=><tr key={category}><th scope="row">{category}</th>{data.series.map((row,j)=><td key={j}>{fa(row[i])}</td>)}</tr>)}</tbody></table></div></details>;
}
export default function AnalyticsChart({data,mode,title}:{data:ChartData;mode:ChartMode;title:string}){
 const complete=valid(data);
 const canvasRef=useRef<HTMLDivElement>(null);
 const [size,setSize]=useState({width:620,height:230});
 useEffect(()=>{
  if(!canvasRef.current)return;
  const observer=new ResizeObserver(entries=>{const box=entries[0]?.contentRect;if(!box)return;const width=Math.max(280,Math.round(box.width)),height=Math.max(100,Math.round(box.height));setSize(old=>old.width===width&&old.height===height?old:{width,height});});
  observer.observe(canvasRef.current);return ()=>observer.disconnect();
 },[complete]);
 const [active,setActive]=useState<number|null>(null);
 const [muted,setMuted]=useState<number[]>([]);
 if(!complete)return <div className="md-chart-empty" role="status">{data.emptyMessage??'داده کامل و معتبر برای رسم این نمودار موجود نیست.'}</div>;
 const visible=data.series.map((_,i)=>i).filter(i=>!muted.includes(i));
 const {width:w,height:h}=size;const l=64,r=25,t=25,b=38;
 const max=data.ceiling??(mode==='bar'&&data.unit==='درصد پاسخ'?100:(Math.max(...visible.flatMap(i=>data.series[i]))||1));
 const n=data.categories.length;
 const x=(i:number)=>l+(i+.5)*(w-l-r)/n;
 const y=(v:number)=>t+(1-v/max)*(h-t-b);
 const points=(row:number[])=>row.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
 const index=active===null?null:Math.max(0,Math.min(n-1,active));
 function inspect(e:React.PointerEvent<SVGSVGElement>){if(e.buttons!==0)return;const rect=e.currentTarget.getBoundingClientRect();const vx=(e.clientX-rect.left)/rect.width*w;setActive(Math.max(0,Math.min(n-1,Math.floor((vx-l)/(w-l-r)*n))));}
 function keyboard(e:React.KeyboardEvent<SVGSVGElement>){
  if(e.key==='Escape'){setActive(null);return;}
  if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();setActive(e.key==='Home'?0:e.key==='End'?n-1:Math.max(0,Math.min(n-1,(index??0)+(e.key==='ArrowRight'?1:-1))));}
 }
 const latest=data.series.map(row=>row[n-1]);
 const total=latest.reduce((a,b)=>a+b,0);
 let offset=0;
 return <div className="md-chart-shell">
  <div className="md-chart-canvas" ref={canvasRef}>
   {mode==='donut'?<div className="md-donut"><svg viewBox="0 0 180 180" role="img" aria-label={title+'؛ سهم آخرین دوره '+data.categories[n-1]}><circle cx="90" cy="90" r="59" fill="none" stroke="#284155" strokeWidth="26"/>{latest.map((value,i)=>{const fraction=total>0?value/total:0;const circle=<circle key={i} cx="90" cy="90" r="59" fill="none" stroke={colors[i%colors.length]} strokeWidth="26" strokeDasharray={`${fraction*370.708} 370.708`} strokeDashoffset={-offset*370.708} transform="rotate(-90 90 90)"><title>{data.labels[i]+': '+fa(value)+' '+data.unit+'؛ '+fa(fraction*100)+'٪'}</title></circle>;offset+=fraction;return circle;})}<text x="90" y="94" textAnchor="middle" fill="#dffafa" fontSize="13">{compact(total)}</text></svg><div><strong>{data.categories[n-1]}</strong>{data.labels.map((label,i)=><div key={label}><i style={{background:colors[i%colors.length]}}/>{label}: {total>0?fa(latest[i]/total*100)+'٪':'سهم تعریف نشده'}<small>{fa(latest[i])} {data.unit}</small></div>)}</div></div>:<>
    <svg className="md-chart-svg" data-chart-mode={mode} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" role="img" tabIndex={0} aria-label={title+'؛ '+data.unit+'؛ برای پیمایش مقادیر از کلیدهای جهت، Home و End استفاده کنید'} onPointerMove={inspect} onPointerLeave={()=>setActive(null)} onFocus={()=>setActive(n-1)} onBlur={()=>setActive(null)} onKeyDown={keyboard}>
     {mode!=='heatmap'&&[0,.25,.5,.75,1].map(v=><g key={v}><line x1={l} x2={w-r} y1={y(v*max)} y2={y(v*max)} stroke="#294459" strokeDasharray="3 5"/><text x={l-8} y={y(v*max)+4} textAnchor="end" fill="#9ebdce" fontSize="11">{compact(v*max)}</text></g>)}
     <text x={l} y="12" fill="#9ebdce" fontSize="10">{mode==='heatmap'?data.unit+' · دامنه رنگ: ۰ تا '+fa(max):data.unit==='اشتراک'?'اشتراک · ه: هزار، م: میلیون':data.unit}</text>
     {visible.map((j,k)=>{const row=data.series[j];
      if(mode==='heatmap'){
       const rowHeight=(h-t-b)/visible.length;
       return <g key={j}><text x={l-8} y={t+(k+.5)*rowHeight+4} textAnchor="end" fill="#aacbd8" fontSize="12">{data.labels[j]}</text>{row.map((value,i)=>{const cellWidth=(w-l-r)/n;return <g key={i}><rect x={l+i*cellWidth+2} y={t+k*rowHeight+2} width={cellWidth-4} height={rowHeight-4} rx="4" fill="#238ca5" fillOpacity={.12+.72*value/max} stroke="#36718b"/><text x={x(i)} y={t+(k+.5)*rowHeight+4} textAnchor="middle" fill="#f0fbff" fontSize="12">{fa(value)}٪</text></g>;})}</g>;
      }
      return mode==='bar'?row.map((value,i)=>{const band=(w-l-r)/n*.7,barWidth=band/visible.length;return <rect key={j+'-'+i} x={x(i)-band/2+k*barWidth} y={y(value)} width={Math.max(1,barWidth-2)} height={h-b-y(value)} fill={colors[j%colors.length]} opacity=".9"><title>{data.categories[i]+' · '+data.labels[j]+': '+fa(value)+' '+data.unit}</title></rect>;}):<g key={j}>{mode==='area'&&<polygon points={points(row)+` ${x(n-1)},${y(0)} ${x(0)},${y(0)}`} fill={colors[j%colors.length]} opacity=".12"/>}<polyline points={points(row)} fill="none" stroke={colors[j%colors.length]} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round"/>{index!==null&&<circle cx={x(index)} cy={y(row[index])} r="4" fill={colors[j%colors.length]}/>}</g>;})}
     {data.categories.map((category,i)=>{const every=data.ticks?1:Math.max(1,Math.ceil(n/Math.max(2,Math.floor(w/170))));return (i===0||i===n-1||i%every===0)&&<text key={category} x={x(i)} y={h-12} textAnchor="middle" fill="#a5bfd0" fontSize="10">{data.ticks?.[i]??category}</text>;})}
     {index!==null&&<line x1={x(index)} x2={x(index)} y1={t} y2={h-b} stroke="#a4d8e6" strokeDasharray="4 4" pointerEvents="none"/>}
    </svg>
    {index!==null&&<div className="md-chart-readout" role="status" aria-live="polite"><strong>{data.categories[index]}</strong>{visible.map(j=><div key={j}><span style={{color:colors[j%colors.length]}}>{data.labels[j]}</span><b>{fa(data.series[j][index])} {data.unit}</b></div>)}{data.descriptions?.[index]&&<small>{data.descriptions[index]}</small>}</div>}
   </>}
  </div>
  {mode!=='donut'&&<div className="md-legend" aria-label={'سری‌های '+title}>{data.labels.map((label,i)=><button key={label} type="button" aria-label={'نمایش سری '+label} aria-pressed={!muted.includes(i)} disabled={visible.length===1&&!muted.includes(i)} onClick={()=>setMuted(old=>old.includes(i)?old.filter(j=>j!==i):[...old,i])}><i style={{background:mode==='heatmap'?'#238ca5':colors[i%colors.length]}}/>{label}</button>)}</div>}
 </div>;
}
