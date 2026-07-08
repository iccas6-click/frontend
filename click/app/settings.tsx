import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, Screen, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { clearLogs, subscribeLogs, type LogEntry } from '@/services/debug-log';
import { LANGUAGE_OPTIONS, translate, type AppLanguage } from '@/services/i18n';
import { getSettings, saveSettings, type UserMode } from '@/services/settings-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<UserMode>('standard');
  const [language, setLanguage] = useState<AppLanguage>('ko');
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const t = useCallback(
    (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) => translate(language, key, vars),
    [language],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const unsubscribe = subscribeLogs((entries) => {
        if (active) setLogs(entries);
      });
      getSettings().then((settings) => {
        if (active) {
          setMode(settings.mode);
          setLanguage(settings.language);
        }
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  const changeMode = async (nextMode: UserMode) => {
    setMode(nextMode);
    await saveSettings({ mode: nextMode });
  };

  const changeLanguage = async (nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage);
    await saveSettings({ language: nextLanguage });
  };

  const showComingSoon = (title: string) => {
    Alert.alert(title, t('comingSoon'));
  };

  return (
    <Screen>
      <StatusBar style="dark" />
      <TopBar title={t('settings')} backLabel={t('home')} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('language')}</Text>
          <View style={styles.languageGrid}>
            {LANGUAGE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.languageOption,
                  language === option.value && styles.languageOptionActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => changeLanguage(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: language === option.value }}>
                <Text style={[styles.languageNative, language === option.value && styles.languageNativeActive]}>
                  {option.nativeLabel}
                </Text>
                <Text style={styles.languageLabel}>{translate(language, option.value === 'ko' ? 'korean' : option.value === 'en' ? 'english' : 'french')}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('mode')}</Text>
          <View style={styles.modeGrid}>
            <ModeOption title={t('standard')} body={t('standardBody')} active={mode === 'standard'} onPress={() => changeMode('standard')} />
            <ModeOption title={t('lowVision')} body={t('lowVisionBody')} active={mode === 'lowVision'} onPress={() => changeMode('lowVision')} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('prescriptionRecognition')}</Text>
          <Text style={styles.infoText}>{t('prescriptionRecognitionInfo')}</Text>
        </View>

        <View style={styles.menuCard}>
          <MenuRow icon="text" title={t('fontSize')} value={mode === 'lowVision' ? t('large') : t('default')} />
          <MenuRow icon="contrast" title={t('screenContrast')} value={mode === 'lowVision' ? t('high') : t('default')} />
          <MenuRow icon="bug" title={t('diagnosticLogs')} value={t('itemsCount', { count: logs.length })} onPress={() => setLogsOpen(true)} />
          <MenuRow icon="notifications" title={t('medicationReminder')} value={t('comingSoon')} onPress={() => showComingSoon(t('medicationReminder'))} />
          <MenuRow icon="share-social" title={t('caregiverSharing')} value={t('comingSoon')} onPress={() => showComingSoon(t('caregiverSharing'))} />
        </View>
      </ScrollView>

      <Modal visible={logsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLogsOpen(false)}>
        <Screen>
          <TopBar title={t('diagnosticLogs')} backLabel={t('close')} onBack={() => setLogsOpen(false)} />
          <View style={styles.logActions}>
            <Pressable style={styles.logActionButton} onPress={() => clearLogs()} accessibilityRole="button">
              <Text style={styles.logActionText}>{t('clearLogs')}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.logContent}>
            {logs.length === 0 ? (
              <Text style={styles.emptyLogText}>{t('noLogs')}</Text>
            ) : logs.slice().reverse().map((entry) => (
              <View key={entry.id} style={styles.logRow}>
                <Text style={styles.logTime}>{entry.time}</Text>
                <Text style={styles.logText}>{entry.text}</Text>
              </View>
            ))}
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
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
      accessibilityLabel={title}>
      <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>{title}</Text>
      <Text style={styles.modeBody}>{body}</Text>
    </Pressable>
  );
}

function MenuRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: 'text' | 'contrast' | 'bug' | 'notifications' | 'share-social';
  title: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && onPress ? styles.pressed : null]} onPress={onPress} disabled={!onPress}>
      <IconBadge icon={icon} tone={onPress ? 'blue' : 'dark'} size="sm" />
      <Text style={styles.menuTitle}>{title}</Text>
      <View style={styles.menuRight}>
        <Text style={styles.menuValue}>{value}</Text>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={Palette.textSubtle} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 36,
    gap: 14,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 18,
    ...Shadow.subtle,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: Palette.text,
    marginBottom: 12,
  },
  languageGrid: {
    gap: 8,
  },
  languageOption: {
    minHeight: 58,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  languageOptionActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primarySoft,
  },
  languageNative: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
    color: Palette.text,
  },
  languageNativeActive: {
    color: Palette.primary,
  },
  languageLabel: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  modeOption: {
    flex: 1,
    minHeight: 94,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    padding: 14,
  },
  modeOptionActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primarySoft,
  },
  modeTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: Palette.text,
  },
  modeTitleActive: {
    color: Palette.primary,
  },
  modeBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: Palette.textMuted,
    marginTop: 4,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  menuCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
    ...Shadow.subtle,
  },
  menuRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    paddingVertical: 12,
    gap: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Palette.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  logActions: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  logActionButton: {
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceMuted,
    paddingHorizontal: 14,
  },
  logActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
  },
  logContent: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 36,
    gap: 8,
  },
  emptyLogText: {
    paddingTop: 80,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  logRow: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    padding: 10,
    gap: 5,
  },
  logTime: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
  },
  logText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: Palette.text,
  },
  pressed: {
    opacity: 0.78,
  },
});
