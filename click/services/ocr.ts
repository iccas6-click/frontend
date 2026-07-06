import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image as RNImage, Platform } from 'react-native';

import type { ItemCategory, RecognizedItem, RecognitionCandidate } from '@/types/medication';

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

const MAX_UPLOAD_IMAGE_SIDE = 2200;

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
  const uploadImage = await prepareImageForUpload(uri);
  const targetUrl = category === '알약' ? PILL_AI_BASE_URL : SUPPLEMENT_AI_BASE_URL;
  devLog('[OCR] ▶ 서버로 보냄:', targetUrl || '(목업 모드)');
  devLog('[OCR] ▶ 선택한 분류:', category);
  devLog('[OCR] ▶ 보낼 사진 uri:', uploadImage.uri);
  devLog('[OCR] ▶ 사진 정규화:', `${Platform.OS} ${uploadImage.width ?? '?'}x${uploadImage.height ?? '?'}`);

  if (!targetUrl) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const result = MOCK_BY_CATEGORY[category];
    devLog('[OCR] ◀ 서버에서 받음 (목업):', result);
    return result;
  }

  if (category === '알약') {
    return recognizePill(uploadImage.uri, targetUrl);
  }
  return recognizeSupplement(uploadImage.uri, targetUrl);
}

async function prepareImageForUpload(uri: string) {
  const sourceUri = String(uri ?? '').trim();
  if (!sourceUri) throw new Error('업로드할 사진이 없습니다.');

  try {
    const size = await getImageSize(sourceUri).catch((error) => {
      devLog('[OCR] 사진 크기 확인 실패, JPEG 변환만 시도:', String(error));
      return null;
    });
    const actions: ImageManipulator.Action[] = [];
    if (size && Math.max(size.width, size.height) > MAX_UPLOAD_IMAGE_SIDE) {
      actions.push(
        size.width >= size.height
          ? { resize: { width: MAX_UPLOAD_IMAGE_SIDE } }
          : { resize: { height: MAX_UPLOAD_IMAGE_SIDE } },
      );
    }

    const result = await ImageManipulator.manipulateAsync(sourceUri, actions, {
      compress: 0.94,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    devLog('[OCR] 사진 정규화 실패, 원본 업로드로 fallback:', String(error));
    return { uri: sourceUri, width: undefined, height: undefined };
  }
}

function getImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
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

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .forEach((value) => {
      if (seen.has(value)) return;
      seen.add(value);
      result.push(value);
    });
  return result;
}

function normalizeSupplementAnalysisNames(productName: string | null | undefined, ingredients: string[]) {
  const rawNames = uniqueClean([productName, ...ingredients]);
  const normalized = new Set<string>();

  rawNames.forEach((name) => {
    const compact = name.replace(/\s+/g, '').toLowerCase();
    if (/(오메가|omega|epa|dha)/i.test(name)) normalized.add('오메가-3');
    if (/(은행|ginkgo)/i.test(name)) normalized.add('은행잎');
    if (/(마늘|garlic)/i.test(name)) normalized.add('마늘');
    if (/(인삼|홍삼|ginseng)/i.test(name)) normalized.add('인삼');
    if (/(울금|커큐민|curcumin)/i.test(name)) normalized.add('울금');
    if (/(칼슘|calcium)/i.test(name)) normalized.add('칼슘');
    if (/(마그네슘|magnesium)/i.test(name)) normalized.add('마그네슘');
    if (/(철분|철|iron)/i.test(name) && compact.length <= 12) normalized.add('철');
  });

  if (normalized.size > 0) return Array.from(normalized);
  return rawNames;
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
  image_width?: number;
  image_height?: number;
  detections?: Array<{
    bbox?: [number, number, number, number];
    candidates?: Array<{
      pill_id?: string | null;
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
    image_url?: string | null;
    product_image_url?: string | null;
    item_image?: string | null;
  } | null;
  warnings?: string[];
};

function resolveImageUri(value: string | null | undefined, baseUrl: string): string | undefined {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  if (raw.startsWith('http') || raw.startsWith('file:') || raw.startsWith('content:')) return raw;
  return `${baseUrl}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

async function recognizePill(uri: string, baseUrl: string): Promise<RecognizedItem[]> {
  const urls = pillRecognitionUrls(baseUrl);
  let data: PillRecognitionResponse | null = null;
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      devLog('[OCR] ▶ 알약 업로드:', `POST ${url}`);
      const response = await axios.post<PillRecognitionResponse>(url, imageFormField(uri, 'file'), {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      data = response.data;
      break;
    } catch (error) {
      lastError = error;
      devLog('[OCR] 알약 업로드 경로 실패, 다음 경로 시도:', url);
    }
  }

  if (!data) {
    throw lastError instanceof Error ? lastError : new Error('알약 인식 서버에 연결하지 못했습니다.');
  }

  const items: RecognizedItem[] = [];
  (data.detections ?? []).forEach((detection, index) => {
    const candidates = (detection.candidates ?? [])
      .slice(0, 3)
      .map((candidate, candidateIndex): RecognitionCandidate | null => {
        const productName = candidate.product_name?.trim();
        const ingredients = uniqueClean([candidate.ingredient]);
        const { displayName, dosage } = splitProductAndDosage(productName);
        const analysisNames = ingredients.length > 0 ? ingredients : uniqueClean([displayName, productName]);
        const imageUri = resolveImageUri(candidate.reference_image_url, baseUrl);
        if (!productName && ingredients.length === 0) return null;
        return {
          id: `pill-${index}-candidate-${candidateIndex}`,
          pillId: candidate.pill_id ?? undefined,
          name: displayName,
          dosage,
          productName: productName || displayName,
          imageUri,
          ingredients,
          analysisNames,
          score: typeof candidate.score === 'number' ? candidate.score : undefined,
        };
      })
      .filter((candidate): candidate is RecognitionCandidate => Boolean(candidate));
    const selected = candidates[0];
    if (!selected) return;
    items.push({
      id: `pill-${index}`,
      name: selected.name,
      dosage: selected.dosage,
      category: '알약',
      productName: selected.productName,
      imageUri: selected.imageUri,
      ingredients: selected.ingredients,
      analysisNames: selected.analysisNames,
      candidates,
      selectedCandidateId: selected.id,
      sourceImageUri: uri,
      sourceImageWidth: data.image_width,
      sourceImageHeight: data.image_height,
      bbox: detection.bbox,
    });
  });

  if (items.length === 0) {
    throw new Error('알약 인식 결과가 없습니다.');
  }

  devLog('[OCR] ◀ 알약 서버에서 받음:', items);
  return items;
}

function pillRecognitionUrls(baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, '');
  return uniqueStrings([
    `${base}/recognize`,
    base.endsWith('/api/v1') ? `${base}/pill/recognize` : undefined,
    base.endsWith('/api/v1/pill') ? `${base}/recognize` : undefined,
    `${base}/api/v1/pill/recognize`,
  ]);
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
  const imageUri = resolveImageUri(product?.image_url ?? product?.product_image_url ?? product?.item_image, baseUrl);
  const analysisNames = normalizeSupplementAnalysisNames(productName, ingredients);
  const items: RecognizedItem[] = productName || ingredients.length > 0 ? [{
    id: 'supplement-0',
    name: productName || ingredients[0] || '인식된 건강기능식품',
    dosage: ingredients.length > 0 ? `성분 ${ingredients.length}개` : '',
    category: '건강기능식품 라벨' as const,
    productName,
    imageUri,
    ingredients,
    analysisNames,
  }] : [];

  if (items.length === 0) {
    throw new Error(data.warnings?.[0] ?? '건강기능식품 인식 결과가 없습니다.');
  }

  devLog('[OCR] ◀ 건강기능식품 서버에서 받음:', items);
  return items;
}
