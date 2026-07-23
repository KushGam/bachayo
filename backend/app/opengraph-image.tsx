import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LastBag — Rescue food. Save money.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0F0F0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}>
        <div
          style={{
            width: 120,
            height: 120,
            background: '#D85A30',
            borderRadius: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}>
          <div
            style={{
              width: 64,
              height: 52,
              background: 'white',
              borderRadius: 14,
              display: 'flex',
            }}
          />
        </div>

        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -4,
            display: 'flex',
          }}>
          <span style={{ color: 'white' }}>Last</span>
          <span style={{ color: '#D85A30' }}>Bag</span>
        </div>

        <div
          style={{
            fontSize: 32,
            color: 'rgba(255,255,255,0.4)',
            marginTop: 16,
            letterSpacing: 1,
          }}>
          Rescue food. Save money. Nepal
        </div>
      </div>
    ),
    { ...size },
  );
}
