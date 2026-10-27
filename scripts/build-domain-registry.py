import json
from pathlib import Path
from collections import Counter
root=Path(__file__).resolve().parents[1]
records=json.loads((root/'src/command-statistics.json').read_text())['records'];extra=json.loads((root/'src/command-infrastructure.json').read_text())
owners={'ثابت؛ قرارداد جاری':'communications','سیار؛ قرارداد جاری':'communications','کیفیت اتصال':'communications','RTT و Jitter':'communications','تاریخچه سیار':'communications','پیمایش ملت':'people','سکوها؛ شش‌ماهه':'base','سکوها؛ مرداد':'base','سکوها؛ نقل تکمیلی':'base'}
themes={'experience':'people','access':'people','economy':'people','regional':'people','citizen':'people','resilience':'security','governance':'governance','platforms':'base','mobile':'communications','fixed':'communications','operators':'communications','isps':'communications','quality':'communications','reach':'communications','overview':'communications','services':'communications','other':'applications','infrastructure':'communications'}
overrides={
 **{k:'security' for k in ['EXT-ISOC-19','EXT-AKAM-01','EXT-AKAM-02','EXT-AKAM-03','EXT-CFBGP-01','EXT-CFBGP-02','EXT-CFBGP-03']},
 **{k:'information' for k in ['ISP-HIWEB-DC','EXT-ISOC-04','EXT-ISOC-05']},
 **{k:'governance' for k in ['ISP-ASIATECH-PE','ISP-ASIATECH-EPS','ISP-HIWEB-LOSS','DATAAK-LOW','DATAAK-MID','DATAAK-HIGH','EXT-WB-10','EXT-WB-11']},
 **{k:'applications' for k in ['EXT-WB-07','EXT-WB-08','EXT-WB-09','EXT-WB-05','EXT-WB-06','EXT-ISOC-20']}}
entries={};unmapped=[]
for r in records+extra:
 raw=r['raw'];rid=r['row_id'];key=r['section']+'::'+rid;domain=None;rule='';theme=str(raw.get('theme',raw.get('group','')))
 if r['section'] in owners:domain=owners[r['section']];rule='SOURCE_CONTRACT_OWNER'
 elif r in extra:domain=r['layer'];rule='STRUCTURED_PACKAGE_OWNER'
 elif r['section'] in ['رسمی نسخه ۹٫۱۷','شواهد نسخه ۹٫۱۷']:
  if rid in overrides:domain=overrides[rid];rule='EXPLICIT_ID_OVERRIDE'
  elif rid.startswith('CRA57-SAT-') or rid.startswith('CRA57-4G-SITES-'):domain='communications';rule='EXPLICIT_TECHNICAL_FAMILY'
  elif rid.startswith('CRA57-POSTAL-') or rid=='CRA57-ICT-RURAL':domain='applications';rule='EXPLICIT_SERVICE_FAMILY'
  elif theme in themes:domain=themes[theme];rule='DECLARED_SOURCE_THEME'
 if not domain:unmapped.append(key)
 assert key not in entries,key
 entries[key]=dict(domain=domain,status='MAPPED' if domain else 'UNASSIGNED',rule=rule or 'REQUIRES_REVIEW',source_section=r['section'],record_id=rid)
assert not unmapped,unmapped
technical=[r for r in records if r['section'] in ['ثابت؛ قرارداد جاری','سیار؛ قرارداد جاری','کیفیت اتصال','RTT و Jitter','تاریخچه سیار']]
assert len(technical)==123
assert all(entries[r['section']+'::'+r['row_id']]['domain']=='communications' for r in technical)
registry=dict(version='1.0.0',policy='Runtime uses exact source-section and record ID. Unknown future records remain UNASSIGNED; no default governance mapping.',entries=entries)
(root/'src/domain-registry.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
summary=dict(records=len(entries),unassigned=len(unmapped),technical_contract_rows_corrected=len(technical),by_domain=dict(Counter(e['domain'] for e in entries.values())),checks=dict(no_default_governance=True,all_123_technical_rows_communications=True,all_keys_unique=True,all_source_rows_retained=True))
(root/'docs/audits/DOMAIN_REGISTRY_QA.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(summary)
