import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, Screen, TopBar } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { clearLogs, subscribeLogs, type LogEntry } from '@/services/debug-log';
import { getSettings, saveSettings, type UserMode } from '@/services/settings-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<UserMode>('standard');
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const unsubscribe = subscribeLogs((entries) => {
        if (active) setLogs(entries);
      });
      getSettings().then((settings) => {
        if (active) {
          setMode(settings.mode);
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

  const showComingSoon = (title: string) => {
    Alert.alert(title, '백엔드 연결 후 설정할 수 있어요.');
  };

  return (
    <Screen>
      <StatusBar style="dark" />
      <TopBar title="설정" backLabel="홈" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>사용 모드</Text>
          <View style={styles.modeGrid}>
            <ModeOption title="일반" body="요양사 · 보호자" active={mode === 'standard'} onPress={() => changeMode('standard')} />
            <ModeOption title="저시력자" body="큰 버튼 · 높은 대비" active={mode === 'lowVision'} onPress={() => changeMode('lowVision')} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>처방전·약봉투 인식</Text>
          <Text style={styles.infoText}>약품명과 용량을 읽고 성분명을 찾아 상호작용 분석에 사용합니다.</Text>
        </View>

        <View style={styles.menuCard}>
          <MenuRow icon="text" title="글자 크기" value={mode === 'lowVision' ? '크게' : '기본'} />
          <MenuRow icon="contrast" title="화면 대비" value={mode === 'lowVision' ? '높음' : '기본'} />
          <MenuRow icon="bug" title="진단 로그" value={`${logs.length}개`} onPress={() => setLogsOpen(true)} />
          <MenuRow icon="notifications" title="복용 알림" value="준비 중" onPress={() => showComingSoon('복용 알림')} />
          <MenuRow icon="share-social" title="보호자 공유" value="준비 중" onPress={() => showComingSoon('보호자 공유')} />
        </View>
      </ScrollView>

      <Modal visible={logsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLogsOpen(false)}>
        <Screen>
          <TopBar title="진단 로그" backLabel="닫기" onBack={() => setLogsOpen(false)} />
          <View style={styles.logActions}>
            <Pressable style={styles.logActionButton} onPress={() => clearLogs()} accessibilityRole="button">
              <Text style={styles.logActionText}>로그 지우기</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.logContent}>
            {logs.length === 0 ? (
              <Text style={styles.emptyLogText}>아직 로그가 없어요.</Text>
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
      accessibilityLabel={`${title} 모드`}>
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
    fontWeight: '900',
    color: Palette.text,
    marginBottom: 12,
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
    fontWeight: '900',
    color: Palette.text,
  },
  modeTitleActive: {
    color: Palette.primary,
  },
  modeBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Palette.textMuted,
    marginTop: 4,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
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
    fontWeight: '900',
    color: Palette.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '800',
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
    fontWeight: '900',
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
