import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getTopicContent } from "@/utils/topicContent";
import { useApp } from "@/context/AppContext";

const TABS = ["Summary", "Scripture", "Arguments", "Fathers", "Tips"];

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { incrementStat } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const topic = getTopicContent(id!);

  React.useEffect(() => {
    if (topic) {
      incrementStat("topicsStudied");
    }
  }, []);

  if (!topic) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 18, color: colors.navy, fontWeight: "700", marginBottom: 8 }}>Topic not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.gold }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    await Share.share({
      message: `${topic.title}\n\n${topic.summary}\n\nShared from Daily Defense`,
      title: topic.title,
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <Text style={{ fontSize: 15, lineHeight: 24, color: colors.navy }}>{topic.summary}</Text>
            </View>
            <View style={{ backgroundColor: colors.navy, borderRadius: 16, padding: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gold, marginBottom: 8 }}>Common Mistakes to Avoid</Text>
              {topic.commonMistakes.map((m, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
                  <Text style={{ color: "#ef4444", fontSize: 14, fontWeight: "700" }}>✗</Text>
                  <Text style={{ flex: 1, fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20 }}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={{ gap: 14 }}>
            {topic.scripturePassages.map((passage, i) => (
              <View key={i} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
                <View style={{ backgroundColor: colors.gold, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{passage.reference}</Text>
                </View>
                <Text style={{ fontSize: 15, color: colors.navy, fontStyle: "italic", lineHeight: 22, marginBottom: 12 }}>"{passage.text}"</Text>
                <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12 }} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy, marginBottom: 4 }}>Application</Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, lineHeight: 20 }}>{passage.explanation}</Text>
              </View>
            ))}
          </View>
        );

      case 2:
        return (
          <View style={{ gap: 14 }}>
            {topic.mainArguments.map((arg, i) => (
              <View key={i} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gold }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: colors.navy }}>{arg.title}</Text>
                </View>
                <Text style={{ fontSize: 14, color: colors.navy, lineHeight: 22 }}>{arg.content}</Text>
              </View>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={{ gap: 14 }}>
            {topic.churchFathersQuotes.map((quote, i) => (
              <View key={i} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: colors.gold, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
                <Text style={{ fontSize: 15, color: colors.navy, fontStyle: "italic", lineHeight: 24, marginBottom: 14 }}>"{quote.quote}"</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy }}>— {quote.father}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>{quote.work}</Text>
              </View>
            ))}
          </View>
        );

      case 4:
        return (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy, marginBottom: 4 }}>Practical Tips</Text>
            {topic.practicalTips.map((tip, i) => (
              <View key={i} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, flexDirection: "row", gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: colors.navy, lineHeight: 20 }}>{tip}</Text>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <View style={{ backgroundColor: colors.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.navy }}>{topic.category}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleShare}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="share" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", lineHeight: 28 }}>{topic.title}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48, marginBottom: 2 }}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
      >
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: activeTab === i ? colors.gold : "rgba(255,255,255,0.12)" }}
            onPress={() => setActiveTab(i)}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: activeTab === i ? colors.navy : "#fff" }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          {renderTabContent()}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
