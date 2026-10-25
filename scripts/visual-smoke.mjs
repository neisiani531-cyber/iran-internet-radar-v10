import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base=process.env.RADAR_PREVIEW_URL||'http://127.0.0.1:4173/iran-internet-radar-v10/';
await mkdir('visual-review',{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 const errors=[];
 const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push(error.message));
 const response=await page.goto(base,{waitUntil:'networkidle',timeout:45000});
 if(!response?.ok())throw new Error('Preview unavailable: '+response?.status());
 await page.getByRole('heading',{name:'مرکز فرماندهی اینترنت ایران'}).waitFor({timeout:20000});
 await page.locator('.ipm-inner svg path').first().waitFor({timeout:25000});
 const count=await page.locator('.ipm-inner svg path').count();
 if(count!==31)throw new Error('Expected 31 map regions; got '+count);
 const widgets=page.locator('.md-widget');
 if(await widgets.count()!==3)throw new Error('Expected three analytics widgets');
 await page.getByRole('button',{name:'ویرایش چیدمان'}).click();
 const first=widgets.first();
 const thirdGrip=widgets.nth(2).locator('.md-grip');
 await thirdGrip.dragTo(first,{targetPosition:{x:25,y:75}});
 await page.waitForFunction(()=>document.querySelector('.md-widget h3')?.textContent?.includes('تجربه کاربران'),null,{timeout:10000});
 const firstTitle=await widgets.first().locator('h3').innerText();
 if(!firstTitle.includes('تجربه کاربران'))throw new Error('Widget drag ordering failed: '+firstTitle);
 await page.reload({waitUntil:'networkidle'});
 const persisted=await page.locator('.md-widget').first().locator('h3').innerText();
 if(!persisted.includes('تجربه کاربران'))throw new Error('Widget order not persisted');
 await page.getByRole('button',{name:'چیدمان پیش‌فرض'}).click();
 await page.screenshot({path:'visual-review/desktop-1600.png',fullPage:true});
 await page.getByRole('button',{name:'حالت نمایش مدیریتی'}).click();
 await page.screenshot({path:'visual-review/management-tv.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'visual-review/mobile-390.png',fullPage:true});
 if(errors.length)throw new Error('Browser runtime errors: '+errors.join(' | '));
 console.log('PASS: dashboard renders, 31 province paths, management and mobile screenshots');
} finally {await browser.close();}
