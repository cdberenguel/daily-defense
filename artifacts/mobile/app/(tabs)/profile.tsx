import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { profile, achievements, stats, notes, updateProfile } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const xpForNextLevel = profile.level * 100;
  const xpProgress = (profile.xp % 100) / 100;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ avatarUri: result.assets[0].uri });
    }
  };

  const saveName = async () => {
    if (nameInput.trim()) {
      await updateProfile({ name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const STAT_CARDS = [
    { label: "Conversations", value: stats.debatesCompleted, icon: "message-circle" as const },
    { label: "Topics Studied", value: stats.topicsStudied, icon: "book-open" as const },
    { label: "Prayers", value: stats.prayersGenerated, icon: "heart" as const },
    { label: "Notes", value: notes.length, icon: "edit-3" as const },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 4 }}>Profile</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Your apologetics journey</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>

          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 20, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }}>
            <TouchableOpacity onPress={pickImage} style={{ marginBottom: 12 }}>
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.gold }} />
              ) : (
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: colors.gold }}>
                  <Text style={{ fontSize: 36, color: colors.gold }}>✝</Text>
                </View>
              )}
              <View style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: colors.gold, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" }}>
                <Feather name="camera" size={13} color={colors.navy} />
              </View>
            </TouchableOpacity>

            {editingName ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <TextInput
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 18, fontWeight: "700", color: colors.navy, minWidth: 150 }}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                />
                <TouchableOpacity onPress={saveName}>
                  <Feather name="check" size={20} color={colors.navy} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setNameInput(profile.name); setEditingName(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.navy }}>{profile.name}</Text>
                <Feather name="edit-2" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}

            <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 14 }}>Level {profile.level} Apologist</Text>

            <View style={{ width: "100%", marginBottom: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>XP Progress</Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.navy }}>{profile.xp % 100} / 100</Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.parchment, borderRadius: 4, overflow: "hidden" }}>
                <View style={{ width: `${xpProgress * 100}%`, height: "100%", backgroundColor: colors.gold, borderRadius: 4 }} />
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            {STAT_CARDS.map((stat) => (
              <View key={stat.label} style={{ flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                <Feather name={stat.icon} size={20} color={colors.navy} style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.navy }}>{stat.value}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy }}>Achievements</Text>
            <Text style={{ fontSize: 13, color: colors.gold, fontWeight: "600" }}>{unlockedAchievements.length}/{achievements.length}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {achievements.map((ach) => (
                <TouchableOpacity
                  key={ach.id}
                  style={{ width: 120, backgroundColor: ach.unlocked ? colors.navy : "#fff", borderRadius: 14, padding: 14, alignItems: "center", opacity: ach.unlocked ? 1 : 0.5, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
                  onPress={() => router.push(`/achievement/${ach.id}` as any)}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ach.unlocked ? "rgba(255,255,255,0.1)" : colors.parchment, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Feather name={ach.icon as any} size={22} color={ach.unlocked ? colors.gold : colors.mutedForeground} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: ach.unlocked ? "#fff" : colors.navy, textAlign: "center" }} numberOfLines={2}>{ach.title}</Text>
                  {!ach.unlocked && (
                    <View style={{ width: "100%", marginTop: 6 }}>
                      <View style={{ height: 4, backgroundColor: colors.parchment, borderRadius: 2, overflow: "hidden" }}>
                        <View style={{ width: `${Math.min((ach.progress / ach.threshold) * 100, 100)}%`, height: "100%", backgroundColor: colors.gold, borderRadius: 2 }} />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 16, gap: 12, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            onPress={() => router.push("/notes" as any)}
          >
            <Feather name="edit-3" size={20} color={colors.navy} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.navy }}>My Notes</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{notes.length} notes</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
