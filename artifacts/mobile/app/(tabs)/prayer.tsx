import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { streamFromEndpoint, getApiBaseUrl } from "@/utils/streaming";

const PRAYER_SUGGESTIONS = [
  "strength to defend my faith",
  "wisdom before a debate",
  "healing for a sick family member",
  "courage to share the Gospel",
  "peace during a difficult time",
  "guidance in my vocation",
  "conversion of a loved one",
  "protection against temptation",
];

const TRADITIONAL_PRAYERS = [
  {
    title: "Hail Mary",
    text: "Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
  },
  {
    title: "Our Father",
    text: "Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
  },
  {
    title: "Prayer to St. Michael",
    text: "Saint Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do Thou, O Prince of the Heavenly Host, by the power of God, cast into hell Satan and all the evil spirits who prowl through the world seeking the ruin of souls. Amen.",
  },
  {
    title: "Act of Contrition",
    text: "O my God, I am heartily sorry for having offended Thee, and I detest all my sins, because of Thy just punishments, but most of all because they offend Thee, my God, Who art all good and deserving of all my love. I firmly resolve, with the help of Thy grace, to sin no more and to avoid the near occasion of sin. Amen.",
  },
];

export default function PrayerScreen() {
  const colors = useColors();
  const { incrementStat, addNote, notes } = useApp();
  const [situation, setSituation] = useState("");
  const [generatedPrayer, setGeneratedPrayer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTraditionalPrayer, setSelectedTraditionalPrayer] = useState<
    (typeof TRADITIONAL_PRAYERS)[number] | null
  >(null);
  const prayerNotesCount = notes.filter((note) => note.category === "Prayer").length;
  const isGeneratedPrayerSaved =
    generatedPrayer.trim().length > 0 &&
    notes.some(
      (note) =>
        note.category === "Prayer" && note.content.trim() === generatedPrayer.trim()
    );

  const handleGenerate = async () => {
    if (!situation.trim()) {
      Alert.alert("Enter a situation", "Please describe what you'd like to pray about.");
      return;
    }
    setIsGenerating(true);
    setGeneratedPrayer("");

    await streamFromEndpoint(
      `${getApiBaseUrl()}/api/ai/pray`,
      { situation: situation.trim() },
      (chunk) => setGeneratedPrayer((prev) => prev + chunk),
      () => {
        setIsGenerating(false);
        incrementStat("prayersGenerated");
      },
      (err) => {
        setIsGenerating(false);
        Alert.alert("Error", "Could not generate prayer. Please try again.");
      }
    );
  };

  const handleSavePrayer = async () => {
    const prayerText = generatedPrayer.trim();
    if (!prayerText || isGenerating || isGeneratedPrayerSaved) return;

    const situationTitle = situation.trim().replace(/\s+/g, " ").slice(0, 48);
    try {
      await addNote({
        title: situationTitle
          ? `Prayer for ${situationTitle}`
          : "Personalized Prayer",
        content: prayerText,
        category: "Prayer",
      });
      Alert.alert("Prayer saved", "You can find it in Prayer Notes and open it offline.");
    } catch {
      Alert.alert("Save failed", "Your prayer could not be saved. Please try again.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: Platform.OS === "web" ? 67 : 8 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 4 }}>Prayer</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Bring your intentions before God</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>

          <View style={{ backgroundColor: colors.navy, borderRadius: 18, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gold, marginBottom: 8 }}>AI Prayer Generator</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>Describe your situation and receive a personalized Catholic prayer</Text>

            <TextInput
              style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, minHeight: 80, textAlignVertical: "top", marginBottom: 12 }}
              placeholder="e.g. I'm anxious about a difficult conversation with my Protestant brother..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={situation}
              onChangeText={setSituation}
              multiline
            />

            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Quick suggestions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {PRAYER_SUGGESTIONS.map((sug) => (
                  <TouchableOpacity
                    key={sug}
                    style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
                    onPress={() => setSituation(sug)}
                  >
                    <Text style={{ fontSize: 12, color: "#fff" }}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={{ backgroundColor: colors.gold, borderRadius: 12, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.navy} />
              ) : (
                <Feather name="heart" size={18} color={colors.navy} />
              )}
              <Text style={{ color: colors.navy, fontWeight: "700", fontSize: 15 }}>
                {isGenerating ? "Generating..." : "Generate Prayer"}
              </Text>
            </TouchableOpacity>
          </View>

          {generatedPrayer.length > 0 && (
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: colors.gold }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.navy }}>Your Personalized Prayer</Text>
                <TouchableOpacity
                  testID="save-generated-prayer"
                  accessibilityRole="button"
                  accessibilityLabel={isGeneratedPrayerSaved ? "Saved to Prayer Notes" : "Save prayer to Prayer Notes"}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 11,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: isGeneratedPrayerSaved ? colors.secondary : colors.navy,
                  }}
                  onPress={handleSavePrayer}
                  disabled={isGenerating || isGeneratedPrayerSaved}
                >
                  <Feather
                    name={isGeneratedPrayerSaved ? "check" : "bookmark"}
                    size={15}
                    color={isGeneratedPrayerSaved ? colors.navy : "#fff"}
                  />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: isGeneratedPrayerSaved ? colors.navy : "#fff" }}>
                    {isGeneratedPrayerSaved ? "Saved" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 15, color: colors.navy, lineHeight: 24, fontStyle: "italic" }}>{generatedPrayer}</Text>
            </View>
          )}

          <TouchableOpacity
            testID="open-prayer-notes"
            accessibilityRole="button"
            onPress={() => router.push("/notes?category=Prayer" as any)}
            style={{
              backgroundColor: colors.secondary,
              borderRadius: 14,
              padding: 15,
              marginBottom: 22,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Feather name="bookmark" size={18} color={colors.navy} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy }}>Prayer Notes</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 3 }}>
                Saved prayers are available offline
              </Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{prayerNotesCount}</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Traditional Prayers</Text>

          {TRADITIONAL_PRAYERS.map((prayer) => (
            <TouchableOpacity
              key={prayer.title}
              testID={`traditional-prayer-${prayer.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              accessibilityRole="button"
              accessibilityLabel={`Read ${prayer.title}`}
              style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              onPress={() => setSelectedTraditionalPrayer(prayer)}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy }}>{prayer.title}</Text>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: Platform.OS === "web" ? 134 : 100 }} />
        </ScrollView>
      </View>

      <Modal
        visible={selectedTraditionalPrayer !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTraditionalPrayer(null)}
      >
        {selectedTraditionalPrayer && (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: Platform.OS === "web" ? 67 : 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: colors.navy, marginRight: 12 }}>
                {selectedTraditionalPrayer.title}
              </Text>
              <TouchableOpacity
                testID="close-traditional-prayer"
                accessibilityRole="button"
                accessibilityLabel="Close prayer"
                onPress={() => setSelectedTraditionalPrayer(null)}
                hitSlop={10}
              >
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: Platform.OS === "web" ? 58 : 24 }}>
              <View style={{ width: 42, height: 3, borderRadius: 2, backgroundColor: colors.gold, marginBottom: 22 }} />
              <Text style={{ fontSize: 18, color: colors.navy, lineHeight: 31, fontStyle: "italic" }}>
                {selectedTraditionalPrayer.text}
              </Text>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
