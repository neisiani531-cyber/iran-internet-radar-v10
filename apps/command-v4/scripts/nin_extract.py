"""Extract the NIN operational-goal evaluation workbook (NIN1400-1404.xlsx) into src/nin.json.

Layout (verified against the workbook, see docs/v4/NIN_DATA.md):
  Sheet1  A goal no · B goal · C indicator · D owner · E code
          F goal progress 1400 (0-100)
          G indicator performance 1401 (0-100) · H goal progress 1401 (0-100)
          I indicator performance 1402 (0-1)   · J goal progress 1402 (0-100, "approved by NCC")
          K indicator performance 1403 (0-1)   · L goal progress 1403 (0-1)
          row 116: overall NIN progress, F=1400, G:H=1401, I:J=1402, K:L=1403
  Sheet2  F weight 1400 & 1401 · G weight (header says 1403; reconciles with 1402) · H weight 1403
          I/J formula & parameters 1401 · K/L 1402 · M/N 1403
Values are copied, never edited; units are normalised to percent and the original cell is kept.

Optional third argument: the 1404-1405 workbook (NIN.1405.07.xlsx). Its data is ADDED as the years 1404 and 1405 to the same structure;
nothing of 1400-1403 changes. Column layout of that workbook (sheet 1 = indicators, 2 = goals, 3 = axes):
  sheet 1  A goal no · B goal · C goal weight · D indicator · E owner · F code · G indicator weight in goal
           W = 1404/12 (owner confirms: ministry self-assessment, the raw "plan" label is a template label)
           AM..AX = 1405/01..12 (AR = 1405/06), AJ formula · AK parameters · AL parameter values
  sheet 2  goal progress: F..Q = 1404/01..12, R..AC = 1405/01..12 · D axis code
  sheet 3  axis / national progress: D..O = 1404/01..12, P..AA = 1405/01..12 · row code 100 = national
Text cells such as "100/00%" are read as numbers and listed in `text_cells`; they are never replaced silently.
"""
import hashlib
import json
import re
import statistics
import sys
from pathlib import Path

import openpyxl

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[3] / 'data/nin/NIN1400-1404.xlsx'
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parents[1] / 'src/nin.json'
YEARS = ['1400', '1401', '1402', '1403']
EXT = Path(sys.argv[3]) if len(sys.argv) > 3 else None
NEW_YEARS = ['1404', '1405']
EXT_COL = {'1404': 22, '1405': 43}  # 0-based column of the indicator workbook: W = 1404/12, AR = 1405/06
GOAL_COL = {'1404': 16, '1405': 22}  # goals sheet: Q = 1404/12, W = 1405/06
AXIS_COL = {'1404': 14, '1405': 20}  # axes sheet: O = 1404/12, U = 1405/06

wb = openpyxl.load_workbook(SRC)
s1, s2 = wb['Sheet1'], wb['Sheet2']


def clean(v):
    return re.sub(r'\s+', ' ', str(v)).strip() if v is not None and str(v).strip() not in ('', '__') else None


def num(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).strip())
    except ValueError:
        return None


def cell(ws, col, r):
    v = ws[f'{col}{r}'].value
    return {'ref': f'{ws.title}!{col}{r}', 'raw': v if isinstance(v, (int, float)) or v is None else str(v)}


GOAL_PROG = {'1400': ('F', 1), '1401': ('H', 1), '1402': ('J', 1), '1403': ('L', 100)}
PERF = {'1401': ('G', 1), '1402': ('I', 100), '1403': ('K', 100)}
WEIGHT = {'1401': 'F', '1402': 'G', '1403': 'H'}
FORM = {'1401': ('I', 'J'), '1402': ('K', 'L'), '1403': ('M', 'N')}

