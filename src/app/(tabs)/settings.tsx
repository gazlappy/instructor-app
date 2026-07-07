import { useSQLiteContext } from 'expo-sqlite';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { FormInput } from '@/components/ui/form';
import { Stepper } from '@/components/ui/stepper';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { createInstructor, listInstructors, setInstructorArchived, updateInstructor } from '@/db/queries';
import { eraseAllData } from '@/db/schema';
import {
  CURRENCY_OPTIONS,
  DURATION_OPTIONS,
  HOURLY_RATE_OPTIONS,
  SLOT_INTERVAL_OPTIONS,
  type AppSettings,
  type StudentSort,
  type ThemePreference,
  type WeekStart,
} from '@/db/settings';
import { INSTRUCTOR_COLORS, type Instructor, type LessonType } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useAppSettings } from '@/hooks/app-settings';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/alert';
import { formatMinutes } from '@/lib/dates';

const DAY_START_OPTIONS = Array.from({ length: 17 }, (_, i) => 4 * 60 + i * 30); // 04:00–12:00
const DAY_END_OPTIONS = Array.from({ length: 22 }, (_, i) => 13 * 60 + i * 30); // 13:00–23:30

const THEME_LABELS: Record<ThemePreference, string> = { system: 'System', light: 'Light', dark: 'Dark' };
const WEEK_START_LABELS: Record<WeekStart, string> = { monday: 'Mon', sunday: 'Sun' };
const LESSON_TYPE_SHORT: Record<LessonType, string> = { lesson: 'Lesson', mock_test: 'Mock', driving_test: 'Test' };
const STUDENT_SORT_LABELS: Record<StudentSort, string> = { name: 'Name', nextLesson: 'Next lesson' };

// --- building blocks ---

function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {right}
    </View>
  );
}

function SettingRow({ label, first, children }: { label: string; first?: boolean; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.settingRow,
        !first && { borderTopColor: theme.backgroundSelected, borderTopWidth: StyleSheet.hairlineWidth },
      ]}>
      <ThemedText type="small" style={styles.settingLabel}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function ChipGroup<T extends string>({
  labels,
  value,
  onChange,
}: {
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {(Object.keys(labels) as T[]).map((option) => (
        <Chip key={option} label={labels[option]} selected={value === option} onPress={() => onChange(option)} />
      ))}
    </View>
  );
}

function SettingSwitch({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  const theme = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: theme.tint, false: theme.backgroundSelected }}
    />
  );
}

// --- the draft-based settings form ---

