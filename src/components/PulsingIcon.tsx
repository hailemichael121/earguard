import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {IconBadge} from './Ui';
import type {LineIconName} from './LineIcon';

type Props = {
  icon: LineIconName;
  size?: number;
};

export function PulsingIcon({icon, size = 48}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.container, {transform: [{scale: scaleAnim}]}]}>
      <View>
        <IconBadge name={icon} size={size} tone="primary" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
