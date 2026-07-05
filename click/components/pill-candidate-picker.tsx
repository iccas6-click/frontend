import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Shadow } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import type { RecognizedItem, RecognitionCandidate } from '@/types/medication';

function imageSource(imageUri: RecognitionCandidate['imageUri']) {
  return typeof imageUri === 'number' ? imageUri : { uri: imageUri };
}

function candidateSummary(candidate: RecognitionCandidate) {
  const ingredients = candidate.ingredients?.filter(Boolean) ?? [];
  if (ingredients.length > 0) return ingredients.slice(0, 2).join(', ');
  return '성분 정보 확인 필요';
}

function scoreLabel(score?: number) {
  if (typeof score !== 'number') return '';
  return `${Math.round(score)}%`;
}

export function pillItemFromCandidate(item: RecognizedItem, candidate: RecognitionCandidate): RecognizedItem {
  return {
    ...item,
    name: candidate.name,
    dosage: candidate.dosage,
    productName: candidate.productName,
    imageUri: candidate.imageUri,
    ingredients: candidate.ingredients,
    analysisNames: candidate.analysisNames,
    selectedCandidateId: candidate.id,
  };
}

export function PillCandidatePicker({
  item,
  onSelect,
  onEdit,
}: {
  item: RecognizedItem;
  onSelect: (candidate: RecognitionCandidate) => void;
  onEdit: () => void;
}) {
  const { lowVision } = useUserMode();
  const candidates = item.candidates?.slice(0, 3) ?? [];

  if (candidates.length === 0) {
    return null;
  }

  return (
    <View style={[styles.card, lowVision && styles.cardLowVision]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, lowVision && styles.headerTitleLowVision]}>
            후보 Top 3
          </Text>
          <Text style={[styles.headerMeta, lowVision && styles.headerMetaLowVision]}>
            사진과 가장 가까운 제품을 선택
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="직접 수정">
          <Ionicons name="create-outline" size={lowVision ? 22 : 18} color={Palette.textMuted} />
          <Text style={[styles.editText, lowVision && styles.editTextLowVision]}>수정</Text>
        </Pressable>
      </View>

      <View style={styles.options}>
        {candidates.map((candidate, index) => {
          const selected = item.selectedCandidateId
            ? item.selectedCandidateId === candidate.id
            : index === 0;
          return (
            <Pressable
              key={candidate.id}
              style={({ pressed }) => [
                styles.option,
                lowVision && styles.optionLowVision,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => onSelect(candidate)}
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}번 후보 ${candidate.name}`}>
              <View style={[styles.thumb, lowVision && styles.thumbLowVision]}>
                {candidate.imageUri ? (
                  <Image source={imageSource(candidate.imageUri)} style={styles.image} contentFit="cover" />
                ) : (
                  <Ionicons name="medical" size={lowVision ? 28 : 23} color={Palette.primary} />
                )}
              </View>
              <View style={styles.optionText}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, lowVision && styles.nameLowVision]} numberOfLines={1}>
                    {candidate.name}
                  </Text>
                  {scoreLabel(candidate.score) ? (
                    <Text style={[styles.score, selected && styles.scoreSelected]}>
                      {scoreLabel(candidate.score)}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.dosage, lowVision && styles.dosageLowVision]} numberOfLines={1}>
                  {candidate.dosage || '용량 정보 없음'}
                </Text>
                <Text style={[styles.ingredients, lowVision && styles.ingredientsLowVision]} numberOfLines={1}>
                  {candidateSummary(candidate)}
                </Text>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={lowVision ? 28 : 24}
                color={selected ? Palette.primary : Palette.borderStrong}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
    ...Shadow.subtle,
  },
  cardLowVision: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: Palette.text,
  },
  headerTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
  },
  headerMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: Palette.textMuted,
    marginTop: 1,
  },
  headerMetaLowVision: {
    fontSize: 16,
    lineHeight: 22,
  },
  editButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceMuted,
  },
  editText: {
    fontSize: 13,
    fontWeight: '900',
    color: Palette.textMuted,
  },
  editTextLowVision: {
    fontSize: 16,
  },
  options: {
    gap: 8,
  },
  option: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceMuted,
    padding: 10,
  },
  optionLowVision: {
    minHeight: 100,
    padding: 12,
  },
  optionSelected: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primarySoft,
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbLowVision: {
    width: 70,
    height: 70,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: Palette.text,
  },
  nameLowVision: {
    fontSize: 20,
    lineHeight: 27,
  },
  score: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
    color: Palette.textMuted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surface,
  },
  scoreSelected: {
    color: Palette.primary,
  },
  dosage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: Palette.textMuted,
    marginTop: 2,
  },
  dosageLowVision: {
    fontSize: 16,
    lineHeight: 22,
  },
  ingredients: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: Palette.textSubtle,
    marginTop: 1,
  },
  ingredientsLowVision: {
    fontSize: 15,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
