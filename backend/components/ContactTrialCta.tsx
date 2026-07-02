'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { ContactModal } from '@/components/ContactModal';

export function ContactTrialCta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setShowContact(true)} className={className}>
        {children}
      </button>
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
    </>
  );
}
