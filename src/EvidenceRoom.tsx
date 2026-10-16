import React,{useState} from 'react';
import evidence from '../packages/contracts/evidence-metadata-public.json';
import graph from '../packages/contracts/research-public-relations.json';
export default function EvidenceRoom(){
 const [q,setQ]=useState('');
 const [sourceFilter,setSourceFilter]=useState('all');
 const sources=[...new Set(evidence.observations.map(x=>x.source_id))].sort();
 const [selected,setSelected]=useState(evidence.observations[0].evidence_id);
 const items=evidence.observations.filter(x=>(sourceFilter==='all'||x.source_id===sourceFilter)&&(x.description+' '+x.evidence_id+' '+x.dossier_id+' '+x.source_id).includes(q));
 const current=evidence.observations.find(x=>x.evidence_id===selected);
 const claims=graph.claim_evidence_links.filter(x=>x.evidence_id===selected);
 const claimSiblings=graph.claim_evidence_links.filter(x=>claims.some(c=>c.claim_id===x.claim_id)&&x.evidence_id!==selected);
 const siblings=graph.source_evidence_links.filter(x=>x.source_id===current?.source_id&&x.evidence_id!==selected);
 return <section dir="rtl" style={{padding:24}}>
  <h1>اتاق شواهد و ردیابی پژوهش</h1><p>مسیر سند، شاهد و ادعا در داده‌های پژوهشی قابل انتشار. هیچ یک از این شواهد تأیید نهایی Q5 ندارند.</p>
  <p>۲۲ شاهد پژوهشی | ۳ ادعای پیوندخورده | پذیرش Q5: صفر</p>
  <div style={{display:'grid',gridTemplateColumns:'minmax(220px,1fr) minmax(300px,2fr)',gap:20}}>
  <div><label>جست‌وجو در شواهد <input value={q} onChange={e=>setQ(e.target.value)} /></label><label> منبع <select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}><option value="all">همه منابع</option>{sources.map(x=><option key={x} value={x}>{x}</option>)}</select></label><p>{items.length} شاهد از {evidence.observations.length}</p>
  <div style={{maxHeight:500,overflowY:'auto'}}>{items.map(x=><button key={x.evidence_id} onClick={()=>setSelected(x.evidence_id)} style={{display:'block',width:'100%',padding:12,marginTop:8,textAlign:'right',background:selected===x.evidence_id?'#185b65':'#173145',color:'white',border:'1px solid #446070',borderRadius:8}}>{x.description}<small style={{display:'block'}}>{x.dossier_id}</small></button>)}</div></div>
  <article style={{background:'#10283b',border:'1px solid #446070',borderRadius:14,padding:24}}>{current&&<><h2>{current.description}</h2>
  <p>پرونده: {current.dossier_id}</p><p>منبع: {current.source_id}</p><p>شاهد: {current.evidence_id}</p>
  <p>وضعیت بررسی: {current.verification_status}</p>
  <h3>ادعاهای متصل</h3><p>{claims.length?claims.map(x=>x.claim_id).join('، '):'ادعای مرتبط در قرارداد عمومی ثبت نشده است.'}</p>
  <h3>شواهد دیگر همین منبع</h3>{siblings.length?siblings.map(x=><button key={x.evidence_id} onClick={()=>{setSelected(x.evidence_id);setSourceFilter('all');setQ('')}} style={{display:'block',margin:'8px 0'}}>{x.evidence_id}</button>):<p>مورد دیگری ثبت نشده است.</p>}
  <h3>شواهد متصل به همین ادعا</h3>{claimSiblings.length?claimSiblings.map(x=><button key={x.claim_id+x.evidence_id} onClick={()=>{setSelected(x.evidence_id);setSourceFilter('all');setQ('')}} style={{display:'block',margin:'8px 0'}}>{x.claim_id} ← {x.evidence_id}</button>):<p>شاهد هم‌ادعای دیگری ثبت نشده است.</p>}
  <h3>تعارض‌های پژوهشی</h3><p>متن تعارض‌ها در قرارداد عمومی منتشر نشده است. نبود اطلاعات به معنی رفع تعارض نیست.</p>
  <p>وضعیت علمی: پژوهشی و تأییدنشده برای شاخص رسمی.</p></>}</article></div>
 </section>;
}