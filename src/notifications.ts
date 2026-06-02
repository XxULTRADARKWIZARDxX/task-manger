import { Platform } from 'react-native';

import type { ReminderSettings } from './types';
import { formatReminderTime } from './data';

const REMINDER_CHANNEL_ID = 'habit-reminders';

let notificationsModule: typeof import('expo-notifications') | undefined;

async function getNotifications() {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  return notificationsModule;
}

export async function ensureReminderPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  await ensureAndroidChannel();

  const Notifications = await getNotifications();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function scheduleDailyReminder(
  reminder: ReminderSettings,
  previousNotificationId?: string
): Promise<string | undefined> {
  if (Platform.OS === 'web') {
    return undefined;
  }

  if (previousNotificationId) {
    const Notifications = await getNotifications();
    await Notifications.cancelScheduledNotificationAsync(previousNotificationId);
  }

  if (!reminder.enabled) {
    return undefined;
  }

  const allowed = await ensureReminderPermissions();
  if (!allowed) {
    throw new Error('Notification permission was not granted.');
  }

  const Notifications = await getNotifications();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit Grid',
      body: `Mark today's row at ${formatReminderTime(reminder)}.`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminder.hour,
      minute: reminder.minute,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const Notifications = await getNotifications();
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Habit reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#ffffff',
  });
}
