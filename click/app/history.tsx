import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconBadge, Screen, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { formatRecordTime, formatRecordTitle, getAllSessions } from '@/services/history-storage';
import type { AnalysisSession, RecognizedItem, SessionStatus } from '@/types/medication';

type HistoryFilter = 'all' | 'analyzed' | 'ready';

const FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'analyzed', label: '분석 완료' },
  { value: 'ready', label: '분석 전' },
];

function summarize(items: RecognizedItem[]): string {
  const pill = items.filter((it) => it.category === '알약').length;
  const supp = items.filter((it) => it.category === '건강기능식품 라벨').length;
  const parts: string[] = [];
  if (pill) parts.push(`알약 ${pill}개`);
  if (supp) parts.push(`건강기능식품 ${supp}개`);
  return parts.length ? parts.join(' · ') : '항목 없음';
}

function getStatusLabel(status: SessionStatus) {
  return status === 'analyzed' ? '분석 완료' : '분석 전';
}

export default function HistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<AnalysisSession[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>('all');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllSessions().then((data) => {
        if (active) setRecords(data);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const filteredRecords = useMemo(() => {
    if (filter === 'all') return records;
    if (filter === 'analyzed') return records.filter((record) => record.status === 'analyzed');
    return records.filter((record) => record.status !== 'analyzed');
  }, [filter, records]);

  return (
    <Screen>
      <StatusBar style="dark" />
      <TopBar
        title="기록"
        subtitle="인식한 약과 건강기능식품 조합, 저장된 분석 결과를 다시 열어볼 수 있어요."
        backLabel="홈"
        onBack={() => router.back()}
      />

      {records.length === 0 ? (
        <View style={styles.empty}>
          <IconBadge icon="folder-open" tone="dark" size="lg" />
          <Text style={styles.emptyTitle}>아직 저장된 기록이 없어요</Text>
          <Text style={styles.emptyBody}>인식을 완료하면 같은 약을 다시 입력하지 않도록 기록이 쌓입니다.</Text>
        </View>
      ) : (
        <>
          <View style={styles.filterRow}>
            {FILTERS.map((item) => {
              const active = filter === item.value;
              return (
                <Pressable
                  key={item.value}
                  style={[styles.filterItem, active && styles.filterItemActive]}
                  onPress={() => setFilter(item.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${item.label} 기록 보기`}>
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {filteredRecords.length === 0 ? (
            <View style={styles.filteredEmpty}>
              <IconBadge icon="search" tone="dark" size="lg" />
              <Text style={styles.emptyTitle}>해당 기록이 없어요</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecords}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecordCard record={item} onPress={() => router.push({ pathname: '/record', params: { id: item.id } })} />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </Screen>
  );
}

function RecordCard({ record, onPress }: { record: AnalysisSession; onPress: () => void }) {
  const pill = record.items.some((item) => item.category === '알약');
  const supp = record.items.some((item) => item.category === '건강기능식품 라벨');
  const analyzed = record.status === 'analyzed';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${formatRecordTitle(record.createdAt)}, ${formatRecordTime(record.createdAt)}, ${getStatusLabel(record.status)}, ${summarize(record.items)}`}>
      <IconBadge icon={pill && supp ? 'layers' : pill ? 'medical' : 'leaf'} tone={analyzed ? 'green' : pill ? 'blue' : 'green'} />
      <View style={styles.cardText}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{formatRecordTitle(record.createdAt)}</Text>
          <StatusChip label={getStatusLabel(record.status)} active={analyzed} />
        </View>
        <Text style={styles.cardMeta}>
          {formatRecordTime(record.createdAt)} · {summarize(record.items)}
        </Text>
        <View style={styles.chipRow}>
          {pill ? <Chip label="알약" /> : null}
          {supp ? <Chip label="건강기능식품" /> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={19} color={Palette.textSubtle} />
    </Pressable>
  );
}

function StatusChip({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.statusChip, active ? styles.statusChipDone : styles.statusChipDraft]}>
      <Text style={[styles.statusChipText, active ? styles.statusChipTextDone : styles.statusChipTextDraft]}>{label}</Text>
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    padding: 3,
    marginHorizontal: Spacing.screen,
    marginBottom: 16,
  },
  filterItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterItemActive: {
    backgroundColor: Palette.surface,
    ...Shadow.subtle,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textMuted,
  },
  filterTextActive: {
    color: Palette.text,
  },
  list: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 36,
    gap: 10,
  },
  card: {
    minHeight: 112,
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
  cardText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  cardTitleRow: {
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
  cardMeta: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceMuted,
  },
  chipText: {
    ...Typography.caption,
    color: Palette.textMuted,
  },
  statusChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  statusChipDone: {
    backgroundColor: Palette.mintSoft,
  },
  statusChipDraft: {
    backgroundColor: Palette.amberSoft,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  statusChipTextDone: {
    color: Palette.mint,
  },
  statusChipTextDraft: {
    color: Palette.amber,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 80,
  },
  filteredEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 80,
  },
  emptyTitle: {
    ...Typography.section,
    color: Palette.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyBody: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
