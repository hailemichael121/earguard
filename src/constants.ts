export const SOUND_MAP: Record<string, string> = {
  'Classic Chime': 'reminder3.mp3',
  'Soft Beep': 'reminder3.mp3',
  Tone: 'reminder1.mp3',
  'Tone 2': 'reminder2.mp3',
  'Access Tone': 'reminder5.mp3',
  'Funny Tone': 'reminder6.mp3',
};

export const COLORS = {
  primary: '#22252D',
  primarySoft: '#E8E4D9',
  accent: '#5A5E67',
  accentSoft: '#F0ECE3',
  warm: '#7A6750',
  warmSoft: '#EFE6D8',
  background: '#F4F2ED',
  backgroundDeep: '#E8E4DC',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F5F1',
  text: '#1E1E1E',
  textSoft: '#5C5852',
  error: '#6B5A57',
  errorSoft: '#F1E3DF',
  success: '#3F4A3E',
  successSoft: '#E7ECE2',
  muted: '#77716A',
  border: '#D8D3CA',
  borderLight: '#E8E4DC',
  chartMuted: '#B8B4AC',
  shadowDark: '#7E766B',
  white: '#FFFFFF',
};

/** Shared layout tokens for cards and controls */
export const LAYOUT = {
  radius: 16,
  radiusSm: 12,
  radiusLg: 20,
  cardPadding: 18,
  shadow: {
    shadowColor: COLORS.shadowDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const DEFAULT_PREFS = {
  interval: 20,
  enabled: true,
  useSound: false,
  sound: 'reminder3.mp3',
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '07:00',
  smartIntensity: true,
};
