import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
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

export default function Home() {
  const router = useRouter();
  const { patient, clearPatient } = usePatientStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    justifyContent: "flex-start", // moved to left
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

  // Drawer styles
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
});