import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { formatRecordTime, formatRecordTitle, getReusableScans } from '@/services/history-storage';
import type { ItemCategory, RecognizedItem, ScanRecord } from '@/types/medication';

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  알약: '알약',
  '건강기능식품 라벨': '건강기능식품',
};

export default function ReuseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; prevItems?: string; recordId?: string }>();
  const category: ItemCategory = params.category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';
  const [records, setRecords] = useState<ScanRecord[]>([]);

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
      getReusableScans(category).then((data) => {
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

  const selectRecord = (record: ScanRecord) => {
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
        title={`${label} 선택`}
        subtitle={`최근 인식 기록을 다시 쓰거나, 새 ${label} 사진을 촬영할 수 있어요.`}
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

        <Pressable style={({ pressed }) => [styles.captureCard, pressed && styles.pressed]} onPress={startCamera}>
          <IconBadge icon="camera" tone={isSupplement ? 'green' : 'blue'} />
          <View style={styles.captureText}>
            <Text style={styles.captureTitle}>새 {label} 촬영하기</Text>
            <Text style={styles.captureBody}>
              {isSupplement ? '라벨과 성분표를 다시 촬영합니다.' : '알약과 포장 정보를 다시 촬영합니다.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Palette.textSubtle} />
        </Pressable>

        <Text style={styles.sectionTitle}>최근 인식 기록</Text>
        {usableRecords.length === 0 ? (
          <View style={styles.empty}>
            <IconBadge icon="folder-open" tone="dark" size="lg" />
            <Text style={styles.emptyTitle}>아직 재사용할 {label} 기록이 없어요</Text>
            <Text style={styles.emptyBody}>이번에는 새로 촬영하면 다음부터 여기에서 바로 선택할 수 있습니다.</Text>
          </View>
        ) : (
          <View style={styles.recordList}>
            {usableRecords.map((record) => (
              <ReuseCard key={record.id} record={record} category={category} onPress={() => selectRecord(record)} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function ReuseCard({
  record,
  category,
  onPress,
}: {
  record: ScanRecord;
  category: ItemCategory;
  onPress: () => void;
}) {
  const items = record.items.filter((item) => item.category === category);
  const names = items.map((item) => item.name).slice(0, 3).join(', ');
  const isSupplement = category === '건강기능식품 라벨';

  return (
    <Pressable style={({ pressed }) => [styles.recordCard, pressed && styles.pressed]} onPress={onPress}>
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
  captureCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
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
    color: Palette.text,
  },
  captureBody: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: Palette.text,
    marginTop: 4,
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
    gap: 10,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
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
});
