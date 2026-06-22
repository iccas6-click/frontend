/** 인식된 항목의 분류 */
export type ItemCategory = '알약' | '건강기능식품 라벨';

/** OCR이 인식한 약/건강기능식품 한 개 */
export interface RecognizedItem {
  id: string;
  name: string;
  /** 용량 표기 (예: "100mg", "2000IU") */
  dosage: string;
  category: ItemCategory;
}

/** 위험도 단계 */
export type RiskLevel = 'danger' | 'caution' | 'safe';

/** 두 항목 조합에 대한 분석 결과 */
export interface InteractionPair {
  id: string;
  /** 조합된 항목 이름들 (예: ["아스피린", "오메가-3"]) */
  items: string[];
  level: RiskLevel;
  description: string;
}

/** 상호작용 분석 전체 결과 */
export interface AnalysisResult {
  overall: RiskLevel;
  summary: string;
  pairs: InteractionPair[];
}
