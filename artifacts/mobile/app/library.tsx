import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const LIBRARY_CATEGORIES = [
  {
    category: "Catechism",
    color: "#0369a1",
    bg: "#e0f2fe",
    documents: [
      { title: "Catechism of the Catholic Church", desc: "Full text of the CCC", url: "https://www.usccb.org/sites/default/files/flipbooks/catechism/" },
      { title: "CCC Compendium", desc: "Shorter summary of the CCC", url: "https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_en.html" },
    ],
  },
  {
    category: "Vatican Documents",
    color: "#7c3aed",
    bg: "#f3e8ff",
    documents: [
      { title: "Lumen Gentium", desc: "Dogmatic Constitution on the Church (Vatican II)", url: "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19641121_lumen-gentium_en.html" },
      { title: "Dei Verbum", desc: "Divine Revelation (Vatican II)", url: "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_en.html" },
      { title: "Gaudium et Spes", desc: "Church in the Modern World (Vatican II)", url: "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651207_gaudium-et-spes_en.html" },
    ],
  },
  {
    category: "Encyclicals",
    color: "#b45309",
    bg: "#fef3c7",
    documents: [
      { title: "Deus Caritas Est", desc: "God is Love — Benedict XVI", url: "https://www.vatican.va/content/benedict-xvi/en/encyclicals/documents/hf_ben-xvi_enc_20051225_deus-caritas-est.html" },
      { title: "Veritatis Splendor", desc: "The Splendor of Truth — John Paul II", url: "https://www.vatican.va/content/john-paul-ii/en/encyclicals/documents/hf_jp-ii_enc_06081993_veritatis-splendor.html" },
      { title: "Fides et Ratio", desc: "Faith and Reason — John Paul II", url: "https://www.vatican.va/content/john-paul-ii/en/encyclicals/documents/hf_jp-ii_enc_15101998_fides-et-ratio.html" },
    ],
  },
  {
    category: "Apologetics Resources",
    color: "#1e3a8a",
    bg: "#dbeafe",
    documents: [
      { title: "Catholic Answers", desc: "The largest Catholic apologetics site", url: "https://www.catholic.com" },
      { title: "New Advent", desc: "Catholic Encyclopedia and Church Fathers", url: "https://www.newadvent.org" },
      { title: "EWTN Document Library", desc: "Vast collection of Catholic documents", url: "https://www.ewtn.com/catholicism/library" },
    ],
  },
  {
    category: "Church Fathers",
    color: "#065f46",
    bg: "#d1fae5",
    documents: [
      { title: "Early Christian Writings", desc: "Patristic texts online", url: "https://www.earlychristianwritings.com" },
      { title: "Church Fathers (EWTN)", desc: "Writings of the Fathers", url: "https://www.ewtn.com/catholicism/library/church-fathers-1568" },
      { title: "Nicene & Post-Nicene Fathers", desc: "Classic patristic library", url: "https://www.newadvent.org/fathers/" },
    ],
  },
];

export default function LibraryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0369a1" }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>Catholic Library</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Official documents & apologetics resources</Text>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: "#f0f9ff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 4 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {LIBRARY_CATEGORIES.map((cat) => (
            <View key={cat.category} style={{ marginBottom: 14 }}>
              <TouchableOpacity
                style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                onPress={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
              >
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: cat.bg, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="folder" size={20} color={cat.color} />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: cat.color }}>{cat.category}</Text>
                <Text style={{ fontSize: 13, color: "#94a3b8", marginRight: 4 }}>{cat.documents.length}</Text>
                <Feather name={expandedCategory === cat.category ? "chevron-up" : "chevron-down"} size={18} color="#94a3b8" />
              </TouchableOpacity>

              {expandedCategory === cat.category && (
                <View style={{ backgroundColor: "#fff", borderRadius: 14, marginTop: 4, overflow: "hidden" }}>
                  {cat.documents.map((doc, i) => (
                    <TouchableOpacity
                      key={doc.title}
                      style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#f1f5f9" }}
                      onPress={() => Linking.openURL(doc.url)}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: cat.bg, alignItems: "center", justifyContent: "center" }}>
                        <Feather name="external-link" size={16} color={cat.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 }}>{doc.title}</Text>
                        <Text style={{ fontSize: 12, color: "#64748b" }}>{doc.desc}</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
