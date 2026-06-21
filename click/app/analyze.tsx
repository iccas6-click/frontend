import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';
import { Brand } from '@/constants/theme';
import { analyzeInteractions } from '@/services/interactions';
import type { RecognizedItem } from '@/types/medication';

export default function AnalyzeScreen() {
  const router = useRouter();
  const { items: itemsParam } = useLocalSearchParams<{ items?: string }>();
  const [error, setError] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 진행바 애니메이션 (약 5초)
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    let cancelled = false;
    (async () => {
      try {
        const items: RecognizedItem[] = itemsParam ? JSON.parse(itemsParam) : [];
        const result = await analyzeInteractions(items);
        if (!cancelled) {
          router.replace({ pathname: '/analysis', params: { result: JSON.stringify(result) } });
        }
      } catch (e) {
        console.warn('상호작용 분석 실패:', e);
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [itemsParam, progress, router]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['8%', '100%'] });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI 분석 중</Text>
      </View>

      <View style={styles.body}>
        <StepIndicator current={3} />

        {error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color={Brand.textMuted} />
            <Text style={styles.errorText}>분석에 실패했어요</Text>
            <Pressable style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryText}>돌아가기</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.center}>
            {/* 로봇 일러스트 */}
            <View style={styles.robotWrap}>
              <View style={styles.ringOuter} />
              <View style={styles.ringInner} />
              <Text style={styles.robot}>🤖</Text>
            </View>

            <Text style={styles.title}>AI가 분석하고 있어요</Text>
            <Text style={styles.subtitle}>잠시만 기다려 주세요 (약 5초 소요)</Text>

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: barWidth }]} />
            </View>
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
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ringOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(41,181,199,0.08)',
  },
  ringInner: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(41,181,199,0.14)',
  },
  robot: {
    fontSize: 90,
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
    marginBottom: 32,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E4E9EC',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: Brand.primary,
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
