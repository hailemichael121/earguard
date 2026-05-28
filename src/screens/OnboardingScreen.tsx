import React, {useMemo, useState} from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {COLORS} from '../constants';
import {MagicBackground} from '../components/MagicBackground';
import {EarGuardNative} from '../native/earguard';
import {sharedStyles} from '../styles';

type Props = {
  onFinish: () => void;
};

export function OnboardingScreen({onFinish}: Props) {
  const [phoneDone, setPhoneDone] = useState(false);
  const [notificationDone, setNotificationDone] = useState(false);
  const [overlayDone, setOverlayDone] = useState(false);
  const [batteryDone, setBatteryDone] = useState(false);

  const completedSteps = useMemo(
    () => [phoneDone, notificationDone, overlayDone, batteryDone].filter(Boolean).length,
    [phoneDone, notificationDone, overlayDone, batteryDone],
  );
  const totalSteps = 4;
  const progress = Math.round((completedSteps / totalSteps) * 100);
  const points = completedSteps * 25;

  const requestPhone = async () => {
    if (Platform.OS !== 'android') {
      setPhoneDone(true);
      return;
    }
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
    setPhoneDone(result === PermissionsAndroid.RESULTS.GRANTED);
  };

  const requestNotifications = async () => {
    if (Platform.OS !== 'android') {
      setNotificationDone(true);
      return;
    }
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (!permission) {
      setNotificationDone(true);
      return;
    }
    const result = await PermissionsAndroid.request(permission);
    setNotificationDone(result === PermissionsAndroid.RESULTS.GRANTED);
  };

  const requestOverlay = async () => {
    await EarGuardNative.requestOverlayPermission();
    const granted = await EarGuardNative.checkOverlayPermission();
    setOverlayDone(granted);
  };

  const requestBattery = async () => {
    await EarGuardNative.requestIgnoreBatteryOptimizations();
    const granted = await EarGuardNative.isIgnoringBatteryOptimizations();
    setBatteryDone(granted);
  };

  const finish = async () => {
    if (completedSteps < totalSteps) {
      Alert.alert('Setup not complete', 'Complete all setup steps for best reliability.');
      return;
    }
    await EarGuardNative.setOnboardingCompleted(true);
    onFinish();
  };

  return (
    <View style={sharedStyles.screen}>
      <MagicBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome to EarGuard</Text>
        <Text style={styles.subtitle}>
          Quick 4-step setup. Earn points as you unlock each permission.
        </Text>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Setup Progress</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, {width: `${progress}%`}]} />
          </View>
          <Text style={styles.progressMeta}>
            {completedSteps}/{totalSteps} steps complete • {points} points
          </Text>
        </View>

        <StepCard
          title="Phone access"
          description="Needed to detect incoming and active calls."
          done={phoneDone}
          onPress={requestPhone}
        />
        <StepCard
          title="Notifications"
          description="So reminders appear immediately when it's time to switch ears."
          done={notificationDone}
          onPress={requestNotifications}
        />
        <StepCard
          title="Overlay permission"
          description="Enables compact call tracking and reminder overlay."
          done={overlayDone}
          onPress={requestOverlay}
        />
        <StepCard
          title="Battery optimization"
          description="Keeps reminder timing accurate while app runs in background."
          done={batteryDone}
          onPress={requestBattery}
        />

        <TouchableOpacity style={styles.finishButton} onPress={finish}>
          <Text style={styles.finishButtonText}>Finish setup</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StepCard({
  title,
  description,
  done,
  onPress,
}: {
  title: string;
  description: string;
  done: boolean;
  onPress: () => void | Promise<void>;
}) {
  return (
    <TouchableOpacity style={styles.stepCard} onPress={onPress}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={[styles.badge, done ? styles.badgeDone : styles.badgePending]}>
          {done ? 'DONE' : 'TODO'}
        </Text>
      </View>
      <Text style={styles.stepDescription}>{description}</Text>
      <Text style={styles.stepAction}>{done ? 'You unlocked this step' : 'Tap to grant permission'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  progressCard: {
    marginTop: 20,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    shadowColor: COLORS.shadowDark,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 7,
  },
  progressTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  barTrack: {
    marginTop: 10,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#DDE6FF',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressMeta: {
    marginTop: 8,
    color: COLORS.muted,
    fontWeight: '600',
  },
  stepCard: {
    marginTop: 14,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7ECFA',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeDone: {
    color: '#0F5D2E',
    backgroundColor: '#CFF4DE',
  },
  badgePending: {
    color: '#7A4D00',
    backgroundColor: '#FFE6B2',
  },
  stepDescription: {
    marginTop: 8,
    color: COLORS.muted,
    lineHeight: 21,
  },
  stepAction: {
    marginTop: 8,
    color: COLORS.primary,
    fontWeight: '700',
  },
  finishButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
});
