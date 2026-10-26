import {readFile} from 'node:fs/promises';
export async function testLegacyNative(browser,base){
 const html=await readFile('public/legacy/v9-17.html','utf8');
 const original=JSON.parse(html.match(/<script\b(?=[^>]*\bid=["']radarPayload["'])[^>]*>([\s\S]*?)<\/script>/i)[1]);
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'ورود به کتابخانه بومی',exact:false}).click();
  await page.getByRole('heading',{name:'محتوای نسخه ۹٫۱۷ در داشبورد جدید',exact:true}).waitFor();
  await page.locator('.archive-chart').first().waitFor();
  await page.screenshot({path:'visual-review/native-catalog-desktop.png',fullPage:false});
  while(await page.getByRole('button',{name:/نمایش پنل‌های بیشتر/}).count())await page.getByRole('button',{name:/نمایش پنل‌های بیشتر/}).click();
  const actual=await page.locator('[data-observation-id]').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.observationId,text:node.textContent})));
  if(actual.length!==130||new Set(actual.map(row=>row.id)).size!==130)throw Error('Native catalog lost/duplicated source observations');
  const fmt=value=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:12}).format(value);
  for(const row of original.official){const match=actual.find(item=>item.id===row.id);if(!match?.text.includes(fmt(row.value)))throw Error('Native catalog source value mismatch '+row.id);}
  await page.getByRole('textbox',{name:'جست‌وجوی پنل یا شناسه'}).fill('sites5g');
  const sites=page.locator('[data-legacy-panel="operators-sites5g"]');
  await sites.getByRole('button',{name:'حذف از فرماندهی سایت‌های فعال 5G',exact:true}).click();
  await page.getByRole('button',{name:'خانه رادار اینترنت ایران',exact:true}).click();
  await page.waitForLoadState('networkidle');
  if(await page.locator('[data-legacy-panel="operators-sites5g"]').count())throw Error('Unpin did not update command page');
  await page.getByRole('button',{name:'ورود به کتابخانه بومی',exact:false}).click();
  await page.getByRole('textbox',{name:'جست‌وجوی پنل یا شناسه'}).fill('sites5g');
  await sites.getByRole('button',{name:'افزودن به فرماندهی سایت‌های فعال 5G',exact:true}).click();
  await page.getByRole('button',{name:'خانه رادار اینترنت ایران',exact:true}).click();
  await page.locator('[data-legacy-panel="operators-sites5g"]').waitFor();
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-legacy-panel="operators-sites5g"]').waitFor();
  await page.getByRole('button',{name:'ورود به کتابخانه بومی',exact:false}).click();
  const tabs=page.getByRole('navigation',{name:'بخش‌های نسخه مرجع'});
  for(const [name,count] of [['بانک ۳۲۰ شاهد',320],['۵۰ منبع',50],['تعارض‌ها',8],['سازوکارها و اقدام‌ها',6],['تطبیق پیمایش‌ها',9],['شواهد پژوهش مرکزی',22],['بازیابی ASN',6],['سناریوها و فرض‌ها',5],['مجموعه‌های تکمیلی',7]]){
   await tabs.getByRole('button',{name,exact:true}).click();
   if(Number(await page.locator('[data-archive-count]').getAttribute('data-archive-count'))!==count)throw Error('Legacy record count mismatch: '+name);
  }
  await tabs.getByRole('button',{name:'بانک ۳۲۰ شاهد',exact:true}).click();
  await page.getByRole('textbox',{name:'جست‌وجوی آرشیو'}).fill(original.evidence.at(-1).id);
  if(await page.locator('.archive-record').count()<1)throw Error('Last evidence cannot be found');
  await tabs.getByRole('button',{name:'ابزارهای محاسباتی',exact:true}).click();
  await page.getByRole('spinbutton',{name:'هزینه ماهانه اینترنت',exact:true}).fill('100000');
  await page.getByRole('spinbutton',{name:'هزینه ماهانه ابزار دسترسی',exact:true}).fill('200000');
  await page.getByRole('spinbutton',{name:'درآمد ماهانه',exact:true}).fill('1000000');
  if(!(await page.locator('.archive-calculation').innerText()).includes('۳۰٪'))throw Error('Legacy cost calculator changed');
  await page.getByRole('combobox',{name:'سناریو',exact:true}).selectOption('cable');
  await tabs.getByRole('button',{name:'درگاه‌های برخط',exact:true}).click();
  await page.getByRole('button',{name:'دریافت اندازه‌گیری',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'شناسه اندازه‌گیری باید عدد صحیح معتبر باشد.'}).waitFor();
  await page.route('**/api/ripe?**',route=>route.fulfill({json:{ok:true,median_rtt_ms:12.5,packet_loss_pct:0.1,probe_count:4,latest_timestamp:1750000000}}));
  await page.getByRole('textbox',{name:'شناسه اندازه‌گیری',exact:true}).fill('12345');
  await page.getByRole('button',{name:'دریافت اندازه‌گیری',exact:true}).click();
  await page.getByRole('heading',{name:'نتیجه اندازه‌گیری بیرونی RIPE Atlas',exact:true}).waitFor();
  if(!(await page.locator('.archive-tools').innerText()).includes('۱۲٫۵ ms'))throw Error('Gateway discarded measurement unit');
  await page.route('**/api/stock?**',route=>route.fulfill({status:503,body:'offline'}));
  await page.getByRole('button',{name:'دریافت قیمت از درگاه سرور',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'درگاه سرور متصل نیست'}).waitFor();
  if(await page.getByRole('heading',{name:'قیمت دریافت‌شده نماد همراه',exact:true}).count())throw Error('Disconnected gateway fabricated a quote');
  await tabs.getByRole('button',{name:'۲۸ صفحه گزارش',exact:true}).click();
  await page.getByRole('combobox',{name:'صفحه اصلی فصلنامه',exact:true}).selectOption('28');
  await page.getByRole('heading',{name:'متن استخراج‌شده صفحه 28 از فصلنامه ۵۷',exact:true}).waitFor();
  await page.getByRole('button',{name:'مشاهده تصویر اصلی همین صفحه',exact:true}).click();
  await page.waitForFunction(()=>{const image=document.querySelector('.original-report-image img');return image?.complete&&image.naturalWidth>0;});
  if(await page.locator('.original-report-image img').getAttribute('src')!==original.pdfPages.find(row=>row.n===28).img)throw Error('Wrong original report image');
  await page.screenshot({path:'visual-review/native-source-page.png',fullPage:false});
  await tabs.getByRole('button',{name:'شاخص‌های رسمی',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  if(await page.evaluate(()=>document.documentElement.scrollWidth)>392)throw Error('Native legacy library mobile overflow');
  if(errors.length)throw Error('Native legacy runtime: '+errors.join(' | '));
  console.log('PASS native legacy browser: exact 130 source values; pin/unpin persistence; full archive counts and search; calculator; scenario; original page 28; mobile width');
 }finally{await page.close();}
}
