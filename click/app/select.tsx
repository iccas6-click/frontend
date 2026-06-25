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

// 애플 건강 앱 느낌의 쿨 그레이 배경
const APPLE_GRAY = '#F2F2F7';

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
      <StepIndicator current={1} background={APPLE_GRAY} />

      <View style={styles.content}>
        <Text style={styles.title}>무엇을 검색할까요?</Text>
        <Text style={styles.subtitle}>촬영할 항목의 종류를 선택해 주세요</Text>

        {/* 통통한 컬러 타일 버튼 2개 */}
        <View style={styles.tilesRow}>
          <Tile
            color="#E8705B"
            title={'알약'}
            icon={
              <MaterialCommunityIcons
                name="pill"
                size={62}
                color="rgba(255,255,255,0.95)"
              />
            }
            onPress={() => goCamera('알약')}
          />
          <Tile
            color="#57A86A"
            title={'건강기능\n식품'}
            icon={
              <Ionicons name="leaf" size={56} color="rgba(255,255,255,0.95)" />
            }
            onPress={() => goCamera('건강기능식품 라벨')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Tile({
  color,
  title,
  icon,
  onPress,
}: {
  color: string;
  title: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: color },
        pressed && styles.tilePressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title.replace('\n', '')} 검색`}
    >
      <Text style={styles.tileTitle}>{title}</Text>
      <View style={styles.tileIcon}>{icon}</View>
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
    paddingTop: 24,
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
  tilesRow: {
    flexDirection: 'row',
    gap: 14,
  },
  tile: {
    flex: 1,
    aspectRatio: 0.92,
    borderRadius: 26,
    padding: 20,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  tilePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  tileTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  tileIcon: {
    position: 'absolute',
    right: 14,
    bottom: 12,
  },
});
