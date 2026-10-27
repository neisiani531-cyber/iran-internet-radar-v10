import {useEffect,useState} from 'react';
export function useStoredControl<T extends string|number|null>(key:string,initial:T){
 const [value,setValue]=useState<T>(()=>{try{const raw=sessionStorage.getItem('radar-r5-'+key);if(raw===null)return initial;const parsed=JSON.parse(raw);if(initial===null&&(parsed===null||typeof parsed==='number'||typeof parsed==='string'))return parsed as T;if(typeof parsed===typeof initial&&(typeof parsed!=='number'||Number.isFinite(parsed)))return parsed as T}catch{}return initial});
 useEffect(()=>{try{sessionStorage.setItem('radar-r5-'+key,JSON.stringify(value))}catch{}},[key,value]);
 return [value,setValue] as const;
}
