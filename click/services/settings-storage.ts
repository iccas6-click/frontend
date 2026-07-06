import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserMode = 'standard' | 'lowVision';
export type PillRecognizer = 'codeit' | 'retrieval';

export interface AppSettings {
  mode: UserMode;
  pillRecognizer: PillRecognizer;
}

const STORAGE_KEY = 'click.settings.v1';

const DEFAULT_SETTINGS: AppSettings = {
  mode: 'standard',
  pillRecognizer: 'codeit',
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      mode: parsed.mode === 'lowVision' ? 'lowVision' : 'standard',
      pillRecognizer: parsed.pillRecognizer === 'retrieval' ? 'retrieval' : 'codeit',
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
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
