import { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const router = useRouter();

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
        if (cameraRef.current) {
          try {
            const photo = await cameraRef.current.takePictureAsync();
            if (photo?.uri) {
              router.push({ pathname: '/third', params: { uri: photo.uri } });
            }
          } catch (error) {
            console.error('Failed to take picture:', error);
          }
        }
      };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.focusBox} />
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <Text style={styles.captureText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middleRow: { flexDirection: 'row', height: 300 },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  focusBox: { width: 300, height: 300, borderWidth: 2, borderColor: '#fff', backgroundColor: 'transparent' },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  permissionText: { textAlign: 'center', marginBottom: 20 },
  captureButton: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  captureText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
});