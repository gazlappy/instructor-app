import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LESSON_TYPE_LABELS, LESSON_STATUS_LABELS, type LessonListItem } from '@/db/types';
import { formatTimeRange } from '@/lib/dates';

export function LessonCard({
  lesson,
  onPress,
  showDate,
}: {
  lesson: LessonListItem;
  onPress?: () => void;
  showDate?: string;
}) {
  const inactive = lesson.status === 'cancelled' || lesson.status === 'no_show';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={[styles.card, inactive && styles.inactive]}>
        <View style={[styles.colorBar, { backgroundColor: lesson.instructorColor }]} />
        <View style={styles.body}>
          <View style={styles.topRow}>
            <ThemedText type="smallBold">
              {showDate ? `${showDate} · ` : ''}
              {formatTimeRange(lesson.startMinutes, lesson.durationMinutes)}
            </ThemedText>
            {lesson.status !== 'scheduled' && (
              <ThemedText type="small" themeColor={inactive ? 'danger' : 'textSecondary'}>
                {LESSON_STATUS_LABELS[lesson.status]}
              </ThemedText>
            )}
          </View>
          <ThemedText>
            {lesson.studentFirstName} {lesson.studentLastName}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {LESSON_TYPE_LABELS[lesson.type]} · {lesson.instructorName}
            {lesson.pickupLocation ? ` · ${lesson.pickupLocation}` : ''}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  colorBar: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inactive: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.7,
  },
});
