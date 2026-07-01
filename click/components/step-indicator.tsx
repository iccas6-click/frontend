import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';

const STEPS = ['알약 선택', '건강기능식품 선택', '분석', '결과'];

export function StepIndicator({ current, background }: { current: number; background?: string }) {
  const { lowVision } = useUserMode();
  return (
    <View
      style={[styles.wrap, lowVision && styles.wrapLowVision, background ? { backgroundColor: background } : null]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`전체 4단계 중 ${current}단계, ${STEPS[current - 1] ?? '진행 중'}`}>
      <View style={[styles.track, lowVision && styles.trackLowVision]}>
        {STEPS.map((label, index) => {
          const step = index + 1;
          const active = step <= current;
          const currentStep = step === current;
          return (
            <View key={label} style={[styles.item, lowVision && styles.itemLowVision]}>
              <View style={[styles.dot, lowVision && styles.dotLowVision, active && styles.dotActive, currentStep && styles.dotCurrent]}>
                <Text style={[styles.dotText, lowVision && styles.dotTextLowVision, active && styles.dotTextActive, currentStep && styles.dotTextCurrent]}>{step}</Text>
              </View>
              <Text style={[styles.label, lowVision && styles.labelLowVision, active && styles.labelActive]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
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
  track: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 11,
  },
  trackLowVision: {
    minHeight: 76,
    paddingHorizontal: 10,
  },
  item: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  itemLowVision: {
    gap: 4,
  },
  dot: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceMuted,
  },
  dotLowVision: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  dotActive: {
    backgroundColor: Palette.primarySoft,
  },
  dotCurrent: {
    backgroundColor: Palette.primary,
  },
  dotText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.textSubtle,
  },
  dotTextLowVision: {
    fontSize: 16,
    fontWeight: '900',
  },
  dotTextActive: {
    color: Palette.primary,
  },
  dotTextCurrent: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0,
    color: Palette.textSubtle,
    textAlign: 'center',
  },
  labelLowVision: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  labelActive: {
    color: Palette.text,
  },
});
