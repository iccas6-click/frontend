import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { deleteSessions, formatRecordDateTime, formatRecordMonth, getAllSessions } from '@/services/history-storage';
import type { AnalysisSession, RiskLevel } from '@/types/medication';

type ViewMode = 'list' | 'calendar';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

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

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function recordDayKey(record: AnalysisSession) {
  return dayKey(new Date(record.createdAt));
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

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<AnalysisSession[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState(monthStart(new Date()));
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { lowVision } = useUserMode();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllSessions().then((data) => {
        if (!active) return;
        setRecords(data);
        if (data[0]) setCalendarMonth(monthStart(new Date(data[0].createdAt)));
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const groupedRecords = useMemo(() => {
    const groups: { title: string; records: AnalysisSession[] }[] = [];
    records.forEach((record) => {
      const title = formatRecordMonth(record.createdAt);
      const existing = groups.find((group) => group.title === title);
      if (existing) {
        existing.records.push(record);
      } else {
        groups.push({ title, records: [record] });
      }
    });
    return groups;
  }, [records]);

  const monthRecords = useMemo(
    () => records.filter((record) => monthKey(new Date(record.createdAt)) === monthKey(calendarMonth)),
    [calendarMonth, records],
  );

  const selectedCount = selectedIds.length;
  const visibleRecords = viewMode === 'calendar' ? monthRecords : records;
  const allSelected = visibleRecords.length > 0 && visibleRecords.every((record) => selectedIds.includes(record.id));

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
    setSelectedIds(allSelected ? [] : visibleRecords.map((record) => record.id));
  };

  const confirmDelete = () => {
    if (selectedCount === 0) return;
    Alert.alert('기록 삭제', `${selectedCount}개의 기록을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteSessions(selectedIds);
          const next = await getAllSessions();
          setRecords(next);
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
        title="기록"
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
          <Text style={[styles.emptyTitle, lowVision && styles.emptyTitleLowVision]}>아직 기록이 없어요</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, selecting && styles.contentWithDeleteBar]} showsVerticalScrollIndicator={false}>
          <View style={styles.viewSwitch}>
            <SwitchButton label="리스트" active={viewMode === 'list'} onPress={() => setViewMode('list')} />
            <SwitchButton label="달력" active={viewMode === 'calendar'} onPress={() => setViewMode('calendar')} />
          </View>

          {selecting ? (
            <View style={styles.selectionRow}>
              <Text style={[styles.selectionText, lowVision && styles.selectionTextLowVision]}>삭제할 기록 선택</Text>
              <Pressable style={styles.selectAllButton} onPress={toggleAll} accessibilityRole="button">
                <Text style={styles.selectAllText}>{allSelected ? '해제' : '전체'}</Text>
              </Pressable>
            </View>
          ) : null}

          {viewMode === 'calendar' ? (
            <CalendarView
              month={calendarMonth}
              records={monthRecords}
              allRecords={records}
              lowVision={lowVision}
              onMonthChange={setCalendarMonth}
              onRecordPress={openRecord}
              selecting={selecting}
              selectedIds={selectedIds}
            />
          ) : (
            groupedRecords.map((group) => (
              <View key={group.title} style={styles.monthGroup}>
                <Text style={[styles.monthTitle, lowVision && styles.monthTitleLowVision]}>{group.title}</Text>
                <View style={styles.groupList}>
                  {group.records.map((record, index) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      first={index === 0}
                      selecting={selecting}
                      selected={selectedIds.includes(record.id)}
                      lowVision={lowVision}
                      onPress={() => openRecord(record)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function SwitchButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.switchButton, active && styles.switchButtonActive]} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.switchText, active && styles.switchTextActive]}>{label}</Text>
    </Pressable>
  );
}

function CalendarView({
  month,
  records,
  allRecords,
  lowVision,
  onMonthChange,
  onRecordPress,
  selecting,
  selectedIds,
}: {
  month: Date;
  records: AnalysisSession[];
  allRecords: AnalysisSession[];
  lowVision: boolean;
  onMonthChange: (date: Date) => void;
  onRecordPress: (record: AnalysisSession) => void;
  selecting: boolean;
  selectedIds: string[];
}) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const cells: (Date | null)[] = Array.from({ length: firstDay.getDay() }, () => null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const recordsByDay = records.reduce<Record<string, AnalysisSession[]>>((acc, record) => {
    const key = recordDayKey(record);
    acc[key] = acc[key] ? [...acc[key], record] : [record];
    return acc;
  }, {});

  const changeMonth = (offset: number) => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  };

  return (
    <View style={styles.calendarWrap}>
      <View style={styles.calendarHeader}>
        <Pressable style={styles.monthButton} onPress={() => changeMonth(-1)} accessibilityRole="button" accessibilityLabel="이전 달">
          <Ionicons name="chevron-back" size={20} color={Palette.text} />
        </Pressable>
        <Text style={[styles.calendarTitle, lowVision && styles.calendarTitleLowVision]}>{formatRecordMonth(month.toISOString())}</Text>
        <Pressable style={styles.monthButton} onPress={() => changeMonth(1)} accessibilityRole="button" accessibilityLabel="다음 달">
          <Ionicons name="chevron-forward" size={20} color={Palette.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekText}>{day}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {cells.map((date, index) => {
          const dayRecords = date ? recordsByDay[dayKey(date)] ?? [] : [];
          return (
            <View key={date ? dayKey(date) : `blank-${index}`} style={[styles.dayCell, !date && styles.dayCellBlank]}>
              {date ? (
                <>
                  <Text style={[styles.dayNumber, dayRecords.length > 0 && styles.dayNumberActive]}>{date.getDate()}</Text>
                  {dayRecords.length > 0 ? <Text style={styles.dayCount}>{dayRecords.length}</Text> : null}
                </>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.groupList}>
        {records.length === 0 ? (
          <View style={styles.monthEmpty}>
            <Text style={styles.monthEmptyText}>이 달 기록 없음</Text>
          </View>
        ) : (
          records.map((record, index) => (
            <RecordCard
              key={record.id}
              record={record}
              first={index === 0 && allRecords[0]?.id === record.id}
              selecting={selecting}
              selected={selectedIds.includes(record.id)}
              lowVision={lowVision}
              onPress={() => onRecordPress(record)}
            />
          ))
        )}
      </View>
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
          <Text style={[styles.cardTitle, lowVision && styles.cardTitleLowVision]}>{formatRecordDateTime(record.createdAt)}</Text>
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
    gap: 14,
  },
  contentWithDeleteBar: {
    paddingBottom: 120,
  },
  viewSwitch: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    padding: 3,
  },
  switchButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  switchButtonActive: {
    backgroundColor: Palette.surface,
    ...Shadow.subtle,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  switchTextActive: {
    color: Palette.text,
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
  monthGroup: {
    gap: 10,
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
  groupList: {
    gap: 10,
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
  calendarWrap: {
    gap: 14,
  },
  calendarHeader: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 10,
    ...Shadow.subtle,
  },
  monthButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: Palette.text,
  },
  calendarTitleLowVision: {
    fontSize: 24,
    lineHeight: 31,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  weekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellBlank: {
    opacity: 0,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  dayNumberActive: {
    color: Palette.text,
  },
  dayCount: {
    marginTop: 2,
    minWidth: 18,
    textAlign: 'center',
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: Palette.primarySoft,
    color: Palette.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  monthEmpty: {
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surface,
  },
  monthEmptyText: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  selectButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primarySoft,
  },
  selectButtonLowVision: {
    minHeight: 42,
    paddingHorizontal: 14,
  },
  selectButtonText: {
    color: Palette.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  selectButtonTextLowVision: {
    fontSize: 17,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    color: Palette.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyTitleLowVision: {
    fontSize: 23,
    lineHeight: 30,
  },
  deleteBar: {
    gap: 10,
  },
  deleteSummary: {
    color: Palette.textMuted,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
