import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 💡 애플 건강 앱 스타일 테마 컬러
const APPLE_THEME = {
  background: '#F2F2F7', 
  card: '#FFFFFF',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  primary: '#FF2D55',    // 카메라(메인 액션) 포인트 컬러
  secondary: '#007AFF',  // 기록(서브 액션) 포인트 컬러
};

export default function MainScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 타이틀 영역 */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>의약품 상호작용 확인</Text>
          <Text style={styles.headerTitle}>CLICK</Text>
        </View>

        {/* 메인 기능 리스트 */}
        <View style={styles.listContainer}>
          <ActionCard
            title="사진으로 검색하기"
            subtitle="처방전이나 약 봉투를 촬영하세요"
            icon="camera"
            iconColor={APPLE_THEME.primary}
            iconBg="#FFE5EA" // 부드러운 핑크레드 배경
            onPress={() => router.push('/select')}
          />
          
          <ActionCard
            title="지난 검색 기록 보기"
            subtitle="이전 분석 결과를 다시 확인하세요"
            icon="time"
            iconColor={APPLE_THEME.secondary}
            iconBg="#E5F1FF" // 부드러운 블루 배경
            onPress={() => router.push('/history')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** 💡 애플 스타일의 공통 액션 카드 컴포넌트 */
function ActionCard({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  onPress: ComponentProps<typeof Pressable>['onPress'];
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {/* 좌측 아이콘 박스 */}
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      
      {/* 텍스트 영역 */}
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: APPLE_THEME.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: APPLE_THEME.textDark,
    letterSpacing: 1,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APPLE_THEME.card,
    borderRadius: 24, // 조금 더 둥근 애플 특유의 곡률
    padding: 20,
    // 아주 넓고 은은한 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }], // 눌렀을 때 자연스럽게 축소
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
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
    fontSize: 19,
    fontWeight: '700',
    color: APPLE_THEME.textDark,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: APPLE_THEME.textMuted,
    lineHeight: 20,
  },
});