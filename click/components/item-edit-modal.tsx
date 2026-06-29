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
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const CATEGORIES: ItemCategory[] = ['알약', '건강기능식품 라벨'];

type Props = {
  visible: boolean;
  /** 수정할 항목. null이면 새 항목 추가 모드 */
  initial: RecognizedItem | null;
  onClose: () => void;
  onSave: (item: RecognizedItem) => void;
  onDelete?: (id: string) => void;
};

export function ItemEditModal({ visible, initial, onClose, onSave, onDelete }: Props) {
  const isNew = initial === null;
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [category, setCategory] = useState<ItemCategory>('알약');

  // 모달이 열릴 때마다 대상 항목 값으로 초기화
  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setDosage(initial?.dosage ?? '');
      setCategory(initial?.category ?? '알약');
    }
  }, [visible, initial]);

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
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{isNew ? '항목 추가' : '항목 수정'}</Text>

          {/* 이름 */}
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="예: 아스피린"
            placeholderTextColor="#B6C0C6"
            autoFocus={isNew}
          />

          {/* 용량 */}
          <Text style={styles.label}>용량</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="예: 100mg"
            placeholderTextColor="#B6C0C6"
          />

          {/* 분류 */}
          <Text style={styles.label}>분류</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}>
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 저장 */}
          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            disabled={!canSave}
            onPress={handleSave}>
            <Text style={styles.saveText}>저장</Text>
          </Pressable>

          {/* 삭제 (수정 모드에서만) */}
          {!isNew && onDelete && (
            <Pressable style={styles.deleteButton} onPress={() => onDelete(initial!.id)}>
              <Ionicons name="trash-outline" size={18} color="#E5484D" />
              <Text style={styles.deleteText}>이 항목 삭제</Text>
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textMuted,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Palette.text,
    backgroundColor: Palette.background,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    backgroundColor: Palette.background,
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  deleteButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  deleteText: {
    color: Palette.rose,
    fontSize: 15,
    fontWeight: '700',
  },
});
