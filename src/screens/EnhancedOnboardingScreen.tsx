import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  AppState,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '../constants';
import {MagicBackground} from '../components/MagicBackground';
import {IconBadge, SurfaceCard} from '../components/Ui';
import {EarGuardNative} from '../native/earguard';
import {sharedStyles} from '../styles';
import type {LineIconName} from '../components/LineIcon';

type PermissionStep = {
  id: 'phone' | 'alerts' | 'battery';
  icon: LineIconName;
  tone: 'primary' | 'accent' | 'warning' | 'muted';
  title: string;
  description: string;
  detail: string;
  skipable: boolean;
};

type Props = {
  onFinish: () => void;
};

const STEPS: PermissionStep[] = [
  {
    id: 'phone',
    icon: 'phone',
    tone: 'primary',
    title: 'Phone access',
    description: 'Detect active calls so reminders appear at the right moment.',
    detail: 'EarGuard reads call state only while it is running.',
    skipable: true,
  },
  {
    id: 'alerts',
    icon: 'bell',
    tone: 'accent',
    title: 'Notifications and overlay',
    description: 'Enable reminders and compact call prompts in one step.',
    detail: 'This keeps the reminder system visible and reliable during calls.',
    skipable: false,
  },
  {
    id: 'battery',
    icon: 'shield',
    tone: 'muted',
    title: 'Battery optimization',
    description: 'Let the app run in the background without being paused too aggressively.',
    detail: 'Recommended for timely reminders and call monitoring.',
    skipable: true,
  },
];

export function EnhancedOnboardingScreen({onFinish}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const step = STEPS[currentStep];
  const isDone = completed.has(step.id);
  const isLastStep = currentStep === STEPS.length - 1;
  const progress = useMemo(
    () => `${currentStep + 1} of ${STEPS.length}`,
    [currentStep],
  );

  const finishOnboarding = useCallback(async () => {
    await EarGuardNative.setOnboardingCompleted(true);
    onFinish();
  }, [onFinish]);

  const moveNext = useCallback(() => {
    if (isLastStep) {
      finishOnboarding().catch(() => undefined);
      return;
    }
    setCurrentStep(index => index + 1);
  }, [finishOnboarding, isLastStep]);

  const refreshCurrentStep = useCallback(async () => {
    let granted = false;

    if (step.id === 'phone') {
      granted =
        Platform.OS !== 'android'
          ? true
          : await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
    }

    if (step.id === 'alerts') {
      const notificationGranted =
        Platform.OS !== 'android'
          ? true
          : await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      const overlayGranted = await EarGuardNative.checkOverlayPermission();
      granted = notificationGranted && overlayGranted;
    }

    if (step.id === 'battery') {
      granted = await EarGuardNative.isIgnoringBatteryOptimizations();
    }

    if (granted && !isDone) {
      setCompleted(previous => {
        const next = new Set(previous);
        next.add(step.id);
        return next;
      });
      moveNext();
    }
  }, [isDone, moveNext, step.id]);

  const handleRequest = async () => {
    let granted = false;

    if (step.id === 'phone') {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        );
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        granted = true;
      }
    }

    if (step.id === 'alerts') {
      if (Platform.OS === 'android') {
        const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
        const result = await PermissionsAndroid.request(permission);
        const notificationGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        if (!notificationGranted) {
          granted = false;
        } else {
          await EarGuardNative.requestOverlayPermission();
          const overlayGranted = await EarGuardNative.checkOverlayPermission();
          granted = overlayGranted;
        }
      } else {
        granted = true;
      }
    }

    if (step.id === 'battery') {
      await EarGuardNative.requestIgnoreBatteryOptimizations();
      granted = await EarGuardNative.isIgnoringBatteryOptimizations();
    }

    if (granted) {
      setCompleted(previous => {
        const next = new Set(previous);
        next.add(step.id);
        return next;
      });
      moveNext();
      return;
    }

    if (step.id === 'alerts') {
      Alert.alert('Permission needed', 'Notifications are required to complete setup.');
    }
  };

  const canSkip = step.skipable && !(step.id === 'alerts' && !isDone);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshCurrentStep().catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [refreshCurrentStep]);

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <MagicBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.stepLabel}>Setup</Text>
            <Text style={styles.progressText}>{progress}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${((currentStep + 1) / STEPS.length) * 100}%`}]} />
          </View>
        </View>

        <SurfaceCard style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <IconBadge name={step.icon} tone={step.tone} size={48} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Why we ask</Text>
              <Text style={styles.heroTitle}>{step.title}</Text>
              <Text style={styles.heroDetail}>{step.detail}</Text>
            </View>
          </View>

          <Text style={styles.heroBody}>{step.description}</Text>

          <View style={styles.helperCard}>
            <Text style={styles.helperLabel}>What this changes</Text>
            <Text style={styles.helperText}>
              The app stays quiet until a call is active, then it surfaces a lightweight reminder.
            </Text>
          </View>
        </SurfaceCard>

        <View style={styles.actionGroup}>
          {!isDone ? (
            <>
              <Pressable onPress={handleRequest} style={({pressed}) => [sharedStyles.primaryButton, pressed && styles.pressed]}>
                <Text style={sharedStyles.buttonTextLight}>Allow access</Text>
              </Pressable>

              {canSkip ? (
                <Pressable
                  onPress={moveNext}
                  style={({pressed}) => [sharedStyles.secondaryButton, pressed && styles.pressed]}>
                  <Text style={sharedStyles.buttonTextDark}>Skip for now</Text>
                </Pressable>
              ) : (
                <Text style={styles.requiredText}>This step is required to continue.</Text>
              )}
            </>
          ) : (
            <>
              <View style={styles.grantedRow}>
                <IconBadge name="check" tone="success" size={28} />
                <Text style={styles.grantedText}>Granted</Text>
              </View>
              <Pressable onPress={moveNext} style={({pressed}) => [sharedStyles.primaryButton, pressed && styles.pressed]}>
                <Text style={sharedStyles.buttonTextLight}>
                  {isLastStep ? 'Finish setup' : 'Continue'}
                </Text>
              </Pressable>
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  topBar: {
    gap: 10,
  },
  stepLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  progressText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  heroCard: {
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroDetail: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  heroBody: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  helperCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  helperLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  helperText: {
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  actionGroup: {
    gap: 12,
  },
  pressed: {
    transform: [{scale: 0.985}],
  },
  requiredText: {
    color: COLORS.warm,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  grantedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 2,
  },
  grantedText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '800',
  },
});
