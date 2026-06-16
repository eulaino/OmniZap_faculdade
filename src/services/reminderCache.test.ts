import {
  addReminderToCache,
  buildOptimisticReminder,
  removeReminderFromCache,
  restoreReminderCacheSnapshot,
  updateReminderInCache,
  type ReminderCacheItem,
} from './reminderCache';

const reminders: ReminderCacheItem[] = [
  {
    id: 42,
    message: 'beber agua',
    type: 'once',
    date: '2026-06-16',
    time: '08:00',
    created_at: '2026-06-16T10:00:00.000Z',
  },
];

const removed = removeReminderFromCache(reminders, '42');
if (removed.length !== 0) {
  throw new Error('Expected removeReminderFromCache to match numeric ids by string value');
}

const updated = updateReminderInCache(reminders, {
  id: '42',
  date: undefined,
  message: 'tomar cafe',
  repeatType: 'daily',
  time: '09:00',
});

if (updated[0].message !== 'tomar cafe' || updated[0].type !== 'daily') {
  throw new Error('Expected updateReminderInCache to update message and repeat type');
}

if ('date' in updated[0]) {
  throw new Error('Expected daily update to remove one-time date');
}

const optimistic = buildOptimisticReminder(
  {
    date: '2026-06-20',
    message: '  estudar  ',
    repeatType: 'once',
    time: '19:30',
    weekday: 0,
  },
  new Date('2026-06-16T12:00:00.000Z')
);

if (optimistic.id !== 'optimistic-2026-06-16T12:00:00.000Z') {
  throw new Error(`Expected deterministic optimistic id, got ${optimistic.id}`);
}

if (optimistic.message !== 'estudar' || optimistic.date !== '2026-06-20') {
  throw new Error('Expected optimistic reminder to normalize message and keep date');
}

const added = addReminderToCache(reminders, optimistic);
if (added.length !== 2 || added[1] !== optimistic) {
  throw new Error('Expected addReminderToCache to append optimistic reminders');
}

const snapshot = reminders.slice();
const changed = removeReminderFromCache(reminders, 42);
const restored = restoreReminderCacheSnapshot(changed, snapshot);

if (restored !== snapshot || restored.length !== 1 || restored[0].id !== 42) {
  throw new Error('Expected restoreReminderCacheSnapshot to restore previous cache snapshot');
}

const restoredWithoutSnapshot = restoreReminderCacheSnapshot([optimistic], undefined);
if (restoredWithoutSnapshot.length !== 0) {
  throw new Error('Expected restoreReminderCacheSnapshot to clear optimistic data without snapshot');
}
