import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getApiBaseUrl, streamFromEndpoint } from "@/utils/streaming";

type OpponentType = "Muslim" | "Atheist" | "Protestant";
type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface Message { role: "user" | "assistant"; content: string; }

const OPPONENT_SYSTEMS: Record<OpponentType, Record<Difficulty, string>> = {
  Muslim: {
    Beginner: `You are a curious, respectful Muslim who has basic questions about Catholic Christianity. Raise common Islamic objections to Christian beliefs like the Trinity, the divinity of Jesus, and the Bible being corrupted. Be polite and genuinely curious. Present objections simply. After 5-6 exchanges, naturally end the debate.`,
    Intermediate: `You are a knowledgeable Muslim who is well-versed in Islamic apologetics. Challenge Catholic beliefs about the Trinity (shirk), the divinity of Christ, the corruption of the Bible (tahrif), and saint veneration. Use Quranic references and Islamic arguments. Be respectful but persistent. After 6-8 exchanges, naturally end the debate.`,
    Advanced: `You are an expert Muslim apologist who knows both Islamic theology deeply and Catholic theology well enough to challenge it. Use the Quran, Hadith, and Islamic scholarship. Challenge the Trinity using Islamic philosophical arguments, attack Biblical reliability with specific textual criticism, challenge the Catholic view of salvation vs. Islam's. Be very knowledgeable and challenging. After 8-10 exchanges, naturally end the debate.`,
  },
  Atheist: {
    Beginner: `You are a skeptical person who doesn't believe in God and has basic questions about religion. Raise simple objections like "Why does God allow suffering?" and "Science explains everything." Be friendly and curious, not hostile. After 5-6 exchanges, naturally end the debate.`,
    Intermediate: `You are an educated atheist who has studied philosophy and science. Challenge Catholic beliefs with the problem of evil, the lack of evidence for God, the history of Church corruption, and scientific explanations for religious experience. Use philosophical arguments. Be intellectually honest but persistent. After 6-8 exchanges, naturally end the debate.`,
    Advanced: `You are an expert atheist philosopher and anti-theist. Challenge Catholicism with the problem of evil (Mackie's logical form), the Euthyphro dilemma, philosophical objections to the First Cause argument, the cognitive science of religion, Biblical contradictions, Church history scandals, and historical-critical issues with Christian origins. Be very challenging and intellectually formidable. After 8-10 exchanges, naturally end the debate.`,
  },
  Protestant: {
    Beginner: `You are a friendly evangelical Christian who has basic questions about Catholic practices that seem unbiblical to you. Ask about praying to saints, the Pope, Catholic works-based salvation, and using statues. Be genuinely curious and respectful. After 5-6 exchanges, naturally end the debate.`,
    Intermediate: `You are a knowledgeable evangelical Protestant who is well-versed in anti-Catholic apologetics. Challenge Catholic teaching on Tradition vs. Sola Scriptura, the Papacy, Mary, Purgatory, and the Mass. Reference Protestant Reformers and Scripture. Be friendly but firm. After 6-8 exchanges, naturally end the debate.`,
    Advanced: `You are an expert Reformed theologian who knows Catholic theology deeply and has studied it specifically to refute it. Challenge Catholicism on: justification by faith alone vs. Catholic works cooperation, the papacy and its historical problems, Marian dogmas lacking biblical support, transubstantiation, and the development of doctrine (is it legitimate or corruption?). Be extremely well-informed and challenging. After 8-10 exchanges, naturally end the debate.`,
  },
};

