import { ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

export function FormInput(props: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      {...props}
      style={[
        styles.input,
        { backgroundColor: theme.backgroundElement, color: theme.text },
        props.multiline && styles.multiline,
        props.style,
      ]}
    />
  );
}

export interface ChipOption<T> {
  value: T;
  label: string;
  dotColor?: string;
}

/** A horizontally scrolling single-select row of chips. */
export function ChipSelect<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((option) => (
        <Chip
          key={String(option.value)}
          label={option.label}
          dotColor={option.dotColor}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