goals, cur = [], None
for r in range(4, 116):
    a = s1[f'A{r}'].value
    if a is not None and str(a).strip():
        cur = {'no': int(a), 'title': clean(s1[f'B{r}'].value), 'row': r, 'progress': {}, 'progress_cell': {}, 'indicators': []}
        for y, (c, k) in GOAL_PROG.items():
            ce = cell(s1, c, r)
            cur['progress_cell'][y] = ce
            v = num(ce['raw'])
            cur['progress'][y] = None if v is None else round(v * k, 4)
        goals.append(cur)
    title = clean(s1[f'C{r}'].value) or ''
    code = clean(s1[f'E{r}'].value)
    ind = {'code': code, 'code_sheet2': clean(s2[f'E{r}'].value), 'goal': cur['no'], 'row': r, 'title': title,
           'owner': clean(s1[f'D{r}'].value), 'owner_sheet2': clean(s2[f'D{r}'].value),
           'perf': {}, 'perf_cell': {}, 'weight': {}, 'weight_cell': {}, 'formula': {}, 'params': {},
           'flags': []}
    for y, (c, k) in PERF.items():
        ce = cell(s1, c, r); ind['perf_cell'][y] = ce
        v = num(ce['raw']); ind['perf'][y] = None if v is None else round(v * k, 4)
    for y, c in WEIGHT.items():
        ce = cell(s2, c, r); ind['weight_cell'][y] = ce; ind['weight'][y] = num(ce['raw'])
    for y, (cf, cp) in FORM.items():
        ind['formula'][y] = clean(s2[f'{cf}{r}'].value)
        ind['params'][y] = clean(s2[f'{cp}{r}'].value)
    if 'تغییر یافته' in title or 'تغییر یافت' in title:
        ind['flags'].append('definition_changed')
    if 'حذف' in title:
        ind['flags'].append('removed_later')
    if 'جدید' in title or ind['code_sheet2'] == 'جدید':
        ind['flags'].append('new_indicator')
    if not ind['owner']:
        ind['flags'].append('owner_missing_sheet1')
    if ind['owner'] and ind['owner_sheet2'] and ind['owner'] != ind['owner_sheet2']:
        ind['flags'].append('owner_differs_between_sheets')
    ws_ = [ind['weight'][y] for y in WEIGHT]
    if len({w for w in ws_ if w is not None}) > 1:
        ind['flags'].append('weight_changed')
    cur['indicators'].append(ind)

