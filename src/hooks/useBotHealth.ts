import { useQuery } from '@tanstack/react-query';

import { api } from '@/services/api';
import {
  HEALTH_REFETCH_INTERVAL_MS,
  HEALTH_TIMEOUT_MS,
  getBotHealthState,
  type BotHealthState,
} from '@/services/botHealth';

export type BotHealthResult = {
  state: BotHealthState;
  checkedAt: string;
  elapsedMs: number;
};

async function checkBotHealth(): Promise<BotHealthResult> {
  const startedAt = Date.now();

  try {
    const response = await api.get('/health', {
      timeout: HEALTH_TIMEOUT_MS,
    });
    const elapsedMs = Date.now() - startedAt;

    return {
      state: getBotHealthState({
        statusCode: response.status,
        elapsedMs,
      }),
      checkedAt: new Date().toISOString(),
      elapsedMs,
    };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;

    return {
      state: getBotHealthState({
        elapsedMs,
        error,
      }),
      checkedAt: new Date().toISOString(),
      elapsedMs,
    };
  }
}

export function useBotHealth() {
  return useQuery({
    queryKey: ['bot-health'],
    queryFn: checkBotHealth,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchInterval: HEALTH_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
