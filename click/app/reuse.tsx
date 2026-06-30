import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { formatRecordTime, formatRecordTitle, getReusableSessions } from '@/services/history-storage';
import type { AnalysisSession, ItemCategory, RecognizedItem } from '@/types/medication';

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  알약: '알약',
  '건강기능식품 라벨': '건강기능식품',
};

export default function ReuseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; prevItems?: string; recordId?: string; mode?: string }>();
  const category: ItemCategory = params.category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';
  const [records, setRecords] = useState<AnalysisSession[]>([]);
  const [recordsOpen, setRecordsOpen] = useState(false);

  const prevItems = useMemo<RecognizedItem[]>(() => {
    if (!params.prevItems) return [];
    try {
      const parsed = JSON.parse(params.prevItems);
      return Array.isArray(parsed) ? (parsed as RecognizedItem[]) : [];
    } catch {
      return [];
    }
  }, [params.prevItems]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getReusableSessions(category).then((data) => {
        if (active) setRecords(data.slice(0, 8));
      });
      return () => {
        active = false;
      };
    }, [category]),
  );

  const isSupplement = category === '건강기능식품 라벨';
  const label = CATEGORY_LABEL[category];
  const usableRecords = isSupplement && params.recordId ? records.filter((record) => record.id !== params.recordId) : records;

  const startCamera = () => {
    const next = {
      pathname: '/camera',
      params: {
        category,
        prevItems: params.prevItems,
        recordId: params.recordId,
      },
    } as const;

    if (params.recordId) {
      router.replace(next);
      return;
    }
    router.push(next);
  };

  const selectRecord = (record: AnalysisSession) => {
    setRecordsOpen(false);
    const selectedItems = record.items.filter((item) => item.category === category);
    const next = {
      pathname: '/result',
      params: {
        category,
        prevItems: JSON.stringify(prevItems),
        items: JSON.stringify(selectedItems),
        recordId: params.recordId ?? '',
      },
    } as const;

    if (params.recordId) {
      router.replace(next);
      return;
    }
    router.push(next);
  };

  return (
    <Screen>
      <StatusBar style="dark" />
      <TopBar
        title={isSupplement ? '건강기능식품 추가' : '알약으로 시작'}
        subtitle={isSupplement ? '기존 라벨 기록을 쓰거나 새로 촬영해 알약 목록에 더합니다.' : '반복 복용 중인 약은 기존 기록으로 바로 시작할 수 있어요.'}
        backLabel="뒤로"
        onBack={() => router.back()}
      />
      <StepIndicator current={isSupplement ? 2 : 1} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isSupplement && prevItems.length > 0 ? (
          <View style={styles.contextCard}>
            <IconBadge icon="medical" tone="blue" />
            <View style={styles.contextText}>
              <Text style={styles.contextTitle}>알약 {prevItems.filter((item) => item.category === '알약').length}개 선택됨</Text>
              <Text style={styles.contextBody}>이어서 건강기능식품을 선택하면 한 기록으로 분석됩니다.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.choiceHeader}>
          <Text style={styles.choiceTitle}>{label}을 어떻게 추가할까요?</Text>
          <Text style={styles.choiceBody}>기록을 쓰면 확인 화면에서 다시 수정할 수 있습니다.</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.captureCard, pressed && styles.pressed]}
          onPress={startCamera}
          accessibilityRole="button"
          accessibilityLabel={`새 ${label} 촬영하기`}>
          <IconBadge icon="camera" tone={isSupplement ? 'green' : 'blue'} />
          <View style={styles.captureText}>
            <Text style={styles.captureTitle}>새 {label} 촬영하기</Text>
            <Text style={styles.captureBody}>
              {isSupplement ? '라벨과 성분표를 다시 촬영합니다.' : '알약과 포장 정보를 다시 촬영합니다.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.recordChoiceCard, pressed && styles.pressed]}
          onPress={() => setRecordsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`기존 ${label} 기록에서 선택하기`}>
          <IconBadge icon="folder-open" tone="dark" />
          <View style={styles.recordChoiceText}>
            <Text style={styles.recordChoiceTitle}>기존 기록에서 선택하기</Text>
            <Text style={styles.recordChoiceBody}>
              {usableRecords.length > 0 ? `최근 ${usableRecords.length}개 기록에서 고릅니다.` : `저장된 ${label} 기록이 있는지 확인합니다.`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Palette.textSubtle} />
        </Pressable>

        <View style={styles.noteCard}>
          <Ionicons name="shield-checkmark" size={19} color={Palette.mint} />
          <Text style={styles.noteText}>기존 기록을 골라도 다음 화면에서 이름과 용량을 다시 확인할 수 있습니다.</Text>
        </View>
      </ScrollView>

      <Modal visible={recordsOpen} transparent animationType="slide" onRequestClose={() => setRecordsOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRecordsOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>기존 {label} 기록</Text>
              <Text style={styles.sheetSubtitle}>최근 인식 기록을 최신순으로 정렬했어요.</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setRecordsOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="기존 기록 선택 창 닫기">
              <Ionicons name="close" size={22} color={Palette.textMuted} />
            </Pressable>
          </View>

          {usableRecords.length === 0 ? (
            <View style={styles.empty}>
              <IconBadge icon="folder-open" tone="dark" size="lg" />
              <Text style={styles.emptyTitle}>아직 재사용할 {label} 기록이 없어요</Text>
              <Text style={styles.emptyBody}>이번에는 새로 촬영하면 다음부터 여기에서 바로 선택할 수 있습니다.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.recordList} showsVerticalScrollIndicator={false}>
              {usableRecords.map((record) => (
                <ReuseCard key={record.id} record={record} category={category} onPress={() => selectRecord(record)} />
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </Screen>
  );
}

function ReuseCard({
  record,
  category,
  onPress,
}: {
  record: AnalysisSession;
  category: ItemCategory;
  onPress: () => void;
}) {
  const items = record.items.filter((item) => item.category === category);
  const names = items.map((item) => item.name).slice(0, 3).join(', ');
  const isSupplement = category === '건강기능식품 라벨';

  return (
    <Pressable
      style={({ pressed }) => [styles.recordCard, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${formatRecordTitle(record.createdAt)}, ${formatRecordTime(record.createdAt)}, ${CATEGORY_LABEL[category]} ${items.length}개 사용`}>
      <IconBadge icon={isSupplement ? 'leaf' : 'medical'} tone={isSupplement ? 'green' : 'blue'} />
      <View style={styles.recordText}>
        <Text style={styles.recordTitle}>{formatRecordTitle(record.createdAt)}</Text>
        <Text style={styles.recordMeta}>
          {formatRecordTime(record.createdAt)} · {CATEGORY_LABEL[category]} {items.length}개
        </Text>
        <Text style={styles.recordNames} numberOfLines={1}>
          {names || '이름 없는 항목'}
          {items.length > 3 ? ` 외 ${items.length - 3}개` : ''}
        </Text>
      </View>
      <View style={styles.usePill}>
        <Text style={styles.usePillText}>사용</Text>
        <Ionicons name="chevron-forward" size={16} color={Palette.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 42,
    gap: 14,
  },
  choiceHeader: {
    gap: 4,
  },
  choiceTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
    color: Palette.text,
  },
  choiceBody: {
    ...Typography.body,
    color: Palette.textMuted,
  },
  captureCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  captureText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  captureTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  captureBody: {
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 3,
  },
  contextCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  contextText: {
    flex: 1,
    marginLeft: 14,
  },
  contextTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: Palette.text,
  },
  contextBody: {
    ...Typography.body,
    color: Palette.textMuted,
    marginTop: 3,
  },
  recordList: {
    paddingBottom: 22,
    gap: 10,
  },
  recordChoiceCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    padding: 16,
    ...Shadow.subtle,
  },
  recordChoiceText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  recordChoiceTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    color: Palette.text,
  },
  recordChoiceBody: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 3,
  },
  noteCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: Radius.md,
    backgroundColor: Palette.mintSoft,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  recordCard: {
    minHeight: 104,
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
  recordText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  recordTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: Palette.text,
  },
  recordMeta: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 3,
  },
  recordNames: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textSubtle,
    marginTop: 6,
  },
  usePill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primarySoft,
  },
  usePillText: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.primary,
  },
  empty: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  emptyTitle: {
    ...Typography.section,
    color: Palette.text,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyBody: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    backgroundColor: Palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.borderStrong,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: Palette.text,
  },
  sheetSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 3,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
  },
});
