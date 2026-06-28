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
import { devLog } from '@/services/debug-log';
import { analyzeImage } from '@/services/ocr';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const APPLE_THEME = {
  background: '#F2F2F7', 
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  tintBlue: '#007AFF',
  separator: '#E5E5EA',
};

const CATEGORY_STYLE: Record<ItemCategory, { emoji: string; bg: string }> = {
  알약: { emoji: '💊', bg: '#FFE5EA' }, 
  '건강기능식품 라벨': { emoji: '🌿', bg: '#E9F9EE' }, 
};

export default function ResultScreen() {
  const router = useRouter();
  const { photoUri, category } = useLocalSearchParams<{ photoUri?: string; category?: string }>();
  
  const selectedCategory: ItemCategory =
    category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';

  const [items, setItems] = useState<RecognizedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      <StepIndicator current={2} background={APPLE_THEME.background} />

      <View style={styles.bodyWrap}>
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
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            
            {items.map((item) => (
              <ItemCard key={item.id} item={item} onPress={() => setEditTarget(item)} />
            ))}

            <Pressable 
              style={({ pressed }) => [styles.addButton, pressed && styles.cardPressed]} 
              onPress={() => setEditTarget(null)}
            >
              <Ionicons name="add-circle" size={22} color={APPLE_THEME.tintBlue} />
              <Text style={styles.addText}>새 항목 직접 추가하기</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      <ItemEditModal
        visible={editTarget !== undefined}
        initial={editTarget ?? null}
        onClose={() => setEditTarget(undefined)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.cta,
            (pressed || loading || error || items.length === 0) && styles.ctaDisabled,
          ]}
          disabled={loading || error || items.length === 0}
          onPress={() => {
            devLog('[2단계] ▶ 분석 시작 - 확정된 항목:', items);
            router.push({ pathname: '/analyze', params: { items: JSON.stringify(items) } });
          }}>
          <Text style={styles.ctaText}>분석 시작하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

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
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name} {item.dosage}
        </Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
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
  bodyWrap: {
    flex: 1,
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
  list: {
    flex: 1,
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
  cardPressed: {
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
});