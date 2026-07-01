import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { deleteProfile, formatPhone, getDisplayName, getInitial, getProfile, saveProfile, type UserMode, type UserProfile } from '@/services/account-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState<UserMode>('standard');

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
        setName(data.name);
        setNickname(data.nickname ?? '');
        setPhone(data.phone);
        setMode(data.mode);
      });
      return () => {
        active = false;
      };
    }, [router]),
  );

  const save = async () => {
    const next = await saveProfile({ name, phone, nickname, mode });
    setProfile(next);
    Alert.alert('저장 완료', '프로필 정보가 저장되었습니다.');
  };

  const withdraw = () => {
    Alert.alert('회원탈퇴', '이 기기의 프로필 정보가 삭제됩니다. 기록 데이터는 백엔드 연결 전까지 별도 보관됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴',
        style: 'destructive',
        onPress: async () => {
          await deleteProfile();
          router.replace('/login');
        },
      },
    ]);
  };

  const logout = () => {
    Alert.alert('로그아웃', '이 기기에서 현재 계정을 로그아웃할까요? 저장된 분석 기록은 그대로 남겨둡니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: async () => {
          await deleteProfile();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <Screen>
      <StatusBar style="dark" />
      <TopBar title="프로필" subtitle="계정 정보와 기록 접근을 관리합니다." backLabel="홈" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(profile)}</Text>
          </View>
          <Text style={styles.displayName}>{getDisplayName(profile)}</Text>
          <Text style={styles.phoneText}>{profile ? formatPhone(profile.phone) : ''}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>이름</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="이름" placeholderTextColor={Palette.textSubtle} />

          <Text style={styles.label}>닉네임</Text>
          <TextInput style={styles.input} value={nickname} onChangeText={setNickname} placeholder="선택 입력" placeholderTextColor={Palette.textSubtle} />

          <Text style={styles.label}>전화번호</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="01012345678"
            placeholderTextColor={Palette.textSubtle}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>사용 모드</Text>
          <View style={styles.modeToggle}>
            <ModeOption title="일반" body="요양사 · 보호자" active={mode === 'standard'} onPress={() => setMode('standard')} />
            <ModeOption title="저시력자" body="노인 직접 사용" active={mode === 'lowVision'} onPress={() => setMode('lowVision')} />
          </View>

          <PrimaryButton label="프로필 저장" icon="save" onPress={save} />
        </View>

        <View style={styles.menuCard}>
          <MenuRow icon="time" title="기록 관리" body="분석 기록과 분석 전 기록을 확인합니다." onPress={() => router.push('/history')} />
          <MenuRow icon="notifications" title="복용 알림" body="추후 복용 시간 알림과 보호자 공유를 연결합니다." />
          <MenuRow icon="shield-checkmark" title="개인정보 설정" body="백엔드 연결 시 계정과 기록 보관 정책을 관리합니다." />
        </View>

        <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={logout} accessibilityRole="button" accessibilityLabel="로그아웃">
          <Ionicons name="log-out-outline" size={19} color={Palette.primary} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>

        <Pressable style={styles.withdrawButton} onPress={withdraw} accessibilityRole="button" accessibilityLabel="회원탈퇴">
          <Ionicons name="trash-outline" size={18} color={Palette.rose} />
          <Text style={styles.withdrawText}>회원탈퇴</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function MenuRow({
  icon,
  title,
  body,
  onPress,
}: {
  icon: 'time' | 'notifications' | 'shield-checkmark';
  title: string;
  body: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && onPress ? styles.pressed : null]} onPress={onPress} disabled={!onPress}>
      <IconBadge icon={icon} tone={onPress ? 'blue' : 'dark'} size="sm" />
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuBody}>{body}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={Palette.textSubtle} /> : <Text style={styles.readyText}>준비 중</Text>}
    </Pressable>
  );
}

function ModeOption({
  title,
  body,
  active,
  onPress,
}: {
  title: string;
  body: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.modeOption, active && styles.modeOptionActive, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title} 모드, ${body}`}>
      <Text style={[styles.modeOptionTitle, active && styles.modeOptionTitleActive]}>{title}</Text>
      <Text style={styles.modeOptionBody}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 36,
    gap: 14,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 24,
    ...Shadow.card,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  displayName: {
    ...Typography.section,
    color: Palette.text,
    marginTop: 14,
  },
  phoneText: {
    ...Typography.body,
    color: Palette.textMuted,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 18,
    gap: 9,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.textMuted,
  },
  input: {
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    paddingHorizontal: 14,
    fontSize: 17,
    color: Palette.text,
    marginBottom: 7,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modeOption: {
    flex: 1,
    minHeight: 82,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    padding: 13,
  },
  modeOptionActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primarySoft,
  },
  modeOptionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: Palette.text,
  },
  modeOptionTitleActive: {
    color: Palette.primary,
  },
  modeOptionBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: Palette.textMuted,
    marginTop: 3,
  },
  menuCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
  },
  menuRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.78,
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Palette.text,
  },
  menuBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textMuted,
    marginTop: 3,
  },
  readyText: {
    ...Typography.caption,
    color: Palette.textSubtle,
  },
  logoutButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primarySoft,
  },
  logoutText: {
    color: Palette.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  withdrawButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  withdrawText: {
    color: Palette.rose,
    fontSize: 16,
    fontWeight: '800',
  },
});
