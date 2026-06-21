import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';
import { Brand } from '@/constants/theme';
import type { AnalysisResult, InteractionPair, RiskLevel } from '@/types/medication';

const LEVEL_META: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  danger: { label: '위험', color: '#E5484D', bg: '#FDECEC' },
  caution: { label: '주의', color: '#E08600', bg: '#FFF4E2' },
  safe: { label: '안전', color: '#2E9E5B', bg: '#E7F7EC' },
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

  const goHome = () => {
    // 모달/스택 정리 후 홈으로
    try {
      router.dismissAll();
    } catch {
      // 정리할 스택이 없으면 무시
    }
    router.replace('/');
  };

  const overall = result ? LEVEL_META[result.overall] : LEVEL_META.safe;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text style={styles.backText}>뒤로</Text>
        </Pressable>
        <Text style={styles.headerTitle}>분석 결과</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.bodyWrap}>
        <StepIndicator current={4} />

        {!result ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color={Brand.textMuted} />
            <Text style={styles.centerText}>결과를 불러올 수 없어요</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* 종합 결과 카드 */}
            <View style={[styles.overallCard, { backgroundColor: overall.bg }]}>
              <Ionicons
                name={result.overall === 'safe' ? 'checkmark-circle' : 'warning'}
                size={48}
                color={result.overall === 'safe' ? Brand.success : overall.color}
              />
              <Text style={[styles.overallTitle, { color: overall.color }]}>
                {OVERALL_TITLE[result.overall]}
              </Text>
              <Text style={styles.overallSummary}>{result.summary}</Text>
            </View>

            {/* 조합별 결과 */}
            <Text style={styles.sectionTitle}>조합별 결과</Text>
            {result.pairs.map((pair) => (
              <PairCard key={pair.id} pair={pair} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <Pressable
          style={styles.askButton}
          onPress={() => {
            // TODO: AI 채팅(상담) 화면으로 이동
            console.log('AI에게 더 물어보기');
          }}>
          <Text style={styles.askText}>AI에게 더 물어보기</Text>
        </Pressable>
        <Pressable style={styles.homeButton} onPress={goHome}>
          <Text style={styles.homeText}>처음으로 돌아가기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** 조합별 결과 카드 */
function PairCard({ pair }: { pair: InteractionPair }) {
  const meta = LEVEL_META[pair.level];
  return (
    <View style={[styles.pairCard, { borderLeftColor: meta.color }]}>
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
    backgroundColor: Brand.primary,
  },
  header: {
    backgroundColor: Brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 64,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bodyWrap: {
    flex: 1,
    backgroundColor: Brand.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerText: {
    fontSize: 15,
    color: Brand.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  overallCard: {
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  overallTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 10,
  },
  overallSummary: {
    fontSize: 14,
    color: Brand.textDark,
    marginTop: 6,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.textDark,
    marginTop: 22,
    marginBottom: 12,
  },
  pairCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pairInfo: {
    flex: 1,
    marginRight: 12,
  },
  pairTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.textDark,
  },
  pairDesc: {
    fontSize: 13,
    color: Brand.textMuted,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: Brand.surface,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 10,
  },
  askButton: {
    backgroundColor: Brand.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: Brand.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  askText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E3E8EB',
  },
  homeText: {
    color: Brand.textDark,
    fontSize: 16,
    fontWeight: '700',
  },
});
