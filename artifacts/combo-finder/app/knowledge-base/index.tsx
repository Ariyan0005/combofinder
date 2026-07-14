import { Feather } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const baseUrl = domain ? `https://${domain}` : "";

const mockArticles = [
  {
    id: "1",
    title: "iPhone 13 Pro Max - No Service Solution",
    category: "Repair Tips",
    device: "iPhone 13 Pro Max",
  },
  {
    id: "2",
    title: "Samsung S22 Ultra Baseband Schematic",
    category: "Schematics",
    device: "Galaxy S22 Ultra",
  },
  {
    id: "3",
    title: "How to replace iPad Pro 11 Battery",
    category: "Videos",
    device: "iPad Pro 11",
  },
  {
    id: "4",
    title: "Micro-soldering Basics Handbook",
    category: "PDF",
    device: "General",
  },
];

export default function KnowledgeBaseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { data: articles } = useQuery({
    queryKey: ["knowledge-base", activeTab],
    queryFn: async () => {
      try {
        const query = activeTab === "All" ? "" : `?category=${activeTab}`;
        const res = await fetch(`${baseUrl}/api/knowledge-base${query}`);
        if (res.ok) return res.json();
        
        if (activeTab === "All") return mockArticles;
        return mockArticles.filter(a => a.category === activeTab);
      } catch {
        if (activeTab === "All") return mockArticles;
        return mockArticles.filter(a => a.category === activeTab);
      }
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Repair Tips": return "#0080DB"; // Blue
      case "Schematics": return "#8B5CF6"; // Purple
      case "Videos": return "#EF4444"; // Red
      case "PDF": return "#F97316"; // Orange
      default: return colors.primary;
    }
  };

  const categories = ["All", "Repair Tips", "Schematics", "Videos", "PDF"];

  const filteredArticles = (articles || []).filter((a: any) => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.device.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: insets.top + (isWeb ? 20 : 16),
          },
        ]}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Knowledge Base</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search articles, models, topics..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.primary }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {categories.map((cat) => {
            const isActive = activeTab === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveTab(cat)}
                style={[
                  styles.tabItem,
                  isActive && { backgroundColor: "#fff" }
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    isActive 
                      ? { color: colors.primary, fontFamily: "Inter_600SemiBold" } 
                      : { color: "rgba(255,255,255,0.8)" }
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 20 }}
        renderItem={({ item }) => {
          const categoryColor = getCategoryColor(item.category);
          return (
            <Pressable
              style={[styles.articleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + "15" }]}>
                  <Text style={[styles.categoryText, { color: categoryColor }]}>{item.category}</Text>
                </View>
                <Feather name="external-link" size={16} color={colors.mutedForeground} />
              </View>
              
              <Text style={[styles.articleTitle, { color: colors.foreground }]}>{item.title}</Text>
              
              <View style={styles.deviceRow}>
                <Feather name="smartphone" size={14} color={colors.mutedForeground} />
                <Text style={[styles.deviceText, { color: colors.mutedForeground }]}>{item.device}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  tabsContainer: {
    paddingBottom: 16,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  articleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  articleTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    lineHeight: 22,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deviceText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
