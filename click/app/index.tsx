import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_BG = '#F2F2F7';

export default function MainScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* 상단 부드러운 그라데이션 배경 */}
      <LinearGradient
        colors={['#FFD8C6', '#F0CCE6', '#CBD7F4', 'rgba(242,242,247,0)']}
        locations={[0, 0.4, 0.7, 1]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* 중앙 정렬 로고 (조금 아래) */}
        <View style={styles.logoArea}>
          <Text style={styles.logo}>CLICK</Text>
          <Text style={styles.logoSub}>의약품 상호작용 확인</Text>
        </View>

        {/* 통통한 컬러 타일 버튼 2개 */}
        <View style={styles.tilesRow}>
          <Tile
            color="#2BB7C9"
            title={'사진으로\n검색하기'}
            icon="camera"
            onPress={() => router.push('/select')}
          />
          <Tile
            color="#F2945E"
            title={'지난 검색\n기록 보기'}
            icon="time"
            onPress={() => router.push('/history')}
          />
        </View>
      </SafeAreaView>
    </View>
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
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: ComponentProps<typeof Pressable>['onPress'];
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
      accessibilityLabel={title.replace('\n', ' ')}>
      <Text style={styles.tileTitle}>{title}</Text>
      <Ionicons name={icon} size={64} color="rgba(255,255,255,0.95)" style={styles.tileIcon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
  },
  safe: {
    flex: 1,
  },
  logoArea: {
    alignItems: 'center',
    marginTop: 64,
    marginBottom: 48,
  },
  logo: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#2A2D34',
  },
  logoSub: {
    fontSize: 14,
    color: '#5C6066',
    marginTop: 6,
  },
  tilesRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
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
