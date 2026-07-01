import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserMode = 'standard' | 'lowVision';

export interface AppSettings {
  mode: UserMode;
}

const STORAGE_KEY = 'click.settings.v1';

const DEFAULT_SETTINGS: AppSettings = {
  mode: 'standard',
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      mode: parsed.mode === 'lowVision' ? 'lowVision' : 'standard',
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
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
