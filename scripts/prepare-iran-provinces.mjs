// Downloads and checks the OSM-derived 31-province geometry at build time.
// The distributable contains the GeoJSON, so dashboard viewers need no access to GitHub.
// Source data: ODbL 1.0; attribution remains visible in the map component.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const url='https://raw.githubusercontent.com/ssepehrnoush/Iran-geojson-map-boundaries/master/ir_states_boundaries_coordinates.geojson';
const target=resolve('public/data/iran-provinces.geojson');
const validate=(d)=>{
 if(d?.type!=='FeatureCollection'||d.features?.length!==31)throw Error('Expected 31 provinces');
 const ids=new Set();
 for(const f of d.features){
  const id=f.properties?.['ISO3166-2'];
  if(!/^IR-(0[1-9]|[12][0-9]|3[01])$/.test(id)||ids.has(id))throw Error('Invalid or duplicate ISO id: '+id);
  ids.add(id);
  if(f.geometry?.type!=='MultiPolygon'&&f.geometry?.type!=='Polygon')throw Error('Invalid geometry type: '+id);
  let polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  if(!Array.isArray(polys)||!polys.length)throw Error('Empty geometry '+id);
  for(const poly of polys)for(const ring of poly){
   if(!Array.isArray(ring)||ring.length<4)throw Error('Invalid ring '+id);
   for(const p of ring)if(!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||p[0]<43||p[0]>65||p[1]<24||p[1]>41)throw Error('Coordinate out of Iran bounds '+id);
  }
 }
};
let raw;
try {
 raw=await readFile(target,'utf8');
 validate(JSON.parse(raw));
 console.log('Iran province geometry: validated local copy');
} catch(error) {
 if(error.code!=='ENOENT')throw error;
 const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Could not obtain province geometry: HTTP '+response.status);
 const text=await response.text();
 if(text.length>18_000_000)throw Error('GeoJSON too large');
 const data=JSON.parse(text);validate(data);
 await mkdir(resolve('public/data'),{recursive:true});
 await writeFile(target,JSON.stringify(data));
 console.log('Iran province geometry downloaded and validated (31 provinces; ODbL)');
}
