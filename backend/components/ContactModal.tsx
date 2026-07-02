'use client';

import { Mail, MessageCircle, Phone, X } from 'lucide-react';

const WHATSAPP_URL =
  'https://wa.me/61405290710?text=Hi%2C%20I%20run%20a%20restaurant%20and%20I%27m%20interested%20in%20joining%20Bachayo%20as%20a%20partner.%20Can%20you%20help%20me%20get%20started%3F';

const EMAIL_URL =
  'mailto:hello@bachayo.app?subject=I want to join Bachayo as a restaurant partner&body=Hi, I run a restaurant and I\'m interested in joining Bachayo. Please contact me to get started.';

export function ContactModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 id="contact-modal-title" className="text-2xl font-bold text-[#1A1A1A]">
                Let&apos;s get you started 🛍
              </h2>
              <p className="mt-2 text-sm text-[#6B7280]">
                Choose how you&apos;d like to reach us — we&apos;ll set you up within 24 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 mt-1 text-[#9CA3AF] transition hover:text-[#1A1A1A]"
              aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-[#FAECE7] p-4">
            <span className="text-2xl">🎁</span>
            <div>
              <div className="text-sm font-semibold text-[#993C1D]">30-day free trial</div>
              <div className="mt-0.5 text-xs text-[#993C1D]/70">No payment needed to get started</div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="tel:0405290710"
              className="group flex items-center gap-4 rounded-2xl border-2 border-[#D85A30] bg-[#D85A30] p-4 text-white transition hover:border-[#993C1D] hover:bg-[#993C1D]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 transition group-hover:bg-white/25">
                <Phone size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold">Call us now</div>
                <div className="text-sm text-white/80">0405 290 710 · Available 9am–8pm</div>
              </div>
              <div className="text-sm font-medium text-white/60">Fastest →</div>
            </a>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-4 transition hover:border-[#25D366] hover:bg-[#F0FDF4]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0FDF4] transition group-hover:bg-[#DCFCE7]">
                <MessageCircle size={20} className="text-[#25D366]" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-[#1A1A1A]">WhatsApp us</div>
                <div className="text-sm text-[#6B7280]">Message us anytime</div>
              </div>
              <div className="text-sm text-[#9CA3AF]">→</div>
            </a>

            <a
              href={EMAIL_URL}
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-4 transition hover:border-[#D85A30] hover:bg-[#FAECE7]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAECE7] transition group-hover:bg-[#F5C4B3]">
                <Mail size={20} className="text-[#D85A30]" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-[#1A1A1A]">Email us</div>
                <div className="text-sm text-[#6B7280]">hello@bachayo.app</div>
              </div>
              <div className="text-sm text-[#9CA3AF]">→</div>
            </a>
          </div>

          <p className="mt-6 text-center text-xs text-[#9CA3AF]">
            We&apos;ll walk you through setup and have your restaurant live on Bachayo same day 🚀
          </p>
        </div>
      </div>
    </>
  );
}
