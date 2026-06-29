import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepIndicator } from '@/components/step-indicator';
import { sendCategory } from '@/services/category';
import type { ItemCategory } from '@/types/medication';

const APPLE_THEME = { background: '#F2F2F7', card: '#FFFFFF', textDark: '#1C1C1E', textMuted: '#8E8E93', tintBlue: '#007AFF' };

export default function SelectScreen() {
  const router = useRouter();
  const goCamera = (category: ItemCategory) => {
    sendCategory(category).catch((e) => console.warn(e));
    router.push({ pathname: '/camera', params: { category } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={APPLE_THEME.tintBlue} />
          <Text style={styles.backText}>뒤로</Text>
        </Pressable>
      </View>
      <StepIndicator current={1} background={APPLE_THEME.background} />
      <View style={styles.content}>
        <Text style={styles.title}>무엇을 검색할까요?</Text>
        <Text style={styles.subtitle}>촬영할 항목의 종류를 선택해 주세요</Text>
        <View style={styles.listContainer}>
          <SelectionCard 
            title="알약" 
            subtitle="처방받은 약이나 일반 의약품" 
            icon={<MaterialCommunityIcons name="pill" size={28} color="#FF2D55" />} 
            iconBg="#FFE5EA" 
            onPress={() => goCamera('알약')} 
          />
          <SelectionCard 
            title="건강기능식품" 
            subtitle="비타민, 유산균 등 영양제 라벨" 
            icon={<Ionicons name="leaf" size={26} color="#34C759" />} 
            iconBg="#E9F9EE" 
            onPress={() => goCamera('건강기능식품 라벨')} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function SelectionCard({ title, subtitle, icon, iconBg, onPress }: any) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APPLE_THEME.background },
  headerRow: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 4 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { fontSize: 17, color: APPLE_THEME.tintBlue, marginLeft: -2 },
  content: { flex: 1 },
  title: { fontSize: 32, fontWeight: '800', color: APPLE_THEME.textDark, paddingHorizontal: 20, marginTop: 16 },
  subtitle: { fontSize: 15, color: APPLE_THEME.textMuted, paddingHorizontal: 20, marginTop: 8, marginBottom: 24 },
  listContainer: { paddingHorizontal: 20, gap: 12 },
  card: { backgroundColor: APPLE_THEME.card, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  textContainer: { flex: 1, justifyContent: 'center', paddingRight: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: APPLE_THEME.textDark, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: APPLE_THEME.textMuted },
});