import { translate, type AppLanguage } from '@/services/i18n';
import type { ItemCategory, RecognizedItem } from '@/types/medication';

export type DemoRecognitionSet = {
  id: string;
  title: string;
  subtitle: string;
  category: ItemCategory;
  items: RecognizedItem[];
};

const DEMO_IMAGES = {
  pillSource: require('@/assets/images/demo/demo-pill-source.png'),
  warfarin: require('@/assets/images/demo/demo-pill-warfarin.png'),
  aspirin: require('@/assets/images/demo/demo-pill-aspirin.png'),
  lipitor: require('@/assets/images/demo/demo-pill-lipitor.png'),
  tylenol: require('@/assets/images/demo/demo-pill-tylenol.png'),
  geworin: require('@/assets/images/demo/demo-pill-geworin.png'),
  omega3: require('@/assets/images/demo/demo-supp-omega3.png'),
  ginkgo: require('@/assets/images/demo/demo-supp-ginkgo.png'),
  vitaminD: require('@/assets/images/demo/demo-supp-vitamin-d.png'),
};

function pill(
  id: string,
  name: string,
  dosage: string,
  ingredients: string[],
  extraNames: string[] = [],
  imageUri?: RecognizedItem['imageUri'],
  bbox?: [number, number, number, number],
): RecognizedItem {
  const productName = `${name} ${dosage}`.trim();
  const analysisNames = [...ingredients, ...extraNames];

  return {
    id,
    name,
    dosage,
    category: '알약',
    productName,
    imageUri,
    ingredients,
    analysisNames,
    candidates: imageUri
      ? [
          {
            id: `${id}-candidate-1`,
            name,
            dosage,
            productName,
            imageUri,
            ingredients,
            analysisNames,
            score: 96,
          },
          {
            id: `${id}-candidate-2`,
            name: `${name.replace(/정$/, '')} 후보`,
            dosage,
            productName,
            imageUri,
            ingredients,
            analysisNames,
            score: 82,
          },
          {
            id: `${id}-candidate-3`,
            name: '직접 확인 필요',
            dosage: '',
            productName: '직접 확인 필요',
            imageUri,
            ingredients: [],
            analysisNames: [],
            score: 61,
          },
        ]
      : undefined,
    selectedCandidateId: imageUri ? `${id}-candidate-1` : undefined,
    sourceImageUri: bbox ? DEMO_IMAGES.pillSource : undefined,
    sourceImageWidth: bbox ? 1200 : undefined,
    sourceImageHeight: bbox ? 900 : undefined,
    bbox,
  };
}

function supplement(
  id: string,
  name: string,
  ingredients: string[],
  dosage = '',
  extraNames: string[] = [],
  analysisNames?: string[],
  imageUri?: RecognizedItem['imageUri'],
): RecognizedItem {
  return {
    id,
    name,
    dosage: dosage || `성분 ${ingredients.length}개`,
    category: '건강기능식품 라벨',
    productName: name,
    imageUri,
    ingredients,
    analysisNames: analysisNames ?? [...ingredients, ...extraNames, name],
  };
}

const PILL_DEMOS: DemoRecognitionSet[] = [
  {
    id: 'bleeding-pill',
    title: '데모용 알약 세트',
    subtitle: '처방약과 자주 쓰는 진통제',
    category: '알약',
    items: [
      pill('demo-pill-warfarin', '와파린정', '5mg', ['와파린'], [], DEMO_IMAGES.warfarin, [125, 280, 385, 450]),
      pill('demo-pill-aspirin', '아스피린프로텍트정', '100mg', ['아스피린'], [], DEMO_IMAGES.aspirin, [425, 265, 645, 480]),
      pill('demo-pill-lipitor', '리피토정', '10mg', ['아토르바스타틴'], ['리피토'], DEMO_IMAGES.lipitor, [685, 280, 975, 450]),
      pill('demo-pill-tylenol', '타이레놀8시간이알서방정', '650mg', ['아세트아미노펜'], [], DEMO_IMAGES.tylenol, [210, 540, 525, 715]),
      pill(
        'demo-pill-geworin',
        '게보린정',
        '복합진통제',
        ['아세트아미노펜', '이소프로필안티피린', '카페인'],
        [],
        DEMO_IMAGES.geworin,
        [630, 540, 945, 715],
      ),
    ],
  },
  {
    id: 'metabolic-pill',
    title: '혈당·혈압 약 조합',
    subtitle: '당뇨약과 혈압약',
    category: '알약',
    items: [
      pill('demo-pill-metformin', '메트포르민정', '500mg', ['메트포르민'], ['metformin']),
      pill('demo-pill-glimepiride', '글리메피리드정', '2mg', ['글리메피리드'], ['glimepiride']),
      pill('demo-pill-nifedipine', '니페디핀정', '30mg', ['니페디핀'], ['nifedipine']),
    ],
  },
  {
    id: 'absorption-pill',
    title: '흡수 영향 확인용',
    subtitle: '항생제와 갑상샘약',
    category: '알약',
    items: [
      pill('demo-pill-tetracycline', '테트라사이클린캡슐', '250mg', ['테트라사이클린'], ['tetracycline']),
      pill('demo-pill-levothyroxine', '레보티록신정', '50mcg', ['레보티록신'], ['levothyroxine']),
      pill('demo-pill-fexofenadine', '펙소페나딘정', '120mg', ['펙소페나딘'], ['fexofenadine']),
    ],
  },
];