export default function OpponentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { incrementStat } = useApp();
  const [opponentType, setOpponentType] = useState<OpponentType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState("");
  const [startError, setStartError] = useState("");
  const [chatError, setChatError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const baseUrl = getApiBaseUrl();

  const startDebate = async () => {
    if (!opponentType || !difficulty || isStarting) return;
    setIsStarting(true);
    setStartError("");
    setChatError("");
    setConversationId(null);
    setMessages([]);
    const openingLine = opponentType === "Muslim"
      ? "Assalamu alaikum. I have some questions about your Catholic faith that I genuinely struggle with. Can we talk?"
      : opponentType === "Atheist"
      ? "I respect your faith, but I have to be honest — I just don't see the evidence for God. Can you help me understand why you believe?"
      : "I love Jesus too, and I respect Catholics as fellow Christians. But some of your practices really concern me biblically. Can we discuss them?";

    try {
      if (!baseUrl) throw new Error("The API address is not available.");
      const res = await fetch(`${baseUrl}/api/anthropic/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Practice vs. ${opponentType} (${difficulty})`,
          mode: "opponent",
        }),
      });
      if (!res.ok) throw new Error(`Conversation request failed (${res.status}).`);
      const data = (await res.json()) as { id?: unknown };
      if (typeof data.id !== "number" || !Number.isInteger(data.id)) {
        throw new Error("The conversation service returned an invalid session.");
      }
      setConversationId(data.id);
      setMessages([{ role: "assistant", content: openingLine }]);
    } catch {
      setStartError("Could not start the debate. Check your connection and try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async () => {
    const userMsg = input.trim();
    const activeConversationId = conversationId;
    if (!userMsg || isStreaming) return;
    if (!activeConversationId) {
      setChatError("This debate session is not connected. Go back and start a new debate.");
      return;
    }

    setInput("");
    setChatError("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamFromEndpoint(
      `${baseUrl}/api/anthropic/conversations/${activeConversationId}/messages`,
      {
        content: userMsg,
        systemPromptOverride: OPPONENT_SYSTEMS[opponentType!][difficulty!],
      },
      (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;
          const lastMessage = next[lastIndex];
          if (lastMessage?.role === "assistant") {
            next[lastIndex] = {
              role: "assistant",
              content: lastMessage.content + chunk,
            };
          }
          return next;
        });
        scrollRef.current?.scrollToEnd({ animated: false });
      },
      () => {
        setIsStreaming(false);
        scrollRef.current?.scrollToEnd({ animated: true });
      },
      () => {
        setIsStreaming(false);
        setChatError("The opponent could not respond. Your draft has been restored so you can try again.");
        setInput((current) => current || userMsg);
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          return lastMessage?.role === "assistant" && !lastMessage.content
            ? prev.slice(0, -1)
            : prev;
        });
      }
    );
  };

  const endAndReview = async () => {
    if (isReviewing || isStreaming || !messages.some((message) => message.role === "user")) {
      return;
    }
    setShowReview(true);
    setIsReviewing(true);
    setReview("");
    setReviewError("");
    const transcript = messages.map((m) => `${m.role === "user" ? "Catholic Defender" : opponentType}: ${m.content}`).join("\n\n");
    await streamFromEndpoint(
      `${baseUrl}/api/ai/review-session`,
      { transcript, opponentType: opponentType!, difficulty: difficulty! },
      (chunk) => setReview((prev) => prev + chunk),
      () => { setIsReviewing(false); incrementStat("sessionsFinished"); },
      () => {
        setIsReviewing(false);
        setReviewError("The session review could not be loaded. Please try again.");
      }
    );
  };

  if (!opponentType || !difficulty || !conversationId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#dc2626" }} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>Practice Opponent</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#fff7f7", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#7f1d1d", marginBottom: 16 }}>Choose Your Opponent</Text>
            {(["Muslim", "Atheist", "Protestant"] as OpponentType[]).map((type) => (
              <TouchableOpacity key={type} style={{ backgroundColor: opponentType === type ? "#dc2626" : "#fff", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: opponentType === type ? "#dc2626" : "#fecaca" }}
                onPress={() => setOpponentType(type)}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: opponentType === type ? "#fff" : "#7f1d1d" }}>{type}</Text>
              </TouchableOpacity>
            ))}
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#7f1d1d", marginTop: 20, marginBottom: 16 }}>Choose Difficulty</Text>
            {(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((d) => (
              <TouchableOpacity key={d} style={{ backgroundColor: difficulty === d ? "#dc2626" : "#fff", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: difficulty === d ? "#dc2626" : "#fecaca" }}
                onPress={() => setDifficulty(d)}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: difficulty === d ? "#fff" : "#7f1d1d" }}>{d}</Text>
              </TouchableOpacity>
            ))}
            {startError ? (
              <Text accessibilityRole="alert" style={{ color: "#b91c1c", fontSize: 14, marginTop: 8 }}>
                {startError}
              </Text>
            ) : null}
            <TouchableOpacity
              style={{ backgroundColor: opponentType && difficulty ? "#dc2626" : "#fca5a5", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 12 }}
              onPress={startDebate}
              disabled={!opponentType || !difficulty || isStarting}
            >
              {isStarting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}>Start Debate</Text>
              )}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  if (showReview) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#dc2626" }} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
          <TouchableOpacity onPress={() => { setShowReview(false); setOpponentType(null); setDifficulty(null); setMessages([]); setConversationId(null); setReview(""); setReviewError(""); }} style={{ marginRight: 12 }}>
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>AI Review</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#fff7f7", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {isReviewing && !review && <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 40 }} />}
            {reviewError ? (
              <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20 }}>
                <Text accessibilityRole="alert" style={{ fontSize: 14, color: "#991b1b", lineHeight: 22, marginBottom: 14 }}>{reviewError}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={endAndReview}
                  disabled={isReviewing}
                  style={{ alignSelf: "flex-start", backgroundColor: "#dc2626", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>Try review again</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {review.length > 0 && (
              <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20 }}>
                <Text style={{ fontSize: 15, color: "#7f1d1d", lineHeight: 24 }}>{review}</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#dc2626" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
        <TouchableOpacity onPress={() => { setOpponentType(null); setDifficulty(null); setMessages([]); setConversationId(null); setChatError(""); }} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}>vs. {opponentType}</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{difficulty} difficulty</Text>
        </View>
        <TouchableOpacity
          onPress={endAndReview}
          disabled={isStreaming || isReviewing || !messages.some((message) => message.role === "user")}
          style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, opacity: isStreaming || !messages.some((message) => message.role === "user") ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>End + Review</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: "#fff7f7" }} contentContainerStyle={{ padding: 16 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {chatError ? (
            <View accessibilityRole="alert" style={{ backgroundColor: "#fee2e2", borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <Text style={{ color: "#991b1b", fontSize: 13, lineHeight: 19 }}>{chatError}</Text>
            </View>
          ) : null}
          {messages.map((msg, i) => (
            <View key={i} style={{ marginBottom: 12, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && <Text style={{ fontSize: 12, color: "#991b1b", marginBottom: 4, fontWeight: "600" }}>{opponentType}</Text>}
              <View style={{ maxWidth: "85%", backgroundColor: msg.role === "user" ? colors.navy : "#fff", borderRadius: 16, padding: 14 }}>
                <Text style={{ fontSize: 15, color: msg.role === "user" ? "#fff" : "#7f1d1d", lineHeight: 22 }}>{msg.content}</Text>
                {isStreaming && i === messages.length - 1 && msg.role === "assistant" && !msg.content && <ActivityIndicator size="small" color="#dc2626" />}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#fecaca" }}>
          <TextInput style={{ flex: 1, backgroundColor: "#fff7f7", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.navy, maxHeight: 120 }} placeholder="Defend the faith..." placeholderTextColor="#94a3b8" value={input} onChangeText={setInput} multiline />
          <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isStreaming ? "#fca5a5" : "#dc2626", alignItems: "center", justifyContent: "center" }} onPress={sendMessage} disabled={isStreaming}>
            {isStreaming ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
