import { Feather } from "@expo/vector-icons";
import { useGetModel } from "@workspace/api-client-react";
import type { Combo } from "@workspace/api-client-react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function ComboTypeBadge({ type }: { type: string }) {
  const colors = useColors();
  const config: Record<string, { bg: string; text: string; label: string }> = {
    OEM: { bg: colors.primary, text: "#fff", label: "OEM" },
    Compatible: { bg: colors.success, text: "#fff", label: "Compatible" },
    Refurbished: { bg: colors.warning, text: "#fff", label: "Refurbished" },
  };
  const c = config[type] ?? { bg: colors.muted, text: colors.foreground, label: type };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

function ComboCard({ combo }: { combo: Combo }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.comboCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.comboHeader}>
        <Text style={[styles.comboName, { color: colors.foreground }]}>
          {combo.name}
        </Text>
        <ComboTypeBadge type={combo.comboType} />
      </View>

      <View style={styles.comboMeta}>
        {combo.qualityGrade && (
          <View style={styles.metaRow}>
            <Feather name="star" size={14} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              Grade: {combo.qualityGrade}
            </Text>
          </View>
        )}
        {combo.priceRange && (
          <View style={styles.metaRow}>
            <Feather
              name="dollar-sign"
              size={14}
              color={colors.mutedForeground}
            />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {combo.priceRange}
            </Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Feather
            name={combo.inStock ? "check-circle" : "x-circle"}
            size={14}
            color={combo.inStock ? colors.success : colors.destructive}
          />
          <Text
            style={[
              styles.metaText,
              { color: combo.inStock ? colors.success : colors.destructive },
            ]}
          >
            {combo.inStock ? "In Stock" : "Out of Stock"}
          </Text>
        </View>
      </View>

      {combo.notes && (
        <Text
          style={[
            styles.comboNotes,
            {
              color: colors.mutedForeground,
              borderTopColor: colors.border,
            },
          ]}
        >
          {combo.notes}
        </Text>
      )}
    </View>
  );
}

export default function ModelDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const modelId = Number(id);

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom + 16;

  const { data: model, isLoading, isError, refetch } = useGetModel(modelId);

  useEffect(() => {
    if (model?.name) {
      navigation.setOptions({ headerTitle: model.name });
    }
  }, [model?.name, navigation]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading model...
        </Text>
      </View>
    );
  }

  if (isError || !model) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Failed to load model
        </Text>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const oemCount = model.combos.filter((c) => c.comboType === "OEM").length;
  const compatCount = model.combos.filter(
    (c) => c.comboType === "Compatible"
  ).length;
  const refurbishedCount = model.combos.filter(
    (c) => c.comboType === "Refurbished"
  ).length;
  const inStockCount = model.combos.filter((c) => c.inStock).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={model.combos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: bottomPad,
        }}
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.modelCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.modelCardTop}>
                <View
                  style={[
                    styles.modelIcon,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Feather
                    name="smartphone"
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => router.push(`/brand/${model.brandId}`)}
                  >
                    <Text
                      style={[styles.brandLink, { color: colors.primary }]}
                    >
                      {model.brandName}
                    </Text>
                  </Pressable>
                  <Text
                    style={[styles.modelName, { color: colors.foreground }]}
                  >
                    {model.name}
                  </Text>
                  {model.releaseYear && (
                    <Text
                      style={[
                        styles.modelYear,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Released {model.releaseYear}
                    </Text>
                  )}
                </View>
              </View>

              <View
                style={[
                  styles.statsRow,
                  { borderTopColor: colors.border },
                ]}
              >
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: colors.primary }]}
                  >
                    {oemCount}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    OEM
                  </Text>
                </View>
                <View
                  style={[styles.statDivider, { backgroundColor: colors.border }]}
                />
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: colors.success }]}
                  >
                    {compatCount}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Compatible
                  </Text>
                </View>
                <View
                  style={[styles.statDivider, { backgroundColor: colors.border }]}
                />
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: colors.warning }]}
                  >
                    {refurbishedCount}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Refurb
                  </Text>
                </View>
                <View
                  style={[styles.statDivider, { backgroundColor: colors.border }]}
                />
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: colors.foreground }]}
                  >
                    {inStockCount}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    In Stock
                  </Text>
                </View>
              </View>
            </View>

            <Text
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              {model.combos.length > 0
                ? `${model.combos.length} DISPLAY COMBO${model.combos.length !== 1 ? "S" : ""}`
                : "NO COMBOS"}
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="layers" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No combos available
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
            >
              No display combos have been added for this model yet
            </Text>
          </View>
        }
        renderItem={({ item }) => <ComboCard combo={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  modelCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  modelCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
  },
  modelIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLink: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  modelName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  modelYear: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  comboCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  comboHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  comboName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  comboMeta: {
    gap: 5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  comboNotes: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
