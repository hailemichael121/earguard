import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '../constants';
import {MagicBackground} from '../components/MagicBackground';
import {IconBadge, SectionHeader, SurfaceCard} from '../components/Ui';
import {LineIcon} from '../components/LineIcon';
import {EarGuardNative} from '../native/earguard';
import {sharedStyles} from '../styles';
import type {CallHistoryEntry, Insights} from '../types';

type Props = {
  onBack: () => void;
};

export function CallsScreen({onBack}: Props) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [history, setHistory] = useState<CallHistoryEntry[]>([]);

  useEffect(() => {
    Promise.all([EarGuardNative.getInsights(), EarGuardNative.getCallHistory(50)])
      .then(([nextInsights, nextHistory]) => {
        setInsights(nextInsights);
        setHistory(nextHistory);
      })
      .catch(() => {
        setInsights(null);
        setHistory([]);
      });
  }, []);

  const topLongest = useMemo(
    () => [...history].sort((left, right) => right.durationSeconds - left.durationSeconds).slice(0, 3),
    [history],
  );

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <MagicBackground />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <LineIcon name="back" size={16} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Calls</Text>
            <Text style={styles.title}>Call history</Text>
            <Text style={styles.subtitle}>Top durations first, with recent calls below.</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <MiniMetric icon="chart" label="This week" value={`${insights?.weekTotal ?? 0}`} />
          <MiniMetric icon="timer" label="Total calls" value={`${insights?.totalCalls ?? 0}`} />
          <MiniMetric icon="spark" label="Streak" value={`${insights?.currentStreak ?? 0}d`} />
        </View>

        <SurfaceCard>
          <SectionHeader
            eyebrow="Longest"
            title="Top 3 longest calls"
            description="A compact view of the longest recent calls."
          />
          <View style={styles.list}>
            {topLongest.length > 0 ? (
              topLongest.map(item => (
                <View key={item.id} style={styles.longestRow}>
                  <IconBadge name="phone" tone="primary" size={28} />
                  <View style={styles.longestCopy}>
                    <Text style={styles.longestName}>{item.name}</Text>
                    <Text style={styles.longestMeta}>
                      {formatDuration(item.durationSeconds)} · {formatCallDate(item.date)}
                    </Text>
                  </View>
                  <Text style={styles.longestValue}>{formatDuration(item.durationSeconds)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyState}>No call history available yet.</Text>
            )}
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader eyebrow="Recent" title="Recent calls" description="Chronological call list with duration and type." />
          <View style={styles.recentList}>
            {history.length > 0 ? (
              history.map(item => (
                <View key={item.id} style={styles.recentRow}>
                  <View style={styles.recentHead}>
                    <View style={styles.recentNameWrap}>
                      <Text style={styles.recentName}>{item.name}</Text>
                      <Text style={styles.recentNumber}>{item.number}</Text>
                    </View>
                    <Text style={styles.recentType}>{item.type}</Text>
                  </View>
                  <View style={styles.recentMetaRow}>
                    <Text style={styles.recentMeta}>{formatCallDate(item.date)}</Text>
                    <Text style={styles.recentMeta}>{formatDuration(item.durationSeconds)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyState}>No call entries yet.</Text>
            )}
          </View>
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniMetric({icon, label, value}: {icon: 'chart' | 'timer' | 'spark'; label: string; value: string}) {
  return (
    <View style={styles.metricCard}>
      <IconBadge name={icon} tone="muted" size={28} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));
  const seconds = Math.max(0, totalSeconds % 60);
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function formatCallDate(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
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
    borderStyle: 'dashed',
    borderColor: COLORS.border,
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
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(255,253,248,0.92)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  metricValue: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    marginTop: 3,
    color: COLORS.textSoft,
    fontSize: 12,
  },
  list: {
    gap: 10,
  },
  longestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: 'rgba(243,238,228,0.72)',
  },
  longestCopy: {
    flex: 1,
  },
  longestName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  longestMeta: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 12,
  },
  longestValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },
  recentList: {
    gap: 10,
  },
  recentRow: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,253,248,0.92)',
  },
  recentHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  recentNameWrap: {
    flex: 1,
  },
  recentName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  recentNumber: {
    marginTop: 3,
    color: COLORS.textSoft,
    fontSize: 12,
  },
  recentType: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  recentMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  recentMeta: {
    color: COLORS.textSoft,
    fontSize: 12,
  },
  emptyState: {
    color: COLORS.textSoft,
    fontSize: 13,
  },
});
