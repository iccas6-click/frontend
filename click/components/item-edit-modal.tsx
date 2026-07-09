import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Palette, Radius, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { categoryLabel, useI18n } from '@/services/i18n';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const CATEGORIES: ItemCategory[] = ['알약', '건강기능식품 라벨'];

type Props = {
  visible: boolean;
  /** 수정할 항목. null이면 새 항목 추가 모드 */
  initial: RecognizedItem | null;
  initialCategory?: ItemCategory;
  onClose: () => void;
  onSave: (item: RecognizedItem) => void;
  onDelete?: (id: string) => void;
};

export function ItemEditModal({ visible, initial, initialCategory = '알약', onClose, onSave, onDelete }: Props) {
  const { lowVision } = useUserMode();
  const { language, t } = useI18n();
  const isNew = initial === null;
  const slide = useRef(new Animated.Value(1)).current;
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [category, setCategory] = useState<ItemCategory>('알약');

  // 모달이 열릴 때마다 대상 항목 값으로 초기화
  useEffect(() => {
    if (visible) {
      slide.setValue(1);
      Animated.timing(slide, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      setName(initial?.name ?? '');
      setDosage(initial?.dosage ?? '');
      setIngredientsText(initial?.ingredients?.join(', ') ?? '');
      setCategory(initial?.category ?? initialCategory);
    }
  }, [visible, initial, initialCategory, slide]);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...initial,
      id: initial?.id ?? '',
      name: name.trim(),
      dosage: dosage.trim(),
      category,
      productName: initial?.productName ?? name.trim(),
      ingredients: ingredientsText
        .split(/[|,，/·ㆍ\n]+/)
        .map((value) => value.trim())
        .filter(Boolean),
      analysisNames: ingredientsText
        .split(/[|,，/·ㆍ\n]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}>
        <Animated.View
          style={[
            styles.sheet,
            lowVision && styles.sheetLowVision,
            { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [0, 420] }) }] },
          ]}>
          <View style={styles.handle} />
          
          <View style={styles.headerRow}>
            <Text style={[styles.sheetTitle, lowVision && styles.sheetTitleLowVision]}>{isNew ? t('addItem') : t('editItem')}</Text>
          </View>

          {/* 이름 */}
          <Text style={[styles.label, lowVision && styles.labelLowVision]}>{t('name')}</Text>
          <TextInput
            style={[styles.input, lowVision && styles.inputLowVision]}
            value={name}
            onChangeText={setName}
            placeholder={t('namePlaceholder')}
            placeholderTextColor="#B6C0C6"
            autoFocus={isNew}
            accessibilityLabel={t('itemName')}
          />

          {/* 용량 */}
          <Text style={[styles.label, lowVision && styles.labelLowVision]}>{t('dosage')}</Text>
          <TextInput
            style={[styles.input, lowVision && styles.inputLowVision]}
            value={dosage}
            onChangeText={setDosage}
            placeholder={t('dosagePlaceholder')}
            placeholderTextColor="#B6C0C6"
            accessibilityLabel={t('dosage')}
          />

          <Text style={[styles.label, lowVision && styles.labelLowVision]}>{t('ingredients')}</Text>
          <TextInput
            style={[styles.input, styles.ingredientsInput, lowVision && styles.inputLowVision]}
            value={ingredientsText}
            onChangeText={setIngredientsText}
            placeholder={t('ingredientsPlaceholder')}
            placeholderTextColor="#B6C0C6"
            multiline
            accessibilityLabel={t('ingredients')}
          />

          {/* 분류 */}
          <Text style={[styles.label, lowVision && styles.labelLowVision]}>{t('category')}</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, lowVision && styles.categoryChipLowVision, active && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={categoryLabel(cat, language)}>
                  <Text style={[styles.categoryText, lowVision && styles.categoryTextLowVision, active && styles.categoryTextActive]}>
                    {categoryLabel(cat, language)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 저장 */}
          <Pressable
            style={[styles.saveButton, lowVision && styles.saveButtonLowVision, !canSave && styles.saveButtonDisabled]}
            disabled={!canSave}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            accessibilityLabel={t('saveItem')}>
            <Text style={[styles.saveText, lowVision && styles.saveTextLowVision]}>{t('save')}</Text>
          </Pressable>

          {/* 삭제 (수정 모드에서만) */}
          {!isNew && onDelete && (
            <Pressable
              style={[styles.deleteButton, lowVision && styles.deleteButtonLowVision]}
              onPress={() => onDelete(initial!.id)}
              accessibilityRole="button"
              accessibilityLabel={t('deleteThisItem')}>
              <Ionicons name="trash-outline" size={lowVision ? 22 : 18} color="#E5484D" />
              <Text style={[styles.deleteText, lowVision && styles.deleteTextLowVision]}>{t('deleteThisItem')}</Text>
            </Pressable>
          )}

          {/* 뒤로 가기 (추가됨) */}
          <Pressable
            style={[styles.backButton, lowVision && styles.backButtonLowVision]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('back')}>
            <Ionicons name="arrow-back" size={lowVision ? 22 : 18} color={Palette.textMuted} />
            <Text style={[styles.backText, lowVision && styles.backTextLowVision]}>{t('back')}</Text>
          </Pressable>

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  sheetLowVision: {
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.borderStrong,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    ...Typography.section,
    color: Palette.text,
  },
  sheetTitleLowVision: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textMuted,
    marginTop: 12,
    marginBottom: 6,
  },
  labelLowVision: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
    color: Palette.text,
    backgroundColor: Palette.background,
  },
  inputLowVision: {
    minHeight: 58,
    fontSize: 20,
    paddingVertical: 15,
  },
  ingredientsInput: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    backgroundColor: Palette.background,
  },
  categoryChipLowVision: {
    minHeight: 60,
    justifyContent: 'center',
  },
  categoryChipActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primarySoft,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  categoryTextLowVision: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: Palette.primary,
    fontWeight: '700',
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonLowVision: {
    paddingVertical: 18,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  saveTextLowVision: {
    fontSize: 21,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  deleteButtonLowVision: {
    minHeight: 56,
  },
  deleteText: {
    color: Palette.rose,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteTextLowVision: {
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  backButtonLowVision: {
    minHeight: 56,
  },
  backText: {
    color: Palette.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  backTextLowVision: {
    fontSize: 18,
    fontWeight: '700',
  },
});
