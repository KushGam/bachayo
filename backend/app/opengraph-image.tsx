import { ImageResponse } from 'next/og';

export const alt = 'LastBag — Great food. Half the price.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0C0C0C',
          padding: '72px 80px',
          position: 'relative',
        }}>
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -120,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background:
              'radial-gradient(circle, rgba(216,90,48,0.55) 0%, rgba(216,90,48,0.12) 45%, rgba(216,90,48,0) 70%)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#D85A30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              color: '#FFFFFF',
            }}>
            LB
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#FFFFFF' }}>
            Last
            <span style={{ color: '#E8622F' }}>Bag</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              color: '#FFFFFF',
            }}>
            <div style={{ display: 'flex' }}>Great food.</div>
            <div style={{ display: 'flex', color: '#E8622F' }}>Half the price.</div>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 30,
              color: 'rgba(255,255,255,0.58)',
            }}>
            Rescue surplus bags from kitchens near you.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {['Free to reserve', 'Pay at pickup', 'Save up to 70%', 'Zero commission'].map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                padding: '12px 24px',
                borderRadius: 9999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.05)',
                fontSize: 22,
                color: 'rgba(255,255,255,0.75)',
              }}>
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
