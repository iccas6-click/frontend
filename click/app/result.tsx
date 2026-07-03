import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, SectionHeader, TopBar } from '@/components/app-ui';
import { ItemEditModal } from '@/components/item-edit-modal';
import { PillCandidatePicker, pillItemFromCandidate } from '@/components/pill-candidate-picker';
import { RecognizedItemRow } from '@/components/recognized-item-row';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { createSession, updateSessionItems } from '@/services/history-storage';
import { analyzeImage } from '@/services/ocr';
import type { ItemCategory, RecognizedItem, RecognitionCandidate } from '@/types/medication';

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
  const [activePillIndex, setActivePillIndex] = useState(0);
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

  const handleSelectCandidate = useCallback(
    (itemId: string, candidate: RecognitionCandidate) => {
      setItems((prev) => {
        const nextItems = prev.map((item) => (
          item.id === itemId ? pillItemFromCandidate(item, candidate) : item
        ));
        persistCurrent(nextItems);
        return nextItems;
      });
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
        .map((item, index) => ({
          ...item,
          id: `current-${index}`,
          sourceImageUri: item.sourceImageUri ?? photoUri,
        }));
      const allItems = buildAllItems(current);
      setItems(current);
      setActivePillIndex(0);

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

  useEffect(() => {
    setActivePillIndex((prev) => Math.min(prev, Math.max(items.length - 1, 0)));
  }, [items.length]);

  const canContinue = !loading && !error && items.length > 0;
  const showPillReview = !isSupplement && items.some((item) => item.candidates?.length);

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
    router.replace({
      pathname: '/review',
      params: {
        items: JSON.stringify(allItems),
        recordId: recordId ?? '',
      },
    });
  };

  const retake = () => {
    router.replace({
      pathname: '/camera',
      params: {
        category: selectedCategory,
        prevItems,
        recordId: recordId ?? recordIdParam ?? '',
      },
    });
  };

  const handleBack = () => {
    if (itemsParam && !photoUri) {
      router.replace({
        pathname: '/reuse',
        params: {
          category: selectedCategory,
          prevItems,
          recordId: recordId ?? recordIdParam ?? '',
        },
      });
      return;
    }

    router.replace({
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
                <PrimaryButton label="건강기능식품 추가" icon="leaf" disabled={!canContinue} onPress={goSupplement} />
              ) : (
                <PrimaryButton label="전체 확인" icon="list" disabled={!canContinue} onPress={goReview} />
              )}
            </View>
          </View>
        </View>
      }>
      <TopBar title={`${meta.label} 결과`} backLabel="뒤로" onBack={handleBack} />
      <StepIndicator current={isSupplement ? 2 : 1} />

      {loading ? (
        <StateView icon="scan" title="인식 중" loading />
      ) : error ? (
        <StateView icon="alert-circle" title="인식 실패">
          <PrimaryButton label="다시 시도" icon="refresh" onPress={runRecognition} />
        </StateView>
      ) : (
        <>
          <SectionHeader title={showPillReview ? '알약 확인' : `인식된 ${meta.label}`} action={<CountBadge count={items.length} lowVision={lowVision} />} />
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {showPillReview ? (
              <GuidedPillReview
                items={items}
                activeIndex={activePillIndex}
                onActiveIndexChange={setActivePillIndex}
                onSelectCandidate={handleSelectCandidate}
                onEdit={(item) => setEditTarget(item)}
              />
            ) : (
              items.map((item) => (
                <RecognizedItemRow key={item.id} item={item} editable onPress={() => setEditTarget(item)} />
              ))
            )}
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

function GuidedPillReview({
  items,
  activeIndex,
  onActiveIndexChange,
  onSelectCandidate,
  onEdit,
}: {
  items: RecognizedItem[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelectCandidate: (itemId: string, candidate: RecognitionCandidate) => void;
  onEdit: (item: RecognizedItem) => void;
}) {
  const { lowVision } = useUserMode();
  const activeItem = items[activeIndex] ?? items[0];
  const sourceItem = items.find((item) => item.sourceImageUri && item.sourceImageWidth && item.sourceImageHeight);
  const sourceUri = sourceItem?.sourceImageUri ?? activeItem?.sourceImageUri;
  const sourceWidth = sourceItem?.sourceImageWidth ?? activeItem?.sourceImageWidth ?? 1;
  const sourceHeight = sourceItem?.sourceImageHeight ?? activeItem?.sourceImageHeight ?? 1;
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  if (!activeItem) return null;

  return (
    <View style={styles.guidedWrap}>
      <View style={[styles.photoCard, lowVision && styles.photoCardLowVision]}>
        {sourceUri ? (
          <View style={[styles.photoFrame, { aspectRatio: sourceWidth / sourceHeight }]}>
            <Image source={{ uri: sourceUri }} style={styles.photo} contentFit="contain" />
            {items.map((item, index) => (
              <PillBox
                key={item.id}
                item={item}
                index={index}
                active={index === activeIndex}
                imageWidth={sourceWidth}
                imageHeight={sourceHeight}
                onPress={() => onActiveIndexChange(index)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.photoEmpty}>
            <Text style={styles.photoEmptyText}>원본 사진 없음</Text>
          </View>
        )}
      </View>

      <View style={[styles.questionCard, lowVision && styles.questionCardLowVision]}>
        <Text style={[styles.questionIndex, lowVision && styles.questionIndexLowVision]}>
          {activeIndex + 1} / {items.length}
        </Text>
        <Text style={[styles.questionTitle, lowVision && styles.questionTitleLowVision]}>
          표시된 알약이 이 약인가요?
        </Text>
      </View>

      <PillCandidatePicker
        item={activeItem}
        onSelect={(candidate) => onSelectCandidate(activeItem.id, candidate)}
        onEdit={() => onEdit(activeItem)}
      />

      {items.length > 1 ? (
        <View style={styles.pillNav}>
          <Pressable
            style={({ pressed }) => [
              styles.pillNavButton,
              lowVision && styles.pillNavButtonLowVision,
              !hasPrevious && styles.pillNavButtonDisabled,
              pressed && hasPrevious && styles.pressed,
            ]}
            disabled={!hasPrevious}
            onPress={() => onActiveIndexChange(Math.max(activeIndex - 1, 0))}
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasPrevious }}
            accessibilityLabel="이전 알약">
            <Text style={[styles.pillNavText, lowVision && styles.pillNavTextLowVision, !hasPrevious && styles.pillNavTextDisabled]}>
              이전
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.pillNavButton,
              styles.pillNavButtonPrimary,
              lowVision && styles.pillNavButtonLowVision,
              !hasNext && styles.pillNavButtonDisabled,
              pressed && hasNext && styles.pressed,
            ]}
            disabled={!hasNext}
            onPress={() => onActiveIndexChange(Math.min(activeIndex + 1, items.length - 1))}
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasNext }}
            accessibilityLabel="다음 알약">
            <Text style={[styles.pillNavText, styles.pillNavTextPrimary, lowVision && styles.pillNavTextLowVision, !hasNext && styles.pillNavTextDisabled]}>
              다음 알약
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function PillBox({
  item,
  index,
  active,
  imageWidth,
  imageHeight,
  onPress,
}: {
  item: RecognizedItem;
  index: number;
  active: boolean;
  imageWidth: number;
  imageHeight: number;
  onPress: () => void;
}) {
  if (!item.bbox) return null;
  const [x1, y1, x2, y2] = item.bbox;
  const left = Math.max(0, Math.min(100, (x1 / imageWidth) * 100));
  const top = Math.max(0, Math.min(100, (y1 / imageHeight) * 100));
  const width = Math.max(4, Math.min(100 - left, ((x2 - x1) / imageWidth) * 100));
  const height = Math.max(4, Math.min(100 - top, ((y2 - y1) / imageHeight) * 100));

  return (
    <Pressable
      style={[
        styles.pillBox,
        active && styles.pillBoxActive,
        {
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${index + 1}번 알약 선택`}>
      <View style={[styles.pillBoxLabel, active && styles.pillBoxLabelActive]}>
        <Text style={[styles.pillBoxLabelText, active && styles.pillBoxLabelTextActive]}>{index + 1}</Text>
      </View>
    </Pressable>
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
  guidedWrap: {
    gap: 10,
  },
  photoCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 10,
    overflow: 'hidden',
  },
  photoCardLowVision: {
    padding: 12,
  },
  photoFrame: {
    width: '100%',
    maxHeight: 360,
    borderRadius: Radius.md,
    backgroundColor: '#101318',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoEmpty: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceMuted,
  },
  photoEmptyText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textMuted,
  },
  pillBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.78)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
  },
  pillBoxActive: {
    borderWidth: 3,
    borderColor: Palette.primary,
    backgroundColor: 'rgba(22,119,255,0.14)',
  },
  pillBoxLabel: {
    position: 'absolute',
    left: 4,
    top: 4,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  pillBoxLabelActive: {
    backgroundColor: Palette.primary,
  },
  pillBoxLabelText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: Palette.text,
  },
  pillBoxLabelTextActive: {
    color: Palette.surface,
  },
  questionCard: {
    backgroundColor: Palette.primarySoft,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CFE3FF',
  },
  questionCardLowVision: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  questionIndex: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: Palette.primary,
  },
  questionIndexLowVision: {
    fontSize: 16,
    lineHeight: 22,
  },
  questionTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
    color: Palette.text,
    marginTop: 2,
  },
  questionTitleLowVision: {
    fontSize: 25,
    lineHeight: 32,
  },
  pillNav: {
    flexDirection: 'row',
    gap: 10,
  },
  pillNavButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  pillNavButtonPrimary: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  pillNavButtonLowVision: {
    minHeight: 64,
  },
  pillNavButtonDisabled: {
    opacity: 0.42,
  },
  pillNavText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  pillNavTextPrimary: {
    color: Palette.surface,
  },
  pillNavTextLowVision: {
    fontSize: 20,
    lineHeight: 27,
  },
  pillNavTextDisabled: {
    color: Palette.textSubtle,
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
