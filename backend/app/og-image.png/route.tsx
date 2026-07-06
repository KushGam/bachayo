import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #D85A30 0%, #993C1D 50%, #712B13 100%)',
          color: '#FFFFFF',
          padding: '64px',
          boxSizing: 'border-box',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}>
            🛍
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>LastBag</div>
        </div>

        <div style={{ marginTop: 44, fontSize: 58, fontWeight: 900, lineHeight: 1.02 }}>
          Rescue food.
          <br />
          Save money.
        </div>

        <div style={{ marginTop: 18, fontSize: 26, color: 'rgba(255,255,255,0.78)' }}>
          Rescue great food while reducing waste across Nepal.
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: 18, alignItems: 'center' }}>
          <div
            style={{
              background: 'rgba(250,236,231,0.92)',
              color: '#993C1D',
              padding: '10px 16px',
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 800,
            }}>
            🇳🇵 Launching in Nepal
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

