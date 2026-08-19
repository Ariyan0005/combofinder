import { Feather } from "@expo/vector-icons";
import { useGetBrand, useGetBrandModels } from "@workspace/api-client-react";
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

export default function BrandModelsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const brandId = Number(id);

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom + 16;

  const { data: brand } = useGetBrand(brandId);
  const {
    data: models,
    isLoading,
    isError,
    refetch,
  } = useGetBrandModels(brandId);

  useEffect(() => {
    if (brand?.name) {
      navigation.setOptions({ headerTitle: brand.name });
    }
  }, [brand?.name, navigation]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading models...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Failed to load models
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={models ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: bottomPad,
        }}
        ListHeaderComponent={
          brand ? (
            <View
              style={[
                styles.brandHeader,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.brandAvatar,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Text style={[styles.brandInitials, { color: colors.primary }]}>
                  {brand.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
              <View>
                <Text style={[styles.brandName, { color: colors.foreground }]}>
                  {brand.name}
                </Text>
                <Text
                  style={[
                    styles.brandMeta,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {brand.modelCount} model{brand.modelCount !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Feather name="smartphone" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.foreground }]}>
              No models found
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.modelItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={() => router.push(`/model/${item.id}`)}
          >
            <View
              style={[styles.modelIcon, { backgroundColor: colors.accent }]}
            >
              <Feather name="smartphone" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modelName, { color: colors.foreground }]}>
                {item.name}
              </Text>
              <Text
                style={[styles.modelMeta, { color: colors.mutedForeground }]}
              >
                {item.releaseYear ? `${item.releaseYear} · ` : ""}
                {item.comboCount} combo{item.comboCount !== 1 ? "s" : ""}
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
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  brandAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  brandInitials: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  brandName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  brandMeta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  modelIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modelName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  modelMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
