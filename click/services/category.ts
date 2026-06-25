import axios from 'axios';

import type { ItemCategory } from '@/types/medication';

import { devLog } from './debug-log';
import { API_BASE_URL } from './ocr';

/**
 * 사용자가 첫 화면에서 선택한 분류를 백엔드에 전송한다.
 * API_BASE_URL이 비어 있으면 목업 모드로 전송을 생략한다(로그만 남김).
 */
export async function sendCategory(category: ItemCategory): Promise<void> {
  devLog(
    '[분류 선택] ▶ 서버로 보냄:',
    API_BASE_URL ? `POST ${API_BASE_URL}/api/category` : '(목업 모드)',
  );
  devLog('[분류 선택] ▶ 선택한 분류:', category);

  if (!API_BASE_URL) {
    return;
  }

  await axios.post(`${API_BASE_URL}/api/category`, { category }, { timeout: 15000 });
  devLog('[분류 선택] ◀ 서버 전송 완료');
}
