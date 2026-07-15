import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LESSON_TYPE_LABELS, LESSON_STATUS_LABELS, type LessonListItem } from '@/db/types';
import { useAppSettings } from '@/hooks/app-settings';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes, formatTimeRange } from '@/lib/dates';

export function LessonCard({
  lesson,
  onPress,
  showDate,
}: {
  lesson: LessonListItem;
  onPress?: () => void;
  showDate?: string;
}) {
  const theme = useTheme();
  const { settings } = useAppSettings();
  const inactive = lesson.status === 'cancelled' || lesson.status === 'no_show';
  const isTest = lesson.type === 'driving_test';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={[styles.plate, inactive && styles.inactive]}>
        <View
          style={[
            styles.badge,
            { backgroundColor: isTest ? theme.success : theme.tint, borderColor: theme.tintBorder },
          ]}>
          <ThemedText style={[styles.badgeText, { color: theme.onTint }]}>
            {formatMinutes(lesson.startMinutes, settings.use12HourTime)}
          </ThemedText>
        </View>
        <View style={styles.body}>
          <View style={styles.topRow}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
              {lesson.studentFirstName} {lesson.studentLastName}
            </ThemedText>
            {lesson.status !== 'scheduled' && (
              <ThemedText type="small" themeColor={inactive ? 'danger' : 'textSecondary'}>
                {LESSON_STATUS_LABELS[lesson.status]}
              </ThemedText>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.instructorDot, { backgroundColor: lesson.instructorColor }]} />
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.meta}>
              {showDate ? `${showDate} · ` : ''}
              {formatTimeRange(lesson.startMinutes, lesson.durationMinutes, settings.use12HourTime)} ·{' '}
              {LESSON_TYPE_LABELS[lesson.type]}
              {inactive && lesson.cancellationReason
                ? ` · ${lesson.cancellationReason}`
                : lesson.pickupLocation
                  ? ` · ${lesson.pickupLocation}`
                  : ''}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 12,
    padding: Spacing.three,
    elevation: 2,
    shadowColor: '#16181d',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  badge: {
    borderRadius: 8,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  body: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  instructorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  meta: {
    flexShrink: 1,
    fontSize: 12,
  },
  inactive: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
