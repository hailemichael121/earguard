import type {CallHistoryEntry} from '../types';

export type WeekDayStat = {
  key: string;
  label: string;
  day: number;
  count: number;
  durationSeconds: number;
};

export function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dayKeyFromTimestamp(value: string): string {
  const parsed = Number(value);
  const date = Number.isNaN(parsed) ? new Date(value) : new Date(parsed);
  return localDayKey(date);
}

function shiftDate(offset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - (6 - offset));
  return date;
}

export function buildWeekStats(history: CallHistoryEntry[]): WeekDayStat[] {
  const stats = new Map<string, {count: number; durationSeconds: number}>();

  for (const entry of history) {
    const key = dayKeyFromTimestamp(entry.date);
    const current = stats.get(key) ?? {count: 0, durationSeconds: 0};
    current.count += 1;
    current.durationSeconds += entry.durationSeconds;
    stats.set(key, current);
  }

  return Array.from({length: 7}, (_, index) => {
    const date = shiftDate(index);
    const key = localDayKey(date);
    const next = stats.get(key) ?? {count: 0, durationSeconds: 0};
    return {
      key,
      label: date.toLocaleDateString(undefined, {weekday: 'short'}),
      day: date.getDate(),
      count: next.count,
      durationSeconds: next.durationSeconds,
    };
  });
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));
  const seconds = Math.max(0, totalSeconds % 60);
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export function formatCallDate(value: string): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
