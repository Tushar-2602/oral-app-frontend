import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePatientStore } from "@/store/patientStore"; // adjust path as needed

export default function Home() {
  const router = useRouter();
  const { patient, clearPatient } = usePatientStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="menu" size={32} color="black" />
        </TouchableOpacity>
      </View>
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
    justifyContent: "flex-end",
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
});