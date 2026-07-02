import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

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
  title: 'Bachayo — Rescue food. Save money.',
  description:
    'Find discounted rescue bags from restaurants, cafes, and bakeries near you in Nepal. Save up to 70% on great food while reducing waste.',
  themeColor: '#D85A30',
  openGraph: {
    title: 'Bachayo — Rescue food. Save money.',
    description:
      'Find discounted rescue bags from restaurants, cafes, and bakeries near you in Nepal.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
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

