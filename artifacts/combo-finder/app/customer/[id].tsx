import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

const mockCustomer = {
  id: "1",
  name: "Ahmed Al Balushi",
  phone: "+968 9123 4567",
  stats: {
    totalRepairs: 12,
    revenue: 156500, // Show as USD
  },
  memberSince: "10 Jan 2025",
};

const mockRepairs = [
  {
    id: "RS2505012",
    device: "iPhone 13 Pro",
    problem: "Display Issue",
    status: "Repairing",
    date: "06 May 2025",
  },
  {
    id: "RS2505008",
    device: "iPad Mini 6",
    problem: "Battery Replacement",
    status: "Delivered",
    date: "15 Apr 2025",
  },
  {
    id: "RS2504092",
    device: "iPhone 11",
    problem: "Charging Port",
    status: "Delivered",
    date: "02 Mar 2025",
  },
];

export default function CustomerProfileScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Repair History");

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const initials = mockCustomer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const openWhatsApp = () => {
    const url = `whatsapp://send?phone=${mockCustomer.phone.replace(/[^0-9]/g, "")}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback or alert
        console.log("WhatsApp not installed");
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "repairing": return colors.primary;
      case "waiting": return colors.warning;
      case "ready": return colors.success;
      case "delivered": return colors.mutedForeground;
      default: return colors.mutedForeground;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
          <Pressable style={styles.editBtn}>
            <Feather name="edit-2" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.profileSection}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.accent, borderColor: colors.card }]}>
          <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
        </View>
        <Text style={[styles.customerName, { color: colors.foreground }]}>{mockCustomer.name}</Text>
        
        <View style={styles.contactRow}>
          <Text style={[styles.customerPhone, { color: colors.mutedForeground }]}>{mockCustomer.phone}</Text>
          <Pressable 
            style={[styles.whatsappBtn, { backgroundColor: "#25D366" }]}
            onPress={openWhatsApp}
          >
            <Feather name="message-circle" size={16} color="#fff" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </Pressable>
        </View>

        <Text style={[styles.memberDate, { color: colors.mutedForeground }]}>
          Member since {mockCustomer.memberSince}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{mockCustomer.stats.totalRepairs}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Repairs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {formatCurrency(mockCustomer.stats.revenue)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Revenue</Text>
        </View>
      </View>

      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        {["Repair History", "Devices", "Payments", "Notes"].map(tab => (
          <Pressable
            key={tab}
            style={[
              styles.tabBtn,
              activeTab === tab && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab 
                  ? { color: colors.primary, fontFamily: "Inter_600SemiBold" } 
                  : { color: colors.mutedForeground }
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "Repair History" ? (
        <FlatList
          data={mockRepairs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 20 }}
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.status);
            return (
              <Pressable
                style={[styles.repairCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/repair/${item.id}`)}
              >
                <View style={styles.repairHeader}>
                  <Text style={[styles.repairId, { color: colors.primary }]}>#{item.id}</Text>
                  <Text style={[styles.repairDate, { color: colors.mutedForeground }]}>{item.date}</Text>
                </View>
                
                <Text style={[styles.repairDevice, { color: colors.foreground }]}>{item.device}</Text>
                <Text style={[styles.repairProblem, { color: colors.mutedForeground }]}>{item.problem}</Text>
                
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "15", alignSelf: "flex-start", marginTop: 8 }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="folder" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No {activeTab.toLowerCase()} found.</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  editBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  profileSection: {
    alignItems: "center",
    marginTop: -40,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  customerName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  customerPhone: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  whatsappText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  memberDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  repairCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  repairHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  repairId: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  repairDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  repairDevice: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  repairProblem: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
