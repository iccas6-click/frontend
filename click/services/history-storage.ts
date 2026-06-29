import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ItemCategory, RecognizedItem, ScanRecord } from '@/types/medication';

import { devLog } from './debug-log';

const STORAGE_KEY = 'click.history.v2';

/** ISO → 'M월 D일 기록' */
export function formatRecordTitle(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 기록`;
}

/** ISO → '오전/오후 H:MM' */
export function formatRecordTime(iso: string): string {
  const d = new Date(iso);
  const ampm = d.getHours() < 12 ? '오전' : '오후';
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  return `${ampm} ${h}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 저장된 모든 기록을 읽는다 (내부용, 정렬 안 함) */
async function loadAll(): Promise<ScanRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScanRecord[]) : [];
  } catch (e) {
    console.warn('[history] 불러오기 실패:', e);
    return [];
  }
}

async function persist(records: ScanRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/** 모든 기록을 최신순(생성 시각 내림차순)으로 반환 */
export async function getAllScans(): Promise<ScanRecord[]> {
  const records = await loadAll();
  return records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/** 특정 기록을 id로 반환 (없으면 null) */
export async function getScan(id: string): Promise<ScanRecord | null> {
  const records = await loadAll();
  return records.find((r) => r.id === id) ?? null;
}

/**
 * 새 인식 기록을 만든다. 생성된 기록의 id를 반환한다.
 * 같은 분류라도 시간이 다르면 매번 새 기록으로 저장된다.
 */
export async function createScan(
  category: ItemCategory,
  items: RecognizedItem[],
): Promise<string> {
  const now = new Date();
  const id = String(now.getTime());
  const record: ScanRecord = { id, createdAt: now.toISOString(), category, items };

  const records = await loadAll();
  records.push(record);
  await persist(records);

  devLog(
    '[history] ◀ 새 기록 저장:',
    `${formatRecordTitle(record.createdAt)} ${formatRecordTime(record.createdAt)} / ${category} ${items.length}개`,
  );
  return id;
}

/** 기존 기록의 항목을 갱신한다 (사용자가 추가·수정·삭제한 결과 반영) */
export async function updateScan(id: string, items: RecognizedItem[]): Promise<void> {
  const records = await loadAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return;
  records[idx] = { ...records[idx], items };
  await persist(records);
}
