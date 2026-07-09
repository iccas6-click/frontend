import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { formatRecordDateTime, formatRecordMonth, getAllSessions } from '@/services/history-storage';
import { riskLabel, translate, useI18n, type AppLanguage } from '@/services/i18n';
import { getSettings, type AppSettings } from '@/services/settings-storage';
import type { AnalysisSession, RiskLevel } from '@/types/medication';

function countByCategory(record: AnalysisSession) {
  return {
    pill: record.items.filter((item) => item.category === '알약').length,
    supplement: record.items.filter((item) => item.category === '건강기능식품 라벨').length,
  };
}

function riskTone(level?: RiskLevel): 'red' | 'amber' | 'green' | 'dark' {
  if (level === 'danger') return 'red';
  if (level === 'caution') return 'amber';
  if (level === 'safe') return 'green';
  return 'dark';
}

function buildRecentGroups(records: AnalysisSession[], language: AppLanguage) {
  const groups: { title: string; records: AnalysisSession[] }[] = [];
  records.forEach((record) => {
    const title = formatRecordMonth(record.createdAt, language);
    const group = groups.find((item) => item.title === title);
    if (group) {
      group.records.push(record);
    } else {
      groups.push({ title, records: [record] });
    }
  });
  return groups;
}

export default function MainScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({ mode: 'standard', pillRecognizer: 'codeit', language: 'ko' });
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const { t } = useI18n();

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
  const language = settings.language;
  // 메인에는 위험·주의가 필요한 기록만 노출한다. (안전/미탐지 기록은 전체 기록 페이지에서 확인)
  const attentionRecords = useMemo(
    () => sessions.filter((session) => session.analysis?.overall === 'danger' || session.analysis?.overall === 'caution'),
    [sessions],
  );
  const [visibleRecentCount, setVisibleRecentCount] = useState(5);
  const recentRecords = useMemo(() => attentionRecords.slice(0, visibleRecentCount), [attentionRecords, visibleRecentCount]);
  const recentGroups = useMemo(() => buildRecentGroups(recentRecords, language), [recentRecords, language]);

  return (
    <Screen>
      <StatusBar style="dark" />
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.brandLeft}>
            <View style={styles.logoMark}>
              <Image source={require('@/assets/images/brand-wordmark.png')} style={styles.logoImage} contentFit="contain" />
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.modeBadge, lowVision && styles.modeBadgeLowVision]}>
              <Text style={[styles.modeBadgeText, lowVision && styles.modeBadgeTextLowVision]}>
                {lowVision ? t('lowVision') : t('standard')}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.settingsButton, lowVision && styles.settingsButtonLowVision, pressed && styles.pressed]}
              onPress={() => router.push({ pathname: '/settings' })}
              accessibilityRole="button"
              accessibilityLabel={t('openSettings')}>
              <Ionicons name="settings-outline" size={lowVision ? 25 : 22} color={Palette.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, lowVision && styles.contentLowVision]} showsVerticalScrollIndicator={false}>
        <View style={styles.flowStrip}>
          <FlowPill icon="medical" label={t('prescriptionRecognitionShort')} large={lowVision} />
          <FlowArrow large={lowVision} />
          <FlowPill icon="leaf" label={t('supplementRecognitionShort')} tone="green" large={lowVision} />
          <FlowArrow large={lowVision} />
          <FlowPill icon="shield-checkmark" label={t('interactionAnalysis')} tone="dark" large={lowVision} />
        </View>

        <View style={styles.startPanel}>
          <Text style={[styles.startTitle, lowVision && styles.startTitleLowVision]}>{t('oneMinuteCheck')}</Text>
          <PrimaryButton
            label={t('startRecognition')}
            icon="camera"
            onPress={() => router.push({ pathname: '/reuse', params: { category: '알약', mode: 'start' } })}
          />
        </View>

        <View style={[styles.tipCard, lowVision && styles.tipCardLowVision]}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb-outline" size={lowVision ? 20 : 17} color={Palette.primary} />
          </View>
          <Text style={[styles.tipText, lowVision && styles.tipTextLowVision]}>{t('heroTitle').replace(/\n/g, ' ')}</Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, lowVision && styles.sectionTitleLowVision]}>{t('recentRecords')}</Text>
          <Pressable onPress={() => router.push('/history')} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('historyTitle')}>
            <Text style={[styles.sectionAction, lowVision && styles.sectionActionLowVision]}>{t('all')}</Text>
          </Pressable>
        </View>

        {attentionRecords.length === 0 ? (
          <View style={[styles.emptyTimeline, lowVision && styles.emptyTimelineLowVision]}>
            <IconBadge icon="folder-open" tone="dark" />
            <Text style={[styles.emptyTitle, lowVision && styles.emptyTitleLowVision]}>{t('noRecordsYet')}</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {recentGroups.map((group) => (
              <View key={group.title} style={styles.recentGroup}>
                <Text style={[styles.recentMonthTitle, lowVision && styles.recentMonthTitleLowVision]}>{group.title}</Text>
                {group.records.map((record, index) => (
                  <TimelineCard
                    key={record.id}
                    record={record}
                    first={index === 0}
                    lowVision={lowVision}
                    language={language}
                    onPress={() => router.push({ pathname: '/record-items', params: { id: record.id } })}
                  />
                ))}
              </View>
            ))}
            {attentionRecords.length > visibleRecentCount ? (
              <Pressable
                style={({ pressed }) => [styles.moreButton, lowVision && styles.moreButtonLowVision, pressed && styles.pressed]}
                onPress={() => setVisibleRecentCount((count) => count + 5)}
                accessibilityRole="button">
                <Text style={[styles.moreButtonText, lowVision && styles.moreButtonTextLowVision]}>{t('showMoreFive')}</Text>
              </Pressable>
            ) : null}
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
      <Text style={[styles.flowPillText, large && styles.flowPillTextLarge]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function FlowArrow({ large }: { large?: boolean }) {
  return (
    <View style={[styles.flowArrow, large && styles.flowArrowLarge]}>
      <Ionicons name="chevron-forward" size={16} color={Palette.textSubtle} />
    </View>
  );
}

function TimelineCard({
  record,
  first,
  lowVision,
  language,
  onPress,
}: {
  record: AnalysisSession;
  first: boolean;
  lowVision: boolean;
  language: AppLanguage;
  onPress: () => void;
}) {
  const counts = countByCategory(record);
  const level = record.analysis?.overall;
  return (
    <Pressable
      style={({ pressed }) => [styles.timelineCard, lowVision && styles.timelineCardLowVision, first && styles.timelineCardFirst, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${formatRecordDateTime(record.createdAt, language)}, ${riskLabel(level, language)}`}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: Palette[riskTone(level) === 'red' ? 'rose' : riskTone(level) === 'amber' ? 'amber' : riskTone(level) === 'green' ? 'mint' : 'blueGrey'] }]} />
        <View style={styles.timelineLine} />
      </View>
      <View style={styles.timelineBody}>
        <View style={styles.timelineTop}>
          <Text style={[styles.timelineTitle, lowVision && styles.timelineTitleLowVision]}>
            {formatRecordDateTime(record.createdAt, language)}
          </Text>
          <RiskChip level={level} language={language} />
        </View>
        <View style={styles.countRow}>
          <CountChip icon="medical" label={translate(language, 'prescriptionCount', { count: counts.pill })} />
          <CountChip icon="leaf" label={translate(language, 'supplementCount', { count: counts.supplement })} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={lowVision ? 22 : 19} color={Palette.textSubtle} />
    </Pressable>
  );
}

function RiskChip({ level, language }: { level?: RiskLevel; language: AppLanguage }) {
  const tone = riskTone(level);
  const color = tone === 'red' ? Palette.rose : tone === 'amber' ? Palette.amber : tone === 'green' ? Palette.mint : Palette.blueGrey;
  const backgroundColor = tone === 'red' ? Palette.roseSoft : tone === 'amber' ? Palette.amberSoft : tone === 'green' ? Palette.mintSoft : Palette.surfaceMuted;
  return (
    <View style={[styles.riskChip, { backgroundColor }]}>
      <Text style={[styles.riskChipText, { color }]}>{riskLabel(level, language)}</Text>
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
    width: 150,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  logoImage: {
    width: 150,
    height: 52,
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
    fontWeight: '600',
    color: Palette.blueGrey,
  },
  modeBadgeTextLowVision: {
    fontSize: 16,
    color: Palette.primary,
  },
  flowStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  flowArrow: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowArrowLarge: {
    height: 40,
  },
  flowPillText: {
    fontSize: 12,
    lineHeight: 16,
    minHeight: 32,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'center',
  },
  flowPillTextLarge: {
    fontSize: 14,
    lineHeight: 19,
    minHeight: 38,
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
    fontWeight: '600',
    color: Palette.text,
  },
  startTitleLowVision: {
    fontSize: 25,
    lineHeight: 32,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Palette.primarySoft,
  },
  tipCardLowVision: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: Palette.primary,
  },
  tipTextLowVision: {
    fontSize: 16,
    lineHeight: 23,
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
    fontWeight: '600',
    color: Palette.text,
  },
  sectionTitleLowVision: {
    fontSize: 24,
    lineHeight: 31,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: '700',
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
    fontWeight: '600',
    color: Palette.textMuted,
  },
  emptyTitleLowVision: {
    fontSize: 21,
  },
  timeline: {
    gap: 10,
  },
  recentGroup: {
    gap: 8,
  },
  recentMonthTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: Palette.text,
    marginTop: 2,
  },
  recentMonthTitleLowVision: {
    fontSize: 22,
    lineHeight: 29,
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: Palette.textMuted,
  },
  moreButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  moreButtonLowVision: {
    minHeight: 58,
  },
  moreButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primary,
  },
  moreButtonTextLowVision: {
    fontSize: 18,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
