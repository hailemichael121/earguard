/**
 * TestingScreen — dev tools reachable from Settings.
 * Vibration patterns, floating caller ID preview, post-call summary preview.
 */

import React, {useRef, useState} from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '../constants';
import {LineIcon, type LineIconName} from '../components/LineIcon';
import {FloatingCallerIdCard} from '../components/FloatingCallerIdCard';
import {PostCallSummaryCard} from '../components/PostCallSummaryCard';
import {VibrationPatternService, type VibrationPattern} from '../services/VibrationPatternService';
import {sharedStyles} from '../styles';

type Props = {
  onBack: () => void;
  onNotify?: (toast: {message: string; icon: LineIconName; tone: 'info' | 'success' | 'warning' | 'error'}) => void;
};

export function TestingScreen({onBack, onNotify}: Props) {
  const appear = useRef(new Animated.Value(0)).current;
  const [showCallerCard, setShowCallerCard] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  React.useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [appear]);

  const handleTestVibration = async (pattern: VibrationPattern) => {
    try {
      await VibrationPatternService.playVibration(pattern);
      onNotify?.({
        message: `Vibration test: ${VibrationPatternService.getPatternDescription(pattern)}`,
        icon: 'vibrate',
        tone: 'success',
      });
    } catch {
      onNotify?.({
        message: 'Vibration test failed',
        icon: 'alert',
        tone: 'error',
      });
    }
  };

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: appear,
              transform: [
                {
                  translateY: appear.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
            <LineIcon name="back" size={16} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Development</Text>
            <Text style={styles.title}>Testing Suite</Text>
            <Text style={styles.subtitle}>
              Preview vibrations and on-call overlays without placing a real call.
            </Text>
          </View>
        </Animated.View>

        <Section title="Vibration Patterns">
          <TestButton
            label="Short Pulse"
            description="Single 100ms vibration"
            onPress={() => handleTestVibration('SHORT')}
          />
          <TestButton
            label="Long Pulse"
            description="Single 250ms vibration"
            onPress={() => handleTestVibration('LONG')}
          />
          <TestButton
            label="Triple Short"
            description="Three 80ms pulses with gaps"
            onPress={() => handleTestVibration('TRIPLE_SHORT')}
          />
          <TestButton
            label="Reminder Pattern"
            description="20-minute interval alert (long + three short pulses)"
            onPress={() => handleTestVibration('REMINDER_PATTERN')}
          />
        </Section>

        <Section title="Floating Caller ID Card">
          <TestButton
            label={showCallerCard ? 'Hide Caller Card' : 'Show Caller Card'}
            description={showCallerCard ? 'Card is visible above' : 'Preview the incoming-call overlay'}
            onPress={() => setShowCallerCard(v => !v)}
            active={showCallerCard}
          />
        </Section>

        <Section title="Post-Call Summary">
          <TestButton
            label={showSummary ? 'Hide Summary' : 'Show Summary'}
            description={showSummary ? 'Summary is visible at bottom' : 'Preview the call-completion card'}
            onPress={() => setShowSummary(v => !v)}
            active={showSummary}
          />
        </Section>

        <View style={styles.spacer} />
      </ScrollView>

      <FloatingCallerIdCard
        visible={showCallerCard}
        callerName="John Doe"
        callerNumber="+1 (555) 019-2834"
        intervalMinutes={20}
      />

      <PostCallSummaryCard
        visible={showSummary}
        callerName="John Doe"
        durationSeconds={2535}
        earSwitchCount={2}
        onDismiss={() => setShowSummary(false)}
      />
    </SafeAreaView>
  );
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function TestButton({
  label,
  description,
  onPress,
  active = false,
}: {
  label: string;
  description: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.testButton,
        active && styles.testButtonActive,
        pressed && styles.testButtonPressed,
      ]}>
      <View style={styles.testButtonContent}>
        <Text style={[styles.testButtonLabel, active && styles.testButtonLabelActive]}>
          {label}
        </Text>
        <Text style={styles.testButtonDescription}>{description}</Text>
      </View>
      <LineIcon
        name={active ? 'check' : 'play'}
        size={16}
        color={active ? COLORS.success : COLORS.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  headerCopy: {},
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSoft,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionContent: {
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testButtonActive: {
    backgroundColor: COLORS.successSoft,
    borderColor: COLORS.success,
  },
  testButtonPressed: {
    opacity: 0.7,
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  testButtonLabelActive: {
    color: COLORS.success,
  },
  testButtonDescription: {
    fontSize: 11,
    color: COLORS.textSoft,
  },
  spacer: {
    height: 40,
  },
});
