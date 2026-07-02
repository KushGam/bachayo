import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/** Legacy route — redirects to customer signup. */
export default function PhoneScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/signup-customer/basics');
  }, [router]);

  return null;
}
