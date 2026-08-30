import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const baseUrl = domain ? `https://${domain}` : "";

type LedgerAccount = {
  id: number;
  name: string;
  phone?: string | null;
  balance?: number;
};

export default function LedgerScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: userLoading } = useUser();
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<LedgerAccount[]>({
    // Scope the cache to the authenticated user. Without this, a cached empty
    // response from the auth transition can mask another user's ledger.
    queryKey: ["ledger-accounts", user.id],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/api/ledger/accounts`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load ledger");
      return response.json();
    },
    enabled: !userLoading && !!user.id,
    retry: 2,
    refetchOnMount: "always",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.primary, paddingTop: insets.top + 14 },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Ledger</Text>
      </View>
      {userLoading || isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            Unable to load ledger accounts.
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          onRefresh={refetch}
          refreshing={isLoading}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 20,
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              No ledger accounts found.
            </Text>
          }
          renderItem={({ item }) => {
            const balance = Number(item.balance ?? 0);
            return (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.icon, { backgroundColor: colors.accent }]}>
                  <Feather name="book-open" size={18} color={colors.primary} />
                </View>
                <View style={styles.copy}>
                  <Text style={[styles.name, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  {!!item.phone && (
                    <Text
                      style={[
                        styles.description,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.phone}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.balance,
                    { color: balance >= 0 ? colors.primary : "#ef4444" },
                  ]}
                >
                  {balance.toFixed(2)}
                </Text>
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
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
  name: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  description: { fontSize: 13, marginTop: 3, fontFamily: "Inter_400Regular" },
  balance: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
