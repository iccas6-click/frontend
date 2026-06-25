import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';

// 애플 건강 앱 느낌의 쿨 그레이 배경
const APPLE_GRAY = '#F2F2F7';

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Brand.textDark} />
          <Text style={styles.backText}>뒤로</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>지난 검색 기록</Text>

      {/* TODO: 실제 기록 목록 구현 */}
      <View style={styles.empty}>
        <Ionicons name="time-outline" size={48} color="#C5CBD0" />
        <Text style={styles.emptyText}>아직 준비 중인 기능이에요</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APPLE_GRAY,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: Brand.textDark,
    marginLeft: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Brand.textDark,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Brand.textMuted,
  },
});
