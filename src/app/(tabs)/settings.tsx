import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { FormInput } from '@/components/ui/form';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { createInstructor, listInstructors, setInstructorArchived, updateInstructor } from '@/db/queries';
import { INSTRUCTOR_COLORS, type Instructor } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/alert';

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
