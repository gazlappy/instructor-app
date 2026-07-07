import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { ChipSelect, Field, FormInput } from '@/components/ui/form';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { createStudent, deleteStudent, listInstructors, updateStudent } from '@/db/queries';
import { STUDENT_STATUS_LABELS, type Student, type StudentStatus } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive, showAlert } from '@/lib/alert';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function StudentForm({ existing }: { existing?: Student }) {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const { data: instructors } = useQuery((db) => listInstructors(db));

  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [lastName, setLastName] = useState(existing?.lastName ?? '');
  const [instructorId, setInstructorId] = useState<number | null>(existing?.instructorId ?? null);
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [pickupAddress, setPickupAddress] = useState(existing?.pickupAddress ?? '');
  const [testDate, setTestDate] = useState(existing?.testDate ?? '');
  const [status, setStatus] = useState<StudentStatus>(existing?.status ?? 'active');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  // Default to the only/first instructor for new students.
  const effectiveInstructorId = instructorId ?? instructors?.[0]?.id ?? null;

  const save = async () => {
    if (!firstName.trim()) {
      showAlert('First name is required');
      return;
    }
    if (!effectiveInstructorId) {
      showAlert('Add an instructor first', 'Create an instructor in the Settings tab, then add students.');
      return;
    }
    const trimmedDate = testDate.trim();
    if (trimmedDate && !DATE_PATTERN.test(trimmedDate)) {
      showAlert('Invalid test date', 'Use the format YYYY-MM-DD, e.g. 2026-09-15.');
      return;
    }
    const input = {
      instructorId: effectiveInstructorId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      pickupAddress: pickupAddress.trim() || null,
      testDate: trimmedDate || null,
      status,
      notes: notes.trim() || null,
    };
    if (existing) {
      await updateStudent(db, existing.id, input);
    } else {
      await createStudent(db, input);
    }
    router.back();
  };

  const confirmDelete = () => {
    if (!existing) return;
    confirmDestructive(
      'Delete student?',
      'This permanently removes the student along with their lessons and progress.',
      'Delete',
      async () => {
        await deleteStudent(db, existing.id);
        // Leave both the edit form and the now-deleted detail screen.
        router.dismissTo('/students');
      }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.nameRow}>
            <View style={styles.flex}>
              <Field label="First name">
                <FormInput value={firstName} onChangeText={setFirstName} autoFocus={!existing} />
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label="Last name">
                <FormInput value={lastName} onChangeText={setLastName} />
              </Field>
            </View>
          </View>

          <Field label="Instructor">
            <ChipSelect
              options={(instructors ?? []).map((i) => ({ value: i.id, label: i.name, dotColor: i.color }))}
              value={effectiveInstructorId}
              onChange={setInstructorId}
            />
          </Field>

          <Field label="Phone">
            <FormInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </Field>
          <Field label="Email">
            <FormInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </Field>
          <Field label="Pickup address">
            <FormInput value={pickupAddress} onChangeText={setPickupAddress} />
          </Field>
          <Field label="Test date (YYYY-MM-DD)">
            <FormInput value={testDate} onChangeText={setTestDate} placeholder="2026-09-15" />
          </Field>

          {existing && (
            <Field label="Status">
              <ChipSelect
                options={(Object.keys(STUDENT_STATUS_LABELS) as StudentStatus[]).map((s) => ({
                  value: s,
                  label: STUDENT_STATUS_LABELS[s],
                }))}
                value={status}
                onChange={setStatus}
              />
            </Field>
          )}

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
            <Chip label={existing ? 'Save changes' : 'Add student'} selected onPress={save} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
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
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
  },
  spacer: {
    flex: 1,
  },
});
