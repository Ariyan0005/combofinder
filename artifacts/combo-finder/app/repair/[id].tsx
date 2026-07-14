import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function RepairDetailScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  // Mock data since API doesn't exist yet
  const [repair, setRepair] = useState({
    id: id || "RS2505012",
    customerId: "1",
    customerName: "Ahmed Al Balushi",
    device: "iPhone 13 Pro",
    imei: "359123456789012",
    problem: "Display Issue - Ghost touching and green lines on the screen.",
    status: "Repairing",
    date: "06 May 2025",
    engineer: "Mohammed K.",
    price: 150,
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "repairing": return colors.primary;
      case "waiting": return colors.warning;
      case "ready": return colors.success;
      case "delivered": return colors.mutedForeground;
      default: return colors.mutedForeground;
    }
  };

  const statusColor = getStatusColor(repair.status);

  const StatusButton = ({ label, current }: { label: string, current: string }) => {
    const isActive = label === current;
    const color = getStatusColor(label);
    
    return (
      <Pressable
        style={[
          styles.statusBtn,
          isActive ? { backgroundColor: color } : { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }
        ]}
        onPress={() => setRepair({ ...repair, status: label })}
      >
        <Text
          style={[
            styles.statusBtnText,
            isActive ? { color: "#fff", fontFamily: "Inter_600SemiBold" } : { color: colors.foreground }
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
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
          <Text style={styles.headerTitle}>Repair #{repair.id}</Text>
          <Pressable style={styles.editBtn}>
            <Feather name="edit-2" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 40 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Current Status</Text>
            <View style={[styles.badge, { backgroundColor: statusColor + "15" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.badgeText, { color: statusColor }]}>{repair.status}</Text>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusUpdateRow}>
            <StatusButton label="Waiting" current={repair.status} />
            <StatusButton label="Repairing" current={repair.status} />
            <StatusButton label="Ready" current={repair.status} />
            <StatusButton label="Delivered" current={repair.status} />
          </ScrollView>
        </View>

        <Pressable 
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(`/customer/${repair.customerId}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer</Text>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </View>
          
          <View style={styles.customerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Feather name="user" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.customerName, { color: colors.foreground }]}>{repair.customerName}</Text>
              <Text style={[styles.customerPhone, { color: colors.mutedForeground }]}>+968 9123 4567</Text>
            </View>
          </View>
        </Pressable>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>Device Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Device</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{repair.device}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>IMEI/Serial</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{repair.imei}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Problem</Text>
            <Text style={[styles.detailValue, { color: colors.foreground, flex: 1, textAlign: "right" }]}>{repair.problem}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Engineer</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{repair.engineer}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Price</Text>
            <Text style={[styles.priceValue, { color: colors.foreground }]}>${repair.price.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
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
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  statusUpdateRow: {
    gap: 8,
    paddingVertical: 4,
  },
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  customerName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    maxWidth: "60%",
  },
  priceValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 4,
  },
});
