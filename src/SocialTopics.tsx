import { useEffect, useState } from 'react';

type Topic = {
  topic: string;
  MATCHED: number;
  AMBIGUOUS: number;
};

type Report = {
  source: string;
  classifier_version: string;
  total_unique_posts: number;
  classified_unique_posts: number;
  unclassified_posts: number;
  validated_accuracy: boolean;
  national_representativeness: boolean;
  generated_at_utc: string;
  topics: Topic[];
};

const labels: Record<string, string> = {
  OUTAGE: 'اختلال و قطعی',
  QUALITY: 'کیفیت و سرعت',
  PRICE: 'قیمت و هزینه',
  ACCESS: 'دسترسی و محدودیت',
  SECURITY: 'امنیت و حریم خصوصی'
};

const fa = (n: number) => n.toLocaleString('fa-IR');

export default function SocialTopics() {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/v1/social/topics', {
          cache: 'no-store'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result: Report = await response.json();

        if (
          result.source !== 'BLUESKY_PUBLIC_SEARCH' ||
          !Array.isArray(result.topics) ||
          result.validated_accuracy !== false ||
          result.national_representativeness !== false
        ) {
          throw new Error('Invalid topic report');
        }

        if (active) {
          setData(result);
          setError('');
        }
      } catch {
        if (active) setError('گزارش موضوعات در دسترس نیست.');
      }
    }

    void load();
    const timer = setInterval(() => void load(), 300000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const panel: React.CSSProperties = {
    border: '1px solid rgba(128,145,165,.32)',
    borderRadius: 16,
    background: 'rgba(100,130,165,.07)',
    padding: 18
  };

  return (
    <section dir="rtl" style={panel}>
      <h3>موضوعات شناسایی‌شده در گفتگوهای عمومی</h3>

      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>در حال دریافت تحلیل موضوعی...</p>}

      {data && (
        <>
          <p style={{ fontSize: 13, opacity: .8 }}>
            پست‌های پردازش‌شده: {fa(data.classified_unique_posts)}
            {' | '}بدون تشخیص موضوع: {fa(data.unclassified_posts)}
            {' | '}نسخه قواعد: {data.classifier_version}
          </p>

          <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
            {data.topics.map(item => {
              const max = Math.max(
                1,
                ...data.topics.map(x => x.MATCHED + x.AMBIGUOUS)
              );

              return (
                <div key={item.topic}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    fontSize: 13
                  }}>
                    <strong>{labels[item.topic] || item.topic}</strong>
                    <span>
                      تطبیق: {fa(item.MATCHED)}
                      {' | '}مبهم: {fa(item.AMBIGUOUS)}
                    </span>
                  </div>

                  <div style={{
                    height: 11,
                    display: 'flex',
                    borderRadius: 8,
                    background: 'rgba(128,145,165,.2)',
                    overflow: 'hidden',
                    marginTop: 7
                  }}>
                    <div style={{
                      width: `${100 * item.MATCHED / max}%`,
                      background: '#21a6ad'
                    }}/>
                    <div style={{
                      width: `${100 * item.AMBIGUOUS / max}%`,
                      background: '#c79a52'
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{
            marginTop: 18,
            opacity: .75,
            fontSize: 12,
            lineHeight: 1.9
          }}>
            این اعداد صرفاً اشاره‌های موضوعی در نمونه جست‌وجوی
            Bluesky هستند. تطبیق قاعده به‌معنای تأیید وقوع رویداد،
            سنجش نگرش عمومی یا برآورد ملی نیست. دقت طبقه‌بند
            هنوز با نمونه انسانی اعتبارسنجی نشده است.
          </p>
        </>
      )}
    </section>
  );
}
