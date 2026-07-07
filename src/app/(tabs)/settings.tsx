import { useSQLiteContext } from 'expo-sqlite';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { FormInput } from '@/components/ui/form';
import { Stepper } from '@/components/ui/stepper';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { createInstructor, listInstructors, setInstructorArchived, updateInstructor } from '@/db/queries';
import { DURATION_OPTIONS, getSettings, saveSetting, type AppSettings } from '@/db/settings';
import { INSTRUCTOR_COLORS, type Instructor } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/alert';
import { formatMinutes } from '@/lib/dates';

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

function InstructorEditor({
  instructor,
  onDone,
}: {
  instructor: Instructor | null;
  onDone: () => void;
}) {
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

const DAY_START_OPTIONS = Array.from({ length: 17 }, (_, i) => 4 * 60 + i * 30); // 04:00–12:00
const DAY_END_OPTIONS = Array.from({ length: 22 }, (_, i) => 13 * 60 + i * 30); // 13:00–23:30

function SettingRow({
  label,
  first,
  children,
}: {
  label: string;
  first?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.settingRow, !first && { borderTopColor: theme.backgroundSelected, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <ThemedText type="small" style={styles.settingLabel}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function GeneralSettings() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { data: settings, refresh } = useQuery((db) => getSettings(db));
  // null = untouched; falls back to the stored value.
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  if (!settings) return null;

  const save = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    await saveSetting(db, key, value);
    refresh();
  };

  return (
    <>
      <ThemedText type="smallBold" themeColor="textSecondary">
        GENERAL
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.settingsCard}>
        <SettingRow label="School name" first>
          <FormInput
            placeholder="Add name"
            value={nameDraft ?? settings.schoolName}
            onChangeText={(text) => {
              setNameDraft(text);
              saveSetting(db, 'schoolName', text.trim());
            }}
            style={[styles.settingInput, { backgroundColor: theme.background }]}
          />
        </SettingRow>
        <SettingRow label="Lesson duration">
          <Stepper
            value={settings.defaultDurationMinutes}
            options={DURATION_OPTIONS}
            format={(d) => `${d} min`}
            onChange={(value) => save('defaultDurationMinutes', value)}
          />
        </SettingRow>
        <SettingRow label="Day starts">
          <Stepper
            value={settings.dayStartMinutes}
            options={DAY_START_OPTIONS}
            format={formatMinutes}
            onChange={(value) => save('dayStartMinutes', value)}
          />
        </SettingRow>
        <SettingRow label="Day ends">
          <Stepper
            value={settings.dayEndMinutes}
            options={DAY_END_OPTIONS}
            format={formatMinutes}
            onChange={(value) => save('dayEndMinutes', value)}
          />
        </SettingRow>
      </ThemedView>
    </>
  );
}

export default function SettingsScreen() {
  const { data: instructors, refresh } = useQuery((db) => listInstructors(db));
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);

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

          <GeneralSettings />

          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              INSTRUCTORS
            </ThemedText>
            <Chip label="Add" onPress={() => setEditingId('new')} />
          </View>

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
  footer: {
    textAlign: 'center',
    paddingTop: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
