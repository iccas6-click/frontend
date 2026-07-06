import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import type { AnalysisResult, InteractionPair, RiskLevel } from '@/types/medication';

export const RISK_META: Record<
  RiskLevel,
  {
    label: string;
    title: string;
    color: string;
    bg: string;
    icon: 'alert-circle' | 'warning' | 'checkmark-circle';
  }
> = {
  danger: {
    label: '위험',
    title: '전문가 상담이 필요해요',
    color: Palette.rose,
    bg: Palette.roseSoft,
    icon: 'alert-circle',
  },
  caution: {
    label: '주의',
    title: '주의해서 확인해 주세요',
    color: Palette.amber,
    bg: Palette.amberSoft,
    icon: 'warning',
  },
  safe: {
    label: '미탐지',
    title: '중대한 주의사항 미탐지',
    color: Palette.mint,
    bg: Palette.mintSoft,
    icon: 'checkmark-circle',
  },
};

export function RiskSummaryCard({ result, compact = false }: { result: AnalysisResult; compact?: boolean }) {
  const { lowVision } = useUserMode();
  const meta = RISK_META[result.overall];
  return (
    <View style={[styles.summaryCard, compact && styles.summaryCardCompact, lowVision && styles.summaryCardLowVision]}>
      <View style={[styles.summaryIcon, compact && styles.summaryIconCompact, lowVision && styles.summaryIconLowVision, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={lowVision ? 31 : compact ? 26 : 28} color={meta.color} />
      </View>
      <View style={styles.summaryTextWrap}>
        <Text style={[styles.summaryTitle, compact && styles.summaryTitleCompact, lowVision && styles.summaryTitleLowVision, { color: meta.color }]}>{meta.title}</Text>
        <Text style={[styles.summaryText, compact && styles.summaryTextCompact, lowVision && styles.summaryTextLowVision]}>{result.summary}</Text>
      </View>
    </View>
  );
}

export function InteractionCoverageCard({ result, compact = false }: { result: AnalysisResult; compact?: boolean }) {
  const { lowVision } = useUserMode();
  const checked = result.checkedCount ?? 0;
  const detected = result.detectedCount ?? result.pairs.filter((pair) => pair.level !== 'safe').length;
  const undetected = result.undetectedCount ?? Math.max(checked - detected, 0);
  const unmatchedSupplement = result.unmatchedSupplementCount ?? 0;
  const unmatchedDrug = result.unmatchedDrugCount ?? 0;
  const unmatchedItems = unmatchedSupplement + unmatchedDrug;
  if (checked <= 0 && unmatchedItems <= 0) return null;

  const message =
    checked > 0
      ? `DB에서 매칭된 ${checked}개 조합을 기준으로 확인했어요.`
      : 'DB에서 양쪽 성분이 모두 매칭된 조합이 없었어요.';

  return (
    <View style={[styles.coverageCard, compact && styles.coverageCardCompact, lowVision && styles.coverageCardLowVision]}>
      <View style={[styles.coverageIcon, lowVision && styles.coverageIconLowVision]}>
        <Ionicons name="search" size={lowVision ? 22 : 18} color={Palette.mint} />
      </View>
      <View style={styles.coverageTextWrap}>
        <View style={styles.coverageTitleRow}>
          <Text style={[styles.coverageTitle, lowVision && styles.coverageTitleLowVision]}>DB 확인 결과</Text>
          <Text style={[styles.coverageCount, lowVision && styles.coverageCountLowVision]}>{checked}</Text>
        </View>
        <Text style={[styles.coverageText, lowVision && styles.coverageTextLowVision]}>{message}</Text>
        <View style={styles.coverageRows}>
          <CoverageRow label="주의 발견" value={detected} color={Palette.amber} lowVision={lowVision} />
          <CoverageRow label="주의 정보 미탐지" value={undetected} color={Palette.mint} lowVision={lowVision} />
          {unmatchedItems > 0 ? (
            <CoverageRow
              label={`성분 매칭 실패 · 알약 ${unmatchedDrug} · 건강기능식품 ${unmatchedSupplement}`}
              value={unmatchedItems}
              color={Palette.blueGrey}
              lowVision={lowVision}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function CoverageRow({ label, value, color, lowVision }: { label: string; value: number; color: string; lowVision: boolean }) {
  return (
    <View style={styles.coverageRow}>
      <Text style={[styles.coverageRowLabel, lowVision && styles.coverageRowLabelLowVision]}>{label}</Text>
      <Text style={[styles.coverageRowValue, lowVision && styles.coverageRowValueLowVision, { color }]}>{value}</Text>
    </View>
  );
}

export function PairCard({ pair, compact = false }: { pair: InteractionPair; compact?: boolean }) {
  const { lowVision } = useUserMode();
  const meta = RISK_META[pair.level];
  return (
    <View style={[styles.pairCard, compact && styles.pairCardCompact, lowVision && styles.pairCardLowVision]}>
      <View style={[styles.levelBadge, lowVision && styles.levelBadgeLowVision, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={lowVision ? 18 : 14} color={meta.color} />
        <Text style={[styles.levelText, lowVision && styles.levelTextLowVision, { color: meta.color }]}>{meta.label}</Text>
      </View>
      <Text style={[styles.pairTitle, compact && styles.pairTitleCompact, lowVision && styles.pairTitleLowVision]}>{pair.items.join(' + ')}</Text>
      <Text style={[styles.pairDesc, compact && styles.pairDescCompact, lowVision && styles.pairDescLowVision]}>{pair.description}</Text>
    </View>
  );
}

export function PairList({ pairs, limit }: { pairs: InteractionPair[]; limit?: number }) {
  const visiblePairs = typeof limit === 'number' ? pairs.slice(0, limit) : pairs;
  return (
    <View style={styles.pairList}>
      {visiblePairs.map((pair) => (
        <PairCard key={pair.id} pair={pair} compact={Boolean(limit)} />
      ))}
    </View>
  );
}

export function ConsultationNotice() {
  const { lowVision } = useUserMode();
  return (
    <View style={[styles.disclaimer, lowVision && styles.disclaimerLowVision]}>
      <Ionicons name="information-circle" size={lowVision ? 22 : 17} color={Palette.textMuted} />
      <Text style={[styles.disclaimerText, lowVision && styles.disclaimerTextLowVision]}>복용 변경 전에는 의사 또는 약사와 상담하세요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginHorizontal: Spacing.screen,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  summaryCardCompact: {
    marginHorizontal: 0,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.lg,
    ...Shadow.subtle,
  },
  summaryCardLowVision: {
    padding: 18,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconCompact: {
    width: 58,
    height: 58,
    borderRadius: Radius.md,
    marginBottom: 0,
  },
  summaryIconLowVision: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  summaryTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  summaryTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    textAlign: 'left',
  },
  summaryTitleCompact: {
    fontSize: 19,
    lineHeight: 25,
    textAlign: 'left',
  },
  summaryTitleLowVision: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
  },
  summaryText: {
    ...Typography.body,
    color: Palette.text,
    textAlign: 'left',
    marginTop: 4,
  },
  summaryTextCompact: {
    textAlign: 'left',
    marginTop: 4,
  },
  summaryTextLowVision: {
    fontSize: 18,
    lineHeight: 27,
  },
  pairList: {
    gap: 10,
  },
  coverageCard: {
    marginHorizontal: Spacing.screen,
    marginBottom: 14,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
    ...Shadow.subtle,
  },
  coverageCardCompact: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  coverageCardLowVision: {
    minHeight: 92,
    padding: 16,
  },
  coverageIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.mintSoft,
  },
  coverageIconLowVision: {
    width: 48,
    height: 48,
  },
  coverageTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  coverageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coverageTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: Palette.text,
  },
  coverageTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  coverageCount: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: Palette.mint,
  },
  coverageCountLowVision: {
    fontSize: 24,
    lineHeight: 31,
  },
  coverageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Palette.textMuted,
    marginTop: 3,
  },
  coverageTextLowVision: {
    fontSize: 17,
    lineHeight: 25,
  },
  coverageRows: {
    gap: 7,
    marginTop: 11,
  },
  coverageRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coverageRowLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: Palette.textMuted,
  },
  coverageRowLabelLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
  coverageRowValue: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  coverageRowValueLowVision: {
    fontSize: 20,
    lineHeight: 27,
  },
  pairCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  pairCardCompact: {
    padding: 14,
  },
  pairCardLowVision: {
    padding: 18,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    marginBottom: 9,
  },
  levelBadgeLowVision: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 10,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '900',
  },
  levelTextLowVision: {
    fontSize: 15,
  },
  pairTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: Palette.text,
  },
  pairTitleCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  pairTitleLowVision: {
    fontSize: 20,
    lineHeight: 27,
  },
  pairDesc: {
    ...Typography.body,
    color: Palette.textMuted,
    marginTop: 6,
  },
  pairDescCompact: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 5,
  },
  pairDescLowVision: {
    fontSize: 18,
    lineHeight: 26,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.screen,
    marginBottom: 24,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceMuted,
  },
  disclaimerLowVision: {
    paddingVertical: 13,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  disclaimerTextLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
});
