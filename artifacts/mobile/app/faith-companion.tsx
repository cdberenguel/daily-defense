import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getApiBaseUrl } from "@/utils/streaming";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a warm, compassionate Catholic spiritual director and faith companion. Your role is to support Catholics in their spiritual journey, answer questions about prayer, the sacraments, growing in virtue, and deepening their relationship with God and the Church.

Your tone is:
- Warm, pastoral, and encouraging
- Rooted in Scripture and Catholic Tradition
- Personal and relational, not just academic
- Gentle with those struggling in faith

You help with: understanding Church teachings, growing in prayer, discernment, overcoming sin, understanding the saints, living the faith daily, and spiritual formation.`;

export default function FaithCompanionScreen() {
  const router = useRouter();
  const colors = useColors();
  const { incrementStat } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [deepthink, setDeepthink] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const baseUrl = getApiBaseUrl();

  const startOrGetConversation = async (): Promise<number> => {
    if (conversationId) return conversationId;
    const res = await fetch(`${baseUrl}/api/anthropic/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Faith Companion - ${new Date().toLocaleDateString()}`, mode: "faith-companion" }),
    });
    const data = await res.json();
    setConversationId(data.id);
    return data.id;
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsStreaming(true);

    const convId = await startOrGetConversation();
    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const { fetch: expoFetch } = await import("expo/fetch");
      const response = await expoFetch(`${baseUrl}/api/anthropic/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg, model: deepthink ? "deepthink" : "standard", systemPromptOverride: SYSTEM_PROMPT }),
      });
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantContent += data.content;
                setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; });
                scrollRef.current?.scrollToEnd({ animated: false });
              }
            } catch {}
          }
        }
      }
    } catch {}

    setIsStreaming(false);
    incrementStat("debatesCompleted");
  };

  const STARTERS = ["How do I grow in prayer?", "I'm struggling with my faith", "How do I prepare for Confession?", "Who are the Church Fathers?"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#9333ea" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>Faith Companion</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{deepthink ? "Expert Mode" : "Standard Mode"}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 12, color: "#e879f9", fontWeight: "600" }}>DeepThink</Text>
          <Switch value={deepthink} onValueChange={setDeepthink} trackColor={{ false: "rgba(255,255,255,0.2)", true: "#e879f9" }} thumbColor="#fff" style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: "#fdf4ff" }} contentContainerStyle={{ padding: 16 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {messages.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#9333ea", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Feather name="heart" size={28} color="#fff" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#6b21a8", marginBottom: 8 }}>Faith Companion</Text>
              <Text style={{ fontSize: 14, color: "#7c3aed", textAlign: "center", lineHeight: 20, maxWidth: 280 }}>Your personal Catholic spiritual director. Ask about prayer, the sacraments, growing in virtue, and living the faith.</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 24, justifyContent: "center" }}>
                {STARTERS.map((q) => (
                  <TouchableOpacity key={q} style={{ backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => setInput(q)}>
                    <Text style={{ fontSize: 13, color: "#6b21a8" }}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {messages.map((msg, i) => (
            <View key={i} style={{ marginBottom: 12, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <View style={{ maxWidth: "85%", backgroundColor: msg.role === "user" ? "#9333ea" : "#fff", borderRadius: 16, padding: 14 }}>
                <Text style={{ fontSize: 15, color: msg.role === "user" ? "#fff" : "#6b21a8", lineHeight: 22 }}>{msg.content}</Text>
                {isStreaming && i === messages.length - 1 && msg.role === "assistant" && !msg.content && <ActivityIndicator size="small" color="#9333ea" />}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e9d5ff" }}>
          <TextInput style={{ flex: 1, backgroundColor: "#fdf4ff", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: "#6b21a8", maxHeight: 120 }} placeholder="Share what's on your heart..." placeholderTextColor="#a855f7" value={input} onChangeText={setInput} multiline />
          <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isStreaming ? "#a855f7" : "#9333ea", alignItems: "center", justifyContent: "center" }} onPress={sendMessage} disabled={isStreaming}>
            {isStreaming ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
