import { Pressable, StyleSheet, View } from 'react-native';

import { MAX_SKILL_LEVEL } from '@/db/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Five tappable dots showing a skill level (0–5). Tapping dot n sets the
 * level to n+1; tapping the dot at the current level steps back to n.
 */
export function LevelDots({ level, onChange }: { level: number; onChange: (level: number) => void }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {Array.from({ length: MAX_SKILL_LEVEL }, (_, i) => (
        <Pressable
          key={i}
          hitSlop={6}
          accessibilityLabel={`Set level ${i + 1}`}
          onPress={() => onChange(level === i + 1 ? i : i + 1)}
          style={({ pressed }) => [
            styles.dot,
            { backgroundColor: i < level ? theme.tint : theme.backgroundSelected },
            pressed && styles.pressed,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  pressed: {
    opacity: 0.6,
  },
});
