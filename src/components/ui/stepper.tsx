import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Compact −/+ control that steps through a fixed list of options.
 * If the current value isn't in the list, stepping snaps to the nearest option.
 */
export function Stepper({
  value,
  options,
  onChange,
  format = String,
}: {
  value: number;
  options: number[];
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  const theme = useTheme();

  const step = (direction: -1 | 1) => {
    const index = options.findIndex((o) => o >= value);
    const current = index === -1 ? options.length - 1 : index;
    const next = Math.min(options.length - 1, Math.max(0, current + direction));
    if (options[next] !== value) onChange(options[next]);
  };

  const atMin = value <= options[0];
  const atMax = value >= options[options.length - 1];

  const button = (label: string, direction: -1 | 1, disabled: boolean) => (
    <Pressable
      onPress={() => step(direction)}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel={`${label === '−' ? 'Decrease' : 'Increase'} value`}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.backgroundSelected },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      {button('−', -1, atMin)}
      <ThemedText type="small" style={styles.value}>
        {format(value)}
      </ThemedText>
      {button('＋', 1, atMax)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
  value: {
    minWidth: 56,
    textAlign: 'center',
  },
});
