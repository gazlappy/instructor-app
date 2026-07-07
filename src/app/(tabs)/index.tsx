import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonCard } from '@/components/lesson-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { Fab } from '@/components/ui/fab';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { listInstructors, listLessonDays, listLessonsForDay } from '@/db/queries';
import { getSettings } from '@/db/settings';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { addDays, dayOfMonth, monthTitle, startOfWeek, todayKey, weekdayShort, type DateKey } from '@/lib/dates';

export default function ScheduleScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [selectedDay, setSelectedDay] = useState<DateKey>(todayKey());
  const [instructorFilter, setInstructorFilter] = useState<number | null>(null);

  const weekStart = startOfWeek(selectedDay);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const { data: instructors } = useQuery((db) => listInstructors(db));
  const { data: settings } = useQuery((db) => getSettings(db));
  const { data: lessons } = useQuery(
    (db) => listLessonsForDay(db, selectedDay, instructorFilter),
    [selectedDay, instructorFilter]
  );
  const { data: lessonDays } = useQuery(
    (db) => listLessonDays(db, weekStart, addDays(weekStart, 6), instructorFilter),
    [weekStart, instructorFilter]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            {!!settings?.schoolName && (
              <ThemedText type="smallBold" themeColor="textSecondary">
                {settings.schoolName}
              </ThemedText>
            )}
            <ThemedText type="subtitle">{monthTitle(selectedDay)}</ThemedText>
          </View>
          <Chip label="Today" selected={selectedDay === todayKey()} onPress={() => setSelectedDay(todayKey())} />
        </View>

        <View style={styles.weekRow}>
          <Pressable hitSlop={8} onPress={() => setSelectedDay(addDays(selectedDay, -7))}>
            <ThemedText type="subtitle" themeColor="textSecondary">
              ‹
            </ThemedText>
          </Pressable>
          {weekDays.map((day) => {
            const selected = day === selectedDay;
            const isToday = day === todayKey();
            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[styles.dayCell, { backgroundColor: selected ? theme.tint : 'transparent' }]}>
                <ThemedText
                  type="small"
                  style={{ color: selected ? theme.onTint : theme.textSecondary }}>
                  {weekdayShort(day)[0]}
                </ThemedText>
                <ThemedText
                  type="smallBold"
                  style={{ color: selected ? theme.onTint : isToday ? theme.tint : theme.text }}>
                  {dayOfMonth(day)}
                </ThemedText>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: lessonDays?.includes(day)
                        ? selected
                          ? theme.onTint
                          : theme.tint
                        : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
          <Pressable hitSlop={8} onPress={() => setSelectedDay(addDays(selectedDay, 7))}>
            <ThemedText type="subtitle" themeColor="textSecondary">
              ›
            </ThemedText>
          </Pressable>
        </View>

        {instructors && instructors.length > 1 && (
          <View style={styles.filterRow}>
            <Chip label="All" selected={instructorFilter === null} onPress={() => setInstructorFilter(null)} />
            {instructors.map((instructor) => (
              <Chip
                key={instructor.id}
                label={instructor.name}
                dotColor={instructor.color}
                selected={instructorFilter === instructor.id}
                onPress={() => setInstructorFilter(instructor.id)}
              />
            ))}
          </View>
        )}

        <FlatList
          data={lessons ?? []}
          keyExtractor={(lesson) => String(lesson.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LessonCard
              lesson={item}
              onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: String(item.id) } })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText themeColor="textSecondary">No lessons on this day.</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Tap + to book one.
              </ThemedText>
            </View>
          }
        />
      </SafeAreaView>
      <Fab onPress={() => router.push({ pathname: '/lesson/new', params: { date: selectedDay } })} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.three + TopTabInset,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
    gap: Spacing.half,
    minWidth: 40,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.six,
    gap: Spacing.one,
  },
});
