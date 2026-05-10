import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { AlarmWeekday } from "react-native-nitro-ios-alarm-kit";
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

// All days of the week
const ALL_DAYS: AlarmWeekday[] = [
  "monday", "tuesday", "wednesday", "thursday",
  "friday", "saturday", "sunday",
];

// AlarmKit is only available on iOS 26+ in native (EAS) builds.
// It will not be present in Expo Go — that's expected and handled gracefully.
let _alarmKitChecked = false;
let _alarmKit: typeof import("react-native-nitro-ios-alarm-kit") | null = null;

function getAlarmKit(): typeof import("react-native-nitro-ios-alarm-kit") | null {
  if (Platform.OS !== "ios") return null;
  if (_alarmKitChecked) return _alarmKit;
  _alarmKitChecked = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const kit = require("react-native-nitro-ios-alarm-kit");
    _alarmKit = kit.isAvailable?.() ? kit : null;
  } catch {
    _alarmKit = null;
  }
  return _alarmKit;
}

function computeTime(
  alarm: Alarm,
  role: "primary" | "secondary"
): { hour: number; minute: number } {
  let hour = alarm.hour;
  let minute = alarm.minute;
  if (role === "secondary") {
    minute += 1;
    if (minute >= 60) {
      minute = 0;
      hour = (hour + 1) % 24;
    }
  }
  return { hour, minute };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const kit = getAlarmKit();
  if (kit) {
    try {
      return await kit.requestAlarmPermission();
    } catch {
      // fall through to expo-notifications
    }
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
        allowCriticalAlerts: true,
      },
    });
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

  const kit = getAlarmKit();

  if (kit) {
    // AlarmKit path — true system alarms on iOS 26+
    // Rings through Silent mode and Focus, shown on Lock Screen & Dynamic Island
    try {
      await kit.stopAllAlarms();
      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        const { hour, minute } = computeTime(alarm, role);
        await kit.scheduleRelativeAlarm(
          alarm.label ? alarm.label.slice(0, 15) : "DualAlarm",
          { text: "Stop", textColor: "#000000", icon: "alarm.fill" },
          "#00C2FF",
          hour,
          minute,
          ALL_DAYS,
          { text: "Snooze", textColor: "#000000", icon: "zzz" },
          { postAlert: 300 }
        );
      }
      return;
    } catch (err) {
      console.warn("AlarmKit scheduling failed, falling back:", err);
    }
  }

  // Fallback — expo-notifications (Expo Go / older iOS)
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      const { hour, minute } = computeTime(alarm, role);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ DualAlarm",
          body: alarm.label || "Time to wake up!",
          sound: "default",
          ...(Platform.OS === "ios"
            ? { ios: { critical: true, sound: true, volume: 1.0 } }
            : {}),
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

  const kit = getAlarmKit();
  if (kit) {
    try {
      await kit.stopAllAlarms();
      return;
    } catch {}
  }

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

export function getSecondaryTime(
  hour: number,
  minute: number
): { hour: number; minute: number } {
  let m = minute + 1;
  let h = hour;
  if (m >= 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  return { hour: h, minute: m };
}
