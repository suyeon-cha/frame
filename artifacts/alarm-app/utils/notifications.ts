import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Alarm } from "@workspace/api-client-react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleAlarmNotifications(
  alarms: Alarm[],
  role: "primary" | "secondary"
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;

      let hour = alarm.hour;
      let minute = alarm.minute;

      if (role === "secondary") {
        minute += 1;
        if (minute >= 60) {
          minute = 0;
          hour = (hour + 1) % 24;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Alarm",
          body: alarm.label || "Time to wake up!",
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    }
  } catch (err) {
    console.warn("Failed to schedule notifications:", err);
  }
}

export async function cancelAllAlarms(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

export function getSecondaryTime(hour: number, minute: number): { hour: number; minute: number } {
  let m = minute + 1;
  let h = hour;
  if (m >= 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  return { hour: h, minute: m };
}