# ---------------------------------------------------------------------------------------------------------
# Extension: years 1404 and 1405 from NIN.1405.07.xlsx, added to the same structures
# ---------------------------------------------------------------------------------------------------------
ext_meta = None
axes_ext = []
if EXT:
    from openpyxl.utils import get_column_letter as L_

    def parse_pct(x):
        """(percent|None, is_text). 0.85 -> 85; '100/00%' -> 100 (text); '23.69%' -> 23.69 (text)."""
        if x is None or x == '':
            return None, False
        if isinstance(x, bool):
            return None, False
        if isinstance(x, (int, float)):
            return float(x) * 100, False
        t = str(x).strip().replace('٪', '%')
        m = re.fullmatch(r'([\d.]+)\s*/\s*(\d+)\s*%', t)
        if m:
            return float(f'{m.group(1)}.{m.group(2)}'), True
        m = re.fullmatch(r'([\d.]+)\s*%', t)
        if m:
            return float(m.group(1)), True
        try:
            return float(t) * 100, True
        except ValueError:
            return None, False

    ewb = openpyxl.load_workbook(EXT, data_only=True)
    e1, e2, e3 = ewb.worksheets[0], ewb.worksheets[1], ewb.worksheets[2]
    n1, n2, n3 = e1.title.strip(), e2.title.strip(), e3.title.strip()
    by_no = {g['no']: g for g in goals}
    by_code = {i['code']: i for g in goals for i in g['indicators'] if i['code']}
    seen = set()

    def blank_ind(code, gno, row, title, owner):
        return {'code': code, 'code_sheet2': None, 'goal': gno, 'row': row, 'title': title, 'owner': owner, 'owner_sheet2': None,
                'perf': {y: None for y in ('1401', '1402', '1403')}, 'perf_cell': {y: {'ref': None, 'raw': None} for y in ('1401', '1402', '1403')},
                'weight': {y: None for y in ('1401', '1402', '1403')}, 'weight_cell': {y: {'ref': None, 'raw': None} for y in ('1401', '1402', '1403')},
                'formula': {y: None for y in ('1401', '1402', '1403')}, 'params': {y: None for y in ('1401', '1402', '1403')}, 'flags': ['new_indicator']}

    cur_no = None
    for ri, r in enumerate(e1.iter_rows(min_row=1, values_only=True), start=1):
        if ri < 5:
            continue
        if r[1]:
            cur_no = int(r[0]); title_g = clean(r[1])
            if cur_no not in by_no:
                by_no[cur_no] = {'no': cur_no, 'title': title_g, 'row': None, 'progress': {y: None for y in YEARS}, 'progress_cell': {y: {'ref': None, 'raw': None} for y in YEARS}, 'indicators': [], 'new_goal': True}
                goals.append(by_no[cur_no])
            by_no[cur_no]['gweight'] = float(r[2]) if r[2] is not None else None
        if not (r[3] and r[5] is not None):
            continue
        code = str(int(r[5])) if isinstance(r[5], (int, float)) else str(r[5]).strip()
        ind = by_code.get(code)
        if ind is None:
            ind = blank_ind(code, cur_no, ri, clean(r[3]) or '', clean(r[4]))
            by_no[cur_no]['indicators'].append(ind); by_code[code] = ind
        seen.add(code)
        for y in NEW_YEARS:
            raw = r[EXT_COL[y]]
            v, is_text = parse_pct(raw)
            ref = f'{n1}!{L_(EXT_COL[y] + 1)}{ri}'
            ind['perf_cell'][y] = {'ref': ref, 'raw': raw if isinstance(raw, (int, float)) or raw is None else str(raw)}
            ind['perf'][y] = None if v is None else round(v, 4)
            ind['weight'][y] = float(r[6]) if r[6] is not None else None
            ind['weight_cell'][y] = {'ref': f'{n1}!G{ri}', 'raw': r[6]}
            ind['formula'][y] = clean(r[35])
            ind['params'][y] = clean(r[36])
            if is_text:
                ind.setdefault('text_cells', {})[y] = ref
        w = [ind['weight'][y] for y in ('1403', '1404', '1405') if ind['weight'].get(y) is not None]
        if len({round(x, 6) for x in w}) > 1 and 'weight_changed' not in ind['flags']:
            ind['flags'].append('weight_changed')
    for code, ind in by_code.items():
        if code not in seen:
            for y in NEW_YEARS:
                ind['perf'][y] = None; ind['weight'][y] = None; ind['formula'][y] = None; ind['params'][y] = None
                ind['perf_cell'][y] = {'ref': None, 'raw': None}; ind['weight_cell'][y] = {'ref': None, 'raw': None}
            if 'not_in_new_file' not in ind['flags']:
                ind['flags'].append('not_in_new_file')
    for g in goals:
        for ind in g['indicators']:
            for y in NEW_YEARS:
                ind['perf'].setdefault(y, None)
    # goal progress (goals sheet) and goal -> axis
    for ri, r in enumerate(e2.iter_rows(min_row=1, values_only=True), start=1):
        if ri < 3 or r[0] is None or r[1] is None or not str(r[0]).strip().isdigit():
            continue
        g = by_no.get(int(r[0]))
        if not g:
            continue
        g['axis'] = int(r[3]) if r[3] else None
        for y in NEW_YEARS:
            raw = r[GOAL_COL[y]]
            g['progress_cell'][y] = {'ref': f'{n2}!{L_(GOAL_COL[y] + 1)}{ri}', 'raw': raw if isinstance(raw, (int, float)) or raw is None else str(raw)}
            v, _ = parse_pct(raw)
            g['progress'][y] = None if v is None else round(v, 4)
    for g in goals:
        for y in NEW_YEARS:
            g['progress'].setdefault(y, None); g['progress_cell'].setdefault(y, {'ref': None, 'raw': None})
    # axes and national
    ext_overall = {}
    for ri, r in enumerate(e3.iter_rows(min_row=1, values_only=True), start=1):
        if ri < 3 or r[0] is None or r[1] is None or not str(r[0]).strip().isdigit():
            continue
        code = int(r[0])
        if code == 100:
            for y in NEW_YEARS:
                v, _ = parse_pct(r[AXIS_COL[y]])
                ext_overall[y] = {'value': None if v is None else round(v, 4), 'cell': f'{n3}!{L_(AXIS_COL[y] + 1)}{ri}'}
        else:
            ax = {'no': code, 'title': clean(r[1]), 'weight': round(float(r[2]), 4), 'progress': {}, 'cell': {}}
            for y in NEW_YEARS:
                v, _ = parse_pct(r[AXIS_COL[y]])
                ax['progress'][y] = None if v is None else round(v, 4); ax['cell'][y] = f'{n3}!{L_(AXIS_COL[y] + 1)}{ri}'
            axes_ext.append(ax)
    ext_meta = {'file': EXT.name, 'sha256': hashlib.sha256(EXT.read_bytes()).hexdigest(), 'sheets': [n1, n2, n3]}
    YEARS = YEARS + NEW_YEARS
    PERF_YEARS = ['1401', '1402', '1403'] + NEW_YEARS
