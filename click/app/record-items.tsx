import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, Screen, TopBar } from '@/components/app-ui';
import { RecognizedItemRow } from '@/components/recognized-item-row';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { formatRecordDateTime, getSession } from '@/services/history-storage';
import { categoryLabel, translate, useI18n } from '@/services/i18n';
import type { AnalysisSession, ItemCategory } from '@/types/medication';

const CATEGORIES: ItemCategory[] = ['알약', '건강기능식품 라벨'];

/**
 * 메인 화면의 최근 기록을 눌렀을 때 이동하는 상세 화면.
 * 결과(주의/위험 설명)는 보여주지 않고, 이번 분석에 사용한
 * 처방약·건강기능식품 목록만 확인할 수 있다.
 */
export default function RecordItemsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [record, setRecord] = useState<AnalysisSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { lowVision } = useUserMode();
  const { language, t } = useI18n();

  useEffect(() => {
    let active = true;
    getSession(id ?? '').then((data) => {
      if (!active) return;
      setRecord(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const groups = useMemo(() => {
    if (!record) return [];
    return CATEGORIES.map((category) => ({
      category,
      items: record.items.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [record]);

  return (
    <Screen>
      <StatusBar style="dark" />
      <TopBar
        title={record ? formatRecordDateTime(record.createdAt, language) : t('record')}
        subtitle={t('usedItemsTitle')}
        backLabel={t('home')}
        onBack={() => router.back()}
      />

      {loading ? null : !record ? (
        <View style={styles.empty}>
          <IconBadge icon="document-outline" tone="dark" size="lg" />
          <Text style={styles.emptyText}>{t('recordNotFound')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, lowVision && styles.contentLowVision]} showsVerticalScrollIndicator={false}>
          {groups.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>{t('noRecognizedItems')}</Text>
            </View>
          ) : (
            groups.map((group) => {
              const isSupplement = group.category === '건강기능식품 라벨';
              return (
                <View key={group.category} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <IconBadge icon={isSupplement ? 'leaf' : 'medical'} tone={isSupplement ? 'green' : 'blue'} size="sm" />
                    <Text style={[styles.groupTitle, lowVision && styles.groupTitleLowVision]} numberOfLines={2}>
                      {categoryLabel(group.category, language)}
                    </Text>
                    <Text style={[styles.groupCount, lowVision && styles.groupCountLowVision]}>
                      {translate(language, 'itemsCount', { count: group.items.length })}
                    </Text>
                  </View>
                  <View style={styles.itemList}>
                    {group.items.map((item) => (
                      <RecognizedItemRow key={item.id} item={item} />
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 36,
    gap: 20,
  },
  contentLowVision: {
    gap: 22,
  },
  group: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: Palette.text,
  },
  groupTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  groupCount: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  groupCountLowVision: {
    fontSize: 17,
  },
  itemList: {
    gap: 10,
  },
  emptyItems: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surface,
  },
  emptyItemsText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingBottom: 80,
  },
  emptyText: {
    ...Typography.body,
    color: Palette.textMuted,
  },
});
