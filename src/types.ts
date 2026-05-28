export type AppPreferences = {
  interval: number;
  enabled: boolean;
  useSound: boolean;
  sound: string;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  smartIntensity: boolean;
};

export type DebugLog = {
  message: string;
  category: 'Info' | 'Warning' | 'Error';
  timestamp: Date;
};

export type CallState = 'IDLE' | 'RINGING' | 'OFFHOOK';

export type Insights = {
  totalCalls: number;
  currentStreak: number;
  weekTotal: number;
  dailyPoints: number;
  firstTenUnlocked: boolean;
  sevenDayUnlocked: boolean;
  weekSeries: Array<{date: string; count: number}>;
};

export type CallHistoryEntry = {
  id: string;
  name: string;
  number: string;
  durationSeconds: number;
  date: string;
  type: 'INCOMING' | 'OUTGOING' | 'MISSED' | 'REJECTED' | 'VOICEMAIL' | 'BLOCKED' | 'UNKNOWN';
};

export type BuildInfo = {
  version: string;
  buildNumber: number;
  buildLabel: string;
  builtAt: string;
};
