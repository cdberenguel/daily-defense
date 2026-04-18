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
} from "react-native";
import { Feather } from "@expo/vector-icons";
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
  const { incrementStat } = useApp();
  const [situation, setSituation] = useState("");
  const [generatedPrayer, setGeneratedPrayer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedPrayer, setExpandedPrayer] = useState<string | null>(null);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 }}>
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
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy, marginBottom: 10 }}>Your Personalized Prayer</Text>
              <Text style={{ fontSize: 15, color: colors.navy, lineHeight: 24, fontStyle: "italic" }}>{generatedPrayer}</Text>
            </View>
          )}

          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Traditional Prayers</Text>

          {TRADITIONAL_PRAYERS.map((prayer) => (
            <TouchableOpacity
              key={prayer.title}
              style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              onPress={() => setExpandedPrayer(expandedPrayer === prayer.title ? null : prayer.title)}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy }}>{prayer.title}</Text>
                <Feather name={expandedPrayer === prayer.title ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
              </View>
              {expandedPrayer === prayer.title && (
                <Text style={{ fontSize: 14, color: colors.navy, lineHeight: 22, marginTop: 12, fontStyle: "italic" }}>{prayer.text}</Text>
              )}
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
