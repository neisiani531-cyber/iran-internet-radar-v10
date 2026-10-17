import React, {useState} from 'react';
import history from '../packages/contracts/cra57-mobile-broadband-history.json';
import latency from '../packages/contracts/cra57-latency-quality.snapshot.json';

const fmt=(v:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(v);
const colors=['#4ee0c2','#7aafff','#f4b66a'];
const names:{[key:string]:string}={
 fixed:'ثابت',mobile:'همراه',
 domestic:'داخلی',international:'بین‌المللی',
 rtt:'RTT',jitter:'Jitter'
};
const card:React.CSSProperties={
 background:'linear-gradient(145deg,#102a3c,#0b1d2c)',
 border:'1px solid #315267',borderRadius:16,padding:18
};

export default function RegulatoryPulse({
 onNavigate
}:{onNavigate:(area:'mobile'|'qos')=>void}){
 const [selected,setSelected]=useState(history.periods.length-1);
 const [visible,setVisible]=useState<boolean[]>([true,true,true]);
 const latest=history.values[selected];
 const previous=selected>=4?history.values[selected-4]:null;
 const maximum=Math.max(...history.values.flat())*1.1;
 const points=(operator:number)=>history.values.map((row,i)=>{
   const x=45+i*680/(history.values.length-1);
   const y=195-row[operator]/maximum*165;
   return `${x},${y}`;
 }).join(' ');
 const selectedX=45+selected*680/(history.periods.length-1);
 const percent=(i:number)=>previous&&previous[i]>0?
   (latest[i]/previous[i]-1)*100:null;
 const qualityGroups=[
  ['fixed','domestic'],['fixed','international'],
  ['mobile','domestic'],['mobile','international']
 ];
 return <section dir="rtl" style={{
  margin:'24px 0',padding:'clamp(16px,2.5vw,28px)',
  background:'linear-gradient(135deg,#0b2133,#102e42 55%,#081927)',
  border:'1px solid #365970',borderRadius:22,color:'#ecf5fa'
 }}>
  <div style={{display:'flex',justifyContent:'space-between',gap:18,
   flexWrap:'wrap',alignItems:'center'}}>
   <div>
    <small style={{color:'#66dfcd',letterSpacing:2}}>REGULATORY INTELLIGENCE</small>
    <h2 style={{margin:'10px 0'}}>نبض تاریخی اپراتورها و کیفیت شبکه</h2>
    <p style={{color:'#afc7d5',margin:0}}>
     ۲۴ فصل اشتراک پهن‌باند سیار و کیفیت گزارش‌شده شبکه در بهار ۱۴۰۵
    </p>
   </div>
   <label>فصل منتخب
    <select style={{display:'block',marginTop:8,padding:9,borderRadius:9}}
     value={selected} onChange={e=>setSelected(Number(e.target.value))}>
     {history.periods.map((p,i)=><option key={p} value={i}>{p}</option>)}
    </select>
   </label>
  </div>

  <div style={{display:'grid',
   gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
   gap:12,margin:'22px 0'}}>
   {history.operators.map((op,i)=><article key={op} style={card}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
     <span style={{height:9,width:9,borderRadius:'50%',background:colors[i]}}/>
     <strong>{op}</strong>
    </div>
    <strong style={{display:'block',fontSize:24,margin:'12px 0 4px'}}>
     {fmt(latest[i])}
    </strong>
    <small style={{color:'#b5cada'}}>اشتراک پهن‌باند سیار</small>
    <p style={{marginBottom:0,color:percent(i)===null?'#aebdcb':
     percent(i)!>=0?'#6ce5bd':'#ffc08d'}}>
     تغییر سالانه: {percent(i)===null?'فاقد مبنا':
      (percent(i)!>=0?'+':'')+fmt(percent(i)!)+'٪'}
    </p>
   </article>)}
  </div>

  <div style={{...card,overflowX:'auto'}}>
   <div style={{display:'flex',gap:18,flexWrap:'wrap',marginBottom:10}}>
    {history.operators.map((op,i)=><label key={op}
      style={{color:colors[i],cursor:'pointer'}}>
     <input type="checkbox" checked={visible[i]}
      onChange={()=>setVisible(v=>v.map((x,j)=>j===i?!x:x))}/>
     {' '}{op}
    </label>)}
   </div>
   <svg viewBox="0 0 770 235" role="img"
    aria-label="روند ۲۴ فصلی اشتراک پهن‌باند سیار"
    style={{width:'100%',minWidth:490}}>
    {[0,1,2,3,4].map(i=><g key={i}>
     <line x1="45" x2="725" y1={30+i*41.25} y2={30+i*41.25}
      stroke="#365267" strokeDasharray="4 6"/>
     <text x="38" y={34+i*41.25} textAnchor="end"
      fontSize="11" fill="#b5cada">
      {fmt(maximum*(4-i)/4/1000000)}م
     </text>
    </g>)}
    {history.operators.map((op,i)=>visible[i]?
     <polyline key={op} points={points(i)} fill="none"
      stroke={colors[i]} strokeWidth="3" strokeLinejoin="round"/>:null)}
    <line x1={selectedX} x2={selectedX} y1="24" y2="198"
     stroke="#fff" strokeDasharray="4 5" opacity=".7"/>
    <text x="45" y="224" fontSize="12" fill="#c1d6e1">
     {history.periods[0]}
    </text>
    <text x="725" y="224" fontSize="12" textAnchor="end" fill="#c1d6e1">
     {history.periods[history.periods.length-1]}
    </text>
   </svg>
   <p style={{fontSize:12,color:'#b5cada'}}>
    منبع: فصلنامه ۵۷ رگولاتوری، صفحه ۲۵.
    اشتراک پهن‌باند سیار با کل سیم‌کارت‌های فعال یکسان نیست.
    تطبیق تصویری کامل داده‌ها هنوز انجام نشده است.
   </p>
  </div>

  <h3 style={{marginTop:28}}>کیفیت شبکه، چهار مسیر مقایسه‌پذیر</h3>
  <div style={{display:'grid',
   gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
   {qualityGroups.map(([network,route])=><article
    key={network+route} style={card}>
    <strong>{names[network]} / {names[route]}</strong>
    {(['rtt','jitter'] as const).map(metric=>{
     const row=latency.observations.find(x=>
       x.metric===metric&&x.network===network&&x.route===route);
     return <div key={metric} style={{
      display:'flex',justifyContent:'space-between',
      marginTop:14,gap:8}}>
      <span style={{color:'#b5cada'}}>{names[metric]}</span>
      <b>{row?fmt(row.value)+' ms':'فاقد داده'}</b>
     </div>;
    })}
   </article>)}
  </div>
  <p style={{fontSize:12,color:'#b5cada'}}>
   منبع کیفیت: فصلنامه ۵۷، صفحه ۱۴، بهار ۱۴۰۵.
   داده‌های تجمیعی شبکه‌اند، نه عملکرد اختصاصی هر اپراتور
   و نه وضعیت زنده اینترنت.
  </p>
  <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:18}}>
   <button type="button" onClick={()=>onNavigate('mobile')}>
    تحلیل کامل اپراتورها ←
   </button>
   <button type="button" onClick={()=>onNavigate('qos')}>
    بررسی کیفیت و شواهد QoS/QoE ←
   </button>
  </div>
 </section>;
}
