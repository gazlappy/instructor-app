import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LESSON_TYPE_LABELS, type LessonListItem } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/dates';

const PX_PER_MIN = 1.1;
const LABEL_WIDTH = 44;
const ROAD_WIDTH = 8;
const DASH_HEIGHT = 12;
const DASH_GAP = 12;
const LANE_LEFT = LABEL_WIDTH + Spacing.two + ROAD_WIDTH + Spacing.three;

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

  for (const lesson of lessons.length ? sorted : []) {
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

  const dashes = Math.ceil(gridHeight / (DASH_HEIGHT + DASH_GAP));
  const placed = layoutLessons(lessons);

  return (
    <View style={[styles.grid, { height: gridHeight + Spacing.four }]}>
      {/* the road: a grey lane with a dashed centre line */}
      <View
        style={[styles.road, { backgroundColor: theme.roadLine, height: gridHeight }]}
        pointerEvents="none">
        {Array.from({ length: dashes }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dash,
              { backgroundColor: theme.roadDash, top: i * (DASH_HEIGHT + DASH_GAP) + 4 },
            ]}
          />
        ))}
      </View>

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
          const isTest = lesson.type === 'driving_test';
          const widthPct = 100 / cols;
          const blockHeight = Math.max(lesson.durationMinutes * PX_PER_MIN - 3, 26);
          const compact = blockHeight < 52;
          return (
            <Pressable
              key={lesson.id}
              onPress={() => onPressLesson(lesson)}
              style={({ pressed }) => [
                styles.plate,
                {
                  top: y(lesson.startMinutes),
                  height: blockHeight,
                  left: `${col * widthPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: theme.backgroundElement,
                },
                inactive && styles.inactive,
                pressed && styles.pressed,
              ]}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isTest ? theme.success : theme.tint,
                    borderColor: theme.tintBorder,
                  },
                ]}>
                <ThemedText style={[styles.badgeText, { color: theme.onTint }]}>
                  {formatMinutes(lesson.startMinutes, use12HourTime)}
                </ThemedText>
              </View>
              <View style={styles.plateBody}>
                <ThemedText type="smallBold" numberOfLines={1} style={styles.plateTitle}>
                  {lesson.studentFirstName} {lesson.studentLastName}
                </ThemedText>
                {!compact && (
                  <View style={styles.metaRow}>
                    <View style={[styles.instructorDot, { backgroundColor: lesson.instructorColor }]} />
                    <ThemedText
                      type="small"
                      themeColor={isTest ? 'success' : 'textSecondary'}
                      numberOfLines={1}
                      style={styles.plateMeta}>
                      {LESSON_TYPE_LABELS[lesson.type]} · {lesson.durationMinutes} min
                    </ThemedText>
                  </View>
                )}
              </View>
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
  road: {
    position: 'absolute',
    left: LABEL_WIDTH + Spacing.two,
    top: 0,
    width: ROAD_WIDTH,
    borderRadius: ROAD_WIDTH / 2,
    overflow: 'hidden',
  },
  dash: {
    position: 'absolute',
    left: ROAD_WIDTH / 2 - 1,
    width: 2,
    height: DASH_HEIGHT,
    borderRadius: 1,
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + ROAD_WIDTH + Spacing.three,
  },
  hourLabel: {
    width: LABEL_WIDTH,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'right',
    transform: [{ translateY: -7 }],
    fontVariant: ['tabular-nums'],
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  lane: {
    position: 'absolute',
    left: LANE_LEFT,
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
  plate: {
    position: 'absolute',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#16181d',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  badge: {
    borderRadius: 7,
    borderWidth: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  plateBody: {
    flex: 1,
    justifyContent: 'center',
  },
  plateTitle: {
    fontSize: 13,
    lineHeight: 17,
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
  plateMeta: {
    fontSize: 11.5,
    lineHeight: 15,
    flexShrink: 1,
  },
  inactive: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
  nowLine: {
    position: 'absolute',
    left: LABEL_WIDTH + Spacing.two,
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
