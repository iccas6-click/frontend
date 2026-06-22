import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { devLog } from '@/services/debug-log';

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);

  // 상단 공통 헤더 (뒤로가기 + 타이틀)
  const renderHeader = (title: string) => (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          <Text style={styles.headerText}>뒤로</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRight} />
      </View>
    </View>
  );

  // 공통 4단계 진행 바 (1단계 '촬영' 활성화 상태)
  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepLineBackground} />

      {/* 1. 촬영 (현재 단계) */}
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, styles.stepCircleActive]}>
          <Text style={styles.stepCircleTextActive}>1</Text>
        </View>
        <Text style={styles.stepLabelActive}>촬영</Text>
      </View>

      {/* 2. 확인 */}
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, styles.stepCircleInactive]}>
          <Text style={styles.stepCircleTextInactive}>2</Text>
        </View>
        <Text style={styles.stepLabelInactive}>확인</Text>
      </View>

      {/* 3. 분석 */}
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, styles.stepCircleInactive]}>
          <Text style={styles.stepCircleTextInactive}>3</Text>
        </View>
        <Text style={styles.stepLabelInactive}>분석</Text>
      </View>

      {/* 4. 결과 */}
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, styles.stepCircleInactive]}>
          <Text style={styles.stepCircleTextInactive}>4</Text>
        </View>
        <Text style={styles.stepLabelInactive}>결과</Text>
      </View>
    </View>
  );

  // 권한 상태 로딩 중
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Brand.primary} size="large" />
      </View>
    );
  }

  // 1️⃣ 카메라 권한 미허용 화면
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        {renderHeader('사진 촬영')}
        <View style={styles.whiteBackground}>
          {renderStepIndicator()}
        </View>

        <View style={styles.content}>
          <View style={styles.permissionIconWrap}>
            <Ionicons name="camera-outline" size={64} color={Brand.primary} />
          </View>
          <Text style={styles.title}>카메라 권한이 필요해요</Text>
          <Text style={styles.description}>
            약 봉투와 라벨을 촬영하려면{'\n'}카메라 접근을 허용해 주세요
          </Text>
        </View>

        <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
          <Pressable onPress={() => router.back()} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>돌아가기</Text>
          </Pressable>
          <Pressable style={styles.fullButton} onPress={requestPermission}>
            <Text style={styles.fullButtonText}>권한 허용하기</Text>
          </Pressable>
        </SafeAreaView>
      </View>
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
        Alert.alert('촬영 실패', '사진을 가져오지 못했어요. 다시 시도해 주세요.');
        return;
      }
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
      {renderHeader('사진 촬영')}
      <View style={styles.whiteBackground}>
        {renderStepIndicator()}
      </View>

      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        <View style={styles.cameraOverlay}>
          <Text style={styles.guideText}>인식할 항목을 화면 안에 맞춰주세요</Text>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
        <View style={styles.shutterContainer}>
          <Pressable
            style={styles.shutterOuter}
            onPress={takePicture}
            disabled={taking}
          >
            {taking ? (
              <ActivityIndicator color={Brand.primary} size="large" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// 스타일 시트
const styles = StyleSheet.create({
  // 공통 레이아웃
  container: {
    flex: 1,
    backgroundColor: Brand.surface, // 다른 페이지와 동일한 배경색
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surface, // 다른 페이지와 동일한 배경색
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // 상단 헤더 영역
  headerContainer: {
    backgroundColor: Brand.primary, // 민트색 배경
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 2,
    textAlign: 'center',
  },
  headerRight: {
    flex: 1,
  },

  // 진행 바 (Step Indicator) 영역
  whiteBackground: {
    backgroundColor: Brand.surface, // 다른 페이지와 동일한 배경색 (흰색 → 베이지)
    paddingVertical: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    position: 'relative',
  },
  stepLineBackground: {
    position: 'absolute',
    top: 14,
    left: 48,
    right: 48,
    height: 2,
    backgroundColor: '#EEEEEE',
    zIndex: -1,
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Brand.primary,
  },
  stepCircleInactive: {
    backgroundColor: '#F0F0F0',
  },
  stepCircleTextActive: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepCircleTextInactive: {
    color: '#BBBBBB',
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabelActive: {
    fontSize: 12,
    color: Brand.primary,
    fontWeight: '700',
  },
  stepLabelInactive: {
    fontSize: 12,
    color: '#BBBBBB',
    fontWeight: '500',
  },

  // 텍스트 및 안내 문구
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginTop: 24,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // 하단 버튼 영역
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  fullButton: {
    backgroundColor: Brand.primary,
    width: '100%',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  cancelLinkText: {
    color: '#999999',
    fontSize: 14,
  },

  // 카메라 뷰 레이아웃
  cameraWrapper: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000', // 로딩 전 대비용 배경
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    overflow: 'hidden',
  },
  shutterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.primary,
  },
});
