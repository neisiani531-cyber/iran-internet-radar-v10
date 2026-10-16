import React,{useState} from 'react';
import evidence from '../packages/contracts/evidence-metadata-public.json';
import admission from '../packages/contracts/source-admission-public.json';
import './research-insights.css';
const dimensions=[
 {id:'quality',title:'کیفیت محسوس',cases:'P01 · T02 · T05',description:'فاصله میان شاخص‌های فنی شبکه و تجربه واقعی استفاده‌کنندگان',hypothesis:'سرعت، تأخیر، ساعات اوج و محل استفاده باید در یک نمونه هم‌دوره سنجیده شوند.'},
 {id:'access',title:'دسترسی به خدمات',cases:'P01 · A01 · A02',description:'اصطکاک استفاده از خدمات و ابزارهای واسط، با توجه به الزامات قانونی و امنیتی',hypothesis:'آزمون دسترسی خدمت و پرسش رفتار کاربران، با تعریف دقیق جامعه و مسیر.'},
 {id:'resilience',title:'اختلال و تاب‌آوری',cases:'T07 · P01 · P04',description:'رخدادهای ارتباطی، بازگشت خدمت و قابلیت پیش‌بینی برای کاربران و کسب‌وکارها',hypothesis:'مقایسه سری زمانی اصلی و چند مشاهده‌گر با تفکیک نوع اختلال و زمان بازیابی.'},
 {id:'cost',title:'هزینه مؤثر اینترنت',cases:'P01 · E02',description:'تناسب قیمت، کیفیت دریافتی و هزینه واقعی استفاده، نه صرفاً تعرفه اسمی',hypothesis:'مطالعه سبد واقعی مصرف و هزینه در گروه‌های مختلف، جدا از برآورد بازار.'},
 {id:'gap',title:'شکاف پوشش و تجربه',cases:'T04 · T05 · P03',description:'تفاوت پوشش جمعیتی، اتصال فعال و کیفیت تجربه در مکان‌های مختلف',hypothesis:'داده مشترک استانی/شهری و روستایی برای پوشش، استفاده و کیفیت واقعی.'},
 {id:'economy',title:'اقتصاد، سکوها و اعتماد',cases:'P02 · P04 · G01 · E01',description:'تأثیر وابستگی شغلی و پلتفرمی، اعتماد و پایداری خدمات بر تجربه',hypothesis:'پیوند شواهد اقتصادی و رفتاری بدون تبدیل پیش‌بینی به مشاهده یا علیت.'}
];
const highlights=[
 {value:'۵۸٫۸٪',title:'ارزیابی ضعیف سرعت اینترنت',desc:'در میان کاربران اینترنتِ پاسخ‌دهنده به پیمایش ملت؛ ارزیابی ذهنی است، نه اندازه‌گیری Mbps.',source:'گزارش ملت ۲۱۹۲۱ · EV-P01-002'},
 {value:'۷۳٫۵٪',title:'رضایت کم یا نداشتن رضایت از قیمت بسته',desc:'جمع دو گزینه پاسخ به پرسش مشخص قیمت بسته اینترنت همراه؛ شاخص هزینه پرداختی خانوار نیست.',source:'گزارش ملت ۲۱۹۲۱ · EV-P01-003'},
 {value:'۶۴٫۷٪',title:'گزارش استفاده از ابزار واسط برای شبکه‌های اجتماعی خارجی',desc:'از کل پاسخگویان پیمایش، در چارچوب همان سؤال؛ معادل تمام موارد استفاده VPN نیست.',source:'گزارش ملت ۲۱۹۲۱ · EV-P01-004'},
 {value:'۳۸٫۷٪',title:'اولویت اعلام‌شده رفع محدودیت دسترسی',desc:'پاسخ به سؤال نخستین اولویت سیاست‌گذاری اینترنت؛ اختلاف کدگذاری برخی دسته‌ها هنوز باز است.',source:'گزارش ملت ۲۱۹۲۱ · EV-P01-005'}
];
export default function ResearchInsights(){
 const [active,setActive]=useState('quality');
 const [detail,setDetail]=useState(false);
 const item=dimensions.find(x=>x.id===active)!;
 return <div className="ri-page">
  <section className="ri-intro"><span className="ri-kicker">RESEARCH INTELLIGENCE · یافته‌های مستند</span><h1>مردم اینترنت را چگونه تجربه می‌کنند؟</h1><p>رادار فقط تعداد اشتراک یا سایت را گزارش نمی‌کند. این بخش یافته‌های نگرشی، شواهد فنی و فرضیه‌های قابل آزمون را کنار هم می‌گذارد تا مسئله‌های سیاستی روشن‌تر شوند.</p><div className="ri-alert">این یافته‌ها در مرحله بررسی پژوهشی‌اند، Q5 نهایی نشده است. هیچ‌کدام سهم علّی نارضایتی در سطح کشور نیستند.</div></section>
  <section className="ri-highlight-grid">{highlights.map(h=><article className="ri-highlight" key={h.title}><span className="ri-value">{h.value}</span><h3>{h.title}</h3><p>{h.desc}</p><small>{h.source}</small></article>)}</section>
  <section className="ri-analysis"><div className="ri-heading"><div><span className="ri-kicker">S01 · چارچوب تشخیصی</span><h2>شش سازوکار قابل بررسی نارضایتی</h2><p>یافته، فرضیه و نیاز اطلاعاتی را تفکیک می‌کنیم. رتبه‌بندی علل بدون طرح شناسایی معتبر مجاز نیست.</p></div></div><div className="ri-layout"><div className="ri-choices">{dimensions.map(d=><button key={d.id} className={active===d.id?'active':''} onClick={()=>setActive(d.id)}>{d.title}<small>{d.cases}</small></button>)}</div><div className="ri-detail"><span className="ri-kicker">محور منتخب</span><h3>{item.title}</h3><p>{item.description}</p><div className="ri-next"><strong>برای نتیجه‌گیری دقیق‌تر چه لازم است؟</strong><p>{item.hypothesis}</p></div><small>پرونده‌های مرتبط: {item.cases}</small></div></div></section>
  <section className="ri-bottom"><div><h2>از نتیجه تا سند قابل بررسی</h2><p>پشت این تحلیل، دفتر شواهد و ماتریس پذیرش منابع قرار دارد. جزئیات فنی را فقط هنگام نیاز باز کنید.</p></div><button onClick={()=>setDetail(!detail)} aria-expanded={detail}>{detail?'بستن جزئیات پژوهشی':'مشاهده شناسنامه‌ها و وضعیت منابع'}</button></section>
  {detail&&<section className="ri-sources"><h3>دفتر شواهد ({evidence.observations.length} رکورد)</h3><div className="ri-evidence">{evidence.observations.map(x=><details key={x.evidence_id}><summary>{x.description} <span>{x.dossier_id}</span></summary><p>شناسه شاهد: {x.evidence_id} | منبع: {x.source_id}</p><p>وضعیت: پژوهشی، فاقد پذیرش Q5 برای انتشار عددی رسمی.</p></details>)}</div><h3>خانواده‌های منابع ({admission.entries.length} مدخل)</h3><div className="ri-evidence">{admission.entries.map(x=><details key={x.source_family}><summary>{x.source_family} <span>{x.admission_rule}</span></summary><p>کاربرد: {x.dashboard_use}</p><p>محدودیت: {x.blocking_limit}</p></details>)}</div></section>}
  <div className="ri-footer">روش‌شناسی: ارقام پیمایش با شاخص شبکه، پوشش و هزینه کل خانوار قابل جمع یا میانگین‌گیری نیستند. مرجع تحلیلی: S01 نسخه ۲ مورخ ۱۵ اکتبر ۲۰۲۶.</div>
 </div>;
}
