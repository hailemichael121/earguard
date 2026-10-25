/**
 * CallTimerService
 *
 * Manages the recursive call timer that:
 * 1. Tracks active call duration
 * 2. Triggers vibration patterns at specified intervals (e.g., every 20 minutes)
 * 3. Automatically resets and continues counting for subsequent intervals
 * 4. Cleans up completely when the call ends
 */

import {VibrationPatternService} from './VibrationPatternService';

export type TimerTickListener = (elapsedSeconds: number, intervalNumber: number) => void;
export type TimerIntervalListener = () => void;

export class CallTimerService {
  private intervalMs: number = 20 * 60 * 1000; // 20 minutes default
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private startTimeMs: number = 0;
  private elapsedSeconds: number = 0;
  private intervalCount: number = 0;
  private nextTriggerMs: number = 0;
  private isRunning: boolean = false;

  private tickListeners: Set<TimerTickListener> = new Set();
  private intervalListeners: Set<TimerIntervalListener> = new Set();

  constructor(intervalSeconds: number = 20 * 60) {
    this.intervalMs = intervalSeconds * 1000;
    this.nextTriggerMs = this.intervalMs;
  }

  /**
   * Start the call timer
   */
  start(): void {
    if (this.isRunning) {
      console.warn('CallTimerService: Timer already running');
      return;
    }

    this.isRunning = true;
    this.startTimeMs = Date.now();
    this.elapsedSeconds = 0;
    this.intervalCount = 0;
    this.nextTriggerMs = this.intervalMs;

    // Update every 500ms to be responsive
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 500);
  }

  /**
   * Stop the call timer and clean up
   */
  stop(): void {
    if (this.tickInterval !== null) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.isRunning = false;
    this.elapsedSeconds = 0;
    this.intervalCount = 0;
    this.startTimeMs = 0;
    this.nextTriggerMs = this.intervalMs;
  }

  /**
   * Internal tick handler
   */
  private tick(): void {
    if (!this.isRunning) {
      return;
    }

    const currentTimeMs = Date.now();
    this.elapsedSeconds = Math.floor((currentTimeMs - this.startTimeMs) / 1000);
    const currentElapsedMs = currentTimeMs - this.startTimeMs;

    // Notify tick listeners
    this.tickListeners.forEach(listener => {
      listener(this.elapsedSeconds, this.intervalCount + 1);
    });

    // Check if we've hit the next interval trigger
    if (currentElapsedMs >= this.nextTriggerMs) {
      this.triggerInterval();
    }
  }

  /**
   * Trigger interval callback and advance to next interval
   */
  private triggerInterval(): void {
    this.intervalCount++;

    // Notify interval listeners
    this.intervalListeners.forEach(listener => {
      listener();
    });

    // Play vibration pattern
    VibrationPatternService.playVibration('REMINDER_PATTERN').catch(err => {
      console.error('Failed to play vibration:', err);
    });

    // Advance to next interval
    this.nextTriggerMs += this.intervalMs;
  }

  /**
   * Subscribe to timer tick events (fires ~every 500ms)
   */
  onTick(listener: TimerTickListener): () => void {
    this.tickListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.tickListeners.delete(listener);
    };
  }

  /**
   * Subscribe to interval trigger events (fires when interval is reached)
   */
  onInterval(listener: TimerIntervalListener): () => void {
    this.intervalListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.intervalListeners.delete(listener);
    };
  }

  /**
   * Get current elapsed time in seconds
   */
  getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  /**
   * Get how many intervals have been completed
   */
  getIntervalCount(): number {
    return this.intervalCount;
  }

  /**
   * Get time remaining until next interval (in seconds)
   */
  getSecondsUntilNextInterval(): number {
    const currentMs = Date.now() - this.startTimeMs;
    const msUntilNext = Math.max(0, this.nextTriggerMs - currentMs);
    return Math.ceil(msUntilNext / 1000);
  }

  /**
   * Check if timer is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Update the interval duration (in seconds)
   */
  setInterval(intervalSeconds: number): void {
    const newIntervalMs = intervalSeconds * 1000;

    if (this.isRunning) {
      // Calculate how much to adjust next trigger
      const currentMs = Date.now() - this.startTimeMs;
      const intervalsPassed = Math.floor(currentMs / this.intervalMs);
      this.intervalMs = newIntervalMs;
      this.nextTriggerMs = (intervalsPassed + 1) * newIntervalMs;
    } else {
      this.intervalMs = newIntervalMs;
      this.nextTriggerMs = newIntervalMs;
    }
  }

  /**
   * Format elapsed time as HH:MM:SS
   */
  formatElapsedTime(): string {
    const hours = Math.floor(this.elapsedSeconds / 3600);
    const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
    const seconds = this.elapsedSeconds % 60;

    return [hours, minutes, seconds]
      .map(val => String(val).padStart(2, '0'))
      .join(':');
  }

  /**
   * Format time until next interval as MM:SS
   */
  formatTimeUntilNextInterval(): string {
    const seconds = this.getSecondsUntilNextInterval();
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return [minutes, secs]
      .map(val => String(val).padStart(2, '0'))
      .join(':');
  }
}
