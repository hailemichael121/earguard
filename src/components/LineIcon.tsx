import React from 'react';
import {StyleSheet, Text, View, type StyleProp, type TextStyle} from 'react-native';
import {COLORS} from '../constants';

export type LineIconName =
  | 'back'
  | 'bell'
  | 'chart'
  | 'check'
  | 'close'
  | 'info'
  | 'moon'
  | 'phone'
  | 'play'
  | 'permissions'
  | 'settings'
  | 'shield'
  | 'spark'
  | 'sound'
  | 'timer'
  | 'warning';

type Props = {
  name: LineIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

const GLYPHS: Record<LineIconName, string> = {
  back: '‹',
  bell: '◍',
  chart: '▤',
  check: '✓',
  close: '✕',
  info: 'i',
  moon: '☾',
  phone: '☎',
  play: '▶',
  permissions: '⌁',
  settings: '⚙',
  shield: '⬡',
  spark: '✦',
  sound: '♪',
  timer: '⏱',
  warning: '⚠',
};

export function LineIcon({name, size = 18, color = COLORS.text, style}: Props) {
  if (name === 'phone') {
    return <PhoneIcon size={size} color={color} />;
  }

  return (
    <View style={[styles.iconFrame, {width: size + 4, height: size + 4}]}>
      <Text
        style={[
          styles.icon,
          styles.iconGhost,
          {
            fontSize: size,
            color,
            lineHeight: size + 1,
          },
          style,
        ]}>
        {GLYPHS[name]}
      </Text>
      <Text
        style={[
          styles.icon,
          styles.iconSketch,
          {
            fontSize: size,
            color,
            lineHeight: size + 1,
          },
          style,
        ]}>
        {GLYPHS[name]}
      </Text>
    </View>
  );
}

function PhoneIcon({size, color}: {size: number; color: string}) {
  return (
    <View style={[styles.phoneFrame, {width: size + 6, height: size + 6}]}>
      <View
        style={[
          styles.phoneStroke,
          {
            width: size * 0.58,
            height: Math.max(2, size * 0.15),
            borderRadius: size * 0.075,
            backgroundColor: color,
            top: size * 0.2,
            left: size * 0.22,
            transform: [{rotate: '-36deg'}],
          },
        ]}
      />
      <View
        style={[
          styles.phoneStroke,
          {
            width: size * 0.58,
            height: Math.max(2, size * 0.15),
            borderRadius: size * 0.075,
            backgroundColor: color,
            top: size * 0.56,
            left: size * 0.24,
            transform: [{rotate: '144deg'}],
          },
        ]}
      />
      <View
        style={[
          styles.phoneAccent,
          {
            width: size * 0.18,
            height: size * 0.18,
            borderRadius: size * 0.09,
            borderColor: color,
            top: size * 0.38,
            left: size * 0.39,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconFrame: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    includeFontPadding: false,
    textAlign: 'center',
    fontWeight: '700',
  },
  iconGhost: {
    position: 'absolute',
    transform: [{translateX: 0.7}, {translateY: 0.9}, {rotate: '-1deg'}],
    opacity: 0.18,
  },
  iconSketch: {
    transform: [{translateX: -0.3}, {translateY: -0.2}, {rotate: '0.6deg'}],
  },
  phoneFrame: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneStroke: {
    position: 'absolute',
  },
  phoneAccent: {
    position: 'absolute',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
});
