import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, Screen } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { saveProfile, type UserMode } from '@/services/account-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState<UserMode>('standard');
  const [saving, setSaving] = useState(false);

  const canContinue = name.trim().length >= 2 && phone.replace(/[^\d]/g, '').length >= 10;

  const submit = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    try {
      await saveProfile({ name, phone, mode });
      router.replace('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brandBlock}>
            <View style={styles.logoWrap}>
              <Image source={require('@/assets/images/click.png')} style={styles.logo} contentFit="contain" />
            </View>
            <Text style={styles.brand}>CLICK</Text>
            <Text style={styles.title}>복용 기록을 내 계정에 안전하게 남겨요</Text>
            <Text style={styles.subtitle}>이름과 전화번호만으로 시작하고, 약과 건강기능식품 조합 기록을 이어서 관리합니다.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>사용 모드</Text>
            <View style={styles.modeGrid}>
              <ModeCard
                title="일반 모드"
                body="요양사나 보호자가 빠르게 관리"
                selected={mode === 'standard'}
                onPress={() => setMode('standard')}
              />
              <ModeCard
                title="저시력자 모드"
                body="글자와 버튼을 더 큼직하게"
                selected={mode === 'lowVision'}
                onPress={() => setMode('lowVision')}
              />
            </View>

            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="예: 이규하"
              placeholderTextColor={Palette.textSubtle}
              autoCapitalize="none"
              accessibilityLabel="이름"
            />

            <Text style={styles.label}>전화번호</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="예: 01012345678"
              placeholderTextColor={Palette.textSubtle}
              keyboardType="phone-pad"
              accessibilityLabel="전화번호"
            />

            <PrimaryButton
              label={saving ? '저장 중' : '시작하기'}
              icon="checkmark-circle"
              disabled={!canContinue || saving}
              onPress={submit}
              accessibilityHint="입력한 이름과 전화번호로 로컬 계정을 만듭니다."
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ModeCard({
  title,
  body,
  selected,
  onPress,
}: {
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.modeCard, selected && styles.modeCardSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${body}`}>
      <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>{title}</Text>
      <Text style={styles.modeBody}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.screen,
    gap: 24,
  },
  brandBlock: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 92,
    height: 92,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    ...Shadow.card,
  },
  logo: {
    width: 70,
    height: 70,
  },
  brand: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '900',
    color: Palette.text,
  },
  title: {
    ...Typography.title,
    color: Palette.text,
    textAlign: 'center',
    marginTop: 18,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  form: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 20,
    gap: 10,
    ...Shadow.card,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textMuted,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modeCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    padding: 13,
    justifyContent: 'center',
  },
  modeCardSelected: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primarySoft,
  },
  modeTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: Palette.text,
  },
  modeTitleSelected: {
    color: Palette.primary,
  },
  modeBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: Palette.textMuted,
    marginTop: 4,
  },
  input: {
    minHeight: 54,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    paddingHorizontal: 14,
    fontSize: 17,
    color: Palette.text,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.78,
  },
});
