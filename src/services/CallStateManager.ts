/**
 * CallStateManager
 *
 * Manages phone call state changes and provides a unified interface for:
 * - Listening to incoming call events
 * - Detecting call start (OFFHOOK)
 * - Detecting call end
 * - Getting caller information
 */

import {EarGuardNative} from '../native/earguard';
import type {CallState} from '../types';

export type CallStateChangeListener = (state: CallState, callerName?: string) => void;
export type CallStartListener = (callerName: string, callerNumber: string) => void;
export type CallEndListener = (durationSeconds: number) => void;

export class CallStateManager {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private previousState: CallState = 'IDLE';
  private callStartTime: number = 0;
  private currentCallerName: string = '';
  private currentCallerNumber: string = '';
  private isMonitoring: boolean = false;

  private stateChangeListeners: Set<CallStateChangeListener> = new Set();
  private callStartListeners: Set<CallStartListener> = new Set();
  private callEndListeners: Set<CallEndListener> = new Set();

  /**
   * Start monitoring call state changes
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('CallStateManager: Already monitoring');
      return;
    }

    this.isMonitoring = true;
    this.previousState = 'IDLE';

    // Poll call state every 1 second
    this.pollingInterval = setInterval(async () => {
      try {
        const currentState = await EarGuardNative.getCallState();

        if (currentState !== this.previousState) {
          await this.handleStateChange(currentState);
        }
      } catch (error) {
        console.error('Failed to get call state:', error);
      }
    }, 1000);
  }

  /**
   * Stop monitoring call state changes
   */
  stopMonitoring(): void {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.isMonitoring = false;
    this.previousState = 'IDLE';
    this.callStartTime = 0;
    this.currentCallerName = '';
    this.currentCallerNumber = '';
  }

  /**
   * Handle state transition
   */
  private async handleStateChange(newState: CallState): Promise<void> {
    const previousState = this.previousState;
    this.previousState = newState;

    console.log(`CallStateManager: State transition ${previousState} -> ${newState}`);

    if (newState === 'RINGING') {
      await this.handleIncomingCall();
    }

    if (newState === 'OFFHOOK' && (previousState === 'RINGING' || previousState === 'IDLE')) {
      // Outgoing calls skip RINGING — fetch caller once when connecting from IDLE.
      if (previousState === 'IDLE') {
        await this.handleIncomingCall();
      }
      this.handleCallStart();
    }

    if (newState === 'IDLE' && (previousState === 'OFFHOOK' || previousState === 'RINGING')) {
      this.handleCallEnd();
    }

    this.stateChangeListeners.forEach(listener => {
      listener(newState, this.currentCallerName);
    });
  }

  /**
   * Handle incoming call state
   */
  private async handleIncomingCall(): Promise<void> {
    try {
      // Get caller info from native module
      const callerInfo = await EarGuardNative.getCallerInfo();
      // Parse caller info (format might vary by platform)
      const [name, number] = this.parseCallerInfo(callerInfo);

      this.currentCallerName = name;
      this.currentCallerNumber = number;

      console.log(`Incoming call from ${name} (${number})`);
    } catch (error) {
      console.warn('Failed to get caller info:', error);
      this.currentCallerName = 'Unknown';
      this.currentCallerNumber = '';
    }
  }

  /**
   * Handle call start
   */
  private handleCallStart(): void {
    this.callStartTime = Date.now();
    console.log(`Call started with ${this.currentCallerName}`);

    this.callStartListeners.forEach(listener => {
      listener(this.currentCallerName, this.currentCallerNumber);
    });
  }

  /**
   * Handle call end
   */
  private handleCallEnd(): void {
    const durationSeconds = Math.floor((Date.now() - this.callStartTime) / 1000);
    console.log(`Call ended. Duration: ${durationSeconds}s`);

    this.callEndListeners.forEach(listener => {
      listener(durationSeconds);
    });

    this.callStartTime = 0;
    this.currentCallerName = '';
    this.currentCallerNumber = '';
  }

  /**
   * Parse caller info from native response
   * Expected format: "Name|Number" or "Number" or "Unknown"
   */
  private parseCallerInfo(info: string): [string, string] {
    if (!info || info === 'Unknown') {
      return ['Unknown Caller', ''];
    }

    const parts = info.split('|');
    if (parts.length === 2) {
      return [parts[0], parts[1]];
    }

    // Check if it looks like a phone number (contains digits)
    if (/\d/.test(info)) {
      return ['Unknown', info];
    }

    return [info, ''];
  }

  /**
   * Subscribe to call state changes
   */
  onStateChange(listener: CallStateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  /**
   * Subscribe to call start events
   */
  onCallStart(listener: CallStartListener): () => void {
    this.callStartListeners.add(listener);
    return () => {
      this.callStartListeners.delete(listener);
    };
  }

  /**
   * Subscribe to call end events
   */
  onCallEnd(listener: CallEndListener): () => void {
    this.callEndListeners.add(listener);
    return () => {
      this.callEndListeners.delete(listener);
    };
  }

  /**
   * Get current call state
   */
  getIsMonitoring(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get current caller name
   */
  getCurrentCallerName(): string {
    return this.currentCallerName;
  }

  /**
   * Get current caller number
   */
  getCurrentCallerNumber(): string {
    return this.currentCallerNumber;
  }
}
