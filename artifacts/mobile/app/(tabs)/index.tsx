import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { id: "all", label: "All", icon: "grid" as const },
  { id: "Scripture & Tradition", label: "Scripture", icon: "book" as const },
  { id: "Papacy & Authority", label: "Papacy", icon: "star" as const },
  { id: "Mary & Saints", label: "Mary", icon: "heart" as const },
  { id: "Sacraments", label: "Sacraments", icon: "droplet" as const },
  { id: "Salvation & Works", label: "Salvation", icon: "shield" as const },
  { id: "Church History", label: "History", icon: "clock" as const },
];

const OBJECTIONS = [
  { id: "s1", title: "Sola Scriptura", subtitle: "Is the Bible the only authority?", category: "Scripture & Tradition", difficulty: "Intermediate", difficultyColor: "#f59e0b" },
  { id: "s2", title: "Catholics Added Books to the Bible", subtitle: "The Deuterocanonical books controversy", category: "Scripture & Tradition", difficulty: "Intermediate", difficultyColor: "#f59e0b" },
  { id: "s3", title: "Catholics Worship Idols", subtitle: "Statues, images, and veneration", category: "Scripture & Tradition", difficulty: "Beginner", difficultyColor: "#22c55e" },
  { id: "p1", title: "Papal Infallibility", subtitle: "Can the Pope be wrong?", category: "Papacy & Authority", difficulty: "Advanced", difficultyColor: "#ef4444" },
  { id: "m1", title: "Catholics Worship Mary", subtitle: "Veneration vs. worship", category: "Mary & Saints", difficulty: "Beginner", difficultyColor: "#22c55e" },
  { id: "sa1", title: "Confession to a Priest", subtitle: "Why confess to a man?", category: "Sacraments", difficulty: "Beginner", difficultyColor: "#22c55e" },
  { id: "sa2", title: "Real Presence in the Eucharist", subtitle: "Is it really Christ's body?", category: "Sacraments", difficulty: "Intermediate", difficultyColor: "#f59e0b" },
  { id: "sv1", title: "Works vs. Faith for Salvation", subtitle: "Are Catholics trying to earn heaven?", category: "Salvation & Works", difficulty: "Intermediate", difficultyColor: "#f59e0b" },
  { id: "h1", title: "The Early Church Was Protestant", subtitle: "What did the first Christians believe?", category: "Church History", difficulty: "Advanced", difficultyColor: "#ef4444" },
];

export default function TopicsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered = OBJECTIONS.filter((obj) => {
    const matchSearch = search.trim() === "" || obj.title.toLowerCase().includes(search.toLowerCase()) || obj.subtitle.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "all" || obj.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, paddingTop: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
            <Text style={{ color: colors.navy, fontWeight: "900", fontSize: 18 }}>✝</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff", letterSpacing: 0.5 }}>Daily Defense</Text>
        </View>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>Catholic Apologetics at Your Fingertips</Text>

        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={{ flex: 1, color: "#fff", fontSize: 15 }}
            placeholder="Search objections..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48, marginBottom: 2 }}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, gap: 5, backgroundColor: active ? colors.gold : "rgba(255,255,255,0.12)" }}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Feather name={cat.icon} size={13} color={active ? colors.navy : "#fff"} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: active ? colors.navy : "#fff" }}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy }}>Common Objections</Text>
            <View style={{ backgroundColor: colors.navy, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 12, color: "#fff", fontWeight: "600" }}>{filtered.length}</Text>
            </View>
          </View>

          {filtered.map((obj) => (
            <TouchableOpacity
              key={obj.id}
              style={{ backgroundColor: "#fff", marginHorizontal: 20, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
              onPress={() => router.push(`/topic/${obj.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy, flex: 1, marginRight: 8 }}>{obj.title}</Text>
                <View style={{ borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: obj.difficultyColor }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>{obj.difficulty}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 8 }}>{obj.subtitle}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ backgroundColor: colors.parchment, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, color: colors.navy, fontWeight: "600" }}>{obj.category}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.navy} />
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.navy, marginHorizontal: 20, marginTop: 4, marginBottom: 20, borderRadius: 14, padding: 14, justifyContent: "center" }}
            onPress={() => router.push("/generator" as any)}
          >
            <Feather name="zap" size={18} color={colors.gold} />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Generate Custom Topic with AI</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
