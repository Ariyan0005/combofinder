import { Feather } from "@expo/vector-icons";
import { useGetBrands } from "@workspace/api-client-react";
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

export default function BrandsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState("");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : 84 + insets.bottom;

  const { data: brands, isLoading, isError, refetch } = useGetBrands();

  const filtered = (brands ?? []).filter((b) =>
    b.name.toLowerCase().includes(filter.toLowerCase())
  );

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
        <Text style={styles.headerTitle}>All Brands</Text>
        <Text style={styles.headerSubtitle}>
          {brands ? `${brands.length} brands available` : "Loading..."}
        </Text>

        <View
          style={[
            styles.filterBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="filter" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[
              styles.filterInput,
              { color: colors.foreground, fontFamily: "Inter_400Regular" },
            ]}
            placeholder="Filter brands..."
            placeholderTextColor={colors.mutedForeground}
            value={filter}
            onChangeText={setFilter}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {filter.length > 0 && (
            <Pressable onPress={() => setFilter("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading brands...
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>
            Failed to load brands
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: bottomPad,
          }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Feather name="tag" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>
                No brands found
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const initials = item.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.brandItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                onPress={() => router.push(`/brand/${item.id}`)}
              >
                <View
                  style={[
                    styles.brandAvatar,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.brandInitials,
                      { color: colors.primary },
                    ]}
                  >
                    {initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.brandName, { color: colors.foreground }]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.brandModels,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {item.modelCount} model{item.modelCount !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.mutedForeground}
                />
              </Pressable>
            );
          }}
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
  filterBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  filterInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  emptyText: {
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
  brandItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  brandAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  brandInitials: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  brandName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  brandModels: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
