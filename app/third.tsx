import * as ImageManipulator from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ThirdScreen() {
  const { uri } = useLocalSearchParams();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [displayUri, setDisplayUri] = useState<string | null>(null);

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
          const newY = Math.max(
            0,
            Math.min(y + gestureState.dy, y + h - minSize),
          );
          const diff = newY - y;
          setCropY(newY);
          setCropHeight(h - diff);
        } else if (edge === "bottom") {
          const newH = Math.max(
            minSize,
            Math.min(h + gestureState.dy, 300 - y),
          );
          setCropHeight(newH);
        } else if (edge === "left") {
          const newX = Math.max(
            0,
            Math.min(x + gestureState.dx, x + w - minSize),
          );
          const diff = newX - x;
          setCropX(newX);
          setCropWidth(w - diff);
        } else if (edge === "right") {
          const newW = Math.max(
            minSize,
            Math.min(w + gestureState.dx, 300 - x),
          );
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

  const handleUpload = () => {
    console.log(displayUri);
    console.log(description);
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

      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Text style={styles.buttonText}>Upload</Text>
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
  rejectButton: {
    backgroundColor: "#ccc",
    width: 300,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
