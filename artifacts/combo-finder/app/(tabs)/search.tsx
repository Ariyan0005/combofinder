import { Feather } from "@expo/vector-icons";
import {
  useGetBrands,
  useGetStats,
  useSearchModels,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

import { useColors } from "@/hooks/useColors";

// ─── Category chips ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All", icon: "grid" },
  { id: "display", label: "Display", icon: "monitor" },
  { id: "battery", label: "Battery", icon: "battery-charging" },
  { id: "ic", label: "IC", icon: "cpu" },
  { id: "connector", label: "Connector", icon: "zap" },
  { id: "more", label: "More", icon: "more-horizontal" },
] as const;

// ─── Brand avatar (colored initials) ──────────────────────────────────────────
const BRAND_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899",
];

function brandColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return BRAND_COLORS[Math.abs(h) % BRAND_COLORS.length];
}

function initials(name: string) {
  const parts = name.split(/[\s/\-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | undefined;
  icon: string;
}) {
  return (
    <View style={[styles.statPill, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
      <Feather name={icon as any} size={14} color="rgba(255,255,255,0.9)" />
      <Text style={styles.statPillValue}>{value ?? "—"}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function BrandCard({
  name,
  modelCount,
  onPress,
}: {
  name: string;
  modelCount: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const bg = brandColor(name);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.brandCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.brandAvatar, { backgroundColor: bg }]}>
        <Text style={styles.brandInitials}>{initials(name)}</Text>
      </View>
      <Text
        style={[styles.brandName, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {name}
      </Text>
      <Text style={[styles.brandCount, { color: colors.mutedForeground }]}>
        {modelCount} model{modelCount !== 1 ? "s" : ""}
      </Text>
    </Pressable>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : 84 + insets.bottom;

  const { data: stats } = useGetStats();
  const { data: brands, isLoading: loadingBrands } = useGetBrands();

  const { data: results, isLoading: searching } = useSearchModels(
    { q: query },
    { query: { enabled: query.length >= 2 } }
  );

  const hasSearch = query.length >= 2;

  const allItems: Array<{
    type: "brand" | "model";
    id: number;
    name: string;
    subtitle?: string;
  }> = hasSearch
    ? [
        ...(results?.brands ?? []).map((b) => ({
          type: "brand" as const,
          id: b.id,
          name: b.name,
          subtitle: `${b.modelCount} model${b.modelCount !== 1 ? "s" : ""}`,
        })),
        ...(results?.models ?? []).map((m) => ({
          type: "model" as const,
          id: m.id,
          name: m.name,
          subtitle: `${m.brandName} · ${m.comboCount} combo${m.comboCount !== 1 ? "s" : ""}`,
        })),
      ]
    : [];

  // ── Idle state (no active search) ──────────────────────────────────────────
  const renderIdle = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 20 }}
    >
      {/* Section: Popular Brands */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Popular Brands
          </Text>
          <Pressable onPress={() => {}}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              View All
            </Text>
          </Pressable>
        </View>

        {loadingBrands ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <View style={styles.brandsGrid}>
            {(brands ?? []).slice(0, 8).map((b) => (
              <BrandCard
                key={b.id}
                name={b.name}
                modelCount={b.modelCount}
                onPress={() => router.push(`/brand/${b.id}`)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Section: Hint */}
      <View style={[styles.hintBox, { backgroundColor: colors.accent }]}>
        <View
          style={[styles.hintIcon, { backgroundColor: colors.primary + "1A" }]}
        >
          <Feather name="info" size={16} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.hintText,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          Type at least 2 characters to search for brands or phone models.
        </Text>
      </View>
    </ScrollView>
  );

  // ── Search results ──────────────────────────────────────────────────────────
  const renderResults = () => (
    <FlatList
      data={allItems}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: bottomPad,
      }}
      ListHeaderComponent={
        searching ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginVertical: 24 }}
          />
        ) : allItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconWrap,
                { backgroundColor: colors.muted },
              ]}
            >
              <Feather name="search" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No results found
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
            >
              Try a different search term
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.resultCount, { color: colors.mutedForeground }]}
          >
            {allItems.length} result{allItems.length !== 1 ? "s" : ""}
          </Text>
        )
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [
            styles.resultItem,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          onPress={() => {
            if (item.type === "model") {
              router.push(`/model/${item.id}`);
            } else {
              router.push(`/brand/${item.id}`);
            }
          }}
        >
          <View
            style={[
              styles.resultIcon,
              {
                backgroundColor:
                  item.type === "model"
                    ? colors.primary + "18"
                    : colors.muted,
              },
            ]}
          >
            <Feather
              name={item.type === "model" ? "smartphone" : "tag"}
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.resultName, { color: colors.foreground }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.resultSub, { color: colors.mutedForeground }]}
            >
              {item.subtitle}
            </Text>
          </View>
          <View
            style={[
              styles.resultChevron,
              { backgroundColor: colors.muted },
            ]}
          >
            <Feather
              name="chevron-right"
              size={16}
              color={colors.mutedForeground}
            />
          </View>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: topPad + 16,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>ComboFinder</Text>
            <Text style={styles.headerSubtitle}>Compatibility Finder</Text>
          </View>
          {/* Stats pills */}
          <View style={styles.statsPills}>
            <StatPill label="Brands" value={stats?.totalBrands} icon="tag" />
            <StatPill label="Models" value={stats?.totalModels} icon="smartphone" />
          </View>
        </View>

        {/* Search bar */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
              },
            ]}
            placeholder="Search model or part..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.clearBtn,
                  { backgroundColor: colors.muted },
                ]}
              >
                <Feather name="x" size={13} color={colors.mutedForeground} />
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Category chips ─────────────────────────────────────────────────── */}
      <View
        style={[
          styles.categoryStrip,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.chip,
                  isActive
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.muted },
                ]}
              >
                <Feather
                  name={cat.icon as any}
                  size={13}
                  color={isActive ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isActive ? "#fff" : colors.mutedForeground,
                      fontFamily: isActive
                        ? "Inter_600SemiBold"
                        : "Inter_400Regular",
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {hasSearch ? renderResults() : renderIdle()}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 28,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  statsPills: {
    flexDirection: "row",
    gap: 8,
  },
  statPill: {
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  statPillValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  statPillLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  // Category strip
  categoryStrip: {
    borderBottomWidth: 1,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
  },
  chipLabel: {
    fontSize: 13,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  // Brands grid
  brandsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  brandCard: {
    width: "47.5%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-start",
    gap: 8,
  },
  brandAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brandInitials: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  brandName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 19,
  },
  brandCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Hint
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  hintIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // Search results
  resultCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  resultSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  resultChevron: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
