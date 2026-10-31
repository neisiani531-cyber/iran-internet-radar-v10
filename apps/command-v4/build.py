"""Builds dist/Radar_NII_Command_v4.html: one offline file with d3, Vazirmatn, data snapshot and province geometry inlined."""
import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC, NM = ROOT / 'src', ROOT / 'node_modules'
JS = ('core.js', 'codes.js', 'charts.js', 'viz.js', 'views.js', 'model.js', 'v3.js', 'ui.js', 'online.js', 'nin.js', 'changes.js', 'assistant.js', 'findings.js', 'report.js', 'report_view.js', 'report_export.js', 'guide.js', 'app.js', 'english_catalog.js', 'preferences.js')

fontdir = NM / '@fontsource/vazirmatn/files'
faces = ''
for sub, rng in (('arabic', 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC'),
                 ('latin', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')):
    for w in ((300, 400, 500, 700) if sub == 'arabic' else (400, 500, 700)):
        b = base64.b64encode((fontdir / f'vazirmatn-{sub}-{w}-normal.woff2').read_bytes()).decode()
        faces += f'@font-face{{font-family:"Vazirmatn";font-style:normal;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b}) format("woff2");unicode-range:{rng}}}\n'
# d3 v7.9.0, only the modules the dashboard uses (vendor/d3.slim.entry.js, bundled with esbuild 0.23.1):
#   npx esbuild vendor/d3.slim.entry.js --bundle --minify --format=iife --global-name=d3 --outfile=vendor/d3.slim.min.js
d3 = (ROOT / 'vendor/d3.slim.min.js').read_text()
data = (SRC / 'data3.json').read_text()
geo = (SRC / 'prov_d3.geojson').read_text()
nin = (SRC / 'nin.json').read_text()
# curated cyber-incident register: single source of truth lives with the server (apps/api/app/online/cyber_register.json)
cyber = (ROOT.parent / 'api' / 'app' / 'online' / 'cyber_register.json').read_text()
js = '\n'.join((SRC / f).read_text() for f in JS)
css = (SRC / 'styles.css').read_text()
# full Vazirmatn 33.0.3 TTF (npm vazirmatn@33.0.3, SIL OFL) for the report studio's «دریافت فونت» button
fontfiles = '{' + ','.join(f'"{p.name}":"' + base64.b64encode(p.read_bytes()).decode() + '"' for p in sorted((ROOT / 'vendor/fonts').glob('*.ttf'))) + ',"OFL.txt":' + __import__('json').dumps((ROOT / 'vendor/fonts/OFL.txt').read_text()) + '}'
html = f'''<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data: blob:; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; base-uri 'none'; form-action 'none'; object-src 'none'"><script>try{{var rp=JSON.parse(localStorage.getItem('radarPresentation.v1')||'{{}}');window.RADAR_PRESENTATION=rp;document.documentElement.lang=rp.lang==='en'?'en':'fa';document.documentElement.dir=rp.lang==='en'?'ltr':'rtl';document.documentElement.dataset.theme=rp.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):(rp.theme==='light'?'light':'dark')}}catch(e){{}}</script><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>رادار فرماندهی شبکه ملی اطلاعات</title>
<meta name="description" content="داشبورد تحلیلی و فرماندهی شبکه ملی اطلاعات بر پایه فصلنامه ۵۷ رگولاتوری، پایش تابستان ۱۴۰۵، فایل‌های استانی و شواهد پژوهشی">
<style>{faces}{css}</style>
</head><body><div id="root"></div>
<script>{d3}</script>
<script>window.RADAR_DATA={data};window.RADAR_GEO={geo};window.RADAR_NIN={nin};window.RADAR_CYBER={cyber};window.RADAR_FONT_FILES={fontfiles};</script>
<script>{js}</script>
</body></html>'''
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'Radar_NII_Command_v4.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html)
print(out, len(html.encode()) // 1024, 'KB')
