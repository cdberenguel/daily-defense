import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const CATEGORIES = ["General", "Scripture", "Arguments", "Personal", "Study"];

export default function NotesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { notes, addNote, deleteNote, incrementStat } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [search, setSearch] = useState("");

  const filtered = notes.filter(
    (n) => search.trim() === "" || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!title.trim()) { Alert.alert("Enter a title"); return; }
    if (!content.trim()) { Alert.alert("Enter note content"); return; }
    await addNote({ title: title.trim(), content: content.trim(), category });
    await incrementStat("topicsStudied");
    setTitle(""); setContent(""); setCategory("General"); setShowModal(false);
  };

  const handleDelete = (id: string, noteTitle: string) => {
    Alert.alert("Delete Note", `Delete "${noteTitle}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNote(id) },
    ]);
  };

  const CATEGORY_COLORS: Record<string, string> = {
    General: "#64748b", Scripture: "#4f46e5", Arguments: "#dc2626", Personal: "#9333ea", Study: "#d97706",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#059669" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: "#fff" }}>My Notes</Text>
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
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {filtered.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Feather name="edit-3" size={40} color="#bbf7d0" />
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#15803d", marginTop: 16, marginBottom: 8 }}>No notes yet</Text>
              <Text style={{ fontSize: 14, color: "#16a34a", textAlign: "center" }}>Tap + to add your first apologetics note</Text>
            </View>
          )}
          {filtered.map((note) => (
            <View key={note.id} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={{ backgroundColor: CATEGORY_COLORS[note.category] + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: CATEGORY_COLORS[note.category] }}>{note.category}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>{note.title}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(note.id, note.title)}>
                  <Feather name="trash-2" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 14, color: "#475569", lineHeight: 20 }} numberOfLines={4}>{note.content}</Text>
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
    </SafeAreaView>
  );
}
