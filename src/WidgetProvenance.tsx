import React,{useState} from 'react';
import SourcePageViewer from './SourcePageViewer';
export type Provenance={source:string;page?:number;period:string;unit:string;scope:string;gate:string;method:string;denominator:string;limitation:string;identifiers:string[];count:number};
const fa=(value:number)=>new Intl.NumberFormat('fa-IR').format(value);
export default function WidgetProvenance({title,metadata}:{title:string;metadata:Provenance}){
 const [showPage,setShowPage]=useState(false);
 return <details className="md-provenance"><summary>شناسنامه و محدودیت داده · {title}</summary><dl>
  <div><dt>منبع</dt><dd>{metadata.source}{metadata.page!==undefined?' · صفحه '+fa(metadata.page):''}</dd></div>
  <div><dt>دوره</dt><dd>{metadata.period}</dd></div><div><dt>دامنه</dt><dd>{metadata.scope}</dd></div>
  <div><dt>واحد و تعداد مشاهدات</dt><dd>{metadata.unit} · {metadata.count>0?fa(metadata.count)+' مقدار در انتخاب فعلی':'داده‌ای برای انتخاب فعلی موجود نیست'}</dd></div>
  <div><dt>وضعیت پذیرش</dt><dd>{metadata.gate}</dd></div><div><dt>روش</dt><dd>{metadata.method}</dd></div>
  <div><dt>تعریف مخرج</dt><dd>{metadata.denominator}</dd></div><div><dt>محدودیت</dt><dd>{metadata.limitation}</dd></div>
  <div><dt>شناسه‌های مرجع</dt><dd dir="ltr">{metadata.identifiers.join(' · ')}</dd></div>
 </dl>{metadata.page!==undefined&&<><button type="button" onClick={()=>setShowPage(value=>!value)} aria-expanded={showPage}>{showPage?'بستن متن صفحه مرجع':'مشاهده متن صفحه مرجع'}</button><p>متن استخراج‌شده جای کنترل تصویر صفحه اصلی را نمی‌گیرد.</p>{showPage&&<SourcePageViewer page={metadata.page} onClose={()=>setShowPage(false)}/>}</>}</details>;
}
