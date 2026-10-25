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
import {COLORS, LAYOUT} from '../constants';
import {AssetIcon, type AssetIconName} from './AssetIcon';
import {sharedStyles} from '../styles';

type Tone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';

const TONES: Record<Tone, {bg: string; fg: string; border: string}> = {
  primary: {bg: COLORS.primarySoft, fg: COLORS.primary, border: COLORS.borderLight},
  accent: {bg: COLORS.accentSoft, fg: COLORS.accent, border: COLORS.borderLight},
  success: {bg: COLORS.successSoft, fg: COLORS.success, border: COLORS.borderLight},
  warning: {bg: COLORS.warmSoft, fg: COLORS.warm, border: COLORS.borderLight},
  danger: {bg: COLORS.errorSoft, fg: COLORS.error, border: COLORS.borderLight},
  muted: {bg: COLORS.surfaceMuted, fg: COLORS.textSoft, border: COLORS.borderLight},
};

type SurfaceCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** bordered: top sections with outline; flat: bottom sections without outer border */
  variant?: 'bordered' | 'flat';
};

export function SurfaceCard({children, style, variant = 'bordered'}: SurfaceCardProps) {
  const base = variant === 'flat' ? sharedStyles.cardFlat : sharedStyles.card;
  return <View style={[base, styles.surface, style]}>{children}</View>;
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
  name: AssetIconName;
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
          borderRadius: size / 2.8,
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}>
      <AssetIcon name={name} size={Math.round(size * 0.44)} color={palette.fg} />
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
          width: size + 16,
          height: size + 16,
          borderRadius: LAYOUT.radiusSm,
        },
        style,
      ]}>
      <Image source={source} style={{width: size, height: size, borderRadius: LAYOUT.radiusSm}} />
    </View>
  );
}

type MetricTileProps = {
  icon: AssetIconName;
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
  icon: AssetIconName;
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
        <Text style={[styles.actionTitle, isPrimary && styles.actionTitlePrimary]}>{title}</Text>
        {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
      </View>
      <AssetIcon
        name="chevronRight"
        size={16}
        color={isPrimary ? COLORS.white : COLORS.textSoft}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    padding: LAYOUT.cardPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionDescription: {
    marginTop: 4,
    color: COLORS.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  iconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  appMarkShell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...LAYOUT.shadow,
  },
  metricTile: {
    flex: 1,
    minWidth: '31%',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: LAYOUT.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 12,
  },
  metricValue: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metricLabel: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: LAYOUT.radius,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionSecondary: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  actionPressed: {
    opacity: 0.92,
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
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
});
