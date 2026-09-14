import { Feather } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function NewRepairScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [customer, setCustomer] = useState("");
  const [device, setDevice] = useState("");
  const [imei, setImei] = useState("");
  const [problem, setProblem] = useState("");
  const [engineer, setEngineer] = useState("");

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const handleSubmit = () => {
    // Navigate back to the home screen after creating
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Feather name="arrow-left" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>New Repair</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.formContainer, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Select Customer</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="user" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Search customer..."
                  placeholderTextColor={colors.mutedForeground}
                  value={customer}
                  onChangeText={setCustomer}
                />
                <Feather name="chevron-down" size={20} color={colors.mutedForeground} style={styles.inputIconEnd} />
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Device Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Device</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="smartphone" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="e.g. iPhone 13 Pro"
                  placeholderTextColor={colors.mutedForeground}
                  value={device}
                  onChangeText={setDevice}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>IMEI/Serial (Optional)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="hash" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Enter IMEI or Serial Number"
                  placeholderTextColor={colors.mutedForeground}
                  value={imei}
                  onChangeText={setImei}
                />
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Repair Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Describe the problem</Text>
              <View style={[styles.textAreaWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.foreground }]}
                  placeholder="What needs to be fixed?"
                  placeholderTextColor={colors.mutedForeground}
                  value={problem}
                  onChangeText={setProblem}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Photos (Optional)</Text>
              <View style={styles.photoRow}>
                <Pressable style={[styles.photoAddBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Feather name="camera" size={24} color={colors.mutedForeground} />
                </Pressable>
                <Pressable style={[styles.photoAddBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Feather name="image" size={24} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Select Engineer</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="tool" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Assign to..."
                  placeholderTextColor={colors.mutedForeground}
                  value={engineer}
                  onChangeText={setEngineer}
                />
                <Feather name="chevron-down" size={20} color={colors.mutedForeground} style={styles.inputIconEnd} />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad || 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitBtnText}>Create Repair</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  formContainer: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputIconEnd: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  textArea: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    height: 100,
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoAddBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
