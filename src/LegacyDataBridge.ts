import {useEffect,useState} from 'react';
export type Json=null|boolean|number|string|Json[]|{[key:string]:Json};
export type LegacyRecord={[key:string]:Json};
export type LegacyBundle={official:LegacyRecord[];evidence:LegacyRecord[];research:LegacyRecord;models:LegacyRecord;pdfPages:{n:number;title:string;en:string;text:string;img:string}[];audit:LegacyRecord;metadata:LegacyRecord;operators:LegacyRecord[];coverage:Json;technology:Json;quality:Json;fixedTechnologyTimeSeries:Json;craMeta:Json;uiCapabilities:Json};
let pending:Promise<LegacyBundle>|null=null;
export function loadLegacyBundle(){
 if(!pending)pending=fetch(new URL('legacy/v9-17.html',document.baseURI)).then(async response=>{
  if(!response.ok)throw Error('Source HTTP '+response.status);
  const documentSource=new DOMParser().parseFromString(await response.text(),'text/html');
  const payload=documentSource.querySelector('script#radarPayload')?.textContent;
  if(!payload)throw Error('Source payload missing');
  const value=JSON.parse(payload) as LegacyBundle;
  if(value.official?.some(row=>typeof row.id!=='string'||typeof row.value!=='number'||!Number.isFinite(row.value))||new Set(value.official?.map(row=>row.id)).size!==130||value.official?.length!==130||value.evidence?.length!==320||value.pdfPages?.length!==28||Object.keys(value.research?.sources||{}).length!==50)throw Error('V9.17 source contract mismatch');
  return value;
 }).catch(error=>{pending=null;throw error;});
 return pending;
}
export function useLegacyBundle(){
 const [data,setData]=useState<LegacyBundle|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let live=true;setError('');loadLegacyBundle().then(value=>{if(live)setData(value);}).catch(()=>{if(live)setError('دریافت داده‌های نسخه مرجع ناموفق بود.');});return()=>{live=false;};},[attempt]);
 return {data,error,retry:()=>setAttempt(value=>value+1)};
}
