import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function AchievementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { achievements, stats } = useApp();
  const achievement = achievements.find((a) => a.id === id);

  if (!achievement) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={["top"]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 20 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff" }}>Achievement not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercent = Math.min((achievement.progress / achievement.threshold) * 100, 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: achievement.unlocked ? colors.navy : "#64748b" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>Achievement</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: achievement.unlocked ? colors.navy : "#e2e8f0", alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 }}>
              <Feather name={achievement.icon as any} size={44} color={achievement.unlocked ? colors.gold : "#94a3b8"} />
              {achievement.unlocked && (
                <View style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 14, color: "#fff" }}>✓</Text>
                </View>
              )}
            </View>

            <Text style={{ fontSize: 26, fontWeight: "800", color: colors.navy, marginBottom: 6, textAlign: "center" }}>{achievement.title}</Text>
            <View style={{ backgroundColor: achievement.unlocked ? colors.navy : "#e2e8f0", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: achievement.unlocked ? colors.gold : "#94a3b8" }}>{achievement.category}</Text>
            </View>
            <Text style={{ fontSize: 15, color: colors.mutedForeground, textAlign: "center", lineHeight: 22 }}>{achievement.description}</Text>
          </View>

          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy, marginBottom: 8 }}>Requirement</Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, marginBottom: 16 }}>{achievement.requirement}</Text>

            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy, marginBottom: 8 }}>Progress</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: colors.mutedForeground }}>{achievement.progress} / {achievement.threshold}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: achievement.unlocked ? "#22c55e" : colors.navy }}>{Math.round(progressPercent)}%</Text>
            </View>
            <View style={{ height: 12, backgroundColor: colors.parchment, borderRadius: 6, overflow: "hidden" }}>
              <View style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: achievement.unlocked ? "#22c55e" : colors.gold, borderRadius: 6 }} />
            </View>
          </View>

          {achievement.unlocked && achievement.unlockedAt && (
            <View style={{ backgroundColor: "#dcfce7", borderRadius: 14, padding: 16, flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 18 }}>🏆</Text>
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#15803d" }}>Achievement Unlocked!</Text>
                <Text style={{ fontSize: 13, color: "#16a34a" }}>
                  {new Date(achievement.unlockedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </Text>
              </View>
            </View>
          )}

          {!achievement.unlocked && (
            <View style={{ backgroundColor: "#f8fafc", borderRadius: 14, padding: 16 }}>
              <Text style={{ fontSize: 14, color: "#475569", textAlign: "center", lineHeight: 20 }}>
                Keep practicing! You're {Math.round(progressPercent)}% of the way to unlocking this achievement.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
