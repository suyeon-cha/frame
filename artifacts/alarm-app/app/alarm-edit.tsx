import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getListAlarmsQueryKey,
  useCreateAlarm,
  useUpdateAlarm,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAlarm } from "@/context/AlarmContext";
import { useColors } from "@/hooks/useColors";
import { formatTime, getSecondaryTime } from "@/utils/notifications";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function TimeScroller({
  value,
  max,
  onChange,
  colors,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.scrollerWrap}>
      <TouchableOpacity
        onPress={() => {
          const next = (value + 1) % (max + 1);
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(next);
        }}
        hitSlop={8}
        style={styles.arrowBtn}
      >
        <Ionicons name="chevron-up" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>
      <View style={[styles.valueBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.valueText, { color: colors.foreground }]}>{pad(value)}</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          const next = value === 0 ? max : value - 1;
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(next);
        }}
        hitSlop={8}
        style={styles.arrowBtn}
      >
        <Ionicons name="chevron-down" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

export default function AlarmEditScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pairCode, deviceRole } = useAlarm();
  const params = useLocalSearchParams<{
    id?: string;
    label?: string;
    hour?: string;
    minute?: string;
  }>();

  const isEdit = !!params.id;
  const [hour, setHour] = useState(params.hour ? parseInt(params.hour, 10) : 7);
  const [minute, setMinute] = useState(params.minute ? parseInt(params.minute, 10) : 0);
  const [label, setLabel] = useState(params.label ?? "Wake up");
  const [isLoading, setIsLoading] = useState(false);

  const createAlarm = useCreateAlarm();
  const updateAlarm = useUpdateAlarm();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListAlarmsQueryKey({ pairCode: pairCode ?? "" }) });
  }

  async function handleSave() {
    if (!pairCode) {
      Alert.alert("Error", "No pair code found. Please restart setup.");
      return;
    }
    if (!label.trim()) {
      Alert.alert("Label required", "Please enter a name for this alarm.");
      return;
    }
    setIsLoading(true);
    try {
      if (isEdit && params.id) {
        await updateAlarm.mutateAsync({
          id: parseInt(params.id, 10),
          data: { label: label.trim(), hour, minute },
        });
      } else {
        await createAlarm.mutateAsync({
          data: { pairCode, label: label.trim(), hour, minute },
        });
      }
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      invalidate();
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save alarm. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const primaryTime = formatTime(hour, minute);
  const secondary = getSecondaryTime(hour, minute);
  const secondaryTime = formatTime(secondary.hour, secondary.minute);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isEdit ? "Edit Alarm" : "New Alarm"}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={[styles.save, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pickerRow}>
          <TimeScroller value={hour} max={23} onChange={setHour} colors={colors} />
          <Text style={[styles.colon, { color: colors.foreground }]}>:</Text>
          <TimeScroller value={minute} max={59} onChange={setMinute} colors={colors} />
        </View>

        <View style={[styles.previewRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.previewItem}>
            <Ionicons name="phone-portrait" size={16} color={colors.primary} />
            <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Primary</Text>
            <Text style={[styles.previewTime, { color: colors.foreground }]}>{primaryTime}</Text>
          </View>
          <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
          <View style={styles.previewItem}>
            <Ionicons name="tablet-portrait-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Secondary</Text>
            <Text style={[styles.previewTime, { color: colors.mutedForeground }]}>{secondaryTime}</Text>
          </View>
        </View>

        <View style={styles.labelSection}>
          <Text style={[styles.labelTitle, { color: colors.mutedForeground }]}>LABEL</Text>
          <TextInput
            style={[
              styles.labelInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Wake up"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
            maxLength={40}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  cancel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  save: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    paddingHorizontal: 24,
    gap: 24,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  scrollerWrap: {
    alignItems: "center",
    gap: 8,
  },
  arrowBtn: {
    padding: 6,
  },
  valueBox: {
    width: 100,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  colon: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  previewRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  previewItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  previewDivider: {
    width: 1,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  previewTime: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  labelSection: {
    gap: 8,
  },
  labelTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  labelInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
