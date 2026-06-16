export const APP_DATA_REFETCH_INTERVAL_MS = 60000;

export function reminderQueryKey(uid?: string | null) {
  return ['lembretes', uid] as const;
}

export function dashboardQueryKey(uid?: string | null) {
  return ['dashboard', uid] as const;
}

export function pendingActionsQueryKey(uid?: string | null) {
  return ['pendencias', uid] as const;
}
