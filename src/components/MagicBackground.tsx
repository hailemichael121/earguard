import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {sharedStyles} from '../styles';

export function MagicBackground() {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.6,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[sharedStyles.gradientBlobA, {opacity: pulse}]} />
      <Animated.View
        style={[sharedStyles.gradientBlobB, {opacity: pulse.interpolate({
          inputRange: [0.6, 1],
          outputRange: [1, 0.65],
        })}]}
      />
    </View>
  );
}