else:
    PERF_YEARS = ['1401', '1402', '1403']

overall = {}
for y, c in {'1400': 'F', '1401': 'G', '1402': 'I', '1403': 'K'}.items():
    overall[y] = {'value': num(s1[f'{c}116'].value), 'cell': f'Sheet1!{c}116'}

if EXT:
    overall.update(ext_overall)

# reconciliation: goal progress = sum(weight x indicator performance)
issues = []
for g in goals:
    g['recomputed'], g['weight_sum'], g['contrib'] = {}, {}, {}
    for y in PERF_YEARS:
        parts = [(i['code'], i['weight'][y], i['perf'][y]) for i in g['indicators']]
        wsum = sum(w for _, w, _ in parts if w)
        missing = [c for c, w, p in parts if w and p is None]
        calc = sum(w * p for _, w, p in parts if w and p is not None) if wsum else None
        g['recomputed'][y] = None if calc is None else round(calc, 4)
        g['weight_sum'][y] = round(wsum, 4)
        rep = g['progress'][y]
        if wsum and abs(wsum - 1) > 0.005:
            issues.append({'kind': 'weights_not_100', 'goal': g['no'], 'year': y, 'weight_sum': round(wsum, 3)})
        if missing:
            issues.append({'kind': 'weighted_indicator_without_value', 'goal': g['no'], 'year': y, 'codes': missing})
        if rep is not None and calc is not None and abs(rep - calc) > 1.0:
            iss = {'kind': 'reported_differs_from_recomputed', 'goal': g['no'], 'year': y, 'reported': rep, 'recomputed': round(calc, 2),
                   'cell': g['progress_cell'][y]['ref']}
            txt = [i['code'] for i in g['indicators'] if y in i.get('text_cells', {})]
            if txt:
                zero = sum(i['weight'][y] * (0 if y in i.get('text_cells', {}) else i['perf'][y]) for i in g['indicators'] if i['weight'][y] and i['perf'][y] is not None)
                iss['text_codes'] = txt; iss['text_as_zero'] = round(zero, 2)
                iss['cause'] = 'text_cells_as_zero' if abs(zero - rep) < 0.05 else 'text_cells_present_not_explaining'
            issues.append(iss)
        if rep is None and wsum:
            issues.append({'kind': 'goal_progress_missing', 'goal': g['no'], 'year': y})
for y in YEARS:
    vals = [g['progress'][y] for g in goals if g['progress'][y] is not None]
    mean = statistics.mean(vals)
    overall[y].update({'goals_with_value': len(vals), 'mean_of_goals': round(mean, 2), 'median_of_goals': round(statistics.median(vals), 2)})
    if y in NEW_YEARS:
        continue
    if overall[y]['value'] is not None and abs(overall[y]['value'] - mean) > 1:
        issues.append({'kind': 'overall_not_simple_mean', 'year': y, 'reported': overall[y]['value'], 'mean_of_goals': round(mean, 2)})

# three totals for 1404/1405: reported (axes sheet) / goal-weighted (goals sheet) / indicator rebuild; axis-level gaps
if EXT:
    gw = {g['no']: g.get('gweight') for g in goals}
    for y in NEW_YEARS:
        goals_w = sum(gw[g['no']] * g['progress'][y] for g in goals if g['progress'][y] is not None and gw.get(g['no'])) / 100
        ind_w = sum(gw[g['no']] * g['recomputed'][y] for g in goals if g['recomputed'].get(y) is not None and gw.get(g['no'])) / 100
        axes_w = sum(a['weight'] * a['progress'][y] for a in axes_ext if a['progress'][y] is not None) / 100
        overall[y].update({'goals_weighted': round(goals_w, 4), 'indicators_rebuild': round(ind_w, 4), 'axes_weighted': round(axes_w, 4)})
        if abs(overall[y]['value'] - ind_w) > 0.05 or abs(overall[y]['value'] - goals_w) > 0.05:
            issues.append({'kind': 'overall_three_totals', 'year': y, 'reported': overall[y]['value'], 'goals_weighted': round(goals_w, 2), 'indicators_rebuild': round(ind_w, 2),
                           'axes_weighted': round(axes_w, 2), 'cell': overall[y]['cell']})
        for a in axes_ext:
            gl = [g for g in goals if g.get('axis') == a['no'] and g['recomputed'].get(y) is not None and gw.get(g['no'])]
            den = sum(gw[g['no']] for g in gl)
            calc = sum(gw[g['no']] * g['recomputed'][y] for g in gl) / den if den else None
            if calc is not None and a['progress'][y] is not None and abs(calc - a['progress'][y]) > 1.0:
                issues.append({'kind': 'axis_reported_differs_from_recomputed', 'axis': a['no'], 'year': y, 'reported': a['progress'][y], 'recomputed': round(calc, 2), 'weight': a['weight'], 'cell': a['cell'][y]})

