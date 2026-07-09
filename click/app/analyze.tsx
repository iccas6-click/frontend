import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { devLog } from '@/services/debug-log';
import { markAnalysisCompleted, markAnalysisFailed, markAnalysisStarted } from '@/services/flow-metrics';
import { updateSessionAnalysis, updateSessionItems } from '@/services/history-storage';
import { analyzeInteractions } from '@/services/interactions';
import { formatElapsedSeconds, useI18n } from '@/services/i18n';
import type { RecognizedItem } from '@/types/medication';

export default function AnalyzeScreen() {
  const router = useRouter();
  const { items: itemsParam, recordId, flowId } = useLocalSearchParams<{ items?: string; recordId?: string; flowId?: string }>();
  const { lowVision } = useUserMode();
  const { language, t } = useI18n();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const goFail = () => {
      if (!cancelled) {
        router.replace({ pathname: '/analysis-failed', params: { items: itemsParam, recordId: recordId ?? '', flowId: flowId ?? '' } });
      }
    };

    (async () => {
      try {
        const items: RecognizedItem[] = itemsParam ? JSON.parse(itemsParam) : [];
        devLog('[3단계] ▶ 상호작용 분석 요청, 항목 수:', items.length);
        await markAnalysisStarted(flowId);
        const result = await analyzeInteractions(items);
        if (cancelled) return;

        if (!result || !Array.isArray(result.pairs)) {
          await markAnalysisFailed(flowId);
          goFail();
          return;
        }

        if (recordId) {
          await updateSessionItems(recordId, items);
          await updateSessionAnalysis(recordId, result);
        }

        await markAnalysisCompleted(flowId, result);
        router.replace({
          pathname: '/analysis',
          params: { result: JSON.stringify(result), items: itemsParam, recordId: recordId ?? '', flowId: flowId ?? '' },
        });
      } catch (e) {
        console.warn('상호작용 분석 실패:', e);
        await markAnalysisFailed(flowId);
        goFail();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [flowId, itemsParam, recordId, router]);

  return (
    <Screen>
      <TopBar title={t('analysisInProgress')} subtitle={t('analysisSubtitle')} />
      <StepIndicator current={3} />
      <View style={styles.body}>
        <View style={[styles.analysisCard, lowVision && styles.analysisCardLowVision]}>
          <View style={[styles.visualWrap, lowVision && styles.visualWrapLowVision]}>
            <View style={styles.pulseOuter} />
            <View style={styles.pulseInner} />
            <Image source={require('@/assets/images/robot.png')} style={[styles.robot, lowVision && styles.robotLowVision]} contentFit="contain" />
          </View>
          <Text style={[styles.title, lowVision && styles.titleLowVision]}>{t('pleaseWait')}</Text>
          <Text style={[styles.elapsedText, lowVision && styles.elapsedTextLowVision]}>
            {t('elapsedTime', { time: formatElapsedSeconds(language, elapsedSeconds) })}
          </Text>
          <Text style={[styles.subtitle, lowVision && styles.subtitleLowVision]}>{t('analysisWaitBody')}</Text>
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
    // 하단 여백을 기존 64에서 140으로 늘려 네모 박스를 전체적으로 위로 끌어올렸습니다.
    paddingBottom: 140,
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
  analysisCardLowVision: {
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  visualWrap: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  visualWrapLowVision: {
    width: 174,
    height: 174,
    marginBottom: 8,
  },
  robot: {
    width: 150,
    height: 150,
  },
  robotLowVision: {
    width: 138,
    height: 138,
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
  titleLowVision: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
  },
  elapsedText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Palette.textMuted,
    marginTop: 5,
  },
  elapsedTextLowVision: {
    fontSize: 17,
    lineHeight: 23,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitleLowVision: {
    fontSize: 18,
    lineHeight: 26,
  },
});
