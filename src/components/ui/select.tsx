import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SelectOption<T> {
  value: T;
  label: string;
  /** Small colored dot before the label (e.g. instructor color). */
  dotColor?: string;
}

/** Dropdown field: shows the current value, opens a modal list to change it. */
export function Select<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
}: {
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const pick = (option: SelectOption<T>) => {
    onChange(option.value);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <View style={styles.fieldValue}>
          {selected?.dotColor ? (
            <View style={[styles.dot, { backgroundColor: selected.dotColor }]} />
          ) : null}
          <ThemedText style={{ color: selected ? theme.text : theme.textSecondary }} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          ▾
        </ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}} style={styles.cardWrap}>
            <ThemedView type="background" style={styles.card}>
              <ScrollView>
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <Pressable
                      key={String(option.value)}
                      onPress={() => pick(option)}
                      style={({ pressed }) => [
                        styles.option,
                        isSelected && { backgroundColor: theme.backgroundElement },
                        pressed && styles.pressed,
                      ]}>
                      {option.dotColor ? (
                        <View style={[styles.dot, { backgroundColor: option.dotColor }]} />
                      ) : null}
                      <ThemedText style={styles.optionLabel} numberOfLines={1}>
                        {option.label}
                      </ThemedText>
                      {isSelected && (
                        <ThemedText type="smallBold" style={{ color: theme.tint }}>
                          ✓
                        </ThemedText>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  cardWrap: {
    width: 320,
    maxWidth: '100%',
    maxHeight: '65%',
  },
  card: {
    borderRadius: Spacing.four,
    paddingVertical: Spacing.two,
    overflow: 'hidden',
    flexShrink: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  optionLabel: {
    flex: 1,
  },
});
