import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';
import { devLog } from '@/services/debug-log';
import { analyzeInteractions } from '@/services/interactions';
import type { RecognizedItem } from '@/types/medication';

// 💡 애플 건강 앱 스타일 테마 컬러
const APPLE_THEME = {
  background: '#F2F2F7', 
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  tintBlue: '#007AFF', // 파동 및 버튼에 사용할 iOS 블루
};

const ROBOT_SIZE = 200;
// 로봇 이미지 안에서 노란 원(안테나)의 중심 위치 — 가로 50%, 세로 약 9% 지점
const BALL = { x: ROBOT_SIZE * 0.5, y: ROBOT_SIZE * 0.09 };
// 뒷배경 파란 원 크기
const RING_OUTER = 230;
const RING_INNER = 150;

export default function AnalyzeScreen() {
  const router = useRouter();
  const { items: itemsParam } = useLocalSearchParams<{ items?: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items: RecognizedItem[] = itemsParam
          ? JSON.parse(itemsParam)
          : [];
        devLog('[3단계] ▶ 상호작용 분석 요청, 항목 수:', items.length);
        const result = await analyzeInteractions(items);
        if (!cancelled) {
          devLog('[3단계] ◀ 결과 받음 → 4단계(결과 화면)로 전달');
          router.replace({
            pathname: '/analysis',
            params: { result: JSON.stringify(result) },
          });
        }
      } catch (e) {
        console.warn('상호작용 분석 실패:', e);
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [itemsParam, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StepIndicator current={3} background={APPLE_THEME.background} />

      <View style={styles.body}>
        {error ? (
          <View style={styles.center}>
            <Ionicons
              name="alert-circle-outline"
              size={56}
              color={APPLE_THEME.textMuted}
            />
            <Text style={styles.errorTitle}>분석에 실패했어요</Text>
            <Text style={styles.errorText}>네트워크 상태를 확인해 주세요.</Text>
            <Pressable 
              style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]} 
              onPress={() => router.back()}
            >
              <Text style={styles.retryText}>이전으로 돌아가기</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.center}>
            {/* 로봇 일러스트 (파란 원은 안테나 노란 원 중심에 정렬) */}
            <View style={styles.robotWrap}>
              <View style={styles.ringOuter} />
              <View style={styles.ringInner} />
              <Image
                source={require('@/assets/images/robot.png')}
                style={styles.robot}
                contentFit="contain"
              />
            </View>

            <Text style={styles.title}>AI가 분석하고 있어요</Text>
            <Text style={styles.subtitle}>잠시만 기다려 주세요!</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  body: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40, // 시각적 중앙을 맞추기 위해 살짝 위로 띄움
  },
  
  // 로봇 및 애니메이션 파동 디자인
  robotWrap: {
    width: ROBOT_SIZE,
    height: ROBOT_SIZE,
    marginTop: 24,
    marginBottom: 40,
  },
  robot: {
    width: ROBOT_SIZE,
    height: ROBOT_SIZE,
  },
  ringOuter: {
    position: 'absolute',
    width: RING_OUTER,
    height: RING_OUTER,
    borderRadius: RING_OUTER / 2,
    left: BALL.x - RING_OUTER / 2,
    top: BALL.y - RING_OUTER / 2,
    backgroundColor: 'rgba(0, 122, 255, 0.05)', // 애플 블루 톤으로 맞춤
  },
  ringInner: {
    position: 'absolute',
    width: RING_INNER,
    height: RING_INNER,
    borderRadius: RING_INNER / 2,
    left: BALL.x - RING_INNER / 2,
    top: BALL.y - RING_INNER / 2,
    backgroundColor: 'rgba(0, 122, 255, 0.12)', // 애플 블루 톤으로 맞춤
  },

  // 텍스트 타이틀
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: APPLE_THEME.textDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: APPLE_THEME.textMuted,
    marginTop: 10,
  },

  // 에러 화면
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: APPLE_THEME.textDark,
    marginTop: 16,
  },
  errorText: {
    fontSize: 15,
    color: APPLE_THEME.textMuted,
    marginTop: 8,
    marginBottom: 32,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: APPLE_THEME.tintBlue, // iOS 블루 버튼
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});