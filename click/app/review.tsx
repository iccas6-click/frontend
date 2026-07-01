import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { ItemEditModal } from '@/components/item-edit-modal';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
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
  return items.map((item, index) => ({ ...item, id: item.id || `review-${index}` }));
}

export default function ReviewScreen() {
  const router = useRouter();
  const { items: itemsParam, recordId } = useLocalSearchParams<{ items?: string; recordId?: string }>();
  const initialItems = useMemo(() => normalizeItems(parseItems(itemsParam)), [itemsParam]);
  const [items, setItems] = useState<RecognizedItem[]>(initialItems);
  const [editTarget, setEditTarget] = useState<RecognizedItem | null | undefined>(undefined);
  const [addCategory, setAddCategory] = useState<ItemCategory>('알약');
  const { lowVision } = useUserMode();

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
      <TopBar title="전체 인식 결과" backLabel="이전" onBack={() => router.back()} />
      <StepIndicator current={3} />

      <ScrollView contentContainerStyle={[styles.content, lowVision && styles.contentLowVision]} showsVerticalScrollIndicator={false}>
        <View style={styles.split}>
          <ItemColumn
            title="알약"
            category="알약"
            items={pillItems}
            lowVision={lowVision}
            onAdd={() => {
              setAddCategory('알약');
              setEditTarget(null);
            }}
            onPress={setEditTarget}
          />
          <ItemColumn
            title="건강기능식품"
            category="건강기능식품 라벨"
            items={supplementItems}
            lowVision={lowVision}
            onAdd={() => {
              setAddCategory('건강기능식품 라벨');
              setEditTarget(null);
            }}
            onPress={setEditTarget}
          />
        </View>
      </ScrollView>

      <ItemEditModal
        visible={editTarget !== undefined}
        initial={editTarget ?? null}
        initialCategory={addCategory}
        onClose={() => setEditTarget(undefined)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </Screen>
  );
}

function ItemColumn({
  title,
  category,
  items,
  lowVision,
  onAdd,
  onPress,
}: {
  title: string;
  category: ItemCategory;
  items: RecognizedItem[];
  lowVision: boolean;
  onAdd: () => void;
  onPress: (item: RecognizedItem) => void;
}) {
  const meta = CATEGORY_META[category];
  return (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <View style={styles.columnTitleRow}>
          <IconBadge icon={meta.icon} tone={meta.tone} size="sm" />
          <Text style={[styles.columnTitle, lowVision && styles.columnTitleLowVision]}>{title}</Text>
        </View>
        <Text style={[styles.columnCount, lowVision && styles.columnCountLowVision]}>{items.length}</Text>
      </View>

      <View style={styles.tileGrid}>
        {items.map((item) => (
          <ItemTile key={item.id} item={item} lowVision={lowVision} onPress={() => onPress(item)} />
        ))}
        <Pressable
          style={({ pressed }) => [styles.addTile, lowVision && styles.addTileLowVision, pressed && styles.pressed]}
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={`${title} 직접 추가`}>
          <Ionicons name="add" size={lowVision ? 25 : 21} color={Palette.textMuted} />
          <Text style={[styles.addTileText, lowVision && styles.addTileTextLowVision]}>추가</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ItemTile({ item, lowVision, onPress }: { item: RecognizedItem; lowVision: boolean; onPress: () => void }) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META['알약'];
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, lowVision && styles.tileLowVision, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, 수정`}>
      <Ionicons name={meta.icon} size={lowVision ? 22 : 18} color={meta.tone === 'green' ? Palette.mint : Palette.primary} />
      <Text style={[styles.tileName, lowVision && styles.tileNameLowVision]} numberOfLines={3}>
        {item.name}
      </Text>
      {item.dosage ? (
        <Text style={[styles.tileDose, lowVision && styles.tileDoseLowVision]} numberOfLines={1}>
          {item.dosage}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 28,
  },
  contentLowVision: {
    paddingBottom: 34,
  },
  split: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
    minHeight: 360,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    padding: 12,
    ...Shadow.subtle,
  },
  columnHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  columnTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  columnTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    color: Palette.text,
  },
  columnTitleLowVision: {
    fontSize: 19,
    lineHeight: 25,
  },
  columnCount: {
    minWidth: 30,
    textAlign: 'right',
    fontSize: 19,
    fontWeight: '900',
    color: Palette.text,
  },
  columnCountLowVision: {
    fontSize: 23,
  },
  tileGrid: {
    gap: 9,
  },
  tile: {
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    padding: 11,
    justifyContent: 'space-between',
  },
  tileLowVision: {
    minHeight: 152,
    padding: 12,
  },
  tileName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: Palette.text,
  },
  tileNameLowVision: {
    fontSize: 18,
    lineHeight: 24,
  },
  tileDose: {
    ...Typography.caption,
    color: Palette.textMuted,
  },
  tileDoseLowVision: {
    fontSize: 15,
    lineHeight: 20,
  },
  addTile: {
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.surfaceMuted,
  },
  addTileLowVision: {
    minHeight: 152,
  },
  addTileText: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  addTileTextLowVision: {
    fontSize: 17,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  footer: {
    paddingBottom: 8,
  },
});
