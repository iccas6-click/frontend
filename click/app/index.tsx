import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { getAllSessions } from '@/services/history-storage';
import { useI18n, type AppLanguage } from '@/services/i18n';
import { getSettings, type AppSettings } from '@/services/settings-storage';
import type { AnalysisSession } from '@/types/medication';

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

  return (
    <Screen>
      <StatusBar style="dark" />
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.brandLeft}>
            <View style={styles.logoMark}>
              <Image 
                source={require('@/assets/images/click_2.png')} 
                style={styles.logoImage} 
                contentFit="contain" 
                contentPosition="left" 
              />
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
              <Ionicons name="settings-outline" size={lowVision ? 30 : 24} color={Palette.text} />
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

        {/* 외곽선이 제거된 전체 기록 보기 버튼 */}
        <Pressable
          style={({ pressed }) => [styles.viewAllButton, lowVision && styles.viewAllButtonLowVision, pressed && styles.pressed]}
          onPress={() => router.push('/history')}
          accessibilityRole="button"
        >
          <Ionicons name="list-outline" size={lowVision ? 32 : 24} color={Palette.background} />
          <Text style={[styles.viewAllButtonText, lowVision && styles.viewAllButtonTextLowVision]}>
                  {t('all_history') as unknown as string} </Text>
        </Pressable>

        {/* 안내 문구(Tip Card) 박스 */}
        <View style={[styles.tipCard, lowVision && styles.tipCardLowVision]}>
          <View style={[styles.tipIcon, lowVision && styles.tipIconLowVision]}>
            <Ionicons name="bulb-outline" size={lowVision ? 24 : 18} color={Palette.primary} />
          </View>
          <Text style={[styles.tipText, lowVision && styles.tipTextLowVision]}>{t('heroTitle').replace(/\n/g, ' ')}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function FlowPill({ icon, label, tone = 'blue', large }: { icon: 'medical' | 'leaf' | 'shield-checkmark'; label: string; tone?: 'blue' | 'green' | 'dark'; large?: boolean; }) {
  const color = tone === 'green' ? Palette.mint : tone === 'dark' ? Palette.blueGrey : Palette.primary;
  const backgroundColor = tone === 'green' ? Palette.mintSoft : tone === 'dark' ? Palette.surfaceMuted : Palette.primarySoft;
  return (
    <View style={styles.flowPill}>
      <View style={[styles.flowIcon, large && styles.flowIconLarge, { backgroundColor }]}>
        <Ionicons name={icon} size={large ? 24 : 18} color={color} />
      </View>
      <Text style={[styles.flowPillText, large && styles.flowPillTextLarge]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function FlowArrow({ large }: { large?: boolean }) {
  return (
    <View style={[styles.flowArrow, large && styles.flowArrowLarge]}>
      <Ionicons name="chevron-forward" size={large ? 22 : 16} color={Palette.textSubtle} />
    </View>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.screen, 
    paddingTop: 16, 
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  brandLeft: {
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0, 
  },
  logoMark: {
    width: 240, 
    maxWidth: '100%', 
    height: 64, 
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: -8, 
  },
  logoImage: {
    width: '100%', 
    height: '100%', 
  },
  settingsButton: {
    width: 48, 
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  settingsButtonLowVision: {
    width: 60, 
    height: 60,
    borderRadius: 30,
  },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  contentLowVision: {
    gap: 20, 
  },
  modeBadge: {
    minHeight: 34, 
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceMuted,
  },
  modeBadgeLowVision: {
    minHeight: 46, 
    paddingHorizontal: 16,
    backgroundColor: Palette.primarySoft,
  },
  modeBadgeText: {
    fontSize: 14, 
    lineHeight: 20,
    fontWeight: '600',
    color: Palette.blueGrey,
  },
  modeBadgeTextLowVision: {
    fontSize: 20, 
    color: Palette.primary,
  },
  flowStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8, 
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.subtle,
  },
  flowPill: {
    flexShrink: 1, 
    alignItems: 'center',
    gap: 6,
  },
  flowIcon: {
    width: 38, 
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowIconLarge: {
    width: 50, 
    height: 50,
    borderRadius: Radius.md,
  },
  flowArrow: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowArrowLarge: {
    height: 50,
  },
  flowPillText: {
    fontSize: 14, 
    lineHeight: 18,
    minHeight: 36,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'center',
  },
  flowPillTextLarge: {
    fontSize: 18, 
    lineHeight: 24,
    minHeight: 48,
  },
  startPanel: {
    gap: 16,
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 20,
    ...Shadow.card,
  },
  startTitle: {
    fontSize: 23, 
    lineHeight: 30,
    fontWeight: '600',
    color: Palette.text,
  },
  startTitleLowVision: {
    fontSize: 30, 
    lineHeight: 40,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: Palette.primarySoft,
  },
  tipCardLowVision: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  tipIcon: {
    width: 30, 
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
  },
  tipIconLowVision: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  tipText: {
    flex: 1,
    fontSize: 15, 
    lineHeight: 22,
    fontWeight: '600',
    color: Palette.primary,
  },
  tipTextLowVision: {
    fontSize: 20, 
    lineHeight: 28,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 60,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primary, // 배경색을 primary로 변경
    borderWidth: 0, // 외곽선 제거
    marginTop: 8,
    ...Shadow.card,
  },
  viewAllButtonLowVision: {
    minHeight: 80,
    borderRadius: Radius.xl,
  },
  viewAllButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.background, // 배경과 대비되는 색상으로 변경
  },
  viewAllButtonTextLowVision: {
    fontSize: 26,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});