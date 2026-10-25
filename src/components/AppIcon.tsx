import React from 'react';
import {StyleSheet, View} from 'react-native';
import {COLORS} from '../constants';

export type AppIconName =
  | 'back'
  | 'bell'
  | 'chart'
  | 'barChart'
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
  | 'warning'
  | 'chevronRight'
  | 'vibrate';

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
};

const STROKE = 1.75;

export function AppIcon({name, size = 20, color = COLORS.text}: Props) {
  const s = size;
  const c = color;

  switch (name) {
    case 'chart':
    case 'barChart':
      return <BarChartIcon size={s} color={c} />;
    case 'timer':
      return <ClockIcon size={s} color={c} />;
    case 'spark':
      return <StreakIcon size={s} color={c} />;
    case 'phone':
      return <PhoneIcon size={s} color={c} />;
    case 'settings':
      return <GearIcon size={s} color={c} />;
    case 'back':
      return <ChevronIcon size={s} color={c} direction="left" />;
    case 'chevronRight':
      return <ChevronIcon size={s} color={c} direction="right" />;
    case 'shield':
      return <ShieldIcon size={s} color={c} />;
    case 'check':
      return <CheckIcon size={s} color={c} />;
    case 'close':
      return <CloseIcon size={s} color={c} />;
    case 'info':
      return <InfoIcon size={s} color={c} />;
    case 'warning':
      return <WarningIcon size={s} color={c} />;
    case 'bell':
      return <BellIcon size={s} color={c} />;
    case 'moon':
      return <MoonIcon size={s} color={c} />;
    case 'sound':
      return <SoundIcon size={s} color={c} />;
    case 'play':
      return <PlayIcon size={s} color={c} />;
    case 'vibrate':
      return <VibrateIcon size={s} color={c} />;
    case 'permissions':
      return <ShieldIcon size={s} color={c} />;
    default:
      return <View style={{width: s, height: s}} />;
  }
}

