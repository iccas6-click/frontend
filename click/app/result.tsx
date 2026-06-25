import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemEditModal } from '@/components/item-edit-modal';
import { StepIndicator } from '@/components/step-indicator';
import { Brand } from '@/constants/theme';
import { devLog } from '@/services/debug-log';
import { analyzeImage } from '@/services/ocr';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

/** 분류별 아이콘/색상 */
const CATEGORY_STYLE: Record<ItemCategory, { emoji: string; bg: string }> = {
  알약: { emoji: '💊', bg: '#FFF0EF' },
  '건강기능식품 라벨': { emoji: '🌿', bg: '#EAF7EC' },
};

export default function ResultScreen() {
  const router = useRouter();
  const { photoUri, category } = useLocalSearchParams<{ photoUri?: string; category?: string }>();
  // 촬영 화면에서 선택한 분류 (없으면 기본 '알약')
  const selectedCategory: ItemCategory =
    category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';

  const [items, setItems] = useState<RecognizedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 수정 시트 상태: undefined=닫힘, null=새 항목 추가, 객체=해당 항목 수정
  const [editTarget, setEditTarget] = useState<RecognizedItem | null | undefined>(undefined);
  const nextId = useRef(0); // 새로 추가하는 항목의 임시 id 발급용

  const handleSave = useCallback((item: RecognizedItem) => {
    setItems((prev) => {
      if (item.id) {
        // 기존 항목 수정
        return prev.map((it) => (it.id === item.id ? item : it));
      }
      // 새 항목 추가
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
      setItems(result);
    } catch (e) {
      console.warn('OCR 분석 실패:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [photoUri, selectedCategory]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text style={styles.backText}>뒤로</Text>
        </Pressable>
        <Text style={styles.headerTitle}>인식 결과 확인</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.bodyWrap}>
        {/* 단계 표시 */}
        <StepIndicator current={2} />

        {/* 본문 */}
        <View style={styles.intro}>
          <Text style={styles.title}>인식된 항목을 확인해주세요</Text>
          <Text style={styles.subtitle}>잘못 인식된 항목은 직접 수정할 수 있어요</Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Brand.primary} size="large" />
            <Text style={styles.centerText}>사진을 분석하고 있어요...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={48} color={Brand.textMuted} />
            <Text style={styles.centerText}>분석에 실패했어요</Text>
            <Pressable style={styles.retryButton} onPress={runAnalysis}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} onPress={() => setEditTarget(item)} />
            ))}

            {/* 직접 추가 */}
            <Pressable style={styles.addButton} onPress={() => setEditTarget(null)}>
              <Ionicons name="add" size={20} color={Brand.primary} />
              <Text style={styles.addText}>직접 추가</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      {/* 수정/추가 시트 */}
      <ItemEditModal
        visible={editTarget !== undefined}
        initial={editTarget ?? null}
        onClose={() => setEditTarget(undefined)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.cta,
            (pressed || loading || error || items.length === 0) && styles.ctaDisabled,
          ]}
          disabled={loading || error || items.length === 0}
          onPress={() => {
            // 수정·확정된 항목을 분석(3단계) 화면으로 전달
            devLog('[2단계] ▶ 분석 시작 - 확정된 항목:', items);
            router.push({ pathname: '/analyze', params: { items: JSON.stringify(items) } });
          }}>
          <Text style={styles.ctaText}>분석 시작하기</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** 인식된 항목 카드 (탭하면 수정) */
function ItemCard({ item, onPress }: { item: RecognizedItem; onPress: () => void }) {
  const cat = CATEGORY_STYLE[item.category];
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name} 수정`}>
      <View style={[styles.iconBox, { backgroundColor: cat.bg }]}>
        <Text style={styles.iconEmoji}>{cat.emoji}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>
          {item.name} {item.dosage}
        </Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={24} color={Brand.success} />
      <Ionicons name="pencil" size={16} color={Brand.textMuted} style={styles.editHint} />
    </Pressable>
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
  // 본문
  intro: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Brand.textDark,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.textMuted,
    marginTop: 6,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  cardPressed: {
    opacity: 0.6,
  },
  editHint: {
    marginLeft: 8,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  addText: {
    color: Brand.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.textDark,
  },
  cardCategory: {
    fontSize: 13,
    color: Brand.textMuted,
    marginTop: 3,
  },
  // 로딩/에러
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerText: {
    fontSize: 15,
    color: Brand.textMuted,
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Brand.primary,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // 하단 버튼
  footer: {
    backgroundColor: Brand.surface,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.primary,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: Brand.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
