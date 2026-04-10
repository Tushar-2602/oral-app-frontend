import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Button,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { usePatientStore } from "@/store/patientStore";
import { useState } from "react";
import { API_URL, TokenService } from "./index";

export default function Home() {
  const router = useRouter();
  const { patient, clearPatient } = usePatientStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    setDrawerOpen(false);
    try {
      const refreshToken = await TokenService.getRefresh();

      if (!refreshToken) {
        TokenService.clear();
        router.replace("/");
        return;
      }

      const response = await fetch(`${API_URL}/user/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      TokenService.clear();

      if (!response.ok && response.status !== 404) {
        console.warn("Logout warning:", data.message);
      }
    } catch (err) {
      console.error("Logout error:", err);
      TokenService.clear();
    } finally {
      router.replace("/");
    }
  };

  const confirmLogout = () => {
    setDrawerOpen(false);
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel", onPress: () => setDrawerOpen(true) },
      { text: "Logout", style: "destructive", onPress: handleLogout },
    ]);
  };

  const handleDownloadAllImages = () => {
    setDrawerOpen(false);
    Alert.alert(
      "Download All Images",
      "Download functionality will be implemented here.",
      [{ text: "OK", style: "default" }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Drawer Overlay */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDrawerOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.drawer}>
                <Text style={styles.drawerTitle}>Menu</Text>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    router.push("/images");
                  }}
                >
                  <Ionicons name="images-outline" size={22} color="#333" />
                  <Text style={styles.drawerItemText}>See Images</Text>
                </TouchableOpacity>

                {/* ✅ NEW: See Offline Images */}
                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    router.push("/offline-images");
                  }}
                >
                  <Ionicons name="cloud-offline-outline" size={22} color="#333" />
                  <Text style={styles.drawerItemText}>See Offline Images</Text>
                </TouchableOpacity>

                {/* Download All Images */}
                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={handleDownloadAllImages}
                >
                  <Ionicons name="download-outline" size={22} color="#333" />
                  <Text style={styles.drawerItemText}>Download All Images</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    router.push("/signup");
                  }}
                >
                  <Ionicons name="person-add-outline" size={22} color="#333" />
                  <Text style={styles.drawerItemText}>Sign Up</Text>
                </TouchableOpacity>

                {/* Logout — pinned at bottom */}
                <TouchableOpacity
                  style={styles.logoutItem}
                  onPress={confirmLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color="#E53935" />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={32} color="black" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {patient.name ? (
          <Text style={styles.patientText}>Active Patient: {patient.name}</Text>
        ) : null}

        <View style={styles.buttonWrapper}>
          <Button title="Add Patient" onPress={() => router.push("/add-patient")} />
        </View>

        <View style={styles.buttonWrapper}>
          <Button title="Reset Patient" onPress={clearPatient} color="#d9534f" />
        </View>

        <View style={styles.buttonWrapper}>
          <Button title="Click Photo" onPress={() => router.push("/camera")} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    height: 60,
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 40,
  },

  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  buttonWrapper: { marginVertical: 10, width: 200 },
  patientText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "green",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#111",
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    gap: 12,
  },
  drawerItemText: {
    fontSize: 16,
    color: "#333",
  },

  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
  },
  logoutText: {
    fontSize: 16,
    color: "#E53935",
    fontWeight: "600",
  },
});