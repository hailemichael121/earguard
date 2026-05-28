import React, {useState} from 'react';
import {
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '../constants';
import {MagicBackground} from '../components/MagicBackground';
import {EarGuardNative} from '../native/earguard';
import {sharedStyles} from '../styles';

type PermissionStep = {
  id: 'phone' | 'notification' | 'overlay' | 'battery';
  icon: string;
  title: string;
  description: string;
  skipable: boolean;
};

type Props = {
  onFinish: () => void;
};

const STEPS: PermissionStep[] = [
  {
    id: 'phone',
    icon: '☎️',
    title: 'Phone Access',
    description: 'Monitor calls to know when to remind you',
    skipable: true,
  },
  {
    id: 'notification',
    icon: '🔔',
    title: 'Notifications',
    description: 'Send reminders to switch ears',
    skipable: false, // Required
  },
  {
    id: 'overlay',
    icon: '👁️',
    title: 'Overlay Permission',
    description: 'Show reminders on top of other apps',
    skipable: true,
  },
  {
    id: 'battery',
    icon: '⚡',
    title: 'Battery Optimization',
    description: 'Keep running in background',
    skipable: true,
  },
];

export function EnhancedOnboardingScreen({onFinish}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const step = STEPS[currentStep];
  const isDone = completed.has(step.id);
  const isLastStep = currentStep === STEPS.length - 1;

  const handleRequest = async () => {
    let granted = false;

    if (step.id === 'phone') {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        granted = true;
      }
    }

    if (step.id === 'notification') {
      if (Platform.OS === 'android') {
        const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
        const result = await PermissionsAndroid.request(permission);
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        granted = true;
      }
    }

    if (step.id === 'overlay') {
      await EarGuardNative.requestOverlayPermission();
      granted = await EarGuardNative.checkOverlayPermission();
    }

    if (step.id === 'battery') {
      await EarGuardNative.requestIgnoreBatteryOptimizations();
      granted = await EarGuardNative.isIgnoringBatteryOptimizations();
    }

    if (granted) {
      const newCompleted = new Set(completed);
      newCompleted.add(step.id);
      setCompleted(newCompleted);
      moveNext();
    }
  };

  const handleSkip = () => {
    moveNext();
  };

  const moveNext = () => {
    if (isLastStep) {
      finishOnboarding();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const finishOnboarding = async () => {
    await EarGuardNative.setOnboardingCompleted(true);
    onFinish();
  };

  const notificationRequiredButMissing = step.id === 'notification' && !isDone;
  const canSkip = step.skipable && !notificationRequiredButMissing;

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['left', 'right', 'bottom']}>
      <MagicBackground />
      <View style={styles.container}>
        {/* Step counter */}
        <Text style={styles.stepCounter}>
          {currentStep + 1} / {STEPS.length}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {width: `${((currentStep + 1) / STEPS.length) * 100}%`},
            ]}
          />
        </View>

        {/* Large icon */}
        <View style={styles.spacer} />
        <Text style={styles.largeIcon}>{step.icon}</Text>

        {/* Title */}
        <Text style={styles.title}>{step.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{step.description}</Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {!isDone ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRequest}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Allow</Text>
              </TouchableOpacity>

              {canSkip && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSkip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Skip</Text>
                </TouchableOpacity>
              )}

              {!step.skipable && !isDone && (
                <Text style={styles.requiredText}>Required to continue</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.grantedText}>✓ Granted</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={moveNext}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>
                  {isLastStep ? 'Finish' : 'Next'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
  },
  stepCounter: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.backgroundDeep,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  spacer: {
    flex: 1,
  },
  largeIcon: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.muted,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.muted,
  },
  grantedText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 8,
  },
  requiredText: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});
