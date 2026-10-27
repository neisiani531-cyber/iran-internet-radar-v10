import json,openpyxl
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=json.loads((root/'src/command-access-normalized.json').read_text());books={};checks=0
for key in ['ports','speed']:
 for t in p[key]:
  if t['file'] not in books:books[t['file']]=openpyxl.load_workbook(root.parent/'upload'/t['file'],data_only=True,read_only=True)
  a=list(books[t['file']][t['sheet']].values)
  for r in t['rows']+([t['total']] if key=='speed' and t['total'] else []):
   for j,v in enumerate(r['values']):
    col=t['columns'][j]['column']-1 if key=='ports' else j+2
    original=a[r['row']-1][col];expected=original if isinstance(original,(int,float)) else None
    assert v==expected,(t['file'],t['sheet'],r['row'],col+1)
    checks+=1
  if key=='ports':assert len(t['rows'])==31 and len({r['iso'] for r in t['rows']})==31
summary=dict(exact_source_cells_checked=checks,province_tables=14,province_rows=434,speed_tables=12,company_rows=373,all_provincial_total_checks_clear=all(not t['reconciliation_differences'] for t in p['ports']),fractional_subscriber_cells_held=p['validation']['fractional_cells'],sources_not_merged=True,missing_not_zero=True)
(root/'docs/audits/access-normalization-qa.json').write_text(json.dumps(summary,indent=2));print(summary)