hdr = {c: clean(s2[f'{c}2'].value) for c in 'FGH'}
meta = {
    'source_file': SRC.name, 'sha256': hashlib.sha256(SRC.read_bytes()).hexdigest(), 'sheets': wb.sheetnames,
    'years': YEARS, 'latest_year': YEARS[-1],
    'notes': [
        ('نام فایل NIN1400-1404 تا ۱۴۰۴ است ولی هیچ ستون یا مقداری برای ۱۴۰۴ ندارد؛ ۱۴۰۴ و ۱۴۰۵ از فایل دوم می‌آید.' if EXT else 'نام فایل تا ۱۴۰۴ است ولی هیچ ستون یا مقداری برای ۱۴۰۴ ندارد.'),
        'عملکرد شاخص (۰ تا ۱۰۰) با درصد تحقق هدف یکی نیست؛ درصد هدف میانگین وزنی عملکرد شاخص‌های همان هدف است.',
        f'ستون G کاربرگ دوم «{hdr["G"]}» نام دارد ولی با محاسبه، وزن سال ۱۴۰۲ است (درصد هدف‌های ۱۴۰۲ با آن بازتولید می‌شود).',
        'روش تجمیع «درصد پیشرفت شبکه ملی اطلاعات» در فایل نیامده و با میانگین ساده اهداف بازتولید نمی‌شود؛ وزن اهداف در فایل نیست.',
        'واحدها در فایل یکسان نیست (۱۴۰۱ صدتایی، ۱۴۰۲ و ۱۴۰۳ کسری)؛ در این داده همه به درصد تبدیل شده و سلول اصلی نگه داشته شده است.',
        'سلول خالی یا «__» صفر نیست و «ناموجود» نمایش داده می‌شود.',
        'فایل را کاربر ارائه کرده؛ اصالت سند و نهاد صادرکننده مستقلاً احراز نشده است.',
    ],
    'weight_headers': hdr,
}
if EXT:
    meta['notes'] += [
        'سال‌های ۱۴۰۴ و ۱۴۰۵ از فایل NIN.1405.07.xlsx اضافه شده‌اند؛ ۱۴۰۴ پایان اسفند و ۱۴۰۵ تازه‌ترین ماه گزارش‌شده (شهریور) است و ۱۴۰۵ پایان سال نیست.',
        'عملکرد تا ۱۴۰۳ تأییدشده در جایگاه ناظر؛ ۱۴۰۴ و ۱۴۰۵ خودارزیابی وزارت ارتباطات است. طبق تصریح مالک داده، عنوان خام «برنامه» در ستون ۱۴۰۴ برچسب قالب است و مقدار، عملکرد خودارزیابی است.',
        'ساختار اهداف و شاخص‌ها در فایل جدید فرق دارد (۳۰ هدف، ۱۲۰ شاخص، وزن‌های دیگر)؛ مقایسه مستقیم ۱۴۰۴ و ۱۴۰۵ با ۱۴۰۳ فقط با احتیاط معتبر است.',
        'در فایل جدید عدد کل برابر جمع وزنی محورهاست، نه جمع وزنی اهداف؛ سلول‌های متنی مانند «۱۰۰/۰۰٪» در فرمول فایل صفر شمرده شده‌اند (برای اهدافی که مغایرتشان با همین حالت بازتولید می‌شود، در فهرست ناسازگاری‌ها آمده).',
    ]
    meta['ext_source'] = ext_meta
    meta['year_status'] = {'1404': 'خودارزیابی وزارت · پایان اسفند', '1405': 'خودارزیابی وزارت · تا پایان شهریور'}
    meta['approved_through'] = '1403'
out = {'meta': meta, 'overall': overall, 'goals': goals, 'issues': issues}
if EXT:
    out['axes'] = axes_ext
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
print(OUT, len(goals), sum(len(g['indicators']) for g in goals), 'issues', len(issues))
for i in issues:
    print(' ', i)
