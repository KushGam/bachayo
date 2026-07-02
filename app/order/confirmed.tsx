import { Redirect, useLocalSearchParams } from 'expo-router';

export default function OrderConfirmedRedirect() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  if (!orderId) {
    return <Redirect href="/(tabs)/customer/home" />;
  }
  return <Redirect href={`/order/confirmed/${orderId}`} />;
}
