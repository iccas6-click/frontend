import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, Screen } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { getDisplayName, getInitial, getProfile, type UserProfile } from '@/services/account-storage';

export default function MainScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProfile().then((data) => {
        if (!active) return;
        if (!data) {
          router.replace('/login');
          return;
        }
        setProfile(data);
        setChecking(false);
      });
      return () => {
        active = false;
      };
    }, [router]),
  );

  if (checking) {
    return <Screen><StatusBar style="dark" /></Screen>;
  }

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.brandLeft}>
              <View style={styles.logoMark}>
                <Image source={require('@/assets/images/click.png')} style={styles.logoImage} contentFit="contain" />
              </View>
              <Text style={styles.logoText}>CLICK</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel={`${getDisplayName(profile)} 프로필 열기`}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitial(profile)}</Text>
              </View>
              <Text style={styles.profileName} numberOfLines={1}>
                {getDisplayName(profile)}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.heroTitle}>같이 먹어도 괜찮은지, 사진으로 먼저 확인하세요</Text>

          <View style={styles.flowStrip}>
            <FlowPill icon="medical" label="알약 인식" />
            <Ionicons name="chevron-forward" size={16} color={Palette.textSubtle} />
            <FlowPill icon="leaf" label="건강기능식품 인식" tone="green" />
            <Ionicons name="chevron-forward" size={16} color={Palette.textSubtle} />
            <FlowPill icon="shield-checkmark" label="상호작용 분석" tone="dark" />
          </View>

          <View style={styles.heroActions}>
            <PrimaryButton
              label="인식 시작하기"
              icon="camera"
              onPress={() => router.push({ pathname: '/reuse', params: { category: '알약', mode: 'start' } })}
              accessibilityHint="기존 알약 기록을 선택하거나 새 촬영을 시작합니다."
            />
            <Pressable style={styles.historyLink} onPress={() => router.push('/history')} accessibilityRole="button" accessibilityLabel="기록 보기">
              <Ionicons name="time-outline" size={19} color={Palette.primary} />
              <Text style={styles.historyLinkText}>분석 기록 보기</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function FlowPill({ icon, label, tone = 'blue' }: { icon: 'medical' | 'leaf' | 'shield-checkmark'; label: string; tone?: 'blue' | 'green' | 'dark' }) {
  const color = tone === 'green' ? Palette.mint : tone === 'dark' ? Palette.blueGrey : Palette.primary;
  const backgroundColor = tone === 'green' ? Palette.mintSoft : tone === 'dark' ? Palette.surfaceMuted : Palette.primarySoft;
  return (
    <View style={styles.flowPill}>
      <View style={[styles.flowIcon, { backgroundColor }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.flowPillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: Spacing.screen,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 22,
    ...Shadow.card,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 28,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.text,
  },
  profileButton: {
    maxWidth: 150,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 22,
    backgroundColor: Palette.surfaceMuted,
    paddingLeft: 5,
    paddingRight: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  profileName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '900',
    color: Palette.text,
  },
  heroTitle: {
    ...Typography.hero,
    color: Palette.text,
  },
  flowStrip: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: Palette.background,
  },
  flowPill: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  flowIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowPillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: Palette.text,
    textAlign: 'center',
  },
  heroActions: {
    marginTop: 24,
    gap: 12,
  },
  historyLink: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primarySoft,
  },
  historyLinkText: {
    color: Palette.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
