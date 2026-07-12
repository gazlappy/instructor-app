import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LessonCard } from '@/components/lesson-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { LevelDots } from '@/components/ui/level-dots';
import { PassedStamp } from '@/components/ui/passed-stamp';
import { RoadProgress } from '@/components/ui/road-progress';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  getProgressForStudent,
  getStudent,
  getStudentStats,
  listUpcomingLessonsForStudent,
  setSkillLevel,
} from '@/db/queries';
import {
  MAX_SKILL_LEVEL,
  SKILL_LEVELS,
  STUDENT_STATUS_LABELS,
  TRANSMISSION_LABELS,
  type SkillProgressRow,
} from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { formatDateUK, fromDateKey, shortDayTitle, todayKey } from '@/lib/dates';
import { mapsUrl } from '@/lib/links';

function ageFromDob(dob: string): number | null {
  const birth = fromDateKey(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Section label with road-chevron markers. */
function SectionTitle({ label, right }: { label: string; right?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLabel}>
        <ThemedText style={[styles.chevrons, { color: theme.tint }]}>››</ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
      {right}
    </View>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.statTile}>
      <ThemedText type="subtitle" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Number(id);
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();

  const { data: student } = useQuery((db) => getStudent(db, studentId), [studentId]);
  const { data: progress, refresh: refreshProgress } = useQuery(
    (db) => getProgressForStudent(db, studentId),
    [studentId]
  );
  const { data: upcoming } = useQuery(
    (db) => listUpcomingLessonsForStudent(db, studentId, todayKey()),
    [studentId]
  );
  const { data: stats } = useQuery((db) => getStudentStats(db, studentId, todayKey()), [studentId]);

  const grouped = useMemo(() => {
    const groups: { category: string; skills: SkillProgressRow[] }[] = [];
    for (const row of progress ?? []) {
      const last = groups[groups.length - 1];
      if (last && last.category === row.category) last.skills.push(row);
      else groups.push({ category: row.category, skills: [row] });
    }
    return groups;
  }, [progress]);

  const overallPct = useMemo(() => {
    if (!progress?.length) return 0;
    const total = progress.reduce((sum, row) => sum + row.level, 0);
    return Math.round((total / (progress.length * MAX_SKILL_LEVEL)) * 100);
  }, [progress]);

  if (!student) return <ThemedView style={styles.container} />;

  const age = student.dateOfBirth ? ageFromDob(student.dateOfBirth) : null;
  const hoursDriven = (stats?.completedMinutes ?? 0) / 60;

  const contactRows: { text: string; url?: string }[] = [
    student.phone ? { text: `📞 ${student.phone}`, url: `tel:${student.phone.replace(/\s/g, '')}` } : null,
    student.email ? { text: `✉️ ${student.email}`, url: `mailto:${student.email}` } : null,
    student.pickupAddress
      ? { text: `📍 ${student.pickupAddress}`, url: mapsUrl(student.pickupAddress) }
      : null,
    student.emergencyContact ? { text: `🆘 ${student.emergencyContact}` } : null,
  ].filter(Boolean) as { text: string; url?: string }[];

  const licenceLines = [
    age !== null && `${age} years old`,
    TRANSMISSION_LABELS[student.transmission],
    student.licenceNumber && `Licence: ${student.licenceNumber}`,
    student.theoryPassed
      ? `Theory passed${student.theoryTestDate ? ` ${formatDateUK(student.theoryTestDate)}` : ''} ✓`
      : 'Theory not passed yet',
    student.testDate &&
      `Driving test: ${formatDateUK(student.testDate)}${student.testCentre ? ` at ${student.testCentre}` : ''}`,
  ].filter(Boolean) as string[];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `${student.firstName} ${student.lastName}` }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <ThemedText type="subtitle">
              {student.firstName} {student.lastName}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {STUDENT_STATUS_LABELS[student.status]} · {student.instructorName}
            </ThemedText>
          </View>
          {student.status === 'passed' && <PassedStamp />}
          <Chip
            label="Edit"
            onPress={() => router.push({ pathname: '/student/[id]/edit', params: { id: String(studentId) } })}
          />
        </View>

        <View style={styles.statRow}>
          <StatTile value={String(stats?.completedLessons ?? 0)} label="Lessons done" />
          <StatTile
            value={hoursDriven % 1 === 0 ? String(hoursDriven) : hoursDriven.toFixed(1)}
            label="Hours driven"
          />
          <StatTile value={`${overallPct}%`} label="Progress" />
        </View>

        {contactRows.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.card}>
            {contactRows.map((row) =>
              row.url ? (
                <Pressable key={row.text} onPress={() => Linking.openURL(row.url!)} hitSlop={4}>
                  <ThemedText type="small" style={{ color: theme.tint }}>
                    {row.text}
                  </ThemedText>
                </Pressable>
              ) : (
                <ThemedText type="small" key={row.text}>
                  {row.text}
                </ThemedText>
              )
            )}
          </ThemedView>
        )}

        {licenceLines.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <SectionTitle label="LICENCE & TESTS" />
            {licenceLines.map((line) => (
              <ThemedText type="small" key={line}>
                {line}
              </ThemedText>
            ))}
          </ThemedView>
        )}

        {student.notes && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <SectionTitle label="NOTES" />
            <ThemedText type="small">{student.notes}</ThemedText>
          </ThemedView>
        )}

        <SectionTitle
          label="UPCOMING LESSONS"
          right={
            <Chip
              label="Book lesson"
              onPress={() =>
                router.push({ pathname: '/lesson/new', params: { studentId: String(studentId) } })
              }
            />
          }
        />
        {(upcoming ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nothing booked.
          </ThemedText>
        ) : (
          <View style={styles.list}>
            {(upcoming ?? []).map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                showDate={shortDayTitle(lesson.date)}
                onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: String(lesson.id) } })}
              />
            ))}
          </View>
        )}

        <SectionTitle
          label="ROAD TO TEST DAY"
          right={
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              {overallPct}%
            </ThemedText>
          }
        />
        <RoadProgress percent={overallPct} />
        <ThemedText type="small" themeColor="textSecondary">
          Tap the dots to record a level: {SKILL_LEVELS.slice(1).join(' → ')}.
        </ThemedText>

        {grouped.map((group) => (
          <ThemedView key={group.category} type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{group.category}</ThemedText>
            {group.skills.map((skill) => (
              <View key={skill.skillId} style={styles.skillRow}>
                <View style={styles.flex}>
                  <ThemedText type="small">{skill.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.levelLabel}>
                    {SKILL_LEVELS[skill.level]}
                  </ThemedText>
                </View>
                <LevelDots
                  level={skill.level}
                  onChange={async (level) => {
                    await setSkillLevel(db, studentId, skill.skillId, level);
                    refreshProgress();
                  }}
                />
              </View>
            ))}
          </ThemedView>
        ))}
      </ScrollView>
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
    paddingBottom: Spacing.six,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevrons: {
    fontWeight: '900',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -1,
  },
  list: {
    gap: Spacing.two,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  levelLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
