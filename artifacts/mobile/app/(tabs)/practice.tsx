import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const PRACTICE_MODES = [
  {
    title: "Apologetics AI",
    subtitle: "Ask any question, get expert Catholic answers",
    icon: "shield" as const,
    route: "/apologetics",
    color: "#1e3a8a",
    bg: "#dbeafe",
    badge: "Most Popular",
    badgeColor: "#1e3a8a",
  },
  {
    title: "Faith Companion",
    subtitle: "Spiritual guidance and faith formation",
    icon: "heart" as const,
    route: "/faith-companion",
    color: "#9333ea",
    bg: "#f3e8ff",
    badge: null,
    badgeColor: null,
  },
  {
    title: "Tactics Workshop",
    subtitle: "Learn specific apologetics strategies",
    icon: "target" as const,
    route: "/tactics",
    color: "#0369a1",
    bg: "#e0f2fe",
    badge: null,
    badgeColor: null,
  },
  {
    title: "Practice Opponent",
    subtitle: "Debate a Muslim, Atheist, or Protestant",
    icon: "users" as const,
    route: "/opponent",
    color: "#dc2626",
    bg: "#fee2e2",
    badge: "New",
    badgeColor: "#dc2626",
  },
];

export default function PracticeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { stats } = useApp();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 4 }}>Practice</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Sharpen your apologetics skills</Text>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.gold }}>{stats.debatesCompleted}</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Conversations</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.gold }}>{stats.sessionsFinished}</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Debates Won</Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16, marginTop: 4 }}>Choose Your Mode</Text>

          {PRACTICE_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.route}
              style={{ backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}
              onPress={() => router.push(mode.route as any)}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16 }}>
                <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: mode.bg, alignItems: "center", justifyContent: "center" }}>
                  <Feather name={mode.icon} size={24} color={mode.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy }}>{mode.title}</Text>
                    {mode.badge && (
                      <View style={{ backgroundColor: mode.badgeColor!, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, color: "#fff", fontWeight: "700" }}>{mode.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{mode.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
