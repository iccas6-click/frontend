import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepIndicator } from '@/components/step-indicator';
import type { ItemCategory } from '@/types/medication';

const APPLE_THEME = { background: '#F2F2F7', card: '#FFFFFF', textDark: '#1C1C1E', textMuted: '#8E8E93', tintBlue: '#007AFF' };

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; prevItems?: string; recordId?: string }>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);
  
  const category: ItemCategory = params.category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';

  // 권한 상태 로딩 중
  if (!permission) return <SafeAreaView style={styles.center}><ActivityIndicator color={APPLE_THEME.tintBlue} size="large" /></SafeAreaView>;

  // 권한 미허용 → 촬영 전에 권한 요청 화면 표시
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={APPLE_THEME.tintBlue} />
            <Text style={styles.backText}>뒤로</Text>
          </Pressable>
        </View>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={56} color={APPLE_THEME.tintBlue} />
          <Text style={styles.permissionTitle}>카메라 권한이 필요해요</Text>
          <Text style={styles.permissionDesc}>
            약 봉투·라벨을 촬영하려면{'\n'}카메라 접근을 허용해 주세요
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>권한 허용하기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      if (!photo?.uri) return;
      router.push({
        pathname: '/result',
        params: {
          photoUri: photo.uri,
          category,
          prevItems: params.prevItems,
          recordId: params.recordId,
        },
      });
    } catch (e) { Alert.alert('촬영 오류', String(e)); }
    finally { setTaking(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.headerRow}><Pressable style={styles.backButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={APPLE_THEME.tintBlue} /><Text style={styles.backText}>뒤로</Text></Pressable></View>
      <StepIndicator current={1} background={APPLE_THEME.background} />
      <Text style={styles.pageTitleCam}>사진 촬영</Text>
      <View style={styles.cameraWrapper}><CameraView ref={cameraRef} style={styles.camera} facing="back" /></View>
      <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
        <Pressable style={styles.shutterOuter} onPress={takePicture} disabled={taking}>
          {taking ? <ActivityIndicator color={APPLE_THEME.tintBlue} /> : <View style={styles.shutterInner} />}
        </Pressable>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APPLE_THEME.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { paddingHorizontal: 8, paddingTop: 12 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 17, color: APPLE_THEME.tintBlue },
  pageTitleCam: { fontSize: 32, fontWeight: '800', paddingHorizontal: 20, marginTop: 8 },
  cameraWrapper: { flex: 1, margin: 20, borderRadius: 24, overflow: 'hidden' },
  camera: { flex: 1 },
  bottomArea: { paddingBottom: 24, alignItems: 'center' },
  shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#D1D1D6', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: APPLE_THEME.tintBlue },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  permissionTitle: { fontSize: 20, fontWeight: '800', color: APPLE_THEME.textDark, marginTop: 8 },
  permissionDesc: { fontSize: 15, lineHeight: 22, color: APPLE_THEME.textMuted, textAlign: 'center' },
  permissionButton: { marginTop: 16, backgroundColor: APPLE_THEME.tintBlue, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  permissionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});