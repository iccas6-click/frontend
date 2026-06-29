import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const APPLE_THEME = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  tintBlue: '#007AFF',
};

interface HistoryItemType { id: string; title: string; date: string; type: string; }
const MOCK_HISTORY: HistoryItemType[] = [
  { id: '1', title: '종합 감기약 처방전', date: '2023.10.27', type: '약 봉투' },
  { id: '2', title: '종근당 락토핏 생유산균', date: '2023.10.25', type: '영양제' },
  { id: '3', title: '타이레놀정 500mg', date: '2023.10.20', type: '약 봉투' },
];
const getTypeStyle = (type: string) => {
  if (type === '영양제') return { icon: 'leaf', color: '#34C759', bg: '#E9F9EE' };
  return { icon: 'medkit', color: '#FF9500', bg: '#FFF4E5' };
};

export default function HistoryScreen() {
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryItemType[]>([]);

  useEffect(() => { setHistoryData(MOCK_HISTORY); }, []);

  const renderHistoryItem = ({ item }: { item: HistoryItemType }) => {
    const styleInfo = getTypeStyle(item.type);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}>
        <View style={styles.cardContent}>
          <View style={[styles.iconBox, { backgroundColor: styleInfo.bg }]}><Ionicons name={styleInfo.icon as any} size={22} color={styleInfo.color} /></View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.date} • {item.type}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* 💡 뒤로가기 복구 */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={APPLE_THEME.tintBlue} />
          <Text style={styles.backText}>뒤로</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>지난 기록</Text>

      {historyData.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={56} color="#D1D1D6" />
          <Text style={styles.emptyText}>아직 저장된 기록이 없어요</Text>
        </View>
      ) : (
        <FlatList data={historyData} keyExtractor={(item) => item.id} renderItem={renderHistoryItem} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APPLE_THEME.background },
  headerRow: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 4 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { fontSize: 17, color: APPLE_THEME.tintBlue, marginLeft: -2 },
  title: { fontSize: 34, fontWeight: '800', color: APPLE_THEME.textDark, paddingHorizontal: 20, marginTop: 8, marginBottom: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 100 },
  emptyText: { fontSize: 16, color: APPLE_THEME.textMuted },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: APPLE_THEME.card, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  textContainer: { flex: 1, justifyContent: 'center', paddingRight: 12 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: APPLE_THEME.textDark, marginBottom: 4, letterSpacing: -0.4 },
  cardSubtitle: { fontSize: 14, color: APPLE_THEME.textMuted },
});