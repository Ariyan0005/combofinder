import { Feather } from "@expo/vector-icons";
import { useGetStats, useSearchModels } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | undefined;
  icon: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Feather name={icon as any} size={20} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value ?? "—"}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : 84 + insets.bottom;

  const { data: stats } = useGetStats();

  const { data: results, isLoading: searching } = useSearchModels(
    { q: query },
    { query: { enabled: query.length >= 2 } }
  );

  const hasResults = query.length >= 2;

  const allItems: Array<{ type: "brand" | "model"; id: number; name: string; subtitle?: string }> = hasResults
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: topPad + 16,
          },
        ]}
      >
        <Text style={styles.headerTitle}>ComboFinder</Text>
        <Text style={styles.headerSubtitle}>Phone display compatibility</Text>

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
              { color: colors.foreground, fontFamily: "Inter_400Regular" },
            ]}
            placeholder="Search brands or models..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {!hasResults ? (
        <FlatList
          data={[0]}
          keyExtractor={(item) => String(item)}
          contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 20 }}
          renderItem={() => (
            <View style={styles.statsContainer}>
              <Text
                style={[styles.sectionLabel, { color: colors.mutedForeground }]}
              >
                DATABASE
              </Text>
              <View style={styles.statsRow}>
                <StatCard label="Brands" value={stats?.totalBrands} icon="tag" />
                <StatCard
                  label="Models"
                  value={stats?.totalModels}
                  icon="smartphone"
                />
                <StatCard
                  label="Combos"
                  value={stats?.totalCombos}
                  icon="layers"
                />
              </View>
              <View
                style={[styles.hintBox, { backgroundColor: colors.accent }]}
              >
                <Feather name="info" size={16} color={colors.primary} />
                <Text
                  style={[
                    styles.hintText,
                    { color: colors.foreground, fontFamily: "Inter_400Regular" },
                  ]}
                >
                  Type at least 2 characters to search for brands or phone
                  models and find compatible display combos.
                </Text>
              </View>
            </View>
          )}
        />
      ) : (
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
                <Feather name="search" size={40} color={colors.mutedForeground} />
                <Text
                  style={[styles.emptyTitle, { color: colors.foreground }]}
                >
                  No results found
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Try a different search term
                </Text>
              </View>
            ) : null
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
                      item.type === "model" ? colors.accent : colors.muted,
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
                  style={[
                    styles.resultSub,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {item.subtitle}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  statsContainer: {
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    padding: 14,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    marginTop: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
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
