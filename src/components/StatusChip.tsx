import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, type ViewStyle} from 'react-native';
import {COLORS} from '../constants';

export type StatusChipVariant = 'ready' | 'call' | 'warn' | 'quiet';

type Props = {
  variant: StatusChipVariant;
  active?: boolean;
  size?: number;
  style?: ViewStyle;
};

export function StatusChip({variant, active = true, size = 52, style}: Props) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (variant !== 'ready' || !active) {
      pulse.setValue(0.4);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 900, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0.35, duration: 900, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse, variant]);

  const palette = {
    ready: {ring: COLORS.success, fill: COLORS.success, bg: COLORS.surface},
    call: {ring: COLORS.primary, fill: COLORS.primary, bg: COLORS.surface},
    warn: {ring: COLORS.error, fill: COLORS.error, bg: COLORS.surface},
    quiet: {ring: COLORS.accent, fill: COLORS.accent, bg: COLORS.surface},
  }[variant];

  const dimmed = !active;

  return (
    <View
      style={[
        styles.shell,
        dimmed ? styles.shellDimmed : null,
        styles.shellDashed,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
          borderColor: palette.ring,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={variant}>
      {variant === 'ready' && (
        <>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: size - 8,
                height: size - 8,
                borderRadius: (size - 8) / 2,
                borderColor: palette.ring,
                opacity: pulse,
              },
            ]}
          />
          <View
            style={[
              styles.readyRing,
              {borderColor: palette.fill, width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21},
            ]}
          />
          <View
            style={[
              styles.readyCore,
              {backgroundColor: palette.fill, width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08},
            ]}
          />
        </>
      )}
      {variant === 'call' && (
        <View style={styles.callBars}>
          {[0.55, 0.85, 0.65].map((h, i) => (
            <View
              key={i}
              style={[
                styles.callBar,
                {
                  height: size * h * 0.42,
                  backgroundColor: palette.fill,
                },
              ]}
            />
          ))}
        </View>
      )}
      {variant === 'warn' && (
        <View style={styles.warnWrap}>
          <View style={[styles.warnTriangle, {borderBottomColor: palette.fill}]} />
          <View style={[styles.warnDot, {backgroundColor: COLORS.white}]} />
        </View>
      )}
      {variant === 'quiet' && (
        <View style={styles.quietWrap}>
          <View style={[styles.quietMoon, {backgroundColor: palette.fill}]} />
          <View style={[styles.quietCut, {backgroundColor: palette.bg}]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shellDashed: {
  },
  shellDimmed: {
    borderColor: COLORS.border,
    opacity: 0.45,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  readyRing: {
    borderWidth: 2,
    position: 'absolute',
  },
  readyCore: {
    position: 'absolute',
  },
  callBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '55%',
  },
  callBar: {
    width: 5,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  warnWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  warnDot: {
    position: 'absolute',
    top: 14,
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  quietWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietMoon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: 4,
  },
  quietCut: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    right: 10,
    top: 10,
  },
});
