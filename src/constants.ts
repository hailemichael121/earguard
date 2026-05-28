export const SOUND_MAP: Record<string, string> = {
  'Classic Chime': 'reminder3.mp3',
  'Soft Beep': 'reminder3.mp3',
  Tone: 'reminder1.mp3',
  'Tone 2': 'reminder2.mp3',
  'Access Tone': 'reminder5.mp3',
  'Funny Tone': 'reminder6.mp3',
};

export const COLORS = {
  primary: '#2979FF',
  background: '#F4F7FF',
  backgroundDeep: '#EAF0FF',
  text: '#212121',
  error: '#FF5252',
  white: '#FFFFFF',
  success: '#2BB673',
  accent: '#7D4DFF',
  muted: '#6B7280',
  shadowDark: '#BDBDBD',
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
