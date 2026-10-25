/**
 * PostCallSummaryCard
 *
 * Displays a brief summary after a call session ends:
 * - Total call duration
 * - Number of ear switch reminders
 * - Auto-dismisses after 5 seconds or on tap
 */

import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../constants';
import {LineIcon} from './LineIcon';

type Props = {
  callerName: string;
  durationSeconds: number;
  earSwitchCount: number;
  visible: boolean;
  onDismiss: () => void;
};

export function PostCallSummaryCard({
  callerName,
  durationSeconds,
  earSwitchCount,
  visible,
  onDismiss,
}: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 5 seconds
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 5000);
    } else {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [visible, slideAnim, opacityAnim]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) {
    return null;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const durationText = `${minutes}m ${seconds}s`;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}>
      <Pressable onPress={handleDismiss} style={styles.card}>
        {/* Icon and title */}
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <LineIcon name="check" size={20} color={COLORS.success} />
          </View>
          <Text style={styles.title}>Call Summary</Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <MetricRow
            icon="timer"
            label="Duration"
            value={durationText}
            tone="primary"
          />
          <View style={styles.divider} />
          <MetricRow
            icon="vibrate"
            label="Ear Switches Prompted"
            value={`${earSwitchCount}x`}
            tone="accent"
          />
        </View>

        {/* Caller name */}
        <Text style={styles.callerText}>with {callerName}</Text>

        {/* Dismiss hint */}
        <Text style={styles.dismissHint}>Tap to dismiss</Text>
      </Pressable>
    </Animated.View>
  );
}

function MetricRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: 'primary' | 'accent';
}) {
  const bgColor = tone === 'primary' ? COLORS.primarySoft : COLORS.accentSoft;
  const iconColor = tone === 'primary' ? COLORS.primary : COLORS.accent;

  return (
    <View style={styles.metricRow}>
      <View style={[styles.metricIcon, {backgroundColor: bgColor}]}>
        <LineIcon name={icon as any} size={14} color={iconColor} />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    shadowColor: COLORS.shadowDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.successSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  metricsContainer: {
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metricIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSoft,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 6,
  },
  callerText: {
    fontSize: 12,
    color: COLORS.textSoft,
    marginBottom: 8,
  },
  dismissHint: {
    fontSize: 11,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
});
