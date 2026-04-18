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

const DEFAULT_SYSTEM = `You are an expert Catholic apologist with deep knowledge of Scripture, Church Fathers, Sacred Tradition, and Catholic theology. Your goal is to provide clear, charitable, and well-reasoned responses to questions about the Catholic faith.

Always:
- Use Scripture, Tradition, and reason
- Be charitable toward those with objections
- Cite specific Church Fathers and councils when relevant
- Give concise but thorough responses (200-400 words)
- Acknowledge valid points in the objection before answering`;

export default function ApologeticsScreen() {
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
      body: JSON.stringify({ title: `Apologetics - ${new Date().toLocaleDateString()}`, mode: "apologetics" }),
    });
    const data = await res.json();
    setConversationId(data.id);
    return data.id;
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsStreaming(true);

    const convId = await startOrGetConversation();
    let assistantContent = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const { fetch: expoFetch } = await import("expo/fetch");
      const response = await expoFetch(`${baseUrl}/api/anthropic/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userMsg,
          model: deepthink ? "deepthink" : "standard",
          systemPromptOverride: DEFAULT_SYSTEM,
        }),
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
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  return updated;
                });
                scrollRef.current?.scrollToEnd({ animated: false });
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, I encountered an error. Please try again." };
        return updated;
      });
    }

    setIsStreaming(false);
    incrementStat("debatesCompleted");
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>Apologetics AI</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{deepthink ? "Expert Mode (Opus)" : "Standard Mode (Sonnet)"}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 12, color: colors.gold, fontWeight: "600" }}>DeepThink</Text>
          <Switch
            value={deepthink}
            onValueChange={setDeepthink}
            trackColor={{ false: "rgba(255,255,255,0.2)", true: colors.gold }}
            thumbColor={deepthink ? colors.navy : "#fff"}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: colors.cream }}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 28, color: colors.gold }}>✝</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.navy, marginBottom: 8 }}>Apologetics AI</Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>
                Ask me any question about Catholic teaching, common objections, or how to respond to critics of the faith.
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 24, justifyContent: "center" }}>
                {["Why do Catholics pray to saints?", "Is the Pope infallible?", "What is Purgatory?", "How do I respond to sola scriptura?"].map((q) => (
                  <TouchableOpacity key={q} style={{ backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }} onPress={() => setInput(q)}>
                    <Text style={{ fontSize: 13, color: colors.navy }}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg, i) => (
            <View key={i} style={{ marginBottom: 12, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.gold }}>✝</Text>
                </View>
              )}
              <View style={{ maxWidth: "85%", backgroundColor: msg.role === "user" ? colors.navy : "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                <Text style={{ fontSize: 15, color: msg.role === "user" ? "#fff" : colors.navy, lineHeight: 22 }}>{msg.content}</Text>
                {isStreaming && i === messages.length - 1 && msg.role === "assistant" && msg.content.length === 0 && (
                  <ActivityIndicator size="small" color={colors.navy} />
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={{ flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: colors.border }}>
          <TextInput
            style={{ flex: 1, backgroundColor: colors.parchment, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.navy, maxHeight: 120 }}
            placeholder="Ask about the faith..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isStreaming ? colors.mutedForeground : colors.navy, alignItems: "center", justifyContent: "center" }}
            onPress={sendMessage}
            disabled={isStreaming}
          >
            {isStreaming ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
