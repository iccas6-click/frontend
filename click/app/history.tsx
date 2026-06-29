import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatRecordTime, formatRecordTitle, getAllScans } from '@/services/history-storage';
import type { RecognizedItem, ScanRecord } from '@/types/medication';

const APPLE_THEME = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  tintBlue: '#007AFF',
};

/** 항목들의 분류별 개수 요약 (예: "알약 2개 · 건강기능식품 1개") */
function summarize(items: RecognizedItem[]): string {
  const pill = items.filter((it) => it.category === '알약').length;
  const supp = items.filter((it) => it.category === '건강기능식품 라벨').length;
  const parts: string[] = [];
  if (pill) parts.push(`알약 ${pill}개`);
  if (supp) parts.push(`건강기능식품 ${supp}개`);
  return parts.length ? parts.join(' · ') : '항목 없음';
}

/** 분류별 아이콘/색상 */
function categoryStyle(record: ScanRecord) {
  if (record.category === '알약') {
    return {
      label: '알약',
      bg: '#FFE5EA',
      icon: <MaterialCommunityIcons name="pill" size={22} color="#FF2D55" />,
    };
  }
  return {
    label: '건강기능식품',
    bg: '#E9F9EE',
    icon: <Ionicons name="leaf" size={20} color="#34C759" />,
  };
}

export default function HistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<ScanRecord[]>([]);

  // 화면에 들어올 때마다 최신 기록을 다시 로드
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

  const renderItem = ({ item }: { item: ScanRecord }) => {
    const cat = categoryStyle(item);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/record', params: { id: item.id } })}>
        <View style={styles.cardContent}>
          <View style={[styles.iconBox, { backgroundColor: cat.bg }]}>{cat.icon}</View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {formatRecordTitle(item.createdAt)}
            </Text>
            <Text style={styles.cardSubtitle}>
              {formatRecordTime(item.createdAt)} · {summarize(item.items)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={24} color={APPLE_THEME.tintBlue} />
          <Text style={styles.backText}>홈</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>지난 기록</Text>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={56} color="#D1D1D6" />
          <Text style={styles.emptyText}>아직 저장된 기록이 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  headerRow: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: APPLE_THEME.tintBlue,
    marginLeft: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: APPLE_THEME.textDark,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    color: APPLE_THEME.textMuted,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: APPLE_THEME.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: APPLE_THEME.textDark,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: APPLE_THEME.textMuted,
  },
});
