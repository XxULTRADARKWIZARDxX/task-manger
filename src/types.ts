export type ThemeMode = 'light' | 'dark';

export type IconName =
  | 'book'
  | 'dumbbell'
  | 'graduation'
  | 'moon'
  | 'phone'
  | 'drop';

export type Habit = {
  id: string;
  name: string;
  icon: IconName;
  checks: Record<string, boolean>;
};

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId?: string;
};

export type MonthCursor = {
  year: number;
  month: number;
};

export type HabitGridState = {
  schemaVersion: number;
  habits: Habit[];
  month: MonthCursor;
  themeMode: ThemeMode;
  reminder: ReminderSettings;
  isPlusUnlocked: boolean;
};
