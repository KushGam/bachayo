import * as Location from 'expo-location';

export async function getNeighbourhood(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    const place = result?.[0];
    if (!place) return 'Nepal';
    return (
      place.district ||
      place.subregion ||
      place.city ||
      place.name ||
      'Nepal'
    );
  } catch {
    return 'Nepal';
  }
}
