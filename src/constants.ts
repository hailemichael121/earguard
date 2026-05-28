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
  background: '#F5F1E8',
  backgroundDeep: '#E8E1D2',
  surface: '#FFFDF8',
  surfaceMuted: '#F3EEE4',
  text: '#1E1E1E',
  textSoft: '#53504B',
  error: '#6B5A57',
  errorSoft: '#F1E3DF',
  success: '#3F4A3E',
  successSoft: '#E7ECE2',
  muted: '#77716A',
  border: '#CFC7B8',
  shadowDark: '#7E766B',
  white: '#FFFDF8',
};

export const DEFAULT_PREFS = {
  interval: 30,
  enabled: true,
  useSound: false,
  sound: 'reminder3.mp3',
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '07:00',
  smartIntensity: true,
};
