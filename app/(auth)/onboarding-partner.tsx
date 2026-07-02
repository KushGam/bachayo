import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/** Legacy route — redirects to multi-step partner signup. */
export default function OnboardingPartnerScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/signup-partner/basics');
  }, [router]);

  return null;
}
