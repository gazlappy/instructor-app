import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlobalNavBar } from '@/components/nav-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AddressInput } from '@/components/ui/address-input';
import { Chip } from '@/components/ui/chip';
import { DateInput } from '@/components/ui/date-input';
import { Field, FormInput } from '@/components/ui/form';
import { Select } from '@/components/ui/select';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { createLesson, deleteLesson, listInstructors, listStudents, updateLesson } from '@/db/queries';
import {
  LESSON_STATUS_LABELS,
  LESSON_TYPE_LABELS,
  type Lesson,
  type LessonStatus,
  type LessonType,
} from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useAppSettings } from '@/hooks/app-settings';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive, showAlert } from '@/lib/alert';
import { formatMinutes, todayKey } from '@/lib/dates';


export function LessonForm({
  existing,
  initialDate,
  initialStudentId,
  initialStartMinutes,
}: {
  existing?: Lesson;
  initialDate?: string;
  initialStudentId?: number;
  initialStartMinutes?: number;
}) {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();

  const { data: students } = useQuery((db) => listStudents(db));
  const { data: instructors } = useQuery((db) => listInstructors(db));
  const { settings } = useAppSettings();

  const [studentId, setStudentId] = useState<number | null>(existing?.studentId ?? initialStudentId ?? null);
  const [instructorId, setInstructorId] = useState<number | null>(existing?.instructorId ?? null);
  const [date, setDate] = useState(existing?.date ?? initialDate ?? todayKey());
  const [startMinutes, setStartMinutes] = useState(existing?.startMinutes ?? initialStartMinutes ?? 9 * 60);
  // null = untouched; falls back to the default duration from Settings.
  const [durationMinutes, setDurationMinutes] = useState<number | null>(existing?.durationMinutes ?? null);
  const [type, setType] = useState<LessonType>(existing?.type ?? settings.defaultLessonType);
  // null = untouched; falls back to the student's pickup address for new lessons.
  const [pickupLocation, setPickupLocation] = useState<string | null>(
    existing ? (existing.pickupLocation ?? '') : null
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [status, setStatus] = useState<LessonStatus>(existing?.status ?? 'scheduled');

  const selectableStudents = useMemo(
    () => (students ?? []).filter((s) => s.status !== 'passed' || s.id === studentId),
    [students, studentId]
  );

  const pickStudent = (id: number) => {
    setStudentId(id);
    const student = students?.find((s) => s.id === id);
    if (student && !existing) setInstructorId(student.instructorId);
  };

  const effectiveInstructorId = instructorId ?? instructors?.[0]?.id ?? null;
  const selectedStudent = students?.find((s) => s.id === studentId);
  const effectivePickup = pickupLocation ?? selectedStudent?.pickupAddress ?? '';
  const effectiveDuration = durationMinutes ?? settings.defaultDurationMinutes;
  const estimatedPrice = (settings.hourlyRate * effectiveDuration) / 60;

  const timeSlots = useMemo(() => {
    const slots: number[] = [];
    for (let m = settings.dayStartMinutes; m <= settings.dayEndMinutes; m += settings.slotIntervalMinutes) {
      slots.push(m);
    }
    // Keep an existing lesson's time selectable even if outside working hours.
    if (!slots.includes(startMinutes)) slots.unshift(startMinutes);
    return slots;
  }, [settings, startMinutes]);

  const durationChoices = useMemo(() => {
    const list = [...settings.durationOptions];
    // Keep an existing lesson's length selectable even if no longer offered.
    if (!list.includes(effectiveDuration)) list.push(effectiveDuration);
    return list.sort((a, b) => a - b);
  }, [settings, effectiveDuration]);

  const save = async () => {
    if (!studentId) {
      showAlert('Pick a student');
      return;
    }
    if (!effectiveInstructorId) {
      showAlert('Add an instructor first', 'Create an instructor in the Settings tab.');
      return;
    }
    const input = {
      studentId,
      instructorId: effectiveInstructorId,
      date,
      startMinutes,
      durationMinutes: effectiveDuration,
      type,
      pickupLocation: effectivePickup.trim() || null,
      notes: notes.trim() || null,
      status,
    };
    if (existing) {
      await updateLesson(db, existing.id, input);
    } else {
      await createLesson(db, input);
    }
    router.back();
  };

  const confirmDelete = () => {
    if (!existing) return;
    confirmDestructive('Delete lesson?', 'This cannot be undone.', 'Delete', async () => {
      await deleteLesson(db, existing.id);
      router.back();
    });
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Field label="Student">
            {selectableStudents.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No students yet — add one in the Students tab first.
              </ThemedText>
            ) : (
              <Select
                placeholder="Choose a student…"
                options={selectableStudents.map((s) => ({
                  value: s.id,
                  label: `${s.firstName} ${s.lastName}`.trim(),
                  dotColor: s.instructorColor,
                }))}
                value={studentId}
                onChange={pickStudent}
              />
            )}
          </Field>

          <View style={styles.fieldRow}>
            <View style={styles.flex}>
              <Field label="Date">
                <DateInput value={date} onChange={setDate} allowClear={false} />
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label="Start time">
                <Select
                  options={timeSlots.map((m) => ({
                    value: m,
                    label: formatMinutes(m, settings.use12HourTime),
                  }))}
                  value={startMinutes}
                  onChange={setStartMinutes}
                />
              </Field>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.flex}>
              <Field label="Duration">
                <Select
                  options={durationChoices.map((d) => ({ value: d, label: `${d} min` }))}
                  value={effectiveDuration}
                  onChange={setDurationMinutes}
                />
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label="Type">
                <Select
                  options={(Object.keys(LESSON_TYPE_LABELS) as LessonType[]).map((t) => ({
                    value: t,
                    label: LESSON_TYPE_LABELS[t],
                  }))}
                  value={type}
                  onChange={setType}
                />
              </Field>
            </View>
          </View>
          {settings.hourlyRate > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Estimated price: {settings.currency}
              {estimatedPrice.toFixed(2).replace(/\.00$/, '')}
            </ThemedText>
          )}

          <Field label="Instructor">
            <Select
              options={(instructors ?? []).map((i) => ({ value: i.id, label: i.name, dotColor: i.color }))}
              value={effectiveInstructorId}
              onChange={setInstructorId}
            />
          </Field>

          {existing && (
            <Field label="Status">
              <Select
                options={(Object.keys(LESSON_STATUS_LABELS) as LessonStatus[]).map((s) => ({
                  value: s,
                  label: LESSON_STATUS_LABELS[s],
                }))}
                value={status}
                onChange={setStatus}
              />
            </Field>
          )}

          <Field label="Pickup location">
            <AddressInput
              value={effectivePickup}
              onChange={setPickupLocation}
              placeholder="Start typing an address…"
            />
          </Field>

          <Field label="Notes">
            <FormInput value={notes} onChangeText={setNotes} multiline />
          </Field>

          <View style={styles.buttons}>
            {existing && (
              <Pressable onPress={confirmDelete}>
                <ThemedText type="small" style={{ color: theme.danger, padding: Spacing.two }}>
                  Delete
                </ThemedText>
              </Pressable>
            )}
            <View style={styles.spacer} />
            <Chip label="Cancel" onPress={() => router.back()} />
            <Chip label={existing ? 'Save changes' : 'Book lesson'} selected onPress={save} />
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
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  spacer: {
    flex: 1,
  },
});
