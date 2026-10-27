import { useEffect, useState } from 'react';

type Cell = {
  topic: string;
  topic_match_status: string;
  claim_status: string;
  posts: number;
};

type Report = {
  source: string;
  claim_analyzer: string;
  topic_classifier: string;
  total_unique_posts: number;
  analyzed_unique_posts: number;
  not_analyzed_posts: number;
  validated_accuracy: boolean;
  event_confirmation: boolean;
  topic_claim_matrix: Cell[];
};

const topics: Record<string, string> = {
  OUTAGE: 'اختلال و قطعی',
  QUALITY: 'کیفیت و سرعت',
  PRICE: 'قیمت و هزینه',
  ACCESS: 'دسترسی و محدودیت',
  SECURITY: 'امنیت و حریم خصوصی'
};

const statuses: Record<string, string> = {
  REPORTED: 'گزارش وقوع',
  NEGATED: 'نفی وقوع',
  DENIED: 'تکذیب',
  POSSIBLE: 'احتمال',
  CONDITIONAL: 'شرطی',
  QUESTION: 'پرسش',
  UNCERTAIN: 'نامشخص'
};

const fa = (n: number) => n.toLocaleString('fa-IR');

export default function SocialClaims() {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState('OUTAGE');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/v1/social/claims', {
          cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result: Report = await response.json();

        if (
          result.source !== 'BLUESKY_PUBLIC_SEARCH' ||
          result.validated_accuracy !== false ||
          result.event_confirmation !== false ||
          !Array.isArray(result.topic_claim_matrix)
        ) {
          throw new Error('Invalid claims data');
        }

        if (active) {
          setData(result);
          setError('');
        }
      } catch {
        if (active) setError('گزارش تحلیل ادعاها در دسترس نیست.');
      }
    }

    void load();
    const timer = setInterval(() => void load(), 300000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const rows = data?.topic_claim_matrix.filter(
    x => x.topic === topic
  ) || [];

  const panel: React.CSSProperties = {
    border: '1px solid rgba(128,145,165,.32)',
    borderRadius: 16,
    padding: 18,
    background: 'rgba(100,130,165,.07)'
  };

  return (
    <section dir="rtl" style={panel}>
      <h3>تحلیل تلفیقی موضوع و نوع ادعا</h3>

      {error && <p role="alert">{error}</p>}

      {!data && !error && <p>در حال بارگذاری تحلیل...</p>}

      {data && (
        <>
          <p style={{ fontSize: 13, lineHeight: 1.9, opacity: .8 }}>
            تحلیل‌شده: {fa(data.analyzed_unique_posts)} از
            {' '}{fa(data.total_unique_posts)} پست
            {' | '}فاقد تحلیل: {fa(data.not_analyzed_posts)}
            {' | '}قواعد: {data.claim_analyzer}
          </p>

          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            margin: '16px 0'
          }}>
            {Object.entries(topics).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTopic(key)}
                aria-pressed={topic === key}
                style={{
                  border: '1px solid rgba(128,145,165,.45)',
                  borderRadius: 9,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: 'inherit',
                  background: topic === key
                    ? 'rgba(33,166,173,.25)'
                    : 'transparent'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {rows.length === 0 && (
              <p>برای این موضوع هنوز ترکیب ادعایی ثبت نشده است.</p>
            )}

            {rows.map((row, i) => (
              <div key={`${row.topic}-${row.claim_status}-${i}`}
                   style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     gap: 12,
                     padding: '10px 12px',
                     borderRadius: 9,
                     background: 'rgba(128,145,165,.10)'
                   }}>
                <span>
                  {statuses[row.claim_status] || row.claim_status}
                  {' | '}
                  {row.topic_match_status === 'MATCHED'
                    ? 'تطبیق قاعده'
                    : 'موضوع مبهم'}
                </span>
                <strong>{fa(row.posts)}</strong>
              </div>
            ))}
          </div>

          <p style={{
            fontSize: 12,
            lineHeight: 1.9,
            opacity: .75,
            marginTop: 16
          }}>
            این گزارش فقط برچسب‌های آزمایشی متن‌های عمومی Bluesky
            را نمایش می‌دهد. گزارش وقوع یک ادعا، به معنی صحت آن
            یا تأیید وقوع رویداد توسط داده‌های فنی نیست.
            دقت این تحلیلگر هنوز به صورت انسانی ارزیابی نشده است.
          </p>
        </>
      )}
    </section>
  );
}
