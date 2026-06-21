import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { devLog } from '@/services/debug-log';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);

  // 권한 상태 로딩 중
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Brand.primary} />
      </View>
    );
  }

  // 권한 미허용 → 요청 안내
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <Ionicons name="camera-outline" size={56} color={Brand.primary} />
        <Text style={styles.permissionTitle}>카메라 권한이 필요해요</Text>
        <Text style={styles.permissionDesc}>
          약 봉투와 라벨을 촬영하려면{'\n'}카메라 접근을 허용해 주세요
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용하기</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>돌아가기</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      devLog('[카메라] ◀ 촬영 완료, 사진 uri:', photo?.uri ?? '(없음)');
      if (!photo?.uri) {
        Alert.alert('촬영 실패', '사진을 가져오지 못했어요. 다시 시도해 주세요.');
        return;
      }
      // 촬영한 사진을 결과(OCR 확인) 화면으로 전달
      router.push({ pathname: '/result', params: { photoUri: photo.uri } });
    } catch (e) {
      console.warn('촬영 오류:', e);
      Alert.alert('촬영 오류', String(e));
    } finally {
      setTaking(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* 상단: 닫기 */}
        <View style={styles.topBar}>
          <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* 안내 문구 */}
        <Text style={styles.guide}>약 봉투 또는 라벨을 화면 안에 맞춰주세요</Text>

        {/* 하단: 셔터 */}
        <View style={styles.bottomBar}>
          <Pressable
            style={styles.shutter}
            onPress={takePicture}
            disabled={taking}
            accessibilityRole="button"
            accessibilityLabel="촬영">
            {taking ? (
              <ActivityIndicator color={Brand.primary} />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  guide: {
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.textDark,
    marginTop: 8,
  },
  permissionDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: Brand.textMuted,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 16,
    backgroundColor: Brand.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backLink: {
    marginTop: 8,
    color: Brand.textMuted,
    fontSize: 14,
  },
});
