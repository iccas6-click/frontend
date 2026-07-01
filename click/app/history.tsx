import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { deleteSessions, formatRecordDateTime, formatRecordMonth, formatRecordTime, getAllSessions } from '@/services/history-storage';
import type { AnalysisSession, RiskLevel } from '@/types/medication';

type HistorySection = {
  title: string;
  data: AnalysisSession[];
};

function hasAnalysis(record: AnalysisSession) {
  return Boolean(record.analysis) || record.status === 'analyzed';
}

function countByCategory(record: AnalysisSession) {
  return {
    pill: record.items.filter((it) => it.category === '알약').length,
    supplement: record.items.filter((it) => it.category === '건강기능식품 라벨').length,
  };
}

function itemNames(record: AnalysisSession) {
  const names = record.items.map((item) => item.name).filter(Boolean);
  return names.length ? names.slice(0, 4).join(', ') + (names.length > 4 ? ` 외 ${names.length - 4}개` : '') : '인식 항목 없음';
}

function riskLabel(level?: RiskLevel) {
  if (level === 'danger') return '위험';
  if (level === 'caution') return '주의';
  if (level === 'safe') return '미탐지';
  return '결과 없음';
}

function riskColors(level?: RiskLevel) {
  if (level === 'danger') return { color: Palette.rose, bg: Palette.roseSoft };
  if (level === 'caution') return { color: Palette.amber, bg: Palette.amberSoft };
  if (level === 'safe') return { color: Palette.mint, bg: Palette.mintSoft };
  return { color: Palette.blueGrey, bg: Palette.surfaceMuted };
}

