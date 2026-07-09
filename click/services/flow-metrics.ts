import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AnalysisResult, ItemCategory } from '@/types/medication';

import { devLog } from './debug-log';

const STORAGE_KEY = 'click.flow.metrics.v1';
const MAX_RECORDS = 200;

export type FlowSource = 'camera' | 'gallery' | 'record' | 'demo';
export type RecognitionStatus = 'started' | 'success' | 'failed';

export type RecognitionMetric = {
  category: ItemCategory;
  source?: FlowSource;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  status: RecognitionStatus;
  itemCount?: number;
  errorMessage?: string;
};

export type FlowMetric = {
  id: string;
  createdAt: string;
  updatedAt: string;
  initialCategory: ItemCategory;
  source?: FlowSource;
  recordId?: string;
  inputSubmittedAt?: string;
  recognitions: RecognitionMetric[];
  reviewReachedAt?: string;
  analysisStartedAt?: string;
  analysisCompletedAt?: string;
  analysisFailedAt?: string;
  analysisDurationMs?: number;
  endToEndMs?: number;
  checkedCount?: number;
  detectedCount?: number;
  unmatchedCombinationCount?: number;
};

function nowIso() {
  return new Date().toISOString();
}

function elapsedMs(startIso?: string, endIso = nowIso()) {
  if (!startIso) return undefined;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Number.isFinite(ms) && ms >= 0 ? ms : undefined;
}

async function loadAll(): Promise<FlowMetric[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is FlowMetric => Boolean(item?.id)) : [];
  } catch (error) {
    console.warn('[metrics] 불러오기 실패:', error);
    return [];
  }
}

