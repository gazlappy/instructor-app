import { Pressable, StyleSheet, Text } from 'react-native';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Floating "+" action button, positioned above the tab bar. */
export function Fab({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Add"
      style={({ pressed }) => [styles.fab, { backgroundColor: theme.tint }, pressed && styles.pressed]}>
      <Text style={[styles.plus, { color: theme.onTint }]}>＋</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: BottomTabInset + Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: {
    opacity: 0.8,
  },
  plus: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '600',
  },
});
