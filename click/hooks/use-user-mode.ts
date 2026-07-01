import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getSettings, type UserMode } from '@/services/settings-storage';

export function useUserMode() {
  const [mode, setMode] = useState<UserMode>('standard');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSettings().then((settings) => {
        if (active) setMode(settings.mode);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return { mode, lowVision: mode === 'lowVision' };
}
