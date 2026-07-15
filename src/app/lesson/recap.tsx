import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlobalNavBar } from '@/components/nav-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { FormInput } from '@/components/ui/form';
import { LevelDots } from '@/components/ui/level-dots';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  getLesson,
  getLessonRecap,
  getProgressForStudent,
  getStudent,
  setLessonStatus,
  setSkillLevel,
  upsertLessonRecap,
} from '@/db/queries';
import { SKILL_LEVELS, type Lesson, type LessonRecap, type SkillProgressRow } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { formatDateUK } from '@/lib/dates';

/**
 * The 30-second post-lesson flow: tick off the skills covered, bump their
 * levels, jot a note. Saving marks the lesson completed and updates the
 * student's syllabus progress in one go.
 */
export default function LessonRecapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = Number(id);

  const { data } = useQuery(async (db) => {
    const lesson = await getLesson(db, lessonId);
    if (!lesson) return null;
    const [student, progress, recap] = await Promise.all([
      getStudent(db, lesson.studentId),
      getProgressForStudent(db, lesson.studentId),
      getLessonRecap(db, lessonId),
    ]);
    return { lesson, student, progress, recap };
  }, [lessonId]);

  if (!data?.student) return <ThemedView style={styles.container} />;
  return (
    <RecapForm
      lesson={data.lesson}
      studentName={`${data.student.firstName} ${data.student.lastName}`}
      progress={data.progress}
      recap={data.recap}
    />
  );
}

function RecapForm({
  lesson,
  studentName,
  progress,
  recap,
}: {
  lesson: Lesson;
  studentName: string;
  progress: SkillProgressRow[];
  recap: LessonRecap | null;
}) {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();

  const [covered, setCovered] = useState<Set<number>>(() => new Set(recap?.skillIds ?? []));
  const [levels, setLevels] = useState<Map<number, number>>(() => new Map());
  const [note, setNote] = useState(recap?.note ?? '');

  const grouped = useMemo(() => {
    const groups: { category: string; skills: SkillProgressRow[] }[] = [];
    for (const row of progress) {
      const last = groups[groups.length - 1];
      if (last && last.category === row.category) last.skills.push(row);
      else groups.push({ category: row.category, skills: [row] });
    }
    return groups;
  }, [progress]);

  const toggleCovered = (skillId: number) => {
    setCovered((current) => {
      const next = new Set(current);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  const setLevel = (skillId: number, level: number) => {
    setLevels((current) => new Map(current).set(skillId, level));
    // Adjusting a level counts the skill as covered this lesson.
    setCovered((current) => (current.has(skillId) ? current : new Set(current).add(skillId)));
  };

  const save = async () => {
    await upsertLessonRecap(db, {
      lessonId: lesson.id,
      note: note.trim() || null,
      skillIds: [...covered],
    });
    if (lesson.status !== 'completed') await setLessonStatus(db, lesson.id, 'completed');
    for (const [skillId, level] of levels) {
      const original = progress.find((row) => row.skillId === skillId);
      if (original && original.level !== level) await setSkillLevel(db, lesson.studentId, skillId, level);
    }
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Lesson recap' }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View>
            <ThemedText type="subtitle">{studentName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDateUK(lesson.date)}
              {lesson.status !== 'completed' ? ' · saving marks this lesson completed' : ''}
            </ThemedText>
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            Tap a skill to mark it covered this lesson; use the dots to record a new level (
            {SKILL_LEVELS.slice(1).join(' → ')}).
          </ThemedText>

          {grouped.map((group) => (
            <ThemedView key={group.category} type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{group.category}</ThemedText>
              {group.skills.map((skill) => {
                const isCovered = covered.has(skill.skillId);
                const level = levels.get(skill.skillId) ?? skill.level;
                return (
                  <View key={skill.skillId} style={styles.skillRow}>
                    <Pressable
                      onPress={() => toggleCovered(skill.skillId)}
                      style={({ pressed }) => [styles.skillToggle, pressed && styles.pressed]}>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isCovered ? theme.tint : theme.backgroundSelected,
                            backgroundColor: isCovered ? theme.tint : 'transparent',
                          },
                        ]}>
                        {isCovered && (
                          <ThemedText style={[styles.checkmark, { color: theme.onTint }]}>✓</ThemedText>
                        )}
                      </View>
                      <ThemedText
                        type="small"
                        themeColor={isCovered ? 'text' : 'textSecondary'}
                        style={styles.skillName}>
                        {skill.name}
                      </ThemedText>
                    </Pressable>
                    <LevelDots level={level} onChange={(next) => setLevel(skill.skillId, next)} />
                  </View>
                );
              })}
            </ThemedView>
          ))}

          <ThemedText type="smallBold" themeColor="textSecondary">
            NOTE FOR NEXT TIME
          </ThemedText>
          <FormInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="What went well, what to pick up next lesson…"
          />

          <View style={styles.buttons}>
            <View style={styles.spacer} />
            <Chip label="Cancel" onPress={() => router.back()} />
            <Chip label="Save recap" selected onPress={save} />
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
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  skillToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
  skillName: {
    flexShrink: 1,
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
