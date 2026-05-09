import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlarm } from "@/context/AlarmContext";
import { useColors } from "@/hooks/useColors";
import { cancelAllAlarms } from "@/utils/notifications";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pairCode, deviceRole, clearSetup } = useAlarm();
  const [copied, setCopied] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleCopy() {
    if (!pairCode) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await Clipboard.setStringAsync(pairCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleReset() {
    Alert.alert(
      "Leave Pair",
      "This will remove your pairing and all local alarm schedules. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await cancelAllAlarms();
            await clearSetup();
            router.replace("/onboarding");
          },
        },
      ]
    );
  }

  const roleLabel = deviceRole === "primary" ? "Primary Device" : "Secondary Device";
  const roleDesc =
    deviceRole === "primary"
      ? "Alarms ring at the exact time you set"
      : "Alarms ring 1 minute after primary";
  const roleIcon = deviceRole === "primary" ? "phone-portrait" : "tablet-portrait-outline";
  const roleColor = deviceRole === "primary" ? colors.primary : colors.mutedForeground;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: topPad + 24,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
        },
      ]}
    >
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Settings</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>THIS DEVICE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Ionicons name={roleIcon as any} size={22} color={roleColor} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{roleLabel}</Text>
              <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{roleDesc}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PAIR CODE</Text>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleCopy}
          activeOpacity={0.75}
        >
          <View style={styles.row}>
            <Ionicons
              name={copied ? "checkmark-circle" : "copy-outline"}
              size={22}
              color={copied ? colors.accent : colors.mutedForeground}
            />
            <View style={styles.rowText}>
              <Text style={[styles.codeText, { color: colors.primary }]}>{pairCode ?? "—"}</Text>
              <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                {copied ? "Copied!" : "Tap to copy — share with your second device"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HOW IT WORKS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, { gap: 16 }]}>
            <Ionicons name="alarm-outline" size={22} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Set an alarm on either device. Your phone rings at the set time. Your tablet rings 1 minute later — so you can snooze without disturbing the room.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={[styles.leaveBtn, { borderColor: colors.destructive }]}
        onPress={handleReset}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={[styles.leaveBtnText, { color: colors.destructive }]}>Leave Pair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  rowDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  codeText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  leaveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
