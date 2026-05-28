import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {COLORS} from '../constants';
import {LineIcon, type LineIconName} from './LineIcon';
import {sharedStyles} from '../styles';

type Tone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';

const TONES: Record<Tone, {bg: string; fg: string; border: string}> = {
  primary: {bg: COLORS.primarySoft, fg: COLORS.primary, border: 'rgba(34,37,45,0.14)'},
  accent: {bg: COLORS.accentSoft, fg: COLORS.accent, border: 'rgba(90,94,103,0.14)'},
  success: {bg: COLORS.successSoft, fg: COLORS.success, border: 'rgba(63,74,62,0.14)'},
  warning: {bg: COLORS.warmSoft, fg: COLORS.warm, border: 'rgba(122,103,80,0.14)'},
  danger: {bg: COLORS.errorSoft, fg: COLORS.error, border: 'rgba(107,90,87,0.14)'},
  muted: {bg: COLORS.surfaceMuted, fg: COLORS.textSoft, border: COLORS.border},
};

type SurfaceCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SurfaceCard({children, style}: SurfaceCardProps) {
  return <View style={[sharedStyles.card, styles.surface, style]}>{children}</View>;
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function SectionHeader({eyebrow, title, description, action}: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

type IconBadgeProps = {
  name: LineIconName;
  tone?: Tone;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconBadge({name, tone = 'primary', size = 40, style}: IconBadgeProps) {
  const palette = TONES[tone];
  return (
    <View
      style={[
        styles.iconBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}>
      <LineIcon name={name} size={Math.round(size * 0.42)} color={palette.fg} />
    </View>
  );
}

type AppMarkProps = {
  source: ImageSourcePropType;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppMark({source, size = 68, style}: AppMarkProps) {
  return (
    <View
      style={[
        styles.appMarkShell,
        {
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
        },
        style,
      ]}>
      <View style={styles.appMarkGlow} />
      <View style={styles.appMarkStrokeA} />
      <View style={styles.appMarkStrokeB} />
      <Image source={source} style={{width: size, height: size, borderRadius: size * 0.22}} />
    </View>
  );
}

type MetricTileProps = {
  icon: LineIconName;
  label: string;
  value: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
};

export function MetricTile({icon, label, value, tone = 'primary', style}: MetricTileProps) {
  return (
    <View style={[styles.metricTile, style]}>
      <IconBadge name={icon} tone={tone} size={36} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

type ActionButtonProps = {
  title: string;
  subtitle?: string;
  icon: LineIconName;
  tone?: Tone;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ActionButton({
  title,
  subtitle,
  icon,
  tone = 'primary',
  variant = 'primary',
  onPress,
  style,
}: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.actionButton,
        isPrimary ? styles.actionPrimary : styles.actionSecondary,
        pressed && styles.actionPressed,
        style,
      ]}>
      <IconBadge name={icon} tone={tone} size={34} style={styles.actionIcon} />
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, isPrimary && styles.actionTitlePrimary]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
      </View>
      <LineIcon name="back" size={18} color={isPrimary ? COLORS.white : COLORS.textSoft} style={styles.actionChevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionDescription: {
    marginTop: 4,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  iconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  appMarkShell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,253,248,0.7)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(65,60,54,0.2)',
    shadowColor: COLORS.shadowDark,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
    transform: [{rotate: '-0.4deg'}],
  },
  appMarkGlow: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: 999,
    backgroundColor: 'rgba(34,37,45,0.05)',
  },
  appMarkStrokeA: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderRadius: 999,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: 'rgba(34,37,45,0.18)',
    transform: [{rotate: '-4deg'}],
  },
  appMarkStrokeB: {
    position: 'absolute',
    width: '88%',
    height: '88%',
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(34,37,45,0.1)',
    transform: [{rotate: '6deg'}],
  },
  metricTile: {
    flex: 1,
    minWidth: '31%',
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    padding: 14,
    shadowColor: COLORS.shadowDark,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
    transform: [{rotate: '0.12deg'}],
  },
  metricValue: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metricLabel: {
    marginTop: 4,
    color: COLORS.textSoft,
    fontSize: 12,
    lineHeight: 16,
  },
  actionButton: {
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: 'rgba(255,253,248,0.22)',
  },
  actionSecondary: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  actionPressed: {
    transform: [{scale: 0.985}],
    opacity: 0.96,
  },
  actionIcon: {
    flexShrink: 0,
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  actionTitlePrimary: {
    color: COLORS.white,
  },
  actionSubtitle: {
    marginTop: 3,
    color: COLORS.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  actionChevron: {
    transform: [{rotate: '180deg'}],
    opacity: 0.85,
  },
});
