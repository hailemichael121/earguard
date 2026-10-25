import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS, DEFAULT_PREFS, SOUND_MAP} from '../constants';
import {AnimatedChip} from '../components/AnimatedChip';
import {IconBadge, SectionHeader, SurfaceCard} from '../components/Ui';
import {LineIcon, type LineIconName} from '../components/LineIcon';
import {EarGuardNative, soundLabelForFile} from '../native/earguard';
import {sharedStyles} from '../styles';
import type {AppPreferences} from '../types';

type Props = {
  onBack: () => void;
  onSettingsChanged: () => void;
  onNotify: (toast: {message: string; icon: LineIconName; tone: 'info' | 'success' | 'warning' | 'error'}) => void;
  onOpenTests?: () => void;
};

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const flash = useRef(new Animated.Value(0)).current;

  const handleChange = (next: boolean) => {
    flash.setValue(0);
    Animated.sequence([
      Animated.timing(flash, {toValue: 1, duration: 120, useNativeDriver: false}),
      Animated.timing(flash, {toValue: 0, duration: 220, useNativeDriver: false}),
    ]).start();
    onValueChange(next);
  };

  const bg = flash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(37,99,235,0)', 'rgba(37,99,235,0.09)'],
  });

  return (
    <Animated.View style={[styles.toggleRow, {backgroundColor: bg}]}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        trackColor={{false: '#CBD5E1', true: COLORS.primary}}
        thumbColor={COLORS.white}
        onValueChange={handleChange}
      />
    </Animated.View>
  );
}

