# رادار فرماندهی شبکه ملی اطلاعات · نسخه ۴

دو خروجی از یک کد ساخته می‌شود. نسخه **آفلاین** یک فایل HTML تک است که همه داده‌ها (تصویر ۶ آبان ۱۴۰۵) در خودش دارد و بدون اینترنت باز می‌شود. نسخه **متصل** همان فایل است که نشانی سرور رادار در تنظیمات دستیار به آن داده شده؛ پایش آنلاین و دستیار مدل‌محور از سرور خوانده می‌شوند و کلیدها فقط روی سرور می‌مانند.

## اجرای نسخه آفلاین

فایل `dist/Radar_NII_Command_v4.html` را در مرورگر باز کنید. نشانی صفحه وضعیت کامل را نگه می‌دارد (بخش، حوزه، مجموعه، جست‌وجو، مرتب‌سازی، صفحه، کاربرگ، رکورد)، پس بازخوانی، دکمه بازگشت و پیوند مستقیم همان نما را بازمی‌سازند.

## انتشار روی سرور

حجم فایل ۱٫۸۷ مگابایت است و فشرده‌شده حدود ۴۶۰ کیلوبایت. در Caddy فشرده‌سازی را روشن کنید تا همین مقدار منتقل شود:

```
radar.example.ir {
    encode zstd gzip
    root * /home/ubuntu/services/radar-v42
    file_server
}
```

## ساخت دوباره فایل

```bash
cd apps/command-v4
npm install            # d3 7.9.0 و Vazirmatn 5.0.17
python3 build.py       # خروجی: dist/Radar_NII_Command_v4.html
npm run bundle         # بسته داده دستیار سرور: packages/contracts/radar-bundle-v4.json
```

## اجرای سرور (نسخه متصل)

```bash
cd apps/api
pip install -r requirements.txt
cp .env.example .env   # کلیدها را فقط این‌جا وارد کنید
set -a; . ./.env; set +a
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

سپس در فایل HTML، دستیار ← تنظیمات ← نشانی سرور را وارد کنید (مثلاً `https://radar-api.example.ir`). اگر فایل را از روی دیسک باز می‌کنید، `null` را به `RADAR_CORS_ORIGINS` اضافه کنید.

گردآوری داده آنلاین دو راه دارد: `RADAR_ONLINE_SCHEDULER=1` تا سرور هر منبع را در تناوب مجازش بخواند، یا فراخوانی دستی:

```bash
curl -X POST -H "X-Radar-Admin-Token: $RADAR_ADMIN_TOKEN" -H "Content-Type: application/json" \
     -d '{"source":"ioda"}' http://localhost:8000/api/v1/online/collect
```

مسیرهای تازه:

| مسیر | کار |
|---|---|
| `GET /api/v1/online/sources` | وضعیت هر منبع: آخرین تلاش، آخرین موفقیت، تازگی، خطا، نسخه مبدل |
| `GET /api/v1/online/observations?range=24h\|7d\|30d&source=&asn=&vantage=&destination=` | سری‌ها و رخدادهای ذخیره‌شده |
| `GET /api/v1/online/health` | منابع فعال، ناموفق و نیازمند کلید |
| `POST /api/v1/online/collect` | اجرای گردآورنده (نیازمند توکن مدیر) |
| `GET /api/v1/online/status` | داوری آشکارساز DETECT_V1 برای هر لایه و هر سری، رخدادهای باز (نسخه ۴٫۶) |
| `GET /api/v1/online/incidents` · `/incidents/{id}` · `POST /incidents/{id}/ack` | رخدادها، جزئیات و «دیده شد» |
| `POST /api/v1/online/evaluate` · `GET /api/v1/online/alerts` | اجرای دستی تشخیص و هشدارهای صادرشده |
| `GET /api/v1/online/register` | رجیستر رخدادهای سایبری گزارش‌شده با سطح شاهد |

قاعده‌ها، شدت، هشدار و ممیزی داده: `docs/v4/ONLINE_MONITORING_v46.md`.
| `GET /api/v2/assistant/health` | پیکربندی مدل، جست‌وجوی وب و بسته داده |
| `POST /api/v2/assistant/chat` | دستیار با ابزار: `{question, history, page_state, allow_web}` |

## شواهد پذیرش روی سرور

این مرحله شرط پذیرش بخش آنلاین و دستیار است و باید روی همان سروری اجرا شود که به اینترنت و کلیدها دسترسی دارد:

```bash
cd apps/api && set -a && . ./.env && set +a
python scripts/v4_acceptance.py
```

هر گردآورنده را با منبع واقعی اجرا می‌کند (بازه زمان مشاهده، زمان دریافت، شمار سطر، sha256 پاسخ خام)، سه حالت خرابی را می‌آزماید (قطع سرویس، داده کهنه، نبود کلید)، و سه پرسش را از مدل واقعی می‌پرسد: پرسش داخلی با ارجاع، پرسش تازه با جست‌وجوی وب، و پرسش بی‌پشتوانه. خروجی در `apps/api/evidence/` به‌صورت JSON و Markdown ذخیره می‌شود. کد خروج صفر یعنی حالت‌های خرابی و دستیار قبول شده‌اند و دست‌کم یک منبع بدون کلید داده تازه داده است.

## آزمون‌ها

```bash
cd apps/api && python -m pytest -q                                 # ۷۷ آزمون، بدون شبکه
cd apps/command-v4 && npm test                                     # ناوبری، صفحه‌بندی، شناسنامه، ۱۵ پرسش دستیار
PYTHONPATH=apps/api python apps/api/tests/e2e_server.py 8765 &      # سرور آزمون با داده fixture و مدل اسکریپتی
cd apps/command-v4 && npm run test:connected                       # نسخه متصل
```

`tests/e2e_server.py` فقط برای آزمون است: پاسخ منابع را با transport ساختگی شبیه‌سازی می‌کند و هرگز در استقرار استفاده نمی‌شود.
