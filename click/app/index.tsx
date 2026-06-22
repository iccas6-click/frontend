import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';
import { Brand } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.logo}>CLICK</Text>
        <Text style={styles.logoSub}>의약품 상호작용 확인</Text>
      </View>

      {/* 단계 표시줄 */}
      <StepIndicator current={1} />

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.title}>어떤 것을 확인하시겠어요?</Text>
        <Text style={styles.desc}>
          약 봉투 또는 건강기능식품 라벨을{'\n'}카메라로 찍어주세요
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.cameraButton,
            pressed && styles.cameraButtonPressed,
          ]}
          onPress={() => router.push('/camera')}
          accessibilityRole="button"
          accessibilityLabel="카메라로 촬영하기"
        >
          <Ionicons name="camera" size={72} color="#FFFFFF" />
          <Text style={styles.cameraButtonText}>카메라로 촬영하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  header: {
    backgroundColor: Brand.primary,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logoSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    flex: 1,
    backgroundColor: Brand.surface,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
    alignSelf: 'flex-start',
    fontSize: 20,
    fontWeight: '700',
    color: Brand.textDark,
  },
  desc: {
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    color: Brand.textMuted,
    marginTop: 10,
  },
  cameraButton: {
    marginTop: 48,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Brand.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cameraButtonPressed: {
    backgroundColor: Brand.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
