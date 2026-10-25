import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {COLORS, LAYOUT} from '../constants';
import {formatDuration, type WeekDayStat} from '../utils/callAnalytics';

const CHART_HEIGHT = 112;
const MIN_BAR = 6;

type Props = {
  data: WeekDayStat[];
  selectedKey: string | null;
  onSelectDay: (key: string) => void;
};

export function WeekBarChart({data, selectedKey, onSelectDay}: Props) {
  const activeKey = selectedKey ?? data[data.length - 1]?.key ?? null;
  const selected = data.find(item => item.key === activeKey) ?? data[data.length - 1];
  const maxCount = useMemo(() => Math.max(1, ...data.map(item => item.count)), [data]);

  return (
    <View style={styles.wrap}>
      <View style={styles.chartArea}>
        {data.map(item => {
          const active = item.key === activeKey;
          const fillHeight = Math.max(
            MIN_BAR,
            Math.round((item.count / maxCount) * (CHART_HEIGHT - 16)),
          );
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelectDay(item.key)}
              style={({pressed}) => [styles.column, pressed && styles.columnPressed]}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    active ? styles.fillActive : styles.fillMuted,
                    {height: fillHeight},
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.countLabel}>{item.count}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{selected?.label ?? '—'}</Text>
        <Text style={styles.summaryMeta} numberOfLines={1}>
          {selected?.count ?? 0} calls · {formatDuration(selected?.durationSeconds ?? 0)} total
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: CHART_HEIGHT + 44,
    paddingTop: 4,
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
  },
  columnPressed: {
    opacity: 0.88,
  },
  track: {
    width: '100%',
    maxWidth: 40,
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 4,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: 6,
    minHeight: MIN_BAR,
  },
  fillActive: {
    backgroundColor: COLORS.primary,
  },
  fillMuted: {
    backgroundColor: COLORS.chartMuted,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSoft,
    textAlign: 'center',
  },
  dayLabelActive: {
    color: COLORS.text,
    fontWeight: '800',
  },
  countLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  summary: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryMeta: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSoft,
  },
});
