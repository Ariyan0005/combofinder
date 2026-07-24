import * as Linking from "expo-linking";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { UpdateInfo } from "@/hooks/useUpdateChecker";

interface Props {
  info: UpdateInfo;
  onDismiss: () => void;
}

export function UpdateModal({ info, onDismiss }: Props) {
  const handleDownload = () => {
    Linking.openURL(info.downloadUrl);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🚀</Text>
            <Text style={styles.title}>নতুন আপডেট পাওয়া গেছে!</Text>
            <Text style={styles.versionBadge}>v{info.version}</Text>
          </View>

          {/* Release notes */}
          {info.releaseNotes.trim().length > 0 && (
            <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.notesLabel}>কী কী বদলেছে</Text>
              <Text style={styles.notes}>{info.releaseNotes.trim()}</Text>
            </ScrollView>
          )}

          {/* Buttons */}
          <Pressable style={styles.downloadBtn} onPress={handleDownload}>
            <Text style={styles.downloadText}>⬇️  এখনই আপডেট করুন</Text>
          </Pressable>

          <Pressable style={styles.laterBtn} onPress={onDismiss}>
            <Text style={styles.laterText}>পরে করব</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#111",
    textAlign: "center",
    marginBottom: 6,
  },
  versionBadge: {
    backgroundColor: "#0080DB",
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    overflow: "hidden",
  },
  notesScroll: {
    maxHeight: 180,
    marginBottom: 20,
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    padding: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#888",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notes: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#444",
    lineHeight: 20,
  },
  downloadBtn: {
    backgroundColor: "#0080DB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  downloadText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  laterBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  laterText: {
    color: "#888",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
