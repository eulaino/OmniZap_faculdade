import {
  APP_DATA_REFETCH_INTERVAL_MS,
  dashboardQueryKey,
  pendingActionsQueryKey,
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
