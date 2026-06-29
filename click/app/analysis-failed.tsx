import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Spacing, Typography } from '@/constants/theme';

export default function AnalysisFailedScreen() {
  const router = useRouter();
  const { items, recordId } = useLocalSearchParams<{ items?: string; recordId?: string }>();

  const retry = () => {
    router.replace({ pathname: '/analyze', params: { items, recordId: recordId ?? '' } });
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
          <PrimaryButton label="다시 분석하기" icon="refresh" onPress={retry} />
          <PrimaryButton label="처음으로 돌아가기" icon="home" variant="secondary" onPress={goHome} />
        </View>
      }>
      <StatusBar style="dark" />
      <TopBar title="분석 지연" subtitle="네트워크나 임시 오류로 결과를 정리하지 못했어요." />
      <StepIndicator current={3} />
      <View style={styles.center}>
        <IconBadge icon="cloud-offline" tone="amber" size="lg" />
        <Text style={styles.title}>잠시 후 다시 시도해 주세요</Text>
        <Text style={styles.desc}>입력한 목록은 유지됩니다. 같은 항목으로 바로 다시 분석할 수 있어요.</Text>
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
