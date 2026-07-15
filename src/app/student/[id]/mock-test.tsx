import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlobalNavBar } from '@/components/nav-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { FormInput } from '@/components/ui/form';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { createMockTestResult, getStudent } from '@/db/queries';
import { MOCK_TEST_DRIVING_FAULT_LIMIT, MOCK_TEST_ITEMS, type MockFaultEntry } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';

interface ItemMarks {
  driving: number;
  serious: boolean;
  dangerous: boolean;
}

const NO_MARKS: ItemMarks = { driving: 0, serious: false, dangerous: false };

/** Small round toggle for a serious (S) or dangerous (D) fault. */
function FaultToggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityLabel={`${label === 'S' ? 'Serious' : 'Dangerous'} fault`}
      style={({ pressed }) => [
        styles.faultToggle,
        {
          backgroundColor: active ? theme.danger : 'transparent',
          borderColor: active ? theme.danger : theme.backgroundSelected,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: active ? theme.onTint : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/**
 * Marking sheet for an in-car mock driving test, in the style of the
 * examiner's report: tally driving faults per assessment item and flag
 * anything serious or dangerous. Wording is our own.
 */
export default function MockTestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Number(id);
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();

  const { data: student } = useQuery((db) => getStudent(db, studentId), [studentId]);

  const [marks, setMarks] = useState<Map<string, ItemMarks>>(() => new Map());
  const [notes, setNotes] = useState('');

  const setMark = (item: string, update: Partial<ItemMarks>) => {
    setMarks((current) => {
      const next = new Map(current);
      next.set(item, { ...(current.get(item) ?? NO_MARKS), ...update });
      return next;
    });
  };

  const totals = useMemo(() => {
    let driving = 0;
    let serious = 0;
    let dangerous = 0;
    for (const mark of marks.values()) {
      driving += mark.driving;
      if (mark.serious) serious++;
      if (mark.dangerous) dangerous++;
    }
    return { driving, serious, dangerous };
  }, [marks]);

  const failed = totals.serious > 0 || totals.dangerous > 0 || totals.driving > MOCK_TEST_DRIVING_FAULT_LIMIT;

  const save = async () => {
    const faults: MockFaultEntry[] = MOCK_TEST_ITEMS.map((item) => {
      const mark = marks.get(item) ?? NO_MARKS;
      return { item, driving: mark.driving, serious: mark.serious, dangerous: mark.dangerous };
    });
    await createMockTestResult(db, {
      studentId,
      result: failed ? 'fail' : 'pass',
      faults,
      notes: notes.trim() || null,
    });
    showAlert(
      failed ? 'Recorded — not a pass this time' : 'Recorded — that was a pass!',
      `${totals.driving} driving, ${totals.serious} serious, ${totals.dangerous} dangerous.`
    );
    router.back();
  };

  if (!student) return <ThemedView style={styles.container} />;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Mock test' }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View>
            <ThemedText type="subtitle">
              {student.firstName} {student.lastName}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Tap − / + to tally driving faults; S and D flag a serious or dangerous fault.
            </ThemedText>
          </View>

          {/* Live verdict plate, styled like a test result sign. */}
          <View
            style={[
              styles.verdict,
              { backgroundColor: failed ? theme.danger : theme.success },
            ]}>
            <ThemedText type="smallBold" style={[styles.verdictText, { color: theme.onTint }]}>
              {failed ? 'FAIL' : 'PASS'} — {totals.driving} driving
              {totals.driving > MOCK_TEST_DRIVING_FAULT_LIMIT ? ` (over ${MOCK_TEST_DRIVING_FAULT_LIMIT})` : ''} ·{' '}
              {totals.serious} serious · {totals.dangerous} dangerous
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.sheet}>
            {MOCK_TEST_ITEMS.map((item, index) => {
              const mark = marks.get(item) ?? NO_MARKS;
              const marked = mark.driving > 0 || mark.serious || mark.dangerous;
              return (
                <View
                  key={item}
                  style={[
                    styles.itemRow,
                    index > 0 && {
                      borderTopColor: theme.backgroundSelected,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                  ]}>
                  <ThemedText
                    type="small"
                    themeColor={marked ? 'text' : 'textSecondary'}
                    style={styles.itemName}>
                    {item}
                  </ThemedText>
                  <View style={styles.controls}>
                    <Pressable
                      onPress={() => setMark(item, { driving: Math.max(0, mark.driving - 1) })}
                      hitSlop={4}
                      accessibilityLabel="Remove driving fault"
                      style={({ pressed }) => [
                        styles.countButton,
                        { borderColor: theme.backgroundSelected },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        −
                      </ThemedText>
                    </Pressable>
                    <ThemedText
                      type="smallBold"
                      style={[styles.count, mark.driving > 0 && { color: theme.tint }]}>
                      {mark.driving}
                    </ThemedText>
                    <Pressable
                      onPress={() => setMark(item, { driving: mark.driving + 1 })}
                      hitSlop={4}
                      accessibilityLabel="Add driving fault"
                      style={({ pressed }) => [
                        styles.countButton,
                        { borderColor: theme.backgroundSelected },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        +
                      </ThemedText>
                    </Pressable>
                    <FaultToggle
                      label="S"
                      active={mark.serious}
                      onPress={() => setMark(item, { serious: !mark.serious })}
                    />
                    <FaultToggle
                      label="D"
                      active={mark.dangerous}
                      onPress={() => setMark(item, { dangerous: !mark.dangerous })}
                    />
                  </View>
                </View>
              );
            })}
          </ThemedView>

          <ThemedText type="smallBold" themeColor="textSecondary">
            DEBRIEF NOTES
          </ThemedText>
          <FormInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Debrief points, what to practise before the real thing…"
          />

          <View style={styles.buttons}>
            <View style={styles.spacer} />
            <Chip label="Cancel" onPress={() => router.back()} />
            <Chip label="Save result" selected onPress={save} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <GlobalNavBar />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  verdict: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  verdictText: {
    textAlign: 'center',
  },
  sheet: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    minHeight: 48,
  },
  itemName: {
    flex: 1,
    flexShrink: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  countButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    minWidth: 22,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  faultToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.one,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  spacer: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
