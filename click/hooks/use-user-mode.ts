import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getProfile, type UserMode } from '@/services/account-storage';

export function useUserMode() {
  const [mode, setMode] = useState<UserMode>('standard');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProfile().then((profile) => {
        if (active) setMode(profile?.mode ?? 'standard');
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return { mode, lowVision: mode === 'lowVision' };
}
