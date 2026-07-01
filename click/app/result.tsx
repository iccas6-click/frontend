import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, SectionHeader, TopBar } from '@/components/app-ui';
import { ItemEditModal } from '@/components/item-edit-modal';
import { RecognizedItemRow } from '@/components/recognized-item-row';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
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
    router.push({
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

  const retake = () => {
    router.push({
      pathname: '/camera',
      params: {
        category: selectedCategory,
        prevItems,
        recordId: recordId ?? recordIdParam ?? '',
      },
    });
  };

  return (
    <Screen
      bottom={
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerButton}>
              <PrimaryButton label="다시 촬영" icon="camera-reverse" variant="secondary" disabled={loading} onPress={retake} />
            </View>
            <View style={styles.footerButton}>
              {!isSupplement ? (
                <PrimaryButton label="건기식 추가" icon="leaf" disabled={!canContinue} onPress={goSupplement} />
              ) : (
                <PrimaryButton label="전체 확인" icon="list" disabled={!canContinue} onPress={goReview} />
              )}
            </View>
          </View>
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
              <RecognizedItemRow key={item.id} item={item} editable onPress={() => setEditTarget(item)} />
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
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
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
    paddingBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
