import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LESSON_TYPE_LABELS, type LessonListItem } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/dates';

const PX_PER_MIN = 1.1;
const LABEL_WIDTH = 52;

interface PlacedLesson {
  lesson: LessonListItem;
  col: number;
  cols: number;
}

/** Assign overlapping lessons to side-by-side columns, per overlap cluster. */
function layoutLessons(lessons: LessonListItem[]): PlacedLesson[] {
  const sorted = [...lessons].sort(
    (a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes
  );
  const placed: PlacedLesson[] = [];
  let cluster: LessonListItem[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const columnEnds: number[] = [];
    const withCols = cluster.map((lesson) => {
      let col = columnEnds.findIndex((end) => end <= lesson.startMinutes);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(0);
      }
      columnEnds[col] = lesson.startMinutes + lesson.durationMinutes;
      return { lesson, col };
    });
    for (const item of withCols) placed.push({ ...item, cols: columnEnds.length });
    cluster = [];
    clusterEnd = -1;
  };

  for (const lesson of sorted) {
    if (cluster.length && lesson.startMinutes >= clusterEnd) flush();
    cluster.push(lesson);
    clusterEnd = Math.max(clusterEnd, lesson.startMinutes + lesson.durationMinutes);
  }
  if (cluster.length) flush();
  return placed;
}

export function DayTimeline({
  lessons,
  dayStartMinutes,
  dayEndMinutes,
  slotIntervalMinutes,
  use12HourTime,
  nowMinutes,
  onPressSlot,
  onPressLesson,
}: {
  lessons: LessonListItem[];
  dayStartMinutes: number;
  dayEndMinutes: number;
  slotIntervalMinutes: number;
  use12HourTime: boolean;
  /** Minutes past midnight right now, or null when not viewing today. */
  nowMinutes: number | null;
  onPressSlot: (startMinutes: number) => void;
  onPressLesson: (lesson: LessonListItem) => void;
}) {
  const theme = useTheme();

  // Widen the grid if a lesson falls outside working hours.
  const earliest = Math.min(dayStartMinutes, ...lessons.map((l) => l.startMinutes));
  const latest = Math.max(dayEndMinutes, ...lessons.map((l) => l.startMinutes + l.durationMinutes));
  const gridStart = Math.floor(earliest / 60) * 60;
  const gridEnd = Math.ceil(latest / 60) * 60;
  const gridHeight = (gridEnd - gridStart) * PX_PER_MIN;

  const y = (minutes: number) => (minutes - gridStart) * PX_PER_MIN;

  const hours: number[] = [];
  for (let m = gridStart; m <= gridEnd; m += 60) hours.push(m);

  const slots: number[] = [];
  for (let m = gridStart; m < gridEnd; m += slotIntervalMinutes) slots.push(m);

  const placed = layoutLessons(lessons);

  return (
    <View style={[styles.grid, { height: gridHeight + Spacing.four }]}>
      {hours.map((m) => (
        <View key={m} style={[styles.hourRow, { top: y(m) }]} pointerEvents="none">
          <ThemedText type="small" themeColor="textSecondary" style={styles.hourLabel}>
            {formatMinutes(m, use12HourTime)}
          </ThemedText>
          <View style={[styles.hourLine, { backgroundColor: theme.backgroundSelected }]} />
        </View>
      ))}

      <View style={styles.lane}>
        {slots.map((m) => (
          <Pressable
            key={m}
            accessibilityLabel={`Book at ${formatMinutes(m, use12HourTime)}`}
            onPress={() => onPressSlot(m)}
            style={({ pressed }) => [
              styles.slot,
              { top: y(m), height: slotIntervalMinutes * PX_PER_MIN },
              pressed && { backgroundColor: theme.backgroundSelected, opacity: 0.6 },
            ]}
          />
        ))}

        {placed.map(({ lesson, col, cols }) => {
          const inactive = lesson.status === 'cancelled' || lesson.status === 'no_show';
          const widthPct = 100 / cols;
          return (
            <Pressable
              key={lesson.id}
              onPress={() => onPressLesson(lesson)}
              style={({ pressed }) => [
                styles.block,
                {
                  top: y(lesson.startMinutes),
                  height: Math.max(lesson.durationMinutes * PX_PER_MIN - 2, 22),
                  left: `${col * widthPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: theme.backgroundElement,
                  borderLeftColor: lesson.instructorColor,
                },
                inactive && styles.inactive,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" numberOfLines={1} style={styles.blockTitle}>
                {lesson.studentFirstName} {lesson.studentLastName}
              </ThemedText>
              {lesson.durationMinutes * PX_PER_MIN >= 48 && (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.blockMeta}>
                  {formatMinutes(lesson.startMinutes, use12HourTime)} ·{' '}
                  {LESSON_TYPE_LABELS[lesson.type]}
                </ThemedText>
              )}
            </Pressable>
          );
        })}
      </View>

      {nowMinutes !== null && nowMinutes >= gridStart && nowMinutes <= gridEnd && (
        <View style={[styles.nowLine, { top: y(nowMinutes) }]} pointerEvents="none">
          <View style={[styles.nowDot, { backgroundColor: theme.danger }]} />
          <View style={[styles.nowRule, { backgroundColor: theme.danger }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    position: 'relative',
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  hourLabel: {
    width: LABEL_WIDTH,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'right',
    transform: [{ translateY: -7 }],
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  lane: {
    position: 'absolute',
    left: LABEL_WIDTH + Spacing.two,
    right: 0,
    top: 0,
    bottom: 0,
  },
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: Spacing.one,
  },
  block: {
    position: 'absolute',
    borderRadius: Spacing.two,
    borderLeftWidth: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    overflow: 'hidden',
    elevation: 1,
  },
  blockTitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  blockMeta: {
    fontSize: 12,
    lineHeight: 15,
  },
  inactive: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
  nowLine: {
    position: 'absolute',
    left: LABEL_WIDTH,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nowRule: {
    flex: 1,
    height: 2,
  },
});
