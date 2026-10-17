import importlib.util
from pathlib import Path

p = Path(__file__).with_name("social-claim-analyzer.py")
spec = importlib.util.spec_from_file_location("claims", p)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

cases = [
    ("اینترنت قطع نشده است", "NEGATED"),
    ("امروز اینترنت قطع نشد", "NEGATED"),
    ("خبر قطع اینترنت تکذیب شد", "DENIED"),
    ("قطعی اینترنت صحت ندارد", "NEGATED"),
    ("احتمال قطع اینترنت وجود دارد", "POSSIBLE"),
    ("اگر اینترنت قطع شود چه می‌شود؟", "CONDITIONAL"),
    ("آیا امروز اینترنت قطع بود؟", "QUESTION"),
    ("امروز اینترنت قطع شد", "REPORTED"),
    ("اینترنت قطع شد اما خبر آن تکذیب شد", "DENIED"),
    ("گفته می‌شود اینترنت قطع شده است", "UNCERTAIN"),
    ("قطع برق باعث خاموشی خانه شد", "UNCERTAIN"),
    ("اینترنت قطع نشده، فقط کند است", "NEGATED"),
]

passed = 0
for sentence, expected in cases:
    actual = m.analyze(sentence)["status"]
    ok = actual == expected
    passed += ok
    print("PASS" if ok else "FAIL", expected, actual, sentence)

print("RESULT:", passed, "/", len(cases))
if passed != len(cases):
    raise SystemExit(1)

print("CLAIM ANALYZER V1.3 ACCEPTED")
