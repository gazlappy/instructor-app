import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Progress drawn as a journey: a road with a dashed centre line, a car at
 * `percent` of the way along, and the test flag waiting at the end.
 */
export function RoadProgress({ percent }: { percent: number }) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View style={styles.row}>
      <View style={styles.roadArea}>
        <View style={[styles.road, { backgroundColor: theme.roadLine }]}>
          <View style={styles.dashRow} pointerEvents="none">
            {Array.from({ length: 16 }, (_, i) => (
              <View key={i} style={[styles.dash, { backgroundColor: theme.roadDash }]} />
            ))}
          </View>
        </View>
        <View style={[styles.car, { left: `${Math.min(clamped, 94)}%` }]} pointerEvents="none">
          <Text style={styles.carGlyph}>🚗</Text>
        </View>
      </View>
      <Text style={styles.flag}>🏁</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  roadArea: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
  },
  road: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  dashRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  dash: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  car: {
    position: 'absolute',
    top: -1,
    marginLeft: -6,
  },
  carGlyph: {
    fontSize: 17,
    transform: [{ scaleX: -1 }], // face the car towards the flag
  },
  flag: {
    fontSize: 15,
  },
});
