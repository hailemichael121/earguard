import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, DEFAULT_PREFS, LAYOUT } from '../constants';
import { MagicBackground } from '../components/MagicBackground';
import { AppMark, IconBadge, SectionHeader, SurfaceCard } from '../components/Ui';
import { AssetIcon } from '../components/AssetIcon';
import { WeekBarChart } from '../components/WeekBarChart';
import { EarGuardNative, soundLabelForFile } from '../native/earguard';
import { sharedStyles } from '../styles';
import { buildWeekStats, formatDuration } from '../utils/callAnalytics';
import type { AppPreferences, CallHistoryEntry } from '../types';

type Props = {
  onOpenSettings: () => void;
  onOpenCalls: () => void;
  onOpenAbout: (interval: number, sound: string) => void;
  refreshToken: number;
  setupCompleted?: boolean;
  isInCall?: boolean;
  statusMessage?: string;
  callerName?: string;
  intervalMinutes?: number;
};

export function HomeScreen({
  onOpenSettings,
  onOpenCalls,
  onOpenAbout,
  refreshToken,
  setupCompleted = false,
  isInCall = false,
  statusMessage: sessionStatus = 'Ready. Waiting for calls.',
  callerName = 'Unknown',
  intervalMinutes = DEFAULT_PREFS.interval,
}: Props) {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insights, setInsights] = useState<Awaited<ReturnType<typeof EarGuardNative.getInsights>> | null>(null);
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
  const [selectedChartDay, setSelectedChartDay] = useState<string | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;

  const weekStats = useMemo(() => buildWeekStats(callHistory), [callHistory]);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const loadPreferences = useCallback(async () => {
    try {
      const [loadedPrefs, nextInsights, nextHistory] = await Promise.all([
        EarGuardNative.getPreferences(),
        EarGuardNative.getInsights(),
        EarGuardNative.getCallHistory(50),
      ]);
      setPrefs(loadedPrefs);
      setInsights(nextInsights);
      setCallHistory(nextHistory);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(`Failed to load preferences: ${error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }
    setLoading(true);
    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ]);

      const phoneGranted =
        result[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const overlayGranted = await EarGuardNative.checkOverlayPermission();

      if (!phoneGranted || !overlayGranted) {
        setErrorMessage(
          'Required permissions are missing. Please grant phone, notification, and overlay permissions.',
        );
        const isMIUI = await EarGuardNative.isMIUI();
        if (!overlayGranted) {
          Alert.alert(
            'Permissions',
            `Please grant phone, notification, and overlay permissions.${isMIUI
              ? ' On MIUI: Settings → Apps → EarGuard → Other permissions → Display pop-up windows.'
              : ''
            }`,
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'OK' },
            ],
          );
        }
      }
    } catch (error) {
      setErrorMessage(`Permission error: ${error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkBatteryOptimization = useCallback(async () => {
    try {
      const ignoring = await EarGuardNative.isIgnoringBatteryOptimizations();
      if (!ignoring) {
        const isMIUI = await EarGuardNative.isMIUI();
        Alert.alert(
          'Enable background running',
          `Allow EarGuard to run in the background for timely reminders.${isMIUI
            ? ' On MIUI: Settings → Apps → EarGuard → Battery → No restrictions.'
            : ''
          }`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Allow', onPress: () => EarGuardNative.requestIgnoreBatteryOptimizations() },
          ],
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadPreferences();
    if (setupCompleted) {
      requestPermissions().catch(() => undefined);
      checkBatteryOptimization().catch(() => undefined);
    }
  }, [checkBatteryOptimization, loadPreferences, refreshToken, requestPermissions, setupCompleted]);

  useEffect(() => {
    if (!isInCall) {
      loadPreferences().catch(() => undefined);
    }
  }, [isInCall, loadPreferences]);

  const topLongest = useMemo(
    () => [...callHistory].sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 3),
    [callHistory],
  );

  const statusDescription = errorMessage
    ? errorMessage
    : isInCall
      ? `Protecting call with ${callerName}`
      : sessionStatus;

  const liveState = errorMessage
    ? 'Attention needed'
    : isInCall
      ? 'Monitoring active'
      : setupCompleted
        ? 'Ready to monitor'
        : 'Setup incomplete';

  if (loading) {
    return (
      <View style={[sharedStyles.screen, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <MagicBackground />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: entrance,
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.heroTop}>
            <AppMark source={require('../../assets/images/app-icon-image.png')} size={52} />
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Call guidance</Text>
              <Text style={styles.appTitle}>EarGuard</Text>
              <Text style={styles.heroMiniText}>
                {insights?.weekTotal ?? 0} calls this week · {insights?.currentStreak ?? 0} day streak
              </Text>
            </View>
            <View style={styles.heroActions}>
              <Pressable onPress={onOpenSettings} style={styles.iconButton}>
                <AssetIcon name="settings" size={18} color={COLORS.text} />
              </Pressable>
              <Pressable onPress={() => onOpenAbout(prefs.interval, prefs.sound)} style={styles.iconButton}>
                <AssetIcon name="info" size={18} color={COLORS.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusCardHead}>
              <View style={styles.statusCopy}>
                <Text style={styles.statusTitle}>{liveState}</Text>
                <Text style={styles.statusMessage}>{statusDescription}</Text>
                <Text style={styles.statusMeta}>
                  {Math.round(intervalMinutes)} min interval · {soundLabelForFile(prefs.sound)}
                </Text>
              </View>
              <IconBadge
                name={errorMessage ? 'warning' : isInCall ? 'phone' : 'shield'}
                tone={errorMessage ? 'danger' : isInCall ? 'primary' : 'success'}
                size={44}
              />
            </View>
          </View>
        </Animated.View>

        <SurfaceCard variant="bordered">
          <SectionHeader eyebrow="Overview" title="This week at a glance" />
          <View style={styles.metricsRow}>
            <MetricChip icon="chart" value={`${insights?.weekTotal ?? 0}`} label="Calls" />
            <MetricChip icon="timer" value={`${insights?.dailyPoints ?? 0}`} label="Points" />
            <MetricChip icon="spark" value={`${insights?.currentStreak ?? 0}`} label="Streak" />
          </View>
        </SurfaceCard>

        <SurfaceCard variant="bordered">
          <SectionHeader
            eyebrow="Activity"
            title="Calls per day"
            description="Tap a day to see call count and total talk time."
            action={<IconBadge name="chart" tone="muted" size={32} />}
          />
          <WeekBarChart
            data={weekStats}
            selectedKey={selectedChartDay}
            onSelectDay={setSelectedChartDay}
          />
        </SurfaceCard>

        <SurfaceCard variant="flat">
          <SectionHeader eyebrow="Longest" title="Top calls" />
          <View style={styles.listBlock}>
            {topLongest.length > 0 ? (
              topLongest.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.listRow, index === topLongest.length - 1 && styles.listRowLast]}>
                  <IconBadge name="phone" tone="primary" size={32} />
                  <View style={styles.listCopy}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.listMeta} numberOfLines={1}>
                      {formatDuration(item.durationSeconds)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyState}>No call history yet.</Text>
            )}
          </View>
          <Pressable
            onPress={onOpenCalls}
            style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
            <Text style={styles.linkText}>View full call history</Text>
            <AssetIcon name="chevronRight" size={16} color={COLORS.textSoft} />
          </Pressable>
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricChip({
  icon,
  value,
  label,
}: {
  icon: 'chart' | 'timer' | 'spark';
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metricChip}>
      <IconBadge name={icon} tone="muted" size={28} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  hero: {
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroCopy: {
    flex: 1,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: LAYOUT.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  appTitle: {
    marginTop: 2,
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroMiniText: {
    marginTop: 4,
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: LAYOUT.cardPadding,
    ...LAYOUT.shadow,
  },
  statusCardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusCopy: {
    flex: 1,
  },
  statusTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  statusMessage: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  statusMeta: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  metricValue: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 11,
    fontWeight: '600',
  },
  listBlock: {
    gap: 0,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listCopy: {
    flex: 1,
    minWidth: 0,
  },
  listTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  listMeta: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 12,
  },
  emptyState: {
    color: COLORS.textSoft,
    fontSize: 13,
    paddingVertical: 8,
  },
  linkRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkRowPressed: {
    opacity: 0.85,
  },
  linkText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