function BarChartIcon({size, color}: {size: number; color: string}) {
  const barWidth = Math.max(2, size * 0.16);
  const gap = Math.max(2, size * 0.12);
  const heights = [0.45, 0.72, 0.55, 0.9, 0.62];
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View style={[styles.rowEnd, {height: size * 0.78, gap}]}>
        {heights.map((ratio, index) => (
          <View
            key={index}
            style={{
              width: barWidth,
              height: Math.max(barWidth * 2, size * 0.78 * ratio),
              borderRadius: barWidth / 2,
              backgroundColor: color,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function ClockIcon({size, color}: {size: number; color: string}) {
  const r = size * 0.42;
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View
        style={{
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          borderWidth: STROKE,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: STROKE,
          height: r * 0.55,
          backgroundColor: color,
          top: size * 0.28,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: r * 0.45,
          height: STROKE,
          backgroundColor: color,
          top: size * 0.48,
          left: size * 0.5,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function StreakIcon({size, color}: {size: number; color: string}) {
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View
        style={{
          width: size * 0.34,
          height: size * 0.55,
          borderTopLeftRadius: size * 0.2,
          borderTopRightRadius: size * 0.2,
          borderBottomLeftRadius: size * 0.06,
          borderBottomRightRadius: size * 0.2,
          backgroundColor: color,
          transform: [{rotate: '-18deg'}, {translateX: -size * 0.08}],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.22,
          height: size * 0.38,
          borderRadius: size * 0.08,
          backgroundColor: color,
          opacity: 0.45,
          transform: [{rotate: '12deg'}, {translateX: size * 0.14}, {translateY: size * 0.08}],
        }}
      />
    </View>
  );
}

function PhoneIcon({size, color}: {size: number; color: string}) {
  const w = size * 0.52;
  const h = size * 0.78;
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View
        style={{
          width: w,
          height: h,
          borderRadius: size * 0.12,
          borderWidth: STROKE,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.2,
          width: size * 0.16,
          height: STROKE,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function GearIcon({size, color}: {size: number; color: string}) {
  const r = size * 0.22;
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View
        style={{
          width: r * 2.2,
          height: r * 2.2,
          borderRadius: r,
          borderWidth: STROKE,
          borderColor: color,
        }}
      />
      {[0, 45, 90, 135].map(deg => (
        <View
          key={deg}
          style={{
            position: 'absolute',
            width: STROKE,
            height: size * 0.22,
            backgroundColor: color,
            borderRadius: 1,
            transform: [{rotate: `${deg}deg`}],
          }}
        />
      ))}
    </View>
  );
}

function ChevronIcon({
  size,
  color,
  direction,
}: {
  size: number;
  color: string;
  direction: 'left' | 'right';
}) {
  const arm = size * 0.22;
  return (
    <View
      style={[
        styles.centered,
        {
          width: size,
          height: size,
          transform: [{rotate: direction === 'left' ? '-45deg' : '135deg'}],
        },
      ]}>
      <View style={{width: arm, height: arm, borderTopWidth: STROKE, borderLeftWidth: STROKE, borderColor: color}} />
    </View>
  );
}

function ShieldIcon({size, color}: {size: number; color: string}) {
  const w = size * 0.62;
  const h = size * 0.72;
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View
        style={{
          width: w,
          height: h,
          borderTopLeftRadius: w * 0.35,
          borderTopRightRadius: w * 0.35,
          borderBottomLeftRadius: w * 0.5,
          borderBottomRightRadius: w * 0.5,
          borderWidth: STROKE,
          borderColor: color,
          backgroundColor: 'transparent',
        }}
      />
    </View>
  );
}

function CheckIcon({size, color}: {size: number; color: string}) {
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View
        style={{
          width: size * 0.22,
          height: size * 0.45,
          borderBottomWidth: STROKE,
          borderLeftWidth: STROKE,
          borderColor: color,
          transform: [{rotate: '-45deg'}, {translateX: -size * 0.04}, {translateY: -size * 0.02}],
        }}
      />
    </View>
  );
}

function CloseIcon({size, color}: {size: number; color: string}) {
  const len = size * 0.5;
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View style={{width: len, height: STROKE, backgroundColor: color, transform: [{rotate: '45deg'}]}} />
      <View
        style={{
          position: 'absolute',
          width: len,
          height: STROKE,
          backgroundColor: color,
          transform: [{rotate: '-45deg'}],
        }}
      />
    </View>
  );
}

function InfoIcon({size, color}: {size: number; color: string}) {
  const r = size * 0.4;
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View style={{width: r * 2, height: r * 2, borderRadius: r, borderWidth: STROKE, borderColor: color}} />
      <View style={{position: 'absolute', top: size * 0.3, width: STROKE, height: size * 0.16, backgroundColor: color}} />
      <View style={{position: 'absolute', bottom: size * 0.26, width: STROKE * 1.2, height: STROKE * 1.2, borderRadius: 1, backgroundColor: color}} />
    </View>
  );
}

function WarningIcon({size, color}: {size: number; color: string}) {
  const w = size * 0.72;
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: w / 2,
          borderRightWidth: w / 2,
          borderBottomWidth: size * 0.68,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View style={{position: 'absolute', top: size * 0.34, width: STROKE, height: size * 0.18, backgroundColor: COLORS.surface}} />
      <View style={{position: 'absolute', bottom: size * 0.22, width: STROKE * 1.4, height: STROKE * 1.4, borderRadius: 1, backgroundColor: COLORS.surface}} />
    </View>
  );
}

function BellIcon({size, color}: {size: number; color: string}) {
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View
        style={{
          width: size * 0.55,
          height: size * 0.5,
          borderTopLeftRadius: size * 0.2,
          borderTopRightRadius: size * 0.2,
          borderWidth: STROKE,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
      <View style={{width: size * 0.18, height: STROKE * 1.2, backgroundColor: color, marginTop: -STROKE}} />
    </View>
  );
}

function MoonIcon({size, color}: {size: number; color: string}) {
  const r = size * 0.38;
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View style={{width: r * 2, height: r * 2, borderRadius: r, backgroundColor: color, opacity: 0.2}} />
      <View
        style={{
          position: 'absolute',
          width: r * 1.7,
          height: r * 1.7,
          borderRadius: r,
          backgroundColor: COLORS.surface,
          left: size * 0.22,
        }}
      />
    </View>
  );
}

function SoundIcon({size, color}: {size: number; color: string}) {
  return (
    <View style={[styles.rowCenter, {width: size, height: size, gap: size * 0.06}]}>
      <View style={{width: STROKE * 1.2, height: size * 0.28, backgroundColor: color, borderRadius: 1}} />
      <View style={{width: STROKE * 1.2, height: size * 0.48, backgroundColor: color, borderRadius: 1}} />
      <View style={{width: STROKE * 1.2, height: size * 0.36, backgroundColor: color, borderRadius: 1}} />
    </View>
  );
}

function PlayIcon({size, color}: {size: number; color: string}) {
  return (
    <View style={[styles.centered, {width: size, height: size}]}>
      <View
        style={{
          width: 0,
          height: 0,
          marginLeft: size * 0.08,
          borderTopWidth: size * 0.22,
          borderBottomWidth: size * 0.22,
          borderLeftWidth: size * 0.34,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
        }}
      />
    </View>
  );
}

function VibrateIcon({size, color}: {size: number; color: string}) {
  return (
    <View style={[styles.rowCenter, {width: size, height: size, gap: size * 0.05}]}>
      <View style={{width: size * 0.14, height: size * 0.5, borderRadius: 2, borderWidth: STROKE, borderColor: color}} />
      {[0.35, 0.55, 0.35].map((h, i) => (
        <View key={i} style={{width: STROKE, height: size * h, backgroundColor: color, borderRadius: 1}} />
      ))}
      <View style={{width: size * 0.14, height: size * 0.5, borderRadius: 2, borderWidth: STROKE, borderColor: color}} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
