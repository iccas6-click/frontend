import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { getDisplayName, getInitial, getProfile, type UserProfile } from '@/services/account-storage';
import { formatRecordTime, formatRecordTitle, getAllSessions } from '@/services/history-storage';
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

        <View style={styles.startPanel}>
          <View style={styles.startPanelTop}>
            <View>
              <Text style={styles.startEyebrow}>복용 전 1분 체크</Text>
              <Text style={styles.startTitle}>약과 영양제 조합을 한 번에 정리해요</Text>
            </View>
            <IconBadge icon="shield-checkmark" tone="green" size="sm" />
          </View>
          <Text style={styles.startBody}>반복 복용 중인 약은 기록에서 다시 쓰고, 새로 생긴 약만 사진으로 추가하면 됩니다.</Text>
          <PrimaryButton
            label="사진으로 확인 시작"
            icon="camera"
            onPress={() => router.push({ pathname: '/reuse', params: { category: '알약', mode: 'start' } })}
            accessibilityHint="기존 알약 기록을 선택하거나 새 촬영을 시작합니다."
          />
          <Pressable style={styles.secondaryStartButton} onPress={() => router.push('/history')} accessibilityRole="button" accessibilityLabel="저장된 기록 보기">
            <Ionicons name="folder-open-outline" size={19} color={Palette.blueGrey} />
            <Text style={styles.secondaryStartText}>저장된 기록 보기</Text>
          </Pressable>
        </View>

        <SectionTitle title="진행 방식" />
        <View style={styles.stepPanel}>
          <StepLine index="1" icon="medical" title="알약 추가" body="처방약, 상비약을 촬영하거나 기존 기록에서 선택해요." />
          <StepLine index="2" icon="leaf" title="건강기능식품 추가" body="영양제와 건강기능식품 라벨을 따로 확인해요." tone="green" />
          <StepLine index="3" icon="analytics" title="복용 전 분석" body="두 목록을 한 화면에서 검토한 뒤 상호작용을 확인해요." tone="dark" isLast />
        </View>

        <SectionTitle title="내 기록 상태" />
        <StatusBoard
          attention={stats.attention}
          reusable={stats.reusable}
          readySession={stats.readySession}
          latest={stats.latest}
          onStart={() => router.push({ pathname: '/reuse', params: { category: '알약', mode: 'start' } })}
          onHistory={() => router.push('/history')}
          onRecord={(id) => router.push({ pathname: '/record', params: { id } })}
        />

        <SectionTitle title="복용 전 체크 포인트" />
        <View style={styles.tipList}>
          <TipRow icon="repeat" title="반복 복용 약은 재사용" body="매번 다시 찍지 않고 기존 인식 기록에서 바로 가져올 수 있어요." />
          <TipRow icon="list" title="분석 전 전체 검토" body="알약과 건강기능식품 목록을 한 번에 확인한 뒤 분석합니다." />
          <TipRow icon="medkit" title="복용 변경은 상담 후" body="결과는 상담 전 확인용이며 처방을 대신하지 않습니다." />
        </View>
      </ScrollView>
    </Screen>
  );
}

