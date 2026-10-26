import type {ChartData,ChartMode} from './AnalyticsChart';
import type {LegacyRecord} from './LegacyDataBridge';
export type CatalogPanel={id:string;title:string;group:string;rows:LegacyRecord[];modes:ChartMode[];data:ChartData};
const normalize=(value:string)=>value.replace(/[۰-۹]/g,digit=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/^(\d{4})-([1-4])$/,'$1-Q$2');
const operators:Record<string,string>={MCI:'همراه اول',MTN:'ایرانسل',RIGHTEL:'رایتل'};
const fields:Record<string,string>={active:'خطوط فعال اپراتورها',sites5g:'سایت‌های فعال 5G',sites4g:'سایت‌های فعال 4G',coverage4g:'پوشش جمعیتی 4G',coverage3g:'پوشش جمعیتی 3G',roadKm:'پوشش جاده‌ای اپراتورها',villages:'روستاهای تحت پوشش اپراتورها',cities4g:'شهرهای تحت پوشش 4G',ping3g:'سرعت دانلود 3G',ping4g:'سرعت دانلود 4G',success3g:'موفقیت اتصال داده 3G',success4g:'موفقیت اتصال داده 4G',drop3g:'قطع اتصال داده 3G',drop4g:'قطع اتصال داده 4G',m2m:'اشتراک M2M اپراتورها',roamingCountries:'کشورهای دارای رومینگ',roamingOperators:'شرکای خارجی رومینگ'};
const overview:Record<string,string>={MOB:'خطوط فعال سیار',MOBB:'اشتراک پهن‌باند سیار',FIXEDTEL:'خطوط تلفن ثابت',FIXBB:'اشتراک پهن‌باند ثابت'};
function classify(row:LegacyRecord):[string,string,boolean,boolean]{
 const id=String(row.id),op=id.match(/^CRA57-(MCI|MTN|RIGHTEL)-(.+)$/);
 if(op)return ['operators-'+op[2],fields[op[2]]||op[2],false,false];
 const national=id.match(/^CRA57-(MOB|MOBB|FIXEDTEL|FIXBB)-(PEN|GROWTH)$/);
 if(national)return [id,(overview[national[1]]||national[1])+(national[2]==='PEN'?' · ضریب نفوذ':' · رشد گزارش‌شده'),false,false];
 const annual=id.match(/^CRA57-(MOB|MOBB|FIXEDTEL|FIXBB)-(1404|1405)$/);
 if(annual)return ['annual-'+annual[1],overview[annual[1]]+' در دو بهار',true,false];
 if(id.startsWith('CRA57-FIBER-COV-'))return ['fiber-coverage','روند خانوار تحت پوشش فیبر',true,false];
 if(id.startsWith('CRA57-FIXSHARE-'))return ['fixed-shares','سهم فناوری‌های دسترسی ثابت',false,true];
 if(id.startsWith('CRA57-TECH-'))return ['fixed-counts','اشتراک فناوری‌های دسترسی ثابت',false,true];
 if(/^CRA57-(VOICE|SMS|M2M|4G-SITES)-(MCI|MTN|RIGHTEL)$/.test(id)){const family=id.replace(/^CRA57-/,'').replace(/-(MCI|MTN|RIGHTEL)$/,'');return ['share-'+family,({VOICE:'سهم ترافیک مکالمه',SMS:'سهم پیامک',M2M:'سهم اتصالات M2M','4G-SITES':'سهم سایت‌های 4G'} as Record<string,string>)[family],false,true];}
 if(id.startsWith('CRA57-MOBBB-'))return ['mobile-generation','اشتراک پهن‌باند به تفکیک نسل',false,false];
 if(id.startsWith('CRA57-RTT-'))return ['quality-rtt','RTT ثابت و سیار · داخلی و بین‌الملل',false,false];
 if(id.startsWith('CRA57-JITTER-'))return ['quality-jitter','Jitter ثابت و سیار · داخلی و بین‌الملل',false,false];
 if(id.startsWith('CRA57-COMP-'))return ['citizen-complaints','تعداد شکایات به تفکیک خدمت',false,false];
 return [id,String(row.label),false,false];
}
export function buildLegacyCatalogPanels(rows:LegacyRecord[]):CatalogPanel[]{
 const groups=new Map<string,{title:string;temporal:boolean;composition:boolean;rows:LegacyRecord[]}>();
 for(const row of rows){const [key,title,temporal,composition]=classify(row);const item=groups.get(key)||{title,temporal,composition,rows:[]};item.rows.push(row);groups.set(key,item);}
 return [...groups].map(([id,item])=>{
  const sorted=[...item.rows].sort((a,b)=>item.temporal?normalize(String(a.period)).localeCompare(normalize(String(b.period))):0);
  const homogeneous=sorted.every(row=>row.unit===sorted[0].unit&&typeof row.value==='number'&&Number.isFinite(row.value));
  const labels=sorted.map(row=>{const match=String(row.id).match(/^CRA57-(MCI|MTN|RIGHTEL)-/);return match?operators[match[1]]:String(row.label);});
  const modes:ChartMode[]=!homogeneous||sorted.length===1?[]:item.composition?['donut','bar']:item.temporal?['line','bar','area']:['bar'];
  const donut=modes[0]==='donut';
  return {id,title:item.title,group:String(sorted[0].group),rows:sorted,modes,data:{unit:String(sorted[0].unit),series:donut?sorted.map(row=>[Number(row.value)]):[sorted.map(row=>Number(row.value))],labels:donut?labels:['مقدار گزارش‌شده'],categories:donut?[String(sorted[0].period)]:item.temporal?sorted.map(row=>String(row.period)):labels,categoryLabel:item.temporal?'دوره':'شاخص / گروه'}};
 }).sort((a,b)=>Number(b.modes.length>0)-Number(a.modes.length>0));
}
