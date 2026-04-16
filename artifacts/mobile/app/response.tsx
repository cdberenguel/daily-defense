import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import { useColors } from "@/hooks/useColors";
import { useCreateAnthropicConversation } from "@workspace/api-client-react";

export default function ResponseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  const params = useLocalSearchParams<{
    objectionId: string;
    objectionText: string;
    category: string;
  }>();

  const [conversationId, setConversationId] = useState<number | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const { mutateAsync: createConversation } = useCreateAnthropicConversation();

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startResponse();
  }, []);

  const startResponse = async () => {
    if (!params.objectionText) return;
    setIsLoading(true);
    setError(null);
    setStreamedText("");
    setIsDone(false);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const conversation = await createConversation({
        data: { title: params.objectionText },
      });

      setConversationId(conversation.id);

      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const response = await fetch(
        `${baseUrl}/api/anthropic/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: params.objectionText }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      setIsLoading(false);

      const reader = response.body.getReader();
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
                setStreamedText((prev) => prev + data.content);
              }
              if (data.done) {
                setIsDone(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setError("Failed to get a response. Please try again.");
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleContinue = () => {
    if (conversationId) {
      router.replace({
        pathname: "/chat",
        params: {
          conversationId,
          title: params.objectionText,
        },
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Apologetic Response",
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: colors.gold,
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
            color: colors.gold,
          },
        }}
      />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                Platform.OS === "web"
                  ? insets.bottom + 34 + 80
                  : insets.bottom + 80,
            },
          ]}
        >
          <View style={styles.objectionCard}>
            <View style={styles.objectionHeader}>
              <Text style={styles.objectionLabel}>Objection</Text>
            </View>
            <Text style={styles.objectionText}>{params.objectionText}</Text>
          </View>

          <View style={styles.responseSection}>
            <View style={styles.responseLabelRow}>
              <View style={styles.crossBadge}>
                <Text style={styles.crossText}>✝</Text>
              </View>
              <Text style={styles.responseLabel}>Catholic Response</Text>
            </View>

            {isLoading && !streamedText ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.gold} size="large" />
                <Text style={styles.loadingText}>
                  Generating apologetics response...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={32} color={colors.destructive} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={startResponse}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.responseText}>
                {streamedText}
                {!isDone && streamedText ? (
                  <Text style={{ color: colors.gold }}>▌</Text>
                ) : null}
              </Text>
            )}
          </View>
        </ScrollView>

        {isDone && (
          <View
            style={[
              styles.footer,
              {
                paddingBottom:
                  Platform.OS === "web"
                    ? insets.bottom + 34
                    : insets.bottom + 16,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Feather name="message-circle" size={18} color={colors.primaryForeground} />
              <Text style={styles.continueButtonText}>Continue Conversation</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      gap: 16,
    },
    objectionCard: {
      backgroundColor: colors.navy,
      borderRadius: colors.radius,
      overflow: "hidden",
    },
    objectionHeader: {
      backgroundColor: "rgba(255,255,255,0.1)",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    objectionLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.gold,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    objectionText: {
      fontSize: 16,
      fontFamily: "Inter_500Medium",
      color: "#ffffff",
      padding: 16,
      lineHeight: 24,
    },
    responseSection: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    responseLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.parchment,
    },
    crossBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    crossText: {
      color: colors.gold,
      fontSize: 14,
    },
    responseLabel: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.navy,
    },
    loadingContainer: {
      padding: 40,
      alignItems: "center",
      gap: 16,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
    },
    errorContainer: {
      padding: 32,
      alignItems: "center",
      gap: 16,
    },
    errorText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: colors.navy,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.gold,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    responseText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      lineHeight: 26,
      padding: 16,
    },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    continueButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.navy,
      borderRadius: colors.radius,
      paddingVertical: 14,
    },
    continueButtonText: {
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 16,
    },
  });
}
