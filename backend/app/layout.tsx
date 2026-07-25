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
  title: 'LastBag — Great food. Half the price.',
  description:
    'Rescue surplus bags from kitchens near you. Free to reserve, pay at pickup, save up to 70%. Zero commission for partners.',
  keywords:
    'food rescue, discount surplus food, LastBag, save food waste, restaurant surplus app',
  metadataBase: new URL('https://bachayo.vercel.app'),
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'LastBag — Great food. Half the price.',
    description: 'Rescue surplus food near you. Free to reserve. Pay only at pickup.',
    url: 'https://lastbag.app',
    siteName: 'LastBag',
    locale: 'en_NP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LastBag — Great food. Half the price.',
    description: 'Rescue surplus bags near you in Nepal. Free to reserve.',
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
    <html lang="en" className={`h-full antialiased ${syne.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className="flex min-h-full flex-col bg-[var(--bg)] font-sans text-[var(--text)]">
        <LandingNavbar />
        <div className="flex-1">{children}</div>
        <LandingFooter />
      </body>
    </html>
  );
}
