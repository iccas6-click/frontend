import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

const STEPS = ['촬영', '확인', '분석', '결과'];

/** 진행 단계 표시줄 (current: 현재 단계, 1-based) */
export function StepIndicator({ current }: { current: number }) {
  return (
    <View style={styles.steps}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        const filled = n <= current;
        return (
          <View key={label} style={styles.col}>
            <View style={styles.circleRow}>
              <View
                style={[
                  styles.connector,
                  i === 0 && styles.hidden,
                  n <= current && styles.connectorActive,
                ]}
              />
              <View style={[styles.circle, filled && styles.circleActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.num, active && styles.numActive]}>{n}</Text>
                )}
              </View>
              <View
                style={[
                  styles.connector,
                  i === STEPS.length - 1 && styles.hidden,
                  n < current && styles.connectorActive,
                ]}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  steps: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#DDE3E6',
  },
  connectorActive: {
    backgroundColor: Brand.primary,
  },
  hidden: {
    backgroundColor: 'transparent',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E4E9EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: Brand.primary,
  },
  num: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9AA6AD',
  },
  numActive: {
    color: '#FFFFFF',
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: Brand.textMuted,
  },
  labelActive: {
    color: Brand.primary,
    fontWeight: '700',
  },
});
