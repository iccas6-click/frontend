import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Shadow } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { useI18n } from '@/services/i18n';
import type { RecognizedItem } from '@/types/medication';

function fallbackIngredients(item: RecognizedItem, fallback: string) {
  if (item.ingredients?.length) return item.ingredients.join(', ');
  return fallback;
}

function imageSource(imageUri: RecognizedItem['imageUri']) {
  return typeof imageUri === 'number' ? imageUri : { uri: imageUri };
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
  const { t } = useI18n();
  const isSupplement = item.category === '건강기능식품 라벨';
  const icon = isSupplement ? 'leaf' : 'medical';
  const iconColor = isSupplement ? Palette.mint : Palette.primary;
  const iconBg = isSupplement ? Palette.mintSoft : Palette.primarySoft;
  const content = (
    <>
      <View style={[styles.thumb, lowVision && styles.thumbLowVision, { backgroundColor: iconBg }]}>
        {item.imageUri ? (
          <Image source={imageSource(item.imageUri)} style={styles.image} contentFit="cover" />
        ) : (
          <Ionicons name={icon} size={lowVision ? 26 : 22} color={iconColor} />
        )}
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.name, lowVision && styles.nameLowVision]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.dose, lowVision && styles.doseLowVision]} numberOfLines={2}>
          {item.dosage || (isSupplement ? t('supplementNeedsIngredient') : t('noDosageInfo'))}
        </Text>
        {item.administration ? (
          <Text style={[styles.administration, lowVision && styles.administrationLowVision]} numberOfLines={2}>
            {t('administration')}: {item.administration}
          </Text>
        ) : null}
        <Text style={[styles.ingredients, lowVision && styles.ingredientsLowVision]} numberOfLines={2}>
          {t('ingredients')}: {fallbackIngredients(item, t('noIngredientInfo'))}
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
    minHeight: 108,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
    ...Shadow.subtle,
  },
  rowLowVision: {
    minHeight: 132,
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
    fontWeight: '700',
    color: Palette.text,
  },
  nameLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  dose: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
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
    fontWeight: '600',
    color: Palette.textSubtle,
    marginTop: 1,
  },
  administration: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: Palette.textMuted,
    marginTop: 1,
  },
  administrationLowVision: {
    fontSize: 16,
    lineHeight: 22,
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
