import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/step-indicator';
import { sendCategory } from '@/services/category';
import type { ItemCategory } from '@/types/medication';

// 💡 애플 건강 앱 스타일 테마 컬러 
const APPLE_THEME = {
  background: '#F2F2F7', // 눈이 편안한 쿨 그레이 배경
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
};

export default function SelectScreen() {
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
      <StepIndicator current={1} background={APPLE_THEME.background} />

      <View style={styles.content}>
        <Text style={styles.title}>무엇을 검색할까요?</Text>
        <Text style={styles.subtitle}>촬영할 항목의 종류를 선택해 주세요</Text>

        <View style={styles.listContainer}>
          {/* 알약 선택 카드 */}
          <SelectionCard
            title="알약"
            subtitle="처방받은 약이나 일반 의약품"
            icon={<MaterialCommunityIcons name="pill" size={28} color="#FF2D55" />} // 애플 스타일 핑크레드
            iconBg="#FFE5EA"
            onPress={() => goCamera('알약')}
          />
          
          {/* 건강기능식품 선택 카드 */}
          <SelectionCard
            title="건강기능식품"
            subtitle="비타민, 유산균 등 영양제 라벨"
            icon={<Ionicons name="leaf" size={26} color="#34C759" />} // 애플 스타일 그린
            iconBg="#E9F9EE"
            onPress={() => goCamera('건강기능식품 라벨')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// 💡 새로운 카드 컴포넌트 (history.tsx의 카드와 동일한 스타일)
function SelectionCard({
  title,
  subtitle,
  icon,
  iconBg,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title} 검색`}
    >
      <View style={styles.cardContent}>
        {/* 좌측 컬러 아이콘 */}
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        
        {/* 텍스트 영역 */}
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
      
      {/* 우측 화살표 */}
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    fontSize: 32, // 애플 특유의 시원한 대형 타이틀
    fontWeight: '800',
    color: APPLE_THEME.textDark,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: APPLE_THEME.textMuted,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: APPLE_THEME.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // 애플 스타일의 은은하고 넓은 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }], // 누를 때 살짝 작아지는 애니메이션 효과
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 52,
    height: 52,
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
    fontSize: 18,
    fontWeight: '700',
    color: APPLE_THEME.textDark,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: APPLE_THEME.textMuted,
  },
});