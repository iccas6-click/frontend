import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';
import { devLog } from '@/services/debug-log';
import type { AnalysisResult, InteractionPair, RiskLevel } from '@/types/medication';

const APPLE_THEME = {
  background: '#F2F2F7', 
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  tintBlue: '#007AFF',
};

const LEVEL_META: Record<RiskLevel, { label: string; color: string; bg: string; icon: any }> = {
  danger: { label: '위험', color: '#FF3B30', bg: '#FFECEB', icon: 'close-circle' },
  caution: { label: '주의', color: '#FF9500', bg: '#FFF4E5', icon: 'warning' },
  safe: { label: '안전', color: '#34C759', bg: '#E9F9EE', icon: 'checkmark-circle' },
};

const OVERALL_TITLE: Record<RiskLevel, string> = {
  danger: '위험',
  caution: '주의 필요',
  safe: '안전',
};

export default function AnalysisScreen() {
  const router = useRouter();
  const { result: resultParam } = useLocalSearchParams<{ result?: string }>();

  const result = useMemo<AnalysisResult | null>(() => {
    if (!resultParam) return null;
    try {
      return JSON.parse(resultParam) as AnalysisResult;
    } catch {
      return null;
    }
  }, [resultParam]);

  useEffect(() => {
    if (result) {
      devLog('[4단계] ◀ 표시할 분석 결과 수신:', result);
    }
  }, [result]);

  const goHome = () => {
    try {
      router.dismissAll();
    } catch {
      // 무시
    }
    router.replace('/');
  };

  const overall = result ? LEVEL_META[result.overall] : LEVEL_META.safe;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StepIndicator current={4} background={APPLE_THEME.background} />

      <View style={styles.bodyWrap}>
        {!result ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color={APPLE_THEME.textMuted} />
            <Text style={styles.centerText}>결과를 불러올 수 없어요</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            
            <Text style={styles.pageTitle}>분석 결과</Text>

            <View style={styles.overallCard}>
              <View style={[styles.overallIconBox, { backgroundColor: overall.bg }]}>
                <Ionicons name={overall.icon} size={46} color={overall.color} />
              </View>
              <Text style={[styles.overallTitle, { color: overall.color }]}>
                {OVERALL_TITLE[result.overall]}
              </Text>
              <Text style={styles.overallSummary}>{result.summary}</Text>
            </View>

            <Text style={styles.sectionTitle}>상세 조합</Text>
            <View style={styles.listContainer}>
              {result.pairs.map((pair) => (
                <PairCard key={pair.id} pair={pair} />
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {result && (
        <View style={styles.footer}>
          <Pressable 
            style={({ pressed }) => [styles.askButton, pressed && styles.buttonPressed]} 
            onPress={goHome}
          >
            <Text style={styles.askText}>처음으로 돌아가기</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function PairCard({ pair }: { pair: InteractionPair }) {
  const meta = LEVEL_META[pair.level];
  return (
    <View style={styles.pairCard}>
      <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={24} color={meta.color} />
      </View>
      
      <View style={styles.pairInfo}>
        <Text style={styles.pairTitle}>{pair.items.join(' + ')}</Text>
        <Text style={styles.pairDesc}>{pair.description}</Text>
      </View>
      
      <View style={[styles.badge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: APPLE_THEME.textDark,
    marginBottom: 20,
    marginTop: 16,
  },
  bodyWrap: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  centerText: {
    fontSize: 16,
    color: APPLE_THEME.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  overallCard: {
    backgroundColor: APPLE_THEME.card,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  overallIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  overallTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  overallSummary: {
    fontSize: 15,
    color: APPLE_THEME.textDark,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: APPLE_THEME.textDark,
    marginBottom: 16,
  },
  listContainer: {
    gap: 12,
  },
  pairCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APPLE_THEME.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pairInfo: {
    flex: 1,
    marginRight: 12,
  },
  pairTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APPLE_THEME.textDark,
    marginBottom: 4,
  },
  pairDesc: {
    fontSize: 14,
    color: APPLE_THEME.textMuted,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: APPLE_THEME.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  askButton: {
    backgroundColor: APPLE_THEME.tintBlue, 
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  askText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});