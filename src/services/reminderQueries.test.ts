import { type QueryClient } from '@tanstack/react-query';

import {
  APP_DATA_REFETCH_INTERVAL_MS,
  dashboardQueryKey,
  pendingActionsQueryKey,
  refreshReminderAppData,
  reminderQueryKey,
} from './reminderQueries';

const uid = 'user-123';

if (APP_DATA_REFETCH_INTERVAL_MS !== 60000) {
  throw new Error(`Expected app data polling to be 60000ms, got ${APP_DATA_REFETCH_INTERVAL_MS}`);
}

const reminderKey = reminderQueryKey(uid);
if (reminderKey[0] !== 'lembretes' || reminderKey[1] !== uid) {
  throw new Error(`Expected reminder query key to include uid, got ${String(reminderKey)}`);
}

const dashboardKey = dashboardQueryKey(uid);
if (dashboardKey[0] !== 'dashboard' || dashboardKey[1] !== uid) {
  throw new Error(`Expected dashboard query key to include uid, got ${String(dashboardKey)}`);
}

const pendingKey = pendingActionsQueryKey(uid);
if (pendingKey[0] !== 'pendencias' || pendingKey[1] !== uid) {
  throw new Error(`Expected pending query key to include uid, got ${String(pendingKey)}`);
}

const invalidatedQueries: { queryKey?: readonly unknown[]; refetchType?: string }[] = [];
const queryClient = {
  invalidateQueries(filters: { queryKey?: readonly unknown[]; refetchType?: string }) {
    invalidatedQueries.push(filters);
    return Promise.resolve();
  },
} as unknown as QueryClient;

void refreshReminderAppData(queryClient, uid, { includePendingActions: true });

if (invalidatedQueries.length !== 3) {
  throw new Error(
    `Expected refreshReminderAppData to invalidate 3 queries, got ${invalidatedQueries.length}`
  );
}

const reminderRefresh = invalidatedQueries.find((query) => query.queryKey?.[0] === 'lembretes');
if (reminderRefresh?.refetchType !== 'all') {
  throw new Error('Expected reminder refresh to refetch all reminder queries');
}

if (!invalidatedQueries.some((query) => query.queryKey?.[0] === 'dashboard')) {
  throw new Error('Expected refreshReminderAppData to invalidate dashboard data');
}

if (!invalidatedQueries.some((query) => query.queryKey?.[0] === 'pendencias')) {
  throw new Error('Expected refreshReminderAppData to invalidate pending actions when requested');
}
