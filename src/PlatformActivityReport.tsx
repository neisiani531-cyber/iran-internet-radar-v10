import React from 'react';
import AnalyticsChart,{ChartDataTable,ChartData} from './AnalyticsChart';
import PanelExpandButton from './PanelExpandButton';
import PlatformReportExplorer from './PlatformReportExplorer';
// Numeric facts transcribed from Borna's republication, not certified against the inaccessible original.
export const activityReport={
 period:'فروردین تا شهریور ۱۴۰۵',status:'MATCHED_USER_PROVIDED_PRIMARY_TEXT_PENDING_IMAGE',accessed:'2026-10-26',
 original:'https://majazi.ir/fa/index.php?module=cdk&func=loadmodule&system=cdk&sismodule=user/content_view.php&cnt_id=132194&ctp_id=585&id=5022&sisOp=view',
 republication:'https://borna.news/fa/news/2406958/',
 rows:[
  {id:'RUBIKA',name:'روبیکا',contentMillion:227.7,activeThousand:512.9,viewsBillion:780.5,activeKind:'کانال'},
  {id:'EITAA',name:'ایتا',contentMillion:239.1,activeThousand:298.5,viewsBillion:87.4,activeKind:'کانال'},
  {id:'BALE',name:'بله',contentMillion:120.3,activeThousand:216.2,viewsBillion:206.2,activeKind:'کانال'},
  {id:'SOROUSH',name:'سروش‌پلاس',contentMillion:23.3,activeThousand:29,viewsBillion:14.1,activeKind:'کانال'},
  {id:'VIRASTY',name:'ویراستی',contentMillion:5.8,activeThousand:115.5,viewsBillion:null,activeKind:'صفحه'}
 ]
};
export default function PlatformActivityReport({selected}:{selected:string}){
 const rows=activityReport.rows.filter(r=>selected==='all'||r.id===selected),viewRows=rows.filter(r=>r.viewsBillion!==null);
 const make=(rs:typeof rows,key:'contentMillion'|'activeThousand'|'viewsBillion',unit:string):ChartData=>({series:[rs.map(r=>Number(r[key]))],labels:['مقدار گزارش‌شده'],categories:rs.map(r=>r.name),unit,categoryLabel:'سکو'});
 const charts=[{title:'حجم تولید محتوا',data:make(rows,'contentMillion','میلیون محتوا')},{title:'کانال‌ها و صفحات فعال',data:make(rows,'activeThousand','هزار کانال / صفحه')},{title:'بازدید چهار پیام‌رسان',data:make(viewRows,'viewsBillion','میلیارد بازدید')}];
 const fa=(n:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(n);
 return <section className="platform-activity" aria-label="گزارش شش‌ماهه سکوهای ایرانی"><h2>فعالیت محتوایی پنج سکو · {activityReport.period}</h2><p className="messaging-notice">اعداد با متن اصلی گزارش مرکز پایش و فراداده که شما ارسال کرده‌اید تطبیق یافته‌اند؛ بازخوانی زندهٔ صفحه و بررسی تصاویر انجام نشده است. این شاخص‌ها تعداد کاربر فعال، رضایت یا کیفیت شبکه نیستند. تحلیل موضوعی گزارش مبتنی بر محتوای پربازدید است و نماینده تمام محتوا نیست.</p>
 <div className="messaging-services">{charts.map(c=><article key={c.title} className="tc-panel messaging-card"><div className="messaging-card-head"><h3>{c.title}</h3><PanelExpandButton title={c.title}/></div><AnalyticsChart data={c.data} title={c.title} mode="bar"/><ChartDataTable data={c.data} title={c.title}/></article>)}</div>
 <details><summary>جدول کامل، محاسبات و اختلاف‌های منبع</summary><div style={{overflowX:'auto'}}><table><caption>نسبت‌ها محاسبه داشبورد از اعداد گرد‌شدهٔ گزارش هستند؛ شاخص تعامل یا کاربر یکتا نیستند.</caption><thead><tr><th>سکو</th><th>محتوا · میلیون</th><th>فعال · هزار</th><th>نوع واحد</th><th>بازدید · میلیارد</th><th>بازدید / محتوا · محاسبه‌شده</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} data-activity-platform={r.id}><th>{r.name}</th><td>{fa(r.contentMillion)}</td><td>{fa(r.activeThousand)}</td><td>{r.activeKind}</td><td>{r.viewsBillion===null?'شاخص متفاوت؛ قابل جمع نیست':fa(r.viewsBillion)}</td><td>{r.viewsBillion===null?'—':fa(r.viewsBillion*1000/r.contentMillion)}</td></tr>)}</tbody></table></div>
 <p>کنترل جمع کل گزارش، مستقل از فیلتر: ۶۱۶٫۲ میلیون محتوا در پنج سکو؛ ۱٬۰۸۸٫۲ میلیارد بازدید در چهار پیام‌رسان. تیتر خبر عدد گرد‌شدهٔ ۱٬۱۰۰ میلیارد را دارد.</p><p>ویراستی: عدد ۹۹۵٫۹ میلیون با عنوان «ضریب نفوذ» ثبت شده؛ تعریف و واحد آن روشن نیست و تا رفع ابهام در نمودار بازدید یا درصد نفوذ وارد نمی‌شود.</p><p>بازنشر آنا نسبت بازدید به محتوای سروش‌پلاس را ۶۵ آورده، اما بازنشر برنا ۶۰۵ ذکر کرده است. تقسیم ۱۴٫۱ میلیارد بر ۲۳٫۳ میلیون، حدود ۶۰۵٫۱۵ می‌دهد؛ جدول بالا محاسبهٔ صریح داشبورد است.</p><p>در تحلیل موضوعی ایتا، بازدید فروردین غیرقابل‌اتکا اعلام شده و سهم بازدید فقط اردیبهشت تا شهریور را پوشش می‌دهد؛ با سهم محتوای کل شش‌ماه هم‌دوره نیست.</p></details>
 <p><a href={activityReport.original} target="_blank" rel="noreferrer">صفحه اصلی مرکز ملی ↗</a> · <a href={activityReport.republication} target="_blank" rel="noreferrer">بازنشر خوانده‌شده در برنا ↗</a> · تاریخ بررسی: ۴ آبان ۱۴۰۵</p>
 <PlatformReportExplorer selected={selected}/>
 </section>;
}
