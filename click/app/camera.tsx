import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconBadge, PrimaryButton, Screen, TopBar } from '@/components/app-ui';
import { StepIndicator } from '@/components/step-indicator';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import type { ItemCategory } from '@/types/medication';

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; prevItems?: string; recordId?: string }>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);

  const category: ItemCategory = params.category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';
  const isSupplement = category === '건강기능식품 라벨';

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
        <TopBar backLabel="홈" onBack={() => router.back()} />
        <View style={styles.permissionBox}>
          <IconBadge icon="camera-outline" tone="blue" size="lg" />
          <Text style={styles.permissionTitle}>카메라 권한이 필요해요</Text>
          <Text style={styles.permissionDesc}>
            약 봉투와 건강기능식품 라벨을 촬영할 수 있도록 접근을 허용해 주세요.
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
      const photo = await cameraRef.current?.takePictureAsync();
      if (!photo?.uri) return;
      router.push({
        pathname: '/result',
        params: {
          photoUri: photo.uri,
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
        <View style={styles.bottomControls}>
          <Pressable style={styles.shutterOuter} onPress={takePicture} disabled={taking}>
            {taking ? <ActivityIndicator color={Palette.primary} /> : <View style={styles.shutterInner} />}
          </Pressable>
          <Text style={styles.shutterHint}>흔들리지 않게 정면에서 촬영해 주세요</Text>
        </View>
      }>
      <StatusBar style="dark" />
      <TopBar
        title={isSupplement ? '건강기능식품 촬영' : '알약 촬영'}
        subtitle={isSupplement ? '제품명과 성분표가 보이도록 라벨을 담아주세요.' : '알약 앞면과 포장 정보를 또렷하게 담아주세요.'}
        backLabel="뒤로"
        onBack={() => router.back()}
      />
      <StepIndicator current={isSupplement ? 2 : 1} />

      <View style={styles.cameraSection}>
        <View style={styles.cameraShell}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <View style={styles.frameGuide}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
        </View>
      </View>

      <View style={styles.tipCard}>
        <IconBadge icon={isSupplement ? 'text' : 'sparkles'} tone={isSupplement ? 'green' : 'blue'} size="sm" />
        <View style={styles.tipTextWrap}>
          <Text style={styles.tipTitle}>{isSupplement ? '라벨 글자가 중요해요' : '여러 알약도 한 번에 가능해요'}</Text>
          <Text style={styles.tipBody}>
            {isSupplement ? '성분명과 함량 부분이 잘리지 않게 촬영하면 확인이 쉬워집니다.' : '인식 결과는 다음 화면에서 직접 수정할 수 있습니다.'}
          </Text>
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
  permissionDesc: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  cameraSection: {
    paddingHorizontal: Spacing.screen,
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
    flex: 1,
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
    marginTop: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
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
  tipBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textMuted,
    marginTop: 2,
  },
  bottomControls: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 16,
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
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Palette.primary,
  },
  shutterHint: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMuted,
  },
});
