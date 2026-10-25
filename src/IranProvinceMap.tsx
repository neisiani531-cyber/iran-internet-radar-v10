import React,{useEffect,useMemo,useState} from 'react';
import './IranProvinceMap.css';

type Geometry={type:'MultiPolygon'|'Polygon';coordinates:number[][][][]|number[][][]};
type Feature={type:'Feature';properties:Record<string,string>;geometry:Geometry};
type GeoJSON={type:'FeatureCollection';features:Feature[]};
const SOURCE='https://raw.githubusercontent.com/ssepehrnoush/Iran-geojson-map-boundaries/master/ir_states_boundaries_coordinates.geojson';
const getId=(p:Record<string,string>)=>p['ISO3166-2']||p['ref']||'';
const name=(p:Record<string,string>)=>p['name:fa']||p.name||'استان بدون نام';
function rings(feature:Feature):number[][][][]{
 const g=feature.geometry;
 return g.type==='Polygon'?[g.coordinates as number[][][]]:g.coordinates as number[][][][];
}
function valid(data:unknown):data is GeoJSON{
 if(!data||typeof data!=='object')return false;
 const d=data as Partial<GeoJSON>;
 if(d.type!=='FeatureCollection'||!Array.isArray(d.features)||d.features.length!==31)return false;
 const ids=new Set<string>();
 for(const feature of d.features){
  if(!feature||feature.type!=='Feature'||!feature.properties||!feature.geometry||!['Polygon','MultiPolygon'].includes(feature.geometry.type))return false;
  const id=getId(feature.properties);
  if(!/^IR-[0-9]{2}$/.test(id)||ids.has(id))return false;
  ids.add(id);
  const polygons=rings(feature);
  if(!Array.isArray(polygons)||!polygons.length)return false;
  for(const polygon of polygons)for(const ring of polygon)for(const pt of ring){
   if(!Array.isArray(pt)||pt.length<2||!Number.isFinite(pt[0])||!Number.isFinite(pt[1]))return false;
  }
 }
 return true;
}
const width=620,height=370,pad=19;
function projectPoint(point:number[],bounds:{minX:number;maxX:number;minY:number;maxY:number}){
 const scale=Math.min((width-2*pad)/(bounds.maxX-bounds.minX),(height-2*pad)/(bounds.maxY-bounds.minY));
 const dx=(width-(bounds.maxX-bounds.minX)*scale)/2;
 const dy=(height-(bounds.maxY-bounds.minY)*scale)/2;
 return [dx+(point[0]-bounds.minX)*scale,dy+(bounds.maxY-point[1])*scale];
}
export default function IranProvinceMap({layer}:{layer:string}){
 const [features,setFeatures]=useState<Feature[]|null>(null);
 const [error,setError]=useState('');
 const [selected,setSelected]=useState<Feature|null>(null);
 useEffect(()=>{
  const c=new AbortController();
  fetch(SOURCE,{signal:c.signal}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
   .then(data=>{if(!valid(data))throw Error('Province GeoJSON integrity: expected 31 unique ISO features');setFeatures(data.features)})
   .catch(e=>{if(e.name!=='AbortError')setError('دریافت مرزبندی استان‌ها ناموفق بود؛ '+String(e.message||e))});
  return()=>c.abort();
 },[]);
 const shapes=useMemo(()=>{
  if(!features)return [];
  const pts=features.flatMap(f=>rings(f).flatMap(poly=>poly.flatMap(r=>r)));
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
  return features.map(f=>({feature:f,path:rings(f).map(poly=>poly.map(r=>r.map((p,i)=>{const [x,y]=projectPoint(p,bounds);return (i?'L':'M')+x.toFixed(2)+','+y.toFixed(2)}).join(' ')+' Z').join(' ')).join(' ')}));
 },[features]);
 return <div className="ipm-wrap">
  {!features&&!error&&<div className="ipm-msg" role="status">در حال دریافت نقشه ۳۱ استان…</div>}
  {error&&<div className="ipm-msg" role="alert">{error}</div>}
  {features&&<div className="ipm-inner">
   <svg viewBox={'0 0 '+width+' '+height} role="img" aria-label="نقشه واقعی مرزهای ۳۱ استان ایران؛ داده شاخص استانی هنوز موجود نیست">
    {shapes.map(({feature,path})=><path key={getId(feature.properties)} d={path} fill={selected&&getId(selected.properties)===getId(feature.properties)?'#245b6f':'#173449'} fillRule="evenodd" stroke="#3f7189" strokeWidth=".6" tabIndex={0} role="button" aria-label={name(feature.properties)+'، داده استانی موجود نیست'} onClick={()=>setSelected(feature)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(feature)}}}/>)}
   </svg>
   <div className="ipm-detail"><b>{selected?name(selected.properties):'۳۱ استان ثبت‌شده'}</b><span>لایه {layer} | داده استانی قابل استناد موجود نیست</span><small>رنگ‌ها صرفاً مرزبندی و انتخاب را نشان می‌دهند، نه عملکرد استان</small></div>
  </div>}
  <div className="ipm-attrib">داده مرزها: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> · ODbL 1.0 · <a href="https://github.com/ssepehrnoush/Iran-geojson-map-boundaries" target="_blank" rel="noreferrer">مخزن منبع</a></div>
 </div>;
}
