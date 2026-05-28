import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { COLORS, DEFAULT_PREFS } from '../constants';
import { MagicBackground } from '../components/MagicBackground';
import { AppMark, ActionButton, IconBadge, SectionHeader, SurfaceCard } from '../components/Ui';
import { LineIcon } from '../components/LineIcon';
import { EarGuardNative, soundLabelForFile } from '../native/earguard';
import { sharedStyles } from '../styles';
import type { AppPreferences, DebugLog } from '../types';

type Props = {
  onOpenSettings: () => void;
  onOpenCalls: () => void;
  onOpenAbout: (interval: number, sound: string) => void;
  refreshToken: number;
  setupCompleted?: boolean;
};

export function HomeScreen({
  onOpenSettings,
  onOpenCalls,
  onOpenAbout,
  refreshToken,
  setupCompleted = false,
}: Props) {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Ready. Waiting for calls.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [callerInfo, setCallerInfo] = useState('Unknown');
  const [insights, setInsights] = useState<Awaited<ReturnType<typeof EarGuardNative.getInsights>> | null>(null);
  const [callHistory, setCallHistory] = useState<
    Array<{id: string; name: string; number: string; durationSeconds: number; date: string; type: string}>
  >([]);
  const isUpdating = useRef(false);
  const isInCallRef = useRef(false);
  const isSimulatingRef = useRef(false);
  const prefsRef = useRef(prefs);
  const vibrationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    prefsRef.current = prefs;
    isInCallRef.current = isInCall;
    isSimulatingRef.current = isSimulating;
  }, [prefs, isInCall, isSimulating]);

  const log = useCallback((message: string, category: DebugLog['category']) => {
    console.log(`[sharuk] ${category} - ${message}`);
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const [loadedPrefs, nextInsights, nextHistory] = await Promise.all([
        EarGuardNative.getPreferences(),
        EarGuardNative.getInsights(),
        EarGuardNative.getCallHistory(12),
      ]);
      setPrefs(loadedPrefs);
      setInsights(nextInsights);
      setCallHistory(nextHistory);
      log('Preferences loaded successfully', 'Info');
    } catch (error) {
      setErrorMessage(`Failed to load preferences: ${error}`);
      log(`Failed to load preferences: ${error}`, 'Error');
    } finally {
      setLoading(false);
    }
  }, [log]);

  const refreshInsights = useCallback(async () => {
    try {
      const [nextInsights, nextHistory] = await Promise.all([
        EarGuardNative.getInsights(),
        EarGuardNative.getCallHistory(12),
      ]);
      setInsights(nextInsights);
      setCallHistory(nextHistory);
    } catch (error) {
      log(`Insights error: ${error}`, 'Error');
    }
  }, [log]);

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

      if (phoneGranted && overlayGranted) {
        setStatusMessage('App is active and monitoring calls.');
        setErrorMessage(null);
        log('All permissions granted', 'Info');
      } else {
        setStatusMessage('Permissions need attention.');
        setErrorMessage(
          'Required permissions are missing. Please grant phone, notification, and overlay permissions.',
        );
        log('Some permissions denied', 'Warning');

        const isMIUI = await EarGuardNative.isMIUI();
        if (!overlayGranted) {
          Alert.alert(
            'Permissions',
            `Please grant phone, notification, and overlay permissions in settings.${isMIUI
              ? ' On MIUI, go to Settings > Apps > EarGuard > Other Permissions and enable "Display pop-up windows while running in the background".'
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
      log(`Permission error: ${error}`, 'Error');
    } finally {
      setLoading(false);
    }
  }, [log]);

  const checkBatteryOptimization = useCallback(async () => {
    try {
      const ignoring = await EarGuardNative.isIgnoringBatteryOptimizations();
      if (!ignoring) {
        const isMIUI = await EarGuardNative.isMIUI();
        Alert.alert(
          'Enable background running',
          `Allow EarGuard to run in the background for timely reminders.${isMIUI
            ? ' On MIUI, go to Settings > Apps > EarGuard > Battery > No restrictions and enable "Display pop-up windows while running in the background".'
            : ''
          }`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Allow',
              onPress: () => EarGuardNative.requestIgnoreBatteryOptimizations(),
            },
          ],
        );
      }
    } catch (error) {
      log(`Battery optimization error: ${error}`, 'Error');
    }
  }, [log]);

  const showCallTrackingToast = useCallback(
    async (currentCaller: string) => {
      try {
        let hasPermission = await EarGuardNative.checkOverlayPermission();
        if (!hasPermission) {
          await EarGuardNative.requestOverlayPermission();
          hasPermission = await EarGuardNative.checkOverlayPermission();
        }
        if (!hasPermission) {
          Alert.alert(
            'Overlay permission required',
            'Enable it in settings (Settings > Apps > EarGuard > Other Permissions on MIUI).',
          );
          log('Overlay permission denied, using fallback', 'Warning');
          return;
        }
        await EarGuardNative.showOverlay(currentCaller);
        log(`Call tracking toast shown for ${currentCaller}`, 'Info');
        setTimeout(() => {
          EarGuardNative.hideOverlay().catch(() => undefined);
        }, 5000);
      } catch (error) {
        log(`Failed to show call tracking toast: ${error}`, 'Error');
      }
    },
    [log],
  );

  const stopVibration = useCallback(() => {
    if (vibrationTimer.current) {
      clearInterval(vibrationTimer.current);
      vibrationTimer.current = null;
    }
  }, []);

  const startVibration = useCallback(() => {
    if (vibrationTimer.current) {
      return;
    }
    const vibrationMs = prefs.smartIntensity
      ? prefs.interval <= 10
        ? 700
        : prefs.interval <= 20
          ? 450
          : 260
      : 500;
    vibrationTimer.current = setInterval(() => {
      EarGuardNative.vibrate(vibrationMs).catch(() => undefined);
    }, 1000);
  }, [prefs.interval, prefs.smartIntensity]);

  const isWithinQuietHours = useCallback(() => {
    if (!prefs.quietHoursEnabled) {
      return false;
    }
    const now = new Date();
    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const start = toMinutes(prefs.quietStart);
    const end = toMinutes(prefs.quietEnd);
    return start <= end
      ? nowMinutes >= start && nowMinutes < end
      : nowMinutes >= start || nowMinutes < end;
  }, [prefs.quietEnd, prefs.quietHoursEnabled, prefs.quietStart]);

  const displayReminderOverlay = useCallback(async () => {
    let hasPermission = await EarGuardNative.checkOverlayPermission();
    if (!hasPermission) {
      await EarGuardNative.requestOverlayPermission();
      hasPermission = await EarGuardNative.checkOverlayPermission();
    }
    if (!hasPermission) {
      Alert.alert(
        'Overlay permission',
        'Overlay permission is required to show reminders. On MIUI, go to Settings > Apps > EarGuard > Other Permissions.',
      );
      return;
    }
    setTimeout(() => stopVibration(), 10000);
  }, [stopVibration]);

  const handleCallState = useCallback(
    async (state: string) => {
      if (isUpdating.current || isSimulatingRef.current) {
        return;
      }
      isUpdating.current = true;
      try {
        log(`Call state: ${state}`, 'Info');
        if (state === 'RINGING' || state === 'OFFHOOK') {
          if (!isInCallRef.current) {
            isInCallRef.current = true;
            setIsInCall(true);
            setStatusMessage('Call started. Timing reminders now.');
            setErrorMessage(null);

            const info = await EarGuardNative.getCallerInfo();
            setCallerInfo(info);
            showCallTrackingToast(info).catch(() => undefined);

            const currentPrefs = prefsRef.current;
            await EarGuardNative.startForegroundService(
              'OFFHOOK',
              info,
              currentPrefs.interval,
              currentPrefs.useSound,
              currentPrefs.sound,
            );
            log('Foreground service started', 'Info');
          }
        } else if (state === 'IDLE' && isInCallRef.current) {
          isInCallRef.current = false;
          setIsInCall(false);
          setStatusMessage('Call ended. Monitoring is still on.');
          await EarGuardNative.stopForegroundService();
          await EarGuardNative.recordCallCompleted();
          await refreshInsights();
          log('Foreground service stopped', 'Info');
        }
      } catch (error) {
        setStatusMessage('Error monitoring calls');
        setErrorMessage(`Call listener error: ${error}`);
        log(`Call listener error: ${error}`, 'Error');
      } finally {
        isUpdating.current = false;
      }
    },
    [log, refreshInsights, showCallTrackingToast],
  );

  useEffect(() => {
    loadPreferences();
    if (setupCompleted) {
      requestPermissions().catch(() => undefined);
      checkBatteryOptimization().catch(() => undefined);
    } else {
      setStatusMessage('Complete setup to begin active monitoring.');
    }
  }, [checkBatteryOptimization, loadPreferences, refreshToken, requestPermissions, setupCompleted]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const state = await EarGuardNative.getCallState();
        await handleCallState(state);
      } catch (error) {
        log(`Call listener error: ${error}`, 'Error');
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [handleCallState, log]);

  useEffect(() => () => stopVibration(), [stopVibration]);

  const toggleSimulation = () => {
    if (isSimulating) {
      isSimulatingRef.current = false;
      isInCallRef.current = false;
      setIsSimulating(false);
      setIsInCall(false);
      setStatusMessage('Simulation stopped. Monitoring is still on.');
      stopVibration();
      EarGuardNative.recordCallCompleted()
        .then(() => refreshInsights())
        .catch(() => undefined);
      log('Simulation stopped', 'Info');
      return;
    }
    isSimulatingRef.current = true;
    isInCallRef.current = true;
    setIsSimulating(true);
    setIsInCall(true);
    setCallerInfo('Simulated Caller');
    setStatusMessage('Simulating a call. Timing reminders now.');
    showCallTrackingToast('Simulated Caller').catch(() => undefined);
    if (isWithinQuietHours()) {
      setStatusMessage('Quiet hours are active. Reminder mode is gentle.');
    }
    displayReminderOverlay().catch(() => undefined);
    if (!isWithinQuietHours()) {
      startVibration();
    }
    log('Simulation started', 'Info');
  };

  const statusDescription = errorMessage
    ? errorMessage
    : isSimulating
      ? `Simulated caller: ${callerInfo}`
      : isInCall
        ? `Tracking ${callerInfo}`
        : statusMessage;

  const liveState = errorMessage
    ? 'Attention needed'
    : isSimulating || isInCall
      ? 'Monitoring active'
      : setupCompleted
        ? 'Ready to monitor'
        : 'Setup incomplete';

  const topLongest = [...callHistory]
    .sort((left, right) => right.durationSeconds - left.durationSeconds)
    .slice(0, 3);

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
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.heroTop}>
            <View style={styles.heroMarkStack}>
              <View style={styles.heroMarkOrbA} />
              <View style={styles.heroMarkOrbB} />
              <AppMark source={require('../../assets/icons/app-icon.png')} size={60} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Call guidance</Text>
              <Text style={styles.appTitle}>EarGuard</Text>
              <Text style={styles.heroMiniText}>
                {insights?.weekTotal ?? 0} this week · {insights?.currentStreak ?? 0} day streak
              </Text>
            </View>
            <View style={styles.heroActions}>
              <Pressable onPress={onOpenSettings} style={styles.heroActionButton}>
                <LineIcon name="settings" size={15} color={COLORS.text} />
              </Pressable>
              <Pressable onPress={() => onOpenAbout(prefs.interval, prefs.sound)} style={styles.heroActionButton}>
                <LineIcon name="info" size={15} color={COLORS.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusCardHead}>
              <View>
                <Text style={styles.statusTitle}>{liveState}</Text>
                <Text style={styles.statusMessage}>{statusDescription}</Text>
              </View>
              <IconBadge
                name={errorMessage ? 'warning' : isSimulating || isInCall ? 'phone' : 'spark'}
                tone={errorMessage ? 'danger' : isSimulating || isInCall ? 'primary' : 'success'}
                size={42}
              />
            </View>
            <Text style={styles.statusMetaText}>
              {Math.round(prefs.interval)} min · {soundLabelForFile(prefs.sound)}
            </Text>
          </View>
        </Animated.View>

        <SurfaceCard>
          <SectionHeader eyebrow="This week" title="Calls at a glance" />
          <View style={styles.metricsRow}>
            <TinyMetric icon="chart" value={`${insights?.weekTotal ?? 0}`} label="Calls" />
            <TinyMetric icon="timer" value={`${insights?.dailyPoints ?? 0}`} label="Points" />
            <TinyMetric icon="spark" value={`${insights?.currentStreak ?? 0}`} label="Streak" />
          </View>
          <View style={styles.longestList}>
            {topLongest.length > 0 ? (
              topLongest.map(item => (
                <View key={item.id} style={styles.longestRow}>
                  <Text style={styles.longestLabel} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.longestValue}>{formatDuration(item.durationSeconds)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyState}>No call history yet.</Text>
            )}
          </View>
          <Pressable
            onPress={onOpenCalls}
            style={({pressed}) => [styles.seeMoreButton, pressed && styles.seeMorePressed]}>
            <Text style={styles.seeMoreText}>See more calls</Text>
            <LineIcon name="chart" size={14} color={COLORS.textSoft} />
          </Pressable>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader eyebrow="Action" title="Quick test" />
          <View style={styles.actions}>
            <ActionButton
              title={isSimulating ? 'Stop simulation' : 'Simulate a call'}
              icon="play"
              tone="primary"
              variant="primary"
              onPress={toggleSimulation}
            />
          </View>
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
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
    gap: 16,
  },
  hero: {
    gap: 6,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  heroActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,253,248,0.8)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(65,60,54,0.18)',
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  appTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  heroMiniText: {
    marginTop: 3,
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 5,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  statusChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusChipPrimary: {
    shadowOpacity: 0.08,
  },
  statusChipSecondary: {
    opacity: 0.82,
  },
  statusCard: {
    backgroundColor: 'rgba(255,253,248,0.96)',
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(65,60,54,0.18)',
    padding: 18,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
    transform: [{ rotate: '-0.18deg' }],
  },
  statusCardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  statusMessage: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  statusMetaText: {
    marginTop: 14,
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  heroMarkStack: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMarkOrbA: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(37,99,235,0.16)',
  },
  heroMarkOrbB: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(15,118,110,0.14)',
    transform: [{ translateX: 14 }, { translateY: 6 }],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tinyMetric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,253,248,0.76)',
  },
  tinyMetricValue: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  tinyMetricLabel: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  longestList: {
    gap: 8,
    marginTop: 12,
  },
  longestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207,199,184,0.55)',
    borderStyle: 'dashed',
  },
  longestLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  longestValue: {
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    color: COLORS.textSoft,
    fontSize: 13,
    paddingVertical: 4,
  },
  seeMoreButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  seeMorePressed: {
    opacity: 0.82,
  },
  seeMoreText: {
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actions: {
    gap: 12,
  },
});

function TinyMetric({
  icon,
  value,
  label,
}: {
  icon: 'chart' | 'timer' | 'spark';
  value: string;
  label: string;
}) {
  return (
    <View style={styles.tinyMetric}>
      <IconBadge name={icon} tone="muted" size={24} />
      <Text style={styles.tinyMetricValue}>{value}</Text>
      <Text style={styles.tinyMetricLabel}>{label}</Text>
    </View>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));
  const seconds = Math.max(0, totalSeconds % 60);
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}
