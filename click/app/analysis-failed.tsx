import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/services/i18n';

export default function AnalysisFailedScreen() {
  const router = useRouter();
  const { items, recordId, flowId } = useLocalSearchParams<{ items?: string; recordId?: string; flowId?: string }>();
  const { t } = useI18n();

  const retry = () => {
    router.replace({ pathname: '/analyze', params: { items, recordId: recordId ?? '', flowId: flowId ?? '' } });
  };

  const goHome = () => {
    try {
      router.dismissAll();
    } catch {}
    router.replace('/');
  };

  return (
    <Screen
      bottom={
        <View style={styles.footer}>
          <PrimaryButton label={t('analysisAgain')} icon="refresh" onPress={retry} />
          <PrimaryButton label={t('goHome')} icon="home" variant="secondary" onPress={goHome} />
        </View>
      }>
      <StatusBar style="dark" />
      <TopBar title={t('analysisDelayed')} subtitle={t('analysisDelayedSubtitle')} />
      <StepIndicator current={3} />
      <View style={styles.center}>
        <IconBadge icon="cloud-offline" tone="amber" size="lg" />
        <Text style={styles.title}>{t('tryAgainLater')}</Text>
        <Text style={styles.desc}>{t('analysisFailedBody')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screen + 12,
    paddingBottom: 96,
  },
  title: {
    ...Typography.section,
    color: Palette.text,
    textAlign: 'center',
    marginTop: 16,
  },
  desc: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    gap: 10,
    paddingBottom: 8,
  },
});
