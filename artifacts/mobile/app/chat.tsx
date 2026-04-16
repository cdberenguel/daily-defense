import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import { useColors } from "@/hooks/useColors";
import { useGetAnthropicConversation } from "@workspace/api-client-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  const params = useLocalSearchParams<{
    conversationId: string;
    title: string;
  }>();

  const conversationId = parseInt(params.conversationId ?? "0", 10);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const { data: conversation, refetch } = useGetAnthropicConversation(conversationId, {
    query: {
      enabled: !!conversationId,
    },
  });

  const allMessages: Message[] = [
    ...(conversation?.messages ?? []).map((m) => ({
      id: String(m.id),
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    ...localMessages,
  ];

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;
    const content = input.trim();
    setInput("");
    setIsSending(true);
    setStreamingContent("");

    const userMsg: Message = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content,
    };
    setLocalMessages((prev) => [...prev, userMsg]);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const response = await fetch(
        `${baseUrl}/api/anthropic/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to send message");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

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
                fullResponse += data.content;
                setStreamingContent(fullResponse);
              }
              if (data.done) {
                const assistantMsg: Message = {
                  id: `local-assistant-${Date.now()}`,
                  role: "assistant",
                  content: fullResponse,
                };
                setLocalMessages((prev) => [...prev, assistantMsg]);
                setStreamingContent("");
                refetch();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch {}
          }
        }
      }
    } catch {
      const errMsg: Message = {
        id: `local-err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setLocalMessages((prev) => [...prev, errMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
    }
  };

  const displayMessages = [...allMessages].reverse();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: params.title ?? "Chat",
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: colors.gold,
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
            color: colors.gold,
          },
          headerTitleNumberOfLines: 1,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: 8,
              paddingTop: Platform.OS === "web" ? insets.bottom + 34 : 8,
            },
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!!displayMessages.length}
          ListHeaderComponent={
            isSending && streamingContent ? (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={styles.assistantText}>
                  {streamingContent}
                  <Text style={{ color: colors.gold }}>▌</Text>
                </Text>
              </View>
            ) : isSending && !streamingContent ? (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <ActivityIndicator color={colors.gold} size="small" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user"
                  ? styles.userBubble
                  : styles.assistantBubble,
              ]}
            >
              {item.role === "assistant" && (
                <View style={styles.assistantBadge}>
                  <Text style={styles.crossText}>✝</Text>
                </View>
              )}
              <Text
                style={
                  item.role === "user"
                    ? styles.userText
                    : styles.assistantText
                }
              >
                {item.content}
              </Text>
            </View>
          )}
        />

        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom:
                Platform.OS === "web"
                  ? insets.bottom + 34
                  : insets.bottom + 8,
            },
          ]}
        >
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask a follow-up question..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || isSending}
            activeOpacity={0.7}
          >
            <Feather name="send" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    bubble: {
      maxWidth: "85%",
      borderRadius: 16,
      padding: 14,
      marginBottom: 4,
    },
    userBubble: {
      backgroundColor: colors.navy,
      alignSelf: "flex-end",
    },
    assistantBubble: {
      backgroundColor: colors.card,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    assistantBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginTop: 1,
    },
    crossText: {
      color: colors.gold,
      fontSize: 12,
    },
    userText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: "#ffffff",
      lineHeight: 22,
    },
    assistantText: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      lineHeight: 22,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      gap: 8,
    },
    input: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      maxHeight: 120,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: {
      backgroundColor: colors.muted,
    },
  });
}
