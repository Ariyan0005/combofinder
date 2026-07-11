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
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError || !model) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Failed to load model.</Text>
        <Pressable onPress={() => refetch()}>
          <Text style={{ color: colors.primary, marginTop: 8 }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const combos = model.combos ?? [];

  return (
    <FlatList
      data={combos}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: bottomPad },
      ]}
      style={{ backgroundColor: colors.background }}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.brandName, { color: colors.mutedForeground }]}>
            {model.brandName}
          </Text>
          <Text style={[styles.modelName, { color: colors.foreground }]}>
            {model.name}
          </Text>
          {model.releaseYear && (
            <Text style={[styles.releaseYear, { color: colors.mutedForeground }]}>
              Released {model.releaseYear}
            </Text>
          )}
          <Text style={[styles.comboCount, { color: colors.mutedForeground }]}>
            {combos.length} compatibility entries
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No entries yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            No compatibility data has been added for this model.
          </Text>
        </View>
      }
      renderItem={({ item }) => <ComboCard combo={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  brandName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modelName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  releaseYear: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  comboCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  comboCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  comboHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
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
  separator: {
    height: 10,
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
