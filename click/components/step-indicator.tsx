import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

const STEPS = ['촬영', '확인', '분석', '결과'];

/**
 * 진행 단계 표시줄 (current: 현재 단계, 1-based). 현재까지 진행한 단계는 활성 색으로 표시.
 * background: 바 배경색 override (기본은 앱 공통 베이지)
 */
export function StepIndicator({ current, background }: { current: number; background?: string }) {
  return (
    <View style={[styles.stepBar, background ? { backgroundColor: background } : null]}>
      <View style={styles.stepContainer}>
        <View style={styles.stepLineBackground} />

        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n <= current;
          return (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  active ? styles.stepCircleActive : styles.stepCircleInactive,
                ]}>
                <Text style={active ? styles.stepCircleTextActive : styles.stepCircleTextInactive}>
                  {n}
                </Text>
              </View>
              <Text style={active ? styles.stepLabelActive : styles.stepLabelInactive}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepBar: {
    backgroundColor: Brand.surface,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    position: 'relative',
  },
  stepLineBackground: {
    position: 'absolute',
    top: 14,
    left: 48,
    right: 48,
    height: 2,
    backgroundColor: '#EEEEEE',
    zIndex: -1,
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Brand.primary,
  },
  stepCircleInactive: {
    backgroundColor: '#F0F0F0',
  },
  stepCircleTextActive: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepCircleTextInactive: {
    color: '#BBBBBB',
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabelActive: {
    fontSize: 12,
    color: Brand.primary,
    fontWeight: '700',
  },
  stepLabelInactive: {
    fontSize: 12,
    color: '#BBBBBB',
    fontWeight: '500',
  },
});
