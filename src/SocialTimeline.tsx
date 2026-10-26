import { useEffect, useState } from 'react';

type Bucket = {
  hour: string;
  new_posts: number;
};

type Timeline = {
  source: string;
  metric: string;
  hourly_observations: Bucket[];
  trend_validated: boolean;
  national_representativeness: boolean;
};

const fa = (n: number) => n.toLocaleString('fa-IR');

export default function SocialTimeline() {
  const [data, setData] = useState<Timeline | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/v1/social/timeline', {
          cache: 'no-store'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result: Timeline = await response.json();

        if (
          result.source !== 'BLUESKY_PUBLIC_SEARCH' ||
          result.metric !== 'FIRST_OBSERVED_UNIQUE_POSTS' ||
          !Array.isArray(result.hourly_observations) ||
          result.trend_validated !== false
        ) {
          throw new Error('Invalid timeline data');
        }

        if (active) {
          setData(result);
          setError('');
        }
      } catch {
        if (active) setError('اطلاعات زمانی در دسترس نیست.');
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

  const rows = data?.hourly_observations.slice(-24) || [];
  const max = Math.max(1, ...rows.map(r => r.new_posts));

  return (
    <section dir="rtl" style={panel}>
      <h3>پست‌های جدید مشاهده‌شده در هر ساعت</h3>

      {error && <p role="alert">{error}</p>}

      {!data && !error && <p>در حال بارگذاری...</p>}

      {data && rows.length === 0 && (
        <p>هنوز مشاهده زمانی ثبت نشده است.</p>
      )}

      {data && rows.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {rows.map((row, i) => (
            <div key={`${row.hour}-${i}`}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 5,
                fontSize: 13
              }}>
                <span>{new Date(row.hour).toLocaleString('fa-IR')}</span>
                <strong>{fa(row.new_posts)}</strong>
              </div>

              <div style={{
                height: 9,
                borderRadius: 8,
                background: 'rgba(128,145,165,.2)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${100 * row.new_posts / max}%`,
                  height: '100%',
                  background: '#21a6ad',
                  borderRadius: 8
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ opacity: .75, fontSize: 12, marginTop: 14, lineHeight: 1.9 }}>
        این نمودار زمان اولین مشاهده پست توسط رادار را نمایش می‌دهد،
        نه زمان انتشار آن در Bluesky. پوشش دریافت ناقص است و
        تغییر تعداد پست‌ها هنوز به‌عنوان روند رشد تأیید نشده است.
      </p>
    </section>
  );
}
