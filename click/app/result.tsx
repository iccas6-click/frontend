import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, SectionHeader, TopBar } from '@/components/app-ui';
import { ItemEditModal } from '@/components/item-edit-modal';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { createSession, updateSessionItems } from '@/services/history-storage';
import { analyzeImage } from '@/services/ocr';
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
  return items.map((item, index) => ({ ...item, id: `r${index}` }));
}

export default function ResultScreen() {
  const router = useRouter();
  const { photoUri, category, prevItems, items: itemsParam, recordId: recordIdParam } = useLocalSearchParams<{
    photoUri?: string;
    category?: string;
    prevItems?: string;
    items?: string;
    recordId?: string;
  }>();

  const parsedPrevItems = useMemo(() => parseItems(prevItems), [prevItems]);
  const parsedCurrentItems = useMemo(() => parseItems(itemsParam), [itemsParam]);

  const selectedCategory: ItemCategory = category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';
  const isSupplement = selectedCategory === '건강기능식품 라벨';
  const meta = CATEGORY_META[selectedCategory];

  const [items, setItems] = useState<RecognizedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(recordIdParam ?? null);
  const [editTarget, setEditTarget] = useState<RecognizedItem | null | undefined>(undefined);
  const nextId = useRef(0);
  const { lowVision } = useUserMode();

  const buildAllItems = useCallback((current: RecognizedItem[]) => normalizeItems([...parsedPrevItems, ...current]), [parsedPrevItems]);

  const persistCurrent = useCallback(
    (current: RecognizedItem[]) => {
      if (recordId) {
        updateSessionItems(recordId, buildAllItems(current)).catch((e) => console.warn('기록 갱신 실패:', e));
      }
    },
    [buildAllItems, recordId],
  );

  const handleSave = useCallback(
    (item: RecognizedItem) => {
      const nextItem = { ...item, category: selectedCategory };
      setItems((prev) => {
        let nextItems: RecognizedItem[];
        if (nextItem.id) {
          nextItems = prev.map((it) => (it.id === nextItem.id ? nextItem : it));
        } else {
          nextId.current += 1;
          nextItems = [...prev, { ...nextItem, id: `new-${nextId.current}` }];
        }
        persistCurrent(nextItems);
        return nextItems;
      });
      setEditTarget(undefined);
    },
    [persistCurrent, selectedCategory],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setItems((prev) => {
        const nextItems = prev.filter((it) => it.id !== id);
        persistCurrent(nextItems);
        return nextItems;
      });
      setEditTarget(undefined);
    },
    [persistCurrent],
  );

  const runRecognition = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const source = parsedCurrentItems.length > 0 ? parsedCurrentItems : await analyzeImage(photoUri ?? '', selectedCategory);
      const current = source
        .filter((item) => item.category === selectedCategory)
        .map((item, index) => ({ ...item, id: `current-${index}` }));
      const allItems = buildAllItems(current);
      setItems(current);

      if (recordIdParam) {
        await updateSessionItems(recordIdParam, allItems);
        setRecordId(recordIdParam);
      } else {
        const id = await createSession(selectedCategory, allItems);
        setRecordId(id);
      }
    } catch (e) {
      console.warn('OCR 분석 실패:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [buildAllItems, parsedCurrentItems, photoUri, recordIdParam, selectedCategory]);

  useEffect(() => {
    runRecognition();
  }, [runRecognition]);

  const canContinue = !loading && !error && items.length > 0;

  const goSupplement = () => {
    const allItems = buildAllItems(items);
    if (recordId) updateSessionItems(recordId, allItems).catch((e) => console.warn('기록 갱신 실패:', e));
    router.replace({
      pathname: '/reuse',
      params: {
        category: '건강기능식품 라벨',
        prevItems: JSON.stringify(allItems),
        recordId: recordId ?? '',
      },
    });
  };

  const goReview = () => {
    const allItems = buildAllItems(items);
    if (recordId) updateSessionItems(recordId, allItems).catch((e) => console.warn('기록 갱신 실패:', e));
    router.push({
      pathname: '/review',
      params: {
        items: JSON.stringify(allItems),
        recordId: recordId ?? '',
      },
    });
  };

  return (
    <Screen
      bottom={
        <View style={styles.footer}>
          {!isSupplement ? (
            <>
              <PrimaryButton label="건강기능식품 추가하기" icon="leaf" disabled={!canContinue} onPress={goSupplement} />
              <PrimaryButton label="알약만으로 전체 검토" icon="list" variant="secondary" disabled={!canContinue} onPress={goReview} />
            </>
          ) : (
            <PrimaryButton label="전체 인식 결과 확인" icon="list" disabled={!canContinue} onPress={goReview} />
          )}
        </View>
      }>
      <TopBar title={`${meta.label} 결과`} backLabel="이전" onBack={() => router.back()} />
      <StepIndicator current={isSupplement ? 2 : 1} />

      {loading ? (
        <StateView icon="scan" title="인식 중" loading />
      ) : error ? (
        <StateView icon="alert-circle" title="인식 실패">
          <PrimaryButton label="다시 시도" icon="refresh" onPress={runRecognition} />
        </StateView>
      ) : (
        <>
          <SectionHeader title={`인식된 ${meta.label}`} action={<CountBadge count={items.length} lowVision={lowVision} />} />
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} lowVision={lowVision} onPress={() => setEditTarget(item)} />
            ))}
            <Pressable
              style={({ pressed }) => [styles.addCard, lowVision && styles.addCardLowVision, pressed && styles.pressed]}
              onPress={() => setEditTarget(null)}
              accessibilityRole="button"
              accessibilityLabel={`${meta.label} 직접 추가`}>
              <IconBadge icon="add" tone="dark" size="sm" />
              <Text style={[styles.addCardText, lowVision && styles.addCardTextLowVision]}>목록에 없는 {meta.label} 직접 추가</Text>
            </Pressable>
          </ScrollView>
        </>
      )}

      <ItemEditModal
        visible={editTarget !== undefined}
        initial={editTarget ?? null}
        initialCategory={selectedCategory}
        onClose={() => setEditTarget(undefined)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </Screen>
  );
}

