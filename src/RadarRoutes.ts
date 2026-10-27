import {useEffect,useState} from 'react';
export const AREAS=['target','access','command','fixed','mobile','research','qos','social','evidence','legacy','catalog','reach','services','studio','researchlab','live','archive','platforms'] as const;
export type RadarArea=typeof AREAS[number];
export const DOMAINS=['communications','information','base','applications','security','governance','people'] as const;
export type RadarDomain=typeof DOMAINS[number];
export type RadarView='overview'|'data'|'explore';
export type RadarRoute={area:RadarArea;domain:RadarDomain;view:RadarView;query:string};
export function parseRoute(hash:string):RadarRoute{const [path,qs='']=hash.replace(/^#/,'').split('?');const [a,d]=path.split('/'),q=new URLSearchParams(qs),v=q.get('view');return {area:AREAS.includes(a as RadarArea)?a as RadarArea:'target',domain:DOMAINS.includes(d as RadarDomain)?d as RadarDomain:'communications',view:v==='data'||v==='explore'?v:'overview',query:q.get('q')||''}}
export function routeHash(r:RadarRoute){const q=new URLSearchParams();if(r.view!=='overview')q.set('view',r.view);if(r.query)q.set('q',r.query);return '#'+r.area+'/'+r.domain+(r.area==='target'&&q.size?'?'+q:'')}
export function useRadarRoutes(){
 const [route,setRoute]=useState<RadarRoute>(()=>parseRoute(window.location.hash));
 useEffect(()=>{const sync=()=>setRoute(parseRoute(window.location.hash));window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync)}},[]);
 const navigate=(area:RadarArea,domain:RadarDomain=route.domain,options:{view?:RadarView;query?:string;replace?:boolean}={})=>{
  const same=area===route.area&&domain===route.domain;
  const next={area,domain,view:options.view??(same?route.view:'overview'),query:options.query??(same?route.query:'')};const hash=routeHash(next);
  if(hash!==window.location.hash){window.history[options.replace?'replaceState':'pushState'](null,'',hash);setRoute(next)}
 };
 return {route,navigate};
}
