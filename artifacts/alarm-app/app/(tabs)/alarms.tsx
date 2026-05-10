import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getListAlarmsQueryKey,
  useCreateAlarm,
  useDeleteAlarm,
  useListAlarms,
  useUpdateAlarm,
  type Alarm,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlarmCard } from "@/components/AlarmCard";
import { useAlarm } from "@/context/AlarmContext";
import { useColors } from "@/hooks/useColors";
import { scheduleAlarmNotifications } from "@/utils/notifications";

function getCurrentTime(): string {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = now.getHours() < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function AlarmsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pairCode, deviceRole } = useAlarm();

  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [currentDate, setCurrentDate] = useState(getCurrentDate());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setCurrentDate(getCurrentDate());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: alarms = [], isLoading } = useListAlarms(
    { pairCode: pairCode ?? "" },
    {
      query: {
        queryKey: getListAlarmsQueryKey({ pairCode: pairCode ?? "" }),
        enabled: !!pairCode,
        refetchInterval: 15000,
      },
    }
  );

  useEffect(() => {
    if (alarms.length > 0 && deviceRole) {
      scheduleAlarmNotifications(alarms, deviceRole);
    }
  }, [alarms, deviceRole]);

  const updateAlarm = useUpdateAlarm();
  const deleteAlarm = useDeleteAlarm();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListAlarmsQueryKey({ pairCode: pairCode ?? "" }) });
  }

  async function handleToggle(id: number, enabled: boolean) {
    await updateAlarm.mutateAsync({ id, data: { enabled } });
    invalidate();
  }

  async function handleDelete(id: number) {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await deleteAlarm.mutateAsync({ id });
    invalidate();
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const roleLabel = deviceRole === "primary" ? "Primary" : "Secondary";
  const roleIcon = deviceRole === "primary" ? "phone-portrait" : "tablet-portrait-outline";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 24 }]}>
        <View style={styles.roleBadge}>
          <Ionicons name={roleIcon as any} size={13} color={colors.primary} />
          <Text style={[styles.roleText, { color: colors.primary }]}>{roleLabel}</Text>
        </View>
        <Text style={[styles.clock, { color: colors.foreground }]}>{currentTime}</Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{currentDate}</Text>
        {pairCode ? (
          <Text style={[styles.pairCodeHint, { color: colors.mutedForeground }]}>
            Pair: {pairCode}
          </Text>
        ) : null}
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : alarms.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="alarm-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No alarms yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Tap + to add your first alarm
            </Text>
          </View>
        ) : (
          <FlatList
            data={alarms}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
            ]}
            scrollEnabled={alarms.length > 0}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <AlarmCard
                alarm={item}
                deviceRole={deviceRole ?? "primary"}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            )}
          />
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
          },
        ]}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push("/alarm-edit");
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    alignItems: "center",
    gap: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(0, 194, 255, 0.12)",
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  clock: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    lineHeight: 64,
  },
  date: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  pairCodeHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  list: {
    paddingTop: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00C2FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
