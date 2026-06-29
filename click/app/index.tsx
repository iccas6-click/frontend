import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionCard, IconBadge, PrimaryButton, Screen, SectionHeader } from '@/components/app-ui';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { getAllScans } from '@/services/history-storage';
import type { ScanRecord } from '@/types/medication';

export default function MainScreen() {
  const router = useRouter();
  const [latest, setLatest] = useState<ScanRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllScans().then((records) => {
        if (active) setLatest(records[0] ?? null);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Ionicons name="medical" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>CLICK</Text>
          </View>

          <Text style={styles.heroTitle}>약과 영양제 조합을 먼저 확인하세요</Text>
          <Text style={styles.heroSubtitle}>
            사진으로 인식하고, 복용 전 상담이 필요한 조합을 쉽게 정리합니다.
          </Text>

          <View style={styles.heroActions}>
            <PrimaryButton
              label="인식 시작하기"
              icon="camera"
              onPress={() => router.push({ pathname: '/reuse', params: { category: '알약' } })}
            />
            <Pressable style={styles.historyLink} onPress={() => router.push('/history')}>
              <Ionicons name="time-outline" size={18} color={Palette.primary} />
              <Text style={styles.historyLinkText}>분석 기록 보기</Text>
            </Pressable>
          </View>
        </View>

        <SectionHeader title="진행 방식" />
        <View style={styles.flow}>
          <FlowStep icon="scan" title="알약 인식" body="처방약이나 일반 의약품을 먼저 촬영합니다." />
          <FlowStep icon="leaf" title="건강기능식품 인식" body="영양제 라벨을 이어서 촬영합니다." />
          <FlowStep icon="shield-checkmark" title="상호작용 분석" body="수정한 목록으로 주의 조합을 확인합니다." />
        </View>

        <SectionHeader title="최근 기록" />
        {latest ? (
          <ActionCard
            icon="document-text"
            tone="dark"
            title={formatLatestTitle(latest)}
            subtitle={`${latest.analysis ? '분석 완료' : '인식만 저장됨'} · ${latest.items.length}개 항목`}
            onPress={() => router.push({ pathname: '/record', params: { id: latest.id } })}
          />
        ) : (
          <View style={styles.emptyRecord}>
            <IconBadge icon="folder-open" tone="dark" />
            <View style={styles.emptyTextWrap}>
              <Text style={styles.emptyTitle}>아직 기록이 없어요</Text>
              <Text style={styles.emptySubtitle}>첫 분석을 완료하면 여기에 누적됩니다.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function FlowStep({ icon, title, body }: { icon: 'scan' | 'leaf' | 'shield-checkmark'; title: string; body: string }) {
  return (
    <View style={styles.flowStep}>
      <IconBadge icon={icon} tone={icon === 'leaf' ? 'green' : 'blue'} size="sm" />
      <View style={styles.flowText}>
        <Text style={styles.flowTitle}>{title}</Text>
        <Text style={styles.flowBody}>{body}</Text>
      </View>
    </View>
  );
}

function formatLatestTitle(record: ScanRecord) {
  const d = new Date(record.createdAt);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 분석 기록`;
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.screen,
    paddingBottom: 40,
    gap: 18,
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
    gap: 10,
    marginBottom: 24,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
  },
  logoText: {
    fontSize: 19,
    fontWeight: '900',
    color: Palette.text,
  },
  heroTitle: {
    ...Typography.hero,
    color: Palette.text,
  },
  heroSubtitle: {
    ...Typography.body,
    color: Palette.textMuted,
    marginTop: 12,
  },
  heroActions: {
    marginTop: 24,
    gap: 12,
  },
  historyLink: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  historyLinkText: {
    color: Palette.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  flow: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 16,
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
  },
  flowText: {
    flex: 1,
    marginLeft: 12,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
  },
  flowBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textMuted,
    marginTop: 3,
  },
  emptyRecord: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
  },
  emptyTextWrap: {
    marginLeft: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    marginTop: 4,
  },
});
