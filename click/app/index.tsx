import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const APPLE_THEME = { background: '#F2F2F7', card: '#FFFFFF', textDark: '#1C1C1E', textMuted: '#8E8E93', primary: '#FF2D55', secondary: '#007AFF' };

export default function MainScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}><Text style={styles.headerTitle}>CLICK</Text></View>
        <View style={styles.listContainer}>
          {/* 1. 사진 검색 (바로 알약 카메라로 이동) */}
          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/camera', params: { category: '알약' } })}>
            <View style={[styles.iconBox, { backgroundColor: '#FFE5EA' }]}><Ionicons name="camera" size={28} color={APPLE_THEME.primary} /></View>
            <View style={styles.textContainer}><Text style={styles.cardTitle}>사진으로 검색하기</Text><Text style={styles.cardSubtitle}>알약 촬영을 시작하세요</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </Pressable>

          {/* 2. 지난 기록 보기 (기존 버튼 유지) */}
          <Pressable style={styles.card} onPress={() => router.push('/history')}>
            <View style={[styles.iconBox, { backgroundColor: '#E5F1FF' }]}><Ionicons name="time" size={28} color={APPLE_THEME.secondary} /></View>
            <View style={styles.textContainer}><Text style={styles.cardTitle}>지난 검색 기록 보기</Text><Text style={styles.cardSubtitle}>이전 분석 결과를 확인하세요</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APPLE_THEME.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 32 },
  header: { marginBottom: 32 },
  headerTitle: { fontSize: 40, fontWeight: '900', color: APPLE_THEME.textDark },
  listContainer: { gap: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: APPLE_THEME.card, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  iconBox: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 19, fontWeight: '700' },
  cardSubtitle: { fontSize: 14, color: APPLE_THEME.textMuted },
});