function StepLine({
  index,
  icon,
  title,
  body,
  tone = 'blue',
  isLast,
}: {
  index: string;
  icon: 'medical' | 'leaf' | 'analytics';
  title: string;
  body: string;
  tone?: 'blue' | 'green' | 'dark';
  isLast?: boolean;
}) {
  return (
    <View style={styles.stepLine}>
      <View style={styles.stepRail}>
        <View style={styles.stepIndex}>
          <Text style={styles.stepIndexText}>{index}</Text>
        </View>
        {isLast ? null : <View style={styles.stepRailLine} />}
      </View>
      <IconBadge icon={icon} tone={tone} size="sm" />
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function StatusBoard({
  attention,
  reusable,
  readySession,
  latest,
  onStart,
  onHistory,
  onRecord,
}: {
  attention: number;
  reusable: number;
  readySession: AnalysisSession | null;
  latest: AnalysisSession | null;
  onStart: () => void;
  onHistory: () => void;
  onRecord: (id: string) => void;
}) {
  return (
    <View style={styles.statusBoard}>
      <StatusRow
        icon={attention > 0 ? 'warning' : 'checkmark-circle'}
        tone={attention > 0 ? 'amber' : 'green'}
        label="상담 확인 필요"
        value={`${attention}건`}
        body={attention > 0 ? '주의 표시된 조합을 다시 열어보세요.' : '현재 주의 표시된 기록이 없어요.'}
        action="보기"
        onPress={onHistory}
      />
      <StatusRow
        icon="archive"
        tone="blue"
        label="다시 쓸 수 있는 기록"
        value={`${reusable}건`}
        body="반복 처방약이나 매일 먹는 영양제를 다시 촬영하지 않아도 돼요."
        action="시작"
        onPress={onStart}
      />
      <StatusRow
        icon={readySession ? 'document-text' : 'time'}
        tone={readySession ? 'amber' : 'dark'}
        label={readySession ? '분석 이어가기' : '최근 확인'}
        value={readySession ? '대기 중' : latest ? formatRecordTitle(latest.createdAt) : '없음'}
        body={readySession ? '인식은 끝났고 분석 전 검토가 남아 있어요.' : latest ? `${formatRecordTime(latest.createdAt)}에 저장된 기록이 있어요.` : '첫 기록을 만들면 여기에서 상태를 볼 수 있어요.'}
        action={readySession ? '열기' : latest ? '기록' : '시작'}
        onPress={() => {
          if (readySession) {
            onRecord(readySession.id);
            return;
          }
          if (latest) {
            onHistory();
            return;
          }
          onStart();
        }}
      />
    </View>
  );
}

function StatusRow({
  icon,
  tone,
  label,
  value,
  body,
  action,
  onPress,
}: {
  icon: 'warning' | 'checkmark-circle' | 'archive' | 'document-text' | 'time';
  tone: 'amber' | 'green' | 'blue' | 'dark';
  label: string;
  value: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.statusRow, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}, ${value}. ${body}`}>
      <IconBadge icon={icon} tone={tone} size="sm" />
      <View style={styles.statusText}>
        <View style={styles.statusTitleRow}>
          <Text style={styles.statusLabel}>{label}</Text>
          <Text style={styles.statusValue}>{value}</Text>
        </View>
        <Text style={styles.statusBody}>{body}</Text>
      </View>
      <Text style={styles.statusAction}>{action}</Text>
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
  startPanel: {
    gap: 14,
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 18,
    ...Shadow.card,
  },
  startPanelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  startEyebrow: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
    color: Palette.primary,
  },
  startTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
    color: Palette.text,
    marginTop: 3,
  },
  startBody: {
    fontSize: 16,
    lineHeight: 23,
    color: Palette.textMuted,
  },
  secondaryStartButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceMuted,
  },
  secondaryStartText: {
    color: Palette.blueGrey,
    fontSize: 17,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: Palette.text,
    marginTop: 6,
  },
  stepPanel: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    ...Shadow.subtle,
  },
  stepLine: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  stepRail: {
    width: 28,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginRight: 10,
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.text,
  },
  stepIndexText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  stepRailLine: {
    width: 2,
    flex: 1,
    backgroundColor: Palette.border,
    marginTop: 7,
  },
  stepText: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: Palette.text,
  },
  stepBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textMuted,
    marginTop: 3,
  },
  statusBoard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
    ...Shadow.subtle,
  },
  statusRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    paddingVertical: 14,
  },
  statusText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: Palette.text,
  },
  statusValue: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '900',
  },
  statusBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textMuted,
    marginTop: 3,
  },
  statusAction: {
    minWidth: 36,
    textAlign: 'right',
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
