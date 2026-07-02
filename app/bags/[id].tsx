import { Redirect, useLocalSearchParams } from 'expo-router';

export default function BagsDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/bag/${id}`} />;
}
