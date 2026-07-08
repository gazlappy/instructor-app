import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FormInput } from '@/components/ui/form';
import { Spacing } from '@/constants/theme';

interface PhotonFeature {
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
}

function formatFeature(feature: PhotonFeature): string | null {
  const p = feature.properties;
  const streetLine = p.housenumber && p.street ? `${p.housenumber} ${p.street}` : (p.street ?? p.name);
  if (!streetLine) return null;
  const parts = [streetLine];
  if (p.name && streetLine !== p.name && p.street) parts.unshift(p.name);
  if (p.city) parts.push(p.city);
  if (p.postcode) parts.push(p.postcode);
  return parts.join(', ');
}

/**
 * Address field with typeahead suggestions from the free Photon
 * (OpenStreetMap) geocoder. Falls back to a plain text field when offline
 * or when nothing matches — whatever is typed is always accepted as-is.
 */
export function AddressInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  const search = (text: string) => {
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const seq = ++requestSeq.current;
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(text.trim())}&limit=6&lang=en`
        );
        const json = await res.json();
        if (seq !== requestSeq.current) return; // stale response
        const features: PhotonFeature[] = json.features ?? [];
        // Prefer UK results (the app's home market) without excluding others.
        features.sort((a, b) =>
          Number(b.properties.countrycode === 'GB') - Number(a.properties.countrycode === 'GB')
        );
        const labels = features.map(formatFeature).filter((l): l is string => !!l);
        setSuggestions([...new Set(labels)].slice(0, 5));
      } catch {
        if (seq === requestSeq.current) setSuggestions([]); // offline → plain input
      }
    }, 350);
  };

  const pick = (address: string) => {
    requestSeq.current++; // invalidate any in-flight search
    onChange(address);
    setSuggestions([]);
  };

  const dismiss = () => {
    // Delay so a tap on a suggestion lands before the list disappears.
    setTimeout(() => setSuggestions([]), 200);
  };

  return (
    <View>
      <FormInput
        value={value}
        onChangeText={search}
        placeholder={placeholder}
        onBlur={dismiss}
        autoCapitalize="words"
      />
      {suggestions.length > 0 && (
        <ThemedView type="backgroundSelected" style={styles.list}>
          {suggestions.map((address) => (
            <Pressable
              key={address}
              onPress={() => pick(address)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <ThemedText type="small">📍 {address}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: Spacing.three,
    marginTop: Spacing.one,
    paddingVertical: Spacing.one,
  },
  item: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
