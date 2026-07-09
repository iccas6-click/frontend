import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserMode = 'standard' | 'lowVision';
export type PillRecognizer = 'codeit' | 'retrieval';
export type AppLanguage = 'ko' | 'en' | 'fr';

export interface AppSettings {
  mode: UserMode;
  pillRecognizer: PillRecognizer;
  language: AppLanguage;
}

const STORAGE_KEY = 'click.settings.v1';

const DEFAULT_SETTINGS: AppSettings = {
  mode: 'standard',
  pillRecognizer: 'codeit',
  language: 'ko',
};

function normalizeLanguage(value: unknown): AppLanguage {
  return value === 'en' || value === 'fr' ? value : 'ko';
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      mode: parsed.mode === 'lowVision' ? 'lowVision' : 'standard',
      pillRecognizer: parsed.pillRecognizer === 'retrieval' ? 'retrieval' : 'codeit',
      language: normalizeLanguage(parsed.language),
    };
  } catch (e) {
    console.warn('[settings] 불러오기 실패:', e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(input: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next: AppSettings = {
    ...current,
    ...input,
    mode: input.mode === 'lowVision' ? 'lowVision' : 'standard',
    pillRecognizer: input.pillRecognizer === 'retrieval' ? 'retrieval' : input.pillRecognizer === 'codeit' ? 'codeit' : current.pillRecognizer,
    language: normalizeLanguage(input.language ?? current.language),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
