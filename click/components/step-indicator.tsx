import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { useI18n } from '@/services/i18n';

export function StepIndicator({ current, background, compact = false }: { current: number; background?: string; compact?: boolean }) {
  const { lowVision } = useUserMode();
  const { t } = useI18n();
  const steps = [t('prescription'), t('supplement'), t('interactionAnalysis'), t('analysisResult')];
  const stepAccessibilityLabels = [t('addPrescription'), t('addSupplement'), t('interactionAnalysis'), t('analysisResult')];
  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact, lowVision && styles.wrapLowVision, background ? { backgroundColor: background } : null]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${current} / 4, ${stepAccessibilityLabels[current - 1] ?? t('analysisInProgress')}`}>
      <View style={[styles.track, compact && styles.trackCompact, lowVision && styles.trackLowVision]}>
        {steps.map((label, index) => {
          const step = index + 1;
          const active = step <= current;
          const currentStep = step === current;
          return (
            <View key={label} style={[styles.item, compact && styles.itemCompact, lowVision && styles.itemLowVision]}>
              <View style={[styles.dot, compact && styles.dotCompact, lowVision && styles.dotLowVision, active && styles.dotActive, currentStep && styles.dotCurrent]}>
                <Text style={[styles.dotText, compact && styles.dotTextCompact, lowVision && styles.dotTextLowVision, active && styles.dotTextActive, currentStep && styles.dotTextCurrent]}>{step}</Text>
              </View>
              <Text style={[styles.label, compact && styles.labelCompact, lowVision && styles.labelLowVision, active && styles.labelActive]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.screen,
    paddingTop: 2,
    paddingBottom: 14,
  },
  wrapLowVision: {
    paddingBottom: 12,
  },
  wrapCompact: {
    paddingTop: 0,
    paddingBottom: 8,
  },
  track: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  trackLowVision: {
    minHeight: 76,
    paddingHorizontal: 8,
  },
  trackCompact: {
    minHeight: 62,
    paddingHorizontal: 7,
    paddingVertical: 10,
  },
  item: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 3,
    gap: 6,
  },
  itemLowVision: {
    gap: 7,
  },
  itemCompact: {
    gap: 5,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceMuted,
  },
  dotLowVision: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  dotCompact: {
    width: 25,
    height: 25,
    borderRadius: 13,
  },
  dotActive: {
    backgroundColor: Palette.primarySoft,
  },
  dotCurrent: {
    backgroundColor: Palette.primary,
  },
  dotText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textSubtle,
  },
  dotTextLowVision: {
    fontSize: 16,
    fontWeight: '700',
  },
  dotTextCompact: {
    fontSize: 13,
  },
  dotTextActive: {
    color: Palette.primary,
  },
  dotTextCurrent: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    minHeight: 28,
    fontWeight: '700',
    letterSpacing: 0,
    color: Palette.textSubtle,
    textAlign: 'center',
  },
  labelLowVision: {
    fontSize: 13,
    lineHeight: 16,
    minHeight: 32,
    fontWeight: '700',
  },
  labelCompact: {
    fontSize: 10.5,
    lineHeight: 13,
    minHeight: 26,
  },
  labelActive: {
    color: Palette.text,
  },
});
