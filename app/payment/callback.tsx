import { Redirect } from 'expo-router';

export default function PaymentCallbackRedirect() {
  return <Redirect href="/(tabs)/customer/home" />;
}
