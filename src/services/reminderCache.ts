import { type ReminderRepeatType } from '@/services/reminderEdit';

export type ReminderCacheItem = {
  id: number | string;
  message: string;
  type?: string;
  date?: string;
  time?: string;
  weekday?: number;
  interval_value?: number;
  interval_unit?: string;
  created_at: string;
};

export type ReminderCacheUpdate = {
  id: number | string;
  date?: string;
  message: string;
  repeatType: ReminderRepeatType;
  time: string;
  weekday?: number;
};

export type ReminderCacheDraft = Omit<ReminderCacheUpdate, 'id'>;

function idsMatch(left: number | string, right: number | string) {
  return String(left) === String(right);
}

function applyReminderFields(
  reminder: ReminderCacheItem,
  { date, message, repeatType, time, weekday }: ReminderCacheDraft
) {
  const next: ReminderCacheItem = {
    ...reminder,
    message: message.trim(),
    time,
    type: repeatType,
  };

  delete next.date;
  delete next.weekday;

  if (repeatType === 'once') {
    next.date = date;
  }

  if (repeatType === 'weekly') {
    next.weekday = weekday;
  }

  return next;
}

export function buildOptimisticReminder(
  draft: ReminderCacheDraft,
  createdAt = new Date()
): ReminderCacheItem {
  return applyReminderFields(
    {
      id: `optimistic-${createdAt.toISOString()}`,
      message: '',
      created_at: createdAt.toISOString(),
    },
    draft
  );
}

export function removeReminderFromCache(
  reminders: ReminderCacheItem[],
  id: number | string
): ReminderCacheItem[] {
  return reminders.filter((item) => !idsMatch(item.id, id));
}

export function addReminderToCache(
  reminders: ReminderCacheItem[],
  reminder: ReminderCacheItem
): ReminderCacheItem[] {
  return [...reminders, reminder];
}

export function replaceReminderInCache(
  reminders: ReminderCacheItem[],
  currentId: number | string,
  reminder: ReminderCacheItem
): ReminderCacheItem[] {
  let replaced = false;
  const nextReminders = reminders.map((item) => {
    if (!idsMatch(item.id, currentId)) return item;

    replaced = true;
    return reminder;
  });

  return replaced ? nextReminders : addReminderToCache(reminders, reminder);
}

export function updateReminderInCache(
  reminders: ReminderCacheItem[],
  update: ReminderCacheUpdate
): ReminderCacheItem[] {
  return reminders.map((item) =>
    idsMatch(item.id, update.id) ? applyReminderFields(item, update) : item
  );
}

export function restoreReminderCacheSnapshot<T extends ReminderCacheItem>(
  currentReminders: T[],
  previousReminders?: T[]
): T[] {
  return previousReminders ?? currentReminders.slice(0, 0);
}
