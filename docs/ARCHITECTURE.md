# معماری مادر رادار اینترنت ایران

وضعیت: تصمیم معماری V10، 2026-10-16. این سند **طرح هدف** است، نه ادعای پیاده‌سازی کامل.

## مرز دو مخزن
- **این مخزن عمومی** (`neisiani531-cyber/iran-internet-radar-v10`): کد محصول، قراردادهای داده عمومی، مستندات، تست، CI و بسته انتشار.
- **مخزن پژوهشی خصوصی** (`neisiani53-create/iran-internet-research`): منابع خام، متن گزارش‌ها، شواهد، تعارض‌ها، گیت‌های Q0–Q5، داده‌های بالقوه حساس و یادداشت‌های پژوهشی.
- انتقال به مخزن عمومی فقط از طریق **خروجی مشتق‌شده قابل انتشار** و با ثبت منشأ، تاریخ، واحد، مخرج و status انجام می‌شود.

## ساختار هدف (هنوز همه پوشه‌ها ایجاد نشده‌اند)
```text
apps/
  web/             # React / TypeScript / Vite, RTL
  api/             # Python FastAPI, read-only published snapshot APIs
packages/
  contracts/       # JSON Schema, metric definitions, TypeScript types
  charts/          # shared chart adapters and visual QA
data/
  public/          # explicitly admitted non-sensitive snapshots only
  manifests/       # checksum, provenance, source revision, admission status
tests/
  e2e/             # Playwright, RTL, mobile, filtering, navigation
  contracts/       # cross-language schema consistency
docs/
  decisions/       # ADRs and migration gates
.github/workflows/
```

## حوزه‌های داده
۱. نمای ملی؛ ۲. زیرساخت و دسترسی؛ ۳. کیفیت؛ ۴. کاربر و رفتار؛ ۵. سکوها و شبکه‌های اجتماعی؛ ۶. رضایت و تجربه؛ ۷. اقتصاد و بازار؛ ۸. تاب‌آوری؛ ۹. حکمرانی؛ ۱۰. پژوهش و شواهد.

## قرارداد اصلی مشاهده
`metric_id`, `value`, `unit`, `period_start`, `period_end`, `geography`, `population`, `denominator`, `method`, `source_id`, `source_version`, `page`, `quality_gate`, `publication_status`, `limitations`.

ارزش‌های وضعیت باید با semantics داده همخوان باشند: `APPROVED_PUBLIC`، `RESEARCH_PREVIEW`، `HOLD_NUMERIC`، `BLOCKED`. صرف ورود به مخزن عمومی یا پاس شدن Build به معنی اعتبار علمی نیست.

## قرارداد فرانت و API
- API فقط شاخص‌های منتشرشدنی را برای صفحه KPI رسمی برمی‌گرداند؛ شواهد پژوهشی دارای مسیر و نمایش تفکیک‌شده هستند.
- فیلترها از URL قابل بازیابی‌اند و فقط مقایسه‌های هم‌تعریف را مجاز می‌کنند.
- هیچ سری زمانی از میان‌یابی یا پر کردن فصل‌های فاقد منبع ساخته نمی‌شود.
- نمایش درصد نیازمند مخرج روشن است؛ رتبه ترتیبی هرگز به تعداد تبدیل نمی‌شود.
- داده خام کاربری/پست‌های شبکه‌های اجتماعی/اطلاعات خصوصی در بسته عمومی قرار نمی‌گیرد.

## گیت‌های پذیرش محصول
G0 موجودی و طبقه‌بندی داده؛ G1 schema و provenance؛ G2 تست واحد API؛ G3 Build و typecheck؛ G4 E2E RTL و موبایل؛ G5 حفظ قابلیت‌های نسخه قدیم؛ G6 کنترل علمی نشر و شواهد؛ G7 انتشار امضاشده و برگشت‌پذیر.

**وضعیت فعلی:** تنها Bootstrap React با دو دوره داده در ریشه مخزن و یک CI Build ثبت شده است. انتقال FastAPI و ۱۰ حوزه هنوز وظیفه آینده است.