function SettingsForm() {
  const { settings, save } = useAppSettings();
  const theme = useTheme();
  // Only edited fields live here; everything else follows the stored settings.
  const [overrides, setOverrides] = useState<Partial<AppSettings>>({});
  const [justSaved, setJustSaved] = useState(false);

  const draft: AppSettings = { ...settings, ...overrides };
  const dirty = (Object.keys(overrides) as (keyof AppSettings)[]).some(
    (key) => overrides[key] !== settings[key]
  );

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setJustSaved(false);
    setOverrides((current) => ({ ...current, [key]: value }));
  };

  const onSave = async () => {
    await save(draft);
    setOverrides({});
    setJustSaved(true);
  };

  const onDiscard = () => {
    setOverrides({});
    setJustSaved(false);
  };

  return (
    <>
      <SectionHeader title="GENERAL" />
      <ThemedView type="backgroundElement" style={styles.settingsCard}>
        <SettingRow label="School name" first>
          <FormInput
            placeholder="Add name"
            value={draft.schoolName}
            onChangeText={(text) => set('schoolName', text)}
            style={[styles.settingInput, { backgroundColor: theme.background }]}
          />
        </SettingRow>
        <SettingRow label="Appearance">
          <ChipGroup labels={THEME_LABELS} value={draft.theme} onChange={(v) => set('theme', v)} />
        </SettingRow>
        <SettingRow label="Week starts">
          <ChipGroup labels={WEEK_START_LABELS} value={draft.weekStart} onChange={(v) => set('weekStart', v)} />
        </SettingRow>
        <SettingRow label="12-hour time">
          <SettingSwitch value={draft.use12HourTime} onChange={(v) => set('use12HourTime', v)} />
        </SettingRow>
      </ThemedView>

      <SectionHeader title="LESSONS" />
      <ThemedView type="backgroundElement" style={styles.settingsCard}>
        <SettingRow label="Default duration" first>
          <Stepper
            value={draft.defaultDurationMinutes}
            options={DURATION_OPTIONS}
            format={(d) => `${d} min`}
            onChange={(v) => set('defaultDurationMinutes', v)}
          />
        </SettingRow>
        <SettingRow label="Default type">
          <ChipGroup
            labels={LESSON_TYPE_SHORT}
            value={draft.defaultLessonType}
            onChange={(v) => set('defaultLessonType', v)}
          />
        </SettingRow>
        <SettingRow label="Day starts">
          <Stepper
            value={draft.dayStartMinutes}
            options={DAY_START_OPTIONS}
            format={(m) => formatMinutes(m, draft.use12HourTime)}
            onChange={(v) => set('dayStartMinutes', v)}
          />
        </SettingRow>
        <SettingRow label="Day ends">
          <Stepper
            value={draft.dayEndMinutes}
            options={DAY_END_OPTIONS}
            format={(m) => formatMinutes(m, draft.use12HourTime)}
            onChange={(v) => set('dayEndMinutes', v)}
          />
        </SettingRow>
        <SettingRow label="Time slots every">
          <Stepper
            value={draft.slotIntervalMinutes}
            options={SLOT_INTERVAL_OPTIONS}
            format={(m) => `${m} min`}
            onChange={(v) => set('slotIntervalMinutes', v)}
          />
        </SettingRow>
        <SettingRow label="Hide cancelled">
          <SettingSwitch value={draft.hideCancelled} onChange={(v) => set('hideCancelled', v)} />
        </SettingRow>
      </ThemedView>

      <SectionHeader title="PRICING" />
      <ThemedView type="backgroundElement" style={styles.settingsCard}>
        <SettingRow label="Currency" first>
          <View style={styles.chipRow}>
            {CURRENCY_OPTIONS.map((symbol) => (
              <Chip
                key={symbol}
                label={symbol}
                selected={draft.currency === symbol}
                onPress={() => set('currency', symbol)}
              />
            ))}
          </View>
        </SettingRow>
        <SettingRow label="Hourly rate">
          <Stepper
            value={draft.hourlyRate}
            options={HOURLY_RATE_OPTIONS}
            format={(rate) => `${draft.currency}${rate}`}
            onChange={(v) => set('hourlyRate', v)}
          />
        </SettingRow>
      </ThemedView>

      <SectionHeader title="STUDENTS" />
      <ThemedView type="backgroundElement" style={styles.settingsCard}>
        <SettingRow label="Sort by" first>
          <ChipGroup
            labels={STUDENT_SORT_LABELS}
            value={draft.studentSort}
            onChange={(v) => set('studentSort', v)}
          />
        </SettingRow>
        <SettingRow label="Show passed">
          <SettingSwitch value={draft.showPassedStudents} onChange={(v) => set('showPassedStudents', v)} />
        </SettingRow>
      </ThemedView>

      {(dirty || justSaved) && (
        <View style={styles.saveBar}>
          {justSaved && !dirty ? (
            <ThemedText type="small" themeColor="textSecondary">
              Settings saved ✓
            </ThemedText>
          ) : (
            <>
              <Chip label="Discard" onPress={onDiscard} />
              <Chip label="Save settings" selected onPress={onSave} />
            </>
          )}
        </View>
      )}
    </>
  );
}

// --- instructors ---

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.colorRow}>
      {INSTRUCTOR_COLORS.map((color) => (
        <Pressable
          key={color}
          onPress={() => onChange(color)}
          style={[
            styles.swatch,
            { backgroundColor: color },
            value === color && { borderWidth: 3, borderColor: theme.text },
          ]}
        />
      ))}
    </View>
  );
}

