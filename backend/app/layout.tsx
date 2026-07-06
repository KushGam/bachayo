import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Viewport } from 'next';

import '@/app/globals.css';

import { LandingFooter } from '@/components/LandingFooter';
import { LandingNavbar } from '@/components/LandingNavbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LastBag — Rescue food. Save money.',
  description:
    'Find discounted rescue bags from restaurants, cafes, and bakeries near you in Nepal. Save up to 70% on great food.',
  keywords:
    'food rescue Nepal, discount food Kathmandu, surplus food app, LastBag',
  metadataBase: new URL('https://bachayo.vercel.app'),
  openGraph: {
    title: 'LastBag — Rescue food. Save money.',
    description:
      "Surplus rescue bags from Nepal's best restaurants at 50-70% off.",
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
  themeColor: '#D85A30',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)]">
        <LandingNavbar />
        <div className="flex-1">{children}</div>
        <LandingFooter />
      </body>
    </html>
  );
}

