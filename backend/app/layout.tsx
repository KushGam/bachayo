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
  title: {
    default: 'LastBag — Great food. Better price.',
    template: '%s · LastBag',
  },
  description:
    'Rescue surplus bags from kitchens near you. Free to reserve, pay at pickup, save up to 70%. Zero commission for partners.',
  keywords:
    'food rescue, discount surplus food, LastBag, save food waste, restaurant surplus app',
  metadataBase: new URL('https://lastbag.app'),
  alternates: {
    canonical: '/',
  },
  applicationName: 'LastBag',
  authors: [{ name: 'Mamta Technologies' }],
  creator: 'Mamta Technologies',
  publisher: 'Mamta Technologies',
  formatDetection: {
    telephone: true,
    address: false,
    email: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
    title: 'LastBag — Great food. Better price.',
    description: 'Rescue surplus food near you. Free to reserve. Pay only at pickup.',
    url: 'https://lastbag.app',
    siteName: 'LastBag',
    locale: 'en_NP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LastBag — Great food. Better price.',
    description: 'Rescue surplus bags near you in Nepal. Free to reserve.',
  },
};

export const viewport: Viewport = {
  themeColor: '#D85A30',
};

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://lastbag.app/#organization',
      name: 'LastBag',
      legalName: 'Mamta Technologies',
      url: 'https://lastbag.app',
      logo: 'https://lastbag.app/lastbag-logo.png',
      description:
        'LastBag helps people rescue surplus food from restaurants, cafés, bakeries, and marts across Nepal at up to 70% off.',
      areaServed: { '@type': 'Country', name: 'Nepal' },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+977-9716318840',
        email: 'hello@lastbag.app',
        contactType: 'customer service',
        availableLanguage: ['English', 'Nepali'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://lastbag.app/#website',
      url: 'https://lastbag.app',
      name: 'LastBag',
      publisher: { '@id': 'https://lastbag.app/#organization' },
      inLanguage: 'en-NP',
    },
    {
      '@type': 'MobileApplication',
      name: 'LastBag',
      operatingSystem: 'iOS, Android',
      applicationCategory: 'FoodAndDrinkApplication',
      publisher: { '@id': 'https://lastbag.app/#organization' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'NPR',
        description: 'Free to download and free to reserve. Pay only at pickup.',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <LandingNavbar />
        <div id="main" className="flex-1">
          {children}
        </div>
        <LandingFooter />
      </body>
    </html>
  );
}
