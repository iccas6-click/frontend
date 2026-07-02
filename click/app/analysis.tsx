import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConsultationNotice, InteractionCoverageCard, PairCard, RiskSummaryCard } from '@/components/analysis-ui';
import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { devLog } from '@/services/debug-log';
import type { AnalysisResult, InteractionPair, RecognizedItem } from '@/types/medication';

export default function AnalysisScreen() {
  const router = useRouter();
  const { result: resultParam, items: itemsParam, recordId } = useLocalSearchParams<{ result?: string; items?: string; recordId?: string }>();
  const { lowVision } = useUserMode();
  const [attentionOpen, setAttentionOpen] = useState(true);

  const result = useMemo<AnalysisResult | null>(() => {
    if (!resultParam) return null;
    try {
      return JSON.parse(resultParam) as AnalysisResult;
    } catch {
      return null;
    }
  }, [resultParam]);

  const items = useMemo<RecognizedItem[]>(() => {
    if (!itemsParam) return [];
    try {
      const parsed = JSON.parse(itemsParam);
      return Array.isArray(parsed) ? (parsed as RecognizedItem[]) : [];
    } catch {
      return [];
    }
  }, [itemsParam]);

  useEffect(() => {
    if (result) devLog('[4단계] ◀ 표시할 분석 결과 수신:', result);
  }, [result]);

  const goHome = () => {
    try {
      router.dismissAll();
    } catch {}
    router.replace('/');
  };

  const handleBack = () => {
    if (itemsParam) {
      router.replace({
        pathname: '/review',
        params: {
          items: itemsParam,
          recordId: recordId ?? '',
        },
      });
      return;
    }
    router.replace('/');
  };

  if (!result) {
    return (
      <Screen>
        <TopBar title="분석 결과" backLabel="뒤로" onBack={handleBack} />
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
      <TopBar title="분석 결과" backLabel="뒤로" onBack={handleBack} />
      <StepIndicator current={4} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <RiskSummaryCard result={result} />
        <ConsultationNotice />
        <AnalyzedIngredientSummary result={result} items={items} lowVision={lowVision} />

        <View style={styles.sectionBody}>
          <PairSection
            title="주의할 조합"
            pairs={result.pairs.filter((pair) => pair.level !== 'safe')}
            open={attentionOpen}
            onToggle={() => setAttentionOpen((value) => !value)}
            lowVision={lowVision}
            tone="amber"
          />
          <InteractionCoverageCard result={result} compact />
        </View>
      </ScrollView>
    </Screen>
  );
}

function uniqueNames(values: (string | null | undefined)[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  values
    .flatMap((value) => String(value ?? '').split(/[|,，/·ㆍ]+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.replace(/\s+/g, '').toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(value);
    });
  return result;
}

function analysisNamesFor(item: RecognizedItem) {
  return uniqueNames([...(item.ingredients ?? []), ...(item.analysisNames ?? []), item.name, item.productName]);
}

function AnalyzedIngredientSummary({ result, items, lowVision }: { result: AnalysisResult; items: RecognizedItem[]; lowVision: boolean }) {
  const pills = items.filter((item) => item.category === '알약');
  const supplements = items.filter((item) => item.category === '건강기능식품 라벨');
  const pillNames = result.matchedDrugNames?.length ? result.matchedDrugNames : uniqueNames(pills.flatMap(analysisNamesFor));
  const supplementNames = result.matchedSupplementNames?.length
    ? result.matchedSupplementNames
    : uniqueNames(supplements.flatMap(analysisNamesFor));
  if (pillNames.length === 0 && supplementNames.length === 0) return null;

  return (
    <View style={styles.ingredientSummary}>
      <Text style={[styles.ingredientSummaryTitle, lowVision && styles.ingredientSummaryTitleLowVision]}>실제 분석 성분</Text>
      <IngredientColumn title="알약" names={pillNames} tone="blue" lowVision={lowVision} />
      <IngredientColumn title="건강기능식품" names={supplementNames} tone="green" lowVision={lowVision} />
    </View>
  );
}

function IngredientColumn({
  title,
  names,
  tone,
  lowVision,
}: {
  title: string;
  names: string[];
  tone: 'blue' | 'green';
  lowVision: boolean;
}) {
  const dotColor = tone === 'green' ? Palette.mint : Palette.primary;
  return (
    <View style={styles.ingredientGroup}>
      <View style={styles.ingredientGroupHeader}>
        <View style={[styles.ingredientDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.ingredientGroupTitle, lowVision && styles.ingredientGroupTitleLowVision]}>{title}</Text>
        <Text style={[styles.ingredientGroupCount, lowVision && styles.ingredientGroupCountLowVision]}>{names.length}</Text>
      </View>
      {names.length === 0 ? (
        <Text style={[styles.ingredientEmpty, lowVision && styles.ingredientEmptyLowVision]}>성분 확인 필요</Text>
      ) : (
        <View style={styles.ingredientChips}>
          {names.map((name) => (
            <View key={`${title}-${name}`} style={styles.ingredientChip}>
              <Text style={[styles.ingredientChipText, lowVision && styles.ingredientChipTextLowVision]} numberOfLines={1}>{name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function PairSection({
  title,
  pairs,
  open,
  onToggle,
  lowVision,
  tone,
}: {
  title: string;
  pairs: InteractionPair[];
  open: boolean;
  onToggle: () => void;
  lowVision: boolean;
  tone: 'amber' | 'green';
}) {
  const color = tone === 'amber' ? Palette.amber : Palette.mint;
  const bg = tone === 'amber' ? Palette.amberSoft : Palette.mintSoft;
  return (
    <View style={styles.pairSection}>
      <Pressable
        style={({ pressed }) => [styles.pairSectionHeader, lowVision && styles.pairSectionHeaderLowVision, pressed && styles.pressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title} ${pairs.length}개`}>
        <View style={[styles.pairSectionIcon, { backgroundColor: bg }]}>
          <Ionicons name={tone === 'amber' ? 'warning' : 'checkmark-circle'} size={lowVision ? 23 : 19} color={color} />
        </View>
        <Text style={[styles.pairSectionTitle, lowVision && styles.pairSectionTitleLowVision]}>{title}</Text>
        <Text style={[styles.pairSectionCount, lowVision && styles.pairSectionCountLowVision]}>{pairs.length}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={lowVision ? 24 : 20} color={Palette.textSubtle} />
      </Pressable>

      {open ? (
        <View style={styles.pairSectionBody}>
          {pairs.length === 0 ? (
            <Text style={[styles.emptyPairText, lowVision && styles.emptyPairTextLowVision]}>해당 조합이 없어요</Text>
          ) : (
            pairs.map((pair) => <PairCard key={pair.id} pair={pair} />)
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
  },
  ingredientSummary: {
    marginHorizontal: Spacing.screen,
    marginBottom: 14,
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    padding: 14,
    ...Shadow.subtle,
  },
  ingredientSummaryTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: Palette.text,
  },
  ingredientSummaryTitleLowVision: {
    fontSize: 22,
    lineHeight: 29,
  },
  ingredientGroup: {
    gap: 8,
  },
  ingredientGroupHeader: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  ingredientGroupTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: Palette.text,
  },
  ingredientGroupTitleLowVision: {
    fontSize: 18,
    lineHeight: 25,
  },
  ingredientGroupCount: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.textSubtle,
  },
  ingredientGroupCountLowVision: {
    fontSize: 17,
  },
  ingredientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  ingredientChip: {
    maxWidth: '100%',
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ingredientChipText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: Palette.textMuted,
  },
  ingredientChipTextLowVision: {
    fontSize: 17,
    lineHeight: 23,
  },
  ingredientEmpty: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: Palette.textSubtle,
  },
  ingredientEmptyLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
  sectionBody: {
    paddingHorizontal: Spacing.screen,
    gap: 12,
  },
  pairSection: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    ...Shadow.subtle,
  },
  pairSectionHeader: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  pairSectionHeaderLowVision: {
    minHeight: 80,
    paddingHorizontal: 16,
  },
  pairSectionIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairSectionTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: Palette.text,
  },
  pairSectionTitleLowVision: {
    fontSize: 22,
    lineHeight: 29,
  },
  pairSectionCount: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.text,
  },
  pairSectionCountLowVision: {
    fontSize: 22,
  },
  pairSectionBody: {
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
  },
  emptyPairText: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingVertical: 18,
  },
  emptyPairTextLowVision: {
    fontSize: 18,
    lineHeight: 26,
  },
  pressed: {
    opacity: 0.78,
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
