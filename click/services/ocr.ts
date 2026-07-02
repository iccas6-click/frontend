import axios from 'axios';

import type { ItemCategory, RecognizedItem } from '@/types/medication';

import { devLog } from './debug-log';

/**
 * 서버 API 주소.
 * 비어 있으면 해당 단계는 목업 데이터로 동작한다.
 */
export const BACKEND_API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
export const SUPPLEMENT_AI_BASE_URL = process.env.EXPO_PUBLIC_SUPPLEMENT_AI_URL ?? '';
export const PILL_AI_BASE_URL = process.env.EXPO_PUBLIC_PILL_AI_URL ?? '';

/** @deprecated 분석 API 호환용. 새 코드는 BACKEND_API_BASE_URL을 사용한다. */
export const API_BASE_URL = BACKEND_API_BASE_URL;

/** 백엔드 연동 전 화면 확인용 목업 결과 (분류별) */
const MOCK_BY_CATEGORY: Record<ItemCategory, RecognizedItem[]> = {
  알약: [
    { id: '1', name: '아스피린', dosage: '100mg', category: '알약', ingredients: ['아스피린'], analysisNames: ['아스피린'] },
    { id: '2', name: '리피토', dosage: '10mg', category: '알약', ingredients: ['아토르바스타틴'], analysisNames: ['아토르바스타틴', '리피토'] },
  ],
  '건강기능식품 라벨': [
    { id: '3', name: '오메가-3', dosage: '성분 1개', category: '건강기능식품 라벨', ingredients: ['EPA 및 DHA 함유 유지'], analysisNames: ['EPA 및 DHA 함유 유지', '오메가-3'] },
    { id: '4', name: '비타민 D3', dosage: '성분 1개', category: '건강기능식품 라벨', ingredients: ['비타민 D'], analysisNames: ['비타민 D', '비타민 D3'] },
  ],
};

/**
 * 촬영한 사진을 서버에 업로드해 OCR 분석 결과를 받아온다.
 * @param uri expo-camera가 반환한 사진 파일 URI
 * @param category 사용자가 촬영 화면에서 선택한 분류 — 인식된 항목은 모두 이 분류로 처리
 */
export async function analyzeImage(
  uri: string,
  category: ItemCategory,
): Promise<RecognizedItem[]> {
  const targetUrl = category === '알약' ? PILL_AI_BASE_URL : SUPPLEMENT_AI_BASE_URL;
  devLog('[OCR] ▶ 서버로 보냄:', targetUrl || '(목업 모드)');
  devLog('[OCR] ▶ 선택한 분류:', category);
  devLog('[OCR] ▶ 보낼 사진 uri:', uri);

  if (!targetUrl) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const result = MOCK_BY_CATEGORY[category];
    devLog('[OCR] ◀ 서버에서 받음 (목업):', result);
    return result;
  }

  if (category === '알약') {
    return recognizePill(uri, targetUrl);
  }
  return recognizeSupplement(uri, targetUrl);
}

function imageFormField(uri: string, fieldName: string) {
  const form = new FormData();
  form.append(fieldName, {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  return form;
}

function uniqueClean(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  values
    .flatMap((value) => String(value ?? '').split(/[|,，/·ㆍ]+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.replace(/\s+/g, '').toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(value);
    });
  return result;
}

function splitProductAndDosage(productName?: string | null) {
  const raw = String(productName ?? '').trim();
  if (!raw) return { displayName: '인식된 알약', dosage: '' };

  const matches = raw.match(/((?:\d+(?:\.\d+)?\s*)?(?:mg|g|mcg|μg|ug|㎎|㎍|IU|정|캡슐|캡|mL|ml)(?:\s*\/\s*[A-Za-z가-힣0-9]+)?)/gi);
  const dosage = uniqueClean(matches ?? []).join(', ');
  const displayName = dosage
    ? raw.replace(/((?:\d+(?:\.\d+)?\s*)?(?:mg|g|mcg|μg|ug|㎎|㎍|IU|정|캡슐|캡|mL|ml)(?:\s*\/\s*[A-Za-z가-힣0-9]+)?)/gi, '').replace(/\s{2,}/g, ' ').trim()
    : raw;

  return { displayName: displayName || raw, dosage };
}

type PillRecognitionResponse = {
  detections?: Array<{
    candidates?: Array<{
      product_name?: string | null;
      ingredient?: string | null;
      score?: number | null;
      reference_image_url?: string | null;
    }>;
  }>;
};

type SupplementRecognitionResponse = {
  product?: {
    product_name?: string | null;
    ingredients?: string[];
    confidence?: number | null;
  } | null;
  warnings?: string[];
};

async function recognizePill(uri: string, baseUrl: string): Promise<RecognizedItem[]> {
  const form = imageFormField(uri, 'file');
  devLog('[OCR] ▶ 알약 업로드:', `POST ${baseUrl}/recognize`);

  const { data } = await axios.post<PillRecognitionResponse>(`${baseUrl}/recognize`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

  const items: RecognizedItem[] = [];
  (data.detections ?? []).forEach((detection, index) => {
    const candidate = detection.candidates?.[0];
    if (!candidate) return;
    const productName = candidate.product_name?.trim();
    const ingredients = uniqueClean([candidate.ingredient]);
    const { displayName, dosage } = splitProductAndDosage(productName);
    const analysisNames = uniqueClean([...ingredients, displayName, productName]);
    const imageUri = candidate.reference_image_url
      ? candidate.reference_image_url.startsWith('http')
        ? candidate.reference_image_url
        : `${baseUrl}${candidate.reference_image_url}`
      : undefined;
    items.push({
      id: `pill-${index}`,
      name: displayName,
      dosage,
      category: '알약',
      productName: productName || displayName,
      imageUri,
      ingredients,
      analysisNames,
    });
  });

  if (items.length === 0) {
    throw new Error('알약 인식 결과가 없습니다.');
  }

  devLog('[OCR] ◀ 알약 서버에서 받음:', items);
  return items;
}

async function recognizeSupplement(uri: string, baseUrl: string): Promise<RecognizedItem[]> {
  const form = imageFormField(uri, 'image');
  devLog('[OCR] ▶ 건강기능식품 업로드:', `POST ${baseUrl}/api/v1/supplement/recognize`);

  const { data } = await axios.post<SupplementRecognitionResponse>(
    `${baseUrl}/api/v1/supplement/recognize`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    },
  );

  const product = data.product;
  const productName = product?.product_name?.trim();
  const ingredients = uniqueClean(product?.ingredients ?? []);
  const items: RecognizedItem[] = productName || ingredients.length > 0 ? [{
    id: 'supplement-0',
    name: productName || ingredients[0] || '인식된 건강기능식품',
    dosage: ingredients.length > 0 ? `성분 ${ingredients.length}개` : '',
    category: '건강기능식품 라벨' as const,
    productName,
    ingredients,
    analysisNames: uniqueClean([...ingredients, productName]),
  }] : [];

  if (items.length === 0) {
    throw new Error(data.warnings?.[0] ?? '건강기능식품 인식 결과가 없습니다.');
  }

  devLog('[OCR] ◀ 건강기능식품 서버에서 받음:', items);
  return items;
}
