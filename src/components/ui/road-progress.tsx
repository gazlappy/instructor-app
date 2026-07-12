import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CAR_WIDTH = 20;

/**
 * Progress drawn as a journey: a road with a dashed centre line, a car that
 * drives to `percent` of the way along, and the test flag waiting at the end.
 */
export function RoadProgress({ percent }: { percent: number }) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));
  const [roadWidth, setRoadWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(position, {
      toValue: clamped,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [clamped, position]);

  const translateX = position.interpolate({
    inputRange: [0, 100],
    outputRange: [0, Math.max(0, roadWidth - CAR_WIDTH)],
  });

  return (
    <View style={styles.row}>
      <View style={styles.roadArea} onLayout={(e) => setRoadWidth(e.nativeEvent.layout.width)}>
        <View style={[styles.road, { backgroundColor: theme.roadLine }]}>
          <View style={styles.dashRow} pointerEvents="none">
            {Array.from({ length: 16 }, (_, i) => (
              <View key={i} style={[styles.dash, { backgroundColor: theme.roadDash }]} />
            ))}
          </View>
        </View>
        <Animated.View style={[styles.car, { transform: [{ translateX }] }]} pointerEvents="none">
          <Text style={styles.carGlyph}>🚗</Text>
        </Animated.View>
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
    left: 0,
    top: 2,
    width: CAR_WIDTH,
    alignItems: 'center',
  },
  carGlyph: {
    fontSize: 17,
    transform: [{ scaleX: -1 }], // face the car towards the flag
  },
  flag: {
    fontSize: 15,
  },
});
