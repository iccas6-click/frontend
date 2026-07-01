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
