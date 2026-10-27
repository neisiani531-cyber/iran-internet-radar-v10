from pathlib import Path
import openpyxl,json,hashlib,datetime
root=Path(__file__).resolve().parents[1];upload=root.parent/'upload';files=[]
for p in sorted(upload.glob('*.xlsx')):
 w=openpyxl.load_workbook(p,read_only=True,data_only=True);sheets=[]
 for s in w:
  cells=[]
  for row in s:
   for c in row:
    if c.value is not None:
     v=c.value.isoformat() if isinstance(c.value,(datetime.date,datetime.datetime)) else c.value
     cells.append([c.row,c.column,v])
  sheets.append(dict(name=s.title,rows=s.max_row,columns=s.max_column,cells=cells))
 files.append(dict(name=p.name,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),status='USER_SUPPLIED_WORKBOOK_NOT_INDEPENDENTLY_VERIFIED',sheets=sheets))
monitor=next(x for x in files if x['name'].startswith('Monitoring'))['sheets'][0];lookup={(r,c):v for r,c,v in monitor['cells']}
traffic=[]
for r in range(5,11):
 vals=[lookup.get((r,c)) for c in [6,7,8,9]]
 if isinstance(vals[2],(int,float)) and isinstance(vals[3],(int,float)):
  traffic.append(dict(label=vals[1] or vals[0],domestic=vals[2],international=vals[3],row=r))
# Only rows with explicit service headings and numeric H values become quality observations.
quality=[];metric='';op=''
for r in range(1,monitor['rows']+1):
 if isinstance(lookup.get((r,4)),str) and lookup[(r,4)] not in ['رديف','ردیف']:metric=lookup[(r,4)]
 if lookup.get((r,6)) is not None:op=str(lookup[(r,6)])
 if isinstance(lookup.get((r,8)),(int,float)) and r>15:
  quality.append(dict(metric=metric,operator=op,dimension=lookup.get((r,7)),value=lookup[(r,8)],cell=f'H{r}'))
result=dict(files=files,traffic=traffic,quality=quality,scope='Files kept separate; no combined market total; speed-service bands are not measured throughput',sheet_count=sum(len(f['sheets']) for f in files),cell_count=sum(len(s['cells']) for f in files for s in f['sheets']))
(root/'src/command-workbooks.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
print({k:result[k] for k in ['sheet_count','cell_count']});print('quality',len(quality),'traffic',traffic)