export function SettingsScreen({onBack, onSettingsChanged, onNotify, onOpenTests}: Props) {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFS);
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [tempSoundName, setTempSoundName] = useState('Classic Chime');
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [appear]);

  const load = useCallback(async () => {
    const loaded = await EarGuardNative.getPreferences();
    setPrefs(loaded);
    setTempSoundName(soundLabelForFile(loaded.sound));
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const save = useCallback(
    async (next: AppPreferences) => {
      setPrefs(next);
      await EarGuardNative.savePreferences(next);
      onSettingsChanged();
      onNotify({message: 'Settings saved', icon: 'check', tone: 'success'});
    },
    [onNotify, onSettingsChanged],
  );

  const confirmSound = async () => {
    const file = SOUND_MAP[tempSoundName] ?? 'reminder3.mp3';
    await save({...prefs, sound: file});
    setSoundModalVisible(false);
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
          <Pressable onPress={onBack} style={styles.backButton}>
            <LineIcon name="back" size={16} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Personalize</Text>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Keep the controls focused on what changes the reminder behavior.
            </Text>
          </View>
        </Animated.View>

        <SurfaceCard>
          <SectionHeader
            eyebrow="Monitoring"
            title="Reminders and timing"
            description="These settings control how often the app nudges you during calls."
          />
          <ToggleRow
            label="Enable reminders"
            value={prefs.enabled}
            onValueChange={enabled => save({...prefs, enabled})}
          />
          <View style={styles.inlineNote}>
            <IconBadge name="timer" tone="primary" size={28} />
            <View style={styles.inlineCopy}>
              <Text style={styles.inlineTitle}>Reminder interval</Text>
              <Text style={styles.inlineText}>{Math.round(prefs.interval)} minutes</Text>
            </View>
          </View>
          <View style={styles.chipRow}>
            {[5, 10, 15, 20, 30].map(value => (
              <AnimatedChip
                key={value}
                label={String(value)}
                active={Math.round(prefs.interval) === value}
                onPress={() => save({...prefs, interval: value})}
              />
            ))}
          </View>
          <View style={styles.divider} />
          <ToggleRow
            label="Smart intensity"
            value={prefs.smartIntensity}
            onValueChange={smartIntensity => save({...prefs, smartIntensity})}
          />
          <Text style={styles.helper}>
            The app uses a gentler vibration for longer intervals and a quicker pulse for short ones.
          </Text>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            eyebrow="Alerts"
            title="Sound and quiet hours"
            description="Keep alert styles obvious but low-friction."
          />
          <ToggleRow
            label="Enable sound"
            value={prefs.useSound}
            onValueChange={useSound => save({...prefs, useSound})}
          />
          {prefs.useSound ? (
            <>
              <Pressable
                onPress={() => setSoundModalVisible(true)}
                style={({pressed}) => [styles.selectRow, pressed && styles.selectRowPressed]}>
                <View style={[styles.inlineNote, styles.selectRowContent]}>
                  <IconBadge name="sound" tone="accent" size={28} />
                  <View style={styles.inlineCopy}>
                    <Text style={styles.inlineTitle}>Reminder sound</Text>
                    <Text style={styles.inlineText}>{soundLabelForFile(prefs.sound)}</Text>
                  </View>
                </View>
                <LineIcon name="back" size={16} color={COLORS.textSoft} style={styles.chevron} />
              </Pressable>
            </>
          ) : null}

          <View style={styles.divider} />
          <ToggleRow
            label="Quiet hours"
            value={prefs.quietHoursEnabled}
            onValueChange={quietHoursEnabled => save({...prefs, quietHoursEnabled})}
          />
          {prefs.quietHoursEnabled ? (
            <>
              <Text style={styles.helper}>
                Active window: {prefs.quietStart} - {prefs.quietEnd}
              </Text>
              <View style={styles.chipRow}>
                {[
                  ['22:00', '07:00'],
                  ['23:00', '06:00'],
                  ['21:00', '06:30'],
                ].map(([quietStart, quietEnd]) => {
                  const active = prefs.quietStart === quietStart && prefs.quietEnd === quietEnd;
                  return (
                    <AnimatedChip
                      key={`${quietStart}-${quietEnd}`}
                      label={`${quietStart} - ${quietEnd}`}
                      active={active}
                      onPress={() => save({...prefs, quietStart, quietEnd})}
                    />
                  );
                })}
              </View>
            </>
          ) : null}
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            eyebrow="Development"
            title="Testing suite"
            description="Run tests for vibrations, overlays, and call timer logic."
          />
          <Pressable
            onPress={onOpenTests}
            style={({pressed}) => [styles.testingButton, pressed && styles.testingButtonPressed]}>
            <View style={styles.testingButtonLeft}>
              <IconBadge name="play" tone="primary" size={28} />
              <View>
                <Text style={styles.testingButtonLabel}>Open Testing Suite</Text>
                <Text style={styles.testingButtonDescription}>
                  Test components and services in development mode
                </Text>
              </View>
            </View>
            <LineIcon name="back" size={16} color={COLORS.primary} style={{transform: [{rotate: '180deg'}]}} />
          </Pressable>
        </SurfaceCard>

      </ScrollView>
      <Modal visible={soundModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Audio</Text>
                <Text style={styles.modalTitle}>Select reminder sound</Text>
              </View>
              <Pressable onPress={() => setSoundModalVisible(false)} style={styles.closeButton}>
                <LineIcon name="close" size={16} color={COLORS.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.soundList} showsVerticalScrollIndicator={false}>
              {Object.keys(SOUND_MAP).map(name => {
                const selected = tempSoundName === name;
                return (
                  <Pressable
                    key={name}
                    onPress={() => {
                      setTempSoundName(name);
                      EarGuardNative.playSound(SOUND_MAP[name]).catch(() => undefined);
                    }}
                    style={({pressed}) => [
                      styles.soundRow,
                      selected && styles.soundRowSelected,
                      pressed && styles.soundRowPressed,
                    ]}>
                    <View style={styles.soundRowLeft}>
                      <IconBadge name={selected ? 'check' : 'sound'} tone={selected ? 'primary' : 'muted'} size={28} />
                      <View style={styles.soundCopy}>
                        <Text style={[styles.soundName, selected && styles.soundNameSelected]}>
                          {name}
                        </Text>
                        <Text style={styles.soundHint}>
                          {selected ? 'Selected' : 'Preview available'}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        EarGuardNative.playSound(SOUND_MAP[name]).catch(() => undefined);
                      }}
                      hitSlop={10}
                      style={styles.playButton}>
                      <LineIcon name="play" size={13} color={COLORS.primary} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable onPress={confirmSound} style={styles.confirmButton}>
              <Text style={sharedStyles.buttonTextLight}>Confirm selection</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  toggleRow: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,253,248,0.6)',
  },
  toggleLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },
  inlineNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(243,238,228,0.72)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 12,
  },
  inlineCopy: {
    flex: 1,
  },
  inlineTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  inlineText: {
    marginTop: 3,
    color: COLORS.textSoft,
    fontSize: 13,
  },
  helper: {
    marginTop: 8,
    color: COLORS.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  selectRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 2,
  },
  selectRowPressed: {
    opacity: 0.9,
  },
  selectRowContent: {
    flex: 1,
  },
  chevron: {
    transform: [{rotate: '180deg'}],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.36)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '84%',
    padding: 18,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  modalEyebrow: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  soundList: {
    gap: 10,
    paddingBottom: 12,
  },
  soundRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 12,
    backgroundColor: 'rgba(255,253,248,0.95)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  soundRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(232,228,217,0.96)',
  },
  soundRowPressed: {
    opacity: 0.96,
  },
  soundRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  soundCopy: {
    flex: 1,
  },
  soundName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '800',
  },
  soundNameSelected: {
    color: COLORS.primary,
  },
  soundHint: {
    marginTop: 3,
    color: COLORS.textSoft,
    fontSize: 12,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  confirmButton: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  testingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(34,37,45,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testingButtonPressed: {
    opacity: 0.7,
  },
  testingButtonLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
  },
  testingButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  testingButtonDescription: {
    fontSize: 12,
    color: COLORS.textSoft,
  },
});
