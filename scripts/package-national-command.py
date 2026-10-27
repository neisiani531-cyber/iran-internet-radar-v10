from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1];dist=root/'dist';out=root/'deliverables';out.mkdir(exist_ok=True)
index=(dist/'index.html').read_text()
js_name=Path(re.search(r'<script[^>]+src="([^"]+)"',index).group(1)).name
css_name=Path(re.search(r'<link[^>]+href="([^"]+\.css)"',index).group(1)).name
js=(dist/'assets'/js_name).read_text();css=(dist/'assets'/css_name).read_text()
css=css[css.index(':root'):] if css.startswith('@import') else css
legacy=(root/'public/legacy/v9-17.html').read_text()
font=re.search(r'@font-face\{font-family:"RadarPersian";.*?\}',legacy)
if font:css+=font.group(0)+'body,.nc-root{font-family:RadarPersian,Tahoma,sans-serif}'
files={'data/'+p.name:p.read_text() for p in (root/'public/data').glob('*') if p.suffix in ['.json','.geojson']};files['legacy/v9-17.html']=legacy
payload=json.dumps(files,ensure_ascii=False).replace('<','\\u003c')
boot='<script id="offline-files" type="application/json">'+payload+'''</script><script>
const offlineFiles=JSON.parse(document.getElementById('offline-files').textContent),nativeFetch=window.fetch.bind(window);
window.fetch=async(input,init)=>{const url=String(input instanceof Request?input.url:input);for(const [key,text]of Object.entries(offlineFiles)){if(url.split('?')[0].endsWith('/'+key))return new Response(text,{status:200,headers:{'Content-Type':key.endsWith('.html')?'text/html':'application/json'}})}if(location.protocol==='file:'&&(url.includes('/api/')||url.startsWith('/')))throw new Error('این قابلیت به سرویس آنلاین نیاز دارد');return nativeFetch(input,init)};
new MutationObserver(()=>document.querySelectorAll('iframe').forEach(f=>{if(f.getAttribute('src')?.includes('legacy/v9-17.html')&&!f.dataset.offline){f.dataset.offline='1';f.srcdoc=offlineFiles['legacy/v9-17.html'];f.removeAttribute('src')}})).observe(document.documentElement,{childList:true,subtree:true});
</script>'''
index=re.sub(r'<script type="module"[^>]*src="[^"]+"[^>]*></script>','',index);index=re.sub(r'<link rel="stylesheet"[^>]*>','',index)
index=index.replace('</head>','<style>'+css+'</style></head>').replace('<title>رادار اینترنت ایران V10</title>','<title>رادار اینترنت ایران — فرماندهی هفت‌حوزه‌ای</title>')
index=index.replace('</body>',boot+'<script type="module">'+js.replace('</script','<\\/script')+'</script></body>')
path=out/'Iran_Internet_Radar_7_Domains.html';path.write_text(index);(root/'public/national-command-offline.html').write_text(index)
print(path);print('bytes',path.stat().st_size,'embedded files',len(files))
