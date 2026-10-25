/**
 * FloatingCallerIdCard
 * 
 * Displays a clean, minimalistic overlay card when an incoming call is detected.
 * Shows caller metadata and the current reminder interval.
 */

import React, {useEffect, useRef} from 'react';
import {Animated, Dimensions, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../constants';
import {LineIcon} from './LineIcon';

type Props = {
  callerName: string;
  callerNumber: string;
  intervalMinutes: number;
  visible: boolean;
};

export function FloatingCallerIdCard({callerName, callerNumber, intervalMinutes, visible}: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    } else {
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
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  if (!visible && opacityAnim.__getValue?.() === 0) {
    return null;
  }

  const windowHeight = Dimensions.get('window').height;

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
                outputRange: [-100, 0],
              }),
            },
          ],
          top: Math.max(16, windowHeight * 0.1),
        },
      ]}>
      <View style={styles.card}>
        {/* Header with icon and status */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              <LineIcon name="shield" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.headerText}>EarGuard is taking care of your call.</Text>
          </View>
        </View>

        {/* Caller info */}
        <View style={styles.callerInfo}>
          <View style={styles.callerDetails}>
            <Text style={styles.callerName} numberOfLines={1}>
              {callerName || 'Unknown Caller'}
            </Text>
            <Text style={styles.callerNumber} numberOfLines={1}>
              {callerNumber || '(No number available)'}
            </Text>
          </View>

          {/* Interval indicator */}
          <View style={styles.intervalBadge}>
            <LineIcon name="timer" size={14} color={COLORS.primary} />
            <Text style={styles.intervalText}>{intervalMinutes} min</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: COLORS.shadowDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  callerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callerDetails: {
    flex: 1,
  },
  callerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  callerNumber: {
    fontSize: 12,
    color: COLORS.textSoft,
  },
  intervalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  intervalText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
});
