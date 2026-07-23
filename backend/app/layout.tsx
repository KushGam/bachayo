import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, Syne } from 'next/font/google';

import '@/app/globals.css';

import { LandingFooter } from '@/components/LandingFooter';
import { LandingNavbar } from '@/components/LandingNavbar';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'LastBag — Rescue food. Save money.',
  description:
    "Nepal's food rescue app. Reserve surplus bags from restaurants, cafés, and bakeries near you — save up to 70%, waste less, pay at pickup.",
  keywords:
    'food rescue Nepal, discount food Kathmandu, surplus food app, LastBag, Pokhara, Lalitpur',
  metadataBase: new URL('https://bachayo.vercel.app'),
  icons: {
    icon: '/favicon.svg',
    apple: '/lastbag-icon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'LastBag — Rescue food. Save money.',
    description:
      "Surplus rescue bags from Nepal's restaurants at 50–70% off. Free to reserve. Pay at pickup.",
    url: 'https://bachayo.vercel.app',
    siteName: 'LastBag',
    locale: 'en_NP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LastBag — Rescue food. Save money.',
    description: 'Find rescue bags near you in Nepal.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0C0C0C',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${syne.variable} ${dmSans.variable}`}>
      <body className="flex min-h-full flex-col bg-[var(--bg)] font-sans text-[var(--text)]">
        <LandingNavbar />
        <div className="flex-1">{children}</div>
        <LandingFooter />
      </body>
    </html>
  );
}
