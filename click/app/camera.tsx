import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { useI18n } from '@/services/i18n';
import type { ItemCategory } from '@/types/medication';

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; prevItems?: string; recordId?: string }>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);
  const { height, width } = useWindowDimensions();
  const { lowVision } = useUserMode();
  const { t } = useI18n();

  const category: ItemCategory = params.category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';
  const isSupplement = category === '건강기능식품 라벨';
  const compact = height < 760;
  const cameraFrameHeight = Math.min(width - (compact ? 116 : Spacing.screen * 2), compact ? 278 : height < 860 ? 306 : 340);

  const handleBack = () => {
    router.replace({
      pathname: '/reuse',
      params: {
        category,
        prevItems: params.prevItems,
        recordId: params.recordId,
      },
    });
  };

  if (!permission) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <StatusBar style="dark" />
        <TopBar backLabel={t('back')} onBack={handleBack} />
        <View style={styles.permissionBox}>
          <IconBadge icon="camera-outline" tone="blue" size="lg" />
          <Text style={[styles.permissionTitle, lowVision && styles.permissionTitleLowVision]}>{t('cameraPermissionTitle')}</Text>
          <Text style={[styles.permissionDesc, lowVision && styles.permissionDescLowVision]}>
            {t('cameraPermissionBody')}
          </Text>
          <PrimaryButton label={t('allowPermission')} icon="lock-open" onPress={requestPermission} />
        </View>
      </Screen>
    );
  }

  const takePicture = async () => {
    if (taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        exif: false,
        skipProcessing: false,
      });
      if (!photo?.uri) return;
      router.replace({
        pathname: '/result',
        params: {
          photoUri: photo.uri,
          photoSource: 'camera',
          category,
          prevItems: params.prevItems,
          recordId: params.recordId,
        },
      });
    } catch (e) {
      Alert.alert(t('cameraError'), String(e));
    } finally {
      setTaking(false);
    }
  };

  return (
    <Screen
      bottom={
        <View style={[styles.bottomControls, lowVision && styles.bottomControlsLowVision]}>
          <Pressable
            style={[styles.shutterOuter, lowVision && styles.shutterOuterLowVision]}
            onPress={takePicture}
            disabled={taking}
            accessibilityRole="button"
            accessibilityLabel={isSupplement ? t('captureSupplementA11y') : t('capturePrescriptionA11y')}
            accessibilityState={{ disabled: taking }}>
            {taking ? <ActivityIndicator color={Palette.primary} /> : <View style={[styles.shutterInner, lowVision && styles.shutterInnerLowVision]} />}
          </Pressable>
          {compact ? null : <Text style={[styles.shutterHint, lowVision && styles.shutterHintLowVision]}>{t('steadyShotHint')}</Text>}
        </View>
      }>
      <StatusBar style="dark" />
      <CaptureHeader
        title={isSupplement ? t('captureSupplementTitle') : t('capturePrescriptionTitle')}
        subtitle={isSupplement ? t('captureSupplementGuide') : t('capturePrescriptionGuide')}
        backLabel={t('back')}
        lowVision={lowVision}
        onBack={handleBack}
      />
      <StepIndicator current={isSupplement ? 2 : 1} compact />

      <View style={[styles.captureContent, compact && styles.captureContentCompact, lowVision && styles.captureContentLowVision]}>
        <View style={[styles.cameraSection, compact && styles.cameraSectionCompact]}>
          <View style={[styles.cameraShell, { height: cameraFrameHeight }]}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" selectedLens="builtInWideAngleCamera" zoom={0} />
            <View style={styles.frameGuide}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
          </View>
        </View>

        <View style={[styles.tipCard, compact && styles.tipCardCompact, lowVision && styles.tipCardLowVision]}>
          <IconBadge icon={isSupplement ? 'text' : 'document-text'} tone={isSupplement ? 'green' : 'blue'} size="sm" />
          <View style={styles.tipTextWrap}>
            <Text style={[styles.tipTitle, lowVision && styles.tipTitleLowVision]}>{isSupplement ? t('labelTipTitle') : t('pillTipTitle')}</Text>
            <Text style={[styles.tipBody, lowVision && styles.tipBodyLowVision]}>
              {isSupplement ? t('labelTipBody') : t('pillTipBody')}
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function CaptureHeader({
  title,
  subtitle,
  backLabel,
  lowVision,
  onBack,
}: {
  title: string;
  subtitle: string;
  backLabel: string;
  lowVision: boolean;
  onBack: () => void;
}) {
  return (
    <View style={[styles.captureHeader, lowVision && styles.captureHeaderLowVision]}>
      <Pressable style={styles.captureBackButton} onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel={backLabel}>
        <Ionicons name="chevron-back" size={22} color={Palette.primary} />
        <Text style={[styles.captureBackText, lowVision && styles.captureBackTextLowVision]}>{backLabel}</Text>
      </Pressable>
      <Text style={[styles.captureTitle, lowVision && styles.captureTitleLowVision]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.76}>
        {title}
      </Text>
      <Text style={[styles.captureSubtitle, lowVision && styles.captureSubtitleLowVision]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screen,
    gap: 14,
  },
  permissionTitle: {
    ...Typography.section,
    color: Palette.text,
    textAlign: 'center',
  },
  permissionTitleLowVision: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
  },
  permissionDesc: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionDescLowVision: {
    fontSize: 18,
    lineHeight: 26,
  },
  captureContent: {
    flex: 1,
    paddingBottom: 10,
  },
  captureContentCompact: {
    paddingBottom: 8,
  },
  captureContentLowVision: {
    paddingBottom: 10,
  },
  captureHeader: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 6,
    paddingBottom: 10,
  },
  captureHeaderLowVision: {
    paddingBottom: 9,
  },
  captureBackButton: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: -6,
    marginBottom: 6,
  },
  captureBackText: {
    color: Palette.primary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  captureBackTextLowVision: {
    fontSize: 18,
    lineHeight: 24,
  },
  captureTitle: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: 0,
  },
  captureTitleLowVision: {
    fontSize: 28,
    lineHeight: 34,
  },
  captureSubtitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    color: Palette.textMuted,
    marginTop: 7,
    letterSpacing: 0,
  },
  captureSubtitleLowVision: {
    fontSize: 16,
    lineHeight: 22,
  },
  cameraSection: {
    paddingHorizontal: Spacing.screen,
  },
  cameraSectionCompact: {
    paddingHorizontal: 58,
  },
  cameraShell: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: Radius.xl,
    backgroundColor: Palette.blueGrey,
    ...Shadow.card,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  frameGuide: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  cornerTopLeft: {
    position: 'absolute',
    left: 24,
    top: 24,
    width: 46,
    height: 46,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    position: 'absolute',
    right: 24,
    top: 24,
    width: 46,
    height: 46,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#FFFFFF',
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    width: 46,
    height: 46,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#FFFFFF',
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 46,
    height: 46,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#FFFFFF',
    borderBottomRightRadius: 10,
  },
  tipCard: {
    marginHorizontal: Spacing.screen,
    marginTop: 12,
    marginBottom: 0,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
  },
  tipCardCompact: {
    marginTop: 7,
    minHeight: 72,
    paddingVertical: 10,
  },
  tipCardLowVision: {
    minHeight: 84,
    padding: 15,
  },
  tipTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  tipTitleLowVision: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
  },
  tipBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textMuted,
    marginTop: 2,
  },
  tipBodyLowVision: {
    fontSize: 16,
    lineHeight: 23,
  },
  bottomControls: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  bottomControlsLowVision: {
    gap: 9,
    paddingBottom: 14,
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuterLowVision: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Palette.primary,
  },
  shutterInnerLowVision: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  shutterHint: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  shutterHintLowVision: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
  },
});
