import SocialClaims from './SocialClaims';
import { useEffect, useState } from 'react';
import SocialTimeline from './SocialTimeline';
import SocialTopics from './SocialTopics';

type Term = { name: string; post_count: number };
type Run = {
  fetched_at: string;
  status: string;
  returned_count: number;
  new_count: number;
};
type Summary = {
  source: string;
  total_unique_posts: number;
  collection_runs: number;
  source_health: string;
  freshness: string;
  age_seconds: number;
  latest_collection_at: string | null;
  hashtags: Term[];
  keywords: Term[];
  recent_runs: Run[];
  methodology: {
    representative_of_iran: boolean;
    trending_validated: boolean;
  };
};

const fmt = (n: number) => n.toLocaleString('fa-IR');
const date = (v: string | null) =>
  v ? new Date(v).toLocaleString('fa-IR') : 'نامشخص';

export default function SocialLivePanel() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch('/api/v1/social/summary', {
          cache: 'no-store'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const result: Summary = await res.json();
        if (result.source !== 'BLUESKY_PUBLIC_SEARCH')
          throw new Error('Unexpected source');

        if (active) {
          setData(result);
          setError('');
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'API error');
        }
      } finally {
        if (active) setLoading(false);
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
    padding: 18,
    background: 'rgba(100,130,165,.07)'
  };

  const muted: React.CSSProperties = {
    opacity: 0.72,
    fontSize: 12,
    lineHeight: 1.9
  };

  const terms = (items: Term[], empty: string) => {
    if (!items.length) return <p style={muted}>{empty}</p>;

    const max = Math.max(...items.map(x => x.post_count), 1);

    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {items.slice(0, 10).map((item, index) => (
          <div key={`${item.name}-${index}`}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 13,
              marginBottom: 5
            }}>
              <span dir="auto">{item.name}</span>
              <strong>{fmt(item.post_count)}</strong>
            </div>
            <div style={{
              height: 7,
              borderRadius: 8,
              background: 'rgba(128,145,165,.2)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${100 * item.post_count / max}%`,
                background: '#21a6ad',
                borderRadius: 8
              }}/>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section dir="rtl" style={{ display: 'grid', gap: 18, marginBottom: 28 }}>
      <div>
        <h2 style={{ marginBottom: 7 }}>پایش واقعی گفتگوهای عمومی</h2>
        <p style={muted}>
          منبع: جست‌وجوی عمومی Bluesky | موضوع: اینترنت |
          نمونه غیرنماینده جامعه ایران
        </p>
      </div>

      {loading && !data && <div style={panel}>در حال دریافت اطلاعات...</div>}

      {error && (
        <div style={panel} role="alert">
          اختلال در به‌روزرسانی منبع: {error}
          {data && <p style={muted}>آخرین گزارش دریافت‌شده نمایش داده می‌شود.</p>}
        </div>
      )}

      {data && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
            gap: 12
          }}>
            {[
              ['پست یکتا', fmt(data.total_unique_posts)],
              ['نوبت دریافت', fmt(data.collection_runs)],
              ['سلامت منبع', data.source_health],
              ['تازگی گزارش', data.freshness]
            ].map(([label, value]) => (
              <div key={label} style={panel}>
                <div style={muted}>{label}</div>
                <div style={{
                  fontWeight: 800,
                  fontSize: 23,
                  marginTop: 8
                }}>{value}</div>
              </div>
            ))}
          </div>

          <p style={muted}>
            آخرین دریافت: {date(data.latest_collection_at)}
            {' | '}وضعیت تازگی بر اساس زمان تولید گزارش محاسبه می‌شود.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
            gap: 16
          }}>
            <div style={panel}>
              <h3>واژه‌های پرتکرار در نمونه</h3>
              {terms(data.keywords, 'واژه‌ای ثبت نشده است.')}
            </div>
            <div style={panel}>
              <h3>هشتگ‌های مشاهده‌شده</h3>
              {terms(data.hashtags, 'هشتگی در نمونه ثبت نشده است.')}
            </div>
          </div>

          <SocialTopics />
          <SocialClaims />
          <SocialTimeline />

          <div style={panel}>
            <h3>تاریخچه جمع‌آوری</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                textAlign: 'right',
                borderCollapse: 'collapse',
                fontSize: 13
              }}>
                <thead>
                  <tr>
                    <th>زمان</th>
                    <th>وضعیت</th>
                    <th>دریافتی</th>
                    <th>جدید</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_runs.slice(0, 12).map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: 8 }}>{date(r.fetched_at)}</td>
                      <td>{r.status}</td>
                      <td>{fmt(r.returned_count)}</td>
                      <td>{fmt(r.new_count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...panel, ...muted }}>
            <strong>محدودیت روش‌شناختی:</strong> این اطلاعات حاصل
            نمونه‌برداری از نتایج جست‌وجوی عمومی Bluesky است.
            شمارش واژه‌ها نشان‌دهنده تعداد پست‌های مشاهده‌شده حاوی
            هر واژه است. این داده‌ها نماینده جمعیت ایران نیستند
            و هنوز برای اعلام روند رشد، نگرش عمومی یا شاخص ملی
            اعتبارسنجی نشده‌اند.
          </div>
        </>
      )}
    </section>
  );
}
