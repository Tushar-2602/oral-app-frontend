import * as ImageManipulator from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { File, Directory, Paths } from "expo-file-system/next";
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import {
  Alert,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePatientStore } from "@/store/patientStore";
import { API_URL, TokenService } from "./index";

// Module-level singleton — opened once, reused forever
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync("app.db");
  await dbInstance.execAsync(`
    CREATE TABLE IF NOT EXISTS saved_records (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL
    );
  `);
  return dbInstance;
};

export default function ThirdScreen() {
  const { uri } = useLocalSearchParams();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { patient } = usePatientStore();

  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(300);
  const [cropHeight, setCropHeight] = useState(300);

  const initCrop = useRef({ x: 0, y: 0, w: 300, h: 300 });

  useEffect(() => {
    if (uri) setDisplayUri(String(uri));
  }, [uri]);

  const createPanResponder = (edge: "top" | "bottom" | "left" | "right") => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        initCrop.current = { x: cropX, y: cropY, w: cropWidth, h: cropHeight };
      },
      onPanResponderMove: (_, gestureState) => {
        let { x, y, w, h } = initCrop.current;
        const minSize = 50;

        if (edge === "top") {
          const newY = Math.max(0, Math.min(y + gestureState.dy, y + h - minSize));
          const diff = newY - y;
          setCropY(newY);
          setCropHeight(h - diff);
        } else if (edge === "bottom") {
          const newH = Math.max(minSize, Math.min(h + gestureState.dy, 300 - y));
          setCropHeight(newH);
        } else if (edge === "left") {
          const newX = Math.max(0, Math.min(x + gestureState.dx, x + w - minSize));
          const diff = newX - x;
          setCropX(newX);
          setCropWidth(w - diff);
        } else if (edge === "right") {
          const newW = Math.max(minSize, Math.min(w + gestureState.dx, 300 - x));
          setCropWidth(newW);
        }
      },
    });
  };

  const topPan = useRef(createPanResponder("top")).current;
  const bottomPan = useRef(createPanResponder("bottom")).current;
  const leftPan = useRef(createPanResponder("left")).current;
  const rightPan = useRef(createPanResponder("right")).current;

  const handleTextChange = (text: string) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= 50) setDescription(text);
  };

  const handleCrop = () => {
    if (!displayUri) return;
    Image.getSize(displayUri, async (actualWidth, actualHeight) => {
      const scaleX = actualWidth / 300;
      const scaleY = actualHeight / 300;
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          displayUri,
          [
            {
              crop: {
                originX: cropX * scaleX,
                originY: cropY * scaleY,
                width: cropWidth * scaleX,
                height: cropHeight * scaleY,
              },
            },
          ],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );
        setDisplayUri(manipResult.uri);
        setCropX(0);
        setCropY(0);
        setCropWidth(300);
        setCropHeight(300);
      } catch (error) {
        console.log(error);
      }
    });
  };

  const handleSaveToDevice = async () => {
    if (!displayUri) {
      Alert.alert("Error", "No image to save.");
      return;
    }

    try {
      // 1. Generate UUID
      const id = Crypto.randomUUID();

      // 2. Ensure permanent directory exists
      const savedImagesDir = new Directory(Paths.document, "saved_images");
      if (!savedImagesDir.exists) {
        savedImagesDir.create();
      }

      // 3. Copy image file to permanent storage
      const sourceFile = new File(displayUri);
      const destFile = new File(savedImagesDir, `${id}.jpg`);
      sourceFile.copy(destFile);

      const permanentUri = destFile.uri;
      const size = sourceFile.size ?? 0;

      // 4. Build data payload (no tokens)
      const data = JSON.stringify({
        uri: permanentUri,
        size,
        fileName: `${id}.jpg`,
        fileType: "image/jpeg",
        patientName: patient.name,
        patientAge: patient.age,
        patientId: patient.patientId,
        patientDescription: patient.description,
        patientQrData: patient.qrData,
        hospitalName: patient.hospital,
        gender:patient.gender,
        attendantDescription: description,
        savedAt: new Date().toISOString(),
      });

      // 5. Insert into SQLite
      const db = await getDb();
      await db.runAsync(
        "INSERT INTO saved_records (id, data) VALUES (?, ?);",
        id,
        data
      );
      
        const rows = await db.getAllAsync("SELECT * FROM saved_records;");
  console.log(JSON.stringify(rows, null, 2));
      
      Alert.alert("Saved", "Record saved to device successfully.");
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message ?? "Failed to save. Please try again.");
    }
  };

  const handleUpload = async () => {
    if (!displayUri) {
      Alert.alert("Error", "No image to upload.");
      return;
    }

    setUploading(true);
    try {
      const accessToken = await TokenService.getAccess();
      const refreshToken = await TokenService.getRefresh();

      const fileName = displayUri.split("/").pop() ?? `image_${Date.now()}.jpg`;
      const fileType = "image/jpeg";

      const file = new File(displayUri);
      const size = file.size ?? 0;

      const backendResponse = await fetch(`${API_URL}/content/uploadRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          fileType,
          patientName: patient.name,
          patientAge: patient.age,
          patientId: patient.patientId,
          patientDescription: patient.description,
          patientQrData: patient.qrData,
          hospitalName: patient.hospital,
          attendantDescription: description,
          patientGender:patient.gender,
          size,
          accessToken,
          refreshToken,
        }),
      });
      console.log(patient);

      if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.status}`);
      }

      const resp = await backendResponse.json();
      const data = resp.data;
      console.log(data);

      if (data.newAccessToken && data.newRefreshToken) {
        await TokenService.save(data.newAccessToken, data.newRefreshToken);
      }

      const { uploadUrl, fields } = data;

      const formData = new FormData();
      if (fields) {
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
      }

      formData.append("file", {
        uri: displayUri,
        name: fileName,
        type: fileType,
      } as any);

      const s3Response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed: ${s3Response.status}`);
      }

      Alert.alert("Success", "Uploaded successfully!");
      setTimeout(() => {
        router.replace("/home");
      }, 2000);
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewContainer}>
        {displayUri ? (
          <Image source={{ uri: displayUri }} style={styles.image} />
        ) : null}

        <View
          style={[
            styles.cropOverlay,
            { left: cropX, top: cropY, width: cropWidth, height: cropHeight },
          ]}
        >
          <View style={styles.edgeTop} {...topPan.panHandlers} />
          <View style={styles.edgeBottom} {...bottomPan.panHandlers} />
          <View style={styles.edgeLeft} {...leftPan.panHandlers} />
          <View style={styles.edgeRight} {...rightPan.panHandlers} />
        </View>
      </View>

      <TouchableOpacity style={styles.cropActionBtn} onPress={handleCrop}>
        <Text style={styles.cropActionText}>Apply Crop</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="describe the problem"
        value={description}
        onChangeText={handleTextChange}
        multiline
      />

      <TouchableOpacity
        style={[styles.uploadButton, uploading && { opacity: 0.6 }]}
        onPress={handleUpload}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>{uploading ? "Uploading..." : "Upload"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveToDevice}>
        <Text style={styles.saveButtonText}>Save to Device</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.rejectButton}
        onPress={() => router.replace("/home")}
      >
        <Text style={styles.buttonText}>Reject</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 40,
  },
  previewContainer: {
    width: 300,
    height: 300,
    borderWidth: 2,
    borderColor: "#000",
    marginBottom: 20,
    position: "relative",
  },
  image: { width: "100%", height: "100%", resizeMode: "stretch" },
  cropOverlay: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "red",
    backgroundColor: "rgba(255, 0, 0, 0.2)",
  },
  edgeTop: {
    position: "absolute",
    top: -15,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  edgeBottom: {
    position: "absolute",
    bottom: -15,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  edgeLeft: {
    position: "absolute",
    left: -15,
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  edgeRight: {
    position: "absolute",
    right: -15,
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  cropActionBtn: {
    backgroundColor: "blue",
    padding: 12,
    borderRadius: 5,
    width: 300,
    alignItems: "center",
    marginBottom: 20,
  },
  cropActionText: { color: "white", fontWeight: "bold", fontSize: 16 },
  input: {
    width: 300,
    height: 80,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: "top",
  },
  uploadButton: {
    backgroundColor: "#000",
    width: 300,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#2e7d32",
    width: 300,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  rejectButton: {
    backgroundColor: "#ccc",
    width: 300,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});