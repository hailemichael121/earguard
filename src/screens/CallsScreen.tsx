import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS, LAYOUT} from '../constants';
import {MagicBackground} from '../components/MagicBackground';
import {IconBadge, SectionHeader, SurfaceCard} from '../components/Ui';
import {AssetIcon} from '../components/AssetIcon';
import {WeekBarChart} from '../components/WeekBarChart';
import {EarGuardNative} from '../native/earguard';
import {sharedStyles} from '../styles';
import {
  buildWeekStats,
  dayKeyFromTimestamp,
  formatCallDate,
  formatDuration,
} from '../utils/callAnalytics';
import type {CallHistoryEntry, Insights} from '../types';

type Props = {
  onBack: () => void;
};

export function CallsScreen({onBack}: Props) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [history, setHistory] = useState<CallHistoryEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

  const weekStats = useMemo(() => buildWeekStats(history), [history]);

  const selectedStats = useMemo(() => {
    const activeKey = selectedDay ?? weekStats[weekStats.length - 1]?.key ?? null;
    return weekStats.find(item => item.key === activeKey) ?? weekStats[weekStats.length - 1];
  }, [selectedDay, weekStats]);

  const selectedDayCalls = useMemo(
    () => history.filter(entry => dayKeyFromTimestamp(entry.date) === selectedStats?.key),
    [history, selectedStats?.key],
  );

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <MagicBackground />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <AssetIcon name="back" size={18} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Calls</Text>
            <Text style={styles.title}>Call history</Text>
            <Text style={styles.subtitle}>Duration trends and recent activity.</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <MiniMetric icon="chart" label="This week" value={`${insights?.weekTotal ?? 0}`} />
          <MiniMetric icon="timer" label="Total calls" value={`${insights?.totalCalls ?? 0}`} />
          <MiniMetric icon="spark" label="Streak" value={`${insights?.currentStreak ?? 0}d`} />
        </View>

        <SurfaceCard variant="bordered">
          <SectionHeader
            eyebrow="Week"
            title="Calls per day"
            description="Tap a bar to inspect that day's calls."
            action={<IconBadge name="chart" tone="primary" size={32} />}
          />
          <WeekBarChart data={weekStats} selectedKey={selectedDay} onSelectDay={setSelectedDay} />

          {selectedDayCalls.length > 0 ? (
            <View style={styles.dayCalls}>
              {selectedDayCalls.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.dayCallRow, index === selectedDayCalls.length - 1 && styles.dayCallRowLast]}>
                  <View style={styles.dayCallCopy}>
                    <Text style={styles.dayCallName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.dayCallMeta}>{formatDuration(item.durationSeconds)}</Text>
                  </View>
                  <Text style={styles.dayCallDate}>{formatCallDate(item.date)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyInline}>No calls recorded for this day.</Text>
          )}
        </SurfaceCard>

        <SurfaceCard variant="bordered">
          <SectionHeader eyebrow="Longest" title="Top 3 longest calls" />
          <View style={styles.list}>
            {topLongest.length > 0 ? (
              topLongest.map((item, index) => (
                <View key={item.id} style={[styles.longestRow, index === topLongest.length - 1 && styles.rowLast]}>
                  <IconBadge name="phone" tone="primary" size={32} />
                  <View style={styles.longestCopy}>
                    <Text style={styles.longestName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.longestMeta}>
                      {formatDuration(item.durationSeconds)} · {formatCallDate(item.date)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyState}>No call history available yet.</Text>
            )}
          </View>
        </SurfaceCard>

        <SurfaceCard variant="flat">
          <SectionHeader eyebrow="Recent" title="All recent calls" />
          <View style={styles.recentList}>
            {history.length > 0 ? (
              history.map((item, index) => (
                <View key={item.id} style={[styles.recentRow, index === history.length - 1 && styles.rowLast]}>
                  <View style={styles.recentHead}>
                    <View style={styles.recentNameWrap}>
                      <Text style={styles.recentName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.recentNumber} numberOfLines={1}>
                        {item.number}
                      </Text>
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

const styles = StyleSheet.create({
  page: {
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...LAYOUT.shadow,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: LAYOUT.radiusSm,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...LAYOUT.shadow,
  },
  metricValue: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 11,
    fontWeight: '600',
  },
  dayCalls: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
    gap: 0,
  },
  dayCallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dayCallRowLast: {
    borderBottomWidth: 0,
  },
  dayCallCopy: {
    flex: 1,
    minWidth: 0,
  },
  dayCallName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  dayCallMeta: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 12,
  },
  dayCallDate: {
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyInline: {
    marginTop: 12,
    color: COLORS.textSoft,
    fontSize: 13,
  },
  list: {
    gap: 0,
  },
  longestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  longestCopy: {
    flex: 1,
    minWidth: 0,
  },
  longestName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  longestMeta: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 12,
  },
  recentList: {
    gap: 0,
  },
  recentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  recentHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  recentNameWrap: {
    flex: 1,
    minWidth: 0,
  },
  recentName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  recentNumber: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 12,
  },
  recentType: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  recentMetaRow: {
    marginTop: 8,
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
