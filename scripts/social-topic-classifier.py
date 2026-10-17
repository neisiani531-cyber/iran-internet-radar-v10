import re

VERSION = "fa-topics-v1.1"

RULES = {
    "OUTAGE": [
        r"اینترنت.{0,45}(?:قطع|قطعی|مختل|از دسترس خارج)",
        r"(?:قطع|قطعی|اختلال).{0,45}اینترنت",

        r"قطع(?:ی)?\s+(?:شدن\s+)?اینترنت",
        r"اختلال\s+(?:در\s+)?(?:شبکه|اینترنت|ارتباطات)",
        r"اینترنت\s+(?:قطع|مختل)",
    ],
    "QUALITY": [
        r"سرعت.{0,35}اینترنت.{0,35}(?:پایین|کم|کند|ضعیف)",
        r"سرعت.{0,35}اینترنت.{0,35}نیست",
        r"اینترنت.{0,35}(?:کند|کندی|سرعت پایین)",

        r"سرعت\s+(?:پایین|کم|کند)\s+اینترنت",
        r"کندی\s+اینترنت",
        r"پینگ\s+(?:بالا|زیاد)",
        r"کیفیت\s+(?:پایین|ضعیف)\s+اینترنت",
    ],
    "PRICE": [
        r"(?:قیمت|هزینه|تعرفه)\s+(?:بسته\s+)?اینترنت",
        r"گرانی\s+(?:بسته\s+)?اینترنت",
        r"بسته\s+اینترنت\s+(?:گران|گرون)",
    ],
    "ACCESS": [
        r"فیلتر(?:ینگ)?\s+(?:اینترنت|سایت|شبکه)",
        r"محدودیت\s+(?:دسترسی|اینترنت)",
        r"(?:وی\s*پی\s*ان|فیلترشکن)\s+(?:وصل|قطع|کار)",
    ],
    "SECURITY": [
        r"نشت\s+(?:اطلاعات|داده)",
        r"حمله\s+سایبری",
        r"امنیت\s+(?:شبکه|اینترنت)",
        r"حریم\s+خصوصی",
    ],
}

AMBIGUOUS = {
    "OUTAGE": ["قطعی اینترنت", "اختلال اینترنت"],
    "QUALITY": ["سرعت", "پینگ", "کندی"],
    "PRICE": ["قیمت", "بسته", "تعرفه"],
    "ACCESS": ["فیلتر", "فیلترینگ", "فیلترشکن"],
    "SECURITY": ["هک", "امنیت", "حمله"],
}

def normalize(text):
    text = text.replace("ي", "ی").replace("ك", "ک")
    text = text.replace("\u200c", " ")
    text = re.sub(r"[\u064b-\u065f]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip().casefold()

def classify(text):
    text = normalize(text)
    results = []

    for topic, patterns in RULES.items():
        matched = next(
            (pattern for pattern in patterns
             if re.search(pattern, text)),
            None
        )

        if matched:
            results.append({
                "topic": topic,
                "status": "MATCHED",
                "evidence_rule": matched
            })
        elif any(
            re.search(
                r"(?<!\w)" + re.escape(word) + r"(?!\w)",
                text
            )
            for word in AMBIGUOUS[topic]
        ):
            results.append({
                "topic": topic,
                "status": "AMBIGUOUS",
                "evidence_rule": "CONTEXT_INSUFFICIENT"
            })

    if not results:
        results.append({
            "topic": "OTHER",
            "status": "UNCLASSIFIED",
            "evidence_rule": None
        })

    return results
