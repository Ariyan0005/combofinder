import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View, useColorScheme, Pressable } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user } = useUser();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const isGeneralStore = user.businessType === "general_store";

  // Center action: Repairs (mobile_repair) or POS (general_store)
  const centerLabel = isGeneralStore ? "POS" : "Repairs";
  const centerIcon = isGeneralStore ? "shopping-cart" : "tool";
  const centerRoute = isGeneralStore ? "/pos" : "/new-repair";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginBottom: isIOS ? 0 : 4,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />

      {/* Stock In for general stores; POS for mobile repair shops */}
      <Tabs.Screen
        name="pos"
        options={{
          title: isGeneralStore ? "Stock In" : "POS",
          tabBarButton: isGeneralStore
            ? (props) => (
                <Pressable
                  {...props}
                  onPress={() => router.push("/inventory" as any)}
                  style={props.style}
                >
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="package" size={22} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: isIOS ? 0 : 4 }}>
                      Stock In
                    </Text>
                  </View>
                </Pressable>
              )
            : undefined,
          tabBarIcon: ({ color }) => (
            <Feather name="credit-card" size={22} color={color} />
          ),
        }}
      />

      {/* Center action tab: Repairs or POS */}
      <Tabs.Screen
        name="new"
        options={{
          title: centerLabel,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={() => router.push(centerRoute as any)}
              style={{
                top: -15,
                justifyContent: "center",
                alignItems: "center",
                width: 60,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 5,
                }}
              >
                <Feather name={centerIcon as any} size={26} color="#fff" />
              </View>
            </Pressable>
          ),
        }}
      />

      {/* Inventory */}
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color }) => (
            <Feather name="package" size={22} color={color} />
          ),
        }}
      />

      {/* More (was Profile) */}
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <Feather name="menu" size={22} color={color} />
          ),
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="brands" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
