import { Platform } from 'react-native';

/** URL that opens an address in the platform's default maps app. */
export function mapsUrl(address: string): string {
  const query = encodeURIComponent(address);
  if (Platform.OS === 'ios') return `maps:?q=${query}`;
  if (Platform.OS === 'android') return `geo:0,0?q=${query}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