function ItemCard({ item, lowVision, onPress }: { item: RecognizedItem; lowVision: boolean; onPress: () => void }) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META['알약'];
  return (
    <Pressable
      style={({ pressed }) => [styles.itemCard, lowVision && styles.itemCardLowVision, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${meta.label}${item.dosage ? `, ${item.dosage}` : ''}, 수정`}>
      <IconBadge icon={meta.icon} tone={meta.tone} />
      <View style={styles.itemText}>
        <Text style={[styles.itemName, lowVision && styles.itemNameLowVision]} numberOfLines={lowVision ? 2 : 1}>
          {item.name}
        </Text>
        <Text style={[styles.itemMeta, lowVision && styles.itemMetaLowVision]}>
          {meta.label}
          {item.dosage ? ` · ${item.dosage}` : ''}
        </Text>
      </View>
      <View style={[styles.editPill, lowVision && styles.editPillLowVision]}>
        <Text style={[styles.editPillText, lowVision && styles.editPillTextLowVision]}>수정</Text>
      </View>
    </Pressable>
  );
}

function StateView({
  icon,
  title,
  loading,
  children,
}: {
  icon: 'scan' | 'alert-circle';
  title: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.state}>
      {loading ? <ActivityIndicator color={Palette.primary} size="large" /> : <IconBadge icon={icon} tone="amber" size="lg" />}
      <Text style={styles.stateTitle}>{title}</Text>
      {children ? <View style={styles.stateAction}>{children}</View> : null}
    </View>
  );
}

function CountBadge({ count, lowVision }: { count: number; lowVision: boolean }) {
  return (
    <View style={[styles.countBadge, lowVision && styles.countBadgeLowVision]}>
      <Text style={[styles.countBadgeText, lowVision && styles.countBadgeTextLowVision]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  countBadge: {
    minWidth: 34,
    minHeight: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceMuted,
    paddingHorizontal: 10,
  },
  countBadgeLowVision: {
    minWidth: 42,
    minHeight: 38,
  },
  countBadgeText: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.text,
  },
  countBadgeTextLowVision: {
    fontSize: 19,
  },
  listContent: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 20,
    gap: 10,
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
  itemCardLowVision: {
    minHeight: 100,
    padding: 17,
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
  itemNameLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  itemMeta: {
    fontSize: 14,
    color: Palette.textMuted,
    marginTop: 4,
  },
  itemMetaLowVision: {
    fontSize: 17,
    lineHeight: 23,
  },
  editPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceMuted,
  },
  editPillLowVision: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  editPillText: {
    ...Typography.caption,
    color: Palette.textMuted,
  },
  editPillTextLowVision: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  addCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surface,
  },
  addCardLowVision: {
    minHeight: 78,
  },
  addCardText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textMuted,
  },
  addCardTextLowVision: {
    fontSize: 18,
    fontWeight: '900',
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  stateTitle: {
    ...Typography.section,
    color: Palette.text,
    textAlign: 'center',
    marginTop: 16,
  },
  stateAction: {
    width: '100%',
    marginTop: 20,
  },
  footer: {
    gap: 10,
    paddingBottom: 8,
  },
});