function InstructorEditor({ instructor, onDone }: { instructor: Instructor | null; onDone: () => void }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [name, setName] = useState(instructor?.name ?? '');
  const [color, setColor] = useState(instructor?.color ?? INSTRUCTOR_COLORS[0]);
  const [phone, setPhone] = useState(instructor?.phone ?? '');

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (instructor) {
      await updateInstructor(db, instructor.id, { name: trimmed, color, phone: phone.trim() || null });
    } else {
      await createInstructor(db, { name: trimmed, color, phone: phone.trim() || null });
    }
    onDone();
  };

  return (
    <ThemedView type="backgroundElement" style={styles.editor}>
      <FormInput placeholder="Name" value={name} onChangeText={setName} autoFocus={!instructor} />
      <FormInput placeholder="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <ColorPicker value={color} onChange={setColor} />
      <View style={styles.editorButtons}>
        <Chip label="Cancel" onPress={onDone} />
        {instructor && (
          <Pressable
            onPress={() => {
              confirmDestructive(
                'Archive instructor?',
                `${instructor.name} will be hidden from pickers.`,
                'Archive',
                async () => {
                  await setInstructorArchived(db, instructor.id, true);
                  onDone();
                }
              );
            }}>
            <ThemedText type="small" style={{ color: theme.danger, padding: Spacing.two }}>
              Archive
            </ThemedText>
          </Pressable>
        )}
        <View style={styles.spacer} />
        <Chip label="Save" selected onPress={save} />
      </View>
    </ThemedView>
  );
}

// --- danger zone ---

function DangerZone({ onErased }: { onErased: () => void }) {
  const db = useSQLiteContext();
  const theme = useTheme();

  const confirmErase = () => {
    confirmDestructive(
      'Erase all data?',
      'This permanently deletes every student, lesson, instructor, and setting on this device.',
      'Erase everything',
      async () => {
        await eraseAllData(db);
        onErased();
      }
    );
  };

  return (
    <>
      <SectionHeader title="DANGER ZONE" />
      <Pressable onPress={confirmErase} style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.row}>
          <ThemedText type="small" style={{ color: theme.danger }}>
            Erase all data
          </ThemedText>
        </ThemedView>
      </Pressable>
    </>
  );
}

// --- screen ---

export default function SettingsScreen() {
  const { reload } = useAppSettings();
  const { data: instructors, refresh } = useQuery((db) => listInstructors(db));
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  // Bumped after "erase all data" to remount the settings form with fresh values.
  const [resetCount, setResetCount] = useState(0);

  const closeEditor = () => {
    setEditingId(null);
    refresh();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle" style={styles.title}>
            Settings
          </ThemedText>

          <SettingsForm key={resetCount} />

          <SectionHeader title="INSTRUCTORS" right={<Chip label="Add" onPress={() => setEditingId('new')} />} />

          {editingId === 'new' && <InstructorEditor instructor={null} onDone={closeEditor} />}

          <View style={styles.list}>
            {(instructors ?? []).map((instructor) =>
              editingId === instructor.id ? (
                <InstructorEditor key={instructor.id} instructor={instructor} onDone={closeEditor} />
              ) : (
                <Pressable
                  key={instructor.id}
                  onPress={() => setEditingId(instructor.id)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView type="backgroundElement" style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: instructor.color }]} />
                    <View style={styles.rowBody}>
                      <ThemedText>{instructor.name}</ThemedText>
                      {instructor.phone && (
                        <ThemedText type="small" themeColor="textSecondary">
                          {instructor.phone}
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      Edit
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              )
            )}
          </View>

          <DangerZone
            onErased={async () => {
              await reload();
              setResetCount((c) => c + 1);
              refresh();
            }}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
            Data is stored locally on this device.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  scroll: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  title: {
    paddingTop: Spacing.three + TopTabInset,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  editor: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  editorButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  spacer: {
    flex: 1,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  settingsCard: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 52,
  },
  settingLabel: {
    flexShrink: 0,
  },
  settingInput: {
    flex: 1,
    maxWidth: 260,
    paddingVertical: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  saveBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footer: {
    textAlign: 'center',
    paddingTop: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
