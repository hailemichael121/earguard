/**
 * Global call session: CallStateManager + recursive CallTimerService.
 * Renders overlay cards from App; keeps FG service alive during calls.
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {Platform} from 'react-native';
import {DEFAULT_PREFS} from '../constants';
import {EarGuardNative} from '../native/earguard';
import {CallStateManager} from '../services/CallStateManager';
import {CallTimerService} from '../services/CallTimerService';
import {VibrationPatternService} from '../services/VibrationPatternService';
import type {AppPreferences, CallState} from '../types';

export type EarGuardCallSession = {
  isInCall: boolean;
  callPhase: CallState;
  callerName: string;
  callerNumber: string;
  intervalMinutes: number;
  statusMessage: string;
  showCallerCard: boolean;
  showPostCallSummary: boolean;
  postCallCallerName: string;
  postCallDurationSeconds: number;
  postCallEarSwitchCount: number;
  dismissPostCallSummary: () => void;
};

type Options = {
  enabled: boolean;
  refreshToken: number;
};

function isWithinQuietHours(prefs: AppPreferences): boolean {
  if (!prefs.quietHoursEnabled) {
    return false;
  }
  const now = new Date();
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(prefs.quietStart);
  const end = toMinutes(prefs.quietEnd);
  return start <= end
    ? nowMinutes >= start && nowMinutes < end
    : nowMinutes >= start || nowMinutes < end;
}

export function useEarGuardCallSession({enabled, refreshToken}: Options): EarGuardCallSession {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFS);
  const [callPhase, setCallPhase] = useState<CallState>('IDLE');
  const [isInCall, setIsInCall] = useState(false);
  const [callerName, setCallerName] = useState('Unknown Caller');
  const [callerNumber, setCallerNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ready. Waiting for calls.');
  const [showCallerCard, setShowCallerCard] = useState(false);
  const [showPostCallSummary, setShowPostCallSummary] = useState(false);
  const [postCallCallerName, setPostCallCallerName] = useState('Unknown Caller');
  const [postCallDurationSeconds, setPostCallDurationSeconds] = useState(0);
  const [postCallEarSwitchCount, setPostCallEarSwitchCount] = useState(0);

  const prefsRef = useRef(prefs);
  const stateManagerRef = useRef<CallStateManager | null>(null);
  const timerRef = useRef<CallTimerService | null>(null);
  const summaryCallerRef = useRef('Unknown Caller');

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) {
      return;
    }
    EarGuardNative.getPreferences()
      .then(loaded => {
        setPrefs(loaded);
        prefsRef.current = loaded;
      })
      .catch(() => undefined);
  }, [enabled, refreshToken]);

  const dismissPostCallSummary = useCallback(() => {
    setShowPostCallSummary(false);
  }, []);

  const stopTimer = useCallback(() => {
    timerRef.current?.stop();
    timerRef.current = null;
  }, []);

  const ensureTimer = useCallback((intervalMinutes: number) => {
    const intervalSeconds = Math.max(1, Math.round(intervalMinutes * 60));
    if (!timerRef.current) {
      timerRef.current = new CallTimerService(intervalSeconds);
      timerRef.current.onInterval(async () => {
        const currentPrefs = prefsRef.current;
        if (!currentPrefs.enabled) {
          return;
        }
        const quiet = isWithinQuietHours(currentPrefs);
        if (!quiet) {
          await VibrationPatternService.playVibration('REMINDER_PATTERN');
          if (currentPrefs.useSound) {
            EarGuardNative.playSound(currentPrefs.sound).catch(() => undefined);
          }
        }
      });
    } else {
      timerRef.current.setInterval(intervalSeconds);
    }
    timerRef.current.start();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) {
      return undefined;
    }

    const manager = new CallStateManager();
    stateManagerRef.current = manager;

    const unsubState = manager.onStateChange((state, name) => {
      setCallPhase(state);
      if (state === 'RINGING') {
        const displayName = name || manager.getCurrentCallerName() || 'Unknown Caller';
        setCallerName(displayName);
        setCallerNumber(manager.getCurrentCallerNumber());
        summaryCallerRef.current = displayName;
        setShowCallerCard(true);
        setStatusMessage(`Incoming call from ${displayName}.`);
      }
    });

    const unsubStart = manager.onCallStart(async (name, number) => {
      const currentPrefs = prefsRef.current;
      setCallerName(name || 'Unknown Caller');
      setCallerNumber(number);
      summaryCallerRef.current = name || 'Unknown Caller';
      setIsInCall(true);
      setShowCallerCard(true);
      setShowPostCallSummary(false);
      setStatusMessage('Call connected. EarGuard is protecting your ears.');

      try {
        await EarGuardNative.startForegroundService(
          'OFFHOOK',
          number || name,
          currentPrefs.interval,
          currentPrefs.useSound,
          currentPrefs.sound,
        );
      } catch {
        // FG service may already be running from PhoneStateReceiver
      }

      if (currentPrefs.enabled) {
        ensureTimer(currentPrefs.interval);
      }
    });

    const unsubEnd = manager.onCallEnd(async durationSeconds => {
      const earSwitches = timerRef.current?.getIntervalCount() ?? 0;
      stopTimer();
      setIsInCall(false);
      setShowCallerCard(false);
      setPostCallCallerName(summaryCallerRef.current);
      setPostCallDurationSeconds(durationSeconds);
      setPostCallEarSwitchCount(earSwitches);
      setShowPostCallSummary(true);
      setStatusMessage('Call ended. Monitoring is still on.');
      setCallPhase('IDLE');

      try {
        await EarGuardNative.stopForegroundService();
        await EarGuardNative.recordCallCompleted();
      } catch {
        // ignore
      }
    });

    manager.startMonitoring();

    return () => {
      unsubState();
      unsubStart();
      unsubEnd();
      manager.stopMonitoring();
      stopTimer();
      stateManagerRef.current = null;
      EarGuardNative.stopForegroundService().catch(() => undefined);
    };
  }, [enabled, ensureTimer, stopTimer]);

  return {
    isInCall,
    callPhase,
    callerName,
    callerNumber,
    intervalMinutes: Math.round(prefs.interval),
    statusMessage,
    showCallerCard,
    showPostCallSummary,
    postCallCallerName,
    postCallDurationSeconds,
    postCallEarSwitchCount,
    dismissPostCallSummary,
  };
}
