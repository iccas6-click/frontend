import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import type { ItemCategory } from '@/types/medication';

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; prevItems?: string; recordId?: string }>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);
  const { height } = useWindowDimensions();
  const { lowVision } = useUserMode();

  const category: ItemCategory = params.category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';
  const isSupplement = category === '건강기능식품 라벨';
  const compact = height < 760;

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
        <TopBar backLabel="뒤로" onBack={handleBack} />
        <View style={styles.permissionBox}>
          <IconBadge icon="camera-outline" tone="blue" size="lg" />
          <Text style={[styles.permissionTitle, lowVision && styles.permissionTitleLowVision]}>카메라 권한이 필요해요</Text>
          <Text style={[styles.permissionDesc, lowVision && styles.permissionDescLowVision]}>
            처방전, 약 봉투와 건강기능식품 라벨을 촬영할 수 있도록 접근을 허용해 주세요.
          </Text>
          <PrimaryButton label="권한 허용하기" icon="lock-open" onPress={requestPermission} />
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
      Alert.alert('촬영 오류', String(e));
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
            accessibilityLabel={`${isSupplement ? '건강기능식품' : '처방전 또는 약봉투'} 촬영하기`}
            accessibilityState={{ disabled: taking }}>
            {taking ? <ActivityIndicator color={Palette.primary} /> : <View style={[styles.shutterInner, lowVision && styles.shutterInnerLowVision]} />}
          </Pressable>
          {compact ? null : <Text style={[styles.shutterHint, lowVision && styles.shutterHintLowVision]}>흔들리지 않게 정면에서 촬영해 주세요</Text>}
        </View>
      }>
      <StatusBar style="dark" />
      <TopBar
        title={isSupplement ? '건강기능식품 촬영' : '처방전·약봉투 촬영'}
        subtitle={isSupplement ? '제품명과 성분표가 보이게 촬영하세요.' : '약품명·용량이 보이게 전체를 촬영하세요.'}
        subtitleNumberOfLines={1}
        backLabel="뒤로"
        onBack={handleBack}
      />
      <StepIndicator current={isSupplement ? 2 : 1} />

      <View style={[styles.cameraSection, compact && styles.cameraSectionCompact]}>
        <View style={styles.cameraShell}>
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
          <Text style={[styles.tipTitle, lowVision && styles.tipTitleLowVision]}>{isSupplement ? '라벨 글자가 중요해요' : '약품명이 보이게 촬영해요'}</Text>
          {!compact ? (
            <Text style={[styles.tipBody, lowVision && styles.tipBodyLowVision]}>
              {isSupplement ? '성분명과 함량 부분이 잘리지 않게 촬영하면 확인이 쉬워집니다.' : '처방전이나 약 봉투의 약 이름과 용량 부분이 선명하면 확인이 쉬워집니다.'}
            </Text>
          ) : null}
        </View>
      </View>
    </Screen>
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
    fontWeight: '900',
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
  cameraSection: {
    paddingHorizontal: Spacing.screen,
  },
  cameraSectionCompact: {
    paddingHorizontal: 58,
  },
  cameraShell: {
    width: '100%',
    aspectRatio: 1,
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
    marginBottom: 10, // 여백을 원래대로 복구했습니다.
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
    marginBottom: 2,
    minHeight: 56,
    paddingVertical: 8,
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
    fontWeight: '800',
    color: Palette.text,
  },
  tipTitleLowVision: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
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
    fontWeight: '900',
  },
});
