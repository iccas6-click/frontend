/** 인식된 항목의 분류 */
export type ItemCategory = '알약' | '건강기능식품 라벨';

/** OCR이 인식한 약/건강기능식품 한 개 */
export interface RecognizedItem {
  id: string;
  name: string;
  /** 용량 표기 (예: "100mg", "2000IU") */
  dosage: string;
  category: ItemCategory;
  /** 추후 백엔드 인식 결과에서 내려올 항목 이미지 */
  imageUri?: string;
  /** 추후 백엔드 인식 결과에서 내려올 주요 성분 */
  ingredients?: string[];
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

/** 분석 세션 상태 */
export type SessionStatus = 'recognizing' | 'ready' | 'analyzed';

/**
 * 로컬에 저장되는 분석 세션 한 건.
 * 같은 약을 재사용하더라도 새 분석을 시작하면 별도의 세션으로 저장된다.
 */
export interface AnalysisSession {
  /** 고유 id (생성 시각 기반) */
  id: string;
  /** 생성 시각 (ISO) */
  createdAt: string;
  /** 마지막으로 추가된 인식 분류 */
  category: ItemCategory;
  /** 세션 진행 상태 */
  status: SessionStatus;
  /** 인식 결과 (사용자가 추가·수정한 최종 항목 포함) */
  items: RecognizedItem[];
  /** 분석 완료 시각 (ISO) */
  analyzedAt?: string;
  /** 상호작용 분석 결과 */
  analysis?: AnalysisResult;
}

/** @deprecated AnalysisSession을 사용하세요. */
export type ScanRecord = AnalysisSession;
