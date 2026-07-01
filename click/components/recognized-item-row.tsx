import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Shadow } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import type { RecognizedItem } from '@/types/medication';

function fallbackIngredients(item: RecognizedItem) {
  if (item.ingredients?.length) return item.ingredients.join(', ');
  const name = item.name.toLowerCase();
  if (name.includes('아스피린')) return '아세틸살리실산';
  if (name.includes('리피토')) return '아토르바스타틴';
  if (name.includes('오메가')) return 'EPA, DHA';
  if (name.includes('비타민 d')) return '콜레칼시페롤';
  return item.category === '알약' ? '성분 확인 예정' : '주요 성분 확인 예정';
}

export function RecognizedItemRow({
  item,
  onPress,
  editable = false,
}: {
  item: RecognizedItem;
  onPress?: () => void;
  editable?: boolean;
}) {
  const { lowVision } = useUserMode();
  const isSupplement = item.category === '건강기능식품 라벨';
  const icon = isSupplement ? 'leaf' : 'medical';
  const iconColor = isSupplement ? Palette.mint : Palette.primary;
  const iconBg = isSupplement ? Palette.mintSoft : Palette.primarySoft;
  const content = (
    <>
      <View style={[styles.thumb, lowVision && styles.thumbLowVision, { backgroundColor: iconBg }]}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.image} contentFit="cover" />
        ) : (
          <Ionicons name={icon} size={lowVision ? 26 : 22} color={iconColor} />
        )}
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.name, lowVision && styles.nameLowVision]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.dose, lowVision && styles.doseLowVision]} numberOfLines={1}>
          {item.dosage || '용량 미입력'}
        </Text>
        <Text style={[styles.ingredients, lowVision && styles.ingredientsLowVision]} numberOfLines={1}>
          성분: {fallbackIngredients(item)}
        </Text>
      </View>
      {editable ? <Ionicons name="create-outline" size={lowVision ? 23 : 19} color={Palette.textSubtle} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          lowVision && styles.rowLowVision,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}${item.dosage ? `, ${item.dosage}` : ''}`}>
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.row,
        lowVision && styles.rowLowVision,
      ]}
      accessibilityLabel={`${item.name}${item.dosage ? `, ${item.dosage}` : ''}`}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
    ...Shadow.subtle,
  },
  rowLowVision: {
    minHeight: 112,
    padding: 16,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbLowVision: {
    width: 68,
    height: 68,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: Palette.text,
  },
  nameLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  dose: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: Palette.textMuted,
    marginTop: 2,
  },
  doseLowVision: {
    fontSize: 17,
    lineHeight: 23,
  },
  ingredients: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: Palette.textSubtle,
    marginTop: 1,
  },
  ingredientsLowVision: {
    fontSize: 16,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