const SUPPLEMENT_DEMOS: DemoRecognitionSet[] = [
  {
    id: 'bleeding-supplement',
    title: '데모용 건강기능식품 세트',
    subtitle: '오메가3·은행잎·비타민D',
    category: '건강기능식품 라벨',
    items: [
      supplement('demo-supp-omega3', '오메가-3', ['오메가-3'], 'EPA/DHA 1,000mg', [], ['오메가-3'], DEMO_IMAGES.omega3),
      supplement('demo-supp-ginkgo', '은행잎 추출물', ['은행잎'], '플라보놀배당체 28mg', ['Ginkgo'], ['은행잎'], DEMO_IMAGES.ginkgo),
      supplement('demo-supp-vitamin-d', '비타민 D', ['비타민 D'], '1,000IU', [], ['비타민 D'], DEMO_IMAGES.vitaminD),
    ],
  },
  {
    id: 'metabolic-supplement',
    title: '혈당·혈압 주의 건강기능식품',
    subtitle: '인삼·울금·호로파',
    category: '건강기능식품 라벨',
    items: [
      supplement('demo-supp-ginseng', '홍삼 스틱', ['인삼'], '진세노사이드 10mg', ['홍삼', 'Ginseng']),
      supplement('demo-supp-curcumin', '커큐민', ['울금(커큐민)'], '커큐민 500mg', ['울금', '커큐민', 'Curcumin']),
      supplement('demo-supp-fenugreek', '호로파 종자', ['호로파 종자'], '추출분말 600mg', ['호로파']),
    ],
  },
  {
    id: 'absorption-supplement',
    title: '흡수 방해 확인용',
    subtitle: '칼슘·마그네슘·철',
    category: '건강기능식품 라벨',
    items: [
      supplement('demo-supp-calcium', '칼슘', ['칼슘'], '600mg', ['Calcium']),
      supplement('demo-supp-magnesium', '마그네슘', ['마그네슘'], '300mg', ['Magnesium']),
      supplement('demo-supp-iron', '철분', ['철'], '18mg', ['철분', 'Iron']),
    ],
  },
];

const DEMO_COPY: Record<string, Record<AppLanguage, { title: string; subtitle: string }>> = {
  'bleeding-pill': {
    ko: { title: '데모용 알약 세트', subtitle: '처방약과 자주 쓰는 진통제' },
    en: { title: 'Sample pill set', subtitle: 'Prescription medicines and common pain relievers' },
    fr: { title: 'Exemple de comprimés', subtitle: 'Médicaments prescrits et antalgiques courants' },
  },
  'metabolic-pill': {
    ko: { title: '혈당·혈압 약 조합', subtitle: '당뇨약과 혈압약' },
    en: { title: 'Blood sugar and blood pressure medicines', subtitle: 'Diabetes and hypertension medicines' },
    fr: { title: 'Médicaments glycémie et tension', subtitle: 'Traitements du diabète et de l’hypertension' },
  },
  'absorption-pill': {
    ko: { title: '흡수 영향 확인용', subtitle: '항생제와 갑상샘약' },
    en: { title: 'Absorption check sample', subtitle: 'Antibiotic and thyroid medicines' },
    fr: { title: 'Exemple sur l’absorption', subtitle: 'Antibiotique et traitement thyroïdien' },
  },
  'bleeding-supplement': {
    ko: { title: '데모용 건강기능식품 세트', subtitle: '오메가3·은행잎·비타민D' },
    en: { title: 'Sample supplement set', subtitle: 'Omega-3, ginkgo, and vitamin D' },
    fr: { title: 'Exemple de compléments', subtitle: 'Oméga-3, ginkgo et vitamine D' },
  },
  'metabolic-supplement': {
    ko: { title: '혈당·혈압 주의 건강기능식품', subtitle: '인삼·울금·호로파' },
    en: { title: 'Supplements for metabolic caution', subtitle: 'Ginseng, turmeric, and fenugreek' },
    fr: { title: 'Compléments à surveiller', subtitle: 'Ginseng, curcuma et fenugrec' },
  },
  'absorption-supplement': {
    ko: { title: '흡수 방해 확인용', subtitle: '칼슘·마그네슘·철' },
    en: { title: 'Absorption interference sample', subtitle: 'Calcium, magnesium, and iron' },
    fr: { title: 'Exemple d’interférence d’absorption', subtitle: 'Calcium, magnésium et fer' },
  },
};

function localizeItem(item: RecognizedItem, language: AppLanguage): RecognizedItem {
  if (language === 'ko') return item;
  const needsCheck = translate(language, 'ingredientInfoNeeded');
  return {
    ...item,
    name: item.name === '직접 확인 필요' ? needsCheck : item.name,
    productName: item.productName === '직접 확인 필요' ? needsCheck : item.productName,
    dosage: item.dosage.startsWith('성분 ') && item.ingredients?.length
      ? translate(language, 'ingredientCount', { count: item.ingredients.length })
      : item.dosage,
    candidates: item.candidates?.map((candidate) => ({
      ...candidate,
      name: candidate.name === '직접 확인 필요' ? needsCheck : candidate.name,
      productName: candidate.productName === '직접 확인 필요' ? needsCheck : candidate.productName,
    })),
  };
}

export function getDemoRecognitionSets(category: ItemCategory, language: AppLanguage = 'ko'): DemoRecognitionSet[] {
  const demos = category === '건강기능식품 라벨' ? SUPPLEMENT_DEMOS : PILL_DEMOS;
  return demos.map((demo) => {
    const copy = DEMO_COPY[demo.id]?.[language] ?? DEMO_COPY[demo.id]?.ko;
    return {
      ...demo,
      title: copy?.title ?? demo.title,
      subtitle: copy?.subtitle ?? demo.subtitle,
      items: demo.items.map((item) => localizeItem(item, language)),
    };
  });
}
