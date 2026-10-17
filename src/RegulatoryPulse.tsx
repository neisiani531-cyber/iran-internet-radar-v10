import React, {useState} from 'react';
import history from '../packages/contracts/cra57-mobile-broadband-history.json';
import latency from '../packages/contracts/cra57-latency-quality.snapshot.json';
import expanded from '../packages/contracts/cra57-operator-expanded.json';

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
 const total=latest.reduce((sum,value)=>sum+value,0);
 const baseline=history.values[0];
 const totalBaseline=baseline.reduce((sum,value)=>sum+value,0);
 const prevQuarter=selected>0?history.values[selected-1]:null;
 const previousTotal=prevQuarter?.reduce((sum,value)=>sum+value,0);
 const yearEarlier=selected>=4?history.values[selected-4]:null;
 const previousYearTotal=yearEarlier?.reduce((sum,value)=>sum+value,0);
 const deltaPercent=(current:number,base:number|undefined)=>base&&base>0?(current/base-1)*100:null;
 const nationalGrowth=deltaPercent(total,previousYearTotal);
 const sortedOperators=history.operators.map((name,index)=>({name,value:latest[index],index,
  share:total>0?latest[index]/total*100:0,
  annual:yearEarlier?deltaPercent(latest[index],yearEarlier[index]):null
 })).sort((a,b)=>b.value-a.value);
 const leading=sortedOperators[0];
 const majorContribution=yearEarlier&&previousYearTotal!==undefined?
  history.operators.map((name,index)=>({name,change:latest[index]-yearEarlier[index]})).sort((a,b)=>b.change-a.change):[];
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

  <section aria-label="تحلیل مقایسه‌ای اشتراک پهن‌باند سیار" style={{...card,marginBottom:20}}>
   <h3 style={{margin:'0 0 12px'}}>خلاصه تحلیلی فصل منتخب</h3>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:14}}>
    <div><small>مجموع سه اپراتور در این جدول</small><strong style={{display:'block',fontSize:22}}>{fmt(total)}</strong><small>اشتراک پهن‌باند سیار، نه کل سیم‌کارت‌ها</small></div>
    <div><small>تغییر نسبت به فصل قبل</small><strong style={{display:'block',fontSize:22}}>{deltaPercent(total,previousTotal)===null?'فاقد مبنا':fmt(deltaPercent(total,previousTotal)!)+'٪'}</strong></div>
    <div><small>تغییر نسبت به فصل مشابه سال قبل</small><strong style={{display:'block',fontSize:22}}>{nationalGrowth===null?'فاقد مبنا':fmt(nationalGrowth)+'٪'}</strong></div>
    <div><small>بیشترین تعداد اشتراک ثبت‌شده</small><strong style={{display:'block',fontSize:19}}>{leading.name}</strong><small>{fmt(leading.share)}٪ از مجموع همین سه اپراتور</small></div>
   </div>
   <div style={{overflowX:'auto',marginTop:16}}>
    <table style={{width:'100%',borderCollapse:'collapse',textAlign:'right'}}>
     <thead><tr><th>اپراتور</th><th>اشتراک</th><th>سهم از مجموع جدول</th><th>تغییر سالانه</th></tr></thead>
     <tbody>{sortedOperators.map(x=><tr key={x.name}><td>{x.name}</td><td>{fmt(x.value)}</td><td>{fmt(x.share)}٪</td><td>{x.annual===null?'فاقد مبنا':(x.annual>=0?'+':'')+fmt(x.annual)+'٪'}</td></tr>)}</tbody>
    </table>
   </div>
   <p style={{fontSize:12,color:'#b5cada',marginBottom:0}}>
    مقایسه با اولین دوره ({history.periods[0]}): {totalBaseline>0?fmt((total/totalBaseline-1)*100)+'٪':'فاقد مبنا'}.
    {majorContribution.length>0?' بیشترین افزایش عددی سالانه: '+majorContribution[0].name+' ('+fmt(majorContribution[0].change)+' اشتراک).':''}
    این محاسبات فقط از داده‌های استخراج‌شده صفحه {history.page} انجام شده‌اند. سهم‌ها مربوط به مجموع اشتراک این سه اپراتورند و سهم بازار همه سیم‌کارت‌ها نیستند. داده‌ها همچنان در انتظار تطبیق تصویری با PDF مرجع‌اند.
   </p>
  </section>

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

  <section style={{...card,marginTop:22,marginBottom:22}} aria-label="توسعه شبکه در برابر شواهد کیفیت">
   <h3 style={{margin:'0 0 8px'}}>توسعه ظرفیت شبکه و کیفیت تجربه: دو مفهوم متفاوت</h3>
   <p style={{color:'#b5cada',fontSize:13}}>شاخص‌های توسعه 4G و پوشش روستاها برای هر اپراتور فقط در بهار ۱۴۰۵ موجودند. شاخص‌های RTT و Jitter به کل شبکه مربوط‌اند و قابل انتساب به هیچ اپراتور مشخصی نیستند.</p>
   {history.periods[selected]===expanded.period?<>
    <div style={{overflowX:'auto'}}>
     <table style={{width:'100%',borderCollapse:'collapse',textAlign:'right'}}>
      <thead><tr><th>اپراتور</th><th>اشتراک پهن‌باند سیار</th><th>سایت فعال 4G</th><th>شهر دارای پوشش 4G</th><th>روستای تحت پوشش</th></tr></thead>
      <tbody>{expanded.operators.map((op,i)=>{
       const historyIndex=history.operators.indexOf(op);
       const value=(key:string)=>expanded.metrics.find(x=>x.key===key)?.values[i];
       return <tr key={op}><td>{op}</td><td>{historyIndex<0?'فاقد داده':fmt(latest[historyIndex])}</td>
        <td>{value('active_4g_sites')===undefined?'فاقد داده':fmt(value('active_4g_sites')!)}</td>
        <td>{value('covered_cities_4g')===undefined?'فاقد داده':fmt(value('covered_cities_4g')!)}</td>
        <td>{value('covered_villages')===undefined?'فاقد داده':fmt(value('covered_villages')!)}</td></tr>;
      })}</tbody>
     </table>
    </div>
    <p style={{fontSize:12,color:'#b5cada',marginBottom:0}}>اشتراک: صفحه {history.page}؛ توسعه شبکه: صفحات ۱۰ و ۲۶ فصلنامه ۵۷. مقادیر سایت و پوشش، شاخص توسعه‌اند نه سنجش کیفیت یا رضایت. نسبت‌گیری اشتراک به سایت، بدون تعریف پوشش و مبنای مشترک، معیار عملکرد ساخته‌شده محسوب می‌شود و در این نما انجام نشده است.</p>
   </>:<p role="status" style={{color:'#f2c786'}}>شاخص‌های توسعه شبکه برای فصل انتخابی {history.periods[selected]} در قرارداد موجود نیستند. برای مقایسه مقطعی معتبر، به فصل ۱۴۰۵-Q1 بروید. مقادیر این فصل به دوره‌های دیگر تعمیم داده نمی‌شوند.</p>}
   <div style={{marginTop:14,padding:12,border:'1px solid #57748a',borderRadius:10}}>
    <strong>وضعیت استنتاج</strong>
    <p style={{margin:'8px 0 0',fontSize:13}}>رشد اشتراک و توسعه پوشش، به‌تنهایی اثبات بهبود سرعت، تأخیر، پایداری یا رضایت کاربر نیستند. برای چنین نتیجه‌ای به داده هم‌دوره، هم‌منطقه و قابل مقایسه QoS/QoE نیاز داریم. کنترل تصویری مقادیر صفحات مرجع نیز تکمیل نشده است.</p>
   </div>
  </section>
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
