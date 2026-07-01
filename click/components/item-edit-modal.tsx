import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
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
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const CATEGORIES: ItemCategory[] = ['알약', '건강기능식품 라벨'];

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  알약: '알약',
  '건강기능식품 라벨': '건강기능식품',
};

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
  const isNew = initial === null;
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [category, setCategory] = useState<ItemCategory>('알약');

  // 모달이 열릴 때마다 대상 항목 값으로 초기화
  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setDosage(initial?.dosage ?? '');
      setCategory(initial?.category ?? initialCategory);
    }
  }, [visible, initial, initialCategory]);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id ?? '',
      name: name.trim(),
      dosage: dosage.trim(),
      category,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}>
        <View style={[styles.sheet, lowVision && styles.sheetLowVision]}>
          <View style={styles.handle} />
          <Text style={[styles.sheetTitle, lowVision && styles.sheetTitleLowVision]}>{isNew ? '항목 추가' : '항목 수정'}</Text>

          {/* 이름 */}
          <Text style={[styles.label, lowVision && styles.labelLowVision]}>이름</Text>
          <TextInput
            style={[styles.input, lowVision && styles.inputLowVision]}
            value={name}
            onChangeText={setName}
            placeholder="예: 아스피린"
            placeholderTextColor="#B6C0C6"
            autoFocus={isNew}
            accessibilityLabel="항목 이름"
          />

          {/* 용량 */}
          <Text style={[styles.label, lowVision && styles.labelLowVision]}>용량</Text>
          <TextInput
            style={[styles.input, lowVision && styles.inputLowVision]}
            value={dosage}
            onChangeText={setDosage}
            placeholder="예: 100mg"
            placeholderTextColor="#B6C0C6"
            accessibilityLabel="용량"
          />

          {/* 분류 */}
          <Text style={[styles.label, lowVision && styles.labelLowVision]}>분류</Text>
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
                  accessibilityLabel={`${CATEGORY_LABEL[cat]} 선택`}>
                  <Text style={[styles.categoryText, lowVision && styles.categoryTextLowVision, active && styles.categoryTextActive]}>
                    {CATEGORY_LABEL[cat]}
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
            accessibilityLabel="항목 저장">
            <Text style={[styles.saveText, lowVision && styles.saveTextLowVision]}>저장</Text>
          </Pressable>

          {/* 삭제 (수정 모드에서만) */}
          {!isNew && onDelete && (
            <Pressable
              style={[styles.deleteButton, lowVision && styles.deleteButtonLowVision]}
              onPress={() => onDelete(initial!.id)}
              accessibilityRole="button"
              accessibilityLabel="이 항목 삭제">
              <Ionicons name="trash-outline" size={lowVision ? 22 : 18} color="#E5484D" />
              <Text style={[styles.deleteText, lowVision && styles.deleteTextLowVision]}>이 항목 삭제</Text>
            </Pressable>
          )}
        </View>
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
  sheetTitle: {
    ...Typography.section,
    color: Palette.text,
    marginBottom: 16,
  },
  sheetTitleLowVision: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '900',
    marginBottom: 14,
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
    fontWeight: '900',
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
    fontWeight: '800',
  },
  categoryTextActive: {
    color: Palette.primary,
    fontWeight: '800',
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
    fontWeight: '800',
  },
  saveTextLowVision: {
    fontSize: 21,
    fontWeight: '900',
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
    fontWeight: '900',
  },
});
