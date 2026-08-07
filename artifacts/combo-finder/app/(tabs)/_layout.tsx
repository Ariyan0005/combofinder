import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme, Pressable } from "react-native";

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

  // Center tab: Repairs (mobile_repair) or Stock In (general_store)
  const centerLabel = isGeneralStore ? "Stock In" : "Repairs";
  const centerIcon = isGeneralStore ? "package" : "tool";
  const centerRoute = isGeneralStore ? "/inventory" : "/new-repair";

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

      {/* POS — shown for both types */}
      <Tabs.Screen
        name="pos"
        options={{
          title: "POS",
          tabBarIcon: ({ color }) => (
            <Feather name="credit-card" size={22} color={color} />
          ),
        }}
      />

      {/* Center action tab: Repairs or Stock In */}
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
