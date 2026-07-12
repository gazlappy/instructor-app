import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fab } from '@/components/ui/fab';
import { FormInput } from '@/components/ui/form';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { listStudents } from '@/db/queries';
import { STUDENT_STATUS_LABELS, type StudentListItem } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useAppSettings } from '@/hooks/app-settings';
import { useTheme } from '@/hooks/use-theme';
import { formatDateUK, todayKey } from '@/lib/dates';

function initials(student: StudentListItem): string {
  return `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();
}

export default function StudentsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { settings } = useAppSettings();
  const { data: students } = useQuery(
    (db) =>
      listStudents(db, {
        search,
        includePassed: settings.showPassedStudents,
        sort: settings.studentSort,
        today: todayKey(),
      }),
    [search, settings.showPassedStudents, settings.studentSort]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          Students
        </ThemedText>
        <FormInput placeholder="Search students" value={search} onChangeText={setSearch} />

        <FlatList
          data={students ?? []}
          keyExtractor={(student) => String(student.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/student/[id]', params: { id: String(item.id) } })}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: item.instructorColor }]}>
                  <ThemedText type="smallBold" style={{ color: '#fff' }}>
                    {initials(item)}
                  </ThemedText>
                </View>
                <View style={styles.rowBody}>
                  <ThemedText>
                    {item.firstName} {item.lastName}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.instructorName}
                    {item.testDate ? ` · Test ${formatDateUK(item.testDate)}` : ''}
                  </ThemedText>
                </View>
                {item.status !== 'active' && (
                  <ThemedText
                    type="small"
                    style={{ color: item.status === 'passed' ? theme.success : theme.textSecondary }}>
                    {STUDENT_STATUS_LABELS[item.status]}
                  </ThemedText>
                )}
              </ThemedView>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText themeColor="textSecondary">
                {search ? 'No students match your search.' : 'No students yet.'}
              </ThemedText>
              {!search && (
                <ThemedText type="small" themeColor="textSecondary">
                  Tap + to add your first student.
                </ThemedText>
              )}
            </View>
          }
        />
      </SafeAreaView>
      <Fab onPress={() => router.push('/student/new')} />
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
    gap: Spacing.three,
  },
  title: {
    paddingTop: Spacing.three + TopTabInset,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.six,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.six,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
