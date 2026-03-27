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
} from "react-native";

export default function AddPatient() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [hospital, setHospital] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const handleScanQR = () => {
    if (!permission?.granted) {
      requestPermission();
    }
    setShowScanner(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    setShowScanner(false);
    alert(`Scanned: ${data}`);
  };

  const handleSave = () => {
    router.push({ pathname: "/home", params: { name: name } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Details</Text>

      <TextInput
        style={styles.input}
        placeholder="name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="gender"
        value={gender}
        onChangeText={setGender}
      />
      <TextInput
        style={styles.input}
        placeholder="hospital name"
        value={hospital}
        onChangeText={setHospital}
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

      <View style={styles.saveWrapper}>
        <Button title="Save & Return" onPress={handleSave} color="green" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
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
  saveWrapper: { width: "100%", marginTop: "auto", marginBottom: 30 },
});
