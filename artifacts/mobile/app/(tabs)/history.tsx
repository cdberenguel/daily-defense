import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  useListAnthropicConversations,
  useDeleteAnthropicConversation,
} from "@workspace/api-client-react";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  const { data: conversations, refetch } = useListAnthropicConversations();
  const { mutate: deleteConversation } = useDeleteAnthropicConversation();

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteConversation(
              { id },
              { onSuccess: () => refetch() }
            );
          },
        },
      ]
    );
  };

  const handleOpen = (id: number, title: string) => {
    router.push({
      pathname: "/chat",
      params: { conversationId: id, title },
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversation History</Text>
        <Text style={styles.headerSubtitle}>Your apologetics sessions</Text>
      </View>

      {!conversations || conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-square" size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>
            Tap an objection on the Objections tab to start a conversation with
            the AI apologetics assistant.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContainer,
            {
              paddingBottom:
                Platform.OS === "web"
                  ? insets.bottom + 34 + 84
                  : insets.bottom + 100,
            },
          ]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleOpen(item.id, item.title)}
              activeOpacity={0.8}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.crossText}>✝</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardDate}>
                  {formatDate(item.createdAt as unknown as string)}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <Feather name="chevron-right" size={18} color={colors.gold} />
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.deleteButton}
                >
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      paddingTop: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.navy,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.gold,
      fontFamily: "Inter_700Bold",
    },
    headerSubtitle: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    listContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 10,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    crossText: {
      color: colors.gold,
      fontSize: 16,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: colors.foreground,
      lineHeight: 22,
    },
    cardDate: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 4,
    },
    cardActions: {
      alignItems: "center",
      gap: 12,
    },
    deleteButton: {
      padding: 4,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
      gap: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    emptyText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 22,
    },
  });
}
