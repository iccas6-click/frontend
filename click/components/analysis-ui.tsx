import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { riskLabel, useI18n } from '@/services/i18n';
import type { AnalysisResult, InteractionPair, RiskLevel } from '@/types/medication';

export const RISK_META: Record<
  RiskLevel,
  {
    color: string;
    bg: string;
    icon: 'alert-circle' | 'warning' | 'checkmark-circle';
    titleKey: 'riskDangerTitle' | 'riskCautionTitle' | 'riskSafeTitle';
  }
> = {
  danger: {
    color: Palette.rose,
    bg: Palette.roseSoft,
    icon: 'alert-circle',
    titleKey: 'riskDangerTitle',
  },
  caution: {
    color: Palette.amber,
    bg: Palette.amberSoft,
    icon: 'warning',
    titleKey: 'riskCautionTitle',
  },
  safe: {
    color: Palette.mint,
    bg: Palette.mintSoft,
    icon: 'checkmark-circle',
    titleKey: 'riskSafeTitle',
  },
};

export function RiskSummaryCard({ result, compact = false }: { result: AnalysisResult; compact?: boolean }) {
  const { lowVision } = useUserMode();
  const { t } = useI18n();
  const meta = RISK_META[result.overall];
  return (
    <View style={[styles.summaryCard, compact && styles.summaryCardCompact, lowVision && styles.summaryCardLowVision]}>
      <View style={[styles.summaryIcon, compact && styles.summaryIconCompact, lowVision && styles.summaryIconLowVision, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={lowVision ? 31 : compact ? 26 : 28} color={meta.color} />
      </View>
      <View style={styles.summaryTextWrap}>
        <Text style={[styles.summaryTitle, compact && styles.summaryTitleCompact, lowVision && styles.summaryTitleLowVision, { color: meta.color }]}>{t(meta.titleKey)}</Text>
        <Text style={[styles.summaryText, compact && styles.summaryTextCompact, lowVision && styles.summaryTextLowVision]}>{result.summary}</Text>
      </View>
    </View>
  );
}

export function InteractionCoverageCard({ result, compact = false }: { result: AnalysisResult; compact?: boolean }) {
  const { lowVision } = useUserMode();
  const { t } = useI18n();
  const checked = result.checkedCount ?? 0;
  const detected = result.detectedCount ?? result.pairs.filter((pair) => pair.level !== 'safe').length;
  const undetected = result.undetectedCount ?? Math.max(checked - detected, 0);
  const unmatchedSupplement = result.unmatchedSupplementCount ?? 0;
  const unmatchedDrug = result.unmatchedDrugCount ?? 0;
  const unmatchedItems = unmatchedSupplement + unmatchedDrug;
  if (checked <= 0 && unmatchedItems <= 0) return null;

  const message =
    checked > 0
      ? t('dbCoverageChecked', { count: checked })
      : t('dbCoverageNoMatch');

  return (
    <View style={[styles.coverageCard, compact && styles.coverageCardCompact, lowVision && styles.coverageCardLowVision]}>
      <View style={[styles.coverageIcon, lowVision && styles.coverageIconLowVision]}>
        <Ionicons name="search" size={lowVision ? 22 : 18} color={Palette.mint} />
      </View>
      <View style={styles.coverageTextWrap}>
        <View style={styles.coverageTitleRow}>
          <Text style={[styles.coverageTitle, lowVision && styles.coverageTitleLowVision]}>{t('dbCoverageTitle')}</Text>
          <Text style={[styles.coverageCount, lowVision && styles.coverageCountLowVision]}>{checked}</Text>
        </View>
        <Text style={[styles.coverageText, lowVision && styles.coverageTextLowVision]}>{message}</Text>
        <View style={styles.coverageRows}>
          <CoverageRow label={t('attentionFound')} value={detected} color={Palette.amber} lowVision={lowVision} />
          <CoverageRow label={t('noAttentionFound')} value={undetected} color={Palette.mint} lowVision={lowVision} />
          {unmatchedItems > 0 ? (
            <CoverageRow
              label={t('ingredientMatchFailed', { drug: unmatchedDrug, supplement: unmatchedSupplement })}
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
  const { language } = useI18n();
  const meta = RISK_META[pair.level];
  return (
    <View style={[styles.pairCard, compact && styles.pairCardCompact, lowVision && styles.pairCardLowVision]}>
      <View style={[styles.levelBadge, lowVision && styles.levelBadgeLowVision, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={lowVision ? 18 : 14} color={meta.color} />
        <Text style={[styles.levelText, lowVision && styles.levelTextLowVision, { color: meta.color }]}>{riskLabel(pair.level, language)}</Text>
      </View>
      <Text style={[styles.pairTitle, compact && styles.pairTitleCompact, lowVision && styles.pairTitleLowVision]} numberOfLines={3}>
        {pair.items.join(' + ')}
      </Text>
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
  const { t } = useI18n();
  return (
    <View style={[styles.disclaimer, lowVision && styles.disclaimerLowVision]}>
      <Ionicons name="information-circle" size={lowVision ? 22 : 17} color={Palette.textMuted} />
      <Text style={[styles.disclaimerText, lowVision && styles.disclaimerTextLowVision]}>{t('consultProfessional')}</Text>
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
    fontWeight: '600',
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
    fontWeight: '700',
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
    fontWeight: '600',
    color: Palette.text,
  },
  coverageTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  coverageCount: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    color: Palette.mint,
  },
  coverageCountLowVision: {
    fontSize: 24,
    lineHeight: 31,
  },
  coverageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
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
    fontWeight: '700',
    color: Palette.textMuted,
  },
  coverageRowLabelLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
  coverageRowValue: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
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
    fontWeight: '700',
  },
  levelTextLowVision: {
    fontSize: 15,
  },
  pairTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    color: Palette.text,
  },
  pairTitleCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  pairTitleLowVision: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700',
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
    fontWeight: '600',
    color: Palette.textMuted,
  },
  disclaimerTextLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
});
