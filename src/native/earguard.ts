import {NativeModules, Platform} from 'react-native';
import {SOUND_MAP} from '../constants';
import type {AppPreferences, CallHistoryEntry, Insights} from '../types';

type EarGuardNativeModule = {
  getPreferences: () => Promise<AppPreferences>;
  savePreferences: (prefs: Partial<AppPreferences>) => Promise<boolean>;
  getInsights: () => Promise<Insights>;
  getCallHistory: (limit: number) => Promise<CallHistoryEntry[]>;
  recordCallCompleted: () => Promise<boolean>;
  getOnboardingCompleted: () => Promise<boolean>;
  setOnboardingCompleted: (completed: boolean) => Promise<boolean>;
  getCallerInfo: () => Promise<string>;
  isMIUI: () => Promise<boolean>;
  getCallState: () => Promise<'IDLE' | 'RINGING' | 'OFFHOOK'>;
  checkOverlayPermission: () => Promise<boolean>;
  requestOverlayPermission: () => Promise<void>;
  showOverlay: (callerInfo: string) => Promise<void>;
  showCallOverlay: (options: {
    title: string;
    body: string;
    subtext?: string;
    dismissable?: boolean;
    autoHideMs?: number;
  }) => Promise<void>;
  hideOverlay: () => Promise<void>;
  startForegroundService: (
    phoneState: string,
    callerInfo: string,
    interval: number,
    useSound: boolean,
    sound: string,
  ) => Promise<void>;
  stopForegroundService: () => Promise<void>;
  requestIgnoreBatteryOptimizations: () => Promise<boolean | void>;
  isIgnoringBatteryOptimizations: () => Promise<boolean>;
  vibrate: (durationMs: number) => Promise<void>;
  playSound: (soundFile: string) => Promise<void>;
  stopSound: () => Promise<void>;
};

const LINKING_ERROR =
  "EarGuard native module is not linked. Run the Android app with `npm run android`.";

const EarGuard: EarGuardNativeModule =
  Platform.OS === 'android'
    ? (NativeModules.EarGuard as EarGuardNativeModule)
    : (new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR);
          },
        },
      ) as EarGuardNativeModule);

export const EarGuardNative = EarGuard;

export function soundLabelForFile(fileName: string): string {
  const entry = Object.entries(SOUND_MAP).find(([, value]) => value === fileName);
  return entry?.[0] ?? 'Custom';
}
