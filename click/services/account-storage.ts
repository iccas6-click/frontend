import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserMode = 'standard' | 'lowVision';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  nickname?: string;
  mode: UserMode;
  createdAt: string;
}

const STORAGE_KEY = 'click.account.v1';

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, '');
}

export function formatPhone(phone: string) {
  const digits = normalizePhone(phone);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (!parsed.id || !parsed.name || !parsed.phone || !parsed.createdAt) return null;
    return {
      id: parsed.id,
      name: parsed.name,
      phone: parsed.phone,
      nickname: parsed.nickname,
      mode: parsed.mode === 'lowVision' ? 'lowVision' : 'standard',
      createdAt: parsed.createdAt,
    };
  } catch (e) {
    console.warn('[account] 프로필 불러오기 실패:', e);
    return null;
  }
}

export async function saveProfile(input: { name: string; phone: string; nickname?: string; mode?: UserMode }): Promise<UserProfile> {
  const existing = await getProfile();
  const profile: UserProfile = {
    id: existing?.id ?? String(Date.now()),
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    nickname: input.nickname?.trim() || undefined,
    mode: input.mode ?? existing?.mode ?? 'standard',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export async function deleteProfile(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function getDisplayName(profile: UserProfile | null) {
  if (!profile) return '사용자';
  return profile.nickname || profile.name;
}

export function getInitial(profile: UserProfile | null) {
  const displayName = getDisplayName(profile).trim();
  return displayName.slice(0, 1).toUpperCase() || 'C';
}
