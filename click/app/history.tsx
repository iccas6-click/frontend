import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconBadge, Screen, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { formatRecordTime, formatRecordTitle, getAllScans } from '@/services/history-storage';
import type { RecognizedItem, ScanRecord } from '@/types/medication';

function summarize(items: RecognizedItem[]): string {
  const pill = items.filter((it) => it.category === '알약').length;
  const supp = items.filter((it) => it.category === '건강기능식품 라벨').length;
  const parts: string[] = [];
  if (pill) parts.push(`알약 ${pill}개`);
  if (supp) parts.push(`건강기능식품 ${supp}개`);
  return parts.length ? parts.join(' · ') : '항목 없음';
}

export default function HistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<ScanRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllScans().then((data) => {
        if (active) setRecords(data);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <Screen>
      <StatusBar style="dark" />
      <TopBar
        title="분석 기록"
        subtitle="확인했던 약과 건강기능식품 조합을 다시 열어볼 수 있어요."
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
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecordCard record={item} onPress={() => router.push({ pathname: '/record', params: { id: item.id } })} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

function RecordCard({ record, onPress }: { record: ScanRecord; onPress: () => void }) {
  const pill = record.items.some((item) => item.category === '알약');
  const supp = record.items.some((item) => item.category === '건강기능식품 라벨');
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <IconBadge icon={pill && supp ? 'layers' : pill ? 'medical' : 'leaf'} tone={pill && supp ? 'blue' : pill ? 'blue' : 'green'} />
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{formatRecordTitle(record.createdAt)}</Text>
        <Text style={styles.cardMeta}>
          {formatRecordTime(record.createdAt)} · {record.analysis ? '분석 완료' : '인식만 저장됨'}
        </Text>
        <Text style={styles.cardMeta}>
          {summarize(record.items)}
        </Text>
        <View style={styles.chipRow}>
          {pill ? <Chip label="알약" /> : null}
          {supp ? <Chip label="건강기능식품" /> : null}
          {record.analysis ? <Chip label="분석 결과 저장" /> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={19} color={Palette.textSubtle} />
    </Pressable>
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
  list: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 36,
    gap: 10,
  },
  card: {
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
  cardText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Palette.text,
  },
  cardMeta: {
    fontSize: 14,
    lineHeight: 20,
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
  empty: {
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
