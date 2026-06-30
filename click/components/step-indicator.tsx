import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

const STEPS = ['알약 선택', '건강기능식품 선택', '분석', '결과'];

export function StepIndicator({ current, background }: { current: number; background?: string }) {
  return (
    <View
      style={[styles.wrap, background ? { backgroundColor: background } : null]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`전체 4단계 중 ${current}단계, ${STEPS[current - 1] ?? '진행 중'}`}>
      <View style={styles.track}>
        {STEPS.map((label, index) => {
          const step = index + 1;
          const active = step <= current;
          const currentStep = step === current;
          return (
            <View key={label} style={styles.item}>
              <View style={[styles.dot, active && styles.dotActive, currentStep && styles.dotCurrent]}>
                <Text style={[styles.dotText, active && styles.dotTextActive, currentStep && styles.dotTextCurrent]}>{step}</Text>
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
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
  track: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
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
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceMuted,
  },
  dotActive: {
    backgroundColor: Palette.primarySoft,
  },
  dotCurrent: {
    backgroundColor: Palette.primary,
  },
  dotText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textSubtle,
  },
  dotTextActive: {
    color: Palette.primary,
  },
  dotTextCurrent: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0,
    color: Palette.textSubtle,
    textAlign: 'center',
  },
  labelActive: {
    color: Palette.text,
  },
});
