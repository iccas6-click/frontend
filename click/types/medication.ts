/** 인식된 항목의 분류 */
export type ItemCategory = '알약' | '건강기능식품 라벨';

/** 알약 인식 모델이 반환한 제품 후보 */
export interface RecognitionCandidate {
  id: string;
  pillId?: string;
  name: string;
  dosage: string;
  productName?: string;
  imageUri?: string | number;
  ingredients?: string[];
  analysisNames?: string[];
  score?: number;
}

/** OCR이 인식한 약/건강기능식품 한 개 */
export interface RecognizedItem {
  id: string;
  /** 화면에서 사용자가 확인할 제품명/상품명 */
  name: string;
  /** 용량 표기 (예: "100mg", "2000IU") */
  dosage: string;
  category: ItemCategory;
  /** 원본 제품명. name에서 용량을 분리했을 때도 원문을 보존한다. */
  productName?: string;
  /** 추후 백엔드 인식 결과에서 내려올 항목 이미지 */
  imageUri?: string | number;
  /** 추후 백엔드 인식 결과에서 내려올 주요 성분 */
  ingredients?: string[];
  /** 백엔드 상호작용 분석에 보낼 성분/약물 후보명 */
  analysisNames?: string[];
  /** 알약 인식 후보 Top-K. 사용자가 최종 후보를 고르면 항목 본문에 반영된다. */
  candidates?: RecognitionCandidate[];
  selectedCandidateId?: string;
  /** 원본 사진 위에서 이 항목을 표시하기 위한 탐지 정보 */
  sourceImageUri?: string;
  sourceImageWidth?: number;
  sourceImageHeight?: number;
  bbox?: [number, number, number, number];
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
  /** 백엔드가 실제 분석에 사용한 약 성분명 */
  matchedDrugNames?: string[];
  /** 백엔드가 실제 분석에 사용한 건강기능식품 성분명 */
  matchedSupplementNames?: string[];
  /** 제품/포장/용량 등 분석 성분에서 제외된 알약 OCR 후보 */
  ignoredDrugNames?: string[];
  /** 백엔드가 실제로 확인한 건강기능식품 성분 x 알약 성분 조합 수 */
  checkedCount?: number;
  /** 주의 정보가 발견된 조합 수 */
  detectedCount?: number;
  /** 현재 DB에서 주의 정보가 발견되지 않은 조합 수 */
  undetectedCount?: number;
  /** 현재 DB에서 매칭하지 못한 건강기능식품 성분 수 */
  unmatchedSupplementCount?: number;
  /** 현재 DB에서 매칭하지 못한 알약 성분/약물 수 */
  unmatchedDrugCount?: number;
  /** 매칭 실패 항목이 포함되어 DB 확인까지 가지 못한 조합 수 */
  unmatchedCombinationCount?: number;
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
