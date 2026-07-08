import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateUK, fromDateKey, toDateKey, todayKey } from '@/lib/dates';

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Cells for a Monday-based month grid: leading nulls, then day numbers. */
function monthCells(year: number, month: number): (number | null)[] {
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

/**
 * Date field that opens a calendar picker. Value is a 'YYYY-MM-DD' key
 * ('' when unset); display is UK-format DD/MM/YYYY.
 */
export function DateInput({
  value,
  onChange,
  placeholder = 'Not set',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const initial = value ? fromDateKey(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const openPicker = () => {
    const base = value ? fromDateKey(value) : new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    const shifted = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(shifted.getFullYear());
    setViewMonth(shifted.getMonth());
  };

  const pick = (day: number) => {
    onChange(toDateKey(new Date(viewYear, viewMonth, day)));
    setOpen(false);
  };

  const cells = monthCells(viewYear, viewMonth);
  const selected = value || null;
  const today = todayKey();

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <ThemedText style={{ color: value ? theme.text : theme.textSecondary }}>
          {value ? formatDateUK(value) : placeholder}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          📅
        </ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}}>
            <ThemedView type="background" style={styles.card}>
              <View style={styles.header}>
                <Pressable hitSlop={8} onPress={() => shiftMonth(-12)}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    «
                  </ThemedText>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => shiftMonth(-1)}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    ‹
                  </ThemedText>
                </Pressable>
                <ThemedText type="smallBold" style={styles.headerTitle}>
                  {MONTHS[viewMonth]} {viewYear}
                </ThemedText>
                <Pressable hitSlop={8} onPress={() => shiftMonth(1)}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    ›
                  </ThemedText>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => shiftMonth(12)}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    »
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.grid}>
                {WEEKDAY_HEADERS.map((label, i) => (
                  <View key={`h${i}`} style={styles.cell}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {label}
                    </ThemedText>
                  </View>
                ))}
                {cells.map((day, i) => {
                  if (day === null) return <View key={`e${i}`} style={styles.cell} />;
                  const key = toDateKey(new Date(viewYear, viewMonth, day));
                  const isSelected = key === selected;
                  const isToday = key === today;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => pick(day)}
                      style={({ pressed }) => [
                        styles.cell,
                        styles.dayCell,
                        isSelected && { backgroundColor: theme.tint },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText
                        type={isToday && !isSelected ? 'smallBold' : 'small'}
                        style={{
                          color: isSelected ? theme.onTint : isToday ? theme.tint : theme.text,
                        }}>
                        {day}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.footer}>
                {!!value && <Chip label="Clear" onPress={() => { onChange(''); setOpen(false); }} />}
                <View style={styles.spacer} />
                <Chip
                  label="Today"
                  onPress={() => {
                    onChange(today);
                    setOpen(false);
                  }}
                />
                <Chip label="Close" onPress={() => setOpen(false)} />
              </View>
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
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    width: 320,
    maxWidth: '100%',
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  dayCell: {
    borderRadius: 999,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  spacer: {
    flex: 1,
  },
});
