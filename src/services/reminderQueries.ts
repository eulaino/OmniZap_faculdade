import { type QueryClient } from '@tanstack/react-query';

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

type RefreshReminderAppDataOptions = {
  includeDashboard?: boolean;
  includePendingActions?: boolean;
  includeReminders?: boolean;
};

export async function refreshReminderAppData(
  queryClient: QueryClient,
  uid?: string | null,
  {
    includeDashboard = true,
    includePendingActions = false,
    includeReminders = true,
  }: RefreshReminderAppDataOptions = {}
) {
  const refreshes: Promise<unknown>[] = [];

  if (includeReminders) {
    refreshes.push(
      queryClient.invalidateQueries({
        queryKey: reminderQueryKey(uid),
        refetchType: 'all',
      })
    );
  }

  if (includeDashboard) {
    refreshes.push(queryClient.invalidateQueries({ queryKey: dashboardQueryKey(uid) }));
  }

  if (includePendingActions) {
    refreshes.push(queryClient.invalidateQueries({ queryKey: pendingActionsQueryKey(uid) }));
  }

  await Promise.all(refreshes);
}
