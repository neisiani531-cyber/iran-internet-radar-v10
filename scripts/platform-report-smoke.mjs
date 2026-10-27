import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
const report=JSON.parse(await readFile('src/platform-report-complete.json','utf8'));
if(report.records.length!==108||new Set(report.records.map(r=>r.id)).size!==108||report.infographics.length!==23)throw Error('Report inventory changed');
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.RADAR_PREVIEW_URL,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'ورود به تحلیل پیام‌رسان‌ها ↗',exact:true}).click();
 const explorer=page.getByRole('region',{name:'کاوش کامل گزارش سکوها'});
 await explorer.getByRole('tab',{name:'تمام اعداد و شناسنامه‌ها'}).click();
 for(const r of report.records){const el=explorer.locator(`[data-report-record="${r.id}"]`);if(!(await el.textContent()).includes(new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(r.value)))throw Error('Missing report fact '+r.id);}
 await explorer.getByRole('tab',{name:'جزئیات تکمیلی و ممیزی',exact:true}).click();
 const supplement=JSON.parse(await readFile('src/platform-report-supplement.json','utf8'));
 for(const r of supplement.records){if(!(await explorer.locator(`[data-supplement-record="${r.id}"]`).textContent()).includes(new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(r.value)))throw Error('Missing supplemental fact '+r.id);}
 const auditRows=explorer.locator('[data-ratio-audit]');
 if(await auditRows.count()!==8)throw Error('Missing denominator checks');
 if((await auditRows.allTextContents()).filter(t=>t.includes('ناسازگار')).length!==2)throw Error('Rounding audit must flag two Soroush audience shares');
 await explorer.getByRole('tab',{name:'خبر، تحلیل و غیرخبری',exact:true}).click();
 if(await explorer.locator('.messaging-card').count()!==5)throw Error('Format charts missing');
 await explorer.getByRole('tab',{name:'ماه‌ها و نقاط تغییر'}).click();
 if(!(await explorer.textContent()).includes('—'))throw Error('Monthly gaps not explicit');
 await explorer.getByRole('tab',{name:'۲۳ اینفوگرافیک و پوشش'}).click();
 if(await explorer.locator('[data-report-image]').count()!==23)throw Error('Missing source images');
 await page.getByRole('combobox').first().selectOption('VIRASTY');
 await explorer.getByRole('tab',{name:'خبر، تحلیل و غیرخبری',exact:true}).click();
 if(await explorer.locator('.messaging-card').count()!==1)throw Error('Virasty filter failed');
 await page.getByRole('combobox').first().selectOption('all');
 await page.screenshot({path:'visual-review/platform-report-formats.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Report mobile overflow');
 await explorer.getByRole('tab',{name:'تمام اعداد و شناسنامه‌ها'}).click();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Table mobile overflow');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS report: 108 exact facts, 23 image references, five format charts, monthly gaps, Virasty filter, mobile tables');
}finally{await browser.close();}
