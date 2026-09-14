import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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
import { useUser } from "@/context/UserContext";

interface MenuItem {
  icon: string;
  label: string;
  route: string | null;
  color?: string;
}

const MOBILE_REPAIR_MENU: MenuItem[] = [
  { icon: "tool", label: "Repairs", route: null, color: "#0080DB" },
  { icon: "users", label: "Customers", route: null },
  { icon: "dollar-sign", label: "Expenses", route: null },
  { icon: "truck", label: "Suppliers", route: null },
  { icon: "bar-chart-2", label: "Sales Summary", route: null },
  { icon: "book-open", label: "Knowledge Base", route: "/knowledge-base" },
  { icon: "cpu", label: "ComboFinder", route: null },
  { icon: "settings", label: "Settings", route: null },
];

const GENERAL_STORE_MENU: MenuItem[] = [
  { icon: "users", label: "Customers", route: null },
  { icon: "dollar-sign", label: "Expenses", route: null },
  { icon: "truck", label: "Suppliers", route: null },
  { icon: "user-check", label: "Employees", route: null },
  { icon: "bar-chart-2", label: "Sales Summary", route: null },
  { icon: "layers", label: "Categories", route: "/manage-categories" },
  { icon: "book-open", label: "Ledger", route: "/ledger" },
  { icon: "settings", label: "Settings", route: null },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : 84 + insets.bottom;

  const isGeneralStore = user.businessType === "general_store";
  const menuItems = isGeneralStore ? GENERAL_STORE_MENU : MOBILE_REPAIR_MENU;

  const businessLabel = isGeneralStore ? "General Store" : "Mobile Repair Shop";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: topPad + 16,
            paddingBottom: 24,
          },
        ]}
      >
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile section */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.accent, borderColor: colors.card }]}>
            <Text style={[styles.avatarInitials, { color: colors.primary }]}>
              {(user.name ?? "U").substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user.name ?? "Shop Owner"}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: colors.primary + "18" }]}>
            <Feather
              name={isGeneralStore ? "shopping-bag" : "tool"}
              size={12}
              color={colors.primary}
            />
            <Text style={[styles.typeText, { color: colors.primary }]}>{businessLabel}</Text>
          </View>
          {isGeneralStore && (
            <Text style={[styles.slogan, { color: colors.mutedForeground }]}>
              Manage everything, all in one place
            </Text>
          )}
        </View>

        {/* Menu */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                index !== menuItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
                pressed && { backgroundColor: colors.accent + "50" },
              ]}
              onPress={() => {
                if (item.route) router.push(item.route as any);
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: (item.color ?? colors.primary) + "15" }]}>
                <Feather name={item.icon as any} size={18} color={item.color ?? colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                {item.label}
              </Text>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              borderColor: "#ef4444" + "40",
              backgroundColor: pressed ? "#ef444410" : "transparent",
              marginHorizontal: 20,
              marginBottom: 8,
            },
          ]}
          onPress={async () => {
            try {
              const domain = process.env.EXPO_PUBLIC_DOMAIN;
              const baseUrl = domain ? `https://${domain}` : "";
              await fetch(`${baseUrl}/api/auth/logout`, {
                method: "POST", credentials: "include",
              });
            } catch {}
          }}
        >
          <Feather name="log-out" size={18} color="#ef4444" />
          <Text style={[styles.logoutText, { color: "#ef4444" }]}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  profileHeader: {
    alignItems: "center", paddingVertical: 28, paddingHorizontal: 20, gap: 8,
  },
  avatarContainer: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3,
  },
  avatarInitials: { fontSize: 26, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  typeBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  typeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  slogan: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 2 },
  menuSection: {
    marginHorizontal: 20, borderRadius: 16, borderWidth: 1,
    marginBottom: 16, overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    padding: 16, gap: 12,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 16, borderRadius: 16, borderWidth: 1, gap: 8,
  },
  logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
