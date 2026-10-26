import React from 'react';
import {useLegacyBundle} from './LegacyDataBridge';
export default function OriginalReportImage({page}:{page:number}){
 const {data,error,retry}=useLegacyBundle();
 const source=data?.pdfPages.find(item=>item.n===page);
 return <section className="original-report-image" aria-label={'تصویر اصلی صفحه '+page}>
  {error?<><p role="alert">{error}</p><button type="button" onClick={retry}>تلاش مجدد دریافت تصویر</button></>:!data?<p role="status">دریافت تصویر صفحه گزارش…</p>:source&&/^data:image\/(jpeg|png);base64,/.test(source.img)?<><p>تصویر صفحه {page} · {source.title} · برگرفته از نسخه مرجع ۹٫۱۷</p><a href={source.img} download={'CRA57-page-'+page+'.jpg'}>دریافت تصویر صفحه</a><img src={source.img} alt={'اصل صفحه '+page+' گزارش فصلنامه ۵۷'} loading="lazy" style={{display:'block',maxWidth:'100%',height:'auto',margin:'12px auto',background:'white'}}/></>:<p>تصویر این صفحه در نسخه مرجع موجود نیست.</p>}
 </section>;
}
