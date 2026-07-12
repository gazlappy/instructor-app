import { usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

/** The five main sections, with the paths each one "owns" for active highlighting. */
export const NAV_ITEMS = [
  { href: '/', label: 'Schedule', owns: (p: string) => p === '/' || p.startsWith('/lesson') },
  { href: '/students', label: 'Students', owns: (p: string) => p.startsWith('/student') },
  { href: '/theory', label: 'Theory', owns: (p: string) => p.startsWith('/theory') },
  { href: '/help', label: 'Help', owns: (p: string) => p.startsWith('/help') },
  { href: '/settings', label: 'Settings', owns: (p: string) => p.startsWith('/settings') },
] as const;

/** Shared styling so the tab-group pill and the standalone bar look identical. */
export const navBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    pointerEvents: 'box-none',
  },
  pill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    elevation: 4,
    shadowColor: '#16181d',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
  },
  pressed: {
    opacity: 0.7,
  },
});

/**
 * The bottom nav pill for screens outside the tab group (e.g. a student's
 * page), so the sections stay one tap away. Web only — native stack screens
 * keep the platform back button, and native tab screens use the system bar.
 */
export function GlobalNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  if (Platform.OS !== 'web') return null;

  return (
    <View style={navBarStyles.container} pointerEvents="box-none">
      <ThemedView type="backgroundElement" style={navBarStyles.pill}>
        {NAV_ITEMS.map((item) => {
          const active = item.owns(pathname);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.navigate(item.href)}
              style={({ pressed }) => pressed && navBarStyles.pressed}>
              <ThemedView
                type={active ? 'backgroundSelected' : 'backgroundElement'}
                style={navBarStyles.button}>
                <ThemedText type="small" themeColor={active ? 'tint' : 'textSecondary'}>
                  {item.label}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </View>
  );
}
