import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCreatePair,
  useGetPair,
  useRegisterDevice,
} from "@workspace/api-client-react";
import { useAlarm } from "@/context/AlarmContext";
import { useColors } from "@/hooks/useColors";
import { requestNotificationPermission } from "@/utils/notifications";

type Step = "choice" | "create-show" | "join-enter" | "role";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setPairInfo } = useAlarm();

  const [step, setStep] = useState<Step>("choice");
  const [generatedCode, setGeneratedCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [finalCode, setFinalCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createPair = useCreatePair();
  const registerDevice = useRegisterDevice();

  async function handleCreate() {
    setIsLoading(true);
    try {
      const pair = await createPair.mutateAsync();
      setGeneratedCode(pair.code);
      setFinalCode(pair.code);
      setStep("create-show");
    } catch {
      Alert.alert("Error", "Failed to create pair. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin() {
    if (joinCode.trim().length < 4) {
      Alert.alert("Invalid Code", "Please enter the 6-character pair code.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/pairs/${joinCode.trim().toUpperCase()}`);
      if (!res.ok) {
        Alert.alert("Not Found", "That code doesn't exist. Double-check and try again.");
        setIsLoading(false);
        return;
      }
      setFinalCode(joinCode.trim().toUpperCase());
      setStep("role");
    } catch {
      Alert.alert("Error", "Failed to join. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectRole(role: "primary" | "secondary") {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsLoading(true);
    try {
      const device = await registerDevice.mutateAsync({
        data: { pairCode: finalCode, role },
      });
      await requestNotificationPermission();
      await setPairInfo(finalCode, role, device.id);
      router.replace("/(tabs)/alarms");
    } catch {
      Alert.alert("Error", "Failed to register device. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: topPad + 40, paddingBottom: botPad + 24 }]}>
        {step === "choice" && (
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="alarm" size={64} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>DualAlarm</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Set one alarm. Ring on two devices.
            </Text>
            <View style={styles.spacer} />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleCreate}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={22} color="#000" />
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    Create New Pair
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnOutline, { borderColor: colors.border }]}
              onPress={() => setStep("join-enter")}
              activeOpacity={0.85}
            >
              <Ionicons name="link-outline" size={22} color={colors.foreground} />
              <Text style={[styles.btnText, { color: colors.foreground }]}>Join Existing Pair</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "create-show" && (
          <View style={styles.content}>
            <Ionicons name="checkmark-circle" size={56} color={colors.accent} />
            <Text style={[styles.title, { color: colors.foreground }]}>Pair Created!</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter this code on your second device
            </Text>
            <View style={[styles.codeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.code, { color: colors.primary }]}>{generatedCode}</Text>
            </View>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Open DualAlarm on your other device and tap "Join Existing Pair"
            </Text>
            <View style={styles.spacer} />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => setStep("role")}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {step === "join-enter" && (
          <View style={styles.content}>
            <Ionicons name="link" size={56} color={colors.primary} />
            <Text style={[styles.title, { color: colors.foreground }]}>Enter Pair Code</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Find the code shown on your first device
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              placeholder="XXXXXX"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
            />
            <View style={styles.spacer} />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleJoin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Join Pair</Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep("choice")} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.mutedForeground }]}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "role" && (
          <View style={styles.content}>
            <Ionicons name="phone-portrait-outline" size={56} color={colors.primary} />
            <Text style={[styles.title, { color: colors.foreground }]}>Which Device Is This?</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              The primary device rings first. The secondary device rings 1 minute later.
            </Text>
            <View style={styles.spacer} />
            <TouchableOpacity
              style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
              onPress={() => handleSelectRole("primary")}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="phone-portrait" size={32} color={colors.primary} />
              <View style={styles.roleText}>
                <Text style={[styles.roleName, { color: colors.foreground }]}>Primary</Text>
                <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>
                  Rings at the alarm time exactly
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelectRole("secondary")}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="tablet-portrait-outline" size={32} color={colors.mutedForeground} />
              <View style={styles.roleText}>
                <Text style={[styles.roleName, { color: colors.foreground }]}>Secondary</Text>
                <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>
                  Rings 1 minute after primary
                </Text>
              </View>
            </TouchableOpacity>
            {isLoading && (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
    alignItems: "center",
    gap: 16,
  },
  iconWrap: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  spacer: {
    flex: 1,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: "100%",
  },
  btnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: "100%",
    borderWidth: 1.5,
  },
  btnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  codeBox: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 8,
  },
  code: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    letterSpacing: 8,
  },
  hint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  input: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: 8,
    marginVertical: 8,
  },
  backBtn: {
    marginTop: 8,
    padding: 8,
  },
  backText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    width: "100%",
  },
  roleText: {
    flex: 1,
    gap: 4,
  },
  roleName: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  roleDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
