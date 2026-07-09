import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { ItemEditModal } from '@/components/item-edit-modal';
import { RecognizedItemRow } from '@/components/recognized-item-row';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { markReviewReached } from '@/services/flow-metrics';
import { updateSessionItems } from '@/services/history-storage';
import { categoryLabel, translate, useI18n } from '@/services/i18n';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const CATEGORY_META: Record<ItemCategory, { icon: 'medical' | 'leaf'; tone: 'blue' | 'green' }> = {
  알약: { icon: 'medical', tone: 'blue' },
  '건강기능식품 라벨': { icon: 'leaf', tone: 'green' },
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
  const { items: itemsParam, recordId, flowId } = useLocalSearchParams<{ items?: string; recordId?: string; flowId?: string }>();
  const initialItems = useMemo(() => normalizeItems(parseItems(itemsParam)), [itemsParam]);
  const [items, setItems] = useState<RecognizedItem[]>(initialItems);
  const [editTarget, setEditTarget] = useState<RecognizedItem | null | undefined>(undefined);
  const [addCategory, setAddCategory] = useState<ItemCategory>('알약');
  const { lowVision } = useUserMode();
  const { language, t } = useI18n();

  const pillItems = items.filter((item) => item.category === '알약');
  const supplementItems = items.filter((item) => item.category === '건강기능식품 라벨');

  useEffect(() => {
    markReviewReached(flowId).catch((e) => console.warn('[metrics] 리뷰 도달 기록 실패:', e));
  }, [flowId]);

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

  const openAdd = (category: ItemCategory) => {
    setAddCategory(category);
    setEditTarget(null);
  };

  const analyze = () => {
    persist(items);
    router.replace({
      pathname: '/analyze',
      params: {
        items: JSON.stringify(items),
        recordId: recordId ?? '',
        flowId: flowId ?? '',
      },
    });
  };

  const handleBack = () => {
    router.replace({
      pathname: '/result',
      params: {
        category: '건강기능식품 라벨',
        prevItems: JSON.stringify(pillItems),
        items: JSON.stringify(supplementItems),
        recordId: recordId ?? '',
        flowId: flowId ?? '',
      },
    });
  };

  return (
    <Screen
      bottom={
        <View style={styles.footer}>
          <PrimaryButton label={t('analyzeInteractions')} icon="analytics" disabled={items.length === 0} onPress={analyze} />
        </View>
      }>
      <TopBar title={t('reviewAllResults')} backLabel={t('back')} onBack={handleBack} />
      <StepIndicator current={3} />

      <ScrollView contentContainerStyle={[styles.content, lowVision && styles.contentLowVision]} showsVerticalScrollIndicator={false}>
        <ItemSection
          category="알약"
          items={pillItems}
          lowVision={lowVision}
          language={language}
          onAdd={() => openAdd('알약')}
          onPress={setEditTarget}
        />
        <ItemSection
          category="건강기능식품 라벨"
          items={supplementItems}
          lowVision={lowVision}
          language={language}
          onAdd={() => openAdd('건강기능식품 라벨')}
          onPress={setEditTarget}
        />
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

function ItemSection({
  category,
  items,
  lowVision,
  language,
  onAdd,
  onPress,
}: {
  category: ItemCategory;
  items: RecognizedItem[];
  lowVision: boolean;
  language: ReturnType<typeof useI18n>['language'];
  onAdd: () => void;
  onPress: (item: RecognizedItem) => void;
}) {
  const meta = CATEGORY_META[category];
  const label = categoryLabel(category, language);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <IconBadge icon={meta.icon} tone={meta.tone} size="sm" />
          <Text style={[styles.sectionTitle, lowVision && styles.sectionTitleLowVision]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
            {label}
          </Text>
        </View>
        <Text style={[styles.sectionCount, lowVision && styles.sectionCountLowVision]}>{items.length}</Text>
      </View>

      <View style={styles.itemList}>
        {items.map((item) => (
          <RecognizedItemRow key={item.id} item={item} editable onPress={() => onPress(item)} />
        ))}
        <Pressable
          style={({ pressed }) => [styles.addRow, lowVision && styles.addRowLowVision, pressed && styles.pressed]}
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={`${label} ${translate(language, 'addManually')}`}>
          <Ionicons name="add" size={lowVision ? 23 : 19} color={Palette.textMuted} />
          <Text style={[styles.addRowText, lowVision && styles.addRowTextLowVision]}>{translate(language, 'addManually')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 28,
    gap: 14,
  },
  contentLowVision: {
    paddingBottom: 34,
    gap: 16,
  },
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    padding: 14,
    ...Shadow.subtle,
  },
  sectionHeader: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600',
    color: Palette.text,
  },
  sectionTitleLowVision: {
    fontSize: 22,
    lineHeight: 29,
  },
  sectionCount: {
    minWidth: 34,
    textAlign: 'right',
    fontSize: 20,
    fontWeight: '600',
    color: Palette.text,
  },
  sectionCountLowVision: {
    fontSize: 24,
  },
  itemList: {
    gap: 9,
  },
  addRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surfaceMuted,
  },
  addRowLowVision: {
    minHeight: 72,
  },
  addRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  addRowTextLowVision: {
    fontSize: 18,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  footer: {
    paddingBottom: 8,
  },
});
