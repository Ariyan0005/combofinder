import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const baseUrl = domain ? `https://${domain}` : "";

const mockInventory = [
  {
    id: "1",
    name: "iPhone 13 Pro Display",
    brand: "Original",
    model: "Apple",
    stock: 3,
    minStock: 5,
    category: "Displays",
  },
  {
    id: "2",
    name: "Samsung S22 Ultra Battery",
    brand: "OEM",
    model: "Samsung",
    stock: 12,
    minStock: 5,
    category: "Batteries",
  },
  {
    id: "3",
    name: "Charging IC - Tristar",
    brand: "Original",
    model: "Universal",
    stock: 45,
    minStock: 10,
    category: "ICs",
  },
  {
    id: "4",
    name: "Type-C Port Gen 2",
    brand: "High Copy",
    model: "Universal",
    stock: 2,
    minStock: 10,
    category: "Ports",
  },
  {
    id: "5",
    name: "iPhone 12 Back Glass",
    brand: "High Copy",
    model: "Apple",
    stock: 8,
    minStock: 5,
    category: "More",
  },
];

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : 84 + insets.bottom;

  const {
    data: inventory,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["inventory", activeTab],
    queryFn: async () => {
      try {
        const res = await fetch(`${baseUrl}/api/inventory`);
        if (res.ok) {
          const data = await res.json();
          if (activeTab === "All") return data;
          return data.filter((item: any) => item.category === activeTab);
        }
        throw new Error("Failed");
      } catch {
        if (activeTab === "All") return mockInventory;
        return mockInventory.filter((item) => item.category === activeTab);
      }
    },
  });

  const categories = ["All", "Displays", "Batteries", "ICs", "Ports", "More"];

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
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Pressable
            style={[styles.searchBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          >
            <Feather name="search" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.primary }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {categories.map((cat) => {
            const isActive = activeTab === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveTab(cat)}
                style={[
                  styles.tabItem,
                  isActive && { backgroundColor: "#fff" },
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    isActive
                      ? { color: colors.primary, fontFamily: "Inter_600SemiBold" }
                      : { color: "rgba(255,255,255,0.8)" },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: bottomPad,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Feather name="package" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>
                No items found
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLowStock = item.stock <= item.minStock;
            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                </View>
                
                <View style={styles.brandRow}>
                  <View style={[styles.tag, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      {item.brand}
                    </Text>
                  </View>
                  <Text style={[styles.modelText, { color: colors.mutedForeground }]}>
                    {item.model}
                  </Text>
                </View>

                <View style={[styles.stockRow, { borderTopColor: colors.border }]}>
                  <View style={styles.stockInfo}>
                    <Text style={[styles.stockLabel, { color: colors.mutedForeground }]}>
                      Stock
                    </Text>
                    <View style={styles.stockValueRow}>
                      <Text
                        style={[
                          styles.stockValue,
                          { color: isLowStock ? colors.destructive : colors.success },
                        ]}
                      >
                        {item.stock}
                      </Text>
                      {isLowStock && (
                        <Feather name="alert-circle" size={14} color={colors.destructive} />
                      )}
                    </View>
                  </View>
                  <View style={styles.minStockInfo}>
                    <Text style={[styles.stockLabel, { color: colors.mutedForeground }]}>
                      Min
                    </Text>
                    <Text style={[styles.minStockValue, { color: colors.foreground }]}>
                      {item.minStock}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  modelText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 24,
  },
  stockInfo: {
    gap: 4,
  },
  stockValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stockLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  stockValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  minStockInfo: {
    gap: 4,
  },
  minStockValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
