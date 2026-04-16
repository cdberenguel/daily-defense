import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  {
    id: "scripture",
    label: "Scripture & Tradition",
    icon: "book-open" as const,
  },
  { id: "papacy", label: "Papacy & Authority", icon: "shield" as const },
  { id: "mary", label: "Mary & Saints", icon: "star" as const },
  { id: "sacraments", label: "Sacraments", icon: "droplet" as const },
  { id: "salvation", label: "Salvation & Works", icon: "heart" as const },
  { id: "history", label: "Church History", icon: "clock" as const },
];

const OBJECTIONS: Record<
  string,
  { id: string; text: string; category: string }[]
> = {
  scripture: [
    {
      id: "s1",
      text: "The Bible alone is the only authority for Christians (Sola Scriptura).",
      category: "scripture",
    },
    {
      id: "s2",
      text: "The Catholic Church added books to the Bible.",
      category: "scripture",
    },
    {
      id: "s3",
      text: "Catholics worship idols and graven images.",
      category: "scripture",
    },
    {
      id: "s4",
      text: "Tradition contradicts Scripture.",
      category: "scripture",
    },
  ],
  papacy: [
    {
      id: "p1",
      text: "The Pope is not infallible — popes have made mistakes.",
      category: "papacy",
    },
    {
      id: "p2",
      text: "Peter was never in Rome.",
      category: "papacy",
    },
    {
      id: "p3",
      text: "The papacy is a human invention with no biblical basis.",
      category: "papacy",
    },
    {
      id: "p4",
      text: "Catholics believe the Pope is equal to or above God.",
      category: "papacy",
    },
  ],
  mary: [
    {
      id: "m1",
      text: "Catholics worship Mary.",
      category: "mary",
    },
    {
      id: "m2",
      text: "Mary was not sinless — she needed a Savior too (Luke 1:47).",
      category: "mary",
    },
    {
      id: "m3",
      text: "Praying to saints is necromancy.",
      category: "mary",
    },
    {
      id: "m4",
      text: "Mary had other children after Jesus.",
      category: "mary",
    },
    {
      id: "m5",
      text: "The Assumption of Mary is not in the Bible.",
      category: "mary",
    },
  ],
  sacraments: [
    {
      id: "sa1",
      text: "Confession to a priest is unnecessary — confess directly to God.",
      category: "sacraments",
    },
    {
      id: "sa2",
      text: "The Eucharist is just a symbol, not the real body of Christ.",
      category: "sacraments",
    },
    {
      id: "sa3",
      text: "Baptism doesn't save — only faith does.",
      category: "sacraments",
    },
    {
      id: "sa4",
      text: "The Mass is a re-crucifixion of Christ, which contradicts Hebrews.",
      category: "sacraments",
    },
  ],
  salvation: [
    {
      id: "sv1",
      text: "Catholics believe you earn salvation by good works.",
      category: "salvation",
    },
    {
      id: "sv2",
      text: "Once saved, always saved — you can't lose your salvation.",
      category: "salvation",
    },
    {
      id: "sv3",
      text: "Purgatory is unbiblical and a Catholic invention.",
      category: "salvation",
    },
    {
      id: "sv4",
      text: "Catholics think non-Catholics go to hell.",
      category: "salvation",
    },
  ],
  history: [
    {
      id: "h1",
      text: "The Catholic Church created Christianity — the early church was Protestant.",
      category: "history",
    },
    {
      id: "h2",
      text: "Constantine invented Catholicism at the Council of Nicaea.",
      category: "history",
    },
    {
      id: "h3",
      text: "The Crusades and Inquisition prove the Church is evil.",
      category: "history",
    },
    {
      id: "h4",
      text: "The Catholic Church covered up abuse and cannot be trusted.",
      category: "history",
    },
  ],
};

export default function ObjectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("scripture");

  const styles = makeStyles(colors);
  const objections = OBJECTIONS[selectedCategory] ?? [];

  const handleObjection = (objection: { id: string; text: string; category: string }) => {
    router.push({
      pathname: "/response",
      params: {
        objectionId: objection.id,
        objectionText: objection.text,
        category: objection.category,
      },
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Defense</Text>
        <Text style={styles.headerSubtitle}>Catholic Apologetics</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
            activeOpacity={0.7}
          >
            <Feather
              name={item.icon}
              size={14}
              color={
                selectedCategory === item.id
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === item.id && styles.categoryLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={objections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          {
            paddingBottom:
              Platform.OS === "web" ? insets.bottom + 34 + 84 : insets.bottom + 100,
          },
        ]}
        scrollEnabled={objections.length > 0}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.objectionCard}
            onPress={() => handleObjection(item)}
            activeOpacity={0.8}
          >
            <View style={styles.objectionContent}>
              <View style={styles.crossIcon}>
                <Text style={styles.crossText}>✝</Text>
              </View>
              <Text style={styles.objectionText}>{item.text}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.gold} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      paddingTop: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.navy,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.gold,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    categoriesContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.parchment,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    categoryChipActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    categoryLabel: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    categoryLabelActive: {
      color: colors.primaryForeground,
    },
    listContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 10,
    },
    objectionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    objectionContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    crossIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    crossText: {
      color: colors.gold,
      fontSize: 14,
    },
    objectionText: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      lineHeight: 22,
    },
  });
}
