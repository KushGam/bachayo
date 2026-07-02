'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function LogoMark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <Image
        src="/bachayo-logo-light.png"
        alt="Bachayo"
        width={140}
        height={32}
        className="h-8 w-auto"
      />
    </Link>
  );
}

export function LandingFooter() {
  const pathname = usePathname();
  const shouldShow = !pathname.startsWith('/admin');
  if (!shouldShow) return null;

  return (
    <footer className="bg-[#1A1A1A] py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2">
              <LogoMark />
            </div>
            <div className="text-white/50 text-sm mt-3">Rescue food. Save money.</div>

            <div className="mt-6 flex gap-4 text-white/50">
              <a className="hover:text-white/90 transition text-sm" href="#">
                Instagram
              </a>
              <a className="hover:text-white/90 transition text-sm" href="#">
                Facebook
              </a>
              <a className="hover:text-white/90 transition text-sm" href="#">
                TikTok
              </a>
            </div>
          </div>

          <div>
            <div className="text-white font-semibold mb-4">For Customers</div>
            <div className="space-y-2">
              <a className="text-white/50 hover:text-white transition text-sm" href="#how-it-works">
                How it works
              </a>
              <a className="text-white/50 hover:text-white transition text-sm" href="#cities">
                Browse restaurants
              </a>
              <a className="text-white/50 hover:text-white transition text-sm" href="#download">
                Download the app
              </a>
              <Link className="text-white/50 hover:text-white transition text-sm" href="/support/help">
                Help &amp; support
              </Link>
            </div>
          </div>

          <div>
            <div className="text-white font-semibold mb-4">For Restaurants</div>
            <div className="space-y-2">
              <Link className="text-white/50 hover:text-white transition text-sm" href="/for-restaurants">
                Partner signup
              </Link>
              <Link className="text-white/50 hover:text-white transition text-sm" href="/for-restaurants#pricing">
                Pricing
              </Link>
              <Link className="text-white/50 hover:text-white transition text-sm" href="/for-restaurants#how-it-works">
                How it works
              </Link>
              <Link className="text-white/50 hover:text-white transition text-sm" href="/for-restaurants#faq">
                Restaurant FAQ
              </Link>
            </div>
          </div>

          <div>
            <div className="text-white font-semibold mb-4">Company</div>
            <div className="space-y-2">
              <Link className="text-white/50 hover:text-white transition text-sm" href="/legal/about">
                About Bachayo
              </Link>
              <a className="text-white/50 hover:text-white transition text-sm" href="#">
                Contact us
              </a>
              <Link className="text-white/50 hover:text-white transition text-sm" href="/legal/privacy">
                Privacy policy →
              </Link>
              <Link className="text-white/50 hover:text-white transition text-sm" href="/legal/terms">
                Terms of service →
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex justify-between items-center">
          <div className="text-white/30 text-xs">© 2026 Bachayo. Made with ❤️ in Nepal 🇳🇵</div>
          <div className="text-white/30 text-xs">Rescue food. Save money. Zero waste.</div>
        </div>
      </div>
    </footer>
  );
}

