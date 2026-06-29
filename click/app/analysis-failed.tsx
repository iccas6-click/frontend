import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';

const APPLE_THEME = {
  background: '#F2F2F7',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  tintBlue: '#007AFF',
  danger: '#FF3B30',
};

export default function AnalysisFailedScreen() {
  const router = useRouter();
  const { items } = useLocalSearchParams<{ items?: string }>();

  // 다시 시도: 같은 항목으로 분석 화면 재진입
  const retry = () => {
    router.replace({ pathname: '/analyze', params: { items } });
  };

  // 처음으로: 스택 정리 후 홈
  const goHome = () => {
    try {
      router.dismissAll();
    } catch {
      // 정리할 스택이 없으면 무시
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <StepIndicator current={3} background={APPLE_THEME.background} />

      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-offline-outline" size={56} color={APPLE_THEME.danger} />
        </View>
        <Text style={styles.title}>분석에 실패했어요</Text>
        <Text style={styles.desc}>
          결과를 가져오지 못했어요.{'\n'}잠시 후 다시 시도해 주세요.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={retry}>
          <Text style={styles.primaryText}>다시 시도</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={goHome}>
          <Text style={styles.secondaryText}>처음으로 돌아가기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 14,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFE5E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: APPLE_THEME.textDark,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 16,
    lineHeight: 23,
    color: APPLE_THEME.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  primary: {
    backgroundColor: APPLE_THEME.tintBlue,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondary: {
    backgroundColor: '#E5F1FF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryText: {
    color: APPLE_THEME.tintBlue,
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
