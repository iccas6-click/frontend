import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AnalysisResult, AnalysisSession, ItemCategory, RecognizedItem, SessionStatus } from '@/types/medication';

import { devLog } from './debug-log';

const STORAGE_KEY = 'click.history.v2';

/** ISO → 'M월 D일 기록' */
export function formatRecordTitle(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 기록`;
}

/** ISO → 'M월 D일 오전/오후 H:MM' */
export function formatRecordDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${formatRecordTime(iso)}`;
}

/** ISO → 'YYYY년 M월' */
export function formatRecordMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

/** ISO → '오전/오후 H:MM' */
export function formatRecordTime(iso: string): string {
  const d = new Date(iso);
  const ampm = d.getHours() < 12 ? '오전' : '오후';
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  return `${ampm} ${h}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 저장된 모든 세션을 읽는다 (내부용, 정렬 안 함) */
function normalizeSession(record: Partial<AnalysisSession>): AnalysisSession | null {
  if (!record.id || !record.createdAt || !record.category || !Array.isArray(record.items)) {
    return null;
  }
  const status: SessionStatus = record.analysis ? 'analyzed' : record.items.length > 0 ? 'ready' : 'recognizing';
  return {
    id: record.id,
    createdAt: record.createdAt,
    category: record.category,
    status: record.status ?? status,
    items: record.items,
    analyzedAt: record.analyzedAt,
    analysis: record.analysis,
  };
}

async function loadAll(): Promise<AnalysisSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeSession).filter((record): record is AnalysisSession => Boolean(record)) : [];
  } catch (e) {
    console.warn('[history] 불러오기 실패:', e);
    return [];
  }
}

async function persist(records: AnalysisSession[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/** 모든 세션을 최신순(생성 시각 내림차순)으로 반환 */
export async function getAllSessions(): Promise<AnalysisSession[]> {
  const records = await loadAll();
  return records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/** 특정 세션을 id로 반환 (없으면 null) */
export async function getSession(id: string): Promise<AnalysisSession | null> {
  const records = await loadAll();
  return records.find((r) => r.id === id) ?? null;
}

/** 선택한 세션들을 삭제한다. 반환값은 실제 삭제된 개수다. */
export async function deleteSessions(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const idSet = new Set(ids);
  const records = await loadAll();
  const next = records.filter((record) => !idSet.has(record.id));
  await persist(next);
  return records.length - next.length;
}

/**
 * 새 분석 세션을 만든다. 생성된 세션의 id를 반환한다.
 * 같은 항목을 재사용하더라도 시간이 다르면 매번 새 세션으로 저장된다.
 */
export async function createSession(
  category: ItemCategory,
  items: RecognizedItem[],
): Promise<string> {
  const now = new Date();
  const id = String(now.getTime());
  const record: AnalysisSession = { id, createdAt: now.toISOString(), category, status: 'ready', items };

  const records = await loadAll();
  records.push(record);
  await persist(records);

  devLog(
    '[history] ◀ 새 세션 저장:',
    `${formatRecordTitle(record.createdAt)} ${formatRecordTime(record.createdAt)} / ${category} ${items.length}개`,
  );
  return id;
}

/** 기존 세션의 항목을 갱신한다 (사용자가 추가·수정·삭제한 결과 반영) */
export async function updateSessionItems(id: string, items: RecognizedItem[]): Promise<void> {
  const records = await loadAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return;
  records[idx] = { ...records[idx], status: records[idx].analysis ? 'analyzed' : 'ready', items };
  await persist(records);
}

/** 기존 인식 항목을 재사용할 때도 새 분석 세션을 만든다. */
export async function createSessionFromItems(items: RecognizedItem[]): Promise<string> {
  const category: ItemCategory = items.some((item) => item.category === '건강기능식품 라벨')
    ? '건강기능식품 라벨'
    : '알약';
  return createSession(category, items);
}

/** 특정 분류 항목이 들어 있는 최근 세션을 반환한다. */
export async function getReusableSessions(category: ItemCategory): Promise<AnalysisSession[]> {
  const records = await getAllSessions();
  return records.filter((record) => record.items.some((item) => item.category === category));
}

/** 분석 결과를 해당 세션 안에 저장한다. */
export async function updateSessionAnalysis(id: string, analysis: AnalysisResult): Promise<void> {
  const records = await loadAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return;
  records[idx] = { ...records[idx], status: 'analyzed', analysis, analyzedAt: new Date().toISOString() };
  await persist(records);
}

/** @deprecated getAllSessions를 사용하세요. */
export const getAllScans = getAllSessions;
/** @deprecated getSession을 사용하세요. */
export const getScan = getSession;
/** @deprecated createSession을 사용하세요. */
export const createScan = createSession;
/** @deprecated createSessionFromItems를 사용하세요. */
export const createScanFromItems = createSessionFromItems;
/** @deprecated updateSessionItems를 사용하세요. */
export const updateScan = updateSessionItems;
/** @deprecated getReusableSessions를 사용하세요. */
export const getReusableScans = getReusableSessions;
/** @deprecated updateSessionAnalysis를 사용하세요. */
export const updateScanAnalysis = updateSessionAnalysis;
