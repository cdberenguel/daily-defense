import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StatusBar, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getApiBaseUrl, streamFromEndpoint } from "@/utils/streaming";

const EXAMPLE_OBJECTIONS = [
  "Why do Catholics confess to priests?",
  "Purgatory isn't in the Bible",
  "The crusades prove the Church is evil",
  "Catholics follow man-made traditions",
  "Why do Catholics fast?",
  "The Church changed its teachings on slavery",
  "Why is there evil if God is good?",
];

interface GeneratedTopic {
  title: string;
  summary: string;
  scripturePassages: { reference: string; text: string; explanation: string }[];
  mainArguments: { title: string; content: string }[];
  churchFathersQuotes: { father: string; work: string; quote: string }[];
  practicalTips: string[];
  commonMistakes: string[];
}

export default function GeneratorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { incrementStat, saveTopic } = useApp();
  const [objection, setObjection] = useState("");
  const [rawOutput, setRawOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [parsedTopic, setParsedTopic] = useState<GeneratedTopic | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const baseUrl = getApiBaseUrl();

  const generate = async () => {
    if (!objection.trim()) {
      Alert.alert("Enter an objection", "Please type an objection to generate a topic for.");
      return;
    }
    setIsGenerating(true);
    setRawOutput("");
    setParsedTopic(null);

    let fullOutput = "";
    await streamFromEndpoint(
      `${baseUrl}/api/ai/generate-topic`,
      { objection: objection.trim() },
      (chunk) => { fullOutput += chunk; setRawOutput((prev) => prev + chunk); },
      () => {
        setIsGenerating(false);
        incrementStat("topicsGenerated");
        try {
          const jsonMatch = fullOutput.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as GeneratedTopic;
            setParsedTopic(parsed);
          }
        } catch {}
      },
      () => { setIsGenerating(false); Alert.alert("Error", "Could not generate topic."); }
    );
  };

  const handleSave = async () => {
    if (!parsedTopic) return;
    await saveTopic({ ...parsedTopic, objection: objection.trim() });
    Alert.alert("Saved!", "Topic saved to your Study tab.");
  };

  const TABS = ["Summary", "Scripture", "Arguments", "Fathers", "Tips"];

  const renderContent = () => {
    if (!parsedTopic) return null;
    switch (activeTab) {
      case 0: return (
        <View>
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#d97706", marginBottom: 8 }}>{parsedTopic.title}</Text>
            <Text style={{ fontSize: 14, color: "#78350f", lineHeight: 22 }}>{parsedTopic.summary}</Text>
          </View>
          {parsedTopic.commonMistakes.map((m, i) => (
            <View key={i} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", gap: 10 }}>
              <Text style={{ color: "#ef4444", fontWeight: "700" }}>✗</Text>
              <Text style={{ flex: 1, fontSize: 14, color: "#78350f" }}>{m}</Text>
            </View>
          ))}
        </View>
      );
      case 1: return (
        <View>
          {parsedTopic.scripturePassages.map((p, i) => (
            <View key={i} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <View style={{ backgroundColor: "#d97706", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{p.reference}</Text>
              </View>
              <Text style={{ fontSize: 15, fontStyle: "italic", color: "#78350f", lineHeight: 22, marginBottom: 10 }}>"{p.text}"</Text>
              <Text style={{ fontSize: 13, color: "#92400e" }}>{p.explanation}</Text>
            </View>
          ))}
        </View>
      );
      case 2: return (
        <View>
          {parsedTopic.mainArguments.map((a, i) => (
            <View key={i} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#d97706", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>{i + 1}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: "#78350f" }}>{a.title}</Text>
              </View>
              <Text style={{ fontSize: 14, color: "#92400e", lineHeight: 22 }}>{a.content}</Text>
            </View>
          ))}
        </View>
      );
      case 3: return (
        <View>
          {parsedTopic.churchFathersQuotes.map((q, i) => (
            <View key={i} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#d97706" }}>
              <Text style={{ fontSize: 14, color: "#78350f", fontStyle: "italic", lineHeight: 22, marginBottom: 10 }}>"{q.quote}"</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#78350f" }}>— {q.father}</Text>
              <Text style={{ fontSize: 12, color: "#92400e" }}>{q.work}</Text>
            </View>
          ))}
        </View>
      );
      case 4: return (
        <View>
          {parsedTopic.practicalTips.map((tip, i) => (
            <View key={i} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 11, color: "#fff", fontWeight: "700" }}>✓</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: "#78350f" }}>{tip}</Text>
            </View>
          ))}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#d97706" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>Topic Generator</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>AI-powered apologetics pages</Text>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: "#fffbeb", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 4 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#78350f", marginBottom: 12 }}>Enter an Objection</Text>
            <TextInput
              style={{ backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, fontSize: 15, color: "#78350f", borderWidth: 1, borderColor: "#fde68a", marginBottom: 12, minHeight: 70, textAlignVertical: "top" }}
              placeholder="e.g. Why do Catholics pray to dead people?"
              placeholderTextColor="#d97706"
              value={objection}
              onChangeText={setObjection}
              multiline
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {EXAMPLE_OBJECTIONS.map((ex) => (
                  <TouchableOpacity key={ex} style={{ backgroundColor: "#fef3c7", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => setObjection(ex)}>
                    <Text style={{ fontSize: 12, color: "#78350f" }}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={{ backgroundColor: isGenerating ? "#fcd34d" : "#d97706", borderRadius: 12, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
              onPress={generate}
              disabled={isGenerating}
            >
              {isGenerating ? <ActivityIndicator size="small" color="#78350f" /> : <Feather name="zap" size={18} color="#fff" />}
              <Text style={{ color: isGenerating ? "#78350f" : "#fff", fontWeight: "700", fontSize: 15 }}>
                {isGenerating ? "Generating..." : "Generate Topic"}
              </Text>
            </TouchableOpacity>
          </View>

          {isGenerating && !parsedTopic && rawOutput.length > 0 && (
            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: "#92400e" }} numberOfLines={4}>{rawOutput}</Text>
            </View>
          )}

          {parsedTopic && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {TABS.map((tab, i) => (
                    <TouchableOpacity key={tab} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: activeTab === i ? "#d97706" : "#fff" }} onPress={() => setActiveTab(i)}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: activeTab === i ? "#fff" : "#78350f" }}>{tab}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {renderContent()}
              <TouchableOpacity
                style={{ backgroundColor: "#d97706", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 16, flexDirection: "row", justifyContent: "center", gap: 8 }}
                onPress={handleSave}
              >
                <Feather name="bookmark" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Save to Study</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
