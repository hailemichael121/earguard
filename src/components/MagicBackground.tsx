import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {COLORS} from '../constants';
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
      <View style={styles.paperWash} />
      <Animated.View style={[sharedStyles.gradientBlobA, {opacity: pulse}]} />
      <Animated.View
        style={[
          sharedStyles.gradientBlobB,
          {
            opacity: pulse.interpolate({
              inputRange: [0.6, 1],
              outputRange: [1, 0.55],
            }),
          },
        ]}
      />
      {Array.from({length: 12}).map((_, index) => (
        <View
          key={`grain-${index}`}
          style={[styles.grainLine, getGrainStyle(index)]}
        />
      ))}
      {Array.from({length: 18}).map((_, index) => (
        <View
          key={`speck-${index}`}
          style={[styles.speck, getSpeckStyle(index)]}
        />
      ))}
      <Animated.View
        style={[
          sharedStyles.gradientBlobC,
          {
            opacity: pulse.interpolate({
              inputRange: [0.6, 1],
              outputRange: [0.3, 0.6],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  paperWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.background,
  },
  grainLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: COLORS.text,
    borderRadius: 999,
  },
  speck: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.text,
  },
});

function getGrainStyle(index: number) {
  const top = 24 + index * 42;
  const left = index % 2 === 0 ? -18 : 22;
  const width = 220 + (index % 4) * 36;
  const opacity = 0.03 + (index % 4) * 0.015;
  const rotate = index % 2 === 0 ? '-1.2deg' : '1deg';
  return {top, left, width, opacity, transform: [{rotate}]};
}

function getSpeckStyle(index: number) {
  const top = 36 + ((index * 71) % 540);
  const left = 18 + ((index * 53) % 320);
  const opacity = 0.08 + (index % 5) * 0.025;
  const rotate = `${(index % 6) - 3}deg`;
  return {top, left, opacity, transform: [{rotate}]};
}
