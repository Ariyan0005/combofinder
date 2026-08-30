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

const mockRepairs = [
  {
    id: "RS2505012",
    customerId: "1",
    customerName: "Ahmed Al Balushi",
    device: "iPhone 13 Pro",
    problem: "Display Issue",
    status: "Repairing",
    date: "06 May 2025",
  },
  {
    id: "RS2505011",
    customerId: "2",
    customerName: "Sarah Jones",
    device: "Samsung Galaxy S22 Ultra",
    problem: "Battery Replacement",
    status: "Waiting",
    date: "05 May 2025",
  },
  {
    id: "RS2505010",
    customerId: "3",
    customerName: "Mohammed Ali",
    device: "iPad Pro 11",
    problem: "Charging Port",
    status: "Ready",
    date: "04 May 2025",
  },
  {
    id: "RS2505009",
    customerId: "4",
    customerName: "Fatima Al Farsi",
    device: "iPhone 12",
    problem: "Back Glass",
    status: "Delivered",
    date: "02 May 2025",
  },
];

const mockStats = {
  total: 12,
  waiting: 3,
  repairing: 5,
  ready: 2,
  delivered: 2,
};

export default function RepairsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : 84 + insets.bottom;

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["repairs", "stats"],
    queryFn: async () => {
      try {
        const res = await fetch(`${baseUrl}/api/repairs/stats`);
        if (res.ok) return res.json();
        return mockStats;
      } catch {
        return mockStats;
      }
    },
  });

  const {
    data: repairs,
    isLoading: loadingRepairs,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["repairs", activeTab],
    queryFn: async () => {
      try {
        const statusQuery = activeTab === "All" ? "" : `?status=${activeTab}`;
        const res = await fetch(`${baseUrl}/api/repairs${statusQuery}`);
        if (res.ok) return res.json();
        // Fallback to mock
        if (activeTab === "All") return mockRepairs;
        return mockRepairs.filter((r) => r.status === activeTab);
      } catch {
        if (activeTab === "All") return mockRepairs;
        return mockRepairs.filter((r) => r.status === activeTab);
      }
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "repairing":
        return colors.primary;
      case "waiting":
        return colors.warning;
      case "ready":
        return colors.success;
      case "delivered":
        return colors.mutedForeground;
      default:
        return colors.mutedForeground;
    }
  };

  const tabs = [
    { label: "All", count: stats?.total || 0 },
    { label: "Waiting", count: stats?.waiting || 0 },
    { label: "Repairing", count: stats?.repairing || 0 },
    { label: "Ready", count: stats?.ready || 0 },
    { label: "Delivered", count: stats?.delivered || 0 },
  ];

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
          <Text style={styles.headerTitle}>Repairs</Text>
          <Pressable
            style={[styles.filterBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          >
            <Feather name="filter" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.primary }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.label;
            return (
              <Pressable
                key={tab.label}
                onPress={() => setActiveTab(tab.label)}
                style={[
                  styles.tabItem,
                  isActive && { backgroundColor: "#fff" },
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    isActive ? { color: colors.primary, fontFamily: "Inter_600SemiBold" } : { color: "rgba(255,255,255,0.8)" },
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      styles.badge,
                      isActive
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: "rgba(255,255,255,0.2)" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isActive ? { color: "#fff" } : { color: "#fff" },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loadingRepairs && !isRefetching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={repairs}
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
              <Feather name="inbox" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>
                No repairs found
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.status);
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => router.push(`/repair/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.repairId, { color: colors.primary }]}>
                    #{item.id}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor + "15" },
                    ]}
                  >
                    <View
                      style={[styles.statusDot, { backgroundColor: statusColor }]}
                    />
                    <Text
                      style={[styles.statusText, { color: statusColor }]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={[styles.customerName, { color: colors.foreground }]}>
                    {item.customerName}
                  </Text>
                  <View style={styles.deviceRow}>
                    <Feather name="smartphone" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.deviceText, { color: colors.mutedForeground }]}>
                      {item.device}
                    </Text>
                  </View>
                  <View style={styles.problemRow}>
                    <Feather name="tool" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.problemText, { color: colors.mutedForeground }]}>
                      {item.problem}
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                    {item.date}
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>
              </Pressable>
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
  filterBtn: {
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
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
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  repairId: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
  },
  customerName: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  problemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  problemText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
