import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '../constants';
import {BUILD_INFO} from '../buildInfo';
import {MagicBackground} from '../components/MagicBackground';
import {AppMark, IconBadge, MetricTile, SectionHeader, SurfaceCard} from '../components/Ui';
import {LineIcon} from '../components/LineIcon';
import {EarGuardNative, soundLabelForFile} from '../native/earguard';
import {sharedStyles} from '../styles';
import type {Insights} from '../types';

type Props = {
  interval: number;
  selectedSound: string;
  onBack: () => void;
};

export function AboutScreen({interval, selectedSound, onBack}: Props) {
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    EarGuardNative.getInsights()
      .then(setInsights)
      .catch(() => setInsights(null));
  }, []);

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <MagicBackground />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <LineIcon name="back" size={16} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>About</Text>
            <Text style={styles.title}>EarGuard</Text>
            <Text style={styles.subtitle}>
              Built to keep call reminders helpful, minimal, and easy to understand.
            </Text>
          </View>
        </View>

        <SurfaceCard>
          <View style={styles.brandRow}>
            <AppMark source={require('../../assets/icons/app-icon.png')} size={64} />
            <View style={styles.brandCopy}>
              <Text style={styles.brandTitle}>Healthy call habits</Text>
              <Text style={styles.brandText}>
                EarGuard reminds users to switch ears during long calls, then steps back out of the way.
              </Text>
            </View>
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            eyebrow="How it works"
            title="Clean, call-first guidance"
            description="The home screen shows only the live state, while deeper context lives here."
          />
          <View style={styles.howItWorks}>
            <View style={styles.howRow}>
              <IconBadge name="phone" tone="primary" size={32} />
              <View style={styles.howCopy}>
                <Text style={styles.howTitle}>Monitor only when needed</Text>
                <Text style={styles.howText}>
                  Call state is tracked in the background, and reminders appear only when a call is active.
                </Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <IconBadge name="bell" tone="accent" size={32} />
              <View style={styles.howCopy}>
                <Text style={styles.howTitle}>Keep alerts minimal</Text>
                <Text style={styles.howText}>
                  Sound and overlays stay lightweight so the app does not feel busy or noisy.
                </Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <IconBadge name="moon" tone="warning" size={32} />
              <View style={styles.howCopy}>
                <Text style={styles.howTitle}>Respect quiet hours</Text>
                <Text style={styles.howText}>
                  When quiet hours are on, reminders soften instead of fighting the user’s environment.
                </Text>
              </View>
            </View>
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            eyebrow="Navigation"
            title="Where each screen lives"
            description="Home stays minimal. Supporting details move into focused screens."
          />
          <View style={styles.screenMap}>
            <View style={styles.screenMapRow}>
              <IconBadge name="phone" tone="primary" size={30} />
              <View style={styles.screenMapCopy}>
                <Text style={styles.screenMapTitle}>Home</Text>
                <Text style={styles.screenMapText}>
                  Live monitoring, quick actions, and the active call state.
                </Text>
              </View>
            </View>
            <View style={styles.screenMapRow}>
              <IconBadge name="settings" tone="muted" size={30} />
              <View style={styles.screenMapCopy}>
                <Text style={styles.screenMapTitle}>Settings</Text>
                <Text style={styles.screenMapText}>
                  Reminder interval, sound selection, quiet hours, and alert behavior.
                </Text>
              </View>
            </View>
            <View style={styles.screenMapRow}>
              <IconBadge name="info" tone="accent" size={30} />
              <View style={styles.screenMapCopy}>
                <Text style={styles.screenMapTitle}>About</Text>
                <Text style={styles.screenMapText}>
                  App purpose, behavior, usage summary, and current build details.
                </Text>
              </View>
            </View>
          </View>
        </SurfaceCard>

        <View style={styles.metricRow}>
          <MetricTile icon="timer" tone="primary" label="Reminder interval" value={`${Math.round(interval)} min`} />
          <MetricTile icon="sound" tone="accent" label="Selected sound" value={soundLabelForFile(selectedSound)} />
        </View>

        <SurfaceCard>
          <SectionHeader
            eyebrow="Current setup"
            title="Active configuration"
            description="These are the settings currently driving the reminder behavior."
          />
          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <IconBadge name="timer" tone="primary" size={30} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailTitle}>Interval</Text>
                <Text style={styles.detailText}>{Math.round(interval)} minutes</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <IconBadge name="sound" tone="accent" size={30} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailTitle}>Sound</Text>
                <Text style={styles.detailText}>{soundLabelForFile(selectedSound)}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <IconBadge name="check" tone="success" size={30} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailTitle}>Build</Text>
                <Text style={styles.detailText}>
                  {BUILD_INFO.version} · {BUILD_INFO.buildLabel}
                </Text>
              </View>
            </View>
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            eyebrow="Usage"
            title="Snapshot"
            description="A quick view of the app’s recent usage and streak information."
          />
          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>{insights?.totalCalls ?? 0}</Text>
              <Text style={styles.snapshotLabel}>Total calls tracked</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>{insights?.currentStreak ?? 0}</Text>
              <Text style={styles.snapshotLabel}>Current streak</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>{insights?.weekTotal ?? 0}</Text>
              <Text style={styles.snapshotLabel}>This week</Text>
            </View>
          </View>
          <View style={styles.flagsRow}>
            <View style={styles.flag}>
              <Text style={styles.flagLabel}>10-call goal</Text>
              <Text style={styles.flagValue}>{insights?.firstTenUnlocked ? 'Unlocked' : 'Locked'}</Text>
            </View>
            <View style={styles.flag}>
              <Text style={styles.flagLabel}>7-day streak</Text>
              <Text style={styles.flagValue}>{insights?.sevenDayUnlocked ? 'Unlocked' : 'Locked'}</Text>
            </View>
          </View>
        </SurfaceCard>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,253,248,0.82)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
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
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  brandCopy: {
    flex: 1,
  },
  brandTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  brandText: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  howItWorks: {
    gap: 14,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  howCopy: {
    flex: 1,
  },
  howTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  howText: {
    marginTop: 4,
    color: COLORS.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  screenMap: {
    gap: 12,
  },
  screenMapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  screenMapCopy: {
    flex: 1,
  },
  screenMapTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  screenMapText: {
    marginTop: 3,
    color: COLORS.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(243,238,228,0.72)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  detailCopy: {
    flex: 1,
  },
  detailTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  detailText: {
    marginTop: 3,
    color: COLORS.textSoft,
    fontSize: 13,
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  snapshotItem: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(243,238,228,0.72)',
  },
  snapshotValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  snapshotLabel: {
    marginTop: 4,
    color: COLORS.textSoft,
    fontSize: 12,
    lineHeight: 16,
  },
  flagsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  flag: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,253,248,0.88)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  flagLabel: {
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  flagValue: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
