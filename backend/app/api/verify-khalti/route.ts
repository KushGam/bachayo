import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Payment verification removed. Bachayo uses cash on pickup for v1.' },
    { status: 410 },
  );
}
