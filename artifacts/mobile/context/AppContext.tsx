import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface SavedTopic {
  id: string;
  title: string;
  objection: string;
  summary: string;
  scripturePassages: { reference: string; text: string; explanation: string }[];
  mainArguments: { title: string; content: string }[];
  churchFathersQuotes: { father: string; work: string; quote: string }[];
  practicalTips: string[];
  commonMistakes: string[];
  savedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirement: string;
  threshold: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
}

export interface Profile {
  name: string;
  bio: string;
  avatarUri: string | null;
  level: number;
  xp: number;
}

export interface AppStats {
  debatesCompleted: number;
  topicsStudied: number;
  sessionsFinished: number;
  prayersGenerated: number;
  versesStudied: number;
  topicsGenerated: number;
}

interface AppContextType {
  notes: Note[];
  savedTopics: SavedTopic[];
  achievements: Achievement[];
  profile: Profile;
  stats: AppStats;
  addNote: (note: Omit<Note, "id" | "createdAt">) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  saveTopic: (topic: Omit<SavedTopic, "id" | "savedAt">) => Promise<void>;
  deleteSavedTopic: (id: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  incrementStat: (stat: keyof AppStats, amount?: number) => Promise<void>;
  checkAchievements: () => void;
}

const defaultProfile: Profile = {
  name: "Catholic Defender",
  bio: "Growing in faith and reason",
  avatarUri: null,
  level: 1,
  xp: 0,
};

const defaultStats: AppStats = {
  debatesCompleted: 0,
  topicsStudied: 0,
  sessionsFinished: 0,
  prayersGenerated: 0,
  versesStudied: 0,
  topicsGenerated: 0,
};

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlocked" | "unlockedAt" | "progress">[] = [
  { id: "first_debate", title: "First Defense", description: "Complete your first apologetics conversation", icon: "shield", category: "Practice", requirement: "Complete 1 apologetics conversation", threshold: 1 },
  { id: "five_debates", title: "Defender in Training", description: "Complete 5 apologetics conversations", icon: "shield", category: "Practice", requirement: "Complete 5 apologetics conversations", threshold: 5 },
  { id: "twenty_debates", title: "Seasoned Apologist", description: "Complete 20 apologetics conversations", icon: "award", category: "Practice", requirement: "Complete 20 conversations", threshold: 20 },
  { id: "first_opponent", title: "Into the Arena", description: "Complete a practice debate session", icon: "users", category: "Practice", requirement: "Complete 1 practice session", threshold: 1 },
  { id: "five_opponents", title: "Gladiator of Faith", description: "Complete 5 practice debate sessions", icon: "users", category: "Practice", requirement: "Complete 5 practice sessions", threshold: 5 },
  { id: "topics_studied_5", title: "Eager Learner", description: "Study 5 apologetics topics in depth", icon: "book-open", category: "Study", requirement: "Study 5 topics", threshold: 5 },
  { id: "topics_studied_20", title: "Doctor of Defense", description: "Study 20 apologetics topics in depth", icon: "book-open", category: "Study", requirement: "Study 20 topics", threshold: 20 },
  { id: "first_prayer", title: "Man of Prayer", description: "Generate your first AI prayer", icon: "heart", category: "Prayer", requirement: "Generate 1 prayer", threshold: 1 },
  { id: "ten_prayers", title: "Prayer Warrior", description: "Generate 10 AI prayers", icon: "heart", category: "Prayer", requirement: "Generate 10 prayers", threshold: 10 },
  { id: "first_verse", title: "Scripture Seeker", description: "Study your first Bible verse with AI", icon: "book", category: "Bible", requirement: "Study 1 verse", threshold: 1 },
  { id: "ten_verses", title: "Living the Word", description: "Study 10 Bible verses with AI", icon: "book", category: "Bible", requirement: "Study 10 verses", threshold: 10 },
  { id: "first_note", title: "Note Taker", description: "Save your first note", icon: "edit", category: "Notes", requirement: "Save 1 note", threshold: 1 },
  { id: "ten_notes", title: "Diligent Scribe", description: "Save 10 notes", icon: "edit", category: "Notes", requirement: "Save 10 notes", threshold: 10 },
  { id: "topic_generator", title: "Custom Apologist", description: "Generate your first custom topic", icon: "zap", category: "Study", requirement: "Generate 1 custom topic", threshold: 1 },
  { id: "five_topics_generated", title: "Topic Master", description: "Generate 5 custom topics", icon: "zap", category: "Study", requirement: "Generate 5 custom topics", threshold: 5 },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const notesRef = useRef<Note[]>([]);
  const notesWriteQueue = useRef<Promise<void>>(Promise.resolve());
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [stats, setStats] = useState<AppStats>(defaultStats);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [n, t, a, p, s] = await Promise.all([
        AsyncStorage.getItem("notes"),
        AsyncStorage.getItem("savedTopics"),
        AsyncStorage.getItem("achievements"),
        AsyncStorage.getItem("profile"),
        AsyncStorage.getItem("stats"),
      ]);
      if (n) {
        const storedNotes = JSON.parse(n) as Note[];
        notesRef.current = storedNotes;
        setNotes(storedNotes);
      }
      if (t) setSavedTopics(JSON.parse(t));
      if (p) setProfile(JSON.parse(p));
      if (s) setStats(JSON.parse(s));
      if (a) {
        setAchievements(JSON.parse(a));
      } else {
        const initial = ACHIEVEMENT_DEFINITIONS.map((def) => ({
          ...def,
          unlocked: false,
          progress: 0,
        }));
        setAchievements(initial);
        await AsyncStorage.setItem("achievements", JSON.stringify(initial));
      }
    } catch {}
  };

  const persistNotes = (updated: Note[]) => {
    const write = notesWriteQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem("notes", JSON.stringify(updated)));
    notesWriteQueue.current = write;
    return write;
  };

  const addNote = async (note: Omit<Note, "id" | "createdAt">) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notesRef.current];
    notesRef.current = updated;
    setNotes(updated);
    await persistNotes(updated);
  };

  const deleteNote = async (id: string) => {
    const updated = notesRef.current.filter((n) => n.id !== id);
    if (updated.length === notesRef.current.length) return;
    notesRef.current = updated;
    setNotes(updated);
    await persistNotes(updated);
  };

  const saveTopic = async (topic: Omit<SavedTopic, "id" | "savedAt">) => {
    const newTopic: SavedTopic = {
      ...topic,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      savedAt: new Date().toISOString(),
    };
    const updated = [newTopic, ...savedTopics];
    setSavedTopics(updated);
    await AsyncStorage.setItem("savedTopics", JSON.stringify(updated));
  };

  const deleteSavedTopic = async (id: string) => {
    const updated = savedTopics.filter((t) => t.id !== id);
    setSavedTopics(updated);
    await AsyncStorage.setItem("savedTopics", JSON.stringify(updated));
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    await AsyncStorage.setItem("profile", JSON.stringify(updated));
  };

  const incrementStat = async (stat: keyof AppStats, amount = 1) => {
    const updated = { ...stats, [stat]: (stats[stat] ?? 0) + amount };
    setStats(updated);
    await AsyncStorage.setItem("stats", JSON.stringify(updated));
    checkAchievementsWithStats(updated);
    // Update XP
    const xpGain = amount * 10;
    const newXp = profile.xp + xpGain;
    const newLevel = Math.floor(newXp / 100) + 1;
    const updatedProfile = { ...profile, xp: newXp, level: newLevel };
    setProfile(updatedProfile);
    await AsyncStorage.setItem("profile", JSON.stringify(updatedProfile));
  };

  const checkAchievementsWithStats = async (currentStats: AppStats) => {
    const statMap: Record<string, { stat: keyof AppStats; achievementId: string }[]> = {
      first_debate: [{ stat: "debatesCompleted", achievementId: "first_debate" }],
      five_debates: [{ stat: "debatesCompleted", achievementId: "five_debates" }],
      twenty_debates: [{ stat: "debatesCompleted", achievementId: "twenty_debates" }],
      first_opponent: [{ stat: "sessionsFinished", achievementId: "first_opponent" }],
      five_opponents: [{ stat: "sessionsFinished", achievementId: "five_opponents" }],
      topics_studied_5: [{ stat: "topicsStudied", achievementId: "topics_studied_5" }],
      topics_studied_20: [{ stat: "topicsStudied", achievementId: "topics_studied_20" }],
      first_prayer: [{ stat: "prayersGenerated", achievementId: "first_prayer" }],
      ten_prayers: [{ stat: "prayersGenerated", achievementId: "ten_prayers" }],
      first_verse: [{ stat: "versesStudied", achievementId: "first_verse" }],
      ten_verses: [{ stat: "versesStudied", achievementId: "ten_verses" }],
      first_note: [{ stat: "topicsStudied", achievementId: "first_note" }],
      ten_notes: [{ stat: "topicsStudied", achievementId: "ten_notes" }],
      topic_generator: [{ stat: "topicsGenerated", achievementId: "topic_generator" }],
      five_topics_generated: [{ stat: "topicsGenerated", achievementId: "five_topics_generated" }],
    };

    const achievementToStat: Record<string, keyof AppStats> = {
      first_debate: "debatesCompleted",
      five_debates: "debatesCompleted",
      twenty_debates: "debatesCompleted",
      first_opponent: "sessionsFinished",
      five_opponents: "sessionsFinished",
      topics_studied_5: "topicsStudied",
      topics_studied_20: "topicsStudied",
      first_prayer: "prayersGenerated",
      ten_prayers: "prayersGenerated",
      first_verse: "versesStudied",
      ten_verses: "versesStudied",
      first_note: "topicsStudied",
      ten_notes: "topicsStudied",
      topic_generator: "topicsGenerated",
      five_topics_generated: "topicsGenerated",
    };

    setAchievements((prev) => {
      const updated = prev.map((a) => {
        const statKey = achievementToStat[a.id];
        if (!statKey) return a;
        const currentValue = currentStats[statKey] ?? 0;
        const progress = Math.min(currentValue, a.threshold);
        const unlocked = currentValue >= a.threshold;
        return {
          ...a,
          progress,
          unlocked,
          unlockedAt: unlocked && !a.unlocked ? new Date().toISOString() : a.unlockedAt,
        };
      });
      AsyncStorage.setItem("achievements", JSON.stringify(updated));
      return updated;
    });
  };

  const checkAchievements = () => checkAchievementsWithStats(stats);

  return (
    <AppContext.Provider
      value={{
        notes,
        savedTopics,
        achievements,
        profile,
        stats,
        addNote,
        deleteNote,
        saveTopic,
        deleteSavedTopic,
        updateProfile,
        incrementStat,
        checkAchievements,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
