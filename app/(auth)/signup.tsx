import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/** Legacy route — redirects to multi-step customer signup. */
export default function SignupScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/signup-customer/basics');
  }, [router]);

  return null;
}
