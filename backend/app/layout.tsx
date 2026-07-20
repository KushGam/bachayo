import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '@/app/globals.css';

import { LandingFooter } from '@/components/LandingFooter';
import { LandingNavbar } from '@/components/LandingNavbar';

export const metadata: Metadata = {
  title: 'LastBag — Rescue food. Save money.',
  description:
    "Nepal's food rescue app. Reserve surplus bags from restaurants, cafés, and bakeries near you — save up to 70%, waste less, pay at pickup.",
  keywords:
    'food rescue Nepal, discount food Kathmandu, surplus food app, LastBag, Pokhara, Lalitpur',
  metadataBase: new URL('https://bachayo.vercel.app'),
  openGraph: {
    title: 'LastBag — Rescue food. Save money.',
    description:
      "Surplus rescue bags from Nepal's restaurants at 50–70% off. Free to reserve. Pay at pickup.",
    url: 'https://bachayo.vercel.app',
    siteName: 'LastBag',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_NP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LastBag — Rescue food. Save money.',
    description: 'Find rescue bags near you in Nepal.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0F0F0F',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#F5F3EF] text-[#1A1A1A]">
        <LandingNavbar />
        <div className="flex-1">{children}</div>
        <LandingFooter />
      </body>
    </html>
  );
}
