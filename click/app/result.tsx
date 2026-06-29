import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemEditModal } from '@/components/item-edit-modal';
import { StepIndicator } from '@/components/step-indicator';
import { createScan, updateScan } from '@/services/history-storage';
import { analyzeImage } from '@/services/ocr';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const APPLE_THEME = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  tintBlue: '#007AFF',
};

const CATEGORY_STYLE: Record<ItemCategory, { emoji: string; bg: string; label: string }> = {
  알약: { emoji: '💊', bg: '#FFE5EA', label: '알약' },
  '건강기능식품 라벨': { emoji: '🌿', bg: '#E9F9EE', label: '건강기능식품' },
};

export default function ResultScreen() {
  const router = useRouter();
  const { photoUri, category, prevItems, recordId: recordIdParam } = useLocalSearchParams<{
    photoUri?: string;
    category?: string;
    prevItems?: string;
    recordId?: string;
  }>();

  const parsedPrevItems: RecognizedItem[] = prevItems ? JSON.parse(prevItems) : [];
  const selectedCategory: ItemCategory =
    category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';

  const [items, setItems] = useState<RecognizedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // 항목 변경 시 갱신할 기록 id (이어찍기면 앞 페이지의 알약 기록 id를 그대로 사용)
  const [recordId, setRecordId] = useState<string | null>(recordIdParam ?? null);

  // 수정 시트 상태: undefined=닫힘, null=새 항목 추가, 객체=해당 항목 수정
  const [editTarget, setEditTarget] = useState<RecognizedItem | null | undefined>(undefined);
  const nextId = useRef(0);

  const handleSave = useCallback((item: RecognizedItem) => {
    setItems((prev) => {
      if (item.id) {
        return prev.map((it) => (it.id === item.id ? item : it));
      }
      nextId.current += 1;
      return [...prev, { ...item, id: `new-${nextId.current}` }];
    });
    setEditTarget(undefined);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setEditTarget(undefined);
  }, []);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await analyzeImage(photoUri ?? '', selectedCategory);
      // 이전 항목(이어찍기 시 앞서 인식한 알약) + 이번 인식 결과를 합치고 id를 새로 부여
      const combined = [...parsedPrevItems, ...result].map((it, i) => ({ ...it, id: `r${i}` }));
      setItems(combined);

      if (recordIdParam) {
        // 이어찍기: 앞 페이지에서 만든 기록에 누적
        await updateScan(recordIdParam, combined);
        setRecordId(recordIdParam);
      } else {
        // 첫 인식: 새 기록 생성
        const id = await createScan(selectedCategory, combined);
        setRecordId(id);
      }
    } catch (e) {
      console.warn('OCR 분석 실패:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
    // parsedPrevItems는 매 렌더 새로 만들어지므로 의존성에서 제외 (photoUri로 충분)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUri, selectedCategory, recordIdParam]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 항목이 바뀔 때마다(추가·수정·삭제) 저장된 기록을 갱신
  useEffect(() => {
    if (recordId && !loading && !error) {
      updateScan(recordId, items).catch((e) => console.warn('기록 갱신 실패:', e));
    }
  }, [items, recordId, loading, error]);

  const canAnalyze = !loading && !error && items.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StepIndicator current={2} background={APPLE_THEME.background} />

      <View style={styles.intro}>
        <Text style={styles.pageTitle}>인식 결과</Text>
        <Text style={styles.subtitle}>잘못 인식된 항목은 탭해서 수정해 주세요.</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={APPLE_THEME.tintBlue} size="large" />
          <Text style={styles.centerText}>사진을 분석하고 있어요...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color={APPLE_THEME.textMuted} />
          <Text style={styles.centerText}>분석에 실패했어요</Text>
          <Pressable style={styles.retryButton} onPress={runAnalysis}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onPress={() => setEditTarget(item)} />
          ))}

          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            onPress={() => setEditTarget(null)}>
            <Ionicons name="add-circle" size={22} color={APPLE_THEME.tintBlue} />
            <Text style={styles.addText}>새 항목 직접 추가하기</Text>
          </Pressable>
        </ScrollView>
      )}

      <ItemEditModal
        visible={editTarget !== undefined}
        initial={editTarget ?? null}
        onClose={() => setEditTarget(undefined)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <View style={styles.footer}>
        {/* 알약 첫 인식 화면에서만 '건강기능식품 이어찍기' 제공 */}
        {selectedCategory === '알약' && (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryCta,
              (pressed || !canAnalyze) && styles.pressed,
            ]}
            disabled={!canAnalyze}
            onPress={() =>
              router.push({
                pathname: '/camera',
                params: {
                  category: '건강기능식품 라벨',
                  prevItems: JSON.stringify(items),
                  recordId: recordId ?? '',
                },
              })
            }>
            <Ionicons name="camera" size={18} color={APPLE_THEME.tintBlue} />
            <Text style={styles.secondaryCtaText}>건강기능식품 추가 촬영하기</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.cta, !canAnalyze && styles.ctaDisabled]}
          disabled={!canAnalyze}
          onPress={() =>
            router.push({ pathname: '/analyze', params: { items: JSON.stringify(items) } })
          }>
          <Text style={styles.ctaText}>분석 시작하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** 인식 항목 카드 (탭하면 수정) */
function ItemCard({ item, onPress }: { item: RecognizedItem; onPress: () => void }) {
  const cat = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE['알약'];
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name} 수정`}>
      <View style={[styles.iconBox, { backgroundColor: cat.bg }]}>
        <Text style={styles.iconEmoji}>{cat.emoji}</Text>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name} {item.dosage}
        </Text>
        <Text style={styles.cardCategory}>{cat.label}</Text>
      </View>

      <View style={styles.editHintBox}>
        <Text style={styles.editHintText}>수정</Text>
        <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  intro: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: APPLE_THEME.textDark,
  },
  subtitle: {
    fontSize: 15,
    color: APPLE_THEME.textMuted,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APPLE_THEME.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: APPLE_THEME.textDark,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  cardCategory: {
    fontSize: 14,
    color: APPLE_THEME.textMuted,
  },
  editHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editHintText: {
    fontSize: 15,
    color: APPLE_THEME.textMuted,
    marginRight: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APPLE_THEME.card,
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  addText: {
    color: APPLE_THEME.tintBlue,
    fontSize: 16,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 40,
  },
  centerText: {
    fontSize: 16,
    color: APPLE_THEME.textMuted,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: APPLE_THEME.tintBlue,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: APPLE_THEME.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  cta: {
    backgroundColor: APPLE_THEME.tintBlue,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryCta: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#E5F1FF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    color: APPLE_THEME.tintBlue,
    fontSize: 17,
    fontWeight: '700',
  },
});
