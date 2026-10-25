import {CallTimerService} from '../../src/services/CallTimerService';
import {VibrationPatternService} from '../../src/services/VibrationPatternService';

jest.mock('../../src/native/earguard', () => ({
  EarGuardNative: {
    vibrate: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('CallTimerService', () => {
  let timer: CallTimerService;

  beforeEach(() => {
    timer = new CallTimerService(1); // 1 second intervals for testing
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    timer.stop();
    jest.useRealTimers();
  });

  test('initializes with correct default values', () => {
    expect(timer.getIsRunning()).toBe(false);
    expect(timer.getElapsedSeconds()).toBe(0);
    expect(timer.getIntervalCount()).toBe(0);
  });

  test('starts timer and begins counting', () => {
    timer.start();
    expect(timer.getIsRunning()).toBe(true);

    jest.advanceTimersByTime(500);
    expect(timer.getElapsedSeconds()).toBeGreaterThanOrEqual(0);
  });

  test('tracks elapsed seconds accurately', () => {
    timer.start();

    jest.advanceTimersByTime(2000); // 2 seconds
    const elapsed = timer.getElapsedSeconds();
    expect(elapsed).toBeGreaterThanOrEqual(1);
    expect(elapsed).toBeLessThanOrEqual(3);
  });

  test('triggers interval callbacks at specified intervals', () => {
    let callCount = 0;
    timer.onInterval(() => {
      callCount++;
    });

    timer.start();
    jest.advanceTimersByTime(1100);

    expect(callCount).toBe(1);
    expect(timer.getIntervalCount()).toBe(1);
  });

  test('calls tick listeners frequently', () => {
    let tickCount = 0;
    timer.onTick(() => {
      tickCount++;
    });

    timer.start();
    jest.advanceTimersByTime(1500);

    expect(tickCount).toBeGreaterThan(0);
  });

  test('can subscribe and unsubscribe from events', () => {
    let intervalCount = 0;
    const unsubscribe = timer.onInterval(() => {
      intervalCount++;
    });

    timer.start();
    jest.advanceTimersByTime(1000);

    unsubscribe();
    jest.advanceTimersByTime(1000);

    expect(intervalCount).toBe(1);
  });

  test('formats elapsed time correctly', () => {
    timer.start();
    jest.advanceTimersByTime(125000); // 2 minutes 5 seconds

    const formatted = timer.formatElapsedTime();
    expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  test('calculates time until next interval', () => {
    timer.start();
    jest.advanceTimersByTime(300); // 0.3 seconds into 1 second interval

    const remaining = timer.getSecondsUntilNextInterval();
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(1);
  });

  test('stops timer and cleans up', () => {
    timer.start();
    expect(timer.getIsRunning()).toBe(true);

    timer.stop();
    expect(timer.getIsRunning()).toBe(false);
    expect(timer.getElapsedSeconds()).toBe(0);
    expect(timer.getIntervalCount()).toBe(0);
  });

  test('prevents double start', () => {
    timer.start();
    const firstStart = timer.getIsRunning();

    timer.start(); // Should not do anything
    const secondStart = timer.getIsRunning();

    expect(firstStart).toBe(true);
    expect(secondStart).toBe(true);
  });

  test('can update interval while running', () => {
    timer.start();
    jest.advanceTimersByTime(500);

    timer.setInterval(10); // Change to 10 second intervals
    const nextInterval = timer.getSecondsUntilNextInterval();

    expect(nextInterval).toBeGreaterThan(0);
  });

  test('handles multiple interval triggers', () => {
    const intervals: number[] = [];
    timer.onInterval(() => {
      intervals.push(timer.getIntervalCount());
    });

    timer.start();
    jest.advanceTimersByTime(3100);

    expect(intervals.length).toBe(3);
    expect(intervals).toEqual([1, 2, 3]);
  });
});

describe('VibrationPatternService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('plays SHORT vibration pattern', async () => {
    const {EarGuardNative} = require('../../src/native/earguard');
    await VibrationPatternService.playVibration('SHORT');

    expect(EarGuardNative.vibrate).toHaveBeenCalledWith(100);
  });

  test('plays LONG vibration pattern', async () => {
    const {EarGuardNative} = require('../../src/native/earguard');
    await VibrationPatternService.playVibration('LONG');

    expect(EarGuardNative.vibrate).toHaveBeenCalledWith(250);
  });

  test('plays TRIPLE_SHORT vibration pattern', async () => {
    const {EarGuardNative} = require('../../src/native/earguard');
    await VibrationPatternService.playVibration('TRIPLE_SHORT');

    expect(EarGuardNative.vibrate).toHaveBeenCalledTimes(3);
    expect(EarGuardNative.vibrate).toHaveBeenCalledWith(80);
  });

  test('plays REMINDER_PATTERN vibration', async () => {
    const {EarGuardNative} = require('../../src/native/earguard');
    await VibrationPatternService.playVibration('REMINDER_PATTERN');

    expect(EarGuardNative.vibrate).toHaveBeenCalledTimes(4);
  });

  test('returns correct pattern descriptions', () => {
    expect(VibrationPatternService.getPatternDescription('SHORT')).toBe(
      'Single short pulse'
    );
    expect(VibrationPatternService.getPatternDescription('LONG')).toBe(
      'Single long pulse'
    );
    expect(VibrationPatternService.getPatternDescription('TRIPLE_SHORT')).toBe(
      'Three short pulses'
    );
    expect(VibrationPatternService.getPatternDescription('REMINDER_PATTERN')).toBe(
      'Long pulse followed by three short pulses'
    );
  });

  test('handles invalid pattern gracefully', async () => {
    const {EarGuardNative} = require('../../src/native/earguard');
    await VibrationPatternService.playVibration('INVALID' as any);

    expect(EarGuardNative.vibrate).not.toHaveBeenCalled();
  });
});
