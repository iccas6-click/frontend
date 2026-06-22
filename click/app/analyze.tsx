import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';
import { Brand } from '@/constants/theme';
import { devLog } from '@/services/debug-log';
import { analyzeInteractions } from '@/services/interactions';
import type { RecognizedItem } from '@/types/medication';

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI 분석 중</Text>
      </View>

      <View style={styles.body}>
        <StepIndicator current={3} />

        {error ? (
          <View style={styles.center}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={Brand.textMuted}
            />
            <Text style={styles.errorText}>분석에 실패했어요</Text>
            <Pressable style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryText}>돌아가기</Text>
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
    backgroundColor: Brand.primary,
  },
  header: {
    backgroundColor: Brand.primary,
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    backgroundColor: Brand.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  robotWrap: {
    width: ROBOT_SIZE,
    height: ROBOT_SIZE,
    marginTop: 24,
    marginBottom: 32,
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
    backgroundColor: 'rgba(41,181,199,0.08)',
  },
  ringInner: {
    position: 'absolute',
    width: RING_INNER,
    height: RING_INNER,
    borderRadius: RING_INNER / 2,
    left: BALL.x - RING_INNER / 2,
    top: BALL.y - RING_INNER / 2,
    backgroundColor: 'rgba(41,181,199,0.14)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: Brand.textMuted,
    marginTop: 10,
  },
  errorText: {
    fontSize: 15,
    color: Brand.textMuted,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Brand.primary,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
