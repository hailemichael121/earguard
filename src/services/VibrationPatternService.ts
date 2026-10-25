/**
 * VibrationPatternService
 * 
 * Provides standardized vibration patterns for the EarGuard app.
 * Triggers tactile cues without interrupting call audio.
 */

import {EarGuardNative} from '../native/earguard';

export type VibrationPattern = 'SHORT' | 'LONG' | 'TRIPLE_SHORT' | 'REMINDER_PATTERN';

/**
 * Vibration durations (in milliseconds)
 */
const VIBRATION_DURATIONS = {
  SHORT: 100,
  LONG: 250,
  REMINDER_PATTERN_PULSE: 80, // Three 80ms pulses for 20-min reminder
};

export class VibrationPatternService {
  /**
   * Play a single vibration pulse
   */
  static async playVibration(pattern: VibrationPattern): Promise<void> {
    try {
      switch (pattern) {
        case 'SHORT':
          await EarGuardNative.vibrate(VIBRATION_DURATIONS.SHORT);
          break;

        case 'LONG':
          await EarGuardNative.vibrate(VIBRATION_DURATIONS.LONG);
          break;

        case 'TRIPLE_SHORT':
          // Three short pulses with small delays
          await EarGuardNative.vibrate(VIBRATION_DURATIONS.REMINDER_PATTERN_PULSE);
          await new Promise(resolve => setTimeout(resolve, 100));
          await EarGuardNative.vibrate(VIBRATION_DURATIONS.REMINDER_PATTERN_PULSE);
          await new Promise(resolve => setTimeout(resolve, 100));
          await EarGuardNative.vibrate(VIBRATION_DURATIONS.REMINDER_PATTERN_PULSE);
          break;

        case 'REMINDER_PATTERN':
          // Extended pattern: long pulse, short pause, three short pulses
          await EarGuardNative.vibrate(VIBRATION_DURATIONS.LONG);
          await new Promise(resolve => setTimeout(resolve, 150));
          await EarGuardNative.vibrate(VIBRATION_DURATIONS.REMINDER_PATTERN_PULSE);
          await new Promise(resolve => setTimeout(resolve, 100));
          await EarGuardNative.vibrate(VIBRATION_DURATIONS.REMINDER_PATTERN_PULSE);
          await new Promise(resolve => setTimeout(resolve, 100));
          await EarGuardNative.vibrate(VIBRATION_DURATIONS.REMINDER_PATTERN_PULSE);
          break;

        default:
          console.warn(`Unknown vibration pattern: ${pattern}`);
      }
    } catch (error) {
      console.error(`Failed to play vibration pattern ${pattern}:`, error);
    }
  }

  /**
   * Get human-readable description of vibration pattern
   */
  static getPatternDescription(pattern: VibrationPattern): string {
    const descriptions: Record<VibrationPattern, string> = {
      SHORT: 'Single short pulse',
      LONG: 'Single long pulse',
      TRIPLE_SHORT: 'Three short pulses',
      REMINDER_PATTERN: 'Long pulse followed by three short pulses',
    };
    return descriptions[pattern] ?? 'Unknown pattern';
  }
}
