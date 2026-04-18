import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getApiBaseUrl } from "@/utils/streaming";

const TACTICS = [
  { id: "columbo", name: "Columbo Tactic", desc: "Ask questions to expose contradictions", prompt: "Teach me the Columbo tactic in Catholic apologetics. Give practical examples of how to use 'Just one more thing...' style questions to expose weaknesses in anti-Catholic arguments." },
  { id: "burden", name: "Burden of Proof", desc: "Put the burden on the critic", prompt: "Explain how to apply the concept of burden of proof in Catholic apologetics. When critics make claims against Catholicism, how do I effectively shift the conversation to require them to support their claims?" },
  { id: "stealing", name: "Stealing the Atheist's Bait", desc: "Turn objections into opportunities", prompt: "Explain the tactic of using an objection against the Catholic faith to your advantage. How do I use the question itself to point back to Catholic truth?" },
  { id: "common_ground", name: "Common Ground", desc: "Start with shared beliefs", prompt: "How do I find common ground with Protestants, atheists, and other critics before presenting Catholic arguments? Give specific examples with different types of critics." },
  { id: "tu_quoque", name: "Tu Quoque Defense", desc: "Handle 'your church is corrupt' attacks", prompt: "How do I handle the 'tu quoque' (you too) argument — when critics say the Catholic Church is morally corrupt? What is the proper Catholic response to historical scandals?" },
];

interface Message { role: "user" | "assistant"; content: string; }

export default function TacticsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { incrementStat } = useApp();
  const [selectedTactic, setSelectedTactic] = useState<typeof TACTICS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const baseUrl = getApiBaseUrl();

  const startConversation = async (prompt: string) => {
    setIsStreaming(true);
    const res = await fetch(`${baseUrl}/api/anthropic/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Tactics - ${new Date().toLocaleDateString()}`, mode: "tactics" }),
    });
    const data = await res.json();
    const convId = data.id;
    setConversationId(convId);
    setMessages([{ role: "user", content: prompt }]);
    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const { fetch: expoFetch } = await import("expo/fetch");
      const response = await expoFetch(`${baseUrl}/api/anthropic/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: prompt, model: "standard" }),
      });
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.content) {
                assistantContent += d.content;
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

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !conversationId) return;
    const userMsg = input.trim(); setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsStreaming(true);
    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const { fetch: expoFetch } = await import("expo/fetch");
      const response = await expoFetch(`${baseUrl}/api/anthropic/conversations/${conversationId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg }),
      });
      const reader = response.body!.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try { const d = JSON.parse(line.slice(6)); if (d.content) { assistantContent += d.content; setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; }); } } catch {}
          }
        }
      }
    } catch {}
    setIsStreaming(false);
  };

  if (!selectedTactic) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0369a1" }} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, marginBottom: 4 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>Tactics Workshop</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#f0f9ff", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 14, color: "#0369a1", marginBottom: 20, lineHeight: 20 }}>Select an apologetics tactic to learn and practice with AI coaching</Text>
            {TACTICS.map((tactic) => (
              <TouchableOpacity key={tactic.id} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}
                onPress={() => { setSelectedTactic(tactic); startConversation(tactic.prompt); }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#0369a1", marginBottom: 4 }}>{tactic.name}</Text>
                <Text style={{ fontSize: 14, color: "#475569" }}>{tactic.desc}</Text>
                <View style={{ alignSelf: "flex-end", marginTop: 8 }}>
                  <Feather name="chevron-right" size={18} color="#0369a1" />
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0369a1" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
        <TouchableOpacity onPress={() => { setSelectedTactic(null); setMessages([]); setConversationId(null); }} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}>{selectedTactic.name}</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Tactics Workshop</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: "#f0f9ff" }} contentContainerStyle={{ padding: 16 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {messages.map((msg, i) => (
            <View key={i} style={{ marginBottom: 12, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <View style={{ maxWidth: "85%", backgroundColor: msg.role === "user" ? "#0369a1" : "#fff", borderRadius: 16, padding: 14 }}>
                <Text style={{ fontSize: 15, color: msg.role === "user" ? "#fff" : "#0c4a6e", lineHeight: 22 }}>{msg.content}</Text>
                {isStreaming && i === messages.length - 1 && msg.role === "assistant" && !msg.content && <ActivityIndicator size="small" color="#0369a1" />}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e0f2fe" }}>
          <TextInput style={{ flex: 1, backgroundColor: "#f0f9ff", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: "#0c4a6e", maxHeight: 120 }} placeholder="Ask a follow-up question..." placeholderTextColor="#94a3b8" value={input} onChangeText={setInput} multiline />
          <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isStreaming ? "#94a3b8" : "#0369a1", alignItems: "center", justifyContent: "center" }} onPress={sendMessage} disabled={isStreaming}>
            {isStreaming ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
