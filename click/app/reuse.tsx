import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { getDemoRecognitionSets, type DemoRecognitionSet } from '@/services/demo-recognition';
import { createFlowMetric } from '@/services/flow-metrics';
import { getReusableSessions } from '@/services/history-storage';
import { categoryLabel, translate, useI18n, type AppLanguage } from '@/services/i18n';
import type { AnalysisSession, ItemCategory, RecognizedItem } from '@/types/medication';

export default function ReuseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; prevItems?: string; recordId?: string; mode?: string; flowId?: string }>();
  const category: ItemCategory = params.category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';
  const [records, setRecords] = useState<AnalysisSession[]>([]);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const { lowVision } = useUserMode();
  const { language, t } = useI18n();

  const prevItems = useMemo<RecognizedItem[]>(() => {
    if (!params.prevItems) return [];
    try {
      const parsed = JSON.parse(params.prevItems);
      return Array.isArray(parsed) ? (parsed as RecognizedItem[]) : [];
    } catch {
      return [];
    }
  }, [params.prevItems]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getReusableSessions(category).then((data) => {
        if (active) setRecords(data.slice(0, 8));
      });
      return () => {
        active = false;
      };
    }, [category]),
  );

  const isSupplement = category === '건강기능식품 라벨';
  const label = categoryLabel(category, language, 'capture');
  const usableRecords = isSupplement && params.recordId ? records.filter((record) => record.id !== params.recordId) : records;
  const demoSets = useMemo(() => getDemoRecognitionSets(category, language), [category, language]);

  const handleBack = () => {
    if (isSupplement && params.prevItems) {
      router.replace({
        pathname: '/result',
        params: {
          category: '알약',
          items: params.prevItems,
          recordId: params.recordId ?? '',
        },
      });
      return;
    }
    router.replace('/');
  };

  const startCamera = () => {
    const next = {
      pathname: '/camera',
      params: {
        category,
        prevItems: params.prevItems,
        recordId: params.recordId,
        flowId: params.flowId,
      },
    } as const;

    router.replace(next);
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('photoPermissionTitle'), t('photoPermissionBody'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.92,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    const flowId = params.flowId ?? await createFlowMetric(category, 'gallery');
    router.replace({
      pathname: '/result',
      params: {
        photoUri: result.assets[0].uri,
        photoSource: 'gallery',
        category,
        prevItems: params.prevItems,
        recordId: params.recordId,
        flowId,
      },
    });
  };

  const selectRecord = async (record: AnalysisSession) => {
    setRecordsOpen(false);
    const selectedItems = record.items.filter((item) => item.category === category);
    const flowId = params.flowId ?? await createFlowMetric(category, 'record');
    const next = {
      pathname: '/result',
      params: {
        category,
        prevItems: JSON.stringify(prevItems),
        items: JSON.stringify(selectedItems),
        recordId: params.recordId ?? '',
        flowId,
      },
    } as const;

    router.replace(next);
  };

  const selectDemo = async (demo: DemoRecognitionSet) => {
    setSamplesOpen(false);
    const flowId = params.flowId ?? await createFlowMetric(category, 'demo');
    router.replace({
      pathname: '/result',
      params: {
        category,
        prevItems: JSON.stringify(prevItems),
        items: JSON.stringify(demo.items),
        recordId: params.recordId ?? '',
        flowId,
      },
    });
  };

  return (
    <Screen
      bottom={
        <View style={styles.footer}>
          <PrimaryButton label={t('back')} variant="secondary" onPress={handleBack} />
        </View>
      }>
      <StatusBar style="dark" />
      <TopBar
        title={isSupplement ? t('addSupplement') : t('addPrescription')}
        backLabel={t('back')}
        onBack={handleBack}
      />
      <StepIndicator current={isSupplement ? 2 : 1} />

      <ScrollView contentContainerStyle={[styles.content, lowVision && styles.contentLowVision]} showsVerticalScrollIndicator={false}>
        <View style={styles.choiceHeader}>
          <Text style={[styles.choiceTitle, lowVision && styles.choiceTitleLowVision]}>{t('chooseAddMethod', { label })}</Text>
        </View>

        <View style={[styles.sourceRow, lowVision && styles.sourceRowLowVision]}>
          <Pressable
            style={({ pressed }) => [styles.captureCard, styles.sourceCard, lowVision && styles.choiceCardLowVision, pressed && styles.pressed]}
            onPress={startCamera}
            accessibilityRole="button"
            accessibilityLabel={t('captureNew', { label })}>
            <IconBadge icon="camera" tone="blue" />
            <Text style={[styles.sourceTitle, styles.captureTitle, lowVision && styles.choiceTitleTextLowVision]} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.74}>{t('captureNew', { label })}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.galleryCard, styles.sourceCard, lowVision && styles.choiceCardLowVision, pressed && styles.pressed]}
            onPress={pickFromGallery}
            accessibilityRole="button"
            accessibilityLabel={t('chooseFromGallery')}>
            <IconBadge icon="image" tone="blue" />
            <Text style={[styles.sourceTitle, styles.galleryTitle, lowVision && styles.choiceTitleTextLowVision]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>{t('chooseFromGallery')}</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.recordChoiceCard, lowVision && styles.choiceCardLowVision, pressed && styles.pressed]}
          onPress={() => setRecordsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('chooseFromRecords')}>
          <IconBadge icon="folder-open" tone="dark" />
          <View style={styles.recordChoiceText}>
            <Text style={[styles.recordChoiceTitle, lowVision && styles.choiceTitleTextLowVision]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>{t('chooseFromRecords')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Palette.textSubtle} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.sampleChoiceCard, lowVision && styles.choiceCardLowVision, pressed && styles.pressed]}
          onPress={() => setSamplesOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('loadSampleResults')}>
          <IconBadge icon="sparkles" tone="amber" />
          <View style={styles.recordChoiceText}>
            <Text style={[styles.sampleChoiceTitle, lowVision && styles.choiceTitleTextLowVision]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>{t('loadSampleResults')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Palette.amber} />
        </Pressable>

      </ScrollView>

      <Modal visible={recordsOpen} transparent animationType="slide" onRequestClose={() => setRecordsOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRecordsOpen(false)} />
        <View style={[styles.sheet, lowVision && styles.sheetLowVision]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, lowVision && styles.sheetTitleLowVision]}>{t('existingRecords', { label })}</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setRecordsOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={t('close')}>
              <Ionicons name="close" size={22} color={Palette.textMuted} />
            </Pressable>
          </View>

          {usableRecords.length === 0 ? (
            <View style={styles.empty}>
              <IconBadge icon="folder-open" tone="dark" size="lg" />
              <Text style={styles.emptyTitle}>{t('noReusableRecords', { label })}</Text>
              <Text style={styles.emptyBody}>{t('noReusableRecordsBody')}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.recordList} showsVerticalScrollIndicator={false}>
              {usableRecords.map((record) => (
                <ReuseCard key={record.id} record={record} category={category} lowVision={lowVision} language={language} onPress={() => selectRecord(record)} />
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal visible={samplesOpen} transparent animationType="slide" onRequestClose={() => setSamplesOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSamplesOpen(false)} />
        <View style={[styles.sheet, lowVision && styles.sheetLowVision]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, lowVision && styles.sheetTitleLowVision]}>{t('sampleResults', { label })}</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setSamplesOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={t('close')}>
              <Ionicons name="close" size={22} color={Palette.textMuted} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.recordList} showsVerticalScrollIndicator={false}>
            {demoSets.map((demo) => (
              <DemoCard key={demo.id} demo={demo} lowVision={lowVision} language={language} onPress={() => selectDemo(demo)} />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

function DemoCard({
  demo,
  onPress,
  lowVision,
  language,
}: {
  demo: DemoRecognitionSet;
  onPress: () => void;
  lowVision: boolean;
  language: AppLanguage;
}) {
  const isSupplement = demo.category === '건강기능식품 라벨';
  const names = demo.items.map((item) => item.name).join(', ');

  return (
    <Pressable
      style={({ pressed }) => [styles.recordCard, lowVision && styles.recordCardLowVision, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${demo.title}, ${translate(language, 'itemsCount', { count: demo.items.length })}`}>
      <IconBadge icon={isSupplement ? 'leaf' : 'medical'} tone={isSupplement ? 'green' : 'blue'} />
      <View style={styles.recordText}>
        <Text style={[styles.recordTitle, lowVision && styles.recordTitleLowVision]}>{demo.title}</Text>
        <Text style={[styles.recordMeta, lowVision && styles.recordMetaLowVision]}>{demo.subtitle} · {translate(language, 'itemsCount', { count: demo.items.length })}</Text>
        <Text style={[styles.recordNames, lowVision && styles.recordNamesLowVision]} numberOfLines={lowVision ? 2 : 1}>
          {names}
        </Text>
      </View>
      <View style={[styles.usePill, lowVision && styles.usePillLowVision]}>
        <Text style={[styles.usePillText, lowVision && styles.usePillTextLowVision]}>{translate(language, 'use')}</Text>
        <Ionicons name="chevron-forward" size={16} color={Palette.primary} />
      </View>
    </Pressable>
  );
}

function ReuseCard({
  record,
  category,
  onPress,
  lowVision,
  language,
}: {
  record: AnalysisSession;
  category: ItemCategory;
  onPress: () => void;
  lowVision: boolean;
  language: AppLanguage;
}) {
  const items = record.items.filter((item) => item.category === category);
  const names = items.map((item) => item.name).filter(Boolean);
  const shown = names.slice(0, 4);
  const rest = names.length - shown.length;
  const isSupplement = category === '건강기능식품 라벨';
  const namesText = shown.length
    ? shown.join(', ') + (rest > 0 ? ` ${translate(language, 'moreCount', { count: rest })}` : '')
    : translate(language, 'unknownItem');

  return (
    <Pressable
      style={({ pressed }) => [styles.recordCard, lowVision && styles.recordCardLowVision, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${categoryLabel(category, language)}, ${namesText}`}>
      <IconBadge icon={isSupplement ? 'leaf' : 'medical'} tone={isSupplement ? 'green' : 'blue'} />
      <View style={styles.recordText}>
        <Text style={[styles.recordNamesTitle, lowVision && styles.recordNamesTitleLowVision]} numberOfLines={3}>
          {namesText}
        </Text>
      </View>
      <View style={[styles.usePill, lowVision && styles.usePillLowVision]}>
        <Text style={[styles.usePillText, lowVision && styles.usePillTextLowVision]}>{translate(language, 'use')}</Text>
        <Ionicons name="chevron-forward" size={16} color={Palette.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 42,
    gap: 14,
  },
  contentLowVision: {
    gap: 12,
  },
  choiceHeader: {
    gap: 4,
  },
  choiceTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '600',
    color: Palette.text,
  },
  choiceTitleLowVision: {
    fontSize: 24,
    lineHeight: 31,
  },
  choiceBody: {
    ...Typography.body,
    color: Palette.textMuted,
  },
  choiceBodyLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
  captureCard: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Shadow.subtle,
  },
  sourceRow: {
    gap: 10,
  },
  sourceRowLowVision: {
    gap: 12,
  },
  sourceCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 11,
  },
  sourceTitle: {
    flex: 1,
    minWidth: 0,
  },
  choiceCardLowVision: {
    minHeight: 108,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  captureText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  captureTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  galleryCard: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Shadow.subtle,
  },
  galleryTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  choiceTitleTextLowVision: {
    fontSize: 22,
    lineHeight: 29,
  },
  captureBody: {
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 3,
  },
  choiceBodyTextLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
  contextCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  contextCardLowVision: {
    minHeight: 100,
    padding: 17,
  },
  contextText: {
    flex: 1,
    marginLeft: 14,
  },
  contextTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: Palette.text,
  },
  contextTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  contextBody: {
    ...Typography.body,
    color: Palette.textMuted,
    marginTop: 3,
  },
  contextBodyLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
  recordList: {
    paddingBottom: 22,
    gap: 10,
  },
  recordChoiceCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Shadow.subtle,
  },
  recordChoiceText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  recordChoiceTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: Palette.text,
  },
  sampleChoiceCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.amber,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Shadow.subtle,
  },
  sampleChoiceTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: Palette.text,
  },
  recordChoiceBody: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 3,
  },
  noteCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: Radius.md,
    backgroundColor: Palette.mintSoft,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  noteCardLowVision: {
    minHeight: 62,
    paddingVertical: 13,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  noteTextLowVision: {
    fontSize: 16,
    lineHeight: 23,
  },
  recordCard: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  recordCardLowVision: {
    minHeight: 116,
    padding: 17,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  recordText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  recordTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: Palette.text,
  },
  recordTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  recordMeta: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 3,
  },
  recordMetaLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
  recordNames: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textSubtle,
    marginTop: 6,
  },
  recordNamesLowVision: {
    fontSize: 16,
    lineHeight: 22,
  },
  recordNamesTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    color: Palette.text,
  },
  recordNamesTitleLowVision: {
    fontSize: 21,
    lineHeight: 29,
  },
  usePill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primarySoft,
  },
  usePillLowVision: {
    minHeight: 44,
    paddingLeft: 13,
    paddingRight: 10,
  },
  usePillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.primary,
  },
  usePillTextLowVision: {
    fontSize: 17,
  },
  empty: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  emptyTitle: {
    ...Typography.section,
    color: Palette.text,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyBody: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    backgroundColor: Palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sheetLowVision: {
    maxHeight: '78%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.borderStrong,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    color: Palette.text,
  },
  sheetTitleLowVision: {
    fontSize: 25,
    lineHeight: 32,
  },
  sheetSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
    marginTop: 3,
  },
  sheetSubtitleLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
  },
  footer: {
    paddingBottom: 8,
  },
});
