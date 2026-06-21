/** 인식된 항목의 분류 */
export type ItemCategory = '약물' | '건강기능식품';

/** OCR이 인식한 약/건강기능식품 한 개 */
export interface RecognizedItem {
  id: string;
  name: string;
  /** 용량 표기 (예: "100mg", "2000IU") */
  dosage: string;
  category: ItemCategory;
}