async function saveAll(records: FlowMetric[]) {
  const sorted = [...records]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    .slice(0, MAX_RECORDS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
}

async function upsert(flowId: string, updater: (metric: FlowMetric) => FlowMetric): Promise<FlowMetric> {
  const records = await loadAll();
  const idx = records.findIndex((record) => record.id === flowId);
  const base = idx >= 0
    ? records[idx]
    : {
      id: flowId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      initialCategory: '알약' as ItemCategory,
      recognitions: [],
    };
  const next = { ...updater(base), updatedAt: nowIso() };
  const updated = idx >= 0 ? records.map((record, index) => (index === idx ? next : record)) : [next, ...records];
  await saveAll(updated);
  return next;
}

export async function createFlowMetric(initialCategory: ItemCategory, source: FlowSource): Promise<string> {
  const id = `flow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = nowIso();
  const metric: FlowMetric = {
    id,
    createdAt,
    updatedAt: createdAt,
    initialCategory,
    source,
    inputSubmittedAt: createdAt,
    recognitions: [],
  };
  const records = await loadAll();
  await saveAll([metric, ...records]);
  devLog('[metrics] 플로우 시작:', { id, initialCategory, source });
  return id;
}

export async function markInputSubmitted(flowId: string | undefined, category: ItemCategory, source: FlowSource): Promise<string> {
  if (!flowId) return createFlowMetric(category, source);
  await upsert(flowId, (metric) => ({
    ...metric,
    initialCategory: metric.initialCategory ?? category,
    source: metric.source ?? source,
    inputSubmittedAt: metric.inputSubmittedAt ?? nowIso(),
  }));
  return flowId;
}

export async function markRecognitionStarted(flowId: string | undefined, category: ItemCategory, source?: FlowSource): Promise<string> {
  const id = flowId ?? await createFlowMetric(category, source ?? 'record');
  const startedAt = nowIso();
  await upsert(id, (metric) => ({
    ...metric,
    initialCategory: metric.initialCategory ?? category,
    source: metric.source ?? source,
    inputSubmittedAt: metric.inputSubmittedAt ?? startedAt,
    recognitions: [
      ...metric.recognitions,
      { category, source, startedAt, status: 'started' },
    ],
  }));
  return id;
}

export async function markRecognitionFinished(
  flowId: string | undefined,
  category: ItemCategory,
  status: Exclude<RecognitionStatus, 'started'>,
  details: { itemCount?: number; errorMessage?: string; recordId?: string } = {},
): Promise<void> {
  if (!flowId) return;
  const endedAt = nowIso();
  await upsert(flowId, (metric) => {
    const index = [...metric.recognitions].reverse().findIndex((item) => item.category === category && item.status === 'started');
    const targetIndex = index === -1 ? -1 : metric.recognitions.length - 1 - index;
    const recognitions = targetIndex === -1
      ? metric.recognitions
      : metric.recognitions.map((item, itemIndex) => (
        itemIndex === targetIndex
          ? {
            ...item,
            endedAt,
            durationMs: elapsedMs(item.startedAt, endedAt),
            status,
            itemCount: details.itemCount,
            errorMessage: details.errorMessage,
          }
          : item
      ));
    return { ...metric, recordId: details.recordId ?? metric.recordId, recognitions };
  });
  devLog('[metrics] OCR 종료:', { flowId, category, status, itemCount: details.itemCount });
}

export async function markReviewReached(flowId: string | undefined): Promise<void> {
  if (!flowId) return;
  await upsert(flowId, (metric) => ({ ...metric, reviewReachedAt: metric.reviewReachedAt ?? nowIso() }));
  devLog('[metrics] 리뷰 도달:', flowId);
}

export async function markAnalysisStarted(flowId: string | undefined): Promise<void> {
  if (!flowId) return;
  await upsert(flowId, (metric) => ({ ...metric, analysisStartedAt: nowIso() }));
  devLog('[metrics] 분석 시작:', flowId);
}

export async function markAnalysisCompleted(flowId: string | undefined, result: AnalysisResult): Promise<void> {
  if (!flowId) return;
  const completedAt = nowIso();
  let recordedEndToEndMs: number | undefined;
  await upsert(flowId, (metric) => {
    recordedEndToEndMs = elapsedMs(metric.inputSubmittedAt, completedAt);
    return {
      ...metric,
      analysisCompletedAt: completedAt,
      analysisDurationMs: elapsedMs(metric.analysisStartedAt, completedAt),
      endToEndMs: recordedEndToEndMs,
      checkedCount: result.checkedCount,
      detectedCount: result.detectedCount,
      unmatchedCombinationCount: result.unmatchedCombinationCount,
    };
  });
  devLog('[metrics] 분석 완료:', {
    flowId,
    endToEndMs: recordedEndToEndMs,
    checkedCount: result.checkedCount,
    detectedCount: result.detectedCount,
  });
}

export async function markAnalysisFailed(flowId: string | undefined): Promise<void> {
  if (!flowId) return;
  const failedAt = nowIso();
  await upsert(flowId, (metric) => ({
    ...metric,
    analysisFailedAt: failedAt,
    analysisDurationMs: elapsedMs(metric.analysisStartedAt, failedAt),
    endToEndMs: elapsedMs(metric.inputSubmittedAt, failedAt),
  }));
  devLog('[metrics] 분석 실패:', flowId);
}

export async function getFlowMetrics(): Promise<FlowMetric[]> {
  return loadAll();
}

export async function summarizeFlowMetrics() {
  const records = await loadAll();
  const ocrSucceededRecords = records.filter((record) => record.recognitions.some((item) => item.status === 'success'));
  const ocrSucceeded = ocrSucceededRecords.length;
  const reviewReached = ocrSucceededRecords.filter((record) => record.reviewReachedAt).length;
  const analysisStarted = records.filter((record) => record.analysisStartedAt).length;
  const analysisCompleted = records.filter((record) => record.analysisCompletedAt).length;
  const completedDurations = records.map((record) => record.endToEndMs).filter((value): value is number => typeof value === 'number');
  const averageEndToEndMs = completedDurations.length
    ? Math.round(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length)
    : 0;
  return {
    totalFlows: records.length,
    ocrSucceeded,
    reviewReached,
    ocrSuccessToReviewRate: ocrSucceeded ? reviewReached / ocrSucceeded : 0,
    analysisStarted,
    analysisCompleted,
    analysisCompletionRate: analysisStarted ? analysisCompleted / analysisStarted : 0,
    averageEndToEndMs,
  };
}
