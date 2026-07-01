import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, Screen } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { saveProfile } from '@/services/account-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const canContinue = name.trim().length >= 2 && phone.replace(/[^\d]/g, '').length >= 10;

  const submit = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    try {
      await saveProfile({ name, phone });
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
});
