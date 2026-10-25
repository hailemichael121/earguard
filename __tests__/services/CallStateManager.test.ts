import {CallStateManager} from '../../src/services/CallStateManager';

// Mock the native module
jest.mock('../../src/native/earguard', () => ({
  EarGuardNative: {
    getCallState: jest.fn().mockResolvedValue('IDLE'),
    getCallerInfo: jest.fn().mockResolvedValue('Unknown'),
  },
}));

describe('CallStateManager', () => {
  let stateManager: CallStateManager;

  beforeEach(() => {
    stateManager = new CallStateManager();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    stateManager.stopMonitoring();
    jest.useRealTimers();
  });

  test('initializes with correct default values', () => {
    expect(stateManager.getIsMonitoring()).toBe(false);
    expect(stateManager.getCurrentCallerName()).toBe('');
    expect(stateManager.getCurrentCallerNumber()).toBe('');
  });

  test('starts monitoring call state', () => {
    stateManager.startMonitoring();
    expect(stateManager.getIsMonitoring()).toBe(true);
  });

  test('stops monitoring call state', () => {
    stateManager.startMonitoring();
    expect(stateManager.getIsMonitoring()).toBe(true);

    stateManager.stopMonitoring();
    expect(stateManager.getIsMonitoring()).toBe(false);
  });

  test('prevents double start', () => {
    stateManager.startMonitoring();
    const firstStart = stateManager.getIsMonitoring();

    stateManager.startMonitoring(); // Should not do anything
    const secondStart = stateManager.getIsMonitoring();

    expect(firstStart).toBe(true);
    expect(secondStart).toBe(true);
  });

  test('notifies on state change', done => {
    const {EarGuardNative} = require('../../src/native/earguard');
    let changeCount = 0;

    stateManager.onStateChange(() => {
      changeCount++;
    });

    // Simulate state change
    EarGuardNative.getCallState.mockResolvedValueOnce('RINGING');

    stateManager.startMonitoring();
    jest.advanceTimersByTime(1000);

    setTimeout(() => {
      expect(changeCount).toBeGreaterThan(0);
      done();
    }, 100);
  });

  test('detects incoming call', done => {
    const {EarGuardNative} = require('../../src/native/earguard');
    let callStarted = false;

    stateManager.onCallStart((name, number) => {
      callStarted = true;
      expect(name).toBeDefined();
    });

    // Simulate RINGING -> OFFHOOK transition
    EarGuardNative.getCallState
      .mockResolvedValueOnce('IDLE')
      .mockResolvedValueOnce('RINGING')
      .mockResolvedValueOnce('OFFHOOK');

    stateManager.startMonitoring();
    jest.advanceTimersByTime(3000);

    setTimeout(() => {
      expect(callStarted).toBe(true);
      done();
    }, 100);
  });

  test('detects call end', done => {
    const {EarGuardNative} = require('../../src/native/earguard');
    let callEnded = false;
    let duration = 0;

    stateManager.onCallEnd(durationSeconds => {
      callEnded = true;
      duration = durationSeconds;
    });

    // Simulate call flow: IDLE -> RINGING -> OFFHOOK -> IDLE
    EarGuardNative.getCallState
      .mockResolvedValueOnce('IDLE')
      .mockResolvedValueOnce('RINGING')
      .mockResolvedValueOnce('OFFHOOK')
      .mockResolvedValueOnce('OFFHOOK')
      .mockResolvedValueOnce('IDLE');

    stateManager.startMonitoring();
    jest.advanceTimersByTime(5000);

    setTimeout(() => {
      expect(callEnded).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(0);
      done();
    }, 100);
  });

  test('parses caller info correctly', done => {
    const {EarGuardNative} = require('../../src/native/earguard');

    stateManager.onCallStart((name, number) => {
      expect(name).toBe('John Doe');
      expect(number).toBe('+1-555-0000');
      done();
    });

    EarGuardNative.getCallerInfo.mockResolvedValueOnce('John Doe|+1-555-0000');
    EarGuardNative.getCallState
      .mockResolvedValueOnce('IDLE')
      .mockResolvedValueOnce('RINGING')
      .mockResolvedValueOnce('OFFHOOK');

    stateManager.startMonitoring();
    jest.advanceTimersByTime(3000);
  });

  test('handles missing caller info', done => {
    const {EarGuardNative} = require('../../src/native/earguard');

    stateManager.onCallStart((name, number) => {
      expect(name).toBe('Unknown Caller');
      done();
    });

    EarGuardNative.getCallerInfo.mockResolvedValueOnce('Unknown');
    EarGuardNative.getCallState
      .mockResolvedValueOnce('IDLE')
      .mockResolvedValueOnce('RINGING')
      .mockResolvedValueOnce('OFFHOOK');

    stateManager.startMonitoring();
    jest.advanceTimersByTime(3000);
  });

  test('can subscribe and unsubscribe from events', done => {
    const {EarGuardNative} = require('../../src/native/earguard');
    let stateChanges = 0;

    const unsubscribe = stateManager.onStateChange(() => {
      stateChanges++;
    });

    EarGuardNative.getCallState.mockResolvedValueOnce('RINGING');
    stateManager.startMonitoring();
    jest.advanceTimersByTime(1000);

    unsubscribe();

    EarGuardNative.getCallState.mockResolvedValueOnce('OFFHOOK');
    jest.advanceTimersByTime(1000);

    setTimeout(() => {
      expect(stateChanges).toBe(1);
      done();
    }, 100);
  });

  test('tracks current caller information', done => {
    const {EarGuardNative} = require('../../src/native/earguard');

    EarGuardNative.getCallerInfo.mockResolvedValueOnce('Jane Smith|+1-555-9999');
    EarGuardNative.getCallState
      .mockResolvedValueOnce('IDLE')
      .mockResolvedValueOnce('RINGING')
      .mockResolvedValueOnce('OFFHOOK');

    stateManager.startMonitoring();
    jest.advanceTimersByTime(2000);

    setTimeout(() => {
      expect(stateManager.getCurrentCallerName()).toBe('Jane Smith');
      expect(stateManager.getCurrentCallerNumber()).toBe('+1-555-9999');
      done();
    }, 100);
  });

  test('clears caller info when call ends', done => {
    const {EarGuardNative} = require('../../src/native/earguard');

    EarGuardNative.getCallerInfo.mockResolvedValueOnce('Test Caller|+1-555-1111');
    EarGuardNative.getCallState
      .mockResolvedValueOnce('IDLE')
      .mockResolvedValueOnce('RINGING')
      .mockResolvedValueOnce('OFFHOOK')
      .mockResolvedValueOnce('IDLE');

    stateManager.startMonitoring();
    jest.advanceTimersByTime(4000);

    setTimeout(() => {
      expect(stateManager.getCurrentCallerName()).toBe('');
      expect(stateManager.getCurrentCallerNumber()).toBe('');
      done();
    }, 100);
  });

  test('handles errors in getCallState gracefully', done => {
    const {EarGuardNative} = require('../../src/native/earguard');

    EarGuardNative.getCallState.mockRejectedValue(new Error('Native error'));

    expect(() => {
      stateManager.startMonitoring();
    }).not.toThrow();

    jest.advanceTimersByTime(1000);

    setTimeout(() => {
      expect(stateManager.getIsMonitoring()).toBe(true);
      done();
    }, 100);
  });
});
