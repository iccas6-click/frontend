import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';
import { devLog } from '@/services/debug-log';
import type { ItemCategory } from '@/types/medication';

const APPLE_THEME = {
  background: '#F2F2F7', 
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  tintBlue: '#007AFF',
};

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);
  
  const category: ItemCategory =
    params.category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';

  // 권한 상태 로딩 중
  if (!permission) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={APPLE_THEME.tintBlue} size="large" />
      </SafeAreaView>
    );
  }

  // 1️⃣ 카메라 권한 미허용 화면
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <StepIndicator current={1} background={APPLE_THEME.background} />

        <View style={styles.content}>
          <Text style={styles.pageTitle}>사진 촬영</Text>
          
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconWrap}>
              <Ionicons name="camera" size={48} color={APPLE_THEME.tintBlue} />
            </View>
            <Text style={styles.title}>카메라 권한이 필요해요</Text>
            <Text style={styles.description}>
              알약과 건강기능식품 라벨을 촬영하려면{'\n'}카메라 접근을 허용해 주세요.
            </Text>
          </View>
        </View>

        <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
          <Pressable onPress={() => router.back()} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>돌아가기</Text>
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.fullButton, pressed && styles.buttonPressed]} 
            onPress={requestPermission}
          >
            <Text style={styles.fullButtonText}>권한 허용하기</Text>
          </Pressable>
        </SafeAreaView>
      </SafeAreaView>
    );
  }

  // 2️⃣ 카메라 촬영 화면
  const takePicture = async () => {
    if (taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      devLog('[카메라] ◀ 촬영 완료, 사진 uri:', photo?.uri ?? '(없음)');
      if (!photo?.uri) {
        Alert.alert(
          '촬영 실패',
          '사진을 가져오지 못했어요. 다시 시도해 주세요.',
        );
        return;
      }
      router.push({
        pathname: '/result',
        params: { photoUri: photo.uri, category },
      });
    } catch (e) {
      console.warn('촬영 오류:', e);
      Alert.alert('촬영 오류', String(e));
    } finally {
      setTaking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <StepIndicator current={1} background={APPLE_THEME.background} />

      <Text style={styles.pageTitleCam}>사진 촬영</Text>

      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.cameraOverlay}>
          <Text style={styles.guideText}>
            {category}을 화면 안에 맞춰주세요
          </Text>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
        <View style={styles.shutterContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.shutterOuter,
              pressed && styles.shutterPressed
            ]}
            onPress={takePicture}
            disabled={taking}
          >
            {taking ? (
              <ActivityIndicator color={APPLE_THEME.tintBlue} size="large" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APPLE_THEME.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: APPLE_THEME.textDark,
    marginTop: 16,
    marginBottom: 24,
  },
  pageTitleCam: {
    fontSize: 32,
    fontWeight: '800',
    color: APPLE_THEME.textDark,
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  permissionCard: {
    backgroundColor: APPLE_THEME.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  permissionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: APPLE_THEME.textDark,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: APPLE_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
  },
  fullButton: {
    backgroundColor: APPLE_THEME.tintBlue,
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  fullButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  cancelLinkText: {
    color: APPLE_THEME.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  cameraWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    color: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    fontWeight: '600',
    overflow: 'hidden',
  },
  shutterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: APPLE_THEME.tintBlue,
  },
});