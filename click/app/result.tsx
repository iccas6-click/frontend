import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, SectionHeader, TopBar } from '@/components/app-ui';
import { ItemEditModal } from '@/components/item-edit-modal';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
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
      <TopBar
        title={`${meta.label} 결과 확인`}
        subtitle={`이번 단계에서 인식한 ${meta.label}만 확인합니다.`}
        backLabel="이전"
        onBack={() => router.back()}
      />
      <StepIndicator current={isSupplement ? 2 : 1} />

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>이번 인식 결과</Text>
          <Text style={styles.summaryTitle}>
            {meta.label} {items.length}개
          </Text>
        </View>
        <Pressable
          style={styles.addMiniButton}
          onPress={() => setEditTarget(null)}
          accessibilityRole="button"
          accessibilityLabel={`${meta.label} 직접 추가`}>
          <Ionicons name="add" size={18} color={Palette.primary} />
          <Text style={styles.addMiniText}>직접 추가</Text>
        </Pressable>
      </View>

      {loading ? (
        <StateView icon="scan" title={`${meta.label}을 분석하고 있어요`} body="잠시만 기다려 주세요." loading />
      ) : error ? (
        <StateView icon="alert-circle" title="인식에 실패했어요" body="다시 촬영하거나 직접 추가해 분석을 계속할 수 있어요.">
          <PrimaryButton label="다시 시도" icon="refresh" onPress={runRecognition} />
        </StateView>
      ) : (
        <>
          <SectionHeader title={`인식된 ${meta.label}`} />
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} onPress={() => setEditTarget(item)} />
            ))}
            <Pressable
              style={({ pressed }) => [styles.addCard, pressed && styles.pressed]}
              onPress={() => setEditTarget(null)}
              accessibilityRole="button"
              accessibilityLabel={`${meta.label} 직접 추가`}>
              <IconBadge icon="add" tone="dark" size="sm" />
              <Text style={styles.addCardText}>목록에 없는 {meta.label} 직접 추가</Text>
            </Pressable>
          </ScrollView>
        </>
      )}

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

function ItemCard({ item, onPress }: { item: RecognizedItem; onPress: () => void }) {
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

function StateView({
  icon,
  title,
  body,
  loading,
  children,
}: {
  icon: 'scan' | 'alert-circle';
  title: string;
  body: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.state}>
      {loading ? <ActivityIndicator color={Palette.primary} size="large" /> : <IconBadge icon={icon} tone="amber" size="lg" />}
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      {children ? <View style={styles.stateAction}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  addMiniButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Palette.primarySoft,
  },
  addMiniText: {
    color: Palette.primary,
    fontSize: 15,
    fontWeight: '800',
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
  addCardText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textMuted,
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
  stateBody: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
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
