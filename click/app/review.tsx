import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, SectionHeader, TopBar } from '@/components/app-ui';
import { ItemEditModal } from '@/components/item-edit-modal';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { updateSessionItems } from '@/services/history-storage';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const CATEGORY_META: Record<ItemCategory, { label: string; icon: 'medical' | 'leaf'; tone: 'blue' | 'green' }> = {
  알약: { label: '알약', icon: 'medical', tone: 'blue' },
  '건강기능식품 라벨': { label: '건강기능식품', icon: 'leaf', tone: 'green' },
};

function parseItems(raw?: string): RecognizedItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecognizedItem[]) : [];
  } catch {
    return [];
  }
}

function normalizeItems(items: RecognizedItem[]) {
  return items.map((item, index) => ({ ...item, id: `review-${index}` }));
}

export default function ReviewScreen() {
  const router = useRouter();
  const { items: itemsParam, recordId } = useLocalSearchParams<{ items?: string; recordId?: string }>();
  const initialItems = useMemo(() => normalizeItems(parseItems(itemsParam)), [itemsParam]);
  const [items, setItems] = useState<RecognizedItem[]>(initialItems);
  const [editTarget, setEditTarget] = useState<RecognizedItem | null | undefined>(undefined);

  const pillItems = items.filter((item) => item.category === '알약');
  const supplementItems = items.filter((item) => item.category === '건강기능식품 라벨');

  const persist = (nextItems: RecognizedItem[]) => {
    if (recordId) {
      updateSessionItems(recordId, nextItems).catch((e) => console.warn('기록 갱신 실패:', e));
    }
  };

  const handleSave = (item: RecognizedItem) => {
    setItems((prev) => {
      const nextItems = item.id
        ? prev.map((it) => (it.id === item.id ? item : it))
        : [...prev, { ...item, id: `review-new-${Date.now()}` }];
      persist(nextItems);
      return nextItems;
    });
    setEditTarget(undefined);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== id);
      persist(nextItems);
      return nextItems;
    });
    setEditTarget(undefined);
  };

  const analyze = () => {
    persist(items);
    router.push({
      pathname: '/analyze',
      params: {
        items: JSON.stringify(items),
        recordId: recordId ?? '',
      },
    });
  };

  return (
    <Screen
      bottom={
        <View style={styles.footer}>
          <PrimaryButton label="상호작용 분석하기" icon="analytics" disabled={items.length === 0} onPress={analyze} />
        </View>
      }>
      <TopBar title="전체 인식 결과 확인" subtitle="분석에 들어가기 전 알약과 건강기능식품 목록을 한 번에 확인하세요." backLabel="이전" onBack={() => router.back()} />
      <StepIndicator current={3} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>분석할 목록</Text>
            <Text style={styles.summaryTitle}>알약 {pillItems.length}개 · 건강기능식품 {supplementItems.length}개</Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => setEditTarget(null)}
            accessibilityRole="button"
            accessibilityLabel="항목 직접 추가">
            <Ionicons name="add" size={18} color={Palette.primary} />
            <Text style={styles.addButtonText}>추가</Text>
          </Pressable>
        </View>

        <ItemGroup title="알약" empty="알약 항목이 없어요" items={pillItems} onPress={setEditTarget} />
        <ItemGroup title="건강기능식품" empty="건강기능식품 항목이 없어요" items={supplementItems} onPress={setEditTarget} />
      </ScrollView>

      <ItemEditModal
        visible={editTarget !== undefined}
        initial={editTarget ?? null}
        onClose={() => setEditTarget(undefined)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </Screen>
  );
}

function ItemGroup({
  title,
  empty,
  items,
  onPress,
}: {
  title: string;
  empty: string;
  items: RecognizedItem[];
  onPress: (item: RecognizedItem) => void;
}) {
  return (
    <View>
      <SectionHeader title={title} />
      <View style={styles.groupList}>
        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{empty}</Text>
          </View>
        ) : (
          items.map((item) => <ReviewItemCard key={item.id} item={item} onPress={() => onPress(item)} />)
        )}
      </View>
    </View>
  );
}

function ReviewItemCard({ item, onPress }: { item: RecognizedItem; onPress: () => void }) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META['알약'];
  return (
    <Pressable
      style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${meta.label}${item.dosage ? `, ${item.dosage}` : ''}, 수정`}>
      <IconBadge icon={meta.icon} tone={meta.tone} />
      <View style={styles.itemText}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemMeta}>
          {meta.label}
          {item.dosage ? ` · ${item.dosage}` : ''}
        </Text>
      </View>
      <View style={styles.editPill}>
        <Text style={styles.editPillText}>수정</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
  },
  summaryCard: {
    marginHorizontal: Spacing.screen,
    marginBottom: 18,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.subtle,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Palette.textMuted,
  },
  summaryTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: Palette.text,
    marginTop: 4,
  },
  addButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Palette.primarySoft,
  },
  addButtonText: {
    color: Palette.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  groupList: {
    paddingHorizontal: Spacing.screen,
    gap: 10,
    marginBottom: 20,
  },
  itemCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  itemText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '900',
    color: Palette.text,
  },
  itemMeta: {
    fontSize: 14,
    color: Palette.textMuted,
    marginTop: 4,
  },
  editPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceMuted,
  },
  editPillText: {
    ...Typography.caption,
    color: Palette.textMuted,
  },
  emptyCard: {
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surface,
  },
  emptyText: {
    ...Typography.body,
    color: Palette.textMuted,
  },
  footer: {
    paddingBottom: 8,
  },
});
