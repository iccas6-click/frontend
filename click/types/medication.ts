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

/**
 * 로컬에 저장되는 인식 기록 한 건(= 촬영 한 번).
 * 시간이 다르면 각각 별도의 기록으로 저장된다.
 */
export interface ScanRecord {
  /** 고유 id (생성 시각 기반) */
  id: string;
  /** 생성 시각 (ISO) */
  createdAt: string;
  /** 이 기록의 분류 */
  category: ItemCategory;
  /** 인식 결과 (사용자가 추가·수정한 최종 항목 포함) */
  items: RecognizedItem[];
  /** 분석 완료 시각 (ISO) */
  analyzedAt?: string;
  /** 상호작용 분석 결과 */
  analysis?: AnalysisResult;
}
