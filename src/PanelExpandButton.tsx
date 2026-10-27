import React,{useEffect,useRef,useState} from 'react';
export default function PanelExpandButton({title}:{title:string}){
 const ref=useRef<HTMLButtonElement>(null);
 const [expanded,setExpanded]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{const update=()=>{setExpanded(Boolean(document.fullscreenElement?.contains(ref.current)));};document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
 async function toggle(){
  try{setError(false);if(expanded)await document.exitFullscreen();else{const panel=ref.current?.closest<HTMLElement>('.md-widget,.tc-panel');if(panel)await panel.requestFullscreen();}}catch{setError(true);}
 }
 return <><button ref={ref} type="button" className="panel-expand" aria-label={expanded?'بازگشت به داشبورد':'بزرگ‌نمایی '+title} title={expanded?'بازگشت · Escape':'بازکردن پنل در نمای بزرگ'} onClick={toggle}>{expanded?'بازگشت':<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>}</button>{error&&<small role="alert">مرورگر اجازه بزرگ‌نمایی نداد.</small>}</>;
}
