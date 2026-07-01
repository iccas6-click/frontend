import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { formatRecordDateTime, getAllSessions } from '@/services/history-storage';
import { getSettings, type AppSettings } from '@/services/settings-storage';
import type { AnalysisSession, RiskLevel } from '@/types/medication';

function countByCategory(record: AnalysisSession) {
  return {
    pill: record.items.filter((item) => item.category === '알약').length,
    supplement: record.items.filter((item) => item.category === '건강기능식품 라벨').length,
  };
}

function riskLabel(level?: RiskLevel) {
  if (level === 'danger') return '위험';
  if (level === 'caution') return '주의';
  if (level === 'safe') return '미탐지';
  return '결과 없음';
}

function riskTone(level?: RiskLevel): 'red' | 'amber' | 'green' | 'dark' {
  if (level === 'danger') return 'red';
  if (level === 'caution') return 'amber';
  if (level === 'safe') return 'green';
  return 'dark';
}

export default function MainScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({ mode: 'standard' });
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getSettings(), getAllSessions()]).then(([settingsData, sessionData]) => {
        if (!active) return;
        setSettings(settingsData);
        setSessions(sessionData);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const lowVision = settings.mode === 'lowVision';
  const recentRecords = useMemo(() => sessions.slice(0, 5), [sessions]);

  return (
    <Screen>
      <StatusBar style="dark" />
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.brandLeft}>
            <View style={styles.logoMark}>
              <Image source={require('@/assets/images/click.png')} style={styles.logoImage} contentFit="contain" />
            </View>
            <Text style={[styles.logoText, lowVision && styles.logoTextLowVision]}>CLICK</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.modeBadge, lowVision && styles.modeBadgeLowVision]}>
              <Text style={[styles.modeBadgeText, lowVision && styles.modeBadgeTextLowVision]}>
                {lowVision ? '저시력자' : '일반'}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.settingsButton, lowVision && styles.settingsButtonLowVision, pressed && styles.pressed]}
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="설정 열기">
              <Ionicons name="settings-outline" size={lowVision ? 25 : 22} color={Palette.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, lowVision && styles.contentLowVision]} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBlock}>
          <Text style={[styles.heroTitle, lowVision && styles.heroTitleLowVision]}>같이 먹어도 괜찮은지{'\n'}사진으로 먼저 확인하세요!</Text>
        </View>

        <View style={styles.flowStrip}>
          <FlowPill icon="medical" label="알약 인식" large={lowVision} />
          <Ionicons name="chevron-forward" size={16} color={Palette.textSubtle} />
          <FlowPill icon="leaf" label="건강기능식품 인식" tone="green" large={lowVision} />
          <Ionicons name="chevron-forward" size={16} color={Palette.textSubtle} />
          <FlowPill icon="shield-checkmark" label="상호작용 분석" tone="dark" large={lowVision} />
        </View>

        <View style={styles.startPanel}>
          <Text style={[styles.startTitle, lowVision && styles.startTitleLowVision]}>복용 전 1분 체크</Text>
          <PrimaryButton
            label="인식 시작하기"
            icon="camera"
            onPress={() => router.push({ pathname: '/reuse', params: { category: '알약', mode: 'start' } })}
          />
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, lowVision && styles.sectionTitleLowVision]}>최근 기록</Text>
          <Pressable onPress={() => router.push('/history')} hitSlop={10} accessibilityRole="button" accessibilityLabel="전체 기록 보기">
            <Text style={[styles.sectionAction, lowVision && styles.sectionActionLowVision]}>전체</Text>
          </Pressable>
        </View>

        {recentRecords.length === 0 ? (
          <View style={[styles.emptyTimeline, lowVision && styles.emptyTimelineLowVision]}>
            <IconBadge icon="folder-open" tone="dark" />
            <Text style={[styles.emptyTitle, lowVision && styles.emptyTitleLowVision]}>아직 기록이 없어요</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {recentRecords.map((record, index) => (
              <TimelineCard
                key={record.id}
                record={record}
                first={index === 0}
                lowVision={lowVision}
                onPress={() => router.push({ pathname: '/record', params: { id: record.id } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function FlowPill({
  icon,
  label,
  tone = 'blue',
  large,
}: {
  icon: 'medical' | 'leaf' | 'shield-checkmark';
  label: string;
  tone?: 'blue' | 'green' | 'dark';
  large?: boolean;
}) {
  const color = tone === 'green' ? Palette.mint : tone === 'dark' ? Palette.blueGrey : Palette.primary;
  const backgroundColor = tone === 'green' ? Palette.mintSoft : tone === 'dark' ? Palette.surfaceMuted : Palette.primarySoft;
  return (
    <View style={styles.flowPill}>
      <View style={[styles.flowIcon, large && styles.flowIconLarge, { backgroundColor }]}>
        <Ionicons name={icon} size={large ? 18 : 16} color={color} />
      </View>
      <Text style={[styles.flowPillText, large && styles.flowPillTextLarge]}>{label}</Text>
    </View>
  );
}

function TimelineCard({
  record,
  first,
  lowVision,
  onPress,
}: {
  record: AnalysisSession;
  first: boolean;
  lowVision: boolean;
  onPress: () => void;
}) {
  const counts = countByCategory(record);
  const level = record.analysis?.overall;
  return (
    <Pressable
      style={({ pressed }) => [styles.timelineCard, lowVision && styles.timelineCardLowVision, first && styles.timelineCardFirst, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${formatRecordDateTime(record.createdAt)}, ${riskLabel(level)}`}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: Palette[riskTone(level) === 'red' ? 'rose' : riskTone(level) === 'amber' ? 'amber' : riskTone(level) === 'green' ? 'mint' : 'blueGrey'] }]} />
        <View style={styles.timelineLine} />
      </View>
      <View style={styles.timelineBody}>
        <View style={styles.timelineTop}>
          <Text style={[styles.timelineTitle, lowVision && styles.timelineTitleLowVision]}>
            {formatRecordDateTime(record.createdAt)}
          </Text>
          <RiskChip level={level} />
        </View>
        <View style={styles.countRow}>
          <CountChip icon="medical" label={`알약 ${counts.pill}`} />
          <CountChip icon="leaf" label={`건강기능식품 ${counts.supplement}`} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={lowVision ? 22 : 19} color={Palette.textSubtle} />
    </Pressable>
  );
}

function RiskChip({ level }: { level?: RiskLevel }) {
  const tone = riskTone(level);
  const color = tone === 'red' ? Palette.rose : tone === 'amber' ? Palette.amber : tone === 'green' ? Palette.mint : Palette.blueGrey;
  const backgroundColor = tone === 'red' ? Palette.roseSoft : tone === 'amber' ? Palette.amberSoft : tone === 'green' ? Palette.mintSoft : Palette.surfaceMuted;
  return (
    <View style={[styles.riskChip, { backgroundColor }]}>
      <Text style={[styles.riskChipText, { color }]}>{riskLabel(level)}</Text>
    </View>
  );
}

function CountChip({ icon, label }: { icon: 'medical' | 'leaf'; label: string }) {
  return (
    <View style={styles.countChip}>
      <Ionicons name={icon} size={14} color={Palette.textMuted} />
      <Text style={styles.countChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.screen,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: Palette.text,
  },
  logoTextLowVision: {
    fontSize: 31,
    lineHeight: 37,
  },
  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  settingsButtonLowVision: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 16,
  },
  contentLowVision: {
    gap: 15,
  },
  heroBlock: {
    gap: 0,
  },
  heroTitle: {
    ...Typography.hero,
    color: Palette.text,
  },
  heroTitleLowVision: {
    fontSize: 35,
    lineHeight: 42,
  },
  modeBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceMuted,
  },
  modeBadgeLowVision: {
    minHeight: 38,
    backgroundColor: Palette.primarySoft,
  },
  modeBadgeText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
    color: Palette.blueGrey,
  },
  modeBadgeTextLowVision: {
    fontSize: 16,
    color: Palette.primary,
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
  flowIconLarge: {
    width: 40,
    height: 40,
  },
  flowPillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: Palette.text,
    textAlign: 'center',
  },
  flowPillTextLarge: {
    fontSize: 14,
    lineHeight: 19,
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
  startTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
    color: Palette.text,
  },
  startTitleLowVision: {
    fontSize: 25,
    lineHeight: 32,
  },
  sectionRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
    color: Palette.text,
  },
  sectionTitleLowVision: {
    fontSize: 24,
    lineHeight: 31,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.primary,
  },
  sectionActionLowVision: {
    fontSize: 18,
  },
  emptyTimeline: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.subtle,
  },
  emptyTimelineLowVision: {
    minHeight: 174,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  emptyTitleLowVision: {
    fontSize: 21,
  },
  timeline: {
    gap: 10,
  },
  timelineCard: {
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
  timelineCardFirst: {
    borderColor: Palette.primarySoft,
  },
  timelineCardLowVision: {
    minHeight: 126,
    padding: 17,
  },
  timelineLeft: {
    width: 18,
    height: 68,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 6,
    backgroundColor: Palette.border,
  },
  timelineBody: {
    flex: 1,
    marginRight: 8,
  },
  timelineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timelineTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: Palette.text,
  },
  timelineTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  riskChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  riskChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  countChip: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceMuted,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
