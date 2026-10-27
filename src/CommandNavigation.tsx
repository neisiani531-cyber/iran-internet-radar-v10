import React,{useState} from 'react';
import './CommandNavigation.css';
type Area='command'|'target'|'fixed'|'mobile'|'research'|'qos'|'social'|'evidence'|'legacy'|'catalog'|'reach'|'services'|'studio'|'researchlab'|'live'|'archive'|'platforms';
const primary:{id:Area;label:string;path:string}[]=[
 {id:'target',label:'مرکز فرماندهی',path:'M3 12a9 9 0 1 0 9-9v9h9M12 12l-5 5M12 3v4M3 12h4'},
 {id:'fixed',label:'ثابت و فیبر',path:'M4 7h16v10H4zM8 7V4m8 3V4M8 20v-3m8 3v-3M7 12h10'},
 {id:'mobile',label:'شبکه سیار',path:'m9 21 3-13 3 13M6 4a9 9 0 0 0 0 13M18 4a9 9 0 0 1 0 13M9 7a5 5 0 0 0 0 7M15 7a5 5 0 0 1 0 7'},
 {id:'platforms',label:'پیام‌رسان‌ها',path:'M4 4h16v12H9l-5 4zM8 8h8M8 12h5'},
 {id:'qos',label:'کیفیت و تجربه',path:'M3 12h4l3-8 4 16 3-8h4'},
 {id:'research',label:'پژوهش‌ها',path:'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4zM13 7a3 3 0 0 1 3-3h5v14h-4a4 4 0 0 0-4 3'},
 {id:'evidence',label:'شواهد و منابع',path:'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7'}
];
const extra:{id:Area;label:string}[]=[{id:'archive',label:'کتابخانه بومی نسخه ۹٫۱۷'},{id:'live',label:'پایش زنده BGP'},{id:'social',label:'نبض جامعه و شبکه‌های اجتماعی'},{id:'reach',label:'دسترسی و پوشش مناطق'},{id:'services',label:'خدمات ارتباطی و مصرف'},{id:'studio',label:'آزمایشگاه رسمی داده‌ها'},{id:'catalog',label:'کاوشگر ۱۳۰ شاخص رسمی'},{id:'researchlab',label:'آزمایشگاه پژوهشی Tor و TIC'},{id:'command',label:'نمای فرماندهی قبلی'},{id:'legacy',label:'نسخه کامل V9.17'}];
export default function CommandNavigation({area,onNavigate}:{area:Area;onNavigate:(area:Area)=>void}){
 const [open,setOpen]=useState(false);
 const navigate=(id:Area)=>{onNavigate(id);setOpen(false);window.scrollTo(0,0);};
 return <header className="command-nav" dir="rtl">
  <button type="button" className="command-brand" onClick={()=>navigate('target')} aria-label="خانه رادار اینترنت ایران"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17"/><circle cx="20" cy="20" r="11"/><circle cx="20" cy="20" r="4"/><path d="M20 3v17l12 12"/><circle cx="28" cy="12" r="2" className="brand-point"/></svg><span>رادار اینترنت ایران<small>INTERNET OBSERVATORY · V10</small></span></button>
  <nav className="command-primary" aria-label="ناوبری اصلی">{primary.map(item=><button key={item.id} type="button" aria-current={area===item.id?'page':undefined} onClick={()=>navigate(item.id)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.path}/></svg><span>{item.label}</span></button>)}</nav>
  <div className="command-nav-tools"><button type="button" className="command-more-toggle" aria-expanded={open} aria-controls="command-more" onClick={()=>setOpen(value=>!value)}>همه بخش‌ها <span aria-hidden="true">⌄</span></button><button type="button" className="command-assistant" onClick={()=>document.getElementById('radar-assistant-toggle')?.click()}>✦ <span>دستیار</span></button></div>
  {open&&<nav id="command-more" className="command-more" aria-label="همه بخش‌های رادار" onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);document.querySelector<HTMLButtonElement>('.command-more-toggle')?.focus();}}}>{[...primary,...extra].map(item=><button key={item.id} type="button" aria-current={area===item.id?'page':undefined} onClick={()=>navigate(item.id)}>{item.label}<span aria-hidden="true">↗</span></button>)}</nav>}
 </header>;
}
