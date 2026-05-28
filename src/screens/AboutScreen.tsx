import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {COLORS} from '../constants';
import {BUILD_INFO} from '../buildInfo';
import {MagicBackground} from '../components/MagicBackground';
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
    <View style={sharedStyles.screen}>
      <MagicBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About EarGuard</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={sharedStyles.card}>
          <Text style={styles.sectionTitle}>About EarGuard</Text>
          <Text style={styles.body}>
            EarGuard helps you maintain healthy phone usage by reminding you to switch
            ears during calls to reduce strain. Stay safe and comfortable with our
            intuitive reminders.
          </Text>
          <Text style={[styles.sectionTitle, styles.spacing]}>Current Settings</Text>
          <Text style={styles.body}>Interval: {Math.round(interval)} minutes</Text>
          <Text style={styles.body}>
            Sound: {soundLabelForFile(selectedSound)}
          </Text>
          <Text style={[styles.sectionTitle, styles.spacing]}>Build Information</Text>
          <Text style={styles.body}>Version: {BUILD_INFO.version}</Text>
          <Text style={styles.body}>Build: {BUILD_INFO.buildNumber}</Text>
          <Text style={styles.body}>Label: {BUILD_INFO.buildLabel}</Text>
          <Text style={[styles.sectionTitle, styles.spacing]}>Usage Snapshot</Text>
          <Text style={styles.body}>Total calls tracked: {insights?.totalCalls ?? 0}</Text>
          <Text style={styles.body}>Current streak: {insights?.currentStreak ?? 0} days</Text>
          <Text style={styles.body}>This week: {insights?.weekTotal ?? 0} calls</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  back: {
    color: COLORS.primary,
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  spacing: {
    marginTop: 16,
  },
});
