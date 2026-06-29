import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatRecordTime, formatRecordTitle, getScan } from '@/services/history-storage';
import type { ItemCategory, RecognizedItem, ScanRecord } from '@/types/medication';

const APPLE_THEME = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  tintBlue: '#007AFF',
  segmentBg: '#E9E9EB',
};

const CATEGORY_STYLE: Record<ItemCategory, { emoji: string; bg: string }> = {
  알약: { emoji: '💊', bg: '#FFE5EA' },
  '건강기능식품 라벨': { emoji: '🌿', bg: '#E9F9EE' },
};

// 토글 탭 정의 (값: 실제 분류 / 라벨: 화면 표시)
const TABS: { value: ItemCategory; label: string }[] = [
  { value: '알약', label: '알약' },
  { value: '건강기능식품 라벨', label: '건강기능식품' },
];

export default function RecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ItemCategory>('알약');

  useEffect(() => {
    let active = true;
    getScan(id ?? '').then((data) => {
      if (!active) return;
      setRecord(data);
      setLoading(false);
      // 기본 탭: 이 기록의 분류에 항목이 있으면 그쪽, 없으면 반대쪽
      if (data) {
        const hasScanCat = data.items.some((it) => it.category === data.category);
        setTab(
          hasScanCat
            ? data.category
            : data.category === '알약'
              ? '건강기능식품 라벨'
              : '알약',
        );
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  // 각 항목의 분류(괄호 안 값) 기준으로 선택한 탭에 해당하는 항목만 표시
  const items: RecognizedItem[] =
    record ? record.items.filter((it) => it.category === tab) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={24} color={APPLE_THEME.tintBlue} />
          <Text style={styles.backText}>기록</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{record ? formatRecordTitle(record.createdAt) : '기록'}</Text>
      {record ? (
        <Text style={styles.timeText}>{formatRecordTime(record.createdAt)}</Text>
      ) : null}

      {/* 토글 (Segmented Control) */}
      <View style={styles.segment}>
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              activeOpacity={0.8}
              onPress={() => setTab(t.value)}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? null : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-outline" size={48} color="#D1D1D6" />
          <Text style={styles.emptyText}>이 종류의 인식 기록이 없어요</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/** 저장된 인식 항목 카드 (결과 페이지와 동일한 모양, 읽기 전용) */
function ItemCard({ item }: { item: RecognizedItem }) {
  const cat = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE['알약'];
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: cat.bg }]}>
        <Text style={styles.iconEmoji}>{cat.emoji}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name} {item.dosage}
        </Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  headerRow: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: APPLE_THEME.tintBlue,
    marginLeft: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: APPLE_THEME.textDark,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 15,
    color: APPLE_THEME.textMuted,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: APPLE_THEME.segmentBg,
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: APPLE_THEME.textMuted,
  },
  segmentTextActive: {
    color: APPLE_THEME.textDark,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 16,
    color: APPLE_THEME.textMuted,
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
});
