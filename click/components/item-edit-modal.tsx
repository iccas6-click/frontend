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

import { Brand } from '@/constants/theme';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const CATEGORIES: ItemCategory[] = ['약물', '건강기능식품'];

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
  const [category, setCategory] = useState<ItemCategory>('약물');

  // 모달이 열릴 때마다 대상 항목 값으로 초기화
  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setDosage(initial?.dosage ?? '');
      setCategory(initial?.category ?? '약물');
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E5E8',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.textDark,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.textMuted,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E3E8EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Brand.textDark,
    backgroundColor: '#FAFBFC',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8EB',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  categoryChipActive: {
    borderColor: Brand.primary,
    backgroundColor: '#E9F8FA',
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.textMuted,
  },
  categoryTextActive: {
    color: Brand.primary,
    fontWeight: '800',
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: Brand.primary,
    borderRadius: 14,
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
    color: '#E5484D',
    fontSize: 15,
    fontWeight: '700',
  },
});
