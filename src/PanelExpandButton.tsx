import React,{useEffect,useRef,useState} from 'react';
export default function PanelExpandButton({title}:{title:string}){
 const ref=useRef<HTMLButtonElement>(null);
 const [expanded,setExpanded]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{const update=()=>{setExpanded(Boolean(document.fullscreenElement?.contains(ref.current)||ref.current?.closest('.panel-expanded')));};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){ref.current?.closest('.panel-expanded')?.classList.remove('panel-expanded');setExpanded(false)}};document.addEventListener('keydown',escape);document.addEventListener('fullscreenchange',update);return()=>{document.removeEventListener('fullscreenchange',update);document.removeEventListener('keydown',escape)};},[]);
 async function toggle(){
  const panel=ref.current?.closest<HTMLElement>('.md-widget,.tc-panel,.cw-card,.nc-chart');
  if(!panel)return;
  if(expanded){if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}}panel.classList.remove('panel-expanded');setExpanded(false);return;}
  try{setError(false);await panel.requestFullscreen();}catch{panel.classList.add('panel-expanded');setExpanded(true);setError(false);}
 }

 return <><button ref={ref} type="button" className="panel-expand" aria-label={expanded?'بازگشت به داشبورد':'بزرگ‌نمایی '+title} title={expanded?'بازگشت · Escape':'بازکردن پنل در نمای بزرگ'} onClick={toggle}>{expanded?'بازگشت':<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>}</button>{error&&<small role="alert">مرورگر اجازه بزرگ‌نمایی نداد.</small>}</>;
}
