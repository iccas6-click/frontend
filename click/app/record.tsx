import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PairList, RiskSummaryCard } from '@/components/analysis-ui';
import { IconBadge, PrimaryButton, Screen, SectionHeader, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { formatRecordTime, formatRecordTitle, getSession } from '@/services/history-storage';
import type { AnalysisSession, ItemCategory, RecognizedItem } from '@/types/medication';

const TABS: { value: ItemCategory; label: string }[] = [
  { value: '알약', label: '알약' },
  { value: '건강기능식품 라벨', label: '건강기능식품' },
];

export default function RecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [record, setRecord] = useState<AnalysisSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ItemCategory>('알약');

  useEffect(() => {
    let active = true;
    getSession(id ?? '').then((data) => {
      if (!active) return;
      setRecord(data);
      setLoading(false);
      if (data) {
        const hasPill = data.items.some((it) => it.category === '알약');
        setTab(hasPill ? '알약' : '건강기능식품 라벨');
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  const items: RecognizedItem[] = record ? record.items.filter((it) => it.category === tab) : [];
  const pillCount = record?.items.filter((item) => item.category === '알약').length ?? 0;
  const supplementCount = record?.items.filter((item) => item.category === '건강기능식품 라벨').length ?? 0;

  return (
    <Screen
      bottom={
        record ? (
          <PrimaryButton
            label={record.analysis ? '이 목록으로 다시 분석' : '이 목록으로 분석하기'}
            icon="analytics"
            onPress={() => router.push({ pathname: '/analyze', params: { items: JSON.stringify(record.items), recordId: record.id } })}
            accessibilityHint="저장된 항목을 그대로 사용해 상호작용 분석을 시작합니다."
          />
        ) : null
      }>
      <TopBar
        title={record ? formatRecordTitle(record.createdAt) : '기록'}
        subtitle={record ? `${formatRecordTime(record.createdAt)} · ${record.analysis ? '분석 완료' : '분석 전'}` : '저장된 기록을 불러오고 있어요.'}
        backLabel="기록"
        onBack={() => router.back()}
      />

      {record ? (
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>저장된 항목</Text>
            <Text style={styles.summaryTitle}>알약 {pillCount}개 · 건강기능식품 {supplementCount}개</Text>
          </View>
          <IconBadge icon={record.analysis ? 'checkmark-circle' : 'archive'} tone={record.analysis ? 'green' : 'dark'} />
        </View>
      ) : null}

      {record?.analysis ? (
        <View style={styles.analysisWrap}>
          <SectionHeader title="저장된 분석 결과" />
          <View style={styles.sectionInset}>
            <RiskSummaryCard result={record.analysis} compact />
            <PairList pairs={record.analysis.pairs} limit={3} />
          </View>
        </View>
      ) : record ? (
        <View style={styles.noAnalysis}>
          <IconBadge icon="analytics-outline" tone="amber" />
          <View style={styles.noAnalysisText}>
            <Text style={styles.noAnalysisTitle}>아직 분석 전 기록이에요</Text>
            <Text style={styles.noAnalysisBody}>아래 버튼으로 이 목록의 상호작용을 분석할 수 있습니다.</Text>
          </View>
        </View>
      ) : null}

      <SectionHeader title="저장된 항목" />
      <View style={styles.segment}>
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <Pressable
              key={t.value}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => setTab(t.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${t.label} 항목 보기`}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? null : items.length === 0 ? (
        <View style={styles.empty}>
          <IconBadge icon="document-outline" tone="dark" size="lg" />
          <Text style={styles.emptyText}>이 종류의 인식 기록이 없어요</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

function ItemCard({ item }: { item: RecognizedItem }) {
  const isSupplement = item.category === '건강기능식품 라벨';
  return (
    <View style={styles.card} accessible accessibilityLabel={`${item.name}, ${isSupplement ? '건강기능식품' : '알약'}${item.dosage ? `, ${item.dosage}` : ''}`}>
      <IconBadge icon={isSupplement ? 'leaf' : 'medical'} tone={isSupplement ? 'green' : 'blue'} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardCategory}>
          {isSupplement ? '건강기능식품' : '알약'}
          {item.dosage ? ` · ${item.dosage}` : ''}
        </Text>
      </View>
      <Ionicons name="checkmark-circle" size={20} color={Palette.mint} />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginHorizontal: Spacing.screen,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
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
    marginTop: 3,
  },
  analysisWrap: {
    marginBottom: 16,
  },
  sectionInset: {
    marginHorizontal: Spacing.screen,
    gap: 10,
  },
  noAnalysis: {
    marginHorizontal: Spacing.screen,
    marginBottom: 16,
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
  },
  noAnalysisText: {
    flex: 1,
    marginLeft: 14,
  },
  noAnalysisTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.text,
  },
  noAnalysisBody: {
    ...Typography.body,
    color: Palette.textMuted,
    marginTop: 3,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    padding: 3,
    marginHorizontal: Spacing.screen,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: Palette.surface,
    ...Shadow.subtle,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textMuted,
  },
  segmentTextActive: {
    color: Palette.text,
  },
  list: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },
  cardName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: Palette.text,
  },
  cardCategory: {
    fontSize: 15,
    color: Palette.textMuted,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingBottom: 80,
  },
  emptyText: {
    ...Typography.body,
    color: Palette.textMuted,
  },
});
