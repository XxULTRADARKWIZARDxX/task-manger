import type { Habit, HabitGridState, IconName, MonthCursor, ReminderSettings, ThemeMode } from './types';

export const DAYS_IN_GRID = 30;
export const APP_STATE_VERSION = 2;
export const FREE_HABIT_LIMIT = 3;
export const LIFETIME_UNLOCK_PRICE = '$4.99';

const seedHabits: Array<Pick<Habit, 'name' | 'icon'>> = [
  { name: 'Reading', icon: 'book' },
  { name: 'Workout', icon: 'dumbbell' },
  { name: 'Study', icon: 'graduation' },
];

export const iconOptions: Array<{ icon: IconName; label: string }> = [
  { icon: 'book', label: 'Book' },
  { icon: 'dumbbell', label: 'Workout' },
  { icon: 'graduation', label: 'Study' },
  { icon: 'moon', label: 'Sleep' },
  { icon: 'phone', label: 'Phone' },
  { icon: 'drop', label: 'Water' },
];

export function makeCurrentMonth(): MonthCursor {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
  };
}

export function makeMonthKey(month: MonthCursor): string {
  return `${month.year}-${String(month.month + 1).padStart(2, '0')}`;
}

export function makeDayKey(month: MonthCursor, day: number): string {
  return `${makeMonthKey(month)}-${String(day).padStart(2, '0')}`;
}

export function formatMonthLabel(month: MonthCursor): string {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(month.year, month.month, 1));
}

export function moveMonth(month: MonthCursor, delta: number): MonthCursor {
  const next = new Date(month.year, month.month + delta, 1);
  return {
    year: next.getFullYear(),
    month: next.getMonth(),
  };
}

export function formatReminderTime(reminder: Pick<ReminderSettings, 'hour' | 'minute'>): string {
  const marker = reminder.hour >= 12 ? 'PM' : 'AM';
  const displayHour = reminder.hour % 12 || 12;
  return `${displayHour}:${String(reminder.minute).padStart(2, '0')} ${marker}`;
}

export function makeHabit(name: string, icon: IconName): Habit {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    icon,
    checks: {},
  };
}

export function makeInitialState(themeMode: ThemeMode): HabitGridState {
  const month = makeCurrentMonth();
  return {
    schemaVersion: APP_STATE_VERSION,
    month,
    themeMode,
    reminder: {
      enabled: false,
      hour: 20,
      minute: 0,
    },
    isPlusUnlocked: false,
    habits: seedHabits.map((habit, habitIndex) => ({
      id: `seed-${habit.name.toLowerCase().replace(/\s+/g, '-')}`,
      ...habit,
      checks: makeSeedChecks(month, habitIndex),
    })),
  };
}

function makeSeedChecks(month: MonthCursor, habitIndex: number): Record<string, boolean> {
  const checks: Record<string, boolean> = {};

  for (let day = 1; day <= DAYS_IN_GRID; day += 1) {
    const active =
      habitIndex === 0
        ? ![4, 7, 10, 12, 13, 15, 19, 23, 27].includes(day)
        : habitIndex === 1
          ? [2, 5, 8, 11, 14, 17, 20, 23, 26, 29].includes(day)
          : habitIndex === 2
            ? ![4, 7, 11, 13, 15, 18, 22, 25, 28].includes(day)
            : habitIndex === 3
              ? ![3, 8, 11, 12, 14, 18, 21, 24, 28].includes(day)
              : habitIndex === 4
                ? [3, 7, 10, 14, 18, 22, 26, 30].includes(day)
                : ![10, 13, 18, 21, 24, 27].includes(day);

    if (active) {
      checks[makeDayKey(month, day)] = true;
    }
  }

  return checks;
}
