import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS, DEFAULT_PREFS} from '../constants';
import {MagicBackground} from '../components/MagicBackground';
import {StatusChip, type StatusChipVariant} from '../components/StatusChip';
import {EarGuardNative, soundLabelForFile} from '../native/earguard';
import {sharedStyles} from '../styles';
import type {AppPreferences, DebugLog, Insights} from '../types';

type Props = {
  onOpenSettings: () => void;
  onOpenAbout: (interval: number, sound: string) => void;
  refreshToken: number;
  setupCompleted?: boolean;
};

export function HomeScreen({
  onOpenSettings,
  onOpenAbout,
  refreshToken,
  setupCompleted = false,
}: Props) {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFS);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Ready. Waiting for calls...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [_callerInfo, setCallerInfo] = useState('Unknown');
  const [showReminderOverlay, setShowReminderOverlay] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [debugVisible, setDebugVisible] = useState(false);
  const isUpdating = useRef(false);
  const isInCallRef = useRef(false);
  const isSimulatingRef = useRef(false);
  const prefsRef = useRef(prefs);
  const vibrationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    prefsRef.current = prefs;
    isInCallRef.current = isInCall;
    isSimulatingRef.current = isSimulating;
  }, [prefs, isInCall, isSimulating]);

  const log = useCallback((message: string, category: DebugLog['category']) => {
    setDebugLogs(prev => [
      ...prev,
      {message, category, timestamp: new Date()},
    ]);
    console.log(`[sharuk] ${category} - ${message}`);
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const [loaded, nextInsights] = await Promise.all([
        EarGuardNative.getPreferences(),
        EarGuardNative.getInsights(),
      ]);
      setPrefs(loaded);
      setInsights(nextInsights);
      log('Preferences loaded successfully', 'Info');
    } catch (e) {
      setErrorMessage(`Failed to load preferences: ${e}`);
      log(`Failed to load preferences: ${e}`, 'Error');
    } finally {
      setLoading(false);
    }
  }, [log]);

  const refreshInsights = useCallback(async () => {
    try {
      const next = await EarGuardNative.getInsights();
      setInsights(next);
    } catch (e) {
      log(`Insights error: ${e}`, 'Error');
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
        setStatusMessage('App is working. Ready to monitor calls.');
        setErrorMessage(null);
        log('All permissions granted', 'Info');
      } else {
        setStatusMessage('Permissions denied');
        setErrorMessage(
          'Required permissions are missing. Please grant phone, notification, and overlay permissions.',
        );
        log('Some permissions denied', 'Warning');

        const isMIUI = await EarGuardNative.isMIUI();
        if (!overlayGranted) {
          Alert.alert(
            'Permissions',
            `Please grant phone, notification, and overlay permissions in settings.${
              isMIUI
                ? ' On MIUI, go to Settings > Apps > EarGuard > Other Permissions and enable "Display pop-up windows while running in the background".'
                : ''
            }`,
            [
              {text: 'Open Settings', onPress: () => Linking.openSettings()},
              {text: 'OK'},
            ],
          );
        }
      }
    } catch (e) {
      setErrorMessage(`Permission error: ${e}`);
      log(`Permission error: ${e}`, 'Error');
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
          'Enable Background Running',
          `Allow EarGuard to run in the background for timely reminders.${
            isMIUI
              ? ' On MIUI, go to Settings > Apps > EarGuard > Battery > No restrictions and enable "Display pop-up windows while running in the background".'
              : ''
          }`,
          [
            {text: 'Later', style: 'cancel'},
            {
              text: 'Allow',
              onPress: () => EarGuardNative.requestIgnoreBatteryOptimizations(),
            },
          ],
        );
      }
    } catch (e) {
      log(`Battery optimization error: ${e}`, 'Error');
    }
  }, [log]);

  const showCallTrackingToast = useCallback(
    async (caller: string) => {
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
        await EarGuardNative.showOverlay(caller);
        log(`Call tracking toast shown for ${caller}`, 'Info');
        setTimeout(() => {
          EarGuardNative.hideOverlay().catch(() => undefined);
        }, 5000);
      } catch (e) {
        log(`Failed to show call tracking toast: ${e}`, 'Error');
      }
    },
    [log],
  );

  const stopVibration = useCallback(() => {
    if (vibrationTimer.current) {
      clearInterval(vibrationTimer.current);
      vibrationTimer.current = null;
    }
    setShowReminderOverlay(false);
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
    const toMinutes = (v: string) => {
      const [h, m] = v.split(':').map(Number);
      return (Number.isFinite(h) ? h : 22) * 60 + (Number.isFinite(m) ? m : 0);
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
    setShowReminderOverlay(true);
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
            setStatusMessage('Call started. Timer activated.');
            setErrorMessage(null);

            const info = await EarGuardNative.getCallerInfo();
            setCallerInfo(info);
            showCallTrackingToast(info);

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
          setStatusMessage('Call ended. App is working.');
          await EarGuardNative.stopForegroundService();
          await EarGuardNative.recordCallCompleted();
          await refreshInsights();
          log('Foreground service stopped', 'Info');
        }
      } catch (e) {
        setStatusMessage('Error monitoring calls');
        setErrorMessage(`Call listener error: ${e}`);
        log(`Call listener error: ${e}`, 'Error');
      } finally {
        isUpdating.current = false;
      }
    },
    [log, refreshInsights, showCallTrackingToast],
  );

  useEffect(() => {
    loadPreferences();
    if (setupCompleted) {
      requestPermissions();
      checkBatteryOptimization();
    } else {
      setStatusMessage('Complete setup to begin active monitoring.');
    }
  }, [loadPreferences, requestPermissions, checkBatteryOptimization, refreshToken, setupCompleted]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const state = await EarGuardNative.getCallState();
        await handleCallState(state);
      } catch (e) {
        log(`Call listener error: ${e}`, 'Error');
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
      setStatusMessage('Simulation stopped. App is working.');
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
    setStatusMessage('Simulating call... Timer started.');
    showCallTrackingToast('Simulated Caller');
    if (isWithinQuietHours()) {
      setStatusMessage('Quiet hours active. Gentle reminder mode.');
    }
    displayReminderOverlay();
    if (!isWithinQuietHours()) {
      startVibration();
    }
    log('Simulation started', 'Info');
  };

  const readyActive =
    !errorMessage &&
    (statusMessage.includes('Ready') ||
      statusMessage.includes('App is working') ||
      statusMessage.includes('Call ended'));
  const callActive =
    isInCall ||
    isSimulating ||
    statusMessage.includes('Simulating') ||
    statusMessage.includes('Call started');
  const warnActive =
    Boolean(errorMessage) ||
    statusMessage.includes('denied') ||
    statusMessage.includes('Error') ||
    statusMessage.includes('Complete setup');
  const quietActive = prefs.quietHoursEnabled && isWithinQuietHours();

  const statusChips: Array<{variant: StatusChipVariant; active: boolean}> = [
    {variant: 'ready', active: readyActive && !callActive},
    {variant: 'call', active: callActive},
    {variant: 'quiet', active: quietActive},
    {variant: 'warn', active: warnActive && !callActive},
  ];

  if (loading) {
    return (
      <View style={[sharedStyles.screen, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['left', 'right', 'bottom']}>
      <MagicBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View
          style={[
            styles.animatedCardWrap,
            {
              opacity: entrance,
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}>
          <Text style={styles.appTitle}>EarGuard</Text>
          <Text style={styles.subtitle}>Healthy call habits, minimal friction.</Text>

          <View style={styles.statusChipRow}>
            {statusChips.map(chip => (
              <StatusChip
                key={chip.variant}
                variant={chip.variant}
                active={chip.active}
                size={chip.active ? 56 : 44}
                style={chip.active ? styles.statusChipPrimary : styles.statusChipSecondary}
              />
            ))}
          </View>

          <Text style={styles.status}>{statusMessage}</Text>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <Text style={styles.meta}>Interval: {Math.round(prefs.interval)} minutes</Text>
          <Text style={styles.meta}>Ringtone: {soundLabelForFile(prefs.sound)}</Text>
          <Text style={styles.meta}>
            Quiet Hours: {prefs.quietHoursEnabled ? `${prefs.quietStart} - ${prefs.quietEnd}` : 'Off'}
          </Text>

          <View style={styles.insightsCard}>
            <Text style={styles.cardTitle}>Weekly Summary</Text>
            <Text style={styles.cardMeta}>
              Calls: {insights?.totalCalls ?? 0} • This week: {insights?.weekTotal ?? 0}
            </Text>
            <Text style={styles.cardMeta}>Current streak: {insights?.currentStreak ?? 0} days</Text>
            <View style={styles.weekRow}>
              {(insights?.weekSeries ?? []).map(point => (
                <View key={point.date} style={styles.weekCol}>
                  <View
                    style={[
                      styles.weekBar,
                      point.count > 0 ? styles.weekBarActive : styles.weekBarMuted,
                      {
                        height: Math.max(8, Math.min(56, point.count * 14)),
                      },
                    ]}
                  />
                  <Text style={styles.weekText}>{point.date.slice(8)}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.insightsCard}>
            <Text style={styles.cardTitle}>Achievements</Text>
            <Text style={styles.achievement}>
              {insights?.firstTenUnlocked ? 'Unlocked' : 'Locked'} • First 10 calls
            </Text>
            <Text style={styles.achievement}>
              {insights?.sevenDayUnlocked ? 'Unlocked' : 'Locked'} • 7-day streak
            </Text>
          </View>

          <TouchableOpacity style={[sharedStyles.primaryButton, styles.gap]} onPress={toggleSimulation}>
            <Text style={sharedStyles.buttonTextLight}>
              {isSimulating ? 'Stop Simulation' : 'Simulate Call'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[sharedStyles.secondaryButton, styles.gap]} onPress={onOpenSettings}>
            <Text style={sharedStyles.buttonTextDark}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[sharedStyles.secondaryButton, styles.gap]}
            onPress={() => onOpenAbout(prefs.interval, prefs.sound)}>
            <Text style={sharedStyles.buttonTextDark}>About EarGuard</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setDebugVisible(true)}>
        <Text style={styles.fabText}>LOG</Text>
      </TouchableOpacity>

      <Modal visible={debugVisible} animationType="slide">
        <View style={styles.debugModal}>
          <Text style={styles.debugTitle}>Debug Logs</Text>
          <FlatList
            data={[...debugLogs].reverse()}
            keyExtractor={(_, index) => String(index)}
            renderItem={({item}) => (
              <View style={styles.debugRow}>
                <Text style={styles.debugCategory}>{item.category}</Text>
                <Text style={styles.debugMessage}>{item.message}</Text>
                <Text style={styles.debugTime}>{item.timestamp.toLocaleString()}</Text>
              </View>
            )}
          />
          <TouchableOpacity style={styles.confirm} onPress={() => setDebugVisible(false)}>
            <Text style={sharedStyles.buttonTextLight}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showReminderOverlay} transparent animationType="fade">
        <TouchableOpacity
          style={styles.reminderBackdrop}
          activeOpacity={1}
          onPress={stopVibration}>
          <View style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>EarGuard Reminder</Text>
            <Text style={styles.reminderBody}>Time to switch ears!</Text>
            <TouchableOpacity style={styles.confirm} onPress={stopVibration}>
              <Text style={sharedStyles.buttonTextLight}>Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {justifyContent: 'center', alignItems: 'center'},
  content: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  animatedCardWrap: {
    width: '100%',
  },
  appTitle: {fontSize: 30, fontWeight: '800', color: COLORS.text, marginBottom: 6},
  subtitle: {fontSize: 14, color: COLORS.muted, marginBottom: 24},
  statusChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    minHeight: 60,
  },
  statusChipPrimary: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  statusChipSecondary: {},
  status: {fontSize: 18, color: COLORS.text, textAlign: 'center'},
  error: {fontSize: 14, color: COLORS.error, textAlign: 'center', marginTop: 8},
  meta: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 8,
  },
  insightsCard: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E8FF',
    padding: 14,
  },
  cardTitle: {fontSize: 16, fontWeight: '700', color: COLORS.text},
  cardMeta: {fontSize: 13, color: COLORS.muted, marginTop: 6},
  weekRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  weekCol: {alignItems: 'center', flex: 1},
  weekBar: {width: 12, borderRadius: 6},
  weekBarActive: {backgroundColor: COLORS.primary},
  weekBarMuted: {backgroundColor: '#D9E3FF'},
  weekText: {fontSize: 10, color: COLORS.muted, marginTop: 4},
  achievement: {marginTop: 8, color: COLORS.text, fontWeight: '600'},
  gap: {marginTop: 16, width: '100%'},
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  fabText: {fontSize: 12, color: COLORS.white, fontWeight: '800'},
  debugModal: {flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 48},
  debugTitle: {fontSize: 20, fontWeight: '700', marginBottom: 12, color: COLORS.text},
  debugRow: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  debugCategory: {fontWeight: '700', color: COLORS.primary},
  debugMessage: {color: COLORS.text},
  debugTime: {fontSize: 12, color: '#9E9E9E'},
  reminderBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  reminderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  reminderTitle: {fontSize: 20, fontWeight: '700', color: COLORS.text},
  reminderBody: {fontSize: 16, color: COLORS.text, marginVertical: 12},
  confirm: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
});
