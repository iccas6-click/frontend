import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepIndicator } from '@/components/step-indicator';
import { analyzeImage } from '@/services/ocr';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

const APPLE_THEME = { background: '#F2F2F7', card: '#FFFFFF', textDark: '#1C1C1E', tintBlue: '#007AFF' };

export default function ResultScreen() {
  const router = useRouter();
  const { photoUri, category, prevItems } = useLocalSearchParams<{ photoUri?: string; category?: string; prevItems?: string }>();
  
  const parsedPrevItems: RecognizedItem[] = prevItems ? JSON.parse(prevItems) : [];
  const selectedCategory: ItemCategory = category === '건강기능식품 라벨' ? '건강기능식품 라벨' : '알약';

  const [items, setItems] = useState<RecognizedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analyzeImage(photoUri ?? '', selectedCategory);
      setItems(result);
    } finally { setLoading(false); }
  }, [photoUri, selectedCategory]);

  useEffect(() => { runAnalysis(); }, [runAnalysis]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}><Pressable onPress={() => router.back()}><Text style={styles.backText}>뒤로</Text></Pressable></View>
      <StepIndicator current={2} background={APPLE_THEME.background} />
      <ScrollView contentContainerStyle={styles.listContent}>
        {loading ? <ActivityIndicator size="large" /> : items.map((item, i) => <Text key={i}>{item.name}</Text>)}
      </ScrollView>
      <View style={styles.footer}>
        {selectedCategory === '알약' ? (
          <View style={{ gap: 12 }}>
            <Pressable style={styles.cta} onPress={() => router.push({ pathname: '/camera', params: { category: '건강기능식품 라벨', prevItems: JSON.stringify(items) } })}>
              <Text style={styles.ctaText}>건강기능식품 추가 촬영하기</Text>
            </Pressable>
            <Pressable style={styles.secondaryCta} onPress={() => router.push({ pathname: '/analyze', params: { items: JSON.stringify(items) } })}>
              <Text style={styles.secondaryCtaText}>이대로 알약만 분석</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.cta} onPress={() => { const finalItems = [...parsedPrevItems, ...items]; router.push({ pathname: '/analyze', params: { items: JSON.stringify(finalItems) } }); }}>
            <Text style={styles.ctaText}>최종 병합 분석 시작하기</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APPLE_THEME.background },
  headerRow: { padding: 20 },
  backText: { fontSize: 17, color: APPLE_THEME.tintBlue },
  listContent: { padding: 20 },
  footer: { padding: 20 },
  cta: { backgroundColor: APPLE_THEME.tintBlue, padding: 18, borderRadius: 16, alignItems: 'center' },
  secondaryCta: { backgroundColor: '#E5F1FF', padding: 18, borderRadius: 16, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryCtaText: { color: APPLE_THEME.tintBlue, fontWeight: '700' },
});