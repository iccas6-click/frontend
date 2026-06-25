import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';
import { Brand } from '@/constants/theme';
import { sendCategory } from '@/services/category';
import type { ItemCategory } from '@/types/medication';

// 이 페이지(첫 화면)만 애플 건강 앱 느낌의 쿨 그레이 배경
const APPLE_GRAY = '#F2F2F7';

export default function HomeScreen() {
  const router = useRouter();

  // 선택한 분류를 백엔드로 전송하고 카메라로 이동
  const goCamera = (category: ItemCategory) => {
    // 전송은 화면 이동을 막지 않도록 백그라운드로 처리
    sendCategory(category).catch((e) => console.warn('분류 전송 실패:', e));
    router.push({ pathname: '/camera', params: { category } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* 상단 단계 표시줄 */}
      <StepIndicator current={1} background={APPLE_GRAY} />

      <View style={styles.content}>
        <Text style={styles.title}>무엇을 검색할까요?</Text>
        <Text style={styles.subtitle}>촬영할 항목의 종류를 선택해 주세요</Text>

        <CategoryCard
          accent="#D9694F"
          icon={
            <MaterialCommunityIcons name="pill" size={16} color="#D9694F" />
          }
          category="알약"
          body="처방약·일반 의약품을 촬영해 검색하기"
          onPress={() => goCamera('알약')}
        />

        <CategoryCard
          accent="#4E9D63"
          icon={<Ionicons name="leaf" size={15} color="#4E9D63" />}
          category="건강기능식품"
          body="영양제·건강기능식품 라벨을 촬영해 검색하기"
          onPress={() => goCamera('건강기능식품 라벨')}
        />
      </View>
    </SafeAreaView>
  );
}

function CategoryCard({
  accent,
  icon,
  category,
  body,
  onPress,
}: {
  accent: string;
  icon: ReactNode;
  category: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${category} 검색`}
    >
      {/* 컬러 미니 헤더 */}
      <View style={styles.cardHeader}>
        {icon}
        <Text style={[styles.cardCategory, { color: accent }]}>{category}</Text>
        <View style={styles.headerSpacer} />
        <Ionicons name="chevron-forward" size={18} color="#C5CBD0" />
      </View>

      {/* 본문 */}
      <Text style={styles.cardBody}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APPLE_GRAY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Brand.textDark,
  },
  subtitle: {
    fontSize: 15,
    color: Brand.textMuted,
    marginTop: 8,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardCategory: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerSpacer: {
    flex: 1,
  },
  cardBody: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.textDark,
    lineHeight: 24,
  },
});
