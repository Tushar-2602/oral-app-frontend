import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { usePatientStore } from "@/store/patientStore";

export default function AddPatient() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);

  const { patient, setPatient, clearPatient } = usePatientStore();

  const handleScanQR = () => {
    if (!permission?.granted) requestPermission();
    setShowScanner(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setShowScanner(false);
    setPatient({ qrData: data });
  };

  const handleSave = () => {
    const snapshot = { ...patient };
    clearPatient();
    setPatient(snapshot);
    router.push({ pathname: "/home", params: { name: snapshot.name } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Patient Details</Text>

      <Text style={styles.label}>Patient ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Patient ID"
        value={patient.patientId}
        onChangeText={(v) => setPatient({ patientId: v })}
      />

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={patient.name}
        onChangeText={(v) => setPatient({ name: v })}
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        placeholder="Age"
        value={patient.age}
        onChangeText={(v) => setPatient({ age: v })}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Gender</Text>
      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={patient.gender}
        onChangeText={(v) => setPatient({ gender: v })}
      />

      <Text style={styles.label}>Hospital</Text>
      <TextInput
        style={styles.input}
        placeholder="Hospital name"
        value={patient.hospital}
        onChangeText={(v) => setPatient({ hospital: v })}
      />

      <Text style={styles.label}>QR Data</Text>
      <TextInput
        style={[styles.input, styles.qrInput]}
        placeholder="QR data (scan or type)"
        value={patient.qrData}
        onChangeText={(v) => setPatient({ qrData: v })}
        multiline
      />

      {!showScanner ? (
        <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
          <Text style={styles.scanButtonText}>Scan QR</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.cameraBox}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <Button
            title="Close Scanner"
            onPress={() => setShowScanner(false)}
            color="red"
          />
        </View>
      )}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Patient notes / description"
        value={patient.description}
        onChangeText={(v) => setPatient({ description: v })}
        multiline
        numberOfLines={4}
      />

      <View style={styles.saveWrapper}>
        <Button title="Save & Return" onPress={handleSave} color="green" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
    marginLeft: 2,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  qrInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  descriptionInput: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  scanButton: {
    backgroundColor: "#000",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  scanButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  scannerContainer: { width: "100%", alignItems: "center", marginBottom: 20 },
  cameraBox: { width: 250, height: 250, marginBottom: 10 },
  saveWrapper: { width: "100%", marginTop: 10, marginBottom: 30 },
});