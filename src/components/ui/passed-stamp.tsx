import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * A rotated "PASSED" stamp that thumps into place — shown on pupils
 * who have passed their driving test.
 */
export function PassedStamp() {
  const theme = useTheme();
  const [scale] = useState(() => new Animated.Value(2));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.stamp,
        { borderColor: theme.success, opacity, transform: [{ rotate: '-8deg' }, { scale }] },
      ]}>
      <Text style={[styles.text, { color: theme.success }]}>PASSED</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
});