function buildSections(records: AnalysisSession[]) {
  const sections: HistorySection[] = [];
  records.forEach((record) => {
    const title = formatRecordMonth(record.createdAt);
    const section = sections.find((item) => item.title === title);
    if (section) {
      section.data.push(record);
    } else {
      sections.push({ title, data: [record] });
    }
  });
  return sections;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<AnalysisSession[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { lowVision } = useUserMode();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllSessions().then((data) => {
        if (active) setRecords(data.filter(hasAnalysis));
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const sections = useMemo(() => buildSections(records), [records]);
  const selectedCount = selectedIds.length;
  const allSelected = records.length > 0 && records.every((record) => selectedIds.includes(record.id));

  const openRecord = (record: AnalysisSession) => {
    if (selecting) {
      toggleRecord(record.id);
      return;
    }
    router.push({ pathname: '/record', params: { id: record.id } });
  };

  const toggleSelecting = () => {
    setSelecting((current) => !current);
    setSelectedIds([]);
  };

  const toggleRecord = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : records.map((record) => record.id));
  };

  const confirmDelete = () => {
    if (selectedCount === 0) return;
    Alert.alert('기록 삭제', `${selectedCount}개의 분석 기록을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteSessions(selectedIds);
          const next = await getAllSessions();
          setRecords(next.filter(hasAnalysis));
          setSelectedIds([]);
          setSelecting(false);
        },
      },
    ]);
  };

  return (
    <Screen
      bottom={
        selecting ? (
          <View style={styles.deleteBar}>
            <Text style={styles.deleteSummary}>선택 {selectedCount}개</Text>
            <PrimaryButton label="선택 삭제" icon="trash" variant="danger" disabled={selectedCount === 0} onPress={confirmDelete} />
          </View>
        ) : undefined
      }>
      <StatusBar style="dark" />
      <TopBar
        title="분석 기록"
        backLabel="홈"
        onBack={() => router.back()}
        right={
          records.length > 0 ? (
            <Pressable style={[styles.selectButton, lowVision && styles.selectButtonLowVision]} onPress={toggleSelecting} accessibilityRole="button">
              <Text style={[styles.selectButtonText, lowVision && styles.selectButtonTextLowVision]}>{selecting ? '취소' : '선택'}</Text>
            </Pressable>
          ) : null
        }
      />

      {records.length === 0 ? (
        <View style={styles.empty}>
          <IconBadge icon="folder-open" tone="dark" size="lg" />
          <Text style={[styles.emptyTitle, lowVision && styles.emptyTitleLowVision]}>아직 분석 기록이 없어요</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          contentContainerStyle={[styles.content, selecting && styles.contentWithDeleteBar]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            selecting ? (
              <View style={styles.selectionRow}>
                <Text style={[styles.selectionText, lowVision && styles.selectionTextLowVision]}>삭제할 기록 선택</Text>
                <Pressable style={styles.selectAllButton} onPress={toggleAll} accessibilityRole="button">
                  <Text style={styles.selectAllText}>{allSelected ? '해제' : '전체'}</Text>
                </Pressable>
              </View>
            ) : null
          }
          renderSectionHeader={({ section }) => <MonthHeader title={section.title} lowVision={lowVision} />}
          renderItem={({ item, index }) => (
            <RecordCard
              record={item}
              first={index === 0}
              selecting={selecting}
              selected={selectedIds.includes(item.id)}
              lowVision={lowVision}
              onPress={() => openRecord(item)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function MonthHeader({ title, lowVision }: { title: string; lowVision: boolean }) {
  return (
    <View style={styles.monthHeader}>
      <Text style={[styles.monthTitle, lowVision && styles.monthTitleLowVision]}>{title}</Text>
    </View>
  );
}

function RecordCard({
  record,
  first,
  selecting,
  selected,
  lowVision,
  onPress,
}: {
  record: AnalysisSession;
  first: boolean;
  selecting: boolean;
  selected: boolean;
  lowVision: boolean;
  onPress: () => void;
}) {
  const counts = countByCategory(record);
  const colors = riskColors(record.analysis?.overall);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, lowVision && styles.cardLowVision, first && styles.cardFirst, selected && styles.cardSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={selecting ? { selected } : undefined}
      accessibilityLabel={`${formatRecordDateTime(record.createdAt)}, ${riskLabel(record.analysis?.overall)}`}>
      {selecting ? (
        <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
          {selected ? <Ionicons name="checkmark" size={17} color="#FFFFFF" /> : null}
        </View>
      ) : null}
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: colors.color }]} />
        <View style={styles.timelineLine} />
      </View>
      <View style={styles.cardText}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, lowVision && styles.cardTitleLowVision]}>{formatRecordTime(record.createdAt)}</Text>
          <RiskChip level={record.analysis?.overall} />
        </View>
        <View style={styles.countRow}>
          <CountPill icon="medical" label={`알약 ${counts.pill}`} />
          <CountPill icon="leaf" label={`건강기능식품 ${counts.supplement}`} />
        </View>
        <Text style={[styles.cardNames, lowVision && styles.cardNamesLowVision]} numberOfLines={lowVision ? 2 : 1}>
          {itemNames(record)}
        </Text>
      </View>
      {selecting ? null : <Ionicons name="chevron-forward" size={lowVision ? 22 : 19} color={Palette.textSubtle} />}
    </Pressable>
  );
}

function RiskChip({ level }: { level?: RiskLevel }) {
  const colors = riskColors(level);
  return (
    <View style={[styles.riskChip, { backgroundColor: colors.bg }]}>
      <Text style={[styles.riskChipText, { color: colors.color }]}>{riskLabel(level)}</Text>
    </View>
  );
}

function CountPill({ icon, label }: { icon: 'medical' | 'leaf'; label: string }) {
  return (
    <View style={styles.countPill}>
      <Ionicons name={icon} size={14} color={Palette.textMuted} />
      <Text style={styles.countText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 36,
    gap: 10,
  },
  contentWithDeleteBar: {
    paddingBottom: 120,
  },
  selectionRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionText: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  selectionTextLowVision: {
    fontSize: 18,
  },
  selectAllButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  selectAllText: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '900',
  },
  monthHeader: {
    backgroundColor: Palette.background,
    paddingTop: 4,
    paddingBottom: 10,
  },
  monthTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
    color: Palette.text,
  },
  monthTitleLowVision: {
    fontSize: 25,
    lineHeight: 32,
  },
  card: {
    minHeight: 124,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    marginBottom: 10,
    ...Shadow.subtle,
  },
  cardFirst: {
    borderColor: Palette.primarySoft,
  },
  cardLowVision: {
    minHeight: 140,
    padding: 17,
  },
  cardSelected: {
    borderColor: Palette.rose,
    backgroundColor: Palette.roseSoft,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.borderStrong,
    marginRight: 12,
    backgroundColor: Palette.surface,
  },
  checkCircleSelected: {
    borderColor: Palette.rose,
    backgroundColor: Palette.rose,
  },
  timelineRail: {
    width: 18,
    height: 76,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 6,
    backgroundColor: Palette.border,
  },
  cardText: {
    flex: 1,
    marginRight: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: Palette.text,
  },
  cardTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  riskChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  riskChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  countPill: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceMuted,
  },
  countText: {
    fontSize: 12,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  cardNames: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textSubtle,
    marginTop: 6,
  },
  cardNamesLowVision: {
    fontSize: 16,
    lineHeight: 22,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  emptyTitleLowVision: {
    fontSize: 22,
  },
  selectButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  selectButtonLowVision: {
    minHeight: 42,
    paddingHorizontal: 14,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.primary,
  },
  selectButtonTextLowVision: {
    fontSize: 18,
  },
  deleteBar: {
    gap: 10,
    paddingBottom: 8,
  },
  deleteSummary: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
