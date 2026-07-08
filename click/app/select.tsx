import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet } from 'react-native';

import { ActionCard, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/services/i18n';
import type { ItemCategory } from '@/types/medication';

export default function SelectScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const goCamera = (category: ItemCategory) => {
    router.replace({ pathname: '/reuse', params: { category } });
  };

  return (
    <Screen>
      <StatusBar style="dark" />
      <TopBar
        title={t('selectCaptureItem')}
        subtitle={t('selectCaptureSubtitle')}
        backLabel={t('home')}
        onBack={() => router.back()}
      />
      <StepIndicator current={1} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ActionCard
          icon="medical"
          title={t('capturePrescription')}
          subtitle={t('capturePrescriptionSubtitle')}
          onPress={() => goCamera('알약')}
        />
        <ActionCard
          icon="leaf"
          tone="green"
          title={t('captureSupplement')}
          subtitle={t('captureSupplementSubtitle')}
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
