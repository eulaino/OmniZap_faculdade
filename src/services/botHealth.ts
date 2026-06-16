export const HEALTH_TIMEOUT_MS = 5000;
export const HEALTH_REFETCH_INTERVAL_MS = 10000;

export type BotHealthState = 'online' | 'offline';

type BotHealthStateInput = {
  statusCode?: number;
  elapsedMs: number;
  error?: unknown;
};

export function getBotHealthState({
  statusCode,
  elapsedMs,
  error,
}: BotHealthStateInput): BotHealthState {
  if (error) return 'offline';
  if (elapsedMs > HEALTH_TIMEOUT_MS) return 'offline';
  if (!statusCode) return 'offline';

  return statusCode >= 200 && statusCode < 300 ? 'online' : 'offline';
}
