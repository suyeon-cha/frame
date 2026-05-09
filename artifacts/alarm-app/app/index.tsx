import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAlarm } from "@/context/AlarmContext";
import { useColors } from "@/hooks/useColors";

export default function IndexScreen() {
  const { isLoading, isSetup } = useAlarm();
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    if (isLoading) return;
    if (isSetup) {
      router.replace("/(tabs)/alarms");
    } else {
      router.replace("/onboarding");
    }
  }, [isLoading, isSetup]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
