import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS, DEFAULT_PREFS, SOUND_MAP} from '../constants';
import {AnimatedChip} from '../components/AnimatedChip';
import {AnimatedSettingCard} from '../components/AnimatedSettingCard';
import {MagicBackground} from '../components/MagicBackground';
import {EarGuardNative, soundLabelForFile} from '../native/earguard';
import {sharedStyles} from '../styles';
import type {AppPreferences} from '../types';

type Props = {
  onBack: () => void;
  onSettingsChanged: () => void;
};

function AnimatedSwitchRow({
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
    outputRange: ['rgba(41, 121, 255, 0)', 'rgba(41, 121, 255, 0.12)'],
  });

  return (
    <Animated.View style={[styles.row, styles.switchRow, {backgroundColor: bg}]}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        trackColor={{false: '#BDBDBD', true: COLORS.primary}}
        onValueChange={handleChange}
      />
    </Animated.View>
  );
}

export function SettingsScreen({onBack, onSettingsChanged}: Props) {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFS);
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [tempSoundName, setTempSoundName] = useState('Classic Chime');
  const [savedToast, setSavedToast] = useState(false);
  const appear = useRef(new Animated.Value(0)).current;
  const toastY = useRef(new Animated.Value(24)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [appear]);

  useEffect(() => {
    if (!savedToast) {
      return;
    }
    toastY.setValue(24);
    toastOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(toastY, {toValue: 0, useNativeDriver: true, speed: 18, bounciness: 6}),
      Animated.timing(toastOpacity, {toValue: 1, duration: 180, useNativeDriver: true}),
    ]).start();
  }, [savedToast, toastOpacity, toastY]);

  const load = useCallback(async () => {
    const loaded = await EarGuardNative.getPreferences();
    setPrefs(loaded);
    setTempSoundName(soundLabelForFile(loaded.sound));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (next: AppPreferences) => {
      setPrefs(next);
      await EarGuardNative.savePreferences(next);
      onSettingsChanged();
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    },
    [onSettingsChanged],
  );

  const confirmSound = async () => {
    const file = SOUND_MAP[tempSoundName] ?? 'reminder3.mp3';
    await save({...prefs, sound: file});
    setSoundModalVisible(false);
  };

  let cardIndex = 0;

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['left', 'right', 'bottom']}>
      <MagicBackground />
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
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
        <AnimatedSettingCard index={cardIndex++} style={styles.gapFirst}>
          <AnimatedSwitchRow
            label="Enable Reminders"
            value={prefs.enabled}
            onValueChange={enabled => save({...prefs, enabled})}
          />
        </AnimatedSettingCard>

        <AnimatedSettingCard index={cardIndex++} style={styles.gap}>
          <AnimatedSwitchRow
            label="Enable Sound"
            value={prefs.useSound}
            onValueChange={useSound => save({...prefs, useSound})}
          />
        </AnimatedSettingCard>

        {prefs.useSound && (
          <>
            <Animated.View
              style={[
                styles.gap,
                {
                  opacity: appear,
                  transform: [{scale: appear}],
                },
              ]}>
              <TouchableOpacity
                style={[sharedStyles.primaryButton, styles.soundButton]}
                onPress={() => setSoundModalVisible(true)}>
                <Text style={sharedStyles.buttonTextLight}>Select Reminder Sound</Text>
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.selected}>Selected: {soundLabelForFile(prefs.sound)}</Text>
          </>
        )}

        <AnimatedSettingCard index={cardIndex++} style={styles.gap}>
          <Text style={styles.label}>Smart Reminder Intensity</Text>
          <Text style={styles.helper}>
            Gentle for long intervals, stronger for short intervals.
          </Text>
          <AnimatedSwitchRow
            label="Smart intensity"
            value={prefs.smartIntensity}
            onValueChange={smartIntensity => save({...prefs, smartIntensity})}
          />
        </AnimatedSettingCard>

        <AnimatedSettingCard index={cardIndex++} style={styles.gap}>
          <Text style={styles.label}>Quiet Hours</Text>
          <Text style={styles.helper}>Reduce disturbance during selected time window.</Text>
          <AnimatedSwitchRow
            label="Enable quiet hours"
            value={prefs.quietHoursEnabled}
            onValueChange={quietHoursEnabled => save({...prefs, quietHoursEnabled})}
          />
          {prefs.quietHoursEnabled && (
            <>
              <Text style={styles.selected}>
                Active: {prefs.quietStart} - {prefs.quietEnd}
              </Text>
              <View style={styles.sliderRow}>
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
          )}
        </AnimatedSettingCard>

        <AnimatedSettingCard index={cardIndex++} style={styles.gap}>
          <Text style={styles.label}>Reminder Interval</Text>
          <Text style={styles.intervalValue}>{Math.round(prefs.interval)} minutes</Text>
          <View style={styles.sliderRow}>
            {[1, 5, 10, 15, 20, 25, 30].map(value => (
              <AnimatedChip
                key={value}
                label={String(value)}
                active={Math.round(prefs.interval) === value}
                onPress={() => save({...prefs, interval: value})}
              />
            ))}
          </View>
        </AnimatedSettingCard>
      </ScrollView>

      {savedToast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [{translateY: toastY}],
            },
          ]}>
          <Text style={styles.toastText}>Settings saved</Text>
        </Animated.View>
      )}

      <Modal visible={soundModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Reminder Sound</Text>
              <TouchableOpacity onPress={() => setSoundModalVisible(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {Object.keys(SOUND_MAP).map(name => {
                const selected = tempSoundName === name;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[styles.soundRow, selected && styles.soundRowSelected]}
                    onPress={() => {
                      setTempSoundName(name);
                      EarGuardNative.playSound(SOUND_MAP[name]);
                    }}>
                    <Text style={[styles.soundName, selected && styles.soundNameSelected]}>
                      {name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => EarGuardNative.playSound(SOUND_MAP[name])}>
                      <Text style={styles.play}>▶</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.confirm} onPress={confirmSound}>
              <Text style={sharedStyles.buttonTextLight}>Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  scroll: {flex: 1},
  back: {color: COLORS.primary, fontSize: 16, marginBottom: 8},
  title: {fontSize: 24, fontWeight: '700', color: COLORS.text},
  content: {padding: 20, paddingBottom: 40},
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  switchRow: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  gapFirst: {},
  gap: {marginTop: 16},
  label: {fontSize: 16, color: COLORS.text, flex: 1},
  helper: {color: COLORS.muted, marginTop: 6, lineHeight: 20},
  intervalValue: {fontSize: 20, fontWeight: '700', color: COLORS.text, marginVertical: 8},
  sliderRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8},
  selected: {marginTop: 8, color: '#757575'},
  soundButton: {backgroundColor: COLORS.primary},
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E1E8FF',
  },
  toastText: {color: COLORS.text, textAlign: 'center', fontWeight: '600'},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {fontSize: 20, fontWeight: '700', color: COLORS.text},
  close: {fontSize: 22, color: '#757575'},
  soundRow: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soundRowSelected: {borderColor: COLORS.primary, backgroundColor: '#E3F2FD'},
  soundName: {fontSize: 16, color: COLORS.text},
  soundNameSelected: {color: COLORS.primary, fontWeight: '600'},
  play: {fontSize: 18, color: COLORS.primary},
  confirm: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
