import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { devLog } from '@/services/debug-log';
import { updateSessionAnalysis } from '@/services/history-storage';
import { analyzeInteractions } from '@/services/interactions';
import type { RecognizedItem } from '@/types/medication';

export default function AnalyzeScreen() {
  const router = useRouter();
  const { items: itemsParam, recordId } = useLocalSearchParams<{ items?: string; recordId?: string }>();

  useEffect(() => {
    let cancelled = false;

    const goFail = () => {
      if (!cancelled) {
        router.replace({ pathname: '/analysis-failed', params: { items: itemsParam, recordId: recordId ?? '' } });
      }
    };

    (async () => {
      try {
        const items: RecognizedItem[] = itemsParam ? JSON.parse(itemsParam) : [];
        devLog('[3단계] ▶ 상호작용 분석 요청, 항목 수:', items.length);
        const result = await analyzeInteractions(items);
        if (cancelled) return;

        if (!result || !Array.isArray(result.pairs)) {
          goFail();
          return;
        }

        if (recordId) {
          await updateSessionAnalysis(recordId, result);
        }

        router.replace({
          pathname: '/analysis',
          params: { result: JSON.stringify(result), recordId: recordId ?? '' },
        });
      } catch (e) {
        console.warn('상호작용 분석 실패:', e);
        goFail();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [itemsParam, recordId, router]);

  return (
    <Screen>
      <TopBar title="상호작용 분석 중" subtitle="성분 조합을 대조하고 상담이 필요한 항목을 정리하고 있어요." />
      <StepIndicator current={3} />
      <View style={styles.body}>
        <View style={styles.analysisCard}>
          <View style={styles.visualWrap}>
            <View style={styles.pulseOuter} />
            <View style={styles.pulseInner} />
            <Image source={require('@/assets/images/robot.png')} style={styles.robot} contentFit="contain" />
          </View>
          <Text style={styles.title}>잠시만 기다려 주세요</Text>
          <Text style={styles.subtitle}>복용 중단을 지시하지 않고, 상담이 필요한 신호만 먼저 찾아봅니다.</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screen,
    paddingBottom: 64,
  },
  analysisCard: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 26,
    paddingVertical: 34,
    ...Shadow.card,
  },
  visualWrap: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  robot: {
    width: 150,
    height: 150,
  },
  pulseOuter: {
    position: 'absolute',
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: Palette.primarySoft,
  },
  pulseInner: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Palette.surface,
  },
  title: {
    ...Typography.section,
    color: Palette.text,
    marginTop: 10,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.surfaceMuted,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    width: '58%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.primary,
  },
});
