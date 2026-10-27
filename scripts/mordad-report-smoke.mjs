import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
const report=JSON.parse(await readFile('src/platform-mordad-1405.json','utf8'));
if(report.records.length!==67||report.trends.length!==20||report.commonTrends.length!==5)throw Error('Mordad inventory mismatch');
for(const p of ['EITAA','BALE','VIRASTY','RUBIKA','SOROUSH'])if(report.records.filter(r=>r.group==='themes'&&r.platform===p).reduce((a,r)=>a+r.value,0)!==100)throw Error('Theme partition changed');
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.RADAR_PREVIEW_URL,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'ورود به تحلیل پیام‌رسان‌ها ↗',exact:true}).click();
 const region=page.getByRole('region',{name:'گزارش دوم رادار؛ مرداد ۱۴۰۵'});
 await region.getByRole('heading',{name:'گزارش دوم · مرداد ۱۴۰۵',exact:true}).waitFor();
 if(await region.locator('.messaging-card').count()!==3)throw Error('Three content trends missing');
 await region.getByRole('combobox').selectOption('بازدید');
 if(await region.locator('.messaging-card').count()!==2)throw Error('Virasty views fabricated');
 await region.getByRole('tab',{name:'۶۷ عدد و شناسنامه'}).click();
 for(const r of report.records){const text=await region.locator(`[data-mordad-record="${r.id}"]`).textContent();if(!text.includes(new Intl.NumberFormat('fa-IR',{maximumFractionDigits:4}).format(r.value))||!text.includes(r.denominator))throw Error('Changed source record '+r.id);}
 const lower=report.records.find(r=>r.qualifier==='greater_than');if(!(await region.locator(`[data-mordad-record="${lower.id}"]`).textContent()).includes('بیش از'))throw Error('Lost source lower bound');
 await region.getByRole('tab',{name:'ترکیب موضوعی پنج سکو'}).click();
 if(await region.locator('.md-donut').count()!==5)throw Error('Missing content partitions');
 await page.screenshot({path:'visual-review/mordad-themes-desktop.png',fullPage:true});
 await region.getByRole('tab',{name:'ترندهای درون ماه'}).click();
 if(await region.locator('.mordad-percent').count()!==16)throw Error('Missing weekly observations');
 await region.getByRole('tab',{name:'جمع دوره و کنترل اعداد'}).click();
 if(!(await region.textContent()).includes('۱۶۳ میلیون'))throw Error('Missing Eitaa total discrepancy');
 await page.getByRole('combobox').first().selectOption('VIRASTY');
 await region.getByRole('tab',{name:'روند سه‌ماهه'}).click();
 await region.getByRole('combobox').selectOption('بازدید');
 await region.getByRole('status').waitFor();
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('combobox').first().selectOption('all');
 await region.getByRole('tab',{name:'ترکیب موضوعی پنج سکو'}).click();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mordad chart overflow');
 await region.getByRole('tab',{name:'۶۷ عدد و شناسنامه'}).click();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mordad record overflow');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS Mordad: all 67 values/denominators, five theme partitions, 16 weekly facts, lower bound, total discrepancy, missing views, mobile width');
}finally{await browser.close();}
