import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PairCard, RiskSummaryCard } from '@/components/analysis-ui';
import { IconBadge, Screen, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { formatRecordTime, formatRecordTitle, getSession } from '@/services/history-storage';
import type { AnalysisSession, InteractionPair, ItemCategory, RecognizedItem } from '@/types/medication';

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
  const [attentionOpen, setAttentionOpen] = useState(true);
  const [safeOpen, setSafeOpen] = useState(false);
  const { lowVision } = useUserMode();

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

  const pillCount = record?.items.filter((item) => item.category === '알약').length ?? 0;
  const supplementCount = record?.items.filter((item) => item.category === '건강기능식품 라벨').length ?? 0;
  const items: RecognizedItem[] = useMemo(() => (record ? record.items.filter((it) => it.category === tab) : []), [record, tab]);
  const attentionPairs = record?.analysis?.pairs.filter((pair) => pair.level !== 'safe') ?? [];
  const safePairs = record?.analysis?.pairs.filter((pair) => pair.level === 'safe') ?? [];

  return (
    <Screen>
      <TopBar
        title={record ? formatRecordTitle(record.createdAt) : '기록'}
        subtitle={record ? formatRecordTime(record.createdAt) : undefined}
        backLabel="기록"
        onBack={() => router.back()}
      />

      {loading ? null : !record ? (
        <View style={styles.empty}>
          <IconBadge icon="document-outline" tone="dark" size="lg" />
          <Text style={styles.emptyText}>기록을 찾을 수 없어요</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, lowVision && styles.contentLowVision]} showsVerticalScrollIndicator={false}>
          <View style={[styles.summary, lowVision && styles.summaryLowVision]}>
            <CountBlock icon="medical" label="알약" value={pillCount} />
            <View style={styles.summaryDivider} />
            <CountBlock icon="leaf" label="건강기능식품" value={supplementCount} />
          </View>

          {record.analysis ? (
            <View style={styles.analysisBox}>
              <RiskSummaryCard result={record.analysis} compact />
              <PairAccordion
                title="주의할 조합"
                pairs={attentionPairs}
                open={attentionOpen}
                onToggle={() => setAttentionOpen((value) => !value)}
                tone="amber"
                lowVision={lowVision}
              />
              <PairAccordion
                title="미탐지 조합"
                pairs={safePairs}
                open={safeOpen}
                onToggle={() => setSafeOpen((value) => !value)}
                tone="green"
                lowVision={lowVision}
              />
            </View>
          ) : (
            <View style={styles.noAnalysis}>
              <IconBadge icon="analytics-outline" tone="dark" />
              <Text style={[styles.noAnalysisText, lowVision && styles.noAnalysisTextLowVision]}>분석 결과가 없어요</Text>
            </View>
          )}

          <View style={styles.segment}>
            {TABS.map((t) => {
              const active = tab === t.value;
              return (
                <Pressable
                  key={t.value}
                  style={[styles.segmentItem, lowVision && styles.segmentItemLowVision, active && styles.segmentItemActive]}
                  onPress={() => setTab(t.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}>
                  <Text style={[styles.segmentText, lowVision && styles.segmentTextLowVision, active && styles.segmentTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.itemList}>
            {items.length === 0 ? (
              <View style={styles.emptyItems}>
                <Text style={styles.emptyItemsText}>인식 기록 없음</Text>
              </View>
            ) : (
              items.map((item) => <ItemCard key={item.id} item={item} lowVision={lowVision} />)
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function CountBlock({ icon, label, value }: { icon: 'medical' | 'leaf'; label: string; value: number }) {
  return (
    <View style={styles.countBlock}>
      <IconBadge icon={icon} tone={icon === 'leaf' ? 'green' : 'blue'} size="sm" />
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function PairAccordion({
  title,
  pairs,
  open,
  onToggle,
  tone,
  lowVision,
}: {
  title: string;
  pairs: InteractionPair[];
  open: boolean;
  onToggle: () => void;
  tone: 'amber' | 'green';
  lowVision: boolean;
}) {
  const color = tone === 'amber' ? Palette.amber : Palette.mint;
  const bg = tone === 'amber' ? Palette.amberSoft : Palette.mintSoft;
  return (
    <View style={styles.accordion}>
      <Pressable style={styles.accordionHeader} onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={[styles.accordionIcon, { backgroundColor: bg }]}>
          <Ionicons name={tone === 'amber' ? 'warning' : 'checkmark-circle'} size={lowVision ? 21 : 18} color={color} />
        </View>
        <Text style={[styles.accordionTitle, lowVision && styles.accordionTitleLowVision]}>{title}</Text>
        <Text style={[styles.accordionCount, lowVision && styles.accordionCountLowVision]}>{pairs.length}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={lowVision ? 23 : 20} color={Palette.textSubtle} />
      </Pressable>
      {open ? (
        <View style={styles.accordionBody}>
          {pairs.length === 0 ? (
            <Text style={styles.emptyPairText}>해당 조합이 없어요</Text>
          ) : (
            pairs.map((pair) => <PairCard key={pair.id} pair={pair} compact />)
          )}
        </View>
      ) : null}
    </View>
  );
}

function ItemCard({ item, lowVision }: { item: RecognizedItem; lowVision: boolean }) {
  const isSupplement = item.category === '건강기능식품 라벨';
  return (
    <View style={[styles.card, lowVision && styles.cardLowVision]} accessible accessibilityLabel={`${item.name}`}>
      <IconBadge icon={isSupplement ? 'leaf' : 'medical'} tone={isSupplement ? 'green' : 'blue'} />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, lowVision && styles.cardNameLowVision]} numberOfLines={lowVision ? 2 : 1}>
          {item.name}
        </Text>
        {item.dosage ? <Text style={[styles.cardDose, lowVision && styles.cardDoseLowVision]}>{item.dosage}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 36,
    gap: 14,
  },
  contentLowVision: {
    gap: 15,
  },
  summary: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.subtle,
  },
  summaryLowVision: {
    minHeight: 128,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: Palette.border,
  },
  countBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countValue: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    color: Palette.text,
  },
  countLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  analysisBox: {
    gap: 10,
  },
  accordion: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    ...Shadow.subtle,
  },
  accordionHeader: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  accordionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: Palette.text,
  },
  accordionTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  accordionCount: {
    fontSize: 17,
    fontWeight: '900',
    color: Palette.text,
  },
  accordionCountLowVision: {
    fontSize: 21,
  },
  accordionBody: {
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
  },
  emptyPairText: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  noAnalysis: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
  },
  noAnalysisText: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.text,
  },
  noAnalysisTextLowVision: {
    fontSize: 22,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemLowVision: {
    minHeight: 54,
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
  segmentTextLowVision: {
    fontSize: 18,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: Palette.text,
  },
  itemList: {
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
  cardLowVision: {
    minHeight: 102,
    padding: 17,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cardName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: Palette.text,
  },
  cardNameLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  cardDose: {
    fontSize: 15,
    color: Palette.textMuted,
    marginTop: 4,
  },
  cardDoseLowVision: {
    fontSize: 18,
    lineHeight: 24,
  },
  emptyItems: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surface,
  },
  emptyItemsText: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.textMuted,
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
