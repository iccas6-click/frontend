import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { useI18n } from '@/services/i18n';

/**
 * 한 대단계(예: 처방약 인식) 안에서의 세부 진행 위치.
 * - 'capture': 사진을 찍는 과정
 * - 'result' : 인식/분석 결과를 확인하는 과정 (다음 단계로 절반쯤 진행)
 */
export type StepPhase = 'capture' | 'result';

export function StepIndicator({
  current,
  background,
  compact = false,
  phase,
}: {
  current: number;
  background?: string;
  compact?: boolean;
  phase?: StepPhase;
}) {
  const { lowVision } = useUserMode();
  const { t } = useI18n();
  const steps = [t('prescription'), t('supplement'), t('interactionAnalysis'), t('analysisResult')];
  const stepAccessibilityLabels = [t('addPrescription'), t('addSupplement'), t('interactionAnalysis'), t('analysisResult')];

  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact, lowVision && styles.wrapLowVision, background ? { backgroundColor: background } : null]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${current} / ${steps.length}, ${stepAccessibilityLabels[current - 1] ?? t('analysisInProgress')}`}>
      <View style={[styles.track, compact && styles.trackCompact, lowVision && styles.trackLowVision]}>
        {steps.map((label, index) => {
          const step = index + 1;
          const active = step <= current;
          const currentStep = step === current;
          // 작은 연결 원은 인식 단계(1↔2, 2↔3) 사이에만 둔다. 3↔4 사이에는 두지 않는다.
          const showConnector = step < steps.length - 1;
          // 이 큰 원과 다음 큰 원을 잇는 작은 원의 상태.
          // 이미 지난 단계이거나(=완료), 현재 단계에서 결과 확인 과정에 진입했으면 채운다.
          const connectorFilled = current > step || (currentStep && phase === 'result');
          return (
            <Fragment key={label}>
              <View style={[styles.item, compact && styles.itemCompact, lowVision && styles.itemLowVision]}>
                <View style={[styles.dot, compact && styles.dotCompact, lowVision && styles.dotLowVision, active && styles.dotActive, currentStep && styles.dotCurrent]}>
                  <Text style={[styles.dotText, compact && styles.dotTextCompact, lowVision && styles.dotTextLowVision, active && styles.dotTextActive, currentStep && styles.dotTextCurrent]}>{step}</Text>
                </View>
                <Text
                  style={[styles.label, compact && styles.labelCompact, lowVision && styles.labelLowVision, active && styles.labelActive]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}>
                  {label}
                </Text>
              </View>
              {showConnector ? (
                <View style={[styles.connector, compact && styles.connectorCompact, lowVision && styles.connectorLowVision]}>
                  <View
                    style={[
                      styles.connectorDot,
                      compact && styles.connectorDotCompact,
                      lowVision && styles.connectorDotLowVision,
                      connectorFilled && styles.connectorDotFilled,
                    ]}
                  />
                </View>
              ) : null}
            </Fragment>
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
  // 큰 원 사이의 작은 연결 원. 큰 원과 세로 중심을 맞추기 위해 높이를 큰 원과 동일하게 둔다.
  connector: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  connectorLowVision: {
    height: 34,
  },
  connectorCompact: {
    height: 25,
  },
  connectorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 2,
    borderColor: Palette.border,
  },
  connectorDotLowVision: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
  },
  connectorDotCompact: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  // 완료된 구간: 파란색으로 꽉 채우지 않고, 회색 원에 파란 테두리만 남긴다.
  connectorDotFilled: {
    borderColor: Palette.primary,
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
