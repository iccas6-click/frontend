import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet } from 'react-native';

import { ActionCard, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Spacing } from '@/constants/theme';
import type { ItemCategory } from '@/types/medication';

export default function SelectScreen() {
  const router = useRouter();

  const goCamera = (category: ItemCategory) => {
    router.replace({ pathname: '/reuse', params: { category } });
  };

  return (
    <Screen>
      <StatusBar style="dark" />
      <TopBar
        title="촬영할 항목 선택"
        subtitle="알약과 건강기능식품을 순서대로 추가해 상호작용을 확인합니다."
        backLabel="홈"
        onBack={() => router.back()}
      />
      <StepIndicator current={1} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ActionCard
          icon="medical"
          title="알약 촬영"
          subtitle="처방약, 일반 의약품, 약 봉투"
          onPress={() => goCamera('알약')}
        />
        <ActionCard
          icon="leaf"
          tone="green"
          title="건강기능식품 촬영"
          subtitle="비타민, 오메가3, 유산균 등 제품 라벨"
          onPress={() => goCamera('건강기능식품 라벨')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 36,
    gap: 12,
  },
});
