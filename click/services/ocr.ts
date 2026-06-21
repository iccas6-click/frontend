import axios from 'axios';

import type { RecognizedItem } from '@/types/medication';

import { devLog } from './debug-log';

/**
 * 백엔드 API 주소.
 * 비어 있으면 목업 데이터로 동작하며(UI 테스트용),
 * 실제 서버가 준비되면 주소를 채워 넣으면 자동으로 실제 업로드로 전환됩니다.
 * 예: 'https://api.click.example.com'
 */
export const API_BASE_URL = '';

/** 백엔드 연동 전 화면 확인용 목업 결과 */
const MOCK_RESULT: RecognizedItem[] = [
  { id: '1', name: '아스피린', dosage: '100mg', category: '약물' },
  { id: '2', name: '리피토', dosage: '10mg', category: '약물' },
  { id: '3', name: '오메가-3', dosage: '1000mg', category: '건강기능식품' },
  { id: '4', name: '비타민 D3', dosage: '2000IU', category: '건강기능식품' },
];

/**
 * 촬영한 사진을 서버에 업로드해 OCR 분석 결과를 받아온다.
 * @param uri expo-camera가 반환한 사진 파일 URI
 */
export async function analyzeImage(uri: string): Promise<RecognizedItem[]> {
  devLog('[OCR] ▶ 서버로 보냄:', API_BASE_URL ? `POST ${API_BASE_URL}/api/ocr` : '(목업 모드)');
  devLog('[OCR] ▶ 보낼 사진 uri:', uri);

  // 백엔드 주소가 없으면 목업으로 동작 (분석 로딩 흉내)
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    devLog('[OCR] ◀ 서버에서 받음 (목업):', MOCK_RESULT);
    return MOCK_RESULT;
  }

  const form = new FormData();
  // React Native에서 파일 업로드는 { uri, name, type } 형태로 넣는다
  form.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  devLog('[OCR] ▶ 업로드 형식: multipart/form-data, 필드명=image, type=image/jpeg');

  const { data } = await axios.post<{ items: RecognizedItem[] }>(
    `${API_BASE_URL}/api/ocr`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    },
  );

  devLog('[OCR] ◀ 서버에서 받음:', data);
  return data.items;
}
