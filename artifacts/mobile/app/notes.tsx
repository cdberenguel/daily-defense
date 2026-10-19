import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert, Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp, type Note } from "@/context/AppContext";

const CATEGORIES = ["General", "Scripture", "Arguments", "Personal", "Study", "Prayer"];

export default function NotesScreen() {
  const router = useRouter();
  const { category: initialCategory } = useLocalSearchParams<{ category?: string }>();
  const colors = useColors();
  const { notes, addNote, deleteNote, incrementStat } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [openedNote, setOpenedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(initialCategory === "Prayer" ? "Prayer" : "All");

  const filtered = notes.filter(
    (n) =>
      (categoryFilter === "All" || n.category === categoryFilter) &&
      (search.trim() === "" ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()))
  );
  const prayerNotesCount = notes.filter((note) => note.category === "Prayer").length;

  const handleAdd = async () => {
    if (!title.trim()) { Alert.alert("Enter a title"); return; }
    if (!content.trim()) { Alert.alert("Enter note content"); return; }
    await addNote({ title: title.trim(), content: content.trim(), category });
    await incrementStat("topicsStudied");
    setTitle(""); setContent(""); setCategory("General"); setShowModal(false);
  };

  const handleDelete = (id: string) => {
    void deleteNote(id).catch(() => {
      Alert.alert("Delete failed", "The note was removed from this list but could not be deleted from offline storage.");
    });
  };

  const CATEGORY_COLORS: Record<string, string> = {
    General: "#64748b", Scripture: "#4f46e5", Arguments: "#dc2626", Personal: "#9333ea", Study: "#d97706", Prayer: colors.navy,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#059669" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: "#fff" }}>
          {categoryFilter === "Prayer" ? "Prayer Notes" : "My Notes"}
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, padding: 8 }}
          onPress={() => setShowModal(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: "#f0fdf4", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 4 }}>
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
            <Feather name="search" size={16} color="#94a3b8" />
            <TextInput style={{ flex: 1, fontSize: 15, color: "#0f172a" }} placeholder="Search notes..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { key: "All", label: "All Notes", count: notes.length },
                { key: "Prayer", label: "Prayer Notes", count: prayerNotesCount },
              ].map((filter) => {
                const active = categoryFilter === filter.key;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    testID={`notes-filter-${filter.key.toLowerCase()}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setCategoryFilter(filter.key)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                      paddingHorizontal: 13,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? "#059669" : "#fff",
                      borderWidth: 1,
                      borderColor: active ? "#059669" : "#dcfce7",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#fff" : "#166534" }}>
                      {filter.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: active ? "#fff" : "#16a34a" }}>{filter.count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {filtered.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Feather name="edit-3" size={40} color="#bbf7d0" />
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#15803d", marginTop: 16, marginBottom: 8 }}>
                {categoryFilter === "Prayer" ? "No prayer notes yet" : "No notes yet"}
              </Text>
              <Text style={{ fontSize: 14, color: "#16a34a", textAlign: "center" }}>
                {categoryFilter === "Prayer"
                  ? "Save a generated prayer from the Prayer tab to keep it available offline."
                  : "Tap + to add your first apologetics note"}
              </Text>
            </View>
          )}
          {filtered.map((note) => (
            <View key={note.id} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={{ backgroundColor: `${CATEGORY_COLORS[note.category] ?? colors.mutedForeground}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: CATEGORY_COLORS[note.category] ?? colors.mutedForeground }}>{note.category}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>{note.title}</Text>
                </View>
                <TouchableOpacity
                  testID={`delete-note-${note.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${note.title}`}
                  onPress={() => handleDelete(note.id)}
                  hitSlop={8}
                >
                  <Feather name="trash-2" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                testID={`open-note-${note.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Open ${note.title}`}
                onPress={() => setOpenedNote(note)}
              >
                <Text style={{ fontSize: 14, color: "#475569", lineHeight: 20 }} numberOfLines={4}>{note.content}</Text>
                <Text style={{ fontSize: 11, color: "#16a34a", marginTop: 7 }}>Tap to read full note</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>{new Date(note.createdAt).toLocaleDateString()}</Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>New Note</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Feather name="x" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 }}>Title</Text>
            <TextInput style={{ backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, fontSize: 15, color: "#0f172a", marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" }} placeholder="Note title..." value={title} onChangeText={setTitle} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 }}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: category === cat ? "#059669" : "#f1f5f9" }} onPress={() => setCategory(cat)}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: category === cat ? "#fff" : "#475569" }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 }}>Content</Text>
            <TextInput style={{ backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, fontSize: 15, color: "#0f172a", borderWidth: 1, borderColor: "#e2e8f0", minHeight: 160, textAlignVertical: "top", marginBottom: 24 }} placeholder="Write your note here..." value={content} onChangeText={setContent} multiline />
            <TouchableOpacity style={{ backgroundColor: "#059669", borderRadius: 12, padding: 16, alignItems: "center" }} onPress={handleAdd}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Note</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={openedNote !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpenedNote(null)}
      >
        {openedNote && (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>
                  {openedNote.category === "Prayer" ? "Prayer Note" : openedNote.category}
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.navy }}>{openedNote.title}</Text>
              </View>
              <TouchableOpacity
                testID="close-opened-note"
                accessibilityRole="button"
                accessibilityLabel="Close note"
                onPress={() => setOpenedNote(null)}
                hitSlop={10}
              >
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
              <Text style={{ fontSize: 16, color: colors.navy, lineHeight: 27, fontStyle: openedNote.category === "Prayer" ? "italic" : "normal" }}>
                {openedNote.content}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 20 }}>
                Saved {new Date(openedNote.createdAt).toLocaleDateString()}
              </Text>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
