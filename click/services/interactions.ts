import axios from 'axios';

import type {
  AnalysisResult,
  InteractionPair,
  RecognizedItem,
  RiskLevel,
} from '@/types/medication';

import { devLog } from './debug-log';
import { translate } from './i18n';
import { BACKEND_API_BASE_URL } from './ocr';
import { getSettings } from './settings-storage';

/** 위험도 비교용 순위 */
const LEVEL_RANK: Record<RiskLevel, number> = { danger: 3, caution: 2, safe: 1 };

/** 알려진 조합 사전 (목업용). 키는 이름을 정렬해 '|'로 연결 */
const KNOWN: Record<string, { level: RiskLevel; descriptions: Record<'ko' | 'en' | 'fr', string> }> = {
  '아스피린|오메가-3': {
    level: 'caution',
    descriptions: {
      ko: '함께 복용 시 출혈 위험이 증가할 수 있어요',
      en: 'Taking these together may increase bleeding risk.',
      fr: 'Les prendre ensemble peut augmenter le risque de saignement.',
    },
  },
  '리피토|아스피린': {
    level: 'caution',
    descriptions: {
      ko: '드물게 근육 관련 부작용이 보고됩니다',
      en: 'Muscle-related side effects have rarely been reported.',
      fr: 'Des effets indésirables musculaires ont rarement été rapportés.',
    },
  },
  '비타민 D3|리피토': {
    level: 'safe',
    descriptions: {
      ko: '함께 복용 가능합니다',
      en: 'These can be taken together.',
      fr: 'Ils peuvent être pris ensemble.',
    },
  },
};

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

function uniqueNames(values: Array<string | null | undefined>) {
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

function buildAnalyzeItems(items: RecognizedItem[]) {
  return items.flatMap((item) => {
    const sourceNames =
      item.analysisNames?.length
        ? item.analysisNames
        : item.ingredients?.length
          ? item.ingredients
          : [item.name, item.productName];
    const names = uniqueNames(sourceNames);
    const analysisNames = names.length > 0 ? names : [item.name];
    return analysisNames.map((name) => ({ name, category: item.category }));
  });
}

/**
 * 인식·수정된 항목들의 상호작용을 분석한다.
 * API_BASE_URL이 비어 있으면 목업 결과를 반환한다(백엔드 연동 전 테스트용).
 */
export async function analyzeInteractions(items: RecognizedItem[]): Promise<AnalysisResult> {
  const settings = await getSettings();
  const lang = settings.language;
  devLog(
    '[상호작용] ▶ 서버로 보냄:',
    BACKEND_API_BASE_URL ? `POST ${BACKEND_API_BASE_URL}/api/v1/interactions/analyze` : '(목업 모드)',
  );
  devLog(
    '[상호작용] ▶ 보낼 항목:',
    buildAnalyzeItems(items).map((it) => `${it.name} (${it.category})`),
  );

  // 백엔드 주소가 없으면 목업으로 동작 (약 5초 분석 흉내)
  if (!BACKEND_API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 4500));

    const allPairs: InteractionPair[] = [];
    let pid = 0;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i].name;
        const b = items[j].name;
        const known = KNOWN[pairKey(a, b)];
        pid += 1;
        allPairs.push({
          id: String(pid),
          items: [a, b],
          level: known?.level ?? 'safe',
          description: known?.descriptions[lang] ?? translate(lang, 'riskSafeTitle'),
        });
      }
    }

    const pairs = allPairs.filter((pair) => pair.level !== 'safe');
    // 위험도 높은 순으로 정렬
    pairs.sort((x, y) => LEVEL_RANK[y.level] - LEVEL_RANK[x.level]);

    const overall = pairs.reduce<RiskLevel>(
      (worst, p) => (LEVEL_RANK[p.level] > LEVEL_RANK[worst] ? p.level : worst),
      'safe',
    );

    const summary =
      overall === 'danger'
        ? translate(lang, 'riskDangerTitle')
        : overall === 'caution'
          ? translate(lang, 'riskCautionTitle')
          : translate(lang, 'riskSafeTitle');

    const result = {
      overall,
      summary,
      pairs,
      checkedCount: allPairs.length,
      detectedCount: pairs.length,
      undetectedCount: allPairs.length - pairs.length,
      unmatchedSupplementCount: 0,
      unmatchedDrugCount: 0,
      unmatchedCombinationCount: 0,
    };
    devLog('[상호작용] ◀ 서버에서 받음 (목업):', result);
    return result;
  }

  // 실제 백엔드 연동
  const { data } = await axios.post<AnalysisResult>(
    `${BACKEND_API_BASE_URL}/api/v1/interactions/analyze`,
    { items: buildAnalyzeItems(items), lang },
    { timeout: 30000 },
  );
  devLog('[상호작용] ◀ 서버에서 받음:', data);
  return data;
}
