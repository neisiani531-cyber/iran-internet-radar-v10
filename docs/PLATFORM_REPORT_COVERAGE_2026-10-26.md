# Full report intake coverage

User requested every statistic in NCC six-month platforms report. This expands the earlier three-chart summary.

## Completed
- 108 source numeric records from the republication body, with unique IDs, original values, units, periods, approximations, limitations and shared source/status.
- Five platforms: Rubika, Eitaa, Bale, Soroush Plus and Virasty.
- Activity, shares, efficiency, totals, topic-axis aggregates, content formats, conditional denominators, explicit monthly observations/ranges, and ambiguous Virasty metric.
- Five platform qualitative profiles covering named axes, leading subtopics and reported temporal changes.
- Native tabs, charts, exact records/search/filter, six-month sparse table (no interpolation), download JSON, all 23 source infographic links and visible coverage status.
- Published conditional percentages in Soroush preserved but flagged for denominator inconsistency.

## Remaining blocker
All 23 image URLs were requested individually with an ordinary HTTP client on 2026-10-26. All returned HTTP 403. Primary article access also failed. Image-only numbers cannot be transcribed or verified without readable images/PDF. The UI states this explicitly. The package does NOT claim full infographic extraction or live primary-source verification.

## Source
https://borna.news/fa/news/2406958/ (full title page read via search; direct article HTML used to enumerate images).
Original source link and 23 exact original image URLs retained in src/platform-report-complete.json.

## Record counts
{
  "activity": 14,
  "discrepancy": 1,
  "share": 9,
  "efficiency": 9,
  "totals": 5,
  "themes": 12,
  "formats": 30,
  "conditional": 8,
  "monthly": 20
}

Validation: build, existing source contracts, browser comparison of all 108 displayed IDs/values against the structured intake, 23 image links, five format charts, explicit monthly gaps, Virasty selection and mobile overflow.
