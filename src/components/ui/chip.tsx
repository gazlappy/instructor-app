import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Small colored dot shown before the label (e.g. instructor color). */
  dotColor?: string;
}

export function Chip({ label, selected, onPress, dotColor }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? theme.tint : theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      {dotColor ? <ThemedText style={{ color: dotColor, fontSize: 10 }}>●</ThemedText> : null}
      <ThemedText type="small" style={{ color: selected ? theme.onTint : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  pressed: {
    opacity: 0.7,
  },
});
