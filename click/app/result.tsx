import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, SectionHeader, TopBar } from '@/components/app-ui';
import { ItemEditModal } from '@/components/item-edit-modal';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { createScan, updateScan } from '@/services/history-storage';
import { analyzeImage } from '@/services/ocr';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const CATEGORY_META: Record<ItemCategory, { label: string; icon: 'medical' | 'leaf'; tone: 'blue' | 'green' }> = {
  알약: { label: '알약', icon: 'medical', tone: 'blue' },
  '건강기능식품 라벨': { label: '건강기능식품', icon: 'leaf', tone: 'green' },
};

export default function ResultScreen() {
  const router = useRouter();
  const { photoUri, category, prevItems, items: itemsParam, recordId: recordIdParam } = useLocalSearchParams<{
    photoUri?: string;
    category?: string;
    prevItems?: string;
    items?: string;
    recordId?: string;
  }>();

  const parsedPrevItems = useMemo<RecognizedItem[]>(() => {
    if (!prevItems) return [];
    try {
      return JSON.parse(prevItems);
    } catch {
      return [];
    }
  }, [prevItems]);

  const selectedCategory: ItemCategory = category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';
  const isSupplement = selectedCategory === '건강기능식품 라벨';

  const parsedCurrentItems = useMemo<RecognizedItem[] | null>(() => {
    if (!itemsParam) return null;
    try {
      const parsed = JSON.parse(itemsParam);
      return Array.isArray(parsed) ? (parsed as RecognizedItem[]) : null;
    } catch {
      return null;
    }
  }, [itemsParam]);

  const [items, setItems] = useState<RecognizedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(recordIdParam ?? null);
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
      const result = parsedCurrentItems ?? (await analyzeImage(photoUri ?? '', selectedCategory));
      const combined = [...parsedPrevItems, ...result].map((it, i) => ({ ...it, id: `r${i}` }));
      setItems(combined);

      if (recordIdParam) {
        await updateScan(recordIdParam, combined);
        setRecordId(recordIdParam);
      } else {
        const id = await createScan(selectedCategory, combined);
        setRecordId(id);
      }
    } catch (e) {
      console.warn('OCR 분석 실패:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [photoUri, selectedCategory, recordIdParam, parsedPrevItems, parsedCurrentItems]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  useEffect(() => {
    if (recordId && !loading && !error) {
      updateScan(recordId, items).catch((e) => console.warn('기록 갱신 실패:', e));
    }
  }, [items, recordId, loading, error]);

  const pillCount = items.filter((item) => item.category === '알약').length;
  const supplementCount = items.filter((item) => item.category === '건강기능식품 라벨').length;
  const canAnalyze = !loading && !error && items.length > 0;

  return (
    <Screen
      bottom={
        <View style={styles.footer}>
          {!isSupplement ? (
            <PrimaryButton
              label="건강기능식품 이어서 선택"
              icon="leaf"
              variant="secondary"
              disabled={!canAnalyze}
              onPress={() =>
                router.replace({
                  pathname: '/reuse',
                  params: {
                    category: '건강기능식품 라벨',
                    prevItems: JSON.stringify(items),
                    recordId: recordId ?? '',
                  },
                })
              }
            />
          ) : null}
          <PrimaryButton
            label={isSupplement ? '상호작용 분석하기' : '이대로 분석하기'}
            icon="analytics"
            disabled={!canAnalyze}
            onPress={() => router.push({ pathname: '/analyze', params: { items: JSON.stringify(items), recordId: recordId ?? '' } })}
          />
        </View>
      }>
      <TopBar
        title="인식 결과 확인"
        subtitle="잘못 인식된 이름이나 함량은 분석 전에 수정할 수 있어요."
        backLabel="촬영"
        onBack={() => router.back()}
      />
      <StepIndicator current={isSupplement ? 2 : 1} />

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>현재 목록</Text>
          <Text style={styles.summaryTitle}>
            알약 {pillCount}개 · 건강기능식품 {supplementCount}개
          </Text>
        </View>
        <Pressable style={styles.addMiniButton} onPress={() => setEditTarget(null)}>
          <Ionicons name="add" size={18} color={Palette.primary} />
          <Text style={styles.addMiniText}>직접 추가</Text>
        </Pressable>
      </View>

      {loading ? (
        <StateView icon="scan" title="사진을 분석하고 있어요" body="잠시만 기다려 주세요." loading />
      ) : error ? (
        <StateView icon="alert-circle" title="인식에 실패했어요" body="다시 촬영하거나 직접 추가해 분석을 계속할 수 있어요.">
          <PrimaryButton label="다시 시도" icon="refresh" onPress={runAnalysis} />
        </StateView>
      ) : (
        <>
          <SectionHeader title="인식된 항목" />
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} onPress={() => setEditTarget(item)} />
            ))}
            <Pressable style={({ pressed }) => [styles.addCard, pressed && styles.pressed]} onPress={() => setEditTarget(null)}>
              <IconBadge icon="add" tone="dark" size="sm" />
              <Text style={styles.addCardText}>목록에 없는 항목 직접 추가</Text>
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
    <Pressable style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]} onPress={onPress}>
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
    fontWeight: '900',
    color: Palette.text,
    marginTop: 4,
  },
  addMiniButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Palette.primarySoft,
  },
  addMiniText: {
    color: Palette.primary,
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
