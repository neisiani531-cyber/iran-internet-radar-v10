import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.RADAR_PREVIEW_URL||'http://127.0.0.1:18081/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'ورود به تحلیل پیام‌رسان‌ها ↗',exact:true}).click();
 await page.getByRole('heading',{name:'پیام‌رسان‌ها و پلتفرم‌ها',exact:true}).waitFor();
 const source=await readFile('public/legacy/v9-17.html','utf8');
 const payload=JSON.parse(source.match(/<script id="radarPayload" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 const expected=payload.evidence.filter(r=>r.theme==='platforms');
 const ids=await page.locator('[data-platform-evidence]').evaluateAll(els=>els.map(e=>e.dataset.platformEvidence));
 if(expected.length!==11||ids.length!==11||expected.some(r=>!ids.includes(r.id)))throw Error('Missing original messaging records');
 for(const r of expected){const text=await page.locator(`[data-platform-evidence="${r.id}"]`).textContent();if(!text.includes(new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(r.value))||!text.includes(r.limit))throw Error('Changed source value or limitation '+r.id);}
 const activity=page.getByRole('region',{name:'گزارش شش‌ماهه سکوهای ایرانی'});
 if(await activity.locator('[data-activity-platform]').count()!==5)throw Error('Missing activity platforms');
 const views=activity.locator('.messaging-card').filter({has:page.getByRole('heading',{name:'بازدید چهار پیام‌رسان',exact:true})});
 if((await views.textContent()).includes('ویراستی'))throw Error('Virasty incorrectly counted as views');
 await page.getByRole('combobox').first().selectOption('BALE');
 if(await activity.locator('[data-activity-platform]').count()!==1)throw Error('Activity filter failed');
 if(await page.locator('.messaging-grid .messaging-card').count()!==1)throw Error('Platform filter failed');
 await page.getByRole('combobox').first().selectOption('all');
 await page.screenshot({path:'visual-review/messaging-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile overflow');
 await page.screenshot({path:'visual-review/messaging-mobile.png',fullPage:true});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS messaging: all 11 exact records, limitations, filtering, home entry, mobile width; no runtime errors');
}finally{await browser.close();}
