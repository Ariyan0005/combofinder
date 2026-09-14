import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const QUICK_ACTIONS = [
  { icon: "plus-circle", label: "New Sale", color: "#0080DB" },
  { icon: "list", label: "Sales History", color: "#10b981" },
  { icon: "users", label: "Customers", color: "#8b5cf6" },
  { icon: "tag", label: "Discounts", color: "#f59e0b" },
];

export default function POSScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : 84 + insets.bottom;

  const [cart, setCart] = useState<{ name: string; price: number; qty: number }[]>([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.primary, paddingTop: topPad + 16, paddingBottom: 24 },
        ]}
      >
        <Text style={styles.headerTitle}>Point of Sale</Text>
        <Text style={styles.headerSub}>Manage transactions quickly</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad, padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.quickCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color + "18" }]}>
                <Feather name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Cart Summary */}
        <View style={[styles.cartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cartHeader}>
            <Feather name="shopping-cart" size={18} color={colors.primary} />
            <Text style={[styles.cartTitle, { color: colors.foreground }]}>Current Cart</Text>
            <View style={[styles.cartBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.cartBadgeText, { color: colors.primary }]}>
                {cart.length} items
              </Text>
            </View>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Feather name="shopping-bag" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyCartText, { color: colors.mutedForeground }]}>
                No items in cart
              </Text>
              <Text style={[styles.emptyCartSub, { color: colors.mutedForeground }]}>
                Add products from inventory
              </Text>
            </View>
          ) : (
            <View>
              {cart.map((item, i) => (
                <View key={i} style={[styles.cartItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.cartItemName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.cartItemPrice, { color: colors.primary }]}>
                    ${(item.price * item.qty).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Checkout Button */}
        <Pressable
          style={({ pressed }) => [
            styles.checkoutBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="credit-card" size={20} color="#fff" />
          <Text style={styles.checkoutText}>Checkout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20 },
  headerTitle: {
    fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff",
  },
  headerSub: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 4,
  },
  quickGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12,
  },
  quickCard: {
    width: "47%", padding: 16, borderRadius: 14, borderWidth: 1,
    alignItems: "center", gap: 10,
  },
  quickIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  quickLabel: {
    fontSize: 13, fontFamily: "Inter_600SemiBold",
  },
  cartCard: {
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
  },
  cartHeader: {
    flexDirection: "row", alignItems: "center", padding: 16, gap: 8,
  },
  cartTitle: {
    flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold",
  },
  cartBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  cartBadgeText: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
  },
  emptyCart: {
    alignItems: "center", paddingVertical: 32, gap: 8,
  },
  emptyCartText: {
    fontSize: 16, fontFamily: "Inter_600SemiBold",
  },
  emptyCartSub: {
    fontSize: 13, fontFamily: "Inter_400Regular",
  },
  cartItem: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  cartItemName: {
    fontSize: 14, fontFamily: "Inter_500Medium",
  },
  cartItemPrice: {
    fontSize: 14, fontFamily: "Inter_700Bold",
  },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    padding: 16, borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 15, fontFamily: "Inter_500Medium",
  },
  totalValue: {
    fontSize: 20, fontFamily: "Inter_700Bold",
  },
  checkoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 18, borderRadius: 16, gap: 10,
  },
  checkoutText: {
    fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff",
  },
});
