import { useEffect, useState } from 'react';
import { Redirect, type Href } from 'expo-router';

import { BrandedLoading } from '@/components/brand/BrandedLoading';
import { resolveInitialRoute } from '@/lib/landing';

const ROUTE_TIMEOUT_MS = 12000;

export default function Index() {
  const [href, setHref] = useState<Href | null>(null);

  useEffect(() => {
    console.log('[boot] index mounted');

    let cancelled = false;

    const fallback = setTimeout(() => {
      if (!cancelled) {
        console.warn('[boot] index route timeout — falling back to welcome');
        setHref('/(auth)/welcome');
      }
    }, ROUTE_TIMEOUT_MS);

    void (async () => {
      try {
        const route = await resolveInitialRoute();
        if (!cancelled) {
          console.log('[boot] index redirect ->', route);
          setHref(route as Href);
        }
      } catch (error) {
        console.error('[boot] index resolveInitialRoute error:', error);
        if (!cancelled) {
          setHref('/(auth)/welcome');
        }
      } finally {
        clearTimeout(fallback);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, []);

  if (!href) {
    return <BrandedLoading />;
  }

  return <Redirect href={href} />;
}
