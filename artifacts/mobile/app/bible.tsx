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
import { getApiBaseUrl } from "@/utils/streaming";

const FEATURED_VERSES = [
  { ref: "John 6:53", preview: "Unless you eat the flesh of the Son of Man..." },
  { ref: "Matthew 16:18", preview: "You are Peter, and on this rock..." },
  { ref: "Luke 1:28", preview: "Hail, full of grace, the Lord is with you..." },
  { ref: "2 Thessalonians 2:15", preview: "Hold to the traditions..." },
  { ref: "James 2:24", preview: "Not by faith alone..." },
  { ref: "John 20:23", preview: "If you forgive the sins of any..." },
];

interface VerseResult {
  reference: string;
  text: string;
}

export default function BibleScreen() {
  const router = useRouter();
  const colors = useColors();
  const { incrementStat } = useApp();
  const [verseInput, setVerseInput] = useState("");
  const [verseResult, setVerseResult] = useState<VerseResult | null>(null);
  const [explanation, setExplanation] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const baseUrl = getApiBaseUrl();

  const fetchVerse = async (ref: string) => {
    setIsFetching(true);
    setVerseResult(null);
    setExplanation("");
    try {
      const encoded = encodeURIComponent(ref.toLowerCase().replace(/\s+/g, "+"));
      const res = await fetch(`https://bible-api.com/${encoded}?translation=kjv`);
      const data = await res.json();
      if (data.text && data.reference) {
        setVerseResult({ reference: data.reference, text: data.text.trim() });
        getExplanation(data.reference, data.text.trim());
      } else {
        Alert.alert("Verse not found", "Try a different format, e.g. 'John 6:53' or 'Matthew 16:18-19'");
      }
    } catch {
      Alert.alert("Error", "Could not fetch verse. Check your connection.");
    }
    setIsFetching(false);
  };

  const getExplanation = async (reference: string, text: string) => {
    setIsExplaining(true);
    setExplanation("");

    const convRes = await fetch(`${baseUrl}/api/anthropic/conversations`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Bible Study: ${reference}`, mode: "bible" }),
    });
    const convData = await convRes.json();
    const systemPrompt = `You are an expert Catholic biblical scholar. When given a Bible verse, explain:
1. The literal meaning and original context (1-2 sentences)
2. The Catholic theological significance (2-3 sentences)
3. How Catholics use this verse in apologetics (2-3 sentences)
4. A practical application for the faithful (1-2 sentences)

Be concise, scholarly, and pastoral.`;

    try {
      const { fetch: expoFetch } = await import("expo/fetch");
      const response = await expoFetch(`${baseUrl}/api/anthropic/conversations/${convData.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Explain this verse from a Catholic perspective: ${reference} — "${text}"`, systemPromptOverride: systemPrompt }),
      });
      const reader = response.body!.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try { const d = JSON.parse(line.slice(6)); if (d.content) setExplanation((prev) => prev + d.content); } catch {}
          }
        }
      }
    } catch {}
    setIsExplaining(false);
    incrementStat("versesStudied");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#4f46e5" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>Bible Study</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: "#eef2ff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 4 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#4f46e5", marginBottom: 12 }}>Look Up a Verse</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={{ flex: 1, backgroundColor: "#eef2ff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: "#312e81" }}
                placeholder="e.g. John 6:53"
                placeholderTextColor="#818cf8"
                value={verseInput}
                onChangeText={setVerseInput}
                returnKeyType="search"
                onSubmitEditing={() => fetchVerse(verseInput)}
              />
              <TouchableOpacity
                style={{ backgroundColor: "#4f46e5", borderRadius: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" }}
                onPress={() => fetchVerse(verseInput)}
                disabled={isFetching}
              >
                {isFetching ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="search" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={{ fontSize: 13, fontWeight: "700", color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Key Apologetics Verses</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {FEATURED_VERSES.map((v) => (
                <TouchableOpacity key={v.ref} style={{ width: 160, backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }} onPress={() => { setVerseInput(v.ref); fetchVerse(v.ref); }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#4f46e5", marginBottom: 4 }}>{v.ref}</Text>
                  <Text style={{ fontSize: 12, color: "#6366f1", lineHeight: 18 }} numberOfLines={3}>{v.preview}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {verseResult && (
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <View style={{ backgroundColor: "#4f46e5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{verseResult.reference}</Text>
              </View>
              <Text style={{ fontSize: 16, color: "#312e81", lineHeight: 26, fontStyle: "italic", marginBottom: 16 }}>"{verseResult.text}"</Text>

              <View style={{ height: 1, backgroundColor: "#e0e7ff", marginBottom: 16 }} />

              <Text style={{ fontSize: 14, fontWeight: "700", color: "#4f46e5", marginBottom: 8 }}>Catholic Explanation</Text>
              {isExplaining && !explanation && <ActivityIndicator size="small" color="#4f46e5" style={{ alignSelf: "flex-start" }} />}
              {explanation.length > 0 && <Text style={{ fontSize: 14, color: "#312e81", lineHeight: 22 }}>{explanation}</Text>}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
