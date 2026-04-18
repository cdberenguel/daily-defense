import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const STUDY_SECTIONS = [
  {
    title: "Bible Study",
    subtitle: "Study verses with AI-powered explanations",
    icon: "book-open" as const,
    route: "/bible",
    color: "#4f46e5",
    bg: "#eef2ff",
  },
  {
    title: "Catholic Library",
    subtitle: "Catechism, Vatican documents, encyclicals",
    icon: "library" as const,
    route: "/library",
    color: "#0369a1",
    bg: "#e0f2fe",
  },
  {
    title: "Topic Generator",
    subtitle: "Generate AI apologetics pages on any objection",
    icon: "zap" as const,
    route: "/generator",
    color: "#d97706",
    bg: "#fef3c7",
  },
  {
    title: "My Notes",
    subtitle: "View and manage your saved notes",
    icon: "edit-3" as const,
    route: "/notes",
    color: "#059669",
    bg: "#d1fae5",
  },
];

export default function StudyScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 4 }}>Study</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Deepen your knowledge of the faith</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16, marginTop: 4 }}>Resources</Text>

          {STUDY_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.route}
              style={{ backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}
              onPress={() => router.push(section.route as any)}
              activeOpacity={0.75}
            >
              <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: section.bg, alignItems: "center", justifyContent: "center" }}>
                <Feather name={section.icon} size={24} color={section.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy, marginBottom: 3 }}>{section.title}</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{section.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}

          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16, marginTop: 8 }}>Daily Wisdom</Text>

          <View style={{ backgroundColor: colors.navy, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 12, color: colors.gold, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Quote of the Day</Text>
            <Text style={{ fontSize: 16, color: "#fff", fontStyle: "italic", lineHeight: 24, marginBottom: 12 }}>
              "The Catholic Church is an institution I am bound to hold divine — but for unbelievers a proof of its divinity might be found in the fact that no merely human institution conducted with such knavish imbecility would have lasted a fortnight."
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>— Hilaire Belloc</Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
