import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConsultationNotice, PairList, RiskSummaryCard } from '@/components/analysis-ui';
import { IconBadge, PrimaryButton, Screen, SectionHeader, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { devLog } from '@/services/debug-log';
import type { AnalysisResult } from '@/types/medication';

export default function AnalysisScreen() {
  const router = useRouter();
  const { result: resultParam } = useLocalSearchParams<{ result?: string }>();

  const result = useMemo<AnalysisResult | null>(() => {
    if (!resultParam) return null;
    try {
      return JSON.parse(resultParam) as AnalysisResult;
    } catch {
      return null;
    }
  }, [resultParam]);

  useEffect(() => {
    if (result) devLog('[4단계] ◀ 표시할 분석 결과 수신:', result);
  }, [result]);

  const goHome = () => {
    try {
      router.dismissAll();
    } catch {}
    router.replace('/');
  };

  if (!result) {
    return (
      <Screen>
        <TopBar title="분석 결과" backLabel="뒤로" onBack={() => router.back()} />
        <View style={styles.empty}>
          <IconBadge icon="alert-circle" tone="amber" size="lg" />
          <Text style={styles.emptyTitle}>결과를 불러올 수 없어요</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      bottom={
        <View style={styles.footer}>
          <PrimaryButton label="처음으로 돌아가기" icon="home" onPress={goHome} />
        </View>
      }>
      <TopBar title="분석 결과" subtitle="이 결과는 복약 결정을 대신하지 않으며, 상담 전 확인용으로 사용해 주세요." backLabel="뒤로" onBack={() => router.back()} />
      <StepIndicator current={4} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <RiskSummaryCard result={result} />
        <ConsultationNotice />

        <SectionHeader title="조합별 확인" />
        <View style={styles.sectionBody}>
          <PairList pairs={result.pairs} />
        </View>

        <Pressable
          style={styles.questionCard}
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel="결과에 대해 물어보기, 준비 중">
          <IconBadge icon="chatbubble-ellipses" tone="dark" />
          <View style={styles.questionText}>
            <Text style={styles.questionTitle}>결과에 대해 물어보기</Text>
            <Text style={styles.questionBody}>후속 질문 기능은 백엔드 연결 후 열릴 예정입니다.</Text>
          </View>
          <View style={styles.disabledChip}>
            <Text style={styles.disabledChipText}>준비 중</Text>
          </View>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
  },
  sectionBody: {
    paddingHorizontal: Spacing.screen,
  },
  questionCard: {
    marginHorizontal: Spacing.screen,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primarySoft,
    borderRadius: Radius.lg,
    padding: 16,
    opacity: 0.72,
  },
  questionText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.text,
  },
  questionBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textMuted,
    marginTop: 3,
  },
  disabledChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surface,
  },
  disabledChipText: {
    ...Typography.caption,
    color: Palette.textMuted,
  },
  footer: {
    paddingBottom: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...Typography.section,
    color: Palette.text,
    marginTop: 14,
  },
});
