import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, SectionHeader, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { devLog } from '@/services/debug-log';
import type { AnalysisResult, InteractionPair, RiskLevel } from '@/types/medication';

const LEVEL_META: Record<RiskLevel, { label: string; title: string; color: string; bg: string; icon: 'alert-circle' | 'warning' | 'checkmark-circle'; tone: 'red' | 'amber' | 'green' }> = {
  danger: {
    label: '위험',
    title: '전문가 상담이 필요해요',
    color: Palette.rose,
    bg: Palette.roseSoft,
    icon: 'alert-circle',
    tone: 'red',
  },
  caution: {
    label: '주의',
    title: '주의해서 확인해 주세요',
    color: Palette.amber,
    bg: Palette.amberSoft,
    icon: 'warning',
    tone: 'amber',
  },
  safe: {
    label: '미탐지',
    title: '중대한 주의사항 미탐지',
    color: Palette.mint,
    bg: Palette.mintSoft,
    icon: 'checkmark-circle',
    tone: 'green',
  },
};

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

  const overall = LEVEL_META[result.overall];

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
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: overall.bg }]}>
            <Ionicons name={overall.icon} size={34} color={overall.color} />
          </View>
          <Text style={[styles.summaryTitle, { color: overall.color }]}>{overall.title}</Text>
          <Text style={styles.summaryText}>{result.summary}</Text>
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle" size={16} color={Palette.textMuted} />
            <Text style={styles.disclaimerText}>복용 변경 전에는 의사 또는 약사와 상담하세요.</Text>
          </View>
        </View>

        <SectionHeader title="조합별 확인" />
        <View style={styles.pairList}>
          {result.pairs.map((pair) => (
            <PairCard key={pair.id} pair={pair} />
          ))}
        </View>

        <Pressable style={styles.questionCard}>
          <IconBadge icon="chatbubble-ellipses" tone="blue" />
          <View style={styles.questionText}>
            <Text style={styles.questionTitle}>결과에 대해 물어보기</Text>
            <Text style={styles.questionBody}>다음 단계에서 AI 후속 질문 화면으로 연결할 예정입니다.</Text>
          </View>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function PairCard({ pair }: { pair: InteractionPair }) {
  const meta = LEVEL_META[pair.level];
  return (
    <View style={styles.pairCard}>
      <View style={styles.pairHeader}>
        <View style={[styles.levelBadge, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={15} color={meta.color} />
          <Text style={[styles.levelText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.pairTitle}>{pair.items.join(' + ')}</Text>
      <Text style={styles.pairDesc}>{pair.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
  },
  summaryCard: {
    marginHorizontal: Spacing.screen,
    marginBottom: 28,
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 24,
    ...Shadow.card,
  },
  summaryIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  summaryTitle: {
    ...Typography.section,
    textAlign: 'center',
  },
  summaryText: {
    ...Typography.body,
    color: Palette.text,
    textAlign: 'center',
    marginTop: 10,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
  },
  disclaimerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  pairList: {
    paddingHorizontal: Spacing.screen,
    gap: 10,
  },
  pairCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  pairHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '900',
  },
  pairTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: Palette.text,
  },
  pairDesc: {
    ...Typography.body,
    color: Palette.textMuted,
    marginTop: 6,
  },
  questionCard: {
    marginHorizontal: Spacing.screen,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primarySoft,
    borderRadius: Radius.lg,
    padding: 16,
  },
  questionText: {
    flex: 1,
    marginLeft: 12,
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
