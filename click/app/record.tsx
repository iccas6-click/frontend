import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { formatRecordTime, formatRecordTitle, getScan } from '@/services/history-storage';
import type { AnalysisResult, InteractionPair, ItemCategory, RecognizedItem, RiskLevel, ScanRecord } from '@/types/medication';

const TABS: { value: ItemCategory; label: string }[] = [
  { value: '알약', label: '알약' },
  { value: '건강기능식품 라벨', label: '건강기능식품' },
];

const LEVEL_META: Record<RiskLevel, { label: string; title: string; color: string; bg: string; icon: 'alert-circle' | 'warning' | 'checkmark-circle'; tone: 'red' | 'amber' | 'green' }> = {
  danger: {
    label: '위험',
    title: '전문가 상담이 필요해요',
    color: Palette.rose,
    bg: Palette.roseSoft,
    icon: 'alert-circle',
    tone: 'red',
  },
  caution: {
    label: '주의',
    title: '주의해서 확인해 주세요',
    color: Palette.amber,
    bg: Palette.amberSoft,
    icon: 'warning',
    tone: 'amber',
  },
  safe: {
    label: '미탐지',
    title: '중대한 주의사항 미탐지',
    color: Palette.mint,
    bg: Palette.mintSoft,
    icon: 'checkmark-circle',
    tone: 'green',
  },
};

export default function RecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ItemCategory>('알약');

  useEffect(() => {
    let active = true;
    getScan(id ?? '').then((data) => {
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

  return (
    <Screen
      bottom={
        record ? (
          <PrimaryButton
            label={record.analysis ? '이 목록으로 다시 분석' : '이 목록으로 분석하기'}
            icon="analytics"
            onPress={() => router.push({ pathname: '/analyze', params: { items: JSON.stringify(record.items), recordId: record.id } })}
          />
        ) : null
      }>
      <TopBar
        title={record ? formatRecordTitle(record.createdAt) : '기록'}
        subtitle={record ? formatRecordTime(record.createdAt) : '저장된 기록을 불러오고 있어요.'}
        backLabel="기록"
        onBack={() => router.back()}
      />

      {record ? (
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>저장된 항목</Text>
            <Text style={styles.summaryTitle}>{record.items.length}개</Text>
          </View>
          <IconBadge icon="archive" tone="dark" />
        </View>
      ) : null}

      {record?.analysis ? (
        <AnalysisSnapshot result={record.analysis} analyzedAt={record.analyzedAt} />
      ) : record ? (
        <View style={styles.noAnalysis}>
          <IconBadge icon="analytics-outline" tone="amber" />
          <View style={styles.noAnalysisText}>
            <Text style={styles.noAnalysisTitle}>아직 분석 전 기록이에요</Text>
            <Text style={styles.noAnalysisBody}>아래 버튼으로 이 목록의 상호작용을 분석할 수 있습니다.</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.segment}>
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <Pressable key={t.value} style={[styles.segmentItem, active && styles.segmentItemActive]} onPress={() => setTab(t.value)}>
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
    <View style={styles.card}>
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

function AnalysisSnapshot({ result, analyzedAt }: { result: AnalysisResult; analyzedAt?: string }) {
  const meta = LEVEL_META[result.overall];
  const topPairs = result.pairs.slice(0, 3);

  return (
    <View style={styles.analysisWrap}>
      <View style={styles.analysisCard}>
        <View style={[styles.analysisIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={28} color={meta.color} />
        </View>
        <View style={styles.analysisText}>
          <Text style={[styles.analysisTitle, { color: meta.color }]}>{meta.title}</Text>
          <Text style={styles.analysisBody}>{result.summary}</Text>
          {analyzedAt ? <Text style={styles.analysisTime}>분석 {formatRecordTime(analyzedAt)}</Text> : null}
        </View>
      </View>

      {topPairs.length > 0 ? (
        <View style={styles.pairList}>
          {topPairs.map((pair) => (
            <PairSnapshot key={pair.id} pair={pair} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PairSnapshot({ pair }: { pair: InteractionPair }) {
  const meta = LEVEL_META[pair.level];
  return (
    <View style={styles.pairCard}>
      <View style={[styles.levelBadge, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={14} color={meta.color} />
        <Text style={[styles.levelText, { color: meta.color }]}>{meta.label}</Text>
      </View>
      <Text style={styles.pairTitle}>{pair.items.join(' + ')}</Text>
      <Text style={styles.pairDesc}>{pair.description}</Text>
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
  analysisWrap: {
    marginHorizontal: Spacing.screen,
    marginBottom: 16,
    gap: 10,
  },
  analysisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  analysisIcon: {
    width: 58,
    height: 58,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisText: {
    flex: 1,
    marginLeft: 14,
  },
  analysisTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
  },
  analysisBody: {
    ...Typography.body,
    color: Palette.text,
    marginTop: 4,
  },
  analysisTime: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSubtle,
    marginTop: 7,
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
  pairList: {
    gap: 8,
  },
  pairCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    marginBottom: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '900',
  },
  pairTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: Palette.text,
  },
  pairDesc: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 5,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Palette.textMuted,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Palette.text,
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
    minHeight: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: Palette.surface,
    ...Shadow.subtle,
  },
  segmentText: {
    fontSize: 14,
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
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '900',
    color: Palette.text,
  },
  cardCategory: {
    fontSize: 14,
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
