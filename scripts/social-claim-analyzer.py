import re

VERSION = "fa-claims-v1.3"

def normalize(text):
    text = text.replace("ي", "ی").replace("ك", "ک")
    text = text.replace("\u200c", " ")
    text = re.sub(r"[\u064b-\u065f]", "", text)
    return re.sub(r"\s+", " ", text).strip().casefold()

RULES = [
    ("DENIED", [
        r"تکذیب\s+شد",
        r"خبر.{0,65}تکذیب",
        r"ادعای.{0,65}رد\s+شد",
    ]),
    ("CONDITIONAL", [
        r"(?:اگر|چنانچه)\s+.{0,100}",
        r"در\s+صورتی\s+که",
    ]),
    ("POSSIBLE", [
        r"احتمال\s+.{0,90}",
        r"ممکن\s+است",
        r"شاید\s+",
        r"پیش\s*بینی\s+",
    ]),
    ("QUESTION", [
        r"آیا\s+",
        r"چرا\s+",
        r"\?",
        r"؟",
    ]),
    ("NEGATED", [
        r"اینترنت.{0,50}قطع\s+نشد",
        r"قطعی\s+اینترنت.{0,50}صحت\s+ندارد",
        r"قطع\s+اینترنت.{0,50}صحت\s+ندارد",

        r"(?:قطع|مختل)\s+نشده",
        r"(?:قطع|مختل)\s+نیست",
        r"اختلالی\s+وجود\s+ندارد",
        r"قطعی\s+رخ\s+نداده",
    ]),
    ("UNCERTAIN", [
        r"گفته\s+می\s*شود.{0,100}",
        r"شنیده\s+شده.{0,100}",
        r"شایعه.{0,100}(?:قطعی|قطع|اختلال)",
    ]),
    ("REPORTED", [
        r"اینترنت.{0,65}(?:قطع\s+شد|قطع\s+شده|مختل\s+شد)",
        r"(?:قطعی|اختلال).{0,65}(?:گزارش\s+شد|رخ\s+داد)",
        r"(?:قطع|اختلال).{0,65}اینترنت",
    ]),
]

def analyze(text):
    normalized = normalize(text)

    for status, patterns in RULES:
        for rule in patterns:
            if re.search(rule, normalized):
                return {
                    "status": status,
                    "rule": rule,
                    "version": VERSION
                }

    return {
        "status": "UNCERTAIN",
        "rule": None,
        "version": VERSION
    }
