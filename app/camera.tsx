import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Button, Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const MIN_BOX = 100;
const MAX_BOX = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) - 40;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const [boxSize, setBoxSize] = useState(280);
  const initBoxSize = useRef(280);

  const resizePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        initBoxSize.current = boxSize;
      },
      onPanResponderMove: (_, g) => {
        const delta = (g.dx + g.dy) / 2;
        const newSize = Math.min(MAX_BOX, Math.max(MIN_BOX, initBoxSize.current + delta));
        setBoxSize(newSize);
      },
    })
  ).current;

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ skipProcessing: true });
      if (!photo?.uri) return;

      // Use the larger dimension as "height" to handle portrait photos correctly
      // On Android with skipProcessing, width/height may be swapped relative to display
      const photoLongSide = Math.max(photo.width, photo.height);
      const photoShortSide = Math.min(photo.width, photo.height);

      // Map screen dimensions to photo dimensions
      // Screen is portrait: short side = width, long side = height
      const scaleX = photoShortSide / SCREEN_WIDTH;
      const scaleY = photoLongSide / SCREEN_HEIGHT;

      const boxLeft = (SCREEN_WIDTH - boxSize) / 2;
      const boxTop = (SCREEN_HEIGHT - boxSize) / 2;

      const cropX = boxLeft * scaleX;
      const cropY = boxTop * scaleY;
      const cropW = boxSize * scaleX;
      const cropH = boxSize * scaleY;

      // Clamp crop rect to be strictly within photo bounds
      const safeX = Math.max(0, Math.min(cropX, photoShortSide - 1));
      const safeY = Math.max(0, Math.min(cropY, photoLongSide - 1));
      const safeW = Math.min(cropW, photoShortSide - safeX);
      const safeH = Math.min(cropH, photoLongSide - safeY);

      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: safeX,
              originY: safeY,
              width: safeW,
              height: safeH,
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      router.push({ pathname: '/third', params: { uri: cropped.uri } });
    } catch (error) {
      console.error('Failed to take picture:', error);
    }
  };

  const boxLeft = (SCREEN_WIDTH - boxSize) / 2;
  const boxTop = (SCREEN_HEIGHT - boxSize) / 2;

  return (
    // FIX 1: CameraView has no children — overlays are siblings in a wrapper View
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} />

      {/* Top overlay */}
      <View style={[styles.darkOverlay, { top: 0, left: 0, right: 0, height: boxTop }]} />

      {/* Bottom overlay */}
      <View style={[styles.darkOverlay, { top: boxTop + boxSize, left: 0, right: 0, bottom: 0 }]} />

      {/* Left overlay */}
      <View style={[styles.darkOverlay, { top: boxTop, left: 0, width: boxLeft, height: boxSize }]} />

      {/* Right overlay */}
      <View style={[styles.darkOverlay, { top: boxTop, left: boxLeft + boxSize, right: 0, height: boxSize }]} />

      {/* Focus box border */}
      <View
        style={[
          styles.focusBox,
          { left: boxLeft, top: boxTop, width: boxSize, height: boxSize },
        ]}
      >
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} {...resizePan.panHandlers}>
          <View style={styles.resizeHandle} />
        </View>
      </View>

      <Text style={[styles.hint, { top: boxTop + boxSize + 12 }]}>
        Drag ↘ corner to resize
      </Text>

      <View style={styles.captureArea}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <Text style={styles.captureText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  darkOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  focusBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  topLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  topRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#fff' },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  bottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#fff', justifyContent: 'flex-end', alignItems: 'flex-end' },
  resizeHandle: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 3,
    margin: 2,
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#fff',
    fontSize: 13,
    opacity: 0.8,
  },
  captureArea: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  captureText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  permissionText: { textAlign: 'center', marginBottom: 20 },
});