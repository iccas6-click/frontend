import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { getDisplayName, getInitial, getProfile, type UserProfile } from '@/services/account-storage';
import { getAllSessions } from '@/services/history-storage';
import type { AnalysisSession } from '@/types/medication';

export default function MainScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [checking, setChecking] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getProfile(), getAllSessions()]).then(([profileData, sessionData]) => {
        if (!active) return;
        if (!profileData) {
          router.replace('/login');
          return;
        }
        setProfile(profileData);
        setSessions(sessionData);
        setChecking(false);
      });
      return () => {
        active = false;
      };
    }, [router]),
  );

  const stats = useMemo(() => {
    const attention = sessions.filter((session) => session.analysis?.overall === 'danger' || session.analysis?.overall === 'caution').length;
    const reusable = sessions.filter((session) => session.items.length > 0).length;
    const readySession = sessions.find((session) => session.status !== 'analyzed') ?? null;
    const latest = sessions[0] ?? null;
    return { attention, reusable, readySession, total: sessions.length, latest };
  }, [sessions]);

  if (checking) {
    return (
      <Screen>
        <StatusBar style="dark" />
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
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

        <View style={styles.heroBlock}>
          <Text style={styles.greeting}>{getDisplayName(profile)}님,</Text>
          <Text style={styles.heroTitle}>같이 먹어도 괜찮은지{'\n'}사진으로 먼저 확인하세요!</Text>
        </View>

        <View style={styles.flowStrip}>
          <FlowPill icon="medical" label="알약 인식" />
          <Ionicons name="chevron-forward" size={16} color={Palette.textSubtle} />
          <FlowPill icon="leaf" label="건강기능식품 인식" tone="green" />
          <Ionicons name="chevron-forward" size={16} color={Palette.textSubtle} />
          <FlowPill icon="shield-checkmark" label="상호작용 분석" tone="dark" />
        </View>

        <View style={styles.actionPanel}>
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

        <View style={styles.statsGrid}>
          <StatCard
            label="상담 확인 필요"
            value={`${stats.attention}건`}
            icon={stats.attention > 0 ? 'warning' : 'checkmark-circle'}
            tone={stats.attention > 0 ? 'amber' : 'green'}
          />
          <StatCard label="재사용 가능 기록" value={`${stats.reusable}건`} icon="archive" tone="blue" />
        </View>

        <SectionTitle title="다음에 할 일" />
        <NextActionCard
          attention={stats.attention}
          readySession={stats.readySession}
          latest={stats.latest}
          onStart={() => router.push({ pathname: '/reuse', params: { category: '알약', mode: 'start' } })}
          onHistory={() => router.push('/history')}
          onRecord={(id) => router.push({ pathname: '/record', params: { id } })}
        />

        <SectionTitle title="안전 체크 포인트" />
        <View style={styles.tipList}>
          <TipRow icon="repeat" title="반복 복용 약은 재사용" body="매번 다시 찍지 않고 기존 인식 기록에서 바로 가져올 수 있어요." />
          <TipRow icon="list" title="분석 전 전체 검토" body="알약과 건강기능식품 목록을 한 번에 확인한 뒤 분석합니다." />
          <TipRow icon="medkit" title="복용 변경은 상담 후" body="결과는 상담 전 확인용이며 처방을 대신하지 않습니다." />
        </View>
      </ScrollView>
    </Screen>
  );
}

function FlowPill({
  icon,
  label,
  tone = 'blue',
}: {
  icon: 'medical' | 'leaf' | 'shield-checkmark';
  label: string;
  tone?: 'blue' | 'green' | 'dark';
}) {
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

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: 'checkmark-circle' | 'warning' | 'archive';
  tone: 'green' | 'amber' | 'blue';
}) {
  return (
    <View style={styles.statCard}>
      <IconBadge icon={icon} tone={tone} size="sm" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NextActionCard({
  attention,
  readySession,
  latest,
  onStart,
  onHistory,
  onRecord,
}: {
  attention: number;
  readySession: AnalysisSession | null;
  latest: AnalysisSession | null;
  onStart: () => void;
  onHistory: () => void;
  onRecord: (id: string) => void;
}) {
  if (readySession) {
    return (
      <ActionNotice
        icon="document-text"
        tone="amber"
        title="분석 전 기록이 있어요"
        body="인식 목록을 확인하고 상호작용 분석까지 이어가세요."
        action="기록 열기"
        onPress={() => onRecord(readySession.id)}
      />
    );
  }

  if (attention > 0) {
    return (
      <ActionNotice
        icon="warning"
        tone="amber"
        title="상담 확인이 필요한 기록이 있어요"
        body="주의 또는 위험으로 표시된 조합을 다시 확인해 보세요."
        action="기록 보기"
        onPress={onHistory}
      />
    );
  }

  if (latest) {
    return (
      <ActionNotice
        icon="checkmark-circle"
        tone="green"
        title="최근 분석까지 정리되어 있어요"
        body="새 약이나 건강기능식품이 생기면 새 조합으로 확인하세요."
        action="새 조합 시작"
        onPress={onStart}
      />
    );
  }

  return (
    <ActionNotice
      icon="sparkles"
      tone="blue"
      title="첫 조합 확인을 시작해 보세요"
      body="알약과 건강기능식품을 순서대로 추가하면 분석 전 전체 목록을 한 번 더 확인합니다."
      action="시작하기"
      onPress={onStart}
    />
  );
}

function ActionNotice({
  icon,
  tone,
  title,
  body,
  action,
  onPress,
}: {
  icon: 'document-text' | 'warning' | 'checkmark-circle' | 'sparkles';
  tone: 'amber' | 'green' | 'blue';
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.actionNotice, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}, ${body}`}>
      <IconBadge icon={icon} tone={tone} />
      <View style={styles.actionNoticeText}>
        <Text style={styles.actionNoticeTitle}>{title}</Text>
        <Text style={styles.actionNoticeBody}>{body}</Text>
      </View>
      <View style={styles.actionChip}>
        <Text style={styles.actionChipText}>{action}</Text>
        <Ionicons name="chevron-forward" size={15} color={Palette.primary} />
      </View>
    </Pressable>
  );
}

function TipRow({
  icon,
  title,
  body,
}: {
  icon: 'repeat' | 'list' | 'medkit';
  title: string;
  body: string;
}) {
  return (
    <View style={styles.tipRow}>
      <IconBadge icon={icon} tone="dark" size="sm" />
      <View style={styles.tipText}>
        <Text style={styles.tipTitle}>{title}</Text>
        <Text style={styles.tipBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.screen,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    ...Shadow.subtle,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 25,
    lineHeight: 31,
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
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
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
  heroBlock: {
    marginTop: 6,
  },
  greeting: {
    ...Typography.body,
    color: Palette.textMuted,
    marginBottom: 6,
  },
  heroTitle: {
    ...Typography.hero,
    color: Palette.text,
  },
  flowStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.subtle,
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
  actionPanel: {
    gap: 10,
  },
  historyLink: {
    minHeight: 54,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 118,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
    ...Shadow.subtle,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: Palette.text,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: Palette.textMuted,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: Palette.text,
    marginTop: 6,
  },
  actionNotice: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  actionNoticeText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  actionNoticeTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: Palette.text,
  },
  actionNoticeBody: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 4,
  },
  actionChip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primarySoft,
  },
  actionChipText: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.primary,
  },
  tipList: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
    ...Shadow.subtle,
  },
  tipRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    paddingVertical: 14,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.text,
  },
  tipBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textMuted,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
