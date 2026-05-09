import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import type { Alarm } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { formatTime, getSecondaryTime } from "@/utils/notifications";

interface AlarmCardProps {
  alarm: Alarm;
  deviceRole: "primary" | "secondary";
  onToggle: (id: number, enabled: boolean) => void;
  onDelete: (id: number) => void;
}

export function AlarmCard({ alarm, deviceRole, onToggle, onDelete }: AlarmCardProps) {
  const colors = useColors();
  const router = useRouter();

  const primaryTime = formatTime(alarm.hour, alarm.minute);
  const secondary = getSecondaryTime(alarm.hour, alarm.minute);
  const secondaryTime = formatTime(secondary.hour, secondary.minute);

  const myTime = deviceRole === "primary" ? primaryTime : secondaryTime;
  const otherTime = deviceRole === "primary" ? secondaryTime : primaryTime;
  const otherLabel = deviceRole === "primary" ? "tablet" : "phone";

  async function handleToggle(value: boolean) {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle(alarm.id, value);
  }

  async function handleDelete() {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDelete(alarm.id);
  }

  function handleEdit() {
    router.push({
      pathname: "/alarm-edit",
      params: {
        id: alarm.id,
        label: alarm.label,
        hour: alarm.hour,
        minute: alarm.minute,
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={handleEdit}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: alarm.enabled ? colors.primary + "30" : colors.border,
          opacity: alarm.enabled ? 1 : 0.5,
        },
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.time, { color: alarm.enabled ? colors.foreground : colors.mutedForeground }]}>
          {myTime}
        </Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{alarm.label}</Text>
        <View style={styles.otherTimeRow}>
          <Ionicons name="phone-portrait-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.otherTime, { color: colors.mutedForeground }]}>
            {otherLabel}: {otherTime}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Switch
          value={alarm.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={alarm.enabled ? "#FFFFFF" : colors.mutedForeground}
          ios_backgroundColor={colors.border}
        />
        <TouchableOpacity onPress={handleDelete} hitSlop={8} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  time: {
    fontSize: 34,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -1,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  otherTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  otherTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "center",
    gap: 12,
  },
  deleteBtn: {
    padding: 4,
  },
});